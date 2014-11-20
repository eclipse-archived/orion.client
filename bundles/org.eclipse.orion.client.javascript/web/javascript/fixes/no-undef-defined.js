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
/*globals foo, bar*/
define([
'javascript/finder'
], function(Finder) {
    
    function updateDirective(text, directive, name, usecommas) {
        if(usecommas) {
	        if(text.slice(directive.length).trim() !== '') {
	            return text.trim() + ', '+name;
	        } else {
	            return text.trim() + ' '+name; 
	        }
        } else {
	       return text.trim() + ' '+name; 
	    }
    }
    
    return function(editorContext, annotation, astManager) {
        var name = /^'(.*)'/.exec(annotation.title);
        if(name != null && typeof name !== 'undefined') {
            var env = Finder.findESLintEnvForMember(name[1]);
            return astManager.getAST(editorContext).then(function(ast) {
                var comment = null;
                var start = 0;
                if(env) {
                    comment = Finder.findDirective(ast, 'eslint-env');
                    if(comment) {
                        start = comment.range[0]+2;
	                    return editorContext.setText(updateDirective(comment.value, 'eslint-env', env, true), start, start+comment.value.length);
                    } else {
                        return editorContext.setText('/*eslint-env '+env+' */\n', ast.range[0], ast.range[0]);
                    }
                } else {
                    comment = Finder.findDirective(ast, 'globals');
                    if(comment) {
                        start = comment.range[0]+2;
	                    return editorContext.setText(updateDirective(comment.value, 'globals', name[1]), start, start+comment.value.length);
                    } else {
                        return editorContext.setText('/*globals '+name[1]+' */\n', ast.range[0], ast.range[0]);
                    }
                }
            });
        }
    };
});