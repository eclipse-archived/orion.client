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
'i18n!javascript/nls/messages',
'orion/i18nUtil',
], function(Objects, Finder, Deferred, Messages, i18nUtil) {

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

	/**
	 * The listing of all categories, their NLS'd names and the order they should e sorted in
	 */
	var categories = {
		functionDecls: {
			name: Messages['functionDecls'],
			category: 'funcdecls', //$NON-NLS-1$
			sort: 1
		},
		functionCalls: {
			name: Messages['functionCalls'],
			category: 'funccalls', //$NON-NLS-1$
			sort: 2
		},
		propAccess: {
			name: Messages['propAccess'],
			category: 'propaccess', //$NON-NLS-1$
			sort: 3
		},
		propWrite: {
			name: Messages['propWrite'],
			category: 'propwrite', //$NON-NLS-1$
			sort: 4
		},
		varAccess: {
			name: Messages['varAccess'],
			category: 'varaccess', //$NON-NLS-1$
			sort: 5
		},
		varWrite: {
			name: Messages['varWrite'],
			category: 'varwrite', //$NON-NLS-1$
			sort: 6
		},
		regex: {
			name: Messages['regex'],
			category: 'regex', //$NON-NLS-1$
			sort: 7
		},
		strings: {
			name: Messages['strings'],
			category: 'string', //$NON-NLS-1$
			sort: 8
		},
		blockComments: {
			name: Messages['blockComments'],
			category: 'blockcomments', //$NON-NLS-1$
			sort: 9
		},
		lineComments: {
			name: Messages['lineComments'],
			category: 'linecomments', //$NON-NLS-1$
			sort: 10
		},
		partial: {
			name: Messages['partial'],
			category: 'partial', //$NON-NLS-1$
			sort: 11
		}
	};

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
			        	deferred.resolve(Messages['noFileContents']);
			        });
			    }
			}, /* @callback */ function(err) {
				deferred.resolve(Messages['noFileMeta']);
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
								var searchParams = {keyword: node.name, 
									resource: that.scriptresolver.getSearchLocation(), 
									fileNamePatterns: ["*.js"],  //$NON-NLS-1$
									caseSensitive: true, 
									incremental:false, 
									shape: 'group' //$NON-NLS-1$
								};
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
														type.type.node = node.parents.slice(node.parents.length-1)[0];
														that._categorizeMatch(type.type, match);
														match.confidence = 100;
														expected.done++;
													} else {
														that._checkType(type, file.metadata, match, expected);
													}
												} else {
													match.category = categories.partial.category;
													match.confidence = -100;
													expected.done++;
												}
											}
										}
									}
									that._checkDone(expected);
								}, /* @callback */ function(err) {
									editorContext.setStatus({Severity: 'Error', Message: i18nUtil.formatMessage(Messages['cannotComputeRefs'], err.message)}); //$NON-NLS-1$
									deferred.resolve([]);
								}, /* @callback */ function(result) {
									//TODO progress
								});
						  }
					});
				} else {
					editorContext.setStatus({Severity: 'Error', Message: Messages['notAnIdentifier']}); //$NON-NLS-1$
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
					{request: 'findType', args: {meta:{location: file.Location}, params: {offset: match.end, node:true}, origin: original}},  //$NON-NLS-1$
					/* @callback */ function(type, err) {
						if(type && type.type) {
							var _t = type.type;
							that._categorizeMatch(_t, match);
							var _ot = original.type;
							if(_t.name === _ot.name && _t.type === _ot.type && _t.origin === _ot.origin) {
								match.confidence = 100;
							} else if(type.staticCheck) {
								that._categorizeMatch(_t, match);
								match.confidence = type.staticCheck.confidence;
							} else {
								that._categorizeMatch(_t, match);
								match.confidence = -1;
							}
						} else if(err) {
							match.category = categories.partial.category;
							match.confidence = -1;
						}
						expected.done++;
						that._checkDone(expected);
					});
		},
		/**
		 * @description Tags the match with the category is belongs to
		 * @function
		 * @private
		 * @param {Object} type The type information from the Tern request (if any)
		 * @param {Object} match The original match object we asked about
		 */
		_categorizeMatch: function _categorizeMatch(type, match) {
			if(type && type.node) {
				var node = type.node;
				switch(node.type) {
					case 'FunctionDeclaration':
					case 'FunctionExpression': {
						match.category = categories.functionDecls.category;
						break;
					}
					case 'Property': {
						if(node.id && match.start < node.id.range[1]) {
							match.category = categories.propWrite.category;
						} else if(node.value && match.start < node.value.range[1]) {
							if(node.value.type === 'FunctionExpression') {
								match.category = categories.functionDecls.category;
							} else if(node.value.type === 'Identifier') {
								match.category = categories.varAccess.category;
							} else {
								match.category = categories.propWrite.category;
							}
						} else {
							match.category = categories.partial.category;
						}
						break;
					}
					case 'CallExpression': {
						match.category = categories.functionCalls.category;
						break;
					}
					case 'AssignmentExpression': {
						if(node.left && match.start < node.left.range[1]) {
							//on the left, write
							if(node.left.type === 'Identifier') {
								match.category = categories.varWrite.category;
							} else {
								match.category = categories.propWrite.category;
							}
						} else if(node.right && match.start < node.right.range[1]) {
							if(node.right.type === 'Identifier') {
								match.category = categories.varAccess.category;
							} else if(node.right.type === 'MemberExpression') {
								match.category = categories.propAccess.category;
							} else {
								match.category = categories.partial.category;
							}
						} else {
							match.category = categories.partial.category;
						}
						break;
					}
					case 'VariableDeclarator': {
						if(node.id && match.start < node.id.range[1]) {
							match.category = categories.varWrite.category;
						} else if(node.init && match.start < node.init.range[1]) {
							match.category = categories.varAccess.category;						
						} else {
							match.category = categories.partial.category;
						}
						break;
					}
					case 'Literal': {
						if(node.regex) {
							match.category = categories.regex.category;
						} else if(typeof(node.value) === "string") {
							match.category = categories.strings.category;
						}
						break;
					}
					case 'MemberExpression': {
						//TODO we need the first non=member expression parent from Tern to know how the expression is being used
						//LHS vs RHS expressions
						match.category = categories.propAccess.category;
						break;
					}
					case 'Block': {
						match.category = categories.blockComments.category;
						break;
					}
					case 'Line': {
						match.category = categories.lineComments.category;
						break;
					}
				}
			} else {
				match.category = categories.partial.category;
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
				expected.deferred.resolve({searchParams: expected.params, refResult: expected.result, categories: categories});
			}
		}
	});

	return RefsCommand;
});
