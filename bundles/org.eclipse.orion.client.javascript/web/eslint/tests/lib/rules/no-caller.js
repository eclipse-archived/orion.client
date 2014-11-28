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
 *******************************************************************************/
/*eslint-env amd, node, mocha*/
define([
"chai/chai", 
"eslint"
], function(assert, eslint) {
	assert = assert.assert /*chai*/ || assert;

	var RULE_ID = "no-caller";

	describe(RULE_ID, function() {
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
	});
});