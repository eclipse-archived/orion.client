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
/*eslint-env amd, node, mocha*/
define([
"chai/chai", 
"eslint"
], function(assert, eslint) {
	assert = assert.assert /*chai*/ || assert;

	var RULE_ID = "no-redeclare";
	
	describe(RULE_ID, function() {
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

		//------------------------------------------------------------------------------
		// Thou shalt nots
		//------------------------------------------------------------------------------
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
});