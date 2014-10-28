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
 ******************************************************************************/
/*eslint-env amd, mocha, node*/
/*global doctrine*/
define([
	'javascript/finder',
	'chai/chai',
	'orion/Deferred',
	'esprima',
	'javascript/astManager',
	'mocha/mocha', //must stay at the end, not a module
], function(Finder, chai, Deferred, Esprima, ASTManager) {
	
	var assert = chai.assert;

	describe('Open Declaration Tests', function() {
		
		var astManager = new ASTManager.ASTManager(Esprima);
		var editorContext = {
			text: "",
			/**
			 * get the text
			 */
			getText: function() {
				return new Deferred().resolve(this.text);
			}
		};
		/**
		 * @description Sets up the test
		 * @public
		 * @param {String} text The compilation unit text
		 */
		function setUp(text) {
			return {
				text: text,
				/**
				 * get the text
				 */
				getText: function() {
					return new Deferred().resolve(this.text);
				}
			};
		}
		
		/**
		 * @name tearDown
		 * @description Resets the test state between runs, must explicitly be called per-test
		 * @function
		 * @public
		 */
		function tearDown() {
			editorContext.text = "";
			astManager.updated();
		}
	
		it("Test Function decl 1", function() {
			var text = "function f() {} \n f();";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var decl = Finder.findDeclaration(19, ast, {id: 'f', kind: Finder.SearchOptions.FUNCTION_DECLARATION});
					assert(decl, "Should have found the defining function");
					assert.equal(decl.type, 'FunctionDeclaration', 'Should have found a func decl');
					assert.equal(decl.range[0], 0, 'decl start should be file start');
				}
				finally {
					tearDown();
				}
			});
		});
		
		it("Test Function decl 2", function() {
			var text = "function f() { \n f(); \n}";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var decl = Finder.findDeclaration(18, ast, {id: 'f', kind: Finder.SearchOptions.FUNCTION_DECLARATION});
					assert(decl, "Should have found the defining function");
					assert.equal(decl.type, 'FunctionDeclaration', 'Should have found a func decl');
					assert.equal(decl.range[0], 0, 'decl start should be file start');
				}
				finally {
					tearDown();
				}
			});
		});
		
		it("Test Function decl 3", function() {
			var text = "function f() { } \n function f() { } \n f();";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var decl = Finder.findDeclaration(39, ast, {id: 'f', kind: Finder.SearchOptions.FUNCTION_DECLARATION});
					assert(decl, "Should have found the defining function");
					assert.equal(decl.type, 'FunctionDeclaration', 'Should have found a func decl');
					assert.equal(decl.range[0], 19, 'decl start should be second decl at offset 19');
				}
				finally {
					tearDown();
				}
			});
		});
		
		it("Test Function decl 4", function() {
			var text = "function f() { } \n function f() { \n f(); \n }";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var decl = Finder.findDeclaration(37, ast, {id: 'f', kind: Finder.SearchOptions.FUNCTION_DECLARATION});
					assert(decl, "Should have found the defining function");
					assert.equal(decl.type, 'FunctionDeclaration', 'Should have found a func decl');
					assert.equal(decl.range[0], 19, 'decl start should be second decl at offset 19');
				}
				finally {
					tearDown();
				}
			});
		});
	});
});
