/*******************************************************************************
 * @license
 * Copyright (c) 2013, 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env node, mocha, amd*/
define([
	'eslint',
	'estraverse',
	'chai/chai',
	'mocha/mocha' //not a module, leave at the end
], function(eslint, Estraverse, chai) {
	var assert = chai.assert;
	
	if(!Estraverse.VisitorKeys.RecoveredNode) {
	    Estraverse.VisitorKeys.RecoveredNode = []; //ignore it, normally set up when JS loads
	}
	
	describe('ESLint Rule Tests', function() {
// CURLY ---------------------------------------------
    	describe('curly', function() {
    	    var RULE_ID = 'curly';
    		it("should flag if statement", function() {
    			var topic = "if (a == b) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Statement should be enclosed in braces.");
    			assert.equal(messages[0].node.type, "VariableDeclaration");
    		});
    		it("should flag else", function() {
    			var topic = "if (a != b) {} else var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Statement should be enclosed in braces.");
    			assert.equal(messages[0].node.type, "VariableDeclaration");
    		});
    		it("should flag while", function() {
    			var topic = "while(true) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Statement should be enclosed in braces.");
    			assert.equal(messages[0].node.type, "VariableDeclaration");
    		});
    		it("should flag for", function() {
    			var topic = "for(true;;) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Statement should be enclosed in braces.");
    			assert.equal(messages[0].node.type, "VariableDeclaration");
    		});
    		it("should flag for-in", function() {
    			var topic = "var o = {}; for(var p in o) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Statement should be enclosed in braces.");
    			assert.equal(messages[0].node.type, "VariableDeclaration");
    		});
    		it("should flag with", function() {
    			var topic = "with(f) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Statement should be enclosed in braces.");
    			assert.equal(messages[0].node.type, "VariableDeclaration");
    		});
    		it("should flag do-while", function() {
    			var topic = "do var i = 1; while(true)";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Statement should be enclosed in braces.");
    			assert.equal(messages[0].node.type, "VariableDeclaration");
    		});
    		it("should not flag with with block", function() {
    			var topic = "with(f) {var i = 1;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag do-while with block", function() {
    			var topic = "do {var i = 1;} while(true)";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag if with block", function() {
    			var topic = "if (a != null) {var i = 1;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag else with block", function() {
    			var topic = "if (null != a) {} else {var i = 1;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag != for undefined check RHS", function() {
    			var topic = "if (a != undefined) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag while with block", function() {
    			var topic = "while(true) {var i = 1;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag for with block", function() {
    			var topic = "for(true;;) {var i = 1;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag for-in with block", function() {
    			var topic = "var o = {}; for(var p in o) {var i = 1;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		
    		it("should not flag else-if with no block", function() {
    			var topic = "if(true) {var i = 1;}else if(false) {var t = 8;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    	});
//EQEQEQ ---------------------------------------------
    	describe('eqeqeq', function() {
    	    var RULE_ID = "eqeqeq";
    		it("should flag ==", function() {
    			var topic = "if (a == b) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Expected '===' and instead saw '=='.");
    			assert.equal(messages[0].node.type, "BinaryExpression");
    		});
    		it("should flag !=", function() {
    			var topic = "if (a != b) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Expected '!==' and instead saw '!='.");
    			assert.equal(messages[0].node.type, "BinaryExpression");
    		});
    		it("should not flag ===", function() {
    			var topic = "if (a === b) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag !==", function() {
    			var topic = "if (a !== b) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should indicate the problematic operator in 'related' token", function() {
    			var topic = "if (2 == 1) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].related.type, "Punctuator");
    			assert.equal(messages[0].related.value, "==");
    		});
    		//nullness checks
    		it("should not flag != for null check RHS", function() {
    			var topic = "if (a != null) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag != for null check LHS", function() {
    			var topic = "if (null != a) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag != for undefined check RHS", function() {
    			var topic = "if (a != undefined) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag != for null check LHS", function() {
    			var topic = "if (undefined != a) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    	});
   
// MISSING-DOC DECL------------------------------------------------
    	describe("missing-doc - function declaration", function() {
    	    var RULE_ID = "missing-doc";
        	var flagDecl = { rules: {} };
        	flagDecl.rules[RULE_ID] = [1, {decl: 1}];
			it("should not flag for root function declaration", function() {
				var topic = "var v;\n/**foo*/function f() {};";
		
				var config = flagDecl;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 0);
			});
			it("should not flag for excessive white space", function() {
				var topic = "var v;\n/**foo*/\n\n\nfunction f() {};";
		
				var config = flagDecl;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 0);
			});
			it("should flag for line comment", function() {
				var topic = "var v;\n//foo\nfunction f() {};";
		
				var config = flagDecl;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 1);
				assert.equal(messages[0].ruleId, RULE_ID);
				assert.equal(messages[0].message, "Missing documentation for function \'f\'.");
				assert.equal(messages[0].node.type, "Identifier");
			});
			it("should flag for excessive space with line comment", function() {
				var topic = "var v;\n//foo\n\n\n\nfunction f() {};";
		
				var config = flagDecl;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 1);
				assert.equal(messages[0].ruleId, RULE_ID);
				assert.equal(messages[0].message, "Missing documentation for function \'f\'.");
				assert.equal(messages[0].node.type, "Identifier");
			});
			it("should not flag for inner block comment", function() {
				var topic = "var v;\n/***/function o() {/***/function f() {};};";
		
				var config = flagDecl;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 0);
			});
			it("should not flag for excessive space with inner block comment", function() {
				var topic = "var v;\n/***/function o() {/***/\n\n\n\nfunction f() {};};";
		
				var config = flagDecl;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 0);
			});
			it("should flag for inner line comment", function() {
				var topic = "var v;\n/***/function o() {//foo\nfunction f() {};};";
		
				var config = flagDecl;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 1);
				assert.equal(messages[0].ruleId, RULE_ID);
				assert.equal(messages[0].message, "Missing documentation for function \'f\'.");
				assert.equal(messages[0].node.type, "Identifier");
			});
			it("should flag for excessive space with inner line comment", function() {
				var topic = "var v;\n/***/function o() {//foo\n\n\n\nfunction f() {};};";
		
				var config = flagDecl;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 1);
				assert.equal(messages[0].ruleId, RULE_ID);
				assert.equal(messages[0].message, "Missing documentation for function \'f\'.");
				assert.equal(messages[0].node.type, "Identifier");
			});
			it("should flag for function f", function() {
				var topic = "var foo;\nfunction f() {};";
		
				var config = flagDecl;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 1);
				assert.equal(messages[0].ruleId, RULE_ID);
				assert.equal(messages[0].message, "Missing documentation for function \'f\'.");
				assert.equal(messages[0].node.type, "Identifier");
			});
			it("should flag for inner function declaration", function() {
				var topic = "var foo;\n/***/\nfunction o() {\nfunction f() {}; };";
		
				var config = flagDecl;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 1);
				assert.equal(messages[0].ruleId, RULE_ID);
				assert.equal(messages[0].message, "Missing documentation for function \'f\'.");
				assert.equal(messages[0].node.type, "Identifier");
			});
			it("should flag for root node", function() {
				/**
				 * This test covers the Estraverse bug:
				 * https://github.com/Constellation/estraverse/issues/20
				 * 
				 * Fixed with https://bugs.eclipse.org/bugs/show_bug.cgi?id=434994
				 * we no longer require Estraverse to attach comments
				 */
				var topic = "/***/function f() {};";
		
				var config = flagDecl;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 0);
				/*assert.equal(messages[0].ruleId, RULE_ID);
				assert.equal(messages[0].message, "Missing documentation for function \'f\'");
				assert.equal(messages[0].node.type, "Identifier");*/
			});
			it("should flag should include {type: 'decl'} as related object", function() {
				var topic = "var foo;\nfunction f() {};";

				var config = flagDecl;

				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 1);
				assert.equal(messages[0].related.type, "decl");
			});
			/**
			 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=457044
			 */
			it("should flag with preceding line comment", function() {
				var topic = "var foo; //line comment \nfunction f() {};";

				var config = flagDecl;

				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 1);
				assert.equal(messages[0].related.type, "decl");
			});
    	});
    	
// MISSING-DOC EXPR    
    	describe("missing-doc - function expression", function() {
    	    var RULE_ID = "missing-doc";
        	var flagDecl = { rules: {} };
        	var flagExpr = { rules: {} };
        	flagDecl.rules[RULE_ID] = [1, {decl: 1}];
        	flagExpr.rules[RULE_ID] = [1, {expr: 1}];
        	
			it("should not flag for object property function expression", function() {
				var topic = "var foo = {/**foo*/f: function() {}};";
		
				var config = flagExpr;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 0);
			});
			it("should not flag for excessive white space", function() {
				var topic = "var foo = {/**foo*/\n\n\n\nf: function() {}};";
		
				var config = flagExpr;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 0);
			});
			it("should flag for line comment", function() {
				var topic = "var foo = {//foo\nf: function() {}};";
		
				var config = flagExpr;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 1);
				assert.equal(messages[0].ruleId, RULE_ID);
				assert.equal(messages[0].message, "Missing documentation for function \'f\'.");
				assert.equal(messages[0].node.type, "Identifier");
			});
			it("should flag for excessive space with line comment", function() {
				var topic = "var foo = {//foo\n\n\n\n\n\nf: function() {}};";
		
				var config = flagExpr;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 1);
				assert.equal(messages[0].ruleId, RULE_ID);
				assert.equal(messages[0].message, "Missing documentation for function \'f\'.");
				assert.equal(messages[0].node.type, "Identifier");
			});
			it("should not flag for inner block comment", function() {
				var topic = "var foo = {/**foo*/o: function() { var bar = { /***/f: function() {}}}};";
		
				var config = flagExpr;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 0);
			});
			it("should not flag for excessive space with inner block comment", function() {
				var topic = "var foo = {/**foo*/o: function() { var bar = { /***/\n\n\n\n\nf: function() {}}}};";
		
				var config = flagExpr;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 0);
			});
			it("should flag for inner line comment", function() {
				var topic = "var foo = {/**foo*/o: function() { var bar = { //foo\nf: function() {}}}};";
		
				var config = flagDecl;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 1);
				assert.equal(messages[0].ruleId, RULE_ID);
				assert.equal(messages[0].message, "Missing documentation for function \'f\'.");
				assert.equal(messages[0].node.type, "Identifier");
			});
			it("should flag for excessive space with inner line comment", function() {
				var topic = "var foo = {/**foo*/o: function() { var bar = { //foo\n\n\n\n\n\nf: function() {}}}};";
		
				var config = flagDecl;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 1);
				assert.equal(messages[0].ruleId, RULE_ID);
				assert.equal(messages[0].message, "Missing documentation for function \'f\'.");
				assert.equal(messages[0].node.type, "Identifier");
			});
			it("should not flag for member expression assignment", function() {
				var topic = "var Foo; /***/Foo.bar = function() {};";
		
				var config = flagDecl;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 0);
			});
			it("should not flag for member literal expression assignment", function() {
				var topic = "var Foo; /***/Foo[\'bar\'] = function() {};";
		
				var config = flagDecl;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 0);
			});
			it("should not flag for member expression assignment excessive space", function() {
				var topic = "var Foo; /***/\n\n\n\n\nFoo.bar = function() {};";
		
				var config = flagDecl;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 0);
			});
			it("should not flag for member literal expression assignment excessive space", function() {
				var topic = "var Foo; /***/\n\n\n\n\nFoo[\'bar\'] = function() {};";
		
				var config = flagDecl;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 0);
			});
			it("should flag for member expression assignment line comment", function() {
				var topic = "var Foo; //comment\nFoo.bar = function() {};";
		
				var config = flagDecl;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 1);
				assert.equal(messages[0].ruleId, RULE_ID);
				assert.equal(messages[0].message, "Missing documentation for function \'bar\'.");
				assert.equal(messages[0].node.type, "Identifier");
			});
			it("should flag for member literal expression assignment line comment", function() {
				var topic = "var Foo; //comment\nFoo[\'bar\'] = function() {};";
		
				var config = flagDecl;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 1);
				assert.equal(messages[0].ruleId, RULE_ID);
				assert.equal(messages[0].message, "Missing documentation for function \'bar\'.");
				assert.equal(messages[0].node.type, "Literal");
			});
			it("should flag for member expression assignment line comment excessive space", function() {
				var topic = "var Foo; //comment\n\n\n\n\n\nFoo.bar = function() {};";
		
				var config = flagDecl;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 1);
				assert.equal(messages[0].ruleId, RULE_ID);
				assert.equal(messages[0].message, "Missing documentation for function \'bar\'.");
				assert.equal(messages[0].node.type, "Identifier");
			});
			it("should flag for member literal expression assignment line comment excessive space", function() {
				var topic = "var Foo; //comment\n\n\n\n\n\nFoo[\'bar\'] = function() {};";
		
				var config = flagDecl;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 1);
				assert.equal(messages[0].ruleId, RULE_ID);
				assert.equal(messages[0].message, "Missing documentation for function \'bar\'.");
				assert.equal(messages[0].node.type, "Literal");
			});
			it("should flag for function expression f", function() {
				var topic = "var foo = { f: function() {}};";
		
				var config = flagExpr;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 1);
				assert.equal(messages[0].ruleId, RULE_ID);
				assert.equal(messages[0].message, "Missing documentation for function \'f\'.");
				assert.equal(messages[0].node.type, "Identifier");
			});
			it("should flag for function expression member", function() {
				var topic = "var Foo; Foo.member = function() {};";
		
				var config = flagExpr;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 1);
				assert.equal(messages[0].ruleId, RULE_ID);
				assert.equal(messages[0].message, "Missing documentation for function \'member\'.");
				assert.equal(messages[0].node.type, "Identifier");
			});
			it("should flag for function expression literal member", function() {
				var topic = "var Foo; Foo[\'member\'] = function() {};";
		
				var config = flagExpr;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 1);
				assert.equal(messages[0].ruleId, RULE_ID);
				assert.equal(messages[0].message, "Missing documentation for function \'member\'.");
				assert.equal(messages[0].node.type, "Literal");
			});
			it("should flag for inner function expression", function() {
				var topic = "var foo = {/**foo*/o: function() { var bar = { f: function() {}}}};";
		
				var config = flagExpr;
		
				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 1);
				assert.equal(messages[0].ruleId, RULE_ID);
				assert.equal(messages[0].message, "Missing documentation for function \'f\'.");
				assert.equal(messages[0].node.type, "Identifier");
			});
			it("should flag with preceding line comment", function() {
				var topic = "var foo = {//line comment\n one: function() {}}";

				var config = flagDecl;

				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 1);
				assert.equal(messages[0].related.type, "expr");
			});
		});

