/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env amd, mocha, node*/
/* eslint-disable missing-nls */
define([
	'chai/chai',
	'esprima',
	'javascript/astManager',
	'orion/Deferred',
	'mocha/mocha'  //must stay last, not a module
], function(chai, Esprima, ASTManager, Deferred) {
	var assert = chai.assert;

	var astManager = new ASTManager.ASTManager(Esprima);

	/**
	 * @description Sets up the test
	 * @param {Object} options The options the set up with
	 * @returns {Object} The object with the initialized values
	 */
	function setup(options) {
		var buffer = typeof(options.buffer) === 'undefined' ? '' : options.buffer,
		    contentType = options.contenttype ? options.contenttype : 'application/javascript',
			file = 'dep_analysis_test_script.js';
			
		var editorContext = {
			/*override*/
			getText: function() {
				return new Deferred().resolve(buffer);
			},
			
			getFileMetadata: function() {
			    var o = Object.create(null);
			    o.contentType = Object.create(null);
			    o.contentType.id = contentType;
			    o.location = file;
			    return new Deferred().resolve(o);
			}
		};
		astManager.onModelChanging({file: {location: file}});
		return {
			editorContext: editorContext
		};
	}

	/**
	 * @description Checks the deps from the AST against the given list
	 * @param {object} ast The AST
	 * @param {Array.<string>} expected The array of expected values
	 */
	function assertDeps(ast, expected) {
		assert(ast, 'An AST was not produced');
		assert(expected, 'You must provide an expected array of dependencies');
		assert(ast.dependencies, 'There were no dependencies in the produced AST');
		var len  = ast.dependencies.length;
		assert.equal(len, expected.length, 'The number of computed dependencies and expected ones differs');
		for(var i = 0; i < len; i++) {
			var dep = ast.dependencies[i];
			assert.equal(dep.type, 'Literal', 'The type of the depenedent node is not Literal');
			assert.equal(dep.value, expected[i], 'The name name of the dependent does not match');
		}
	}

	describe('Dependency Analysis Tests', function() {
		it("Collect deps define 1", function() {
			var _s = setup({buffer: 'define("foo", ["a"], function(A){});'});
			return astManager.getAST(_s.editorContext).then(function(ast) {
				assertDeps(ast, ['a']);
			});
		});
		it("Collect deps define 2", function() {
			var _s = setup({buffer: 'define(["a"], function(A){});'});
			return astManager.getAST(_s.editorContext).then(function(ast) {
				assertDeps(ast, ['a']);
			});
		});
		it("Collect deps define 3", function() {
			var _s = setup({buffer: 'define(["a", "b", "C"], function(A){});'});
			return astManager.getAST(_s.editorContext).then(function(ast) {
				assertDeps(ast, ['a', 'b', 'C']);
			});
		});
		it("Collect deps importScripts 1", function() {
			var _s = setup({buffer: 'importScripts("a.js");'});
			return astManager.getAST(_s.editorContext).then(function(ast) {
				assertDeps(ast, ['a.js']);
			});
		});
		it("Collect deps importScripts 2", function() {
			var _s = setup({buffer: 'importScripts("a.js", "b.js");'});
			return astManager.getAST(_s.editorContext).then(function(ast) {
				assertDeps(ast, ['a.js', 'b.js']);
			});
		});
		it("Collect deps Worker", function() {
			var _s = setup({buffer: 'var myworker = new Worker("a.js")'});
			return astManager.getAST(_s.editorContext).then(function(ast) {
				assertDeps(ast, ['a.js']);
			});
		});
		it("Collect deps require 1", function() {
			var _s = setup({buffer: 'var _r = require("a")'});
			return astManager.getAST(_s.editorContext).then(function(ast) {
				assertDeps(ast, ['a']);
			});
		});
		it("Collect deps require 1", function() {
			var _s = setup({buffer: 'var _r = require("a");'}); //node + requirejs
			return astManager.getAST(_s.editorContext).then(function(ast) {
				assertDeps(ast, ['a']);
			});
		});
		it("Collect deps require 2", function() {
			var _s = setup({buffer: 'var _r = require(["a"], function(){});'}); //requirejs
			return astManager.getAST(_s.editorContext).then(function(ast) {
				assertDeps(ast, ['a']);
			});
		});
		it("Collect deps require 3", function() {
			var _s = setup({buffer: 'var _r = require(["a", "b", "c"], function(){});'}); //requirejs
			return astManager.getAST(_s.editorContext).then(function(ast) {
				assertDeps(ast, ['a', 'b', 'c']);
			});
		});
		it("Collect deps require 4", function() {
			var _s = setup({buffer: 'var _r = require({paths:{"a": "a/b"}}, ["a", "b", "c"], function(){});'}); //requirejs
			return astManager.getAST(_s.editorContext).then(function(ast) {
				assertDeps(ast, ['a', 'b', 'c']);
			});
		});
		it("Collect deps requirejs 1", function() {
			var _s = setup({buffer: 'var _r = requirejs(["a", "b", "c"], function(){});'}); //requirejs
			return astManager.getAST(_s.editorContext).then(function(ast) {
				assertDeps(ast, ['a', 'b', 'c']);
			});
		});
	});
});