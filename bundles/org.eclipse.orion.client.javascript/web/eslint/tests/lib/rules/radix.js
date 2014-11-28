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

    var RULE_ID = "radix",
        MESSAGE = "Missing radix parameter.";

    describe(RULE_ID, function() {
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
        describe("shadowed `parseInt`", function() {
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
    });
});