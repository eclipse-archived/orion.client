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
'javascript/fixes/fixUtils'
], function(Finder, FixUtils) {
    return function(editorContext, annotation, astManager) {
        return astManager.getAST(editorContext).then(function(ast) {
            var node = Finder.findNode(annotation.start, ast, {parents:true});
            if(node && node.parents && node.parents.length > 0) {
                var func = node.parents.pop();
                var p = node.parents.pop();
                if(p.type === 'Property') {
                    if(p.leadingComments) {
                        //attach it to the last one
                        var comment = p.leadingComments[p.leadingComments.length-1];
                        var valueend = comment.range[0]+comment.value.length+FixUtils.getDocOffset(ast.source, comment.range[0]);
                        var start = FixUtils.getLineStart(ast.source, valueend);
                        var indent = FixUtils.computeIndent(ast.source, start);
                        var fix = "* @callback\n"+indent;
                        /*if(comment.value.charAt(valueend) !== '\n') {
                            fix = '\n' + fix;
                        }*/
                        return editorContext.setText(fix, valueend-1, valueend-1);
                    }
                    start = FixUtils.getLineStart(ast.source, p.range[0]);
                    indent = FixUtils.computeIndent(ast.source, start);
                    return editorContext.setText("/**\n"+indent+" * @callback\n"+indent+" */\n"+indent, p.range[0], p.range[0]);
                } else {
                    return editorContext.setText("/* @callback */ ", func.range[0], func.range[0]);
                }
            }
            return null;
        });
    };
});