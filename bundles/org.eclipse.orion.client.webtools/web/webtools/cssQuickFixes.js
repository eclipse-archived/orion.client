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
'orion/objects'
], function(Objects) {
	
	/**
	 * @description Creates a new CSS quick fix computer
	 * @returns {webtools.CssQuickFixes} The new quick fix computer instance
	 * @since 8.0
	 */
	function CssQuickFixes() {
	}
	
	Objects.mixin(CssQuickFixes.prototype, /** @lends webtools.CssQuickFixes.prototype*/ {
		/**
		 * @description Editor command callback
		 * @function
		 * @param {orion.edit.EditorContext} editorContext The editor context
		 * @param {Object} context The context params
		 */
		execute: function(editorContext, context) {
		    var fixes = this[context.annotation.id];
	        if(fixes) {
	            return fixes(editorContext, context.annotation);
	        }
		    return null;
		},
		"zero-units": function(editorContext, annotation) {
			return editorContext.getText().then(function(text) {
				if (text[annotation.end-1] === ';'){
					 return editorContext.setText('0;', annotation.start, annotation.end);
				} else {
					return editorContext.setText('0', annotation.start, annotation.end);
				}
            });
		}
	});
	
	CssQuickFixes.prototype.contructor = CssQuickFixes;
	
	return {
		CssQuickFixes: CssQuickFixes
	};
});
