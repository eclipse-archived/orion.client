/*******************************************************************************
 * @license
 * Copyright (c) 2013, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global console:true define*/
define([
	'orion/assert',
	'javascript/finder',
	'javascript/astManager',
	'orion/Deferred'
], function(Assert, Finder, ASTManager, Deferred) {
	
	var astManager = new ASTManager();
	var editorContext = {
		text: "",
		getText: function() {
			return new Deferred().resolve(this.text);
		}
	};
	
	/**
	 * @name tearDown
	 * @description Resets the test state between runs, must explicitly be called per-test
	 * @function
	 * @public
	 */
	function tearDown() {
		editorContext.text = "";
		astManager.updated();
	};
	
	var Tests = {
		
		test_findWord1: function() {
			var word = Finder.findWord('function(param1, param2)', 12);
			Assert.equal(word, 'param1', 'Should have found the word param1');
		},
		
		test_findWord2: function() {
			var word = Finder.findWord('function(param1, param2)', 9);
			Assert.equal(word, 'param1', 'Should have found the word param1');
		},
		
		test_findWord3: function() {
			var word = Finder.findWord('function(param1, param2)', 17);
			Assert.equal(word, 'param2', 'Should have found the word param2');
		},
		
		test_findWord4: function() {
			var word = Finder.findWord('var foo.bar = function(param1, param2)', 4);
			Assert.equal(word, 'foo', 'Should have found the word foo');
		},
		
		test_findWord5: function() {
			var word = Finder.findWord('var foo.bar = function(param1, param2)', 8);
			Assert.equal(word, 'bar', 'Should have found the word bar');
		},
		
		test_findWord6: function() {
			var word = Finder.findWord('f =function(p1) {', 3);
			Assert.equal(word, 'function', 'Should have found word function');
		},
		
		test_findWord7: function() {
			var word = Finder.findWord('f ={foo:true', 4);
			Assert.equal(word, 'foo', 'Should have found word foo');
		},
		
		test_findWord8: function() {
			var word = Finder.findWord('function(param1, param2)', 15);
			Assert.equal(word, 'param1', 'Should have found word param1');
		},
		
		test_findWord9: function() {
			var word = Finder.findWord('var foo.bar = function(param1, param2)', 7);
			Assert.equal(word, 'foo', 'Should have found word foo');
		},
		
		test_findWord10: function() {
			var word = Finder.findWord('   foo.bar = function(param1, param2)', 4);
			Assert.equal(word, 'foo', 'Should have found word foo');
		},
		
		test_findWord11: function() {
			var word = Finder.findWord('	foo.bar = function(param1, param2)', 2);
			Assert.equal(word, 'foo', 'Should have found word foo');
		},
		
		test_findNoWord1: function() {
			var word = Finder.findWord('f: function(p1, p2)', 2);
			Assert.equal(word, null, 'Should have found no word');
		},
		
		test_findNoWord2: function() {
			var word = Finder.findWord('f: function(p1, p2)', 15);
			Assert.equal(word, null, 'Should have found no word');
		},
		
		test_findNoWord3: function() {
			var word = Finder.findWord('f: function(p1) {', 16);
			Assert.equal(word, null, 'Should have found no word');
		},
		
		test_findNoWord4: function() {
			var word = Finder.findWord('f: function(p1) {', 17);
			Assert.equal(word, null, 'Should have found no word');
		},
		
		test_findNoWord5: function() {
			var word = Finder.findWord('f = function(p1) {', 2);
			Assert.equal(word, null, 'Should have found no word');
		},
		
		test_findNoWord6: function() {
			var word = Finder.findWord('f = function(p1) {', 3);
			Assert.equal(word, null, 'Should have found no word');
		},
		
		test_findNoWord7: function() {
			var word = Finder.findWord('var a = [1, 2]', 7);
			Assert.equal(word, null, 'Should have found no word');
		},
		
		test_findNoWord8: function() {
			var word = Finder.findWord('var a = [1, 2]', 14);
			Assert.equal(word, null, 'Should have found no word');
		},
		
		test_findNode1: function() {
			try {
				editorContext.text = "function  F1(p1, p2) {\n"+
					"\tvar out = p1;\n"+
					"};";
				return astManager.getAST(editorContext).then(function(ast) {
					var node = Finder.findNode(9, ast);
					if(!node) {
						Assert.fail("Should have found a node");
					}
					else {
						Assert.equal(node.type, 'FunctionDeclaration', 'Should have found a FunctionDeclaration node');
					}
				});
			}
			finally {
				tearDown();
			}
		},
		
		test_findNode2: function() {
			try {
				editorContext.text = "function  F1(p1, p2) {\n"+
					"\tvar out = p1;\n"+
					"};";
				return astManager.getAST(editorContext).then(function(ast) {
					var node = Finder.findNode(12, ast);
					if(!node) {
						Assert.fail("Should have found a node");
					}
					else {
						Assert.equal(node.type, 'Identifier', 'Should have found a Identifier node');
					}
				});
			}
			finally {
				tearDown();
			}
		},
		
		test_findNode3: function() {
			try {
				editorContext.text = "function  F1(p1, p2) {\n"+
					"\tvar out = p1;\n"+
					"};";
				return astManager.getAST(editorContext).then(function(ast) {
					var node = Finder.findNode(14, ast);
					if(!node) {
						Assert.fail("Should have found a node");
					}
					else {
						Assert.equal(node.type, 'Identifier', 'Should have found a Identifier node');
					}
				});
			}
			finally {
				tearDown();
			}
		},
		
		test_findNode4: function() {
			try {
				editorContext.text = "function  F1(p1, p2) {\n"+
					"\tvar out = p1;\n"+
					"};";
				return astManager.getAST(editorContext).then(function(ast) {
					var node = Finder.findNode(28, ast);
					if(!node) {
						Assert.fail("Should have found a node");
					}
					else {
						Assert.equal(node.type, 'Identifier', 'Should have found a Identifier node');
					}
				});
			}
			finally {
				tearDown();
			}
		}
	};
	
	return Tests;
});