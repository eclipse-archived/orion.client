/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
 /*eslint-env amd, browser*/
define([
'orion/objects',
'javascript/finder',
'orion/Deferred',
'i18n!javascript/nls/messages'
], function(Objects, Finder, Deferred, Messages) {

	/**
	 * @description Creates a new rename command
	 * @constructor
	 * @public
	 * @param {TernWorker} ternWorker The running Tern worker
	 * @returns {javascript.commands.RenameCommand} A new command
	 * @since 10.0
	 */
	function RefsCommand(ternWorker, astManager, scriptResolver, cuProvider, searchClient) {
		this.ternworker = ternWorker;
		this.scriptresolver = scriptResolver;
		this.astmanager = astManager;
		this.cuprovider = cuProvider;
		this.searchclient = searchClient;
		this.cache = Object.create(null);
	}

	Objects.mixin(RefsCommand.prototype, {
		/**
		 * @callback
		 */
		execute: function(editorContext, options) {
			var that = this;
			var deferred = new Deferred();
			editorContext.getFileMetadata().then(function(metadata) {
				if(options.kind === 'project' && Array.isArray(metadata.parents) && metadata.parents.length > 0) {
					that.scriptresolver.setSearchLocation(metadata.parents[metadata.parents.length - 1].Location);
				} else {
					that.scriptresolver.setSearchLocation(null);
				}
			    if(options.contentType.id === 'application/javascript') {
	    			that._findRefs(editorContext, options, metadata, deferred);
			    } else {
			        return editorContext.getText().then(function(text) {
			            var offset = options.offset;
			        	var cu = that.cuprovider.getCompilationUnit(function(){
		            		return Finder.findScriptBlocks(text);
		            	}, {location:options.input, contentType:options.contentType});
    			        if(cu.validOffset(offset)) {
    			        	that._findRefs(editorContext, options, metadata, deferred);
    			        }
			        }, /* @callback */ function(err) {
			        	deferred.resolve('Could not compute references: failed to compute file text content');
			        });
			    }
			}, /* @callback */ function(err) {
				deferred.resolve('Could not compute references: failed to compute file metadata');
			});
			return deferred;
		},
		
		/**
		 * @description Performs the actual searching and type matching
		 * @function
		 * @private 
		 * @param {Object} editorContext The editor context
		 * @param {Object} options The map of options
		 * @param {Object} metadata The map of origin file metadata
		 * @param {orion.Deferred} deferred The backing Deffered to report back to
		 */
		_findRefs: function _findRefs(editorContext, options, metadata, deferred) {
			var that = this;
			return that.astmanager.getAST(editorContext).then(function(ast) {
				var node = Finder.findNode(options.offset, ast);
				if(node && node.type === 'Identifier') {
					that.ternworker.postMessage(
						{request: 'type', args: {meta: metadata, params: options}},  //$NON-NLS-1$
						function(type, err) {
							if(err) {
								deferred.resolve(err);
							} else {
								var expected = Object.create(null);
								expected.total = 0;
								expected.done = 0;
								expected.result = [];
								var searchParams = {keyword: node.name, resource: that.scriptresolver.getSearchLocation(), fileNamePatterns:["*.js"], caseSensitive: true }; //$NON-NLS-1$
								expected.params = searchParams;
								expected.deferred = deferred;
								that.searchclient.search(searchParams, true, true).then(function(searchResult) {
									expected.result = searchResult;
									for (var h = 0, l1 = searchResult.length; h < l1; h++) {
										var file = searchResult[h];
										for(var i = 0, l2 = file.children.length; i < l2; i++) {
											var line = file.children[i];
											expected.total += line.matches.length;
											for(var j = 0, l3 = line.matches.length; j < l3; j++) {
												var match = line.matches[j];
												var v = Finder.findWord(line.name, match.startIndex);
												if(v === node.name) {
													if(match.start === node.range[0] && match.end === node.range[1]) {
														match.confidence = 100;
														expected.done++;
													} else {
														that._checkType(type, file.metadata, match, expected);
													}
												} else {
													match.confidence = -1;
													expected.done++;
												}
											}
										}
									}
									that._checkDone(expected);
								}, /* @callback */ function(err) {
									editorContext.setStatus({Severity: 'Error', Message: 'Cannot compute references: '+err.message}); //$NON-NLS-1$
									deferred.resolve([]);
								}, /* @callback */ function(result) {
									//TODO progress
								});
						  }
					});
				} else {
					editorContext.setStatus({Severity: 'Error', Message: 'Cannot compute references at the selected location: Location is not an identifier'}); //$NON-NLS-1$
					deferred.resolve([]);
				}
			});
		},
		
		/**
		 * @description Compares one type object to the other. Types are considered the same if they
		 * come from the same origin, have the same location infos, the same inferred base type and the same prototype infos
		 * @function
		 * @private
		 */
		_checkType: function _checkType(original, file, match, expected) {
			var that = this;
			that.ternworker.postMessage(
					{request: 'type', args: {meta:{location: file.Location}, params: {offset: match.end}}},  //$NON-NLS-1$
					function(type, err) { //$NON-NLS-1$
						//TODO not until incremental support is added 
						//deferred.progress({searchParams: searchParams, refResult: match});
						if(type && type.type) {
							//TODO
							var _t = type.type;
							var _ot = original.type;
							if(_t.name === _ot.name && _t.type === _ot.type && _t.origin === _ot.origin) {
								match.confidence = 100;
							} else {
								match.confidence = -1; //we got the type info for this and it did not match, weed it out
							}
							expected.done++;
						} else {
							that._staticCheck(original, file, match, expected);
						}
						that._checkDone(expected);
					});
		},
		
		/**
		 * @description Function to statically look at the search result by loading its AST and making some non-type inferred guesses.
		 * This function is used if Tern reports it has no idea what the type of a match is.
		 * @function
		 * @private
		 */
		_staticCheck: function _staticCheck(original, file, match, expected) {
			var that = this;
			that._getAST(file).then(function(ast) {
				var node = Finder.findNode(match.start, ast, {parents: true});
				if(node) {
					that._checkNode(original, node, match, expected);
				} else {
					match.confidence = -1;
				}
				expected.done++;
				that._checkDone(expected);
			});
		},
		
		_checkNode: function _checkNode(original, node, match, expected) {
			switch(node.type) {
				case 'FunctionDeclaration':
				case 'FucntionExpression':
				case 'VariableDeclarator': 
				case 'Literal': {
					//a re-decl cannot be a reference
					match.confidence = -1;
					break;
				}
				case 'Identifier': {
					if(Array.isArray(node.parents)) {
						var p = node.parents.slice(node.parents.length-1)[0];
						this._checkNode(original, p, match, expected);
					} else {
						match.confidence = 25;
					}
					break;
				}
				case 'AssignmentExpression': {
					if(node.left.name === original.type.exprName ||
						node.right.name === original.type.exprName) {
						match.confidence = 25;
					}
					break;
				}
				case 'MemberExpression': {
					//if part of the expression, maybe relevant
					match.confidence = 10;
					break;
				}
				case 'CallExpression': {
					if(node.callee.name === original.type.exprName) {
						if(original.type.type === 'fn()') {
							match.confidence = 25;
						} else {
							match.confidence = -1;
						}
					}
					for(var i = 0, l = node.arguments.length; i < l; i++) {
						var arg = node.arguments[i];
						if(arg.type === 'Identifier') {
							if(original.type.type === 'fn()') {
								//orig type is function, this is not relevant
								match.confidence = -1;
							} else {
								//with no type infos we have no idea if this is the same one
								match.confidence = 40;
							}
						} else if(arg.type === 'FunctionExpression') {
							if(arg.id === original.type.exprName) {
								//redecl, not relevant
								match.confidence = -1;
							}
						}
					}
					break;
				}
				default: {
					match.confidence = 0;
				}
			}
		},
		
		/**
		 * @description Returns the AST for the given file match. We do caching before the AST manager to avoid having to 
		 * read the complete file contents each time
		 * @function
		 * @private
		 * @param {Object} file The file match metadata from the search results
		 * @returns {Deferred} The deferred to resolve to get the AST
		 */
		_getAST: function _getAST(file) {
			var that = this;
			var ast = that.cache[file.Location];
			if(ast) {
				return new Deferred().resolve(ast);
			} else {
				return that.searchclient._fileClient.read(file.Location).then(function(contents) {
					var proxy = {
						getFileMetadata: function() {
							return new Deferred().resolve(file);
						},
						getText: function() {
							return new Deferred().resolve(contents);
						}
					};
					return that.astmanager.getAST(proxy).then(function(ast) {
						that.cache[file.Location] = ast;
						return new Deferred().resolve(ast);
					});
				});
			}
		},
		
		/**
		 * @description Checks if all the confidence checking is done and resolves the backing deferred if so
		 * @function
		 * @private
		 * @param {Object} expected The context of confidence computation
		 */
		_checkDone: function _checkDone(expected) {
			if(expected.done === expected.total) {
				this.cache = Object.create(null);
				expected.deferred.resolve({searchParams: expected.params, refResult: expected.result});
			}
		}
	});

	return RefsCommand;
});
