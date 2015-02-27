/*******************************************************************************
 * @license
 * Copyright (c) 2014, 2015 IBM Corporation and others.
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
		
		/**
		 * @description Sets up the test
		 * @public
		 * @param {String} text The compilation unit text
		 * @param {String} contentType The content type  
		 */
		function setup(text, contentType) {
			return {
			    astManager: new ASTManager.ASTManager(Esprima),
				text: text,
				editorContext: {
    				/**
    				 * get the text
    				 */
    				getText: function() {
    					return new Deferred().resolve(text);
    				},
    				
    				getFileMetadata: function() {
    				    var o = Object.create(null);
        			    o.contentType = Object.create(null);
        			    o.contentType.id = contentType ? contentType : 'application/javascript';
        			    o.location = 'opendecl_test_script.js';
        			    return new Deferred().resolve(o);
    				}
				}
			};
		}
		
		it("Test Function decl 1", function() {
			var r = setup("function f() {} \n f();");
			return r.astManager.getAST(r.editorContext).then(function(ast) {
				var decl = Finder.findDeclaration(19, ast, {id: 'f', kind: Finder.SearchOptions.FUNCTION_DECLARATION});
				assert(decl, "Should have found the defining function");
				assert.equal(decl.type, 'FunctionDeclaration', 'Should have found a func decl');
				assert.equal(decl.range[0], 0, 'decl start should be file start');
			});
		});
		
		it("Test Function decl 2", function() {
			var r = setup("function f() { \n f(); \n}");
			return r.astManager.getAST(r.editorContext).then(function(ast) {
				var decl = Finder.findDeclaration(18, ast, {id: 'f', kind: Finder.SearchOptions.FUNCTION_DECLARATION});
				assert(decl, "Should have found the defining function");
				assert.equal(decl.type, 'FunctionDeclaration', 'Should have found a func decl');
				assert.equal(decl.range[0], 0, 'decl start should be file start');
			});
		});
		
		it("Test Function decl 3", function() {
			var r = setup("function f() { } \n function f() { } \n f();");
			return r.astManager.getAST(r.editorContext).then(function(ast) {
				var decl = Finder.findDeclaration(39, ast, {id: 'f', kind: Finder.SearchOptions.FUNCTION_DECLARATION});
				assert(decl, "Should have found the defining function");
				assert.equal(decl.type, 'FunctionDeclaration', 'Should have found a func decl');
				assert.equal(decl.range[0], 19, 'decl start should be second decl at offset 19');
			});
		});
		
		it("Test Function decl 4", function() {
			var r = setup("function f() { } \n function f() { \n f(); \n }");
			return r.astManager.getAST(r.editorContext).then(function(ast) {
				var decl = Finder.findDeclaration(37, ast, {id: 'f', kind: Finder.SearchOptions.FUNCTION_DECLARATION});
				assert(decl, "Should have found the defining function");
				assert.equal(decl.type, 'FunctionDeclaration', 'Should have found a func decl');
				assert.equal(decl.range[0], 19, 'decl start should be second decl at offset 19');
			});
		});
	});
});
