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
/*global console:true define window*/
define([
	'chai/chai',
	'esprima',
	'javascript/finder',
	'javascript/astManager',
	'orion/Deferred'
], function(chai, esprima, Finder, ASTManager, Deferred) {
	esprima = esprima || window.esprima;
	var assert = chai.assert;

	var astManager = new ASTManager.ASTManager(esprima);
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
	
	var Tests = {
		/***/
		test_findWord1: function() {
			var word = Finder.findWord('function(param1, param2)', 12);
			assert.equal(word, 'param1', 'Should have found the word param1');
		},
		/***/
		test_findWord2: function() {
			var word = Finder.findWord('function(param1, param2)', 9);
			assert.equal(word, 'param1', 'Should have found the word param1');
		},
		/***/
		test_findWord3: function() {
			var word = Finder.findWord('function(param1, param2)', 17);
			assert.equal(word, 'param2', 'Should have found the word param2');
		},
		/***/
		test_findWord4: function() {
			var word = Finder.findWord('var foo.bar = function(param1, param2)', 4);
			assert.equal(word, 'foo', 'Should have found the word foo');
		},
		/***/
		test_findWord5: function() {
			var word = Finder.findWord('var foo.bar = function(param1, param2)', 8);
			assert.equal(word, 'bar', 'Should have found the word bar');
		},
		/***/
		test_findWord6: function() {
			var word = Finder.findWord('f =function(p1) {', 3);
			assert.equal(word, 'function', 'Should have found word function');
		},
		/***/
		test_findWord7: function() {
			var word = Finder.findWord('f ={foo:true', 4);
			assert.equal(word, 'foo', 'Should have found word foo');
		},
		/***/
		test_findWord8: function() {
			var word = Finder.findWord('function(param1, param2)', 15);
			assert.equal(word, 'param1', 'Should have found word param1');
		},
		/***/
		test_findWord9: function() {
			var word = Finder.findWord('var foo.bar = function(param1, param2)', 7);
			assert.equal(word, 'foo', 'Should have found word foo');
		},
		/***/
		test_findWord10: function() {
			var word = Finder.findWord('   foo.bar = function(param1, param2)', 4);
			assert.equal(word, 'foo', 'Should have found word foo');
		},
		/***/
		test_findWord11: function() {
			var word = Finder.findWord('	foo.bar = function(param1, param2)', 2);
			assert.equal(word, 'foo', 'Should have found word foo');
		},
		/***/
		test_findNoWord1: function() {
			var word = Finder.findWord('f: function(p1, p2)', 2);
			assert.equal(word, null, 'Should have found no word');
		},
		/***/
		test_findNoWord2: function() {
			var word = Finder.findWord('f: function(p1, p2)', 15);
			assert.equal(word, null, 'Should have found no word');
		},
		/***/
		test_findNoWord3: function() {
			var word = Finder.findWord('f: function(p1) {', 16);
			assert.equal(word, null, 'Should have found no word');
		},
		/***/
		test_findNoWord4: function() {
			var word = Finder.findWord('f: function(p1) {', 17);
			assert.equal(word, null, 'Should have found no word');
		},
		/***/
		test_findNoWord5: function() {
			var word = Finder.findWord('f = function(p1) {', 2);
			assert.equal(word, null, 'Should have found no word');
		},
		/***/
		test_findNoWord6: function() {
			var word = Finder.findWord('f = function(p1) {', 3);
			assert.equal(word, null, 'Should have found no word');
		},
		/***/
		test_findNoWord7: function() {
			var word = Finder.findWord('var a = [1, 2]', 7);
			assert.equal(word, null, 'Should have found no word');
		},
		/***/
		test_findNoWord8: function() {
			var word = Finder.findWord('var a = [1, 2]', 14);
			assert.equal(word, null, 'Should have found no word');
		},
		/***/
		test_findNode1: function() {
			try {
				editorContext.text = "function  F1(p1, p2) {\n"+
					"\tvar out = p1;\n"+
					"};";
				return astManager.getAST(editorContext).then(function(ast) {
					var node = Finder.findNode(9, ast);
					if(!node) {
						assert.fail("Should have found a node");
					}
					else {
						assert.equal(node.type, 'FunctionDeclaration', 'Should have found a FunctionDeclaration node');
					}
				});
			}
			finally {
				tearDown();
			}
		},
		/***/
		test_findNode2: function() {
			try {
				editorContext.text = "function  F1(p1, p2) {\n"+
					"\tvar out = p1;\n"+
					"};";
				return astManager.getAST(editorContext).then(function(ast) {
					var node = Finder.findNode(12, ast);
					if(!node) {
						assert.fail("Should have found a node");
					}
					else {
						assert.equal(node.type, 'Identifier', 'Should have found a Identifier node');
					}
				});
			}
			finally {
				tearDown();
			}
		},
		/***/
		test_findNode3: function() {
			try {
				editorContext.text = "function  F1(p1, p2) {\n"+
					"\tvar out = p1;\n"+
					"};";
				return astManager.getAST(editorContext).then(function(ast) {
					var node = Finder.findNode(14, ast);
					if(!node) {
						assert.fail("Should have found a node");
					}
					else {
						assert.equal(node.type, 'Identifier', 'Should have found a Identifier node');
					}
				});
			}
			finally {
				tearDown();
			}
		},
		
		/***/
		test_findNode4: function() {
			try {
				editorContext.text = "function  F1(p1, p2) {\n"+
					"\tvar out = p1;\n"+
					"};";
				return astManager.getAST(editorContext).then(function(ast) {
					var node = Finder.findNode(28, ast);
					if(!node) {
						assert.fail("Should have found a node");
					}
					else {
						assert.equal(node.type, 'Identifier', 'Should have found a Identifier node');
					}
				});
			}
			finally {
				tearDown();
			}
		},
		/**
		 * Find a token in a broken AST
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=426399
		 */
		test_findToken1: function() {
			return astManager.getAST(setUp("(")).then(function(ast) {
				try {
					var token = Finder.findToken(0, ast.tokens);
					if(!token) {
						assert.fail("Should have found a token");
					}
					else {
						assert.equal(token.type, 'Punctuator', 'Should have found a Punctuator token');
						assert.equal(token.value, '(', 'Should have found a ( token');
					}
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token in a broken AST
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=426399
		 */
		test_findToken2: function() {
			var text = "var function f() {}";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(4, ast.tokens);
					if(!token) {
						assert.fail("Should have found a token");
					}
					else {
						assert.equal(token.type, 'Keyword', 'Should have found a Keyword token');
						assert.equal(token.value, 'function', 'Should have found a function token');
					}
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token in a broken AST
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=426399
		 */
		test_findToken3: function() {
			var text = "(var function f() {}";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(21, ast.tokens);
					if(!token) {
						assert.fail("Should have found a token");
					}
					else {
						assert.equal(token.type, 'Punctuator', 'Should have found a Punctuator token');
						assert.equal(token.value, '}', 'Should have found a } token');
					}
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token in a broken AST
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=426399
		 */
		test_findToken4: function() {
			var text = "(var function f() {}";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(1, ast.tokens);
					if(!token) {
						assert.fail("Should have found a token");
					}
					else {
						assert.equal(token.type, 'Keyword', 'Should have found a Keyword token');
						assert.equal(token.value, 'var', 'Should have found a var token');
					}
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token in a broken AST
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=426399
		 */
		test_findToken5: function() {
			var text = "var foo.baz / = 43;";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(12, ast.tokens);
					if(!token) {
						assert.fail("Should have found a token");
					}
					else {
						assert.equal(token.type, 'Punctuator', 'Should have found a Punctuator token');
						assert.equal(token.value, '/', 'Should have found a / token');
					}
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token in a broken AST
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=426399
		 */
		test_findToken6: function() {
			var text = "var foo.baz / = 43;";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(1, ast.tokens);
					if(!token) {
						assert.fail("Should have found a token");
					}
					else {
						assert.equal(token.type, 'Keyword', 'Should have found a Keyword token');
						assert.equal(token.value, 'var', 'Should have found a var token');
					}
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token in a broken AST
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=426399
		 */
		test_findToken7: function() {
			var text = "var function f1() {";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(7, ast.tokens);
					if(!token) {
						assert.fail("Should have found a token");
					}
					else {
						assert.equal(token.type, 'Keyword', 'Should have found a Keyword token');
						assert.equal(token.value, 'function', 'Should have found a function token');
					}
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token in a broken AST
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=426399
		 */
		test_findToken8: function() {
			var text = "var function f1() {";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(7, ast.tokens);
					if(!token) {
						assert.fail("Should have found a token");
					}
					else {
						assert.equal(token.type, 'Keyword', 'Should have found a Keyword token');
						assert.equal(token.value, 'function', 'Should have found a function token');
					}
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token in a broken AST
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=426399
		 */
		test_findToken9: function() {
			var text = "(var function f() {}";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(-1, ast.tokens);
					assert.equal(token, null, "Should not have found a token for out of range");
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token in a correct AST
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=426399
		 */
		test_findToken10: function() {
			var text = "function f() {}";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(9, ast.tokens);
					if(!token) {
						assert.fail("Should have found a token");
					}
					else {
						assert.equal(token.type, 'Identifier', 'Should have found an Identifier token');
						assert.equal(token.value, 'f', 'Should have found a f token');
					}
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token in a broken AST
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=426399
		 */
		test_findToken11: function() {
			var text = "var foo = {}";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(8, ast.tokens);
					if(!token) {
						assert.fail("Should have found a token");
					}
					else {
						assert.equal(token.type, 'Punctuator', 'Should have found an Punctuator token');
						assert.equal(token.value, '=', 'Should have found a = token');
					}
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token in a broken AST
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=426399
		 */
		test_findToken12: function() {
			var text = "var foo = {f: function() {}}";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(11, ast.tokens);
					if(!token) {
						assert.fail("Should have found a token");
					}
					else {
						assert.equal(token.type, 'Identifier', 'Should have found an Identifier token');
						assert.equal(token.value, 'f', 'Should have found a f token');
					}
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token in a broken AST
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=426399
		 */
		test_findToken13: function() {
			var text = "var foo = {f: function() {}}";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(14, ast.tokens);
					if(!token) {
						assert.fail("Should have found a token");
					}
					else {
						assert.equal(token.type, 'Keyword', 'Should have found an Keyword token');
						assert.equal(token.value, 'function', 'Should have found a function token');
					}
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token in a broken AST
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=426399
		 */
		test_findToken14: function() {
			var text = "var foo = {f: function() {}}";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(18, ast.tokens);
					if(!token) {
						assert.fail("Should have found a token");
					}
					else {
						assert.equal(token.type, 'Keyword', 'Should have found an Keyword token');
						assert.equal(token.value, 'function', 'Should have found a function token');
					}
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token in a broken AST
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=426399
		 */
		test_findToken15: function() {
			var text = "var foo = {f: function() {}}";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(23, ast.tokens);
					if(!token) {
						assert.fail("Should have found a token");
					}
					else {
						assert.equal(token.type, 'Punctuator', 'Should have found an Punctuator token');
						assert.equal(token.value, ')', 'Should have found a ) token');
					}
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token in an AST with copious whitespace
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427931
		 */
		test_findToken16: function() {
			var text = "var   foo = {f: function() {}}";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(4, ast.tokens);
					assert.equal(null, token, 'Should not have found a token');
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token in an AST with copious whitespace
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427931
		 */
		test_findToken17: function() {
			var text = "var   foo = {f: function() {}}";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(5, ast.tokens);
					assert.equal(null, token, 'Should not have found a token');
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token in an AST with copious whitespace
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427931
		 */
		test_findToken18: function() {
			var text = "var foo = {  f: function() {}}";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(12, ast.tokens);
					assert.equal(null, token, 'Should not have found a token');
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token in an AST with copious whitespace
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427931
		 */
		test_findToken19: function() {
			var text = "var foo = {f:   function() {}}";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(14, ast.tokens);
					assert.equal(null, token, 'Should not have found a token');
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token in an AST with copious whitespace
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427931
		 */
		test_findToken20: function() {
			var text = "var foo = {f:   function() {}}";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(15, ast.tokens);
					assert.equal(null, token, 'Should not have found a token');
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token in an AST with copious whitespace
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427931
		 */
		test_findToken21: function() {
			var text = "  var foo = {f: function() {}}";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(1, ast.tokens);
					assert.equal(null, token, 'Should not have found a token');
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token in an AST with copious whitespace
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427931
		 */
		test_findToken22: function() {
			var text = "  var foo = {f:   function() {}}";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(0, ast.tokens);
					assert.equal(null, token, 'Should not have found a token');
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token in an AST with copious whitespace
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427931
		 */
		test_findToken23: function() {
			var text = "function f3(  foo   ,   bar   , baz) {};";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(17, ast.tokens);
					if(!token) {
						assert.fail('Should have found a token');
					}
					else {
						assert.equal(token.type, 'Identifier', 'Should have found an Identifier token');
						assert.equal(token.value, 'foo', 'Should have found a foo token');
					}
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a comment
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=426033
		 */
		test_findComment1: function() {
			var text = "/***/var foo = {f: function() {}}";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var comment = Finder.findComment(0, ast);
					if(!comment) {
						assert.fail("Should have found a comment");
					}
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a comment
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=426033
		 */
		test_findComment2: function() {
			var text = "/***/var foo = {f: function() {}}";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var comment = Finder.findComment(4, ast);
					if(!comment) {
						assert.fail("Should have found a comment");
					}
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a comment
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=426033
		 */
		test_findComment3: function() {
			var text = "var foo = {/***/f: function() {}}";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var comment = Finder.findComment(11, ast);
					if(!comment) {
						assert.fail("Should have found a comment");
					}
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a comment
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=426033
		 */
		test_findComment4: function() {
			var text = "var foo = {/***/f: function() {}}";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var comment = Finder.findComment(14, ast);
					if(!comment) {
						assert.fail("Should have found a comment");
					}
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a comment
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=426033
		 */
		test_findComment5: function() {
			var text = "/***/function f() {/***/};";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var comment = Finder.findComment(19, ast);
					if(!comment) {
						assert.fail("Should have found a comment");
					}
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a comment
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=426033
		 */
		test_findComment6: function() {
			var text = "/***/function f() {/***/};/***/";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var comment = Finder.findComment(26, ast);
					if(!comment) {
						assert.fail("Should have found a comment");
					}
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token with a bogus offset
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427141
		 */
		test_findTokenBadOffset1: function() {
			var text = "if(()) {};";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(-1, ast);
					assert.equal(token, null, "Should not have found a token for a negative offset");
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token with a bogus offset
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427141
		 */
		test_findTokenBadOffset2: function() {
			var text = "if(()) {};";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(null, ast);
					assert.equal(token, null, "Should not have found a token for a null offset");
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a token with a bogus offset
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427141
		 */
		test_findTokenBadOffset3: function() {
			var text = "if(()) {};";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findToken(undefined, ast);
					assert.equal(token, null, "Should not have found a token for an undefined offset");
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a node with a bogus offset
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427141
		 */
		test_findNodeBadOffset1: function() {
			var text = "if(()) {};";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findNode(null, ast);
					assert.equal(token, null, "Should not have found a node for a null offset");
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a node with a bogus offset
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427141
		 */
		test_findNodeBadOffset2: function() {
			var text = "if(()) {};";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findNode(-1, ast);
					assert.equal(token, null, "Should not have found a node for a negative offset");
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Find a node with a bogus offset
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427141
		 */
		test_findNodeBadOffset3: function() {
			var text = "if(()) {};";
			return astManager.getAST(setUp(text)).then(function(ast) {
				try {
					var token = Finder.findNode(undefined, ast);
					assert.equal(token, null, "Should not have found a node for an undefined offset");
				}
				finally {
					astManager.updated();
				}
			});
		},
		
		/**
		 * Tests the support for finding script blocks in HTML
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=430299
		 */
		test_findScriptBlock1: function() {
			var text = "<!DOCTYPE html><head><script>function f() {}</script></head><html></html>";
			var blocks = Finder.findScriptBlocks(text);
			assert.equal(blocks.length, 1, "Should have found one script block");
			assert.equal(blocks[0].offset, 29);
			assert.equal(blocks[0].text, 'function f() {}');
		},
		
		/**
		 * Tests the support for finding script blocks in HTML
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=430299
		 */
		test_findScriptBlock2: function() {
			var text = "<!DOCTYPE html><head><scriPt>function f() {}</script></head><html></html>";
			var blocks = Finder.findScriptBlocks(text);
			assert.equal(blocks.length, 1, "Should have found one script block");
			assert.equal(blocks[0].offset, 29);
			assert.equal(blocks[0].text, 'function f() {}');
		},
		
		/**
		 * Tests the support for finding script blocks in HTML
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=430299
		 */
		test_findScriptBlock3: function() {
			var text = "<!DOCTYPE html><head><script>function f() {}</scriPt></head><html></html>";
			var blocks = Finder.findScriptBlocks(text);
			assert.equal(blocks.length, 1, "Should have found one script block");
			assert.equal(blocks[0].offset, 29);
			assert.equal(blocks[0].text, 'function f() {}');
		},
		
		/**
		 * Tests the support for finding script blocks in HTML
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=430299
		 */
		test_findScriptBlock4: function() {
			var text = "<!DOCTYPE html><head><scRipt>function f() {}</scripT></head><html></html>";
			var blocks = Finder.findScriptBlocks(text);
			assert.equal(blocks.length, 1, "Should have found one script block");
			assert.equal(blocks[0].offset, 29);
			assert.equal(blocks[0].text, 'function f() {}');
		},
		
		/**
		 * Tests the support for finding script blocks in HTML
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=430299
		 */
		test_findScriptBlock5: function() {
			var text = "<!DOCTYPE html><head><scriPt   >function f() {}</scRIpt></head><html></html>";
			var blocks = Finder.findScriptBlocks(text);
			assert.equal(blocks.length, 1, "Should have found one script block");
			assert.equal(blocks[0].offset, 32);
			assert.equal(blocks[0].text, 'function f() {}');
		},
		
		/**
		 * Tests the support for finding script blocks in HTML
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=430299
		 */
		test_findScriptBlockMulti1: function() {
			var text = "<!DOCTYPE html><head><script>function f() {}</script><script>function f() {}</script></head><html></html>";
			var blocks = Finder.findScriptBlocks(text);
			assert.equal(blocks.length, 2, "Should have found two script blocks");
			assert.equal(blocks[0].offset, 29);
			assert.equal(blocks[0].text, 'function f() {}');
			assert.equal(blocks[1].offset, 61);
			assert.equal(blocks[1].text, 'function f() {}');
		},
		
		/**
		 * Tests the support for finding script blocks in HTML
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=430299
		 */
		test_findScriptBlockMulti2: function() {
			var text = "<!DOCTYPE html><head><scrIpt>function f() {}</script><scRipt>function f() {}</script></head><html></html>";
			var blocks = Finder.findScriptBlocks(text);
			assert.equal(blocks.length, 2, "Should have found two script blocks");
			assert.equal(blocks[0].offset, 29);
			assert.equal(blocks[0].text, 'function f() {}');
			assert.equal(blocks[1].offset, 61);
			assert.equal(blocks[1].text, 'function f() {}');
		},
		
		/**
		 * Tests the support for finding script blocks in HTML
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=430299
		 */
		test_findScriptBlockMulti3: function() {
			var text = "<!DOCTYPE html><head><scripT>function f() {}</scriPt><scRipt>function f() {}</Script></head><html></html>";
			var blocks = Finder.findScriptBlocks(text);
			assert.equal(blocks.length, 2, "Should have found two script blocks");
			assert.equal(blocks[0].offset, 29);
			assert.equal(blocks[0].text, 'function f() {}');
			assert.equal(blocks[1].offset, 61);
			assert.equal(blocks[1].text, 'function f() {}');
		},
		
		/**
		 * Tests the support for finding script blocks in HTML
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=430299
		 */
		test_findScriptBlockMulti4: function() {
			var text = "<!DOCTYPE html><head><script >function f() {}</script><script  >function f() {}</script></head><html></html>";
			var blocks = Finder.findScriptBlocks(text);
			assert.equal(blocks.length, 2, "Should have found two script blocks");
			assert.equal(blocks[0].offset, 30);
			assert.equal(blocks[0].text, 'function f() {}');
			assert.equal(blocks[1].offset, 64);
			assert.equal(blocks[1].text, 'function f() {}');
		},
		
		/**
		 * Tests the support for finding script blocks in HTML
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=430299
		 */
		test_findScriptBlockMultiWithOffset1: function() {
			var text = "<!DOCTYPE html><head><script >function f() {}</script><script  >function f() {}</script></head><html></html>";
			var blocks = Finder.findScriptBlocks(text, 39);
			assert.equal(blocks.length, 1, "Should have found one script block");
			assert.equal(blocks[0].offset, 30);
			assert.equal(blocks[0].text, 'function f() {}');
		},
		/**
		 * Tests the support for finding script blocks in HTML
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=430299
		 */
		test_findScriptBlockMultiWithOffset2: function() {
			var text = "<!DOCTYPE html><head><script >function f() {}</script><script  >function f() {}</script></head><html></html>";
			var blocks = Finder.findScriptBlocks(text, 71);
			assert.equal(blocks.length, 1, "Should have found one script block");
			assert.equal(blocks[0].offset, 64);
			assert.equal(blocks[0].text, 'function f() {}');
		},
		
		/**
		 * Tests the support for finding script blocks in HTML
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=430299
		 */
		test_findScriptBlockWithOffset1: function() {
			var text = "<!DOCTYPE html><head><script >function f() {}</script></head><html></html>";
			var blocks = Finder.findScriptBlocks(text, 39);
			assert.equal(blocks.length, 1, "Should have found one script block");
			assert.equal(blocks[0].offset, 30);
			assert.equal(blocks[0].text, 'function f() {}');
		},
		
		/**
		 * Tests the support for finding script blocks in HTML with postamble text
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=433263
		 */
		test_findScriptBlockWithSpacePostamble1: function() {
			var text = "<!DOCTYPE html><head><script type='javascript'>function f() {}</script></head><html></html>";
			var blocks = Finder.findScriptBlocks(text, 48);
			assert.equal(blocks.length, 1, "Should have found one script block");
			assert.equal(blocks[0].offset, 47);
			assert.equal(blocks[0].text, 'function f() {}');
		},
		
		/**
		 * Tests the support for finding script blocks in HTML with postamble text
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=433263
		 */
		test_findScriptBlockWithSpacePostamble2: function() {
			var text = "<!DOCTYPE html><head><script type=javascript  >function f() {}</script></head><html></html>";
			var blocks = Finder.findScriptBlocks(text, 48);
			assert.equal(blocks.length, 1, "Should have found one script block");
			assert.equal(blocks[0].offset, 47);
			assert.equal(blocks[0].text, 'function f() {}');
		},
		
		/**
		 * Tests the support for finding script blocks in HTML with postamble text
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=433263
		 */
		test_findScriptBlockWithSpacePostamble3: function() {
			var text = "<!DOCTYPE html><head><script source=foo bar  >function f() {}</script></head><html></html>";
			var blocks = Finder.findScriptBlocks(text, 47);
			assert.equal(blocks.length, 1, "Should have found one script block");
			assert.equal(blocks[0].offset, 46);
			assert.equal(blocks[0].text, 'function f() {}');
		},
		
		/**
		 * Tests the support for finding script blocks in HTML with postamble text
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=433263
		 */
		test_findScriptBlockWithSpacePostamble4: function() {
			var text = "<!DOCTYPE html><head><script source=foo bar  >function f() {}</script type='javascript' ></head><html></html>";
			var blocks = Finder.findScriptBlocks(text, 47);
			assert.equal(blocks.length, 1, "Should have found one script block");
			assert.equal(blocks[0].offset, 46);
			assert.equal(blocks[0].text, 'function f() {}');
		},
		
		/**
		 * Tests the support for finding script blocks in HTML with postamble text
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=433263
		 */
		test_findScriptBlockWithSpacePostamble5: function() {
			var text = "<!DOCTYPE html><head><script source=foo bar  >function f() {}</script type=javascript ></head><html></html>";
			var blocks = Finder.findScriptBlocks(text, 47);
			assert.equal(blocks.length, 1, "Should have found one script block");
			assert.equal(blocks[0].offset, 46);
			assert.equal(blocks[0].text, 'function f() {}');
		},
		
		/**
		 * Tests the support for finding script blocks in HTML with postamble text
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=433263
		 */
		test_findScriptBlockWithSpacePostamble6: function() {
			var text = "<!DOCTYPE html><head><script source=foo bar  >function f() {}</script type= javas cript ></head><html></html>";
			var blocks = Finder.findScriptBlocks(text, 47);
			assert.equal(blocks.length, 1, "Should have found one script block");
			assert.equal(blocks[0].offset, 46);
			assert.equal(blocks[0].text, 'function f() {}');
		},
		
		/**
		 * Tests the support for finding script blocks in HTML with postamble text
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=433263
		 */
		test_findScriptBlockWithSpacePostamble7: function() {
			var text = "<!DOCTYPE html><head>< script source=foo bar  >function f() {}</script type= javas cript ></head><html></html>";
			var blocks = Finder.findScriptBlocks(text, 48);
			assert.equal(blocks.length, 1, "Should have found one script block");
			assert.equal(blocks[0].offset, 47);
			assert.equal(blocks[0].text, 'function f() {}');
		},
		
		/**
		 * Tests the support for finding script blocks in HTML with postamble text
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=433263
		 */
		test_findScriptBlockWithSpacePostamble8: function() {
			var text = "<!DOCTYPE html><head><   scrIpt source=foo bar  >function f() {}</script type= javas cript ></head><html></html>";
			var blocks = Finder.findScriptBlocks(text, 50);
			assert.equal(blocks.length, 1, "Should have found one script block");
			assert.equal(blocks[0].offset, 49);
			assert.equal(blocks[0].text, 'function f() {}');
		},
		
		/**
		 * Tests the support for finding script blocks in HTML with postamble text
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=433263
		 */
		test_findScriptBlockWithSpacePostamble9: function() {
			var text = "<!DOCTYPE html><head><script source=foo bar  >function f() {}<   /scrIpt type= javas cript ></head><html></html>";
			var blocks = Finder.findScriptBlocks(text, 47);
			assert.equal(blocks.length, 1, "Should have found one script block");
			assert.equal(blocks[0].offset, 46);
			assert.equal(blocks[0].text, 'function f() {}');
		},
		
		/**
		 * Tests the support for finding script blocks in HTML with postamble text
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=433263
		 */
		test_findNoScriptBlockWithSpacePostamble1: function() {
			var text = "<!DOCTYPE html><head><script <source=foo bar  >function f() {}</script type= javas cript ></head><html></html>";
			var blocks = Finder.findScriptBlocks(text, 39);
			assert.equal(blocks.length, 0, "Should not have found any script blocks");
		},
		
		/**
		 * Tests the support for finding script blocks in HTML with postamble text
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=433263
		 */
		test_findNoScriptBlockWithSpacePostamble2: function() {
			var text = "<!DOCTYPE html><head><script source=foo bar  > source='js'>function f() {}</script type= javas cript ></head><html></html>";
			var blocks = Finder.findScriptBlocks(text, 39);
			assert.equal(blocks.length, 0, "Should not have found any script blocks");
		}
	};
	
	return Tests;
});
