/*******************************************************************************
 * @license
 * Copyright (c) 2014, 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env amd*/
define([
'orion/objects',
'orion/Deferred',
'orion/editor/textModel',
'javascript/finder',
'javascript/compilationUnit',
'orion/metrics'
], function(Objects, Deferred, TextModel, Finder, CU, Metrics) {
/* eslint-disable missing-doc */
	/**
	 * @description Creates a new JavaScript quick fix computer
	 * @param {javascript.ASTManager} astManager The AST manager
	 * @param {javascript.RenammeCommand} renameCommand The rename command
	 * @param {javascript.GenerateDocCommand} generateDocCommand The doc generation command 
	 * @returns {javascript.JavaScriptQuickfixes} The new quick fix computer instance
	 * @since 8.0
	 */
	function JavaScriptQuickfixes(astManager, renameCommand, generateDocCommand, ternProjectManager, ternWorker) {
	   this.astManager = astManager;
	   this.renamecommand = renameCommand;
	   this.generatedoc = generateDocCommand;
	   this.ternProjectManager = ternProjectManager;
	   this.ternworker = ternWorker;
	}
	
	Objects.mixin(JavaScriptQuickfixes.prototype, /** @lends javascript.JavaScriptQuickfixes.prototype*/ {
		/**
		 * @description Editor command callback
		 * @function
		 * @param {orion.edit.EditorContext} editorContext The editor context
		 * @param {Object} context The context params
		 */
		execute: function(editorContext, context) {
		    var id = context.annotation.fixid ? context.annotation.fixid : context.annotation.id;
		    delete context.annotation.fixid;
		    Metrics.logEvent('language tools', 'quickfix', id, 'application/javascript'); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
		    var fixFunc = this.fixes[id];
		    var deferred = new Deferred();
		    return editorContext.getFileMetadata().then(function(meta) {
		    	if (fixFunc) {
	                if(meta.contentType.id === 'text/html') {
	                    return editorContext.getText().then(function(text) {
                           var blocks = Finder.findScriptBlocks(text);
                           if(blocks && blocks.length > 0) {
                               var cu = new CU(blocks, meta, editorContext);
                               return fixFunc.call(this, cu.getEditorContext(), context, this.astManager);
                           }
	                    }.bind(this));
	                }
					return fixFunc.call(this, editorContext, context, this.astManager);
	        	}
	        	var annotations = context.annotations;
	        	if(!Array.isArray(annotations)) {
	        		annotations = [context.annotation];
	        	}
	        	return editorContext.getText().then(function(text) {
		        	var files = [{type: 'full', name: meta.location, text: text}]; //$NON-NLS-1$
		        	var request = {request: 'fixes', args: {meta: {location: meta.location}, files: files, problemId: id, annotation: context.annotation, annotations: annotations}}; //$NON-NLS-1$
		        	this.ternworker.postMessage(	request, 
						function(fixes, err) {
							if(err) {
								deferred.reject();
							}
							if(Array.isArray(fixes.fixes) && fixes.fixes.length > 0) {
								var idx = 0;
								var textEdits = [];
								var rangeEdits = [];
								fixes.fixes.forEach(function(fix, i) {
									textEdits.push(fix.text);
									rangeEdits.push({start: fix.start, end: fix.end});
									if (fix.start === context.annotation.start && fix.end === context.annotation.end){
										idx = i;
									}
								});
						    	deferred.resolve(editorContext.setText({text: textEdits, selection: rangeEdits}).then(function() {
						    		return editorContext.getSelections().then(function(selections) {
						    			if (selections.length > 0){
						    				var selection = selections[selections.length > idx ? idx : 0];
						    				return editorContext.setSelection(selection.start, selection.end, true);	
										}
						    		});
						    	}));
							} else {
								deferred.reject();
							}
						});
					return deferred;
				}.bind(this));
	        }.bind(this));
		},
		fixes : {
			"no-dupe-keys": function(editorContext, context) {
				var start = context.annotation.start,
					groups = [{data: {}, positions: [{offset: start, length: context.annotation.end-start}]}],
					linkModel = {groups: groups};
				return editorContext.exitLinkedMode().then(function() {
					return editorContext.enterLinkedMode(linkModel);
				});
			},
			"no-duplicate-case": function(editorContext, context) {
				var start = context.annotation.start,
					groups = [{data: {}, positions: [{offset: start, length: context.annotation.end-start}]}],
					linkModel = {groups: groups};
				return editorContext.exitLinkedMode().then(function() {
					return editorContext.enterLinkedMode(linkModel);
				});
			},
			"missing-doc": function(editorContext, context) {
				context.offset = context.annotation.start;
				return this.generatedoc.execute.call(this.generatedoc, editorContext, context);
			},
			"no-shadow": function(editorContext, context) {
				return this.renamecommand.execute.call(this.renamecommand, editorContext, context);
			},
			"no-shadow-global": function(editorContext, context) {
				return this.renamecommand.execute.call(this.renamecommand, editorContext, context);
			},
			"no-shadow-global-param": function(editorContext, context) {
				return this.renamecommand.execute.call(this.renamecommand, editorContext, context);
			},
			"no-self-assign-rename": function(editorContext, context, astManager) {
				return astManager.getAST(editorContext).then(function(ast) {
					var node = Finder.findNode(context.annotation.end, ast);
					if(node && node.type === 'Identifier') {
						var start = node.range[0],
							groups = [{data: {}, positions: [{offset: start, length: node.range[1]-start}]}],
							linkModel = {groups: groups};
						return editorContext.exitLinkedMode().then(function() {
							return editorContext.enterLinkedMode(linkModel);
						});
					}
				});
			},
	        /** 
	         * fix for the no-sparse-arrays linting rule
	         * @callback
	         */
	        "no-sparse-arrays": function(editorContext, context, astManager) {
	            return astManager.getAST(editorContext).then(function(ast) {
	                var node = Finder.findNode(context.annotation.start, ast, {parents:true});
	                if(node && node.type === 'ArrayExpression') {
	                    var model = new TextModel.TextModel(ast.sourceFile.text.slice(context.annotation.start, context.annotation.end));
	                    var len = node.elements.length;
	                    var idx = len-1;
	                    var item = node.elements[idx];
	                    if(item === null) {
	                        var end = Finder.findToken(node.range[1], ast.tokens);
	                        if(end.value !== ']') {
	                            //for a follow-on token we want the previous - i.e. a token immediately following the ']' that has no space
	                            end = ast.tokens[end.index-1];
	                        }
	                        //wipe all trailing entries first using the ']' token start as the end
	                        for(; idx > -1; idx--) {
	                            item = node.elements[idx];
	                            if(item !== null) {
	                                break;
	                            }
	                        }
	                        if(item === null) {
	                            //whole array is sparse - wipe it
	                            return editorContext.setText('', context.annotation.start+1, context.annotation.end-1);
	                        }
	                        model.setText('', item.range[1]-context.annotation.start, end.range[0]-context.annotation.start);
	                    }
	                    var prev = item;
	                    for(; idx > -1; idx--) {
	                        item = node.elements[idx];
	                        if(item === null || item.range[0] === prev.range[0]) {
	                            continue;
	                        }
	                        model.setText(', ', item.range[1]-context.annotation.start, prev.range[0]-context.annotation.start); //$NON-NLS-1$
	                        prev = item;
	                    }
	                    if(item === null && prev !== null) {
	                        //need to wipe the front of the array
	                        model.setText('', node.range[0]+1-context.annotation.start, prev.range[0]-context.annotation.start);
	                    }
	                    return editorContext.setText(model.getText(), context.annotation.start, context.annotation.end);
	                }
	                return null;
	            });
	        },
		/** @callback fix the check-tern-project rule */
		"check-tern-project" :
			function(editorContext, context, astManager) {
				var self = this;
				return astManager.getAST(editorContext).then(function(ast) {
					var ternFileLocation = self.ternProjectManager.getTernProjectFileLocation();
					var ternProjectFile = self.ternProjectManager.getProjectFile();
					var json = self.ternProjectManager.getJSON();
					var currentFileName = context.input.substring(ternProjectFile.length);
					var noTernProjectFile = !ternFileLocation;
					if(noTernProjectFile) {
						ternFileLocation = ternProjectFile + ".tern-project"; //$NON-NLS-1$
					}
					if (!json) {
						json = {
								"plugins": {},
								"libs": ["ecma5"], //$NON-NLS-1$
								"ecmaVersion": 5,
								"loadEagerly": []
						};
					}
					var loadEagerly = json.loadEagerly;
					var updated = [];
					if (!loadEagerly) {
						loadEagerly = [];
					}
					var found = false;
					loadEagerly.forEach(function(element) {
						var currentElement = element.substring(ternProjectFile.length);
						if (currentFileName !== currentElement) {
							updated.push(currentElement);
						} else {
							found = true;
						}
					});
					if (!found) {
						// add the current file name
						updated.push(currentFileName);
						json.loadEagerly = updated;
						// now we should find a way to save the updated contents
						var contents = JSON.stringify(json, null, '\t'); //$NON-NLS-1$
						var fileClient = self.ternProjectManager.scriptResolver.getFileClient();
						if (noTernProjectFile) {
							return fileClient.createFile(ternProjectFile, ".tern-project").then(function(fileMetadata) { //$NON-NLS-1$
								return fileClient.write(fileMetadata.Location, contents).then(/* @callback */ function(result) {
									self.ternProjectManager.refresh(ternFileLocation);
									// now we need to run the syntax checker on the current file to get rid of stale annotations
									editorContext.syntaxCheck(ast.sourceFile, null, ast.sourceFile.text);
								});
							});
						}
						return fileClient.write(ternFileLocation, contents).then(/* @callback */ function(result) {
							self.ternProjectManager.refresh(ternFileLocation);
							// now we need to run the syntax checker on the current file to get rid of stale annotations
							editorContext.syntaxCheck(ast.sourceFile, null, ast.sourceFile.text);
						});
					}
				});
			}
		}
	});
	
	JavaScriptQuickfixes.prototype.contructor = JavaScriptQuickfixes;
	
	return {
		JavaScriptQuickfixes: JavaScriptQuickfixes
	};
});
