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
/*global define esprima*/
define(["esprima/esprima"
], function() {
	
	/**
	 * @name javascript.JavaScriptOutliner
	 * @description creates a new instance of the outliner
	 * @constructor
	 * @public
	 */
	function JavaScriptOutliner() {
	}
	
	JavaScriptOutliner.prototype = /** @lends javascript.JavaScriptOutliner.prototype*/ {
	
		/**
		 * @name getOutline
		 * @description callback from the <code>orion.edit.outliner</code> service to create
		 * an outline
		 * @function
		 * @public
		 * @memberof javascript.JavaScriptOutliner.prototype
		 * @param {String} contents - the contents to make an outline from
		 * @param {String} title - the title
		 */
		getOutline: function(contents, title) {
			//TODO
			return [];
		},
		
		/**
		 * @name getSourceOutline
		 * @description creates a raw heiarchical source outline
		 * @function
		 * @private
		 * @memberof javascript.JavaScriptOutliner.prototype
		 * @param {String} contents - the contents to make an outline from
		 * @param {String} title - the title
		 */
		getSourceOultine: function(contents, title) {
			//TODO use shared AST, do not recompute if possible
			return [];
		},
		
		/**
		 * @name getJsDocOutline
		 * @description creates a heiarchical source outline based solely on JSDoc tags
		 * @function
		 * @private
		 * @memberof javascript.JavaScriptOutliner.prototype
		 * @param {String} contents - the contents to make an outline from
		 * @param {String} title - the title
		 */
		getJsDocOutline: function(contents, title) {
			//TODO use shared AST, do not recompute if possible
			return [];
		}
	};
	
	JavaScriptOutliner.prototype.contructor = JavaScriptOutliner;
	
	return {
		JavaScriptOutliner: JavaScriptOutliner
		};
});