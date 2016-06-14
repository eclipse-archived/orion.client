/*******************************************************************************
 * @license
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env amd, mocha, node*/
/* eslint-disable missing-nls */
define([
	'javascript/validator',
	'chai/chai',
	'orion/Deferred',
	"orion/i18nUtil",
	"i18n!javascript/nls/problems",
	'mocha/mocha', //must stay at the end, not a module
], function(Validator, chai, Deferred, i18nUtil, Messages) {
	var assert = chai.assert;
	return function(worker) {
		describe('ES6 Validator Tests', function() {
			this.timeout(10000);
			
			before('Reset Tern Server', function(done) {
				worker.start(done,  {options:{ecmaVersion:6, sourceType:"module"}});
			});
			
			/**
			 * @description Sets up the test
			 * @param {Object} options {buffer, contentType}i
			 * @returns {Object} The object with the initialized values
			 */
			function setup(options) {
				var buffer = options.buffer;
				var contentType = options.contentType ? options.contentType : 'application/javascript';
				var validator = new Validator(worker);
				var state = Object.create(null);
				assert(options.callback, "You must provide a callback for a worker-based test");
				state.callback = options.callback;
				worker.setTestState(state);
				
				if (options.createFiles){
					for (var i=0; i<options.createFiles.length; i++) {
						worker.createTestFile(options.createFiles[i].name, options.createFiles[i].text);
					}
				}
				
				var editorContext = {
					/*override*/
					getText: function() {
						return new Deferred().resolve(buffer);
					},
					/*override*/
					getFileMetadata: function() {
						var o = Object.create(null);
						o.contentType = Object.create(null);
						o.contentType.id = contentType;
						o.location = 'es6validator_test_script.js';
						if (contentType === 'text/html'){
							o.location = 'es6validator_test_script.html';
						}
						return new Deferred().resolve(o);
					}
				};
				return {
					validator: validator,
					editorContext: editorContext,
					contentType: contentType
				};
			}
			
			/**
			 * @name validate
			 * @description Runs the validator on the given options
			 * @param {Object} options {buffer, contentType}
			 * @returns {orion.Promise} The validation promise
			 */
			function validate(options) {
				var obj = setup(options);
				return obj.validator.computeProblems(obj.editorContext, {contentType: obj.contentType}, options.config);
			}
		
			/**
			 * @name assertProblems
			 * @description Compares the computed problem set against the expected ones
			 * @param {Array.<orion.Problem>} computed The computed est of problems
			 * @param {Array.<Object>} expected The expected set of problems
			 */
			function assertProblems(computed, expected) {
				try {
					var problems = computed.problems;
					assert.equal(problems.length, expected.length, "The wrong number of problems was computed");
					for(var i = 0; i < problems.length; i++) {
						var pb = problems[i];
						var expb = expected[i];
						if (expb.start) {
							assert.equal(pb.start, expb.start, "Wrong problem start");
						}
						if (expb.end) {
							assert.equal(pb.end, expb.end, "Wrong problem end");
						}
						if (expb.line) {
							assert.equal(pb.line, expb.line, "Wrong problem line number");
						}
						if (expb.description) {
							assert.equal(pb.description, expb.description, "Wrong problem message");
						}
						if (expb.severity) {
							assert.equal(pb.severity, expb.severity, "Wrong problem severity");
						}
						if(pb.descriptionArgs) {
							assert(expb.descriptionArgs, "Missing expected description arguments");
							assert.equal(pb.descriptionArgs.nls, expb.descriptionArgs.nls, "Missing NLS descriptipon argument key");
						}
						if (expb.nodeType) {
							assert.equal(pb.nodeType, expb.nodeType);
						}
						if (expb.nlsComment) {
							assert(pb.data, "Missing data");
							assert(pb.data.nlsComment, "Missing data nlsComment");
							assert.equal(pb.data.nlsComment, expb.nlsComment, "Wrong data nlsComment");
						}
					}
					worker.getTestState().callback();
				}
				catch(err) {
					worker.getTestState().callback(err);
				}
			}

			describe("missing-doc - function declaration - ecma6", function() {
				it("should flag missing doc for export named declaration", function(callback) {
					var config = { rules: {} };
					config.rules['missing-doc'] = [1, {decl: 1}];
					var features = Object.create(null);
					features.modules = true;
					config.ecmaFeatures = features;
					validate({buffer: "var i = 0; export function myFunc() { return i; };", callback: callback, config: config}).then(
					function (problems) {
						assertProblems(problems, [{
							id: 'missing-doc',
							severity: 'warning',
							description: "Missing documentation for function \'myFunc\'.",
							nodeType: "Identifier"
						}]);
					},
					function (error) {
						worker.getTestState().callback(error);
					});
				});
				it("default function export 1", function(callback) {
					var config = { rules: {} };
					config.rules['missing-doc'] = [1, {decl: 1}];
					var features = Object.create(null);
					features.modules = true;
					config.ecmaFeatures = features;
					validate({buffer: "var i = 0; export default function myFunc() { return i; };", callback: callback, config: config}).then(
					function (problems) {
						assertProblems(problems, [{
							id: 'missing-doc',
							severity: 'warning',
							description: "Missing documentation for function \'myFunc\'.",
							nodeType: "Identifier"
						}]);
					},
					function (error) {
						worker.getTestState().callback(error);
					});
				});
				it("default generator export 2", function(callback) {
					var config = { rules: {} };
					config.rules['missing-doc'] = [1, {decl: 1}];
					var features = Object.create(null);
					features.modules = true;
					config.ecmaFeatures = features;
					validate({buffer: "var i = 0; export default function* myFunc() { return i; };", callback: callback, config: config}).then(
					function (problems) {
						assertProblems(problems, [{
							id: 'missing-doc',
							severity: 'warning',
							description: "Missing documentation for function \'myFunc\'.",
							nodeType: "Identifier"
						}]);
					},
					function (error) {
						worker.getTestState().callback(error);
					});
				});
			});
			//NO-UNUSED-VARS-UNREAD ---------------------------------------------
			describe("no-unused-vars", function() {
				var RULE_ID = 'no-unused-vars';
				this.timeout(10000000);
				it("flag unused var in list matching", function(callback) {
					var topic = "var [a] = [1];";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [
							{
								id: RULE_ID,
								severity: 'warning',
								description: "'a' is unread.",
								nodeType: "Identifier"
							}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("flag unused var in fail-soft destructuring", function(callback) {
					var topic = "var [a] = [];";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [
							{
								id: RULE_ID,
								severity: 'warning',
								description: "'a' is unread.",
								nodeType: "Identifier"
							}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("flag unused var in list matching", function(callback) {
					var topic = "var [d, , b] = [1, 2, 3];";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [
							{
								id: RULE_ID,
								severity: 'warning',
								description: "'d' is unread.",
								nodeType: "Identifier"
							},
							{
								id: RULE_ID,
								severity: 'warning',
								description: "'b' is unread.",
								nodeType: "Identifier"
							}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("flag unused var in object matching shorthand", function(callback) {
					var topic = "var {op, lhs, rhs} = () => {};";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [
							{
								id: RULE_ID,
								severity: 'warning',
								description: "'op' is unread.",
								nodeType: "Identifier"
							},
							{
								id: RULE_ID,
								severity: 'warning',
								description: "'lhs' is unread.",
								nodeType: "Identifier"
							},
							{
								id: RULE_ID,
								severity: 'warning',
								description: "'rhs' is unread.",
								nodeType: "Identifier"
							}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("flag unused var in list matching", function(callback) {
					var topic = "var {op, lhs, rhs} = () => {};";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [
							{
								id: RULE_ID,
								severity: 'warning',
								description: "'op' is unread.",
								nodeType: "Identifier"
							},
							{
								id: RULE_ID,
								severity: 'warning',
								description: "'lhs' is unread.",
								nodeType: "Identifier"
							},
							{
								id: RULE_ID,
								severity: 'warning',
								description: "'rhs' is unread.",
								nodeType: "Identifier"
							}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("should flag browser use object matching", function(callback) {
					var topic = "/*eslint-env browser */ function getSomething() { return {first : \"\", second: \"\", third: \"\" };} function f() { var { first: first, second: { something: second }} = getSomething();} f();";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [
							{
								id: RULE_ID,
								severity: 'warning',
								description: "'first' is unread.",
								start: 124,
								end: 129
							},
							{
								id: RULE_ID,
								severity: 'warning',
								description:  "'second' is unread.",
								start: 152,
								end: 158
							}
							]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
			});
			//NO-UNUSED-VARS-IMPORT ---------------------------------------------
			describe("no-unused-vars", function() {
				var RULE_ID = 'no-unused-vars';
				it("import 1", function(done) {
					var topic = 'import foo from "./exports";'; 
					var config = { rules: {} };
					var createFiles = [{name: './exports', text: ''}];
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: done, config: config, createFiles: createFiles}).then(
						function (problems) {
							assertProblems(problems, [
								{
									id: 'no-unused-vars-import',
									severity: 'warning',
									description: i18nUtil.formatMessage.call(null, Messages['no-unused-vars-unused'], {0: 'foo'}),
									nodeType: "Identifier"
								}
							]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("import 2", function(done) {
					var topic = 'import * as foo from "./exports";'; 
					var config = { rules: {} };
					var createFiles = [{name: './exports', text: ''}];
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: done, config: config, createFiles: createFiles}).then(
						function (problems) {
							assertProblems(problems, [
								{
									id: 'no-unused-vars-import',
									severity: 'warning',
									description: i18nUtil.formatMessage.call(null, Messages['no-unused-vars-unused'], {0: 'foo'}),
									nodeType: "Identifier"
								}
							]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("import 3", function(done) {
					var topic = 'import {foo} from "./exports";'; 
					var config = { rules: {} };
					var createFiles = [{name: './exports', text: ''}];
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: done, config: config, createFiles: createFiles}).then(
						function (problems) {
							assertProblems(problems, [
								{
									id: 'no-unused-vars-import',
									severity: 'warning',
									description: i18nUtil.formatMessage.call(null, Messages['no-unused-vars-unused'], {0: 'foo'}),
									nodeType: "Identifier"
								}
							]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("import 4", function(done) {
					var topic = 'import {foo, bar} from "./exports"; bar.toString();'; 
					var config = { rules: {} };
					var createFiles = [{name: './exports', text: ''}];
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: done, config: config, createFiles: createFiles}).then(
						function (problems) {
							assertProblems(problems, [
								{
									id: 'no-unused-vars-import',
									severity: 'warning',
									description: i18nUtil.formatMessage.call(null, Messages['no-unused-vars-unused'], {0: 'foo'}),
									nodeType: "Identifier"
								}
							]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
			});
			describe("missing-nls", function() {
				var RULE_ID = "missing-nls";
				it("Ignore es6 import 1", function(callback) {
					var topic = 'import { MYCONSTANT , arr } from "./exports";'; 
					var config = { rules: {} };
					var createFiles = [{name: './exports', text: ''}];
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config, createFiles: createFiles}).then(
						function (problems) {
							assertProblems(problems, []);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("Ignore es6 import 2", function(callback) {
					var topic = 'import * as myImport from "./exports";'; 
					var config = { rules: {} };
					var createFiles = [{name: './exports', text: ''}];
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config, createFiles: createFiles}).then(
						function (problems) {
							assertProblems(problems, []);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("Ignore es6 import 3", function(callback) {
					var topic = 'import "./exports";'; 
					var config = { rules: {} };
					var createFiles = [{name: './exports', text: ''}];
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config, createFiles: createFiles}).then(
						function (problems) {
							assertProblems(problems, []);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("Ignore es6 export", function(callback) {
					var topic = 'export\n * from "./exports.js";'; 
					var config = { rules: {} };
					var createFiles = [{name: './exports', text: ''}];
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config, createFiles: createFiles}).then(
						function (problems) {
							assertProblems(problems, []);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("Ignore es6 export", function(callback) {
					var topic = 'export * from "./exports.js";'; 
					var config = { rules: {} };
					var createFiles = [{name: './exports', text: ''}];
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config, createFiles: createFiles}).then(
						function (problems) {
							assertProblems(problems, []);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
			});
			describe('no-use-before-define', function() {
				var RULE_ID = "no-use-before-define";
				it("Flag class declaration in global scope", function(callback) {
					var topic = "new A(); class A {}";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [{
							id: 'no-use-before-define',
							severity: 'warning',
							description: "'A' was used before it was defined.",
							nodeType: "Identifier"
						}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("Flag class expression in global scope", function(callback) {
					var topic = "new a(); var a = class {};";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [{
							id: 'no-use-before-define',
							severity: 'warning',
							description: "'a' was used before it was defined.",
							nodeType: "Identifier"
						}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("Flag named class expression in global scope", function(callback) {
					var topic = "new a(); var a = class A {};";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [{
							id: 'no-use-before-define',
							severity: 'warning',
							description: "'a' was used before it was defined.",
							nodeType: "Identifier"
						}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("Flag class declaration in function scope", function(callback) {
					var topic = "function f() { new A(); class A {} }";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [{
							id: 'no-use-before-define',
							severity: 'warning',
							description: "'A' was used before it was defined.",
							nodeType: "Identifier"
						}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("Flag class expression in function scope", function(callback) {
					var topic = "function f() { new a(); var a = class {}; }";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [{
							id: 'no-use-before-define',
							severity: 'warning',
							description: "'a' was used before it was defined.",
							nodeType: "Identifier"
						}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("Flag named class expression in function scope", function(callback) {
					var topic = "function f() { new a(); var a = class A {}; }";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [{
							id: 'no-use-before-define',
							severity: 'warning',
							description: "'a' was used before it was defined.",
							nodeType: "Identifier"
						}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("Flag class declaration in block scope", function(callback) {
					var topic = "{ new A(); class A {} }";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [{
							id: 'no-use-before-define',
							severity: 'warning',
							description: "'A' was used before it was defined.",
							nodeType: "Identifier"
						}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("Flag class expression in block scope", function(callback) {
					var topic = "{ new a(); var a = class {}; }";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [{
							id: 'no-use-before-define',
							severity: 'warning',
							description: "'a' was used before it was defined.",
							nodeType: "Identifier"
						}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("Flag named class expression in block scope", function(callback) {
					var topic = "{ new a(); var a = class A {}; }";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [{
							id: 'no-use-before-define',
							severity: 'warning',
							description: "'a' was used before it was defined.",
							nodeType: "Identifier"
						}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("Flag let use in global scope", function(callback) {
					var topic = "a++; let a;";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [{
							id: 'no-use-before-define',
							severity: 'warning',
							description: "'a' was used before it was defined.",
							nodeType: "Identifier"
						}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("Flag const use in global scope", function(callback) {
					var topic = "a++; const a=1;";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [{
							id: 'no-use-before-define',
							severity: 'warning',
							description: "'a' was used before it was defined.",
							nodeType: "Identifier"
						}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("Flag let use in function scope", function(callback) {
					var topic = "function f() { a++; let a; }";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [{
							id: 'no-use-before-define',
							severity: 'warning',
							description: "'a' was used before it was defined.",
							nodeType: "Identifier"
						}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("Flag const use in function scope", function(callback) {
					var topic = "function f() { a++; const a=1; }";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [{
							id: 'no-use-before-define',
							severity: 'warning',
							description: "'a' was used before it was defined.",
							nodeType: "Identifier"
						}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("Flag let use in block scope", function(callback) {
					var topic = "{ a++; let a; }";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [{
							id: 'no-use-before-define',
							severity: 'warning',
							description: "'a' was used before it was defined.",
							nodeType: "Identifier"
						}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("Flag const use in block scope", function(callback) {
					var topic = "{ a++; const a=1; }";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [{
							id: 'no-use-before-define',
							severity: 'warning',
							description: "'a' was used before it was defined.",
							nodeType: "Identifier"
						}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("Flag let use in switch scope", function(callback) {
					var topic = "switch('a') { case 'a': a++; let a; }";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [{
							id: 'no-use-before-define',
							severity: 'warning',
							description: "'a' was used before it was defined.",
							nodeType: "Identifier"
						}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("Flag let use in arrow expr and block scope", function(callback) {
					var topic = "f => { a++; let a;};";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [{
							id: 'no-use-before-define',
							severity: 'warning',
							description: "'a' was used before it was defined.",
							nodeType: "Identifier"
						}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("Flag let use in arrow expr and no block scope", function(callback) {
					var topic = "f => a++; let a;";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [{
							id: 'no-use-before-define',
							severity: 'warning',
							description: "'a' was used before it was defined.",
							nodeType: "Identifier"
						}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("should flag var use that precedes declaration in Block", function(callback) {
					var topic = "{ a; var a; }";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [
							{
								id: RULE_ID,
								severity: 'warning',
								description: "'a' was used before it was defined.",
								nodeType: "Identifier"
							}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("should not flag var use inside Block", function(callback) {
					var topic = "var a; { a; var a; }";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [
							]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("should flag var use that precedes declaration in Switch", function(callback) {
					var topic = "switch('a') { case 'a': a++; var a; }";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [
							{
								id: RULE_ID,
								severity: 'warning',
								description: "'a' was used before it was defined.",
								nodeType: "Identifier"
							}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("should not flag var use in Switch", function(callback) {
					var topic = "var a; switch('a') { case 'a': a++; var a; }";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [
							]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
			});
			//SEMI ----------------------------------------------
			describe('semi', function() {
				var RULE_ID = "semi";
				it("should not flag 'for of' with VariableDeclaration", function(callback) {
					var topic = "for (var x of n) {}";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, []);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
			});
			//NO-SHADOW-GLOBAL ------------------------------------------------
			describe('no-shadow-global', function() {
				var RULE_ID = 'no-shadow-global';
				/**
				 * @since 12.0
				 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=495744
				 */
				this.timeout(1000000);
				it("should flag browser use list matching", function(callback) {
					var topic = "/* eslint-env browser*/ var [name, r] = [1,2];";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [
							{
								id: RULE_ID,
								severity: 'warning',
								description: "Variable 'name' shadows a global member."
							}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				it("should flag browser use object matching", function(callback) {
					var topic = "/*eslint-env browser */ function getSomething() { return {first : \"\", second: \"\", third: \"\" };} function f() { var { first: name, second: { something: name }} = getSomething();}";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [
							{
								id: RULE_ID,
								severity: 'warning',
								description: "Variable 'name' shadows a global member.",
								start: 124,
								end: 128
							},
							{
								id: RULE_ID,
								severity: 'warning',
								description: "Variable 'name' shadows a global member.",
								start: 151,
								end: 155
							}
							]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
			});
			//NO-REDECLARE -------------------------------------------------------
			describe('no-redeclare', function() {
				var RULE_ID = "no-redeclare";
				// https://bugs.eclipse.org/bugs/show_bug.cgi?id=495744
				it("should flag redeclaration in list matching", function(callback) {
					var topic = "(function fizz() {var [a, , a] = [1, 2, 3];});";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [
							{
								id: RULE_ID,
								severity: 'warning',
								description: "'a' is already defined.",
								nodeType: "Identifier"
							}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
				// https://bugs.eclipse.org/bugs/show_bug.cgi?id=495744
				it("should flag redeclaration in Program", function(callback) {
					var topic = "var a; var [a, b] = [1, 2];";
					var config = { rules: {} };
					config.rules[RULE_ID] = 1;
					validate({buffer: topic, callback: callback, config: config}).then(
						function (problems) {
							assertProblems(problems, [
							{
								id: RULE_ID,
								severity: 'warning',
								description: "'a' is already defined.",
								nodeType: "Identifier"
							}]);
						},
						function (error) {
							worker.getTestState().callback(error);
						});
				});
			});
			//SYNTAX ERRORS  -------------------------------------------------------
			describe('test syntax error', function() {
				it("No octal decimal in strict mode", function(callback) {
					var config = { rules: {} };
					validate({buffer: "var s = 'Hello\\712World'; console.log(s);", callback: callback, config: config}).then(function (problems) {
							assertProblems(problems, [
								{
									start: 14,
									end: 15,
									severity: 'error',
									description: 'Octal literal in strict mode'
								}
							]);
						}, function (error) {
							worker.getTestState().callback(error);
						});
				});
			});
		});
	};
});
