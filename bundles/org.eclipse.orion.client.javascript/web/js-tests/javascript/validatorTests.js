/*******************************************************************************
 * @license
 * Copyright (c) 2014, 2015 IBM Corporation and others.
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
	'javascript/cuProvider',
	"orion/i18nUtil",
	"i18n!javascript/nls/problems",
	'js-tests/javascript/testingWorker',
	'mocha/mocha', //must stay at the end, not a module
], function(Validator, chai, Deferred, CUProvider, i18nUtil, messages, TestWorker) {
	var assert = chai.assert;
	var testworker;

	describe('Validator Tests', function() {
		
		/**
		 * @description Sets up the test
		 * @param {Object} options {buffer, contentType}
		 * @returns {Object} The object with the initialized values
		 */
		function setup(options) {
			var buffer = options.buffer;
			var contentType = options.contentType ? options.contentType : 'application/javascript';
			var validator = new Validator(testworker, CUProvider);
			var state = Object.create(null);
			assert(options.callback, "You must provide a callback for a worker-based test");
			state.callback = options.callback;
			testworker.setTestState(state);
			var editorContext = {
				/*override*/
				getText: function() {
					return new Deferred().resolve(buffer);
				},
				
				getFileMetadata: function() {
					var o = Object.create(null);
					o.contentType = Object.create(null);
					o.contentType.id = contentType;
					o.location = 'validator_test_script.js';
					if (contentType === 'text/javascript'){
						o.location = 'validator_test_script.html';
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
		 * @callback from Mocha after each test run
		 */
		afterEach(function() {
			CUProvider.onModelChanging({file: {location: 'validator_test_script.js'}});
		});
		
		/**
		 * @name validate
		 * @description Runs the validator on the given options
		 * @param {Object} options {buffer, contentType}
		 * @returns {orion.Promise} The validation promise
		 */
		function validate(options) {
			var obj = setup(options);
			return obj.validator.computeProblems(obj.editorContext, {contentType: obj.contentType});
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
					assert.equal(pb.start, expb.start, "Wrong problem start");
					assert.equal(pb.end, expb.end, "Wrong problem end");
					assert.equal(pb.line, expb.line, "Wrong problem line number");
					assert.equal(pb.description, expb.description, "Wrong problem message");
					assert.equal(pb.severity, expb.severity, "Wrong problem severity");
					if(pb.descriptionArgs) {
						assert(expb.descriptionArgs, "Missing expected description arguments");
						assert.equal(pb.descriptionArgs.nls, expb.descriptionArgs.nls, "Missing NLS descriptipon argument key");
					}
				}
				testworker.getTestState().callback();
			}
			catch(err) {
				testworker.getTestState().callback(err);
			}
		}
	
		before('Start the testing worker', function(callback) {
			this.timeout(20000);
			testworker = TestWorker.instance({callback: callback});
		});
		after("Shut down the testing worker", function() {
			testworker.terminate();
		});
		this.timeout(1000000);
		it("Test EOF 1", function(callback) {
			validate({buffer: "function", callback: callback}).then(function (problems) {
					assertProblems(problems, [
						{start: 0,
						 end: 8,
						 severity: 'error',
						 description: i18nUtil.formatMessage.call(null, messages['syntaxErrorIncomplete'], {nls: 'syntaxErrorIncomplete'})
						}
					]);
				}, function (error) {
					testworker.getTestState().callback(error);
				});
		});
		
		it("Test EOF 2", function(callback) {
			validate({buffer: "var foo = 10;\nfunction", callback: callback}).then(function (problems) {
					assertProblems(problems, [
						{start: 14,
						 end: 22,
						 severity: 'error',
						 description: i18nUtil.formatMessage.call(null, messages['syntaxErrorIncomplete'], {nls: 'syntaxErrorIncomplete'})
						}
					]);
				}, function (error) {
					testworker.getTestState().callback(error);
				});
		});
		
		it("Test invalid regex 1", function(callback) {
			validate({buffer: "/", callback: callback}).then(function (problems) {
					assertProblems(problems, [
						{start: 0, 
						 end: 1, 
						 severity: 'error', 
						 description: 'Invalid regular expression: missing /' //i18nUtil.formatMessage.call(null, messages['esprimaParseFailure'], {
								//0: "Invalid regular expression: missing /",
								//nls: "esprimaParseFailure"
							 //})
						 },
						{start: 0, 
						 end: 1, 
						 severity: 'error', 
						 description: i18nUtil.formatMessage.call(null, messages['syntaxErrorBadToken'], {
							0: "/",
							nls: "syntaxErrorBadToken"
						 })
						 }
					]);
				}, function (error) {
					testworker.getTestState().callback(error);
				});
		});
		
		describe("HTML script block validation tests", function(){
			/*
			 * Tests that the validator runs correctly on script blocks and wrapped functions in HTML files
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it("HTML Script Block - simple block unused var", function(callback) {
				validate({buffer: '<html><head><script>var xx = 0; this.x;</script></head></html>', contentType: 'text/html', callback: callback}).then(function (problems) {
					assertProblems(problems, [
						{start: 24,
						 end: 26,
						 severity: 'warning',
						 description: i18nUtil.formatMessage.call(null, messages['no-unused-vars-unread'], {0: 'xx', nls: 'no-unused-vars-unread'})
						}
					]);
				}, function (error) {
					testworker.getTestState().callback(error);
				});
			});
			/*
			 * Tests that the validator runs correctly on script blocks and wrapped functions in HTML files
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it("HTML Script Block - simple block missing semi", function(callback) {
				validate({buffer: '<html><head><script>var xx = 0; xx++; this.x</script></head></html>', contentType: 'text/html', callback: callback}).then(function (problems) {
					assertProblems(problems, [
						{start: 43,
						 end: 44,
						 severity: 'warning',
						 description: i18nUtil.formatMessage.call(null, messages['semi'], {})
						}
					]);
				}, function (error) {
					testworker.getTestState().callback(error);
				});
			});
			/*
			 * Tests that the validator runs correctly on script blocks and wrapped functions in HTML files
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it("HTML Script Block - empty block", function(callback) {
				validate({buffer: '<html><head><script></script></head></html>', contentType: 'text/html', callback: callback}).then(function (problems) {
					assertProblems(problems, [
					]);
				}, function (error) {
					testworker.getTestState().callback(error);
				});
			});
			/*
			 * Tests that the validator runs correctly on script blocks and wrapped functions in HTML files
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it("HTML Script Block - multi block used var 1", function(callback) {
				validate(
					{buffer: '<html><head><script>var xx;</script></head><body><a>test</a><script>xx++;</script></body></html>', contentType: 'text/html', callback: callback}).then(
					function (problems) {
						assertProblems(problems, [
						]);
					},
					function (error) {
						testworker.getTestState().callback(error);
					});
			});
			/*
			 * Tests that the validator runs correctly on script blocks and wrapped functions in HTML files
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it("HTML Script Block - multi block used var 2", function(callback) {
				validate(
					{buffer: '<html><head><script>xx++;</script></head><body><a>test</a><script>var xx;</script></body></html>', contentType: 'text/html', callback: callback}).then(
					function (problems) {
						assertProblems(problems, [
							{start: 20,
							 end: 22,
							 severity: 'warning',
							 description: i18nUtil.formatMessage.call(null, messages['no-use-before-define'], {0: 'xx', nls: 'no-use-before-define'})
							}
						]);
					},
					function (error) {
						testworker.getTestState().callback(error);
					});
			});
			/*
			 * Tests that the validator runs correctly on script blocks and wrapped functions in HTML files
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it("HTML Script Block - multi block unused var", function(callback) {
				validate(
					{buffer: '<html><head><script>var xx;</script></head><body><a>test</a><script>var yy;</script></body></html>', contentType: 'text/html', callback: callback}).then(
					function (problems) {
						assertProblems(problems, [
							{start: 24,
							 end: 26,
							 severity: 'warning',
							 description: i18nUtil.formatMessage.call(null, messages['no-unused-vars-unused'], {0: 'xx', nls: 'no-unused-vars-unused'})
							},
							{start: 72,
							 end: 74,
							 severity: 'warning',
							 description: i18nUtil.formatMessage.call(null, messages['no-unused-vars-unused'], {0: 'yy', nls: 'no-unused-vars-unused'})
							}
						]);
					},
					function (error) {
						testworker.getTestState().callback(error);
					});
				});
			/*
			 * Tests that the validator runs correctly on script blocks and wrapped functions in HTML files
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it("HTML Wrapped Function - multi block unused var", function(callback) {
				validate(
					{buffer: '<html><head><script></script></head><body><a onclick="xx;;"></a></body></html>', contentType: 'text/html', callback: callback}).then(
					function (problems) {
						assertProblems(problems, [
							{start: 57,
							 end: 58,
							 severity: 'warning',
							 description: i18nUtil.formatMessage.call(null, messages['no-extra-semi'], {})
							}
						]);
					},
					function (error) {
						testworker.getTestState().callback(error);
					});
			});
			/*
			 * Tests that the validator runs correctly on script blocks and wrapped functions in HTML files
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it("HTML - Empty array for empty blocks", function(callback) {
				validate(
					{buffer: '<html><head><script></script></head><body><a onclick=""></a></body></html>', contentType: 'text/html', callback: callback}).then(
					function (problems) {
						assertProblems(problems, [
						]);
					},
					function (error) {
						testworker.getTestState().callback(error);
					});
			});
		});

	});
});
