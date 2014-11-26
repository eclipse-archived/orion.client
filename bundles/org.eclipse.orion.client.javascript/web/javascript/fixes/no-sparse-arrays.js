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
    return function(editorContext, annotation, astManager) {
        return astManager.getAST(editorContext).then(function(ast) {
            var node = Finder.findNode(annotation.start, ast, {parents:true});
            if(node && node.type === 'ArrayExpression') {
                var model = new TextModel.TextModel(ast.source.slice(annotation.start, annotation.end));
                var len = node.elements.length;
                var idx = len-1;
                var item = node.elements[idx];
                if(item === null) {
                    var end = Finder.findToken(node.range[1], ast.tokens);
                    if(end.value === ';') {
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
                    model.setText(', ', item.range[1]-annotation.start, prev.range[0]-annotation.start);
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
    };
});
