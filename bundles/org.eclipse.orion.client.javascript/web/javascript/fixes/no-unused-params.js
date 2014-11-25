/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
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
'javascript/finder',
'orion/editor/textModel'
], function(Finder, TextModel) {
    
    function makeEdit(value, start, end) {
        var edit = Object.create(null);
        edit.value = value;
        edit.start = start;
        edit.end = end;
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
    }
    
    function removeIndexedItem(list, index, model) {
        if(index < 0 || index > list.length) {
            return;
        }
        var node = list[index];
        if(list.length === 1) {
            model.setText('', node.range[0], node.range[1]);
        } else if(index === list.length-1) {
            model.setText('', list[index-1].range[1], node.range[1]);
        } else {
            model.setText('', node.range[0], list[index+1].range[0]);
        }
    }
    
    function updateDoc(node, source, model) {
        if(node.leadingComments && node.leadingComments.length > 0) {
            for(var i = node.leadingComments.length-1; i > -1; i--) {
                var comment = node.leadingComments[i];
                var edit = new RegExp("(\\s*[*]+\\s*(?:@param)\\s*(?:\\{.*\\})?\\s*(?:"+node.name+")?.*)").exec(comment.value);
                if(edit) {
                    var start = comment.range[0] + edit.index + getDocOffset(source, comment.range[0]);
                    model.setText('', start, start+edit[1].length);
                }
            }
        }
    }
    
    return function(editorContext, annotation, astManager) {
        return astManager.getAST(editorContext).then(function(ast) {
            var node = Finder.findNode(annotation.start, ast, {parents:true});
            if(node) {
                var model = new TextModel.TextModel(ast.source);
                var parent = node.parents.pop();
                var paramindex = -1;
                for(var i = 0; i < parent.params.length; i++) {
                    var p = parent.params[i];
                    if(node.range[0] === p.range[0] && node.range[1] === p.range[1]) {
                        paramindex = i;
                        break;
                    }
                }
                removeIndexedItem(parent.params, paramindex, model);  
                switch(parent.type) {
                    case 'FunctionExpression': {
                        var funcparent = node.parents.pop();
                        if(funcparent.type === 'CallExpression' && funcparent.callee.name === 'define') {
                            var args = funcparent.arguments;
                            for(i = 0; i < args.length; i++) {
                                var arg = args[i];
                                if(arg.type === 'ArrayExpression') {
                                    removeIndexedItem(arg.elements, paramindex, model);
                                    break;
                                }
                            }
                        } else if(funcparent.type === 'Property' && funcparent.leadingComments && funcparent.leadingComments.length > 0) {
                            updateDoc(parent, ast.source, model);
                        }
                        break;
                    }
                    case 'FunctionDeclaration': {
                        updateDoc(parent, ast.source, model);
                        break;
                    }
                }
                return editorContext.setText(model.getText());
            }
            return null;
        });
    };
});