//NEW-PARENS -------------------------------------------------------------------		
    	describe('new-parens', function() {
    	    var RULE_ID = "new-parens";
    		it("should flag new", function() {
    			var topic = "new Object";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Missing parentheses invoking constructor.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag new with non-parenthesis token next", function() {
    			var topic = "new Object;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Missing parentheses invoking constructor.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should not flag new", function() {
    			var topic = "new Object();";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag new with extra space", function() {
    			//TODO this is a bug in eslint, once we update to a newer version this has been fixed
    			var topic = "new Object    ();";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    			/*assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Missing parentheses invoking constructor.");
    			assert.equal(messages[0].node.type, "Identifier");*/
    		});
    	});
    	
//NO-CALLER ----------------------------------------------------------
    	describe('no-caller', function() {
    	    var RULE_ID = "no-caller";
    		it("should flag arguments.callee", function() {
    			var topic = "(function() { arguments.callee; }());";
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "\'arguments.callee\' is deprecated.");
    		});
    		it("should flag arguments.caller", function() {
    			var topic = "(function() { arguments.caller; }());";
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "\'arguments.caller\' is deprecated.");
    		});
    		// Tests that the node flagged is the Identifier "callee" or "caller" not the parent CallExpression
    		it("should flag the bad Identifier", function() {
    			var topic = "(function() { arguments.caller; }());";
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].node.name, "caller");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag arguments['callee']", function() {
    			var topic = "(function() { arguments['callee']; }());";
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "\'arguments.callee\' is deprecated.");
    		});
    		it("should flag arguments['caller']", function() {
    			var topic = "(function() { arguments['caller']; }());";
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "\'arguments.caller\' is deprecated.");
    		});
    		// Tests that the node flagged is the Identifier "callee" or "caller" not the parent CallExpression
    		it("should flag the bad Identifier", function() {
    			var topic = "(function() { arguments['caller']; }());";
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].node.value, "caller");
    			assert.equal(messages[0].node.type, "Literal");
    		});
    		it("should not flag arguments.{something else}", function() {
    			var topic = "(function() { arguments.fizz; }());";
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag arguments[n]", function() {
    			var topic = "(function() { arguments[0]; }());";
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		/**
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=460976
    		 */
    		it("should not flag arguments.callee outside a function", function() {
    			var topic = "var arguments = {callee: 1}; arguments.callee();";
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		/**
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=460976
    		 */
    		it("should not flag arguments.caller outside a function", function() {
    			var topic = "var arguments = {caller: 1}; arguments.caller();";
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    	});
//NO-COMMA-DANGLE ----------------------------------------
  	    describe('no-comma-dangle', function() {
    	    var RULE_ID = "no-comma-dangle";
    		it("should flag simple object", function() {
    			var topic = "var o = {one:1, two:2,}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Trailing commas in object expressions are discouraged.");
    			assert.equal(messages[0].node.type, "ObjectExpression");
    		});
    		it("should flag object param", function() {
    			var topic = "f({one:1, two:2,});";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Trailing commas in object expressions are discouraged.");
    			assert.equal(messages[0].node.type, "ObjectExpression");
    		});
    		it("should flag array expression", function() {
    			var topic = "var a = [{one:1, two:2,}];";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Trailing commas in object expressions are discouraged.");
    			assert.equal(messages[0].node.type, "ObjectExpression");
    		});
    		it("should not flag simple object", function() {
    			var topic = "var o = {one:1, two:2}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag object param", function() {
    			var topic = "f({one:1, two:2});";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag array expression", function() {
    			var topic = "var a = [{one:1, two:2}];";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    	});
//NO-COND-ASSIGN -----------------------------------------
        describe('no-cond-assign', function() {
    	    var RULE_ID = "no-cond-assign";
    		it("should flag root assign in if statement ", function() {
    			var topic = "if (a = b) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Expected a conditional expression and instead saw an assignment.");
    			assert.equal(messages[0].node.type, "AssignmentExpression");
    		});
    		it("should flag follow-on assign in if statement ", function() {
    			var topic = "if (a = b && (c = 10)) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Expected a conditional expression and instead saw an assignment.");
    			assert.equal(messages[0].node.type, "AssignmentExpression");
    		});
    		it("should flag nested assign in if statement ", function() {
    			var topic = "if ((a = b = 10)) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Expected a conditional expression and instead saw an assignment.");
    			assert.equal(messages[0].node.type, "AssignmentExpression");
    		});
    		it("should flag root assign in while statement ", function() {
    			var topic = "while (a = b) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Expected a conditional expression and instead saw an assignment.");
    			assert.equal(messages[0].node.type, "AssignmentExpression");
    		});
    		it("should flag follow-on assign in while statement ", function() {
    			var topic = "while (a = b && (c = 10)) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Expected a conditional expression and instead saw an assignment.");
    			assert.equal(messages[0].node.type, "AssignmentExpression");
    		});
    		it("should flag nested assign in while statement ", function() {
    			var topic = "while ((a = b = 10)) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Expected a conditional expression and instead saw an assignment.");
    			assert.equal(messages[0].node.type, "AssignmentExpression");
    		});
    		it("should flag root assign in do-while statement ", function() {
    			var topic = "do {} while (a = b) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Expected a conditional expression and instead saw an assignment.");
    			assert.equal(messages[0].node.type, "AssignmentExpression");
    		});
    		it("should flag follow-on assign in do-while statement ", function() {
    			var topic = "do {} while (a = b && (c = 10)) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Expected a conditional expression and instead saw an assignment.");
    			assert.equal(messages[0].node.type, "AssignmentExpression");
    		});
    		it("should flag nested assign in do-while statement", function() {
    			var topic = "do {} while ((a = b = 10)) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Expected a conditional expression and instead saw an assignment.");
    			assert.equal(messages[0].node.type, "AssignmentExpression");
    		});
    		it("should flag root assign in for statement ", function() {
    			var topic = "for(var q = 0; a = b; q++) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Expected a conditional expression and instead saw an assignment.");
    			assert.equal(messages[0].node.type, "AssignmentExpression");
    		});
    		it("should flag follow-on assign in for statement ", function() {
    			var topic = "for(var q = 0; a = b && (c = 10); q++) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Expected a conditional expression and instead saw an assignment.");
    			assert.equal(messages[0].node.type, "AssignmentExpression");
    		});
    		it("should flag nested assign in for statement", function() {
    			var topic = "for(var q = 0; (a = b = 10); q++) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Expected a conditional expression and instead saw an assignment.");
    			assert.equal(messages[0].node.type, "AssignmentExpression");
    		});
    		it("should not flag root assign in if statement if parenthesised", function() {
    			var topic = "if ((a = b)) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag follow-on assign in if statement if parenthesised ", function() {
    			var topic = "if ((a = b) && (c = 10)) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag nested assign in if statement if parenthesised", function() {
    			var topic = "if ((a = (b = 10))) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag root assign in while statement if parenthesised", function() {
    			var topic = "while ((a = b)) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag follow-on assign in while statement if parenthesised ", function() {
    			var topic = "while ((a = b) && (c = 10)) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag nested assign in while statement if parenthesised", function() {
    			var topic = "while ((a = (b = 10))) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag root assign in do-while statement if parenthesised", function() {
    			var topic = "do{}while ((a = b)) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag follow-on assign in do-while statement if parenthesised ", function() {
    			var topic = "do{}while ((a = b) && (c = 10)) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag nested assign in do-while statement if parenthesised", function() {
    			var topic = "do{}while ((a = (b = 10))) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag root assign in for statement if parenthesised", function() {
    			var topic = "for(var q = 0; (a = b); q++) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag parenthesied follow-on assign in for statement ", function() {
    			var topic = "for(var q = 0; (a = b) && (c = 10); q++) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag parenthesised nested assign in for statement", function() {
    			var topic = "for(var q = 0; (a = (b = 10)); q++) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag nested assign in function condition statement", function() {
    			var topic = "if(function(a) {f = 10;}) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		/**
    		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=456964
    		 */
    		it("should not flag infinite for statement", function() {
    			var topic = "for(;;) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    	});
//NO-CONSOLE ---------------------------------------------
        describe('no-console', function() {
    	    var RULE_ID = "no-console";
    		it("should flag console use in browser env", function() {
    			var topic = "/*eslint-env browser */ console.log('flag me')";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of console in browser-based code.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should not flag console use in node env", function() {
    			var topic = "/*eslint-env node */ console.log('flag me')";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag console use no env", function() {
    			var topic = "console.log('flag me')";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    	});
//NO-CONSTANT-CONDITION ----------------------------------
        describe('no-constant-condition', function() {
    	    var RULE_ID = "no-constant-condition";
    		it("should flag conditional statement 1", function() {
    			var topic = "var a = (0 ? 1 : 2);";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag conditional statement 2", function() {
    			var topic = "var a = ('hello' ? 1 : 2);";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag conditional statement 3", function() {
    			var topic = "var a = ({} ? 1 : 2);";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag conditional statement 4", function() {
    			var topic = "var a = (!true ? 1 : 2);";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag conditional statement 5", function() {
    			var topic = "var a = (false ? 1 : 2);";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag conditional statement 6", function() {
    			var topic = "var a = (true || false ? 1 : 2);";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag conditional statement 7", function() {
    			var topic = "var a = (function(){} ? 1 : 2);";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag while statement 1", function() {
    			var topic = "while (true) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag while statement 2", function() {
    			var topic = "while(10) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag while statement 3", function() {
    			var topic = "while(!true) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag while statement 4", function() {
    			var topic = "while(true || false) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag while statement 5", function() {
    			var topic = "while('hello') {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag while statement 6", function() {
    			var topic = "while(function(){}) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag while statement 7", function() {
    			var topic = "while({}) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag while statement 8", function() {
    			var topic = "while((a = (0 ? 1 : 2))) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag do-while statement 1", function() {
    			var topic = "do{}while (true)";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag do-while statement 2", function() {
    			var topic = "do{}while(10)";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag do-while statement 3", function() {
    			var topic = "do{}while(!true) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag do-while statement 4", function() {
    			var topic = "do{}while(true || false)";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag do-while statement 5", function() {
    			var topic = "do{}while('hello')";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag do-while statement 6", function() {
    			var topic = "do{}while(function(){})";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag do-while statement 7", function() {
    			var topic = "do{}while({})";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag for statement 1", function() {
    			var topic = "for(;true;) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag for statement 2", function() {
    			var topic = "for(;10;) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag for statement 3", function() {
    			var topic = "for(;!true;) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag for statement 4", function() {
    			var topic = "for(;true || false;) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag for statement 5", function() {
    			var topic = "for(;'hello';) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag for statement 6", function() {
    			var topic = "for(;function() {};) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag for statement 7", function() {
    			var topic = "for(;{};) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    	    it("should flag if statement 1", function() {
    			var topic = "if (true) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag if statement 2", function() {
    			var topic = "if(10) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag if statement 3", function() {
    			var topic = "if(!true) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag if statement 4", function() {
    			var topic = "if(true || false) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag if statement 5", function() {
    			var topic = "if('hello') {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag if statement 6", function() {
    			var topic = "if(function(){}) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		it("should flag if statement 7", function() {
    			var topic = "if({}) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged use of constant as a conditional expression.");
    		});
    		
    		it("should not flag do-while statement", function() {
    			var topic = "do{}while(x) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag if statement", function() {
    			var topic = "if(x) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag conditional statement", function() {
    			var topic = "var a = (x ? 1: 0);";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag for statement", function() {
    			var topic = "for(;x;){}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag while statement", function() {
    			var topic = "while(x){}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    	});
//NO-DEBUGGER --------------------------------------------
    	describe('no-debugger', function() {
    	    var RULE_ID = "no-debugger";
    		it("should flag debugger use in if", function() {
    			var topic = "if (a == b) {debugger;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "\'debugger\' statement use is discouraged.");
    			assert.equal(messages[0].node.type, "DebuggerStatement");
    		});
    		it("should flag debugger use in function decl", function() {
    			var topic = "function f() {debugger;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "\'debugger\' statement use is discouraged.");
    			assert.equal(messages[0].node.type, "DebuggerStatement");
    		});
    		it("should flag debugger use in function expr", function() {
    			var topic = "var f = function() {debugger;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "\'debugger\' statement use is discouraged.");
    			assert.equal(messages[0].node.type, "DebuggerStatement");
    		});
    		it("should flag debugger use in global", function() {
    			var topic = "debugger;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "\'debugger\' statement use is discouraged.");
    			assert.equal(messages[0].node.type, "DebuggerStatement");
    		});
    		it("should flag debugger use in case", function() {
    			var topic = "var v = 0; switch(v) {case 0: debugger; break;};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "\'debugger\' statement use is discouraged.");
    			assert.equal(messages[0].node.type, "DebuggerStatement");
    		});
    		it("should flag debugger use in object", function() {
    			var topic = "var v = {v: function() {debugger;}}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "\'debugger\' statement use is discouraged.");
    			assert.equal(messages[0].node.type, "DebuggerStatement");
    		});
    	});
    	
//NO-DUPE-KEYS ------------------------------------------------------    	
    	describe('no-dupe-keys', function() {
    	    var RULE_ID = "no-dupe-keys";
    		it("should not flag single prototypal property", function() {
    			var topic = "var o = {toString: function() {}, two: 2, one: 3}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should flag double prototypal property", function() {
    			var topic = "var o = {toString: function() {}, two: 2, \'toString\': 3}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Duplicate object key 'toString'.");
    			assert.equal(messages[0].node.type, "Property");
    		});
    		it("should not flag single literal prototypal property", function() {
    			var topic = "var o = {\'toString\': function() {}, two: 2, one: 3}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should flag double literal prototypal property", function() {
    			var topic = "var o = {\'toString\': function() {}, two: 2, toString: 3}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Duplicate object key 'toString'.");
    			assert.equal(messages[0].node.type, "Property");
    		});
    		it("should flag single dupe", function() {
    			var topic = "var o = {one: 1, two: 2, one: 3}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Duplicate object key 'one'.");
    			assert.equal(messages[0].node.type, "Property");
    		});
    		it("should flag single literal dupe", function() {
    			var topic = "var o = {\'one\': 1, two: 2, one: 3}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Duplicate object key 'one'.");
    			assert.equal(messages[0].node.type, "Property");
    		});
    		it("should flag double literal dupe", function() {
    			var topic = "var o = {\'one\': 1, two: 2, \'one\': 3}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Duplicate object key 'one'.");
    			assert.equal(messages[0].node.type, "Property");
    		});
    		it("should flag multi dupe", function() {
    			var topic = "var o = {one: 1, two: 2, one: 3, two: 4}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 2);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Duplicate object key 'one'.");
    			assert.equal(messages[0].node.type, "Property");
    			assert.equal(messages[1].ruleId, RULE_ID);
    			assert.equal(messages[1].message, "Duplicate object key 'two'.");
    			assert.equal(messages[1].node.type, "Property");
    		});
    		it("should flag multi dupe of same key", function() {
    			var topic = "var o = {one: 1, two: 2, one: 3, three: 4, one: 5}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 2);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Duplicate object key 'one'.");
    			assert.equal(messages[0].node.type, "Property");
    			assert.equal(messages[1].ruleId, RULE_ID);
    			assert.equal(messages[1].message, "Duplicate object key 'one'.");
    			assert.equal(messages[1].node.type, "Property");
    		});
    		it("should flag multi dupe of multi keys", function() {
    			var topic = "var o = {one: 1, two: 2, one: 3, two: 7, three: 4, one: 5, two: 6}";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 4);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Duplicate object key 'one'.");
    			assert.equal(messages[0].node.type, "Property");
    			assert.equal(messages[1].ruleId, RULE_ID);
    			assert.equal(messages[1].message, "Duplicate object key 'two'.");
    			assert.equal(messages[1].node.type, "Property");
    			assert.equal(messages[2].ruleId, RULE_ID);
    			assert.equal(messages[2].message, "Duplicate object key 'one'.");
    			assert.equal(messages[2].node.type, "Property");
    			assert.equal(messages[3].ruleId, RULE_ID);
    			assert.equal(messages[3].message, "Duplicate object key 'two'.");
    			assert.equal(messages[3].node.type, "Property");
    		});
			it("should not flag properties with same key, different kinds", function() {
				var topic = "var o = { set one(value){}, get one(){} };";

				var config = { rules: {} };
				config.rules[RULE_ID] = 1;

				var messages = eslint.verify(topic, config);
				assert.equal(messages.length, 0);
			});
    	});
    	
//NO-EMPTY-BLOCK ----------------------------------------------    	
    	describe('no-empty-block', function() {
    	    var RULE_ID = "no-empty-block";
    		it("should flag empty block 1", function() {
    			var topic = "if (true) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Empty block should be removed or commented.");
    			assert.equal(messages[0].node.type, "BlockStatement");
    		});
    		it("should flag empty block 2", function() {
    			var topic = "while(true) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Empty block should be removed or commented.");
    			assert.equal(messages[0].node.type, "BlockStatement");
    		});
            it("should flag empty block 3", function() {
    			var topic = "function f(a) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Empty block should be removed or commented.");
    			assert.equal(messages[0].node.type, "BlockStatement");
    		});
    		it("should flag empty block 4", function() {
    			var topic = "var f = function(a) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Empty block should be removed or commented.");
    			assert.equal(messages[0].node.type, "BlockStatement");
    		});
    		it("should flag empty block 5", function() {
    			var topic = "switch(a) {case 1: {}}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Empty block should be removed or commented.");
    			assert.equal(messages[0].node.type, "BlockStatement");
    		});
    		it("should flag empty block 6", function() {
    			var topic = "with(a) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Empty block should be removed or commented.");
    			assert.equal(messages[0].node.type, "BlockStatement");
    		});
    		it("should flag empty block 7", function() {
    			var topic = "with(a) {if(a) {}}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Empty block should be removed or commented.");
    			assert.equal(messages[0].node.type, "BlockStatement");
    		});
    		it("should not flag empty block 1", function() {
    			var topic = "with(a) {if(a) {\n//commented\n}}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag empty block 2", function() {
    			var topic = "if(a) {\n//commented\n}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag empty block 3", function() {
    			var topic = "switch(a) {case 1: {\n//commented\n}}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag empty block 4", function() {
    			var topic = "function f(a) {\n//commented\n}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag empty block 5", function() {
    			var topic = "function f(a) {\n/*commented*/\n}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    	});
    	
//NO-EVAL ---------------------------------------------------------    	
    	describe('no-eval', function() {
    	    var RULE_ID = "no-eval";
    		it("should flag eval() use in if", function() {
    			var topic = "if (a == b) {eval();}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "\'eval\' function calls are discouraged.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag eval() use in function decl", function() {
    			var topic = "function f() {eval();}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "\'eval\' function calls are discouraged.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag eval() use in function expr", function() {
    			var topic = "var f = function() {eval();}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "\'eval\' function calls are discouraged.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag eval() use in global", function() {
    			var topic = "eval();";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "\'eval\' function calls are discouraged.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag eval() use in case", function() {
    			var topic = "var v = 0; switch(v) {case 0: eval(); break;};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "\'eval\' function calls are discouraged.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag eval() use in object", function() {
    			var topic = "var v = {v: function() {eval();}}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "\'eval\' function calls are discouraged.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag setInterval() use call literal arg", function() {
    			var topic = "function setInterval() {} setInterval('code', 300);";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Implicit \'eval\' function calls are discouraged.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag setInterval() use call infer literal arg", function() {
    			var topic = "function setInterval() {} var s = 'code'; setInterval(s, 300);";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Implicit \'eval\' function calls are discouraged.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should not flag setInterval() use call non literal", function() {
    			var topic = "function setInterval() {} setInterval({}, 300);";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should flag setTimeout() use call literal arg", function() {
    			var topic = "function setTimeout() {} setTimeout('code', 300);";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Implicit \'eval\' function calls are discouraged.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag setTimeout() use call infer literal arg", function() {
    			var topic = "function setTimeout() {} var s = 'code'; setTimeout(s, 300);";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Implicit \'eval\' function calls are discouraged.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should not flag setTimeout() use call non-literal", function() {
    			var topic = "function setTimeout() {} setTimeout({}, 300);";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    	});
    	
//NO-EXTRA-SEMI -----------------------------------------------------    	
    	describe('no-extra-semi', function() {
    	    var RULE_ID = "no-extra-semi";
    		/**
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=428040
    		 */
    		it("should flag statement multi", function() {
    			var topic = "var a=1;;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Unnecessary semicolon.");
    			assert.equal(messages[0].node.type, "EmptyStatement");
    		});
    		/**
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=428040
    		 */
    		it("should flag function expresson statement multi", function() {
    			var topic = "var a = function() {};;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Unnecessary semicolon.");
    			assert.equal(messages[0].node.type, "EmptyStatement");
    		});
    		/**
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=428040
    		 */
    		it("should flag function declaration", function() {
    			var topic = "function a() {};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Unnecessary semicolon.");
    			assert.equal(messages[0].node.type, "EmptyStatement");
    		});
    		/**
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=428040
    		 */
    		it("should flag empty line", function() {
    			var topic = ";";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Unnecessary semicolon.");
    			assert.equal(messages[0].node.type, "EmptyStatement");
    		});
    		
    		//------------------------------------------------------------------------------
    		// Should nots
    		//------------------------------------------------------------------------------
    		/**
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=428040
    		 */
    		it("should not flag function expression", function() {
    			var topic = "var a = function() {};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		/**
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=428040
    		 */
    		it("should not flag expression", function() {
    			var topic = "var a = 4;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		/**
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=428040
    		 */
    		it("should not flag object expression", function() {
    			var topic = "var a = {};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    	});
    	
//NO-FALLTHROUGH --------------------------------------    	
    	describe('no-fallthrough', function() {
    	    var RULE_ID = "no-fallthrough";
    		it("should flag simple case 1", function() {
    			var topic = "switch(a) {case 1: foo; case 2: foo;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Switch case may be entered by falling through the previous case.");
    			assert.equal(messages[0].node.type, "SwitchCase");
    		});
    		it("should flag simple case 2", function() {
    			var topic = "switch(a) {case 1:{ foo;} case 2:{ foo;}}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Switch case may be entered by falling through the previous case.");
    			assert.equal(messages[0].node.type, "SwitchCase");
    		});
    		it("should flag nested case", function() {
    			var topic = "switch(a) {case 1: switch(b) {case 1: foo; case 2: foo;}}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Switch case may be entered by falling through the previous case.");
    			assert.equal(messages[0].node.type, "SwitchCase");
    		});
    		it("should flag default", function() {
    			var topic = "switch(a) {case 1: foo; default:break;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Switch case may be entered by falling through the previous case.");
    			assert.equal(messages[0].node.type, "SwitchCase");
    		});
    		/**
    		 * see https://bugs.eclipse.org/bugs/show_bug.cgi?id=461082
    		 */
    		it("should not flag block with following statements 1", function() {
    			var topic = "switch(a) {case 1:{ foo;} break; case 2:{ foo;}}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag break;", function() {
    			var topic = "switch(a) {case 1: foo; break; case 2: foo;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag throw", function() {
    			var topic = "switch(a) {case 1: foo; throw e; case 2: foo;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag continue", function() {
    			var topic = "while(c) {switch(a) {case 1: foo; continue; case 2: foo;}}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag return", function() {
    			var topic = "function f() {switch(a) {case 1: foo; return; case 2: foo;}}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag empty case 1", function() {
    			var topic = "switch(a) {case 1: case 2: foo;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag empty case 2", function() {
    			var topic = "switch(a) {case 1: {} case 2: foo;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag doc'd fallthrough 1", function() {
    			var topic = "switch(a) {case 1: foo; //$FALLTHROUGH$\ndefault:break;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		
    		it("should not flag doc'd fallthrough 2", function() {
    			var topic = "switch(a) {case 1: switch(b) {case 1: foo; //$FALLTHROUGH$\ncase 2: foo;}}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    	});
//NO-ITERATOR ----------------------------------------------------
        describe('no-iterator', function() {
    	    var RULE_ID = "no-iterator";
    		it("should flag __iterator__ 1", function() {
    			var topic = "a.__iterator__ = function() {};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged __iterator__ property use.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag __iterator__ 2", function() {
    			var topic = "a.b.c.__iterator__ = function() {};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged __iterator__ property use.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag __iterator__ 3", function() {
    			var topic = "a['__iterator__'] = function() {};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged __iterator__ property use.");
    			assert.equal(messages[0].node.type, "Literal");
    		});
    		it("should flag __iterator__ 4", function() {
    			var topic = "a.b[\"__iterator__\"] = function() {};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Discouraged __iterator__ property use.");
    			assert.equal(messages[0].node.type, "Literal");
    		});
    		
    		it("should not flag __iterator__ 1", function() {
    			var topic = "var __iterator__ = function() {};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag __iterator__ 2", function() {
    			var topic = "var a = __iterator__ = function() {};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag __iterator__ 3", function() {
    			var topic = "var a = __iterator__;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		/**
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=461461
    		 */
    		it("should not flag incomplete", function() {
    			var topic = "var o = {a: function() {this.}};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		/**
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=461461
    		 */
    		it("should not flag incomplete", function() {
    			var topic = "window.";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
        });    	
//NO-JSLINT ------------------------------------------------------    	
    	describe('no-jslint', function() {
    	    var RULE_ID = "no-jslint";
    		it("should flag jslint 1", function() {
    			var topic = "/* jslint node:true */ if (a == b) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "The 'jslint' directive is unsupported, please use eslint-env.");
    			assert.equal(messages[0].node.type, "BlockComment");
    		});
    		it("should flag jslint 2", function() {
    			var topic = "/*jslint node:true*/if (a != b) {} else var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "The 'jslint' directive is unsupported, please use eslint-env.");
    			assert.equal(messages[0].node.type, "BlockComment");
    		});
    		it("should flag jslint 3", function() {
    			var topic = "while(true) /*jslint browser:false*/ var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "The 'jslint' directive is unsupported, please use eslint-env.");
    			assert.equal(messages[0].node.type, "BlockComment");
    		});
    		it("should flag jslint 4", function() {
    			var topic = "while(true) /*JSLint browser:false*/ var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "The 'JSLint' directive is unsupported, please use eslint-env.");
    			assert.equal(messages[0].node.type, "BlockComment");
    		});
    		it("should flag jshint 1", function() {
    			var topic = "/*jshint ecma:true*/ for(true;;) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "The 'jshint' directive is unsupported, please use eslint-env.");
    			assert.equal(messages[0].node.type, "BlockComment");
    		});
    		it("should flag jshint 2", function() {
    			var topic = "var o = {}; /* jshint browser:true */ for(var p in o) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "The 'jshint' directive is unsupported, please use eslint-env.");
    			assert.equal(messages[0].node.type, "BlockComment");
    		});
    		it("should flag jshint 3", function() {
    			var topic = "var o = {}; /* JSHint browser:true */ for(var p in o) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "The 'JSHint' directive is unsupported, please use eslint-env.");
    			assert.equal(messages[0].node.type, "BlockComment");
    		});
    		it("should not flag jslint 1", function() {
    			var topic = "/*jslint */ if (a != null) {var i = 1;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag jslint 2", function() {
    			var topic = "/*jslint is not supported*/ if (null != a) {} else {var i = 1;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag jslint 3", function() {
    			var topic = "/*jslint node: false*/ if (a != undefined) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag jslint 4", function() {
    			var topic = "//jslint node:false\n if (a != undefined) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag jshint 1", function() {
    			var topic = "/*jshint */ if (a != null) {var i = 1;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag jshint 2", function() {
    			var topic = "/*jshint is not supported*/ if (null != a) {} else {var i = 1;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag jshint 3", function() {
    			var topic = "/*jshint node: false*/ if (a != undefined) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag jshint 4", function() {
    			var topic = "//jshint node:false\n if (a != undefined) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    	});
    	
//NO-NEW-ARRAY ----------------------------------------------------    	
    	describe('no-new-array', function() {
    	    var RULE_ID = "no-new-array";
    		it("flag in global scope", function() {
    			var topic = "new Array()";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Use the array literal notation '[]'.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("flag when symbol is declared in /*global block", function() {
    			var topic = "/*global Array*/ new Array();";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Use the array literal notation '[]'.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("flag in inner scope", function() {
    			var topic = "(function f() { var x = new Array(); }());";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Use the array literal notation '[]'.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    
    		it("not flag when symbol refers to in-scope var - global", function() {
    			var topic = "var Array; new Array();";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    
    		it("not flag when symbol refers to in-scope var - non-global", function() {
    			var topic = "var Array; function f() { new Array(); }";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    	});
    	
//NO-NEW-FUNC ---------------------------------------------------------    	
    	describe('no-new-func', function() {
    	    var RULE_ID = "no-new-func";
    		it("flag in global scope", function() {
    			var topic = "new Function";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "The Function constructor is eval.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("flag when symbol is declared in /*global block", function() {
    			var topic = "/*global Function*/ new Function();";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "The Function constructor is eval.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("flag in inner scope", function() {
    			var topic = "(function f() { new Function(); }());";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "The Function constructor is eval.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    
    		it("not flag when symbol refers to in-scope var - global", function() {
    			var topic = "var Function; new Function();";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    
    		it("not flag when symbol refers to in-scope var - non-global", function() {
    			var topic = "var Function; function f() { new Function(); }";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    	});
    	
//NO-NEW-OBJECT -------------------------------------------------    	
    	describe('no-new-object', function() {
    	    var RULE_ID = "no-new-object";
    		it("flag in global scope", function() {
    			var topic = "new Object";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Use the object literal notation '{}' or Object.create(null).");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("flag when symbol is declared in /*global block", function() {
    			var topic = "/*global Object*/ new Object();";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Use the object literal notation '{}' or Object.create(null).");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("flag in inner scope", function() {
    			var topic = "(function f() { new Object(); }());";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Use the object literal notation '{}' or Object.create(null).");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    
    		it("not flag when symbol refers to in-scope var - global", function() {
    			var topic = "var Object; new Object();";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    
    		it("not flag when symbol refers to in-scope var - non-global", function() {
    			var topic = "var Object; function f() { new Object(); }";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    	});
    	
//NO-NEW-WRAPPERS --------------------------------------------------------	    
    	describe('no-new-wrappers', function() {
    	    var RULE_ID = "no-new-wrappers";
    	    
    	    function assertMessages(messages) {
        		messages.forEach(function(message) {
        			assert.equal(message.ruleId, RULE_ID);
        			assert.ok(/Do not use \'\w+\' as a constructor\./.test(message.message), "Has expected message");
        			assert.equal(message.node.type, "Identifier");
        		});
        	}
    	    
    		// String Number Math Boolean JSON
    		it("flag in global scope", function() {
    			var topic = "new String; new Number; new Math; new Boolean; new JSON;";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 5);
    			assertMessages(messages);
    		});
    		it("flag when symbol is declared in /*global block", function() {
    			var topic = "/*global String Number Math Boolean JSON*/ new String; new Number; new Math; new Boolean; new JSON;";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 5);
    			assertMessages(messages);
    		});
    		it("flag in inner scope", function() {
    			var topic = "(function f() { new new String; new Number; new Math; new Boolean; new JSON; }());";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 5);
    			assertMessages(messages);
    		});
    
    		it("not flag when symbol refers to in-scope var - global", function() {
    			var topic = "var String, Number, Math, Boolean, JSON; new String; new Number; new Math; new Boolean; new JSON;";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    
    		it("not flag when symbol refers to in-scope var - non-global", function() {
    			var topic = "var String, Number, Math, Boolean, JSON; function f() { new String; new Number; new Math; new Boolean; new JSON; }";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    	});
    	
//NO-REDECLARE -------------------------------------------------------    	
    	describe('no-redeclare', function() {
    	    var RULE_ID = "no-redeclare";
    		it("should flag redeclaration in Program", function() {
    			var topic = "var a; var a;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'a' is already defined.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag redeclaration in FunctionDeclaration", function() {
    			var topic = "function f() { var g, g; }";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'g' is already defined.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag redeclaration in FunctionExpression", function() {
    			var topic = "var f = function() { var g, g; };";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'g' is already defined.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    //		it("should flag redeclaration in ArrowFuncExpr", function() {
    //			var topic = "() => { var a,b; var a; }";
    //	
    //			var config = { rules: {} };
    //			config.rules[RULE_ID] = 1;
    //	
    //			var messages = eslint.verify(topic, config);
    //			assert.equal(messages.length, 1);
    //			assert.equal(messages[0].ruleId, RULE_ID);
    //			assert.equal(messages[0].message, "'a' is already defined.");
    //			assert.equal(messages[0].node.type, "Identifier");
    //			assert.equal(messages[0].node.range[0], 23); // The 2nd 'a' is the culprit
    //		});
    
    		it("should identify the range of the redeclaration", function() {
    			var topic = "(function() { var a, b; var a; })";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].node.range[0], 28); // The 2nd 'a' is the culprit
    		});
    
    		describe("params", function() {
    			it("should flag redeclaration of param", function() {
    				var topic = "function f(a) { var a; }";
    		
    				var config = { rules: {} };
    				config.rules[RULE_ID] = 1;
    		
    				var messages = eslint.verify(topic, config);
    				assert.equal(messages.length, 1);
    				assert.equal(messages[0].ruleId, RULE_ID);
    				assert.equal(messages[0].message, "'a' is already defined.");
    				assert.equal(messages[0].node.type, "Identifier");
    			});
    		});
    
    		it("should not flag reassignment", function() {
    			var topic = "var a = 2, b; a = b = 3; ";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag assignment to upper scope var", function() {
    			var topic = "var a; function f() { a = 1; }";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    	});
//NO-REGEX-SPACES --------------------------------------------------
        describe('no-regex-spaces', function() {
            var RULE_ID = "no-regex-spaces";
            it("should flag more than one space in regex literal", function() {
                var topic = "var regex = /   .*/g;";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
    
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 1);
                assert.equal(messages[0].ruleId, RULE_ID);
                assert.equal(messages[0].message, "Avoid multiple spaces in regular expressions. Use ' {3}' instead.");
                assert.equal(messages[0].node.type, "Literal");
            });
            it("should flag more than one group of more than one space in regex literal", function() {
                var topic = "var regex = /   .*  /g;";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
    
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 2);
                assert.equal(messages[0].ruleId, RULE_ID);
                assert.equal(messages[0].message, "Avoid multiple spaces in regular expressions. Use ' {3}' instead.");
                assert.equal(messages[0].node.type, "Literal");
            });
            it("should flag more than one space in RegExp new expression literal", function() {
                var topic = "var regex = new RegExp(\"   .*\");";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
    
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 1);
                assert.equal(messages[0].ruleId, RULE_ID);
                assert.equal(messages[0].message, "Avoid multiple spaces in regular expressions. Use ' {3}' instead.");
                assert.equal(messages[0].node.type, "Literal");
            });
            it("should flag more than one group of more than one space in RegExp new expression literal", function() {
                var topic = "var regex = new RegExp(\"   .*  \");";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
    
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 2);
                assert.equal(messages[0].ruleId, RULE_ID);
                assert.equal(messages[0].message, "Avoid multiple spaces in regular expressions. Use ' {3}' instead.");
                assert.equal(messages[0].node.type, "Literal");
            });
            it("should not flag one space in regex literal", function() {
                var topic = "var regex = / .*/g;";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
    
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 0);
            });
            it("should not flag more than one group of one space in regex literal", function() {
                var topic = "var regex = / .* /g;";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
    
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 0);
            });
            it("should not flag one space in regex literal using brace notation", function() {
                var topic = "var regex = / {3}.*/g;";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
    
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 0);
            });
            it("should not flag one space in RegExp new expression literal", function() {
                var topic = "var regex = new RegExp(\" .*\");";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
    
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 0);
            });
            it("should not flag more than one group of one space in RegExp new expression literal", function() {
                var topic = "var regex = new RegExp(\" .* \");";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
    
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 0);
            });
            it("should not flag one space in RegExp new expression literal using brace notation", function() {
                var topic = "var regex = new RegExp(\" {3}.*\");";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
    
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 0);
            });
        });
//NO-RESERVED-KEYS -------------------------------------------------
        describe('no-reserved-keys', function() {
            var RULE_ID = "no-reserved-keys";
            it("should flag using public keyword", function() {
                var topic = "var a = {public:1}";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
    
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 1);
                assert.equal(messages[0].ruleId, RULE_ID);
                assert.equal(messages[0].message, "Reserved words should not be used as property keys.");
                assert.equal(messages[0].node.type, "Identifier");
            });
            it("should flag using function keyword", function() {
                var topic = "var a = {function:1}";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
    
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 1);
                assert.equal(messages[0].ruleId, RULE_ID);
                assert.equal(messages[0].message, "Reserved words should not be used as property keys.");
                assert.equal(messages[0].node.type, "Identifier");
            });
            it("should flag using for keyword", function() {
                var topic = "var a = {for:1}";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
    
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 1);
                assert.equal(messages[0].ruleId, RULE_ID);
                assert.equal(messages[0].message, "Reserved words should not be used as property keys.");
                assert.equal(messages[0].node.type, "Identifier");
            });
            it("should not flag using public keyword literal", function() {
                var topic = "var a = {'public':1}";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
    
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 0);
            });
            it("should not flag using function keyword literal", function() {
                var topic = "var a = {'function':1}";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
    
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 0);
            });
            it("should not flag using for keyword literal", function() {
                var topic = "var a = {'for':1}";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
    
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 0);
            });
        });
//NO-SHADOW --------------------------------------------------------    	
        describe('no-shadow', function() {
            var RULE_ID = "no-shadow";
            it("should flag shadowing in FunctionExpression", function() {
                var topic = "var a; (function() { var a; } ());";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
    
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 1);
                assert.equal(messages[0].ruleId, RULE_ID);
                assert.equal(messages[0].message, "'a' is already declared in the upper scope.");
                assert.equal(messages[0].node.type, "Identifier");
            });
            it("should flag shadowing in FunctionDeclaration", function() {
                var topic = "var a; function z() { var a; }";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
    
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 1);
                assert.equal(messages[0].ruleId, RULE_ID);
                assert.equal(messages[0].message, "'a' is already declared in the upper scope.");
                assert.equal(messages[0].node.type, "Identifier");
            });
    
            it("should flag the shadower's range", function() {
                var topic = "var a; (function() { var a; } ());";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
    
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 1);
                assert.equal(messages[0].ruleId, RULE_ID);
                assert.equal(messages[0].node.type, "Identifier");
                assert.equal(messages[0].node.range[0], 25); // The inner 'a' is the culprit
            });
            it("should flag variable shadowing named function from an upper scope", function() {
                var topic = "function f() { function g() { var f; } }";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
    
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 1);
                assert.equal(messages[0].ruleId, RULE_ID);
                assert.equal(messages[0].message, "'f' is already declared in the upper scope.");
                assert.equal(messages[0].node.type, "Identifier");
            });
            it("should flag named func shadowing named func", function() {
                var topic = "function f() { function f() {} }";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 1);
                assert.equal(messages[0].ruleId, RULE_ID);
                assert.equal(messages[0].message, "'f' is already declared in the upper scope.");
                assert.equal(messages[0].node.type, "Identifier");
                assert.equal(messages[0].node.range[0], 24); // The 2nd 'f' is the culprit
            });
    
            it("shadowee is FunctionExpression", function() {
                var topic = "(function() { var a; function z() {var a;} })";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
    
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 1);
                assert.equal(messages[0].ruleId, RULE_ID);
                assert.equal(messages[0].message, "'a' is already declared in the upper scope.");
                assert.equal(messages[0].node.type, "Identifier");
            });
            it("shadowee is FunctionDeclaration", function() {
                var topic = "function f() {var a; function z() {var a;} }";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
    
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 1);
                assert.equal(messages[0].ruleId, RULE_ID);
                assert.equal(messages[0].message, "'a' is already declared in the upper scope.");
                assert.equal(messages[0].node.type, "Identifier");
            });
            it("should flag var shadowing a param", function() {
                var topic = "function f(a) { function g() { var a; } }";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
    
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 1);
                assert.equal(messages[0].ruleId, RULE_ID);
                assert.equal(messages[0].message, "'a' is already declared in the upper scope.");
                assert.equal(messages[0].node.type, "Identifier");
            });
    
            it("should not flag param shadowing outer scope var", function() {
                var topic = "var a; function b(a) {}";
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 0);
            });
            it("should not flag param shadowing shadows outer scope named func", function() {
                var topic = "function f() {} function g(f) {}";
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 0);
            });
            it("should not flag param that shadows outer scope variable", function() {
                var topic = "var a; function f(a) {}";
    
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
    
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 0);
            });
        });
//NO-SHADOW-GLOBAL ------------------------------------------------
        describe('no-shadow-global', function() {
           var RULE_ID = 'no-shadow-global'; 
           it("should flag browser use 1", function() {
               var topic = "/*eslint-env browser*/ var name = 'me';";
               var config = {rules:{}};
               config.rules[RULE_ID] = 1;
               
               var messages = eslint.verify(topic, config);
			   assert.equal(messages.length, 1);
			   assert.equal(messages[0].ruleId, RULE_ID);
			   assert.equal(messages[0].message, "Variable 'name' shadows a global member");
           });
           it("should flag browser use 2", function() {
               var topic = "/*eslint-env browser*/ function f(name){}";
               var config = {rules:{}};
               config.rules[RULE_ID] = 1;
               
               var messages = eslint.verify(topic, config);
			   assert.equal(messages.length, 1);
			   assert.equal(messages[0].ruleId, RULE_ID);
			   assert.equal(messages[0].message, "Parameter 'name' shadows a global member");
           });
           it("should flag node use 1", function() {
               var topic = "/*eslint-env node*/ var require = {};";
               var config = {rules:{}};
               config.rules[RULE_ID] = 1;
               
               var messages = eslint.verify(topic, config);
			   assert.equal(messages.length, 1);
			   assert.equal(messages[0].ruleId, RULE_ID);
			   assert.equal(messages[0].message, "Variable 'require' shadows a global member");
           });
           it("should flag node use 2", function() {
               var topic = "/*eslint-env node*/ function f(module){}";
               var config = {rules:{}};
               config.rules[RULE_ID] = 1;
               
               var messages = eslint.verify(topic, config);
			   assert.equal(messages.length, 1);
			   assert.equal(messages[0].ruleId, RULE_ID);
			   assert.equal(messages[0].message, "Parameter 'module' shadows a global member");
           });
           /**
            * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=461321
            */
           it("should flag builtins use 1", function() {
               var topic = "function f(Math){}";
               var config = {rules:{}};
               config.rules[RULE_ID] = 1;
               
               var messages = eslint.verify(topic, config);
			   assert.equal(messages.length, 1);
			   assert.equal(messages[0].ruleId, RULE_ID);
			   assert.equal(messages[0].message, "Parameter 'Math' shadows a global member");
           });
           /**
            * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=461321
            */
           it("should flag builtins use 2", function() {
               var topic = "var Object;";
               var config = {rules:{}};
               config.rules[RULE_ID] = 1;
               
               var messages = eslint.verify(topic, config);
			   assert.equal(messages.length, 1);
			   assert.equal(messages[0].ruleId, RULE_ID);
			   assert.equal(messages[0].message, "Variable 'Object' shadows a global member");
           });
            it("should not flag browser use wih no env set 1", function() {
               var topic = "var name = 'me';";
               var config = {rules:{}};
               config.rules[RULE_ID] = 1;
               
               var messages = eslint.verify(topic, config);
			   assert.equal(messages.length, 0);
           });
           it("should not flag browser use with no env set 2", function() {
               var topic = "function f(name){}";
               var config = {rules:{}};
               config.rules[RULE_ID] = 1;
               
               var messages = eslint.verify(topic, config);
			   assert.equal(messages.length, 0);
           });
           it("should not flag node use without env set 1", function() {
               var topic = "var require = {};";
               var config = {rules:{}};
               config.rules[RULE_ID] = 1;
               
               var messages = eslint.verify(topic, config);
			   assert.equal(messages.length, 0);
           });
           it("should not flag browser use without env set 2", function() {
               var topic = "function f(console){}";
               var config = {rules:{}};
               config.rules[RULE_ID] = 1;
               
               var messages = eslint.verify(topic, config);
			   assert.equal(messages.length, 0);
           });
        });
//NO-SPARSE-ARRAYS ------------------------------------------------        
    	describe('no-sparse-arrays', function() {
    	    var RULE_ID = "no-sparse-arrays";
    		it("should flag proceeding comma", function() {
    			var topic = "var answer = [,1]";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Sparse array declarations should be avoided.");
    		});
    		it("should not flag trailing comma", function() {
    			var topic = "var answer = [1,]";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should flag middle comma", function() {
    			var topic = "var answer = [1,,2]";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Sparse array declarations should be avoided.");
    		});
    	});

//NO-THROW-LITERAL ---------------------------------------------------------    	
    	describe('no-throw-literal', function() {
    	    var RULE_ID = "no-throw-literal";
    		it("flag thrown Literal", function() {
    			var topic = "throw 'a'";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].node.type, "Literal");
    		});
    		it("flag thrown ObjectExpression", function() {
    			var topic = "throw {};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].node.type, "ObjectExpression");
    		});
    		it("flag thrown ArrayExpression", function() {
    			var topic = "throw [];";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].node.type, "ArrayExpression");
    		});
    		it("flag thrown 'undefined'", function() {
    			var topic = "throw undefined;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].node.name, "undefined");
    		});
    		it("flag thrown 'null'", function() {
    			var topic = "throw null;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].node.type, "Literal");
    		});
    		it("should not flag thrown Identifier", function() {
    			var topic = "throw a";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag thrown MemberExpression", function() {
    			var topic = "throw a.b";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag thrown NewExpression", function() {
    			var topic = "throw new Error()";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag thrown CallExpression", function() {
    			var topic = "throw Error()";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag thrown ConditionalExpression", function() {
    			var topic = "throw (1 ? 2 : 3);";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag thrown LogicalExpression", function() {
    			var topic = "throw 1||2;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag thrown SequenceExpression", function() {
    			var topic = "throw 1,2;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    	});

//NO-UNDEF -----------------------------------------------------    	
    	describe('no-undef', function() {
    	    var RULE_ID = "no-undef";
    		//------------------------------------------------------------------------------
    		// Test undeclared globals
    		//------------------------------------------------------------------------------
    		it("should report violation when evaluating write to undeclared global", function() {
    			var topic = "a = 1;";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'a' is not defined.");
    			assert.include(messages[0].node.type, "Identifier");
    		});
    
    		it("should report violation (undeclared global) on read of undeclared global", function() {
    			var topic = "var a = b;";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'b' is not defined.");
    			assert.include(messages[0].node.type, "Identifier");
    		});
    
    		it("should not report a violation when evaluating reference to variable defined in global scope", function() {
    			var topic = "var a = 1, b = 2; a;";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    
    		it("should report a violation when evaluating reference to undeclared global from function scope", function() {
    			var topic = "function f() { b; }";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'b' is not defined.");
    			assert.include(messages[0].node.type, "Identifier");
    		});
    
    		it("should not report a violation when evaluating reference to declared global from function scope", function() {
    			var topic = "/*global b*/ function f() { b; }";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    
    		it("should not report a violation when evaluating references to several declared globals", function() {
    			var topic = "/*global b a:false*/  a;  function f() { b; a; }";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    
    		it("should not report a violation when evaluating call to function declared at global scope", function() {
    			var topic = "function a(){}  a();";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    
    		it("should not report a violation when evaluating reference to parameter", function() {
    			var topic = "function f(b) { b; }";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    
    		// https://bugs.eclipse.org/bugs/show_bug.cgi?id=422715
    		it("should not flag declared variables as undeclared when 'eval' is used in scope", function() {
    			var topic = "(function() { var a = 1; eval(); })();";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    
    		//------------------------------------------------------------------------------
    		// Test readonly
    		//------------------------------------------------------------------------------
    		it("should not report a violation when evaluating write to an explicitly declared variable in global scope", function() {
    			var topic = "var a; a = 1; a++;";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    
    		it("should not report a violation when evaluating write to an explicitly declared variable in global scope from function scope", function() {
    			var topic = "var a; function f() { a = 1; }";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    
    		it("should not report a violationwhen evaluating write to a declared writeable global", function() {
    			var topic = "/*global b:true*/ b++;";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    
    		it("should report a violation (readonly) when evaluating write to a declared readonly global", function() {
    			var topic = "/*global b:false*/ function f() { b = 1; }";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'b' is read only.");
    			assert.include(messages[0].node.type, "Identifier");
    		});
    
    		it("should report a violation (readonly) when evaluating read+write to a declared readonly global", function() {
    			var topic = "/*global b:false*/ function f() { b++; }";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'b' is read only.");
    			assert.include(messages[0].node.type, "Identifier");
    		});
    
    		it("should report a violation (readonly) when evaluating write to a declared global that is readonly by default", function() {
    			var topic = "/*global b*/ b = 1;";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'b' is read only.");
    			assert.include(messages[0].node.type, "Identifier");
    		});
    
    		it("should report a violation (readonly) when evaluating write to a redefined global that is readonly", function() {
    			var topic = "/*global b:false*/ var b = 1;";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'b' is read only.");
    			assert.include(messages[0].node.type, "Identifier");
    		});
    
    		//------------------------------------------------------------------------------
    		// Test eslint-env browser flags
    		//------------------------------------------------------------------------------
    		it("should report a violation (undeclared global) when evaluating reference to a browser global", function() {
    			var topic = "window;";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'window' is not defined.");
    			assert.include(messages[0].node.type, "Identifier");
    		});
    
    		it("should not report a violation when evaluating reference to a browser global with 'eslint-env browser'", function() {
    			var topic = "/*eslint-env browser*/ window;";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    
    		it("should not report a violation when evaluating reference to a browser global with 'eslint-env browser'", function() {
    			var topic = "/*eslint-env browser*/ window;";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    
            //XXX This test is no bogus since eslint-env does not consider :true/:false - having it there
            //means true, left out is false
    		it("should report a violation (undeclared global) when evaluating reference to a browser global with 'eslint-env browser'", function() {
    			var topic = "/*eslint-env browser:false*/ window;";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'window' is not defined.");
    			assert.include(messages[0].node.type, "Identifier");
    		});
    
    		//------------------------------------------------------------------------------
    		// Test eslint-env node flags
    		//------------------------------------------------------------------------------
    		it("should report a violation (undeclared global) when evaluating reference to a node global", function() {
    			var topic = "require(\"a\");";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'require' is not defined.");
    			assert.include(messages[0].node.type, "Identifier");
    		});
    
    		it("should not report a violation when evaluating reference to a node global with 'eslint-env node'", function() {
    			var topic = "/*eslint-env node*/ require(\"a\");";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
            //XXX This test is no bogus since eslint-env does not consider :true/:false - having it there
            //means true, left out is false
    		it("should report a violation (undeclared global) when evaluating reference to a node global with eslint-env node:false", function() {
    			var topic = "/*eslint-env node:false*/ require(\"a\");";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'require' is not defined.");
    			assert.include(messages[0].node.type, "Identifier");
    		});
    
    		//------------------------------------------------------------------------------
    		// Test references to builtins
    		//------------------------------------------------------------------------------
    		it("should not report a violation when evaluating reference to a builtin", function() {
    			var topic = "Object; isNaN();";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    
    		it("should report a violation (readonly) when evaluating write to a builtin", function() {
    			var topic = "Array = 1;";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'Array' is read only.");
    			assert.include(messages[0].node.type, "Identifier");
    		});
    
    		it("should not report a violation when Typed Array globals are used", function() {
    			var topic = "ArrayBuffer; DataView; Uint32Array;";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
            it("should not flag ES6 globals", function() {
                var topic = "Promise; Proxy; Reflect; Symbol;";

                var config = { rules: {} };
                config.rules[RULE_ID] = 1;

                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 0);
            });
    	});
    	
//NO-UNREACHABLE ------------------------------------------------    	
    	describe('no-unreachable', function() {
    	    var RULE_ID = "no-unreachable";
    		it("should flag function decl return", function() {
    			var topic = "function f() {return\ntrue;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Unreachable code.");
    			assert.equal(messages[0].node.type, "ExpressionStatement");
    		});
    		it("should flag function decl throw", function() {
    			var topic = "function f() {throw e;\ntrue;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Unreachable code.");
    			assert.equal(messages[0].node.type, "ExpressionStatement");
    		});
    		it("should flag function decl multi return", function() {
    			var topic = "function f() {return\ntrue;\nfalse;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 2);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Unreachable code.");
    			assert.equal(messages[0].node.type, "ExpressionStatement");
    			assert.equal(messages[1].ruleId, RULE_ID);
    			assert.equal(messages[1].message, "Unreachable code.");
    			assert.equal(messages[1].node.type, "ExpressionStatement");
    		});
    		it("should flag while throw", function() {
    			var topic = "while(true) {throw e;\ntrue;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Unreachable code.");
    			assert.equal(messages[0].node.type, "ExpressionStatement");
    		});
    		it("should flag while continue", function() {
    			var topic = "while(true) {continue\ntrue;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Unreachable code.");
    			assert.equal(messages[0].node.type, "ExpressionStatement");
    		});
    		it("should flag while break", function() {
    			var topic = "while(true) {break\ntrue;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Unreachable code.");
    			assert.equal(messages[0].node.type, "ExpressionStatement");
    		});
    		it("should flag while break multi", function() {
    			var topic = "while(true) {break\ntrue;\nfalse;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 2);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Unreachable code.");
    			assert.equal(messages[0].node.type, "ExpressionStatement");
    			assert.equal(messages[1].ruleId, RULE_ID);
    			assert.equal(messages[1].message, "Unreachable code.");
    			assert.equal(messages[1].node.type, "ExpressionStatement");
    		});
    		it("should flag for continue", function() {
    			var topic = "for(true;;) {continue\ntrue;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Unreachable code.");
    			assert.equal(messages[0].node.type, "ExpressionStatement");
    		});
    		it("should flag for break", function() {
    			var topic = "for(true;;) {break\ntrue;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Unreachable code.");
    			assert.equal(messages[0].node.type, "ExpressionStatement");
    		});
    		it("should flag for throw", function() {
    			var topic = "for(true;;) {throw e;\ntrue;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Unreachable code.");
    			assert.equal(messages[0].node.type, "ExpressionStatement");
    		});
    		it("should flag for throw multi", function() {
    			var topic = "for(true;;) {throw e;\ntrue;\nfalse;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 2);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Unreachable code.");
    			assert.equal(messages[0].node.type, "ExpressionStatement");
    			assert.equal(messages[1].ruleId, RULE_ID);
    			assert.equal(messages[1].message, "Unreachable code.");
    			assert.equal(messages[1].node.type, "ExpressionStatement");
    		});
    		it("should flag for-in continue", function() {
    			var topic = "for(var p in o) {continue\ntrue;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Unreachable code.");
    			assert.equal(messages[0].node.type, "ExpressionStatement");
    		});
    		it("should flag for-in break", function() {
    			var topic = "for(var p in o) {break\ntrue;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Unreachable code.");
    			assert.equal(messages[0].node.type, "ExpressionStatement");
    		});
    		it("should flag for-in throw", function() {
    			var topic = "for(var p in o) {throw e;\ntrue;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Unreachable code.");
    			assert.equal(messages[0].node.type, "ExpressionStatement");
    		});
    		it("should flag for-in continue multi", function() {
    			var topic = "for(var p in o) {continue\ntrue;\nfalse;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 2);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Unreachable code.");
    			assert.equal(messages[0].node.type, "ExpressionStatement");
    			assert.equal(messages[1].ruleId, RULE_ID);
    			assert.equal(messages[1].message, "Unreachable code.");
    			assert.equal(messages[1].node.type, "ExpressionStatement");
    		});
    		it("should not flag hoisted func decl in func decl", function() {
    			var topic = "function f() {return\nfunction r(){}}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag hoisted var decl func decl", function() {
    			var topic = "function f() {return\nvar t = r;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag EmptyStatement", function() {
    			var topic = "function f() {return;;}";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    	});
    	
//NO-UNUSED-PARAMS -------------------------------------------    	
    	describe('no-unused-params', function() {
    	    var RULE_ID = "no-unused-params";
    		it("Should flag unused param simple func decl", function() {
    			var topic = "function f(a) {}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Parameter 'a' is never used.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("Should flag unused param nested func decl", function() {
    			var topic = "function f() {function g(b) {}}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Parameter 'b' is never used.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("Should flag unused param closed func decl", function() {
    			var topic = "(function f(a) {});";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Parameter 'a' is never used.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("Should flag unused param closed nested func decl", function() {
    			var topic = "(function f() {function g(b) {}});";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Parameter 'b' is never used.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("Should flag unused param simple func expr", function() {
    			var topic = "var v = function(a) {};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Parameter 'a' is never used.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("Should flag unused param nested func expr", function() {
    			var topic = "var v = function() {var c = function(a) {};};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Parameter 'a' is never used.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("Should flag unused param closed simple func expr", function() {
    			var topic = "var v = function(a) {};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Parameter 'a' is never used.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("Should flag unused param in closed nested func expr", function() {
    			var topic = "var v = function() {var c = function(a) {};};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Parameter 'a' is never used.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("Should flag unused param object prop func expr ", function() {
    			var topic = "var v = {one: function(a) {}};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Parameter 'a' is never used.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("Should flag unused param closed object prop func expr", function() {
    			var topic = "var v = {one: function(a) {}};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Parameter 'a' is never used.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("Should flag unused param nested object prop func expr", function() {
    			var topic = "var v = {one: function() {var c = {two: function(a) {}};}};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Parameter 'a' is never used.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("Should flag unused param closed nested object prop func expr", function() {
    			var topic = "var v = {one: function() {var c = {two: function(a) {}};}};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Parameter 'a' is never used.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("Should flag unused param func expr as param", function() {
    			var topic = "function f() {}f(function(a) {});";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Parameter 'a' is never used.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		/**
    		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=457067
    		 */
    		it("Should flag unused param func expr as call expression in property", function() {
    			var topic = "var c = {fn: function(a) {}.bind(this)};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Parameter 'a' is never used.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		/**
    		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=457067
    		 */
    		it("Should flag unused param func expr as call expression in call expression", function() {
    			var topic = "define('foo', function(a){}.bind(this));";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Parameter 'a' is never used.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		/**
    		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=457067
    		 */
    		it("Should not flag unused param func decl as call expression in closure with @callback", function() {
    			var topic = "(function f(a) {}).bind(this);";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Parameter 'a' is never used.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		/**
    		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=457067
    		 */
    		it("Should not flag unused param func decl as closure call expression with @callback", function() {
    			var topic = "(function f(a) {})();";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Parameter 'a' is never used.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("Should not flag used param simple use func decl", function() {
    			var topic = "function f(a) {var b = a;}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("Should not flag used param closed simple use func decl", function() {
    			var topic = "(function f(a) {var b = a;});";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("Should not flag used param nested use func decl", function() {
    			var topic = "function f(a) {function g() {var b = a;}}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("Should not flag used param closed nested use func decl", function() {
    			var topic = "(function f(a) {function g() {var b = a;}});";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("Should not flag used param simple use func expr", function() {
    			var topic = "var v = function(a) {var b = a;};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("Should not flag used param closed simple use func expr", function() {
    			var topic = "var v = function(a) {var b = a;};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("Should not flag used param nested use func expr", function() {
    			var topic = "var v = function(a) {var c = function() {var b = a;};};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("Should not flag used param closed nested use func expr", function() {
    			var topic = "var v = function(a) {var c = function() {var b = a;};};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("Should not flag used param object prop simple use func expr", function() {
    			var topic = "var v = {one: function(a) {var b = a;}};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("Should not flag used param object prop closed simple use func expr", function() {
    			var topic = "var v = {one: function(a) {var b = a;}};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("Should not flag used param object prop nested use func expr", function() {
    			var topic = "var v = {one: function(a) {var c = {two: function() {var b = a;}};}};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("Should not flag used param object prop closed nested use func expr", function() {
    			var topic = "var v = {one: function(a) {var c = {two: function() {var b = a;}};}};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("Should not flag used param func expr param", function() {
    			var topic = "function f() {}f(function(a) {var b = a;});";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		/**
    		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=457067
    		 */
    		it("Should not flag unused param func expr as call expression in property with @callback", function() {
    			var topic = "var c = {fn: /** @callback */ function(a) {}.bind(this)};";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		/**
    		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=457067
    		 */
    		it("Should not flag unused param func expr as call expression in call expression with @callback", function() {
    			var topic = "define('foo', /** @callback */function(a){}.bind(this));";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		/**
    		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=457067
    		 */
    		it("Should not flag unused param func decl as call expression in closure with @callback", function() {
    			var topic = "(/* @callback */ function f(a) {}).bind(this);";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		/**
    		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=457067
    		 */
    		it("Should not flag unused param func decl as closure call expression with @callback", function() {
    			var topic = "(/* @callback */ function f(a) {})();";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    	});
    	
//NO-UNUSED-VARS --------------------------------------------    	
    	describe('no-unused-vars', function() {
    	    var RULE_ID = "no-unused-vars";
    		it("flag unused var in Program", function() {
    			var topic = "var a;";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'a' is never used.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("flag unused var in FunctionExpression", function() {
    			var topic = "(function() { var a; }); ";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'a' is never used.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("flag unused var in FunctionDeclaration", function() {
    			var topic = "function f() {var b;} f();";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'b' is never used.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("flag var that is written but never read", function() {
    			var topic = "var a=1; a=2;";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'a' is never read.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("flag function that is never called", function() {
    			var topic = "function f() {}";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Function 'f' is never used.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    
    		it("should not flag unused param in FunctionExpression", function() {
    			var topic = "(function(a) {} ());";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag unused parameters in FunctionDeclaration", function() {
    			var topic = "function f(a, b) {} f();";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag var that appears in an Expression context", function() {
    			var topic = "var a; a;";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag function that is called", function() {
    			var topic = "function f() {} f();";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag var from Program scope that is used in a child scope", function() {
    			var topic = "var a; (function() { a; });";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag var from upper scope that is used in a child scope", function() {
    			var topic = "(function() { var a; (function() { a; }); });";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag var that is used in a read+write reference", function() {
    			var topic = "var b; b=1; a.foo = b++;";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    	});
    	
//NO-USE-BEFORE-DEFINE ----------------------------------------------------    	
    	describe('no-use-before-define', function() {
    	    var RULE_ID = "no-use-before-define";
    		it("should not flag reference to builtin", function() {
    			var topic = "isNaN(Math.sqrt(-1)); Object.keys(a);";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag reference to parameter", function() {
    			var topic = "(function(a) { a; }())";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag reference to 'arguments' object", function() {
    			var topic = "(function() { arguments; }())";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should flag var use that precedes declaration in Program", function() {
    			var topic = "a; var a;";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = [1, true, false];
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'a' was used before it was defined.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag var use that precedes declaration in FunctionDeclaration", function() {
    			var topic = "function f() { alert(a); var a; }";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = [1, true, false];
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'a' was used before it was defined.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag var use that precedes declaration in FunctionExpression", function() {
    			var topic = "(function() { a; var a; }());";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = [1, true, false];
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'a' was used before it was defined.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should not flag funcs", function() {
    			var topic = "f(); function f(){}";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = [1, true, false];
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should flag function call that precedes declaration in Program", function() {
    			var topic = "f(); function f() {}";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = [1, false, true];
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'f' was used before it was defined.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag function call that precedes function declaration in FunctionDeclaration", function() {
    			var topic = "function g() { f(); function f() {} }";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = [1, false, true];
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'f' was used before it was defined.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should not flag vars", function() {
    			var topic = "a; var a;";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = [1, false, true];
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should flag both", function() {
    			var topic = "a; f; var a; function f() {}";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = [1, true, true];
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 2);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'a' was used before it was defined.");
    			assert.equal(messages[1].ruleId, RULE_ID);
    			assert.equal(messages[1].message, "'f' was used before it was defined.");
    		});
    		it("should flag only vars", function() {
    			var topic = "a; f; var a; function f() {}";
    
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "'a' was used before it was defined.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    	});
    	
//RADIX ------------------------------------------------
        describe('radix', function() {
            var RULE_ID = "radix";
            var MESSAGE = "Missing radix parameter.";
            it("should flag parseInt() called without radix", function() {
                var topic = "parseInt()";
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 1);
                assert.equal(messages[0].ruleId, RULE_ID);
                assert.equal(messages[0].message, MESSAGE);
                assert.equal(messages[0].node.type, "Identifier");
            });
            it("should not flag parseInt() called with radix", function() {
                var topic = "parseInt('a', 10)";
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 0);
            });
            it("should not flag - 1", function() {
                var topic = "var parseInt; parseInt();";
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 0);
            });
            it("should not flag - 2", function() {
                var topic = "var parseInt; (function(){ parseInt(); }());";
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 0);
            });
            it("should not flag - 3", function() {
                var topic = "function f() { var parseInt; function g() { parseInt() } }";
                var config = { rules: {} };
                config.rules[RULE_ID] = 1;
                var messages = eslint.verify(topic, config);
                assert.equal(messages.length, 0);
            });
        });
        
//SEMI ----------------------------------------------        
    	describe('semi', function() {
    	    var RULE_ID = "semi";
    		it("should flag variable declaration lacking ;", function() {
    			var topic = "var a=1";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Missing semicolon.");
    			assert.equal(messages[0].node.type, "VariableDeclaration");
    		});
    		it("should flag variable declaration lacking ; with multiple declarators", function() {
    			var topic = "var a=1, b";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Missing semicolon.");
    			assert.equal(messages[0].node.type, "VariableDeclaration");
    		});
    		it("should flag function call lacking ;", function() {
    			var topic = "x()";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Missing semicolon.");
    			assert.equal(messages[0].node.type, "ExpressionStatement");
    		});
    		it("should flag throw statement lacking ;", function() {
    			var topic = "throw 1";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Missing semicolon.");
    			assert.equal(messages[0].node.type, "ThrowStatement");
    		});
    		it("should flag bare expression lacking ;", function() {
    			var topic = "x";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Missing semicolon.");
    			assert.equal(messages[0].node.type, "ExpressionStatement");
    		});
    		it("should flag 'for' with body statement lacking ;", function() {
    			var topic = "for (;;) { var x }";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Missing semicolon.");
    			assert.equal(messages[0].node.type, "VariableDeclaration");
    		});
    		it("should flag var x;ny()", function() {
    			var topic = "var x;\ny()";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Missing semicolon.");
    			assert.equal(messages[0].node.type, "ExpressionStatement");
    		});
    		it("should indicate the problematic token in 'related' field", function() {
    			var topic = "f(1)";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].related.type, "Punctuator");
    			assert.equal(messages[0].related.value, ")");
    		});
    		/**
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427930
    		 */
    		it("should indicate the problematic token in return of call expression", function() {
    			var topic = "function f() {return f()}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].related.type, "Punctuator");
    			assert.equal(messages[0].related.value, ")");
    		});
    		/**
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427930
    		 */
    		it("should indicate the problematic token in return of object", function() {
    			var topic = "function f2() {return {}}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].related.type, "Punctuator");
    			assert.equal(messages[0].related.value, "}");
    		});
    		/**
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427930
    		 */
    		it("should indicate the problematic token in return of string", function() {
    			var topic = "function f3() {return 'foo'}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].related.type, "String");
    			assert.equal(messages[0].related.value, "\'foo\'");
    		});
    		/**
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427930
    		 */
    		it("should indicate the problematic token in return of number", function() {
    			var topic = "function f4() {return 2}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].related.type, "Numeric");
    			assert.equal(messages[0].related.value, "2");
    		});
    		/**
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427930
    		 */
    		it("should indicate the problematic token in function expression return of number", function() {
    			var topic = "var o = {f: function() {return 2}};o.f = null;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].related.type, "Numeric");
    			assert.equal(messages[0].related.value, "2");
    		});
    		/**
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427930
    		 */
    		it("should indicate the problematic token in function expression return of string", function() {
    			var topic = "var o = {f: function() {return 'foo'}};o.f = null;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].related.type, "String");
    			assert.equal(messages[0].related.value, "\'foo\'");
    		});
    		/**
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427930
    		 */
    		it("should indicate the problematic token in function expression return of object", function() {
    			var topic = "var o = {f: function() {return {}}};o.f = null;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].related.type, "Punctuator");
    			assert.equal(messages[0].related.value, "}");
    		});
    		/**
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427930
    		 */
    		it("should indicate the problematic token in function expression return of call expression", function() {
    			var topic = "var o = {f: function() {return this.f()}};o.f = null;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].related.type, "Punctuator");
    			assert.equal(messages[0].related.value, ")");
    		});
    		/**
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427930
    		 */
    		it("should indicate the problematic token in function expression with nested function decl and return of call expression", function() {
    			var topic = "var o = {f: function() {function inner() {};return inner()}};o.f = null;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].related.type, "Punctuator");
    			assert.equal(messages[0].related.value, ")");
    		});
    		/**
    		 * Used to be not flagged, but not now that we handle call expressions
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427930
    		 */
    		it("should flag 1-liner function call", function() {
    			var topic = "foo(function() { x = 1; })";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].related.type, "Punctuator");
    			assert.equal(messages[0].related.value, ")");
    		});
    		/**
    		 * Should flag bare BreakStatement
    		 */
    		it("should flag bare break statement", function() {
    			var topic = "while(true) {break}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].related.type, "Keyword");
    			assert.equal(messages[0].related.value, "break");
    		});
    		/**
    		 * Should flag labelled BreakStatement
    		 */
    		it("should flag labelled break statement", function() {
    			var topic = "l: while(true) {break l}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].related.type, "Identifier");
    			assert.equal(messages[0].related.value, "l");
    		});
            /**
    		 * Should flag bare ContinueStatement
    		 */
    		it("should flag bare continue statement", function() {
    			var topic = "while(true) {continue}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].related.type, "Keyword");
    			assert.equal(messages[0].related.value, "continue");
    		});
 		     /**
    		 * Should flag labelled ContinueStatement
    		 */
    		it("should flag labelled continue statement", function() {
    			var topic = "l: while(true) {continue l}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].related.type, "Identifier");
    			assert.equal(messages[0].related.value, "l");
    		});

    		//------------------------------------------------------------------------------
    		// Should nots
    		//------------------------------------------------------------------------------
    		it("should not flag 'for' with initializer", function() {
    			var topic = "for (var i;;){}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag 'for' with no BlockStatement", function() {
    			var topic = "for (;;)x;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag 'for in' with VariableDeclaration", function() {
    			var topic = "for (var x in ({}));";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag 'for in'", function() {
    			var topic = "for (x in ({}));";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		/**
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427930
    		 */
    		it("should not flag call expression root", function() {
    			var topic = "function f() {} f();";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		/**
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427930
    		 */
    		it("should not flag call expression return statement", function() {
    			var topic = "function f() {return f();}";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		/**
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427930
    		 */
    		it("should not flag call expression return statement from function expression", function() {
    			var topic = "var o = {fo: function() {return this.fo();}};o.fo = null;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		/**
    		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427930
    		 */
    		it("should not flag call expression return statement from nested in function expression", function() {
    			var topic = "var o = {fo: function() {function f() {return f();};}};o.fo = null;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag function expression with nested function decl", function() {
    			var topic = "var o = {f: function() {function inner() {}}};o.f = null;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    	});
    	
//USE-ISNAN --------------------------------------------------------    	
    	describe('use-isnan', function() {
    	    var RULE_ID = "use-isnan";
    		it("should flag < on LHS", function() {
    			var topic = "if (NaN < 1) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Use the isNaN function to compare with NaN.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag < on RHS", function() {
    			var topic = "if (1 < NaN) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Use the isNaN function to compare with NaN.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag > on LHS", function() {
    			var topic = "if (NaN > 1) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Use the isNaN function to compare with NaN.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag > on RHS", function() {
    			var topic = "if (1 > NaN) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Use the isNaN function to compare with NaN.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag <= on LHS", function() {
    			var topic = "if (NaN <= 1) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Use the isNaN function to compare with NaN.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag <= on RHS", function() {
    			var topic = "if (1 <= NaN) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Use the isNaN function to compare with NaN.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag >= on LHS", function() {
    			var topic = "if (NaN >= 1) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Use the isNaN function to compare with NaN.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag >= on RHS", function() {
    			var topic = "if (1 >= NaN) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Use the isNaN function to compare with NaN.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag == on LHS", function() {
    			var topic = "if (NaN == 1) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Use the isNaN function to compare with NaN.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag == on RHS", function() {
    			var topic = "if (1 == NaN) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Use the isNaN function to compare with NaN.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag != on LHS", function() {
    			var topic = "if (NaN != 1) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Use the isNaN function to compare with NaN.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag != on RHS", function() {
    			var topic = "if (1 != NaN) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Use the isNaN function to compare with NaN.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag === on LHS", function() {
    			var topic = "if (NaN === 1) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Use the isNaN function to compare with NaN.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag === on RHS", function() {
    			var topic = "if (1 === NaN) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Use the isNaN function to compare with NaN.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag !== on LHS", function() {
    			var topic = "if (NaN !== 1) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Use the isNaN function to compare with NaN.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    		it("should flag !== on LHS", function() {
    			var topic = "if (1 !== NaN) var i = 1;";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Use the isNaN function to compare with NaN.");
    			assert.equal(messages[0].node.type, "Identifier");
    		});
    	});
    	
//VALID-TYPEOF ---------------------------------------------------------    	
    	describe('valid-typeof', function() {
    	    var RULE_ID = "valid-typeof";
    		it("should flag non-literal", function() {
    			var topic = "var answer = (typeof null === object);";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Invalid typeof comparison.");
    		});
    		it("should flag non-literal undefined", function() {
    			var topic = "var answer = (typeof foo === undefined);";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Invalid typeof comparison.");
    		});
    		it("should flag unsupported literal", function() {
    			var topic = "var answer = (typeof foo === 'undefied');";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Invalid typeof comparison.");
    		});
    		it("should not flag literal RHS", function() {
    			var topic = "var answer = ('object' === typeof foo);";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should not flag call expression unary RHS", function() {
    			var topic = "var answer = ('undefined' === typeof(foo));";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		it("should flag unsupported literal RHS", function() {
    			var topic = "var answer = ('undefied' === typeof foo);";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 1);
    			assert.equal(messages[0].ruleId, RULE_ID);
    			assert.equal(messages[0].message, "Invalid typeof comparison.");
    		});
            
            /**
             * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=460388
             */
            it("should not flag binary expr withour comparison 1", function() {
    			var topic = "var str = ('val: ' + typeof(foo));";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		
    		/**
             * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=460388
             */
            it("should not flag binary expr withour comparison 2", function() {
    			var topic = "var str = ('val: ' & typeof(foo));";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		
    		/**
             * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=460388
             */
            it("should not flag binary expr withour comparison 3", function() {
    			var topic = "var str = ('val: ' > typeof(foo));";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		
    		/**
             * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=460388
             */
            it("should not flag binary expr withour comparison 4", function() {
    			var topic = "var str = ('val: ' < typeof(foo));";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		/**
             * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=460388
             */
            it("should not flag binary expr withour comparison 5", function() {
    			var topic = "var str = ('val: ' <= typeof(foo));";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    		
    		/**
             * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=460388
             */
            it("should not flag binary expr withour comparison 6", function() {
    			var topic = "var str = ('val: ' >= typeof(foo));";
    	
    			var config = { rules: {} };
    			config.rules[RULE_ID] = 1;
    	
    			var messages = eslint.verify(topic, config);
    			assert.equal(messages.length, 0);
    		});
    	});
    });
});
