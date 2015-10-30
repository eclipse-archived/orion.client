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
		varDecls: {
			name: Messages['varDecls'],
			category: 'vardecls', //$NON-NLS-1$
			sort: 5
		},
		varAccess: {
			name: Messages['varAccess'],
			category: 'varaccess', //$NON-NLS-1$
			sort: 6
		},
		varWrite: {
			name: Messages['varWrite'],
			category: 'varwrite', //$NON-NLS-1$
			sort: 7
		},
		regex: {
			name: Messages['regex'],
			category: 'regex', //$NON-NLS-1$
			sort: 8
		},
		strings: {
			name: Messages['strings'],
			category: 'strings', //$NON-NLS-1$
			sort: 9
		},
		blockComments: {
			name: Messages['blockComments'],
			category: 'blockcomments', //$NON-NLS-1$
			sort: 10
		},
		lineComments: {
			name: Messages['lineComments'],
			category: 'linecomments', //$NON-NLS-1$
			sort: 11
		},
		partial: {
			name: Messages['partial'],
			category: 'partial', //$NON-NLS-1$
			sort: 12
		},
		uncategorized: {
			name: Messages['uncategorized'],
			category: 'uncategorized', //$NON-NLS-1$
			sort: 13
		},
		syntax: {
			name: Messages['parseErrors'],
			category: 'parseerrors', //$NON-NLS-1$
			sort: 14
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
				var loc = null;
				if(options.kind === 'project' && Array.isArray(metadata.parents) && metadata.parents.length > 0) {
					loc = metadata.parents[metadata.parents.length - 1].Location;
					deferred.progress({message: Messages['allProjectRefs']});
				} else {
					deferred.progress({message: Messages['allWorkspaceRefs']});
				}
				that.scriptresolver.setSearchLocation(loc);
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
    			        } else {
    			        	deferred.resolve(Messages['notHtmlOffset']);
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
								editorContext.setStatus({Severity: 'Error', Message: err}); //$NON-NLS-1$
								deferred.resolve([]);
							} else {
								var expected = Object.create(null);
								expected.total = 0;
								expected.done = 0;
								expected.result = [];
								var searchParams = {keyword: node.name, 
									resource: that.scriptresolver.getSearchLocation(), 
									fileNamePatterns: ["*.js", "*.html", "*.htm"],  //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
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
													that._checkType(type, file.metadata, match, expected);
												} else {
													match.category = categories.partial.category;
													match.confidence = 0;
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
					{request: 'checkRef', args: {meta:{location: file.Location}, params: {offset: match.end}, origin: original}},  //$NON-NLS-1$
					/* @callback */ function(type, err) {
						if(type && type.type) {
							var _t = type.type, _ot = original.type;
							if(_t.name === _ot.name && _t.type === _ot.type && that._sameOrigin(_t.origin, _ot.origin)) {
								match.confidence = 100;
							} else if(_t.staticCheck) {
								match.confidence = _t.staticCheck.confidence;
							} else if(_t.category === 'blockcomments') {
								match.confidence = 0;
								//TODO propagate type infos to named elements in structured doc
								//for example @name mentions func decl match
							}
							else {
								match.confidence = 0;
							}
							match.category = _t.category;
							//TODO for demo anything with parsererrors category is -1
							if(_t.category === categories.syntax.category) {
								match.confidence = -1;
							}
						} else if(err) {
							match.category = categories.uncategorized.category;
							match.confidence = -1;
						}
						expected.done++;
						expected.deferred.progress({message: i18nUtil.formatMessage(Messages['refsFoundIn'], file.Name, expected.done, expected.total)});
						that._checkDone(expected);
					});
		},
		
		/**
		 * @description Compares the two origins to see if they are the same. This function will
		 * try decoding the URIs to compare for equality
		 * @function
		 * @private
		 * @param {String} o1 The first origin
		 * @param {String} o2 The second origin
		 * @returns {Boolean} If the origins are equal
		 */
		_sameOrigin: function _sameOrigin(o1, o2) {
			if(o1 === o2) {
				return true;
			}
			var u1 = decodeURIComponent(o1);
			var u2 = decodeURIComponent(o2);
			if(u1 === u2) {
				return true;
			}
			//last try, in case we have re-encoded URIs
			return decodeURIComponent(u1) === decodeURIComponent(u2);
		},
		
		/**
		 * @description Checks if all the confidence checking is done and resolves the backing deferred if so
		 * @function
		 * @private
		 * @param {Object} expected The context of confidence computation
		 */
		_checkDone: function _checkDone(expected) {
			if(expected.done >= expected.total) {
				expected.deferred.resolve({searchParams: expected.params, refResult: expected.result, categories: categories});
			}
		}
	});

	return RefsCommand;
});
