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
/* global doctrine */
define([
'orion/objects',
'javascript/finder'
], function(Objects, Finder) {
	
	/**
	 * @description Creates a new JavaScript quick fix computer
	 * @param {javascript.ASTManager} astManager The AST manager
	 * @returns {javascript.JavaScriptQuickfixes} The new quick fix computer instance
	 * @since 8.0
	 */
	function JavaScriptQuickfixes(astManager) {
	   this.astManager = astManager;
	}
	
	Objects.mixin(JavaScriptQuickfixes.prototype, /** @lends javascript.JavaScriptQuickfixes.prototype*/ {
		/**
		 * @description Editor command callback
		 * @function
		 * @param {orion.edit.EditorContext} editorContext The editor context
		 * @param {Object} context The context params
		 */
		execute: function(editorContext, context) {
		    var annot = context.annotation;
		    if(!annot) {
		        return;
		    }
		    return this._generateFixes(editorContext, annot);
		},
		
		/**
		 * @description Given the annotation, compute the available fixes
		 * @function
		 * @private
		 * @param {Object} annotation The annotation to fix
		 * @returns returns
		 */
		_generateFixes: function _generateFixes(editorContext, annotation) {
		    var that = this;
		    return editorContext.getText().then(function(text) {
		        var linestart = that._getLineStart(text, annotation.start);
		        var indent = '';
		        var postfix = '';
		        var fix  = '';
    		    switch(annotation.id) {
    		        case 'no-extra-semi': {
    		            return editorContext.setText('', annotation.start, annotation.end);
    		        }
    		        case 'no-fallthrough': {
    		            fix = '//$FALLTHROUGH$';
    		            indent = that._computeIndent(text, linestart);
    		            postfix = that._computePostfix(text, annotation, indent);
    		            fix += postfix;
    		            return editorContext.setText(fix, annotation.start, annotation.start);
    		        }
    		        case 'no-empty-block': {
    		            fix = '//TODO empty block';
    		            indent = that._computeIndent(text, linestart, true);
    		            postfix = that._computePostfix(text, annotation);
    		            fix = '\n' + indent + fix;
    		            fix += postfix;
    		            return editorContext.setText(fix, annotation.start+1, annotation.start+1);
    		        }
    		     /*   case 'no-undef-defined': {
    		            var name = /^'(.*)'/.exec(annotation.value);
    		            if(typeof name !== 'undefined') {
        		            var env = Finder.findESLintEnvForMember(name);
        		            return that.astManager.getAST(editorContext).then(function(ast) {
        		                var comment = Finder.findDirective(ast, '');
        		                if(comment) {
        		                    
        		                } else {
        		                    
        		                }
        		            });
    		            }
    		        }*/
    		        default: return null;
    		    }
		    });
		},
		
		_getLineStart: function _getLineStart(text, offset) {
		    var off = offset;
		    var char = text[off];
		    while(off > -1 && !/[\R\r\n]/.test(char)) {
		        char = text[--off];
		    }
		    return off+1; //last char inspected will be @ -1 or the new line char
		},
		
		_computeIndent: function _computeIndent(text, linestart, extraIndent) {
		    var off = linestart;
		    var char = text[off];
		    var preamble = extraIndent ? '\t' : '';
			//walk the proceeding whitespace so we will insert formatted at the same level
			while(char === ' ' || char === '\t') {
				preamble += char;
				char = text[++off];
			}
			return preamble;
		},

        _computePostfix: function _computePostfix(text, annotation, indent) {
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
			    val += '\n';
			}
			if(typeof indent !== 'undefined') {
			    val += indent;
			}
			return val;
        }
	});
	
	JavaScriptQuickfixes.prototype.contructor = JavaScriptQuickfixes;
	
	return {
		JavaScriptQuickfixes: JavaScriptQuickfixes
		};
});
