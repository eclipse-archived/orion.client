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

    var RULE_ID = "no-shadow";

    describe(RULE_ID, function() {
        describe("shadowee is in 'global' scope", function() {
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
//            // Restore this once Esprima supports Arrow functions
//            it("should flag shadowing in ArrowFunctionExpression", function() {
//                var topic = "var a; (() => { var a; })(); ";
//
//                var config = { rules: {} };
//                config.rules[RULE_ID] = 1;
//
//                var messages = eslint.verify(topic, config);
//                assert.equal(messages.length, 1);
//                assert.equal(messages[0].ruleId, RULE_ID);
//                assert.equal(messages[0].message, "'a' is already declared in the upper scope.");
//                assert.equal(messages[0].node.type, "Identifier");
//            });
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
        });

        describe("shadowee is in 'function' scope", function() {
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
        });

        describe("Thou shalt not", function() {
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

    });
});