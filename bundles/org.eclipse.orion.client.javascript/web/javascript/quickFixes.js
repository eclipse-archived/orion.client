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
	
	/**
    * @description Finds the start of the line in the given text starting at the given offset
    * @param {String} text The text
    * @param {Number} offset The offset
    * @returns {Number} The offset in the text of the new line
    */
   function getLineStart(text, offset) {
       if(!text) {
           return 0;
       }
       if(offset < 0) {
           return 0;
       }
       var off = offset;
       var char = text[off];
       while(off > -1 && !/[\r\n]/.test(char)) {
           char = text[--off];
       }
       return off+1; //last char inspected will be @ -1 or the new line char
	}
		
	/**
    * @description Finds the end of the line in the given text starting at the given offset
    * @param {String} text The text
    * @param {Number} offset The offset
    * @returns {Number} The offset in the text before the new line or end of file
    */
   function getLineEnd(text, offset) {
       if(!text) {
           return 0;
       }
       if(offset < 0) {
           return 0;
       }
       var off = offset;
       var char = text[off];
       while(off < text.length && !/[\r\n]/.test(char)) {
           char = text[++off];
       }
       return off;
	}
		
	/**
	 * @description Computes the indent to use in the editor
	 * @param {String} text The editor text
	 * @param {Number} linestart The start of the line
	 * @param {Boolean} extraIndent If we should add an extra indent
	 * @returns {String} The ammount of indent / formatting for the start of the string
	 */
	function computeIndent(text, linestart, extraIndent) {
	    if(!text || linestart < 0) {
	        return '';
	    }
	    var off = linestart;
	    var char = text[off];
	    var preamble = extraIndent ? '\t' : ''; //$NON-NLS-1$
	    //walk the proceeding whitespace so we will insert formatted at the same level
	    while(char === ' ' || char === '\t') {
	       preamble += char;
	       char = text[++off];
	    }
	    return preamble;
	}

    /**
     * @description Computes the formatting for the trailing part of the fix
     * @param {String} text The editor text
     * @param {Object} annotation The annotation object
     * @param {String} indent Additional formatting to apply after the fix
     * @returns {String} The formatting to apply after the fix
     */
    function computePostfix(text, annotation, indent) {
        if(!text || !annotation) {
            return '';
        }
        var off = annotation.start;
        var char = text[off];
	    var val = '';
	    var newline = false;
	    //walk the trailing whitespace so we can see if we need axtra whitespace
	    while(off >= annotation.start && off <= annotation.end) {
		    if(char === '\n') {
		        newline = true;
		        break;
		    }
		    char = text[off++];
	    }
	    if(!newline) {
		    val += '\n'; //$NON-NLS-1$
	    }
	    if(typeof indent !== 'undefined') {
		    val += indent;
	    }
	    return val;
    }
    
    /**
     * @description Computes the offset for the block comment. i.e. 2 if the block starts with /*, 3 if it starts with /**
     * @param {String} text The file text
     * @param {Number} offset The doc node offset
     * @returns {Number} 2 or 3 depending on the start of the comment block
     */
    function getDocOffset(text, offset) {
        if(text.charAt(offset+1) === '*') {
            if(text.charAt(offset+2) === '*') {
                return 3;
            }
            return 2;
        }
        return 0;
    }
	
	function updateDirective(text, directive, name, usecommas) {
        if(usecommas) {
	        if(text.slice(directive.length).trim() !== '') {
	            return text.trim() + ', '+name; //$NON-NLS-1$
	        }
	        return text.trim() + ' '+name;  //$NON-NLS-1$
        }
	    return text.trim() + ' '+name;  //$NON-NLS-1$
    }
	
	function indexOf(list, item) {
	    if(list && list.length) {
            for(var i = 0; i < list.length; i++) {
                var p = list[i];
                if(item.range[0] === p.range[0] && item.range[1] === p.range[1]) {
                    return i;
                }
            }
        }
        return -1;
	}
	
	/**
	 * @description Remove the item from the list and return it as a change object
	 * @param {Array.<Object>} list The list of items to remove from
	 * @param {Number} index The index to remove
	 * @returns {Object} A change object containg the properties text, start and end
	 * @since 12.0  
	 */
    function removeIndexedItemChange(list, index) {
        if(index < 0 || index > list.length) {
	            return;
        }
        var node = list[index];
        if(list.length === 1) {
            return { "start" : node.range[0], "end" : node.range[1], "text" : "" };
        } else if(index === list.length-1) {
            return { "start" : list[index-1].range[1], "end" : node.range[1], "text" : ""};
        } else if(node) {
            return { "start" : node.range[0], "end" : list[index+1].range[0], "text" : ""};
        }
        return null;
    }
    
    function updateDoc(node, source, name) {
        if(node.leadingComments && node.leadingComments.length > 0) {
            for(var i = node.leadingComments.length-1; i > -1; i--) {
                var comment = node.leadingComments[i];
                var edit = new RegExp("(\\s*[*]+\\s*(?:@param)\\s*(?:\\{.*\\})?\\s*(?:"+name+")+.*)").exec(comment.value); //$NON-NLS-1$ //$NON-NLS-2$
                if(edit) {
                    var start = comment.range[0] + edit.index + getDocOffset(source, comment.range[0]);
                    return {"start" : start, "end" :start+edit[1].length, "text" : ''};
                }
            }
        }
        return null;
    }

	function hasDocTag(tags, node) {
		// tags contains all tags that have to be checked
	    if(node.leadingComments) {
	        for(var i = 0; i < node.leadingComments.length; i++) {
	            var comment = node.leadingComments[i];
	            for (var j = 0, len = tags.length; j < len; j++) {
	            		var tag = tags[j];
		            	if(comment.value.indexOf(tag) > -1) {
		                return true;
		            }
		        }
	        }
	    }
	    return false;
	}
	
	function getDirectiveInsertionPoint(node) {
	    if(node.type === 'Program' && node.body && node.body.length > 0) {
            var n = node.body[0];
            var val = -1;
            switch(n.type) {
                case 'FunctionDeclaration': {
                    val = getCommentStart(n);
                    if(val > -1) {
                        return val;
                    }
                    //TODO see https://github.com/jquery/esprima/issues/1071
                    val = getCommentStart(n.id);
                    if(val > -1) {
                        return val;
                    }
                    break;
                }
                case 'ExpressionStatement': {
                    if(n.expression && n.expression.right && n.expression.right.type === 'FunctionExpression') {
                        val = getCommentStart(n);
                        if(val > -1) {
                            return val;
                        }
                        //TODO see https://github.com/jquery/esprima/issues/1071
                        val = getCommentStart(n.expression.left);
                        if(val > -1) {
                            return val;
                        }
                    }   
                }
            }
	    }
	    return node.range[0];
	}
	
	/**
	 * @description Returns the offset to use when inserting a comment directive
	 * @param {Object} node The node to check for comments
	 * @returns {Number} The offset to insert the comment
	 * @sicne 9.0
	 */
	function getCommentStart(node) {
	    if(node.leadingComments && node.leadingComments.length > 0) {
            var comment = node.leadingComments[node.leadingComments.length-1];
            if(/(?:@param|@return|@returns|@type|@constructor|@name|@description)/ig.test(comment.value)) {
                //if the immediate comment has any of the tags we use for inferencing, add the directive before it instead of after
                return comment.range[0];
            }
        }
        return -1;
	}
	
	var controlStatements = ['IfStatement', 'WhileStatement', 'ForStatement', 'ForInStatement', 'WithStatement', 'DoWhileStatement', 'ForOfStatement']; //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$ //$NON-NLS-4$ //$NON-NLS-5$ //$NON-NLS-6$ //$NON-NLS-7$
	
	/**
	 * @description Walks the parents array and checks to see if there is a control statement as a direct parent
	 * @param {Object} node The AST node to check
	 * @returns {Object} The AST node that is a direct control statement parent of the given node, or null
	 * @since 11.0
	 */
	function getControlStatementParent(node) {
		if(node && node.parents) {
			var i = node.parents.length-1,
				p = node.parents[i];
			while(p && i > -1) {
				if(controlStatements.indexOf(p.type) > -1) {
					return p;
				}
				p = node.parents[--i];
			}
		}
		else {
			return null;
		}
	}
	
	/**
	 * Takes a quickfix implementation that can be applied to all fixes in a file and applies it to either all annotations (if multiple annotations provided) or
	 * just to the single annotation.  Handles applying all edits in a single UNDO step as well as setting the caret to the single selected annotation afterward.
	 * @param editorContext context to apply text edits to
	 * @param annotation the selected annotation
	 * @param annotations Array of annotations to apply the fix to
	 * @param createTextChange {Function} function to create a text edit object (text, start, end) for a given annotation
	 */
	function applySingleFixToAll(editorContext, annotation, annotations, createTextChange){
		if (!annotations){
			annotations = [annotation];
		}
		var edits = [];
		var annotationIndex = 0;
		for (var i=0; i<annotations.length; i++) {
			var current = annotations[i];
			if (current.id === annotation.id){
				var currentChange = createTextChange(current);
				if (Array.isArray(currentChange)){
					if (current.start === annotation.start && current.end === annotation.end){
						annotationIndex = i;
					}
					for (var j=0; j<currentChange.length; j++) {
						var theChange = currentChange[j];
						edits.push({text: theChange.text, range: {start: theChange.start, end: theChange.end}});
					}
				} else if (typeof currentChange === 'object'){
					edits.push({text: currentChange.text, range: {start: currentChange.start, end: currentChange.end}});
					if (current.start === annotation.start && current.end === annotation.end){
						annotationIndex = i;
					}
				} 
			}
		}
		// To use setText() with multiple selections they must be in range order
		edits = edits.sort(function(a, b){
			return a.range.start - b.range.start;
		});
		var textEdits = [];
		var rangeEdits = [];
		for (i=0; i<edits.length; i++) {
			textEdits.push(edits[i].text);
			rangeEdits.push(edits[i].range);
		}
    	return editorContext.setText({text: textEdits, selection: rangeEdits}).then(function(){
    		return editorContext.getSelections().then(function(selections){
    			if (selections.length > 0){
    				var selection = selections[selections.length > annotationIndex ? annotationIndex : 0];
    				return editorContext.setSelection(selection.start, selection.end, true);	
				}
    		});
    	});
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
						    		editorContext.getSelections().then(function(selections){
						    			if (selections.length > 0){
						    				var selection = selections[selections.length > idx ? idx : 0];
						    				editorContext.setSelection(selection.start, selection.end, true);	
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
	                    var model = new TextModel.TextModel(ast.source.slice(context.annotation.start, context.annotation.end));
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
	        /** 
	         * alternate id for the no-unsed-params linting fix 
	         * @callback
	         */
	        "no-unused-params-expr": function(editorContext, context, astManager) {
	        	function updateCallback(node, ast, comments) {
	                if(Array.isArray(comments)) {
	                    //attach it to the last one
	                    var comment = comments[comments.length-1];
	                    if(comment.type === 'Block') {
	                        var valueend = comment.range[0]+comment.value.length+getDocOffset(ast.source, comment.range[0]);
	                        var start = getLineStart(ast.source, valueend);
	                        var indent = computeIndent(ast.source, start);
	                        var fix = "* @callback\n"+indent; //$NON-NLS-1$
	                        /*if(comment.value.charAt(valueend) !== '\n') {
	                            fix = '\n' + fix;
	                        }*/
	                        return editorContext.setText(fix, valueend-1, valueend-1);
	                    }
	                }
	                start = getLineStart(ast.source, node.range[0]);
	                indent = computeIndent(ast.source, start);
	                return editorContext.setText("/**\n"+indent+" * @callback\n"+indent+" */\n"+indent, node.range[0], node.range[0]); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
	        	}
	            return astManager.getAST(editorContext).then(function(ast) {
	                var node = Finder.findNode(context.annotation.start, ast, {parents:true});
	                if(node && node.parents && node.parents.length > 0) {
	                    var func = node.parents.pop();
	                    var p = node.parents.pop();
	                    var promise;
	                    switch(p.type) {
	                    	case 'Property': {
	                    		if(!hasDocTag(['@callback', '@public'], p) && !hasDocTag(['@callback', '@public'], p.key)) { //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$ //$NON-NLS-4$
	                    			promise = updateCallback(p, ast, p.leadingComments ? p.leadingComments : p.key.leadingComments);
	                			}
	                    		break;
	                    	}
	                    	case 'AssignmentExpression': {
	                    		var left = p.left;
	                    		if(left.type === 'MemberExpression' && !hasDocTag(['@callback', '@public'], left)) { //$NON-NLS-1$ //$NON-NLS-2$
					        		promise = updateCallback(left, ast, left.leadingComments);
					        	} else if(left.type === 'Identifier' && !hasDocTag(['@callback', '@public'], left)) { //$NON-NLS-1$ //$NON-NLS-2$
					        		promise = updateCallback(p.left, ast, left.leadingComments);	        		
					        	}
	                			break;
	                    	}
	                    	case 'VariableDeclarator': {
	                    		var oldp = p;
	                			p = node.parents.pop();
	                			if(p.declarations[0].range[0] === oldp.range[0] && p.declarations[0].range[1] === oldp.range[1]) {
	                				//insert at the var keyword level to not mess up the code
	                				promise = updateCallback(p, ast, oldp.id.leadingComments);
	                			} else if(!hasDocTag(['@callback', '@public'], oldp.id)) { //$NON-NLS-1$ //$NON-NLS-2$
	                    			promise = updateCallback(oldp, ast, oldp.id.leadingComments);
	                			} 
	                			
	                    		break;
	                    	}
	                    }
	                    if(!promise && !hasDocTag(['@callback', '@public'], func)) { //$NON-NLS-1$ //$NON-NLS-2$
	                        return editorContext.setText("/* @callback */ ", func.range[0], func.range[0]); //$NON-NLS-1$
	                    }
	                }
	                return promise;
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
									editorContext.syntaxCheck(ast.sourceFile, null, ast.source);
								});
							});
						}
						return fileClient.write(ternFileLocation, contents).then(/* @callback */ function(result) {
							self.ternProjectManager.refresh(ternFileLocation);
							// now we need to run the syntax checker on the current file to get rid of stale annotations
							editorContext.syntaxCheck(ast.sourceFile, null, ast.source);
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
