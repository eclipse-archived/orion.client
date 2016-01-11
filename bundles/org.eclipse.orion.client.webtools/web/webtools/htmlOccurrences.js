 /*******************************************************************************
 * @license
 * Copyright (c) 2016 IBM Corporation and others.
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
	'webtools/util'
], function(Objects, util) {
	
	/**
	 * @name webtools.HtmlOccurrences
	 * @description creates a new instance of the occurrence finder
	 * @constructor
	 * @public
	 * @param {javascript.ASTManager} astManager
	 */
	function HTMLOccurrences(astManager) {
		this.astManager = astManager;
	}
	
	Objects.mixin(HTMLOccurrences.prototype, /** @lends webtools.HtmlOccurrences.prototype*/ {
		
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
	        return that.astManager.getAST(editorContext).then(function(ast) {
				return findOccurrences(ast, ctxt);
			});
		}
	});
	
	/**
	 * If the caret is on a tag, marks the matching end tag and vice versa
	 * @param ast
	 * @param ctxt
	 * @returns returns {[Object]} Array of occurrences to mark
	 */
	function findOccurrences(ast, ctxt) {
		if(ast && ctxt) {
			var start = ctxt.selection.start;
			var node = util.findNodeAtOffset(ast, start);
			// TODO Do we care about the selection end
			if(node) {
				if (node.type === 'tag'){
					var occurrences = [];
					var tagName = node.name;
					var openTagStart = node.range[0];
					var openTagEnd = openTagStart+tagName.length;
					var closeTagEnd = node.range[1];
					var closeTagStart = closeTagEnd;
					closeTagStart--; // before the close bracket >
					
					// Since the parser does not handle incorrect HTML well, we do some sanity checking here
					var source = ast.source;
					
					if(tagName !== source.substring(openTagStart, openTagEnd)){
						return []; // Unexpected open tag, abort
					}
					
					var char = source[closeTagStart];
					if (char === '>'){
						closeTagEnd--;
						closeTagStart -= tagName.length;
						closeTagStart--;
						if ('/' + tagName !== source.substring(closeTagStart,closeTagEnd)){
							return []; // Unexpected end tag, abort
						}
					} else if (char !== '/'){
						// Inline tags <a /> don't include the closing bracket in their offset
						return []; // Unexpected character, abort
					}
					
					if(start <= openTagEnd && start >= openTagStart) {
						occurrences.push({start: openTagStart, end: openTagEnd});
						occurrences.push({start: closeTagStart, end: closeTagEnd});
					}
					if(start >= closeTagStart && start <= closeTagEnd) {
						occurrences.push({start: openTagStart, end: openTagEnd});
						occurrences.push({start: closeTagStart, end: closeTagEnd});
					}
						
					return occurrences;
				}
			}
		}
		return [];
	}
	
	HTMLOccurrences.prototype.contructor = HTMLOccurrences;
	
	return {
			HTMLOccurrences: HTMLOccurrences
		};
});
