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
/*global describe it module require*/

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var assert = require("assert"),
	eslint = require("../../../lib/eslint");

//------------------------------------------------------------------------------
// Constants
//------------------------------------------------------------------------------

var RULE_ID = "missing-func-expr-doc";

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------
describe(RULE_ID, function() {
	it("Should not flag missing function doc", function() {
		var topic = "var foo = {/**foo*/f: function() {}}";

		var config = { rules: {} };
		config.rules[RULE_ID] = [1, 'expr'];

		var messages = eslint.verify(topic, config);
		assert.equal(messages[0].length, 0);
	});
	it("Should not flag missing function doc for excessive white space", function() {
		var topic = "var foo = {/**foo*/\n\n\n\nf: function() {}}";

		var config = { rules: {} };
		config.rules[RULE_ID] = [1, 'expr'];

		var messages = eslint.verify(topic, config);
		assert.equal(messages[0].length, 0);
	});
	it("Should not flag missing fuction doc for line comment", function() {
		var topic = "var foo = {//foo\nf: function() {}}";

		var config = { rules: {} };
		config.rules[RULE_ID] = [1, 'expr'];

		var messages = eslint.verify(topic, config);
		assert.equal(messages.length, 0);
	});
	it("Should not flag missing functioon doc for excessive space with line comment", function() {
		var topic = "var foo = {//foo\n\n\n\n\n\nf: function() {}}";

		var config = { rules: {} };
		config.rules[RULE_ID] = [1, 'expr'];

		var messages = eslint.verify(topic, config);
		assert.equal(messages.length, 0);
	});
	it("Should not flag missing functioon doc for inner block comment", function() {
		var topic = "var foo = {/**foo*/o: function() { var bar = { /***/f: function() {}}}}";

		var config = { rules: {} };
		config.rules[RULE_ID] = [1, 'expr'];

		var messages = eslint.verify(topic, config);
		assert.equal(messages.length, 0);
	});
	it("Should not flag missing functioon doc for excessive space with inner block comment", function() {
		var topic = "var foo = {/**foo*/o: function() { var bar = { /***/\n\n\n\n\nf: function() {}}}}";

		var config = { rules: {} };
		config.rules[RULE_ID] = [1, 'expr'];

		var messages = eslint.verify(topic, config);
		assert.equal(messages.length, 0);
	});
	it("Should not flag missing functioon doc for inner line comment", function() {
		var topic = "var foo = {/**foo*/o: function() { var bar = { //foo\nf: function() {}}}}";

		var config = { rules: {} };
		config.rules[RULE_ID] = [1, 'decl'];

		var messages = eslint.verify(topic, config);
		assert.equal(messages.length, 0);
	});
	it("Should not flag missing functioon doc for excessive space with inner line comment", function() {
		var topic = "var foo = {/**foo*/o: function() { var bar = { //foo\n\n\n\n\n\nf: function() {}}}}";

		var config = { rules: {} };
		config.rules[RULE_ID] = [1, 'decl'];

		var messages = eslint.verify(topic, config);
		assert.equal(messages.length, 0);
	});
	describe("Found missing documentation problems", function() {
		it("Should flag missing documentation for function f", function() {
			var topic = "var foo = { f: function() {}}";

			var config = { rules: {} };
			config.rules[RULE_ID] = [1, 'expr'];

			var messages = eslint.verify(topic, config);
			assert.equal(messages.length, 1);
			assert.equal(messages[0].ruleId, RULE_ID);
			assert.equal(messages[0].message, "Missing documentation for function \'f\'");
			assert.equal(messages[0].node.type, "Identifier");
		});
		it("Should find missing documentation problem for inner function", function() {
			var topic = "var foo = {/**foo*/o: function() { var bar = { f: function() {}}}}";

			var config = { rules: {} };
			config.rules[RULE_ID] = [1, 'expr'];

			var messages = eslint.verify(topic, config);
			assert.equal(messages.length, 1);
			assert.equal(messages[0].ruleId, RULE_ID);
			assert.equal(messages[0].message, "Missing documentation for function \'f\'");
			assert.equal(messages[0].node.type, "Identifier");
		});
	});
});
