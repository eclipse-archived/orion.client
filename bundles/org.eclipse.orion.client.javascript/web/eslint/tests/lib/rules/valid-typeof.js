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

	var RULE_ID = "valid-typeof";
	
	describe(RULE_ID, function() {
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
	});
});