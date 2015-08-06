 /*******************************************************************************
 * @license
 * Copyright (c) 2014, 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env amd*/
/* global doctrine */
define([
'orion/objects',
'orion/Deferred',
'orion/editor/textModel',
'javascript/finder',
'javascript/compilationUnit',
'orion/metrics'
], function(Objects, Deferred, TextModel, Finder, CU, Metrics) {
	
	/**
	 * @description Creates a new JavaScript quick fix computer
	 * @param {javascript.ASTManager} astManager The AST manager
	 * @returns {javascript.JavaScriptQuickfixes} The new quick fix computer instance
	 * @since 8.0
	 */
	function JavaScriptQuickfixes(astManager) {
	   this.astManager = astManager;
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
	        } else {
	            return text.trim() + ' '+name;  //$NON-NLS-1$
	        }
        } else {
	       return text.trim() + ' '+name;  //$NON-NLS-1$
	    }
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
	
	function removeIndexedItem(list, index, editorContext) {
        if(index < 0 || index > list.length) {
            return;
        }
        var node = list[index];
        if(list.length === 1) {
            return editorContext.setText('', node.range[0], node.range[1]);
        } else if(index === list.length-1) {
            return editorContext.setText('', list[index-1].range[1], node.range[1]);
        } else {
            return editorContext.setText('', node.range[0], list[index+1].range[0]);
        }
        return null;
    }
    
    function updateDoc(node, source, editorContext, name) {
        if(node.leadingComments && node.leadingComments.length > 0) {
            for(var i = node.leadingComments.length-1; i > -1; i--) {
                var comment = node.leadingComments[i];
                var edit = new RegExp("(\\s*[*]+\\s*(?:@param)\\s*(?:\\{.*\\})?\\s*(?:"+name+")+.*)").exec(comment.value); //$NON-NLS-1$ //$NON-NLS-2$
                if(edit) {
                    var start = comment.range[0] + edit.index + getDocOffset(source, comment.range[0]);
                    return editorContext.setText('', start, start+edit[1].length);
                }
            }
        }
        return null;
    }
	
	function hasDocTag(tag, node) {
	    if(node.leadingComments) {
	        for(var i = 0; i < node.leadingComments.length; i++) {
	            var comment = node.leadingComments[i];
	            if(comment.value.indexOf(tag) > -1) {
	                return true;
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
                    } else {
                        //TODO see https://github.com/jquery/esprima/issues/1071
                        val = getCommentStart(n.id);
                        if(val > -1) {
                            return val;
                        }
                    }
                    break;
                }
                case 'ExpressionStatement': {
                    if(n.expression && n.expression.right && n.expression.right.type === 'FunctionExpression') {
                        val = getCommentStart(n);
                        if(val > -1) {
                            return val;
                        } else {
                            //TODO see https://github.com/jquery/esprima/issues/1071
                            val = getCommentStart(n.expression.left);
                            if(val > -1) {
                                return val;
                            }
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
		    var fixes = this[id];
	        if(fixes) {
	            var that = this;
	            return editorContext.getFileMetadata().then(function(meta) {
	                if(meta.contentType.id === 'text/html') {
	                    return editorContext.getText().then(function(text) {
                           var blocks = Finder.findScriptBlocks(text);
                           if(blocks && blocks.length > 0) {
                               var cu = new CU(blocks, meta, editorContext);
                               return fixes(cu.getEditorContext(), context.annotation, that.astManager);
                           }
	                    });
	                } else {
	                    return fixes(editorContext, context.annotation, that.astManager);
	                }
	            });
	        }
		    return null;
		},
		/** fix for eqeqeq linting rule */
		"eqeqeq": function(editorContext, annotation) {
		    var expected = /^.*\'(\!==|===)\'/.exec(annotation.title);
            return editorContext.setText(expected[1], annotation.start, annotation.end);
		},
		/** fix for the no-comma-dangle linting rule */
		"no-comma-dangle": function(editorContext, annotation) {
		    return editorContext.setText('', annotation.start, annotation.end);
		},
		/** fix for the no-empty-block linting rule */
		"no-empty-block": function(editorContext, annotation) {
            return editorContext.getText().then(function(text) {
                var linestart = getLineStart(text, annotation.start);
                var fix = '//TODO empty block'; //$NON-NLS-1$
                var indent = computeIndent(text, linestart, true);
                fix = '\n' + indent + fix; //$NON-NLS-1$
                fix += computePostfix(text, annotation);
                return editorContext.setText(fix, annotation.start+1, annotation.start+1);
            });
        },
		/** fix for the no-extra-semi linting rule */
		"no-extra-semi": function(editorContext, annotation) {
            return editorContext.setText('', annotation.start, annotation.end);
        },
        /** fix for the no-fallthrough linting rule */
        "no-fallthrough": function(editorContext, annotation) {
            return editorContext.getText().then(function(text) {
                var linestart = getLineStart(text, annotation.start);
                var fix = '//$FALLTHROUGH$'; //$NON-NLS-1$
                var indent = computeIndent(text, linestart);
                fix += computePostfix(text, annotation, indent);
                return editorContext.setText(fix, annotation.start, annotation.start);
            });
        },
        /** alternate fix for the no-fallthrough linting rule */
        "no-fallthrough-break": function(editorContext, annotation) {
            return editorContext.getText().then(function(text) {
                var linestart = getLineStart(text, annotation.start);
                var fix = 'break;'; //$NON-NLS-1$
                var indent = computeIndent(text, linestart);
                fix += computePostfix(text, annotation, indent);
                return editorContext.setText(fix, annotation.start, annotation.start);
            });
        },
        /** for for the no-reserved-keys linting rule */
       "no-reserved-keys": function(editorContext, annotation, astManager) {
       		return astManager.getAST(editorContext).then(function(ast) {
       			var node = Finder.findNode(annotation.start, ast, {parents:true});
                if(node && node.type === 'Identifier') {
                	return editorContext.setText('"'+node.name+'"', node.range[0], node.range[1]); //$NON-NLS-1$ //$NON-NLS-2$
				}
       		});
        },
        /** fix for the no-sparse-arrays linting rule */
        "no-sparse-arrays": function(editorContext, annotation, astManager) {
            return astManager.getAST(editorContext).then(function(ast) {
                var node = Finder.findNode(annotation.start, ast, {parents:true});
                if(node && node.type === 'ArrayExpression') {
                    var model = new TextModel.TextModel(ast.source.slice(annotation.start, annotation.end));
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
                            return editorContext.setText(model.getText(), annotation.start+1, annotation.end-1);
                        }
                        model.setText('', item.range[1]-annotation.start, end.range[0]-annotation.start);
                    }
                    var prev = item;
                    for(; idx > -1; idx--) {
                        item = node.elements[idx];
                        if(item === null || item.range[0] === prev.range[0]) {
                            continue;
                        }
                        model.setText(', ', item.range[1]-annotation.start, prev.range[0]-annotation.start); //$NON-NLS-1$
                        prev = item;
                    }
                    if(item === null && prev !== null) {
                        //need to wipe the front of the array
                        model.setText('', node.range[0]+1-annotation.start, prev.range[0]-annotation.start);
                    }
                    return editorContext.setText(model.getText(), annotation.start, annotation.end);
                }
                return null;
            });
        },
        /** fix for the no-throw-literal linting rule */
        "no-throw-literal": function(editorContext, annotation, astManager) {
            return astManager.getAST(editorContext).then(function(ast) {
                var node = Finder.findNode(annotation.start, ast, {parents:true});
                var source = node.raw || ast.source.slice(node.range[0], node.range[1]);
                return editorContext.setText('new Error(' + source + ')', annotation.start, annotation.end); //$NON-NLS-1$
            });
        },
        /** fix for the no-undef-defined linting rule */
        "no-undef-defined": function(editorContext, annotation, astManager) {
            function assignLike(node) {
                if(node && node.parents && node.parents.length > 0 && node.type === 'Identifier') {
                    var parent = node.parents.pop();
                    return parent && (parent.type === 'AssignmentExpression' || parent.type === 'UpdateExpression'); 
                }
                return false;
            }
            var name = /^'(.*)'/.exec(annotation.title);
            if(name != null && typeof name !== 'undefined') {
                return astManager.getAST(editorContext).then(function(ast) {
                    var comment = null;
                    var start = 0;
                    var insert = name[1];
                    var node = Finder.findNode(annotation.start, ast, {parents:true});
                    if(assignLike(node)) {
                        insert += ':true'; //$NON-NLS-1$
                    }
                    comment = Finder.findDirective(ast, 'globals'); //$NON-NLS-1$
                    if(comment) {
                        start = comment.range[0]+2;
                        return editorContext.setText(updateDirective(comment.value, 'globals', insert), start, start+comment.value.length); //$NON-NLS-1$
                    } else {
                        var point = getDirectiveInsertionPoint(ast);
                        return editorContext.setText('/*globals '+insert+' */\n', point, point); //$NON-NLS-1$ //$NON-NLS-2$
                    }
                });
            }
            return null;
        },
        /** alternate id for no-undef-defined linting fix */
        "no-undef-defined-inenv": function(editorContext, annotation, astManager) {
            var name = /^'(.*)'/.exec(annotation.title);
            if(name != null && typeof name !== 'undefined') {
                return astManager.getAST(editorContext).then(function(ast) {
                    var comment = null;
                    var start = 0;
                    if(name[1] === 'console') {
                        var env = 'node'; //$NON-NLS-1$
                    } else {
                        env = Finder.findESLintEnvForMember(name[1]);
                    }
                    if(env) {
                        comment = Finder.findDirective(ast, 'eslint-env'); //$NON-NLS-1$
                        if(comment) {
                            start = getDocOffset(ast.source, comment.range[0]) + comment.range[0];
    	                    return editorContext.setText(updateDirective(comment.value, 'eslint-env', env, true), start, start+comment.value.length); //$NON-NLS-1$
                        } else {
                            var point = getDirectiveInsertionPoint(ast);
                            return editorContext.setText('/*eslint-env '+env+' */\n', point, point); //$NON-NLS-1$ //$NON-NLS-2$
                        }
                    }
                });
            }
            return null;
        },
        /** fix for the no-unreachable linting rule */
		"no-unreachable": function(editorContext, annotation) {
            return editorContext.setText('', annotation.start, annotation.end);    
        },
        /** fix for the no-unused-params linting rule */
        "no-unused-params": function(editorContext, annotation, astManager) {
            return astManager.getAST(editorContext).then(function(ast) {
                var node = Finder.findNode(annotation.start, ast, {parents:true});
                if(node) {
                    var promises = [];
                    var parent = node.parents.pop();
                    var paramindex = -1;
                    for(var i = 0; i < parent.params.length; i++) {
                        var p = parent.params[i];
                        if(node.range[0] === p.range[0] && node.range[1] === p.range[1]) {
                            paramindex = i;
                            break;
                        }
                    }
                    var promise = removeIndexedItem(parent.params, paramindex, editorContext);
                    if(promise) {
                        promises.push(promise);
                    }
                    switch(parent.type) {
                        case 'FunctionExpression': {
                            var funcparent = node.parents.pop();
                            if(funcparent.type === 'CallExpression' && funcparent.callee.name === 'define') {
                                var args = funcparent.arguments;
                                for(i = 0; i < args.length; i++) {
                                    var arg = args[i];
                                    if(arg.type === 'ArrayExpression') {
                                        promise = removeIndexedItem(arg.elements, paramindex, editorContext);
                                        if(promise) {
                                            promises.push(promise);
                                        }
                                        break;
                                    }
                                }
                            } else if(funcparent.type === 'Property' && funcparent.leadingComments && funcparent.leadingComments.length > 0) {
                                promise = updateDoc(funcparent, ast.source, editorContext, parent.params[paramindex].name);
                                if(promise) {
                                    promises.push(promise);
                                }
                            }
                            break;
                        }
                        case 'FunctionDeclaration': {
                           promise = updateDoc(parent, ast.source, editorContext, parent.params[paramindex].name);
                           if(promise) {
                               promises.push(promise);
                           }
                           break;
                        }
                    }
                    return Deferred.all(promises);
                }
                return null;
            });
        },
        /** easter is here */
        "no-unused-vars-unused": function(editorContext, annotation, astManager) {
            return astManager.getAST(editorContext).then(function(ast) {
                var node = Finder.findNode(annotation.start, ast, {parents:true});
                if(node && node.parents && node.parents.length > 0) {
                    var declr = node.parents.pop();
                    if(declr.type === 'VariableDeclarator') {
                        var decl = node.parents.pop();
                        if(decl.type === 'VariableDeclaration') {
                            if(decl.declarations.length === 1) {
                                return editorContext.setText('', decl.range[0], decl.range[1]);
                            } else {
                                var idx = indexOf(decl.declarations, declr);
                                if(idx > -1) {
                                    return removeIndexedItem(decl.declarations, idx, editorContext);
                                }
                            }
                           /* var start = declr.range[1];
                            var lstart = getLineStart(ast.source, start);
                            var indent = computeIndent(ast.source, lstart);
                            var fix = '\n'+indent+'console.log("Variable '+node.name+' is unused: "+'+node.name+');';
                            return editorContext.setText(fix, start, start);
                            */
                        }
                    }
                }
                return null;
            });
        },
        "no-unused-vars-unused-funcdecl": function(editorContext, annotation, astManager) {
            return astManager.getAST(editorContext).then(function(ast) {
                var node = Finder.findNode(annotation.start, ast, {parents:true});
                if(node && node.parents && node.parents.length > 0) {
                    var decl = node.parents.pop();
                    if(decl.type === 'FunctionDeclaration') {
                        return editorContext.setText('', decl.range[0], decl.range[1]);
                    }
                }
                return null;
            });
        },
        /** alternate id for the no-unsed-params linting fix */
        "no-unused-params-expr": function(editorContext, annotation, astManager) {
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
                var node = Finder.findNode(annotation.start, ast, {parents:true});
                if(node && node.parents && node.parents.length > 0) {
                    var func = node.parents.pop();
                    var p = node.parents.pop();
                    var promise;
                    switch(p.type) {
                    	case 'Property': {
                    		if(!hasDocTag('@callback', p) && !hasDocTag('@callback', p.key)) { //$NON-NLS-1$ //$NON-NLS-2$
                    			promise = updateCallback(p, ast, (p.leadingComments ? p.leadingComments : p.key.leadingComments));
                			}
                    		break;
                    	}
                    	case 'AssignmentExpression': {
                    		var left = p.left;
                    		if(left.type === 'MemberExpression' && !hasDocTag('@callback', left)) { //$NON-NLS-1$
				        		promise = updateCallback(left, ast, left.leadingComments);
				        	} else if(left.type === 'Identifier' && !hasDocTag('@callback', left)) { //$NON-NLS-1$
				        		promise = updateCallback(p.left, ast, left.leadingComments);	        		
				        	}
                			break;
                    	}
                    	case 'VariableDeclarator': {
                    		var oldp = p;
                			p = p.parent;
                			if((p.declarations[0].range[0] == oldp.range[0]) && (p.declarations[0].range[1] === oldp.range[1])) {
                				//insert at the var keyword level to not mess up the code
                				promise = updateCallback(p, ast, oldp.id.leadingComments);
                			} else if(!hasDocTag('@callback', oldp.id)) { //$NON-NLS-1$
                    			promise = updateCallback(oldp, ast, oldp.id.leadingComments);
                			} 
                			
                    		break;
                    	}
                    }
                    if(!promise && !hasDocTag('@callback', func)) { //$NON-NLS-1$
                        return editorContext.setText("/* @callback */ ", func.range[0], func.range[0]); //$NON-NLS-1$
                    }
                }
                return promise;
            });
        },
        /** fix for use-isnan linting rule */
       "use-isnan": function(editorContext, annotation, astManager) {
       		return astManager.getAST(editorContext).then(function(ast) {
       			var node = Finder.findNode(annotation.start, ast, {parents:true});
                if(node && node.parents && node.parents.length > 0) {
                    var bin = node.parents.pop();
                    if(bin.type === 'BinaryExpression') {
                    	var tomove;
                    	if(bin.left.type === 'Identifier' && bin.left.name === 'NaN') {
                    		tomove = bin.right;
                    	} else if(bin.right.type === 'Identifier' && bin.right.name === 'NaN') {
                    		tomove = bin.left;
                    	}
                    	if(tomove) {
	                    	return editorContext.getText(tomove.range[0], tomove.range[1]).then(function(text) {
	                    		return editorContext.setText('isNaN('+text+')', bin.range[0], bin.range[1]);	 //$NON-NLS-1$
	                    	});
                    	}
                    }
                }
       		});	
       },
        /** fix for the semi linting rule */
        "semi": function(editorContext, annotation) {
            return editorContext.setText(';', annotation.end, annotation.end);
        },
        /** fix for the missing-nls rule */
        "missing-nls": function(editorContext, annotation, astManager){
        	// We depend on the validator rule in eslint to count the number of literals on the line
        	if (annotation.data && typeof annotation.data.indexOnLine === 'number'){
	        	return astManager.getAST(editorContext).then(function(ast) {
	                // Insert the correct non nls comment
	                var end = getLineEnd(ast.source, annotation.end);
	                // indexOnLine starts at 0, non-nls comments start at one
	                var comment = " //$NON-NLS-" + (annotation.data.indexOnLine + 1) + "$"; //$NON-NLS-1$
	                return editorContext.setText(comment, end, end);
	            });
			}
			return null;
        }
	});
	
	JavaScriptQuickfixes.prototype.contructor = JavaScriptQuickfixes;
	
	return {
		JavaScriptQuickfixes: JavaScriptQuickfixes
	};
});
