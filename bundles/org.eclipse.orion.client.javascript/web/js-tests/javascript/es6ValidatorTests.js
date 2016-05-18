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
	'mocha/mocha', //must stay at the end, not a module
], function(Validator, chai, Deferred) {
	var assert = chai.assert;
	return function(worker) {
		describe('ES6 Validator Tests', function() {
			
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
		});
	};
});
