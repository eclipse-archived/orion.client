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

var RULE_ID = "missing-func-decl-doc";

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------
describe(RULE_ID, function() {
	it("Should not flag missing function doc", function() {
		var topic = "/**foo*/function f() {}";

		var config = { rules: {} };
		config.rules[RULE_ID] = [1, 'decl'];

		var messages = eslint.verify(topic, config);
		assert.equal(messages[0].length, 0);
	});
	it("Should not flag missing function doc for excessive white space", function() {
		var topic = "/**foo*/\n\n\nfunction f() {}";

		var config = { rules: {} };
		config.rules[RULE_ID] = [1, 'decl'];

		var messages = eslint.verify(topic, config);
		assert.equal(messages[0].length, 0);
	});
	it("Should not flag missing fuction doc for line comment", function() {
		var topic = "//foo\nfunction f() {}";

		var config = { rules: {} };
		config.rules[RULE_ID] = [1, 'decl'];

		var messages = eslint.verify(topic, config);
		assert.equal(messages.length, 0);
	});
	it("Should not flag missing functioon doc for excessive space with line comment", function() {
		var topic = "//foo\n\n\n\nfunction f() {}";

		var config = { rules: {} };
		config.rules[RULE_ID] = [1, 'decl'];

		var messages = eslint.verify(topic, config);
		assert.equal(messages.length, 0);
	});
	it("Should not flag missing functioon doc for inner block comment", function() {
		var topic = "/***/function o() {/***/function f() {}}";

		var config = { rules: {} };
		config.rules[RULE_ID] = [1, 'decl'];

		var messages = eslint.verify(topic, config);
		assert.equal(messages.length, 0);
	});
	it("Should not flag missing functioon doc for excessive space with inner block comment", function() {
		var topic = "/***/function o() {/***/\n\n\n\nfunction f() {}}";

		var config = { rules: {} };
		config.rules[RULE_ID] = [1, 'decl'];

		var messages = eslint.verify(topic, config);
		assert.equal(messages.length, 0);
	});
	it("Should not flag missing functioon doc for inner line comment", function() {
		var topic = "/***/function o() {//foo\nfunction f() {}}";

		var config = { rules: {} };
		config.rules[RULE_ID] = [1, 'decl'];

		var messages = eslint.verify(topic, config);
		assert.equal(messages.length, 0);
	});
	it("Should not flag missing functioon doc for excessive space with inner line comment", function() {
		var topic = "/***/function o() {//foo\n\n\n\nfunction f() {}}";

		var config = { rules: {} };
		config.rules[RULE_ID] = [1, 'decl'];

		var messages = eslint.verify(topic, config);
		assert.equal(messages.length, 0);
	});
	describe("Found missing documentation problems", function() {
		it("Should flag missing documentation for function f", function() {
			var topic = "var foo;\nfunctionf() {}";

			var config = { rules: {} };
			config.rules[RULE_ID] = [1, 'decl'];

			var messages = eslint.verify(topic, config);
			assert.equal(messages.length, 1);
			assert.equal(messages[0].ruleId, RULE_ID);
			assert.equal(messages[0].message, "Missing documentation for function \'f\'");
			assert.equal(messages[0].node.type, "Identifier");
		});
		it("Should find missing documentation problem for inner function", function() {
			var topic = "var foo;\n/***/\nfunction o() {\nfunction f() {}; }";

			var config = { rules: {} };
			config.rules[RULE_ID] = [1, 'decl'];

			var messages = eslint.verify(topic, config);
			assert.equal(messages.length, 1);
			assert.equal(messages[0].ruleId, RULE_ID);
			assert.equal(messages[0].message, "Missing documentation for function \'f\'");
			assert.equal(messages[0].node.type, "Identifier");
		});
		it("Should find missing doc problem for root node", function() {
			/**
			 * This test covers the Estraverse bug:
			 * https://github.com/Constellation/estraverse/issues/20
			 */
			var topic = "/***/function f() {}";

			var config = { rules: {} };
			config.rules[RULE_ID] = [1, 'decl'];

			var messages = eslint.verify(topic, config);
			assert.equal(messages.length, 1);
			assert.equal(messages[0].ruleId, RULE_ID);
			assert.equal(messages[0].message, "'Missing documentation for function \'f\'");
			assert.equal(messages[0].node.type, "Identifier");
		});
	});
});
