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
define([
	'esprima',
	'orion/Deferred',
	'orion/objects',
	'orion/serialize'
], function(_, Deferred, objects, Serialize) {

	/**
	 * Provides a shared AST.
	 * @name javascript.ASTManager
	 * @class Provides a shared AST.
	 */
	function ASTManager() {
		this.cache = null;
	}
	objects.mixin(ASTManager.prototype, /** @lends javascript.ASTManager.prototype */ {
		/**
		 * @param {Object} editorContext
		 * @returns {orion.Promise} A promise resolving to the AST.
		 */
		getAST: function(editorContext) {
			if (this.cache) {
				return new Deferred().resolve(this.cache);
			}
			var _self = this;
			return editorContext.getText().then(function(text) {
				var ast = _self.parse(text);
				_self.cache = ast;
				return ast;
			});
		},
		/**
		 * @private
		 * @param {String} text The code to parse.
		 * @returns {Object} The AST.
		 */
		parse: function(text) {
			// TODO wrap in try..catch to recover from parse errors in initial statements of code
			var ast = esprima.parse(text, {
				range: true,
				tolerant: true,
				comment: true,
				loc: true,
				tokens: true
			});
			if (ast.errors) {
				ast.errors = ast.errors.map(Serialize.serializeError);
			}
			return ast;
		},
		/**
		 * Notifies the AST manager of a change to the model.
		 * @param {Object} event
		 */
		updated: function(event) {
			this.cache = null;
		}
	});
	return ASTManager;
});