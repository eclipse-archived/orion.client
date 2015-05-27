 /*******************************************************************************
 * @license
 * Copyright (c) 2013, 2014 IBM Corporation and others.
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
'javascript/finder'
], function(Objects, Finder) {
	
	/**
	 * @name javascript.JavaScriptOccurrences
	 * @description creates a new instance of the outliner
	 * @constructor
	 * @public
	 * @param {javascript.ASTManager} astManager
	 * @param {javascript.CUProvider} cuProvider
	 */
	function JavaScriptOccurrences(astManager, cuProvider) {
		this.astManager = astManager;
		this.cuprovider = cuProvider;
	}
	
	Objects.mixin(JavaScriptOccurrences.prototype, /** @lends javascript.JavaScriptOccurrences.prototype*/ {
		
		/**
		 * @name computeOccurrences
		 * @description Callback from the editor to compute the occurrences
		 * @function
		 * @public 
		 * @memberof javascript.JavaScriptOccurrences.prototype
		 * @param {Object} editorContext The current editor context
		 * @param {Object} ctxt The current selection context
		 */
		computeOccurrences: function(editorContext, ctxt) {
			var that = this;
			return editorContext.getFileMetadata().then(function(meta) {
			    if(meta.contentType.id === 'application/javascript') {
			        return that.astManager.getAST(editorContext).then(function(ast) {
						return Finder.findOccurrences(ast, ctxt);
					});
			    }
			    return editorContext.getText().then(function(text) {
    			    var blocks = Finder.findScriptBlocks(text);
    	            if(blocks && blocks.length > 0) {
    		            var cu = that.cuprovider.getCompilationUnit(blocks, meta);
    		            if(cu.validOffset(ctxt.selection.start)) {
        		            return that.astManager.getAST(cu.getEditorContext()).then(function(ast) {
                				return Finder.findOccurrences(ast, ctxt);
                			});
            			}
        			}
    			});
			});
		}
	});
	
	JavaScriptOccurrences.prototype.contructor = JavaScriptOccurrences;
	
	return {
		JavaScriptOccurrences: JavaScriptOccurrences
		};
});
