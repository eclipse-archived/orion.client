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

	var RULE_ID = "no-sparse-arrays";
	
	describe(RULE_ID, function() {
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
});