/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define*/
define([
'orion/objects'
], function(Objects) {
	
	/**
	 * @name javascript.JSDocOutliner
	 * @description creates a new instance of the outliner
	 * @constructor
	 * @public
	 */
	function JSDocOutliner() {
	}
	
	Objects.mixin(JSDocOutliner.prototype, /** @lends javascript.JSDocOutliner.prototype*/ {
	
		/**
		 * @name computeOutline
		 * @description callback from the <code>orion.edit.outliner</code> service to create
		 * an outline
		 * @function
		 * @public
		 * @memberof javascript.JSDocOutliner.prototype
		 * @param {orion.edit.EditorContext} editorContext The editor context
		 * @param {Object} options The options
		 * @returns {orion.Promise} to compute the outline
		 */
		computeOutline: function(editorContext, options) {
			this.sourceCounter = 1;
			var that = this;
			var astoptions = {loc:true, comment:true, tolerant:true, tokens:false, range:false, raw:false};
			return editorContext.getAST(astoptions).then(function(ast) {
				if(ast && ast.comments) {
					var elements = [];
					ast.comments.forEach(function(node) {
						if(node.type === "Block") {
							//Outline element {label, className, line, children, href}
							elements.push({
								start : node.range[0] > 0 ? node.range[0] : 1,
								end : node.range[1],
								label : that._getNameFrom(node, ['@name']),
								//className : that._getNameFrom(node, ['@class', '@memberof']),
								children : that._getTagChildren(node)
							});
						}
					});
					return elements;
				}
			});
		},
		
		/**
		 * @name _getNameFrom
		 * @description tries to compute a name for the element using the given array of names to look for
		 * @function
		 * @private
		 * @memberof javascript.JSDocOutliner
		 * @param {Object} node The AST doc node
		 * @param {Array|String} tags An array of strings of the names of tags to look for to try and find a name
		 * @returns the name to use for the given node if it could be computed, or 'Doc Node #N' if a name could not be computed
		 */
		_getNameFrom: function(node, tags) {
			var that = this;
			var length = tags.length;
			for(var i = 0; i < length; i++) {
				var val = node.value;
				var tag = tags[i]+' ';
				var index = val.indexOf(tag);
				if(index > -1) {
					//hack, just assume a name does not have spaces
					var start = index+tag.length;
					var end = val.indexOf(' ', start);
					if(end > -1) {
						return val.substring(start, end);
					}
				}
			}
			return "Doc node #"+that.sourceCounter++;
		},
		
		/**
		 * @name _getTagChildren
		 * @description Computes all of the tags of a doc node as a child array
		 * @function
		 * @private
		 * @memberof javascript.JSDocOutliner
		 * @param {Object} node The AST doc node
		 * @returns {Array|Object} Returns the array of child tags
		 */
		_getTagChildren: function(node) {
			var val = node.value;
			//hack assume all tags start with '@' and end in a space
			var kids = [];
			var idx = 0, atidx = 0;
			var length = val.length;
			var intag = false;
			while(idx < length) {
				var char = val.charAt(idx);
				if(char === '@') {
					intag = true;
					atidx = idx;
				}
				else if(intag && (char === ' ' || char === '\n' || char === '\r')) {
					intag = false;
					kids.push({
						label : val.substring(atidx, idx),
						start: atidx + node.range[0]+2, //hack - the value of the node chops off the first two chars '/*'
						end: idx + node.range[0]+2
					});
				}
				idx++;
			}
			if(kids.length === 0) {
				//Returning an emppty array causes twisties to be shown with no children, return null
				return null;
			}
			return kids;
		}
	});
	
	JSDocOutliner.prototype.contructor = JSDocOutliner;
	
	/**
	 * @name javascript.JsOutliner
	 * @description creates a new instance of the outliner
	 * @constructor
	 * @public
	 */
	function JsOutliner() {
	}
	
	Objects.mixin(JsOutliner.prototype, /** @lends javascript.JsOutliner.prototype*/ {
	
		/**
		 * @name computeOutline
		 * @description callback from the <code>orion.edit.outliner</code> service to create
		 * an outline
		 * @function
		 * @public
		 * @memberof javascript.JsOutliner.prototype
		 * @param {orion.edit.EditorContext} editorContext The editor context
		 * @param {Object} options The options
		 * @returns {}
		 */
		computeOutline: function(editorContext, options) {
			return [];
		}
	});
	
	JsOutliner.prototype.contructor = JsOutliner;
	
	return {
			JSDocOutliner: JSDocOutliner,
			JsOutliner: JsOutliner};
});