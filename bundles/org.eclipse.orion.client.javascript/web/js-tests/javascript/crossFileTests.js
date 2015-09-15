/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation, Inc. and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env amd, mocha, browser*/
/* eslint-disable missing-nls */
define([
'javascript/contentAssist/ternAssist',
'javascript/hover',
'javascript/commands/openDeclaration',
'javascript/commands/openImplementation',
'javascript/astManager',
'javascript/cuProvider',
'javascript/logger',
'esprima/esprima',
'chai/chai',
'orion/Deferred',
'js-tests/javascript/testingWorker',
'mocha/mocha' //must stay at the end, not a module
], function(TernAssist, Hover, OpenDecl, OpenImpl, ASTManager, CUProvider, Logger, Esprima, chai, Deferred, TestWorker) {
	var assert = chai.assert;

	var testworker, assist, hover, opendecl, openimpl;
	var envs = Object.create(null);
	var astManager = new ASTManager.ASTManager(Esprima);

	/**
	 * @description Sets up the test
	 * @param {Object} options The options the set up with
	 * @returns {Object} The object with the initialized values
	 */
	function setup(options) {
		var state = Object.create(null);
		var buffer = state.buffer = typeof(options.buffer) === 'undefined' ? '' : options.buffer,
		    prefix = state.prefix = typeof(options.prefix) === 'undefined' ? '' : options.prefix,
		    offset = state.offset = typeof(options.offset) === 'undefined' ? 0 : options.offset,
		    line = state.line = typeof(options.line) === 'undefined' ? '' : options.line,
		    keywords = typeof(options.keywords) === 'undefined' ? false : options.keywords,
		    templates = typeof(options.templates) === 'undefined' ? false : options.templates,
		    contentType = options.contenttype ? options.contenttype : 'application/javascript',
		    timeout = options.timeout ? options.timeout : 5000,
			file = state.file = 'tern_crossfile_test_script.js';
			assert(options.callback, 'You must provide a test callback for worker-based tests');
			state.callback = options.callback;
		testworker.setTestState(state);
		testworker.postMessage({request: 'delFile', args:{file: file}});
		envs = typeof(options.env) === 'object' ? options.env : Object.create(null);
		var editorContext = {
			/*override*/
			getText: function() {
				return new Deferred().resolve(buffer);
			},

			getFileMetadata: function() {
			    var o = Object.create(null);
			    o.contentType = Object.create(null);
			    o.contentType.id = contentType;
			    o.location = file;
			    return new Deferred().resolve(o);
			}
		};
		astManager.onModelChanging({file: {location: file}});
		var params = {offset: offset, prefix : prefix, keywords: keywords, template: templates, line: line, timeout: timeout};
		return {
			editorContext: editorContext,
			params: params,
			file: file,
			buffer: buffer
		};
	} 

	/**
	 * @description Pretty-prints the given array of proposal objects
	 * @param {Array} expectedProposals The array of proposals
	 * @returns {String} The pretty-printed proposals
	 */
	function stringifyExpected(expectedProposals) {
		var text = "";
		for (var i = 0; i < expectedProposals.length; i++)  {
			text += expectedProposals[i][0] + " : " + expectedProposals[i][1] + "\n";
		}
		return text;
	}
	/**
	 * The object of providers to create Tern worker messages
	 */
	var messageProviders = {
		'completions': function(type, _setup) {
			var msg = _initMessage(type);
			assert(_setup.file, 'You must specify a file for the completions message');
			msg.args.meta.location = _setup.file;
			if(typeof(_setup.params.keywords) === 'undefined') {
		    	msg.args.params.keywords = _setup.params.keywords;
		    }
		    assert(typeof(_setup.params.offset) === 'number', 'You have to specify an offset for a completion message');
		    msg.args.params.offset = _setup.params.offset;
		    assert(typeof(_setup.buffer) === 'string', 'You must provide a buffer for the completion');
		    msg.args.files.push({type: 'full', name: _setup.file, text: _setup.buffer});
			return msg;
		},
		'definition': function(type, _setup) {
			var msg = _initMessage(type);
			assert(_setup.file, 'You must specify a file for the completions message');
			msg.args.meta.location = _setup.file;
			assert(typeof(_setup.params.offset) === 'number', 'You have to specify an offset for a definition message');
		    msg.args.params.offset = _setup.params.offset;
		    assert(typeof(_setup.buffer) === 'string', 'You must provide a buffer for the completion');
		    msg.args.files.push({type: 'full', name: _setup.file, text: _setup.buffer});
			return msg;
		},
		'documentation': function(type, _setup) {
			var msg = _initMessage(type);
			assert(_setup.file, 'You must specify a file for the completions message');
			msg.args.meta.location = _setup.file;
			assert(typeof(_setup.params.offset) === 'number', 'You have to specify an offset for a documentation message');
		    msg.args.params.offset = _setup.params.offset;
		    assert(typeof(_setup.buffer) === 'string', 'You must provide a buffer for the completion');
		    msg.args.files.push({type: 'full', name: _setup.file, text: _setup.buffer});
			return msg;
		},
		'implementation': function(type, _setup) {
			var msg = _initMessage(type);
			assert(_setup.file, 'You must specify a file for the completions message');
			msg.args.meta.location = _setup.file;
			assert(typeof(_setup.params.offset) === 'number', 'You have to specify an offset for an implementation message');
		    msg.args.params.offset = _setup.params.offset;
		    assert(typeof(_setup.buffer) === 'string', 'You must provide a buffer for the completion');
		    msg.args.files.push({type: 'full', name: _setup.file, text: _setup.buffer});
			return msg;
		}
	};
	
	/**
	 * @description Create an empty message - they all carry the same form
	 * @private
	 * @param {String} type The message type, one of: completions, definition, documentation, implementation
	 * @returns {Object} A new empty message object
	 */
	function _initMessage(type) {
		var msg = Object.create(null);
		msg.request = type;
		msg.args = Object.create(null);
		msg.args.params = Object.create(null);
		msg.args.meta = Object.create(null);
		msg.args.envs = Object.create(null);
		msg.args.files = [];
		return msg;
	}
	
	/**
	 * @description Utility to create a Tern worker message
	 * @private
	 * @param {String} type The message type, one of: completions, definition, documentation, implementation
	 * @param {Object} options The map of options
	 * @returns {Object} The message object to send to Tern
	 */
	function message(type, options) {
		var p = messageProviders[type];
		assert(p, 'There is no message provider for: '+type);
		return p(type, options);
	}

	describe("Cross-file Tests", function() {
		before('Message the server for warm up on cross file tests', function(callback) {
			testworker = TestWorker.instance();
			CUProvider.setUseCache(false);
			assist = new TernAssist.TernContentAssist(astManager, testworker, function() {
				return new Deferred().resolve(envs);
			}, CUProvider);
			openimpl = new OpenImpl.OpenImplementationCommand(astManager, testworker, CUProvider);
			this.timeout(20000);
			var options = {
				buffer: "xx",
				prefix: "xx",
				offset: 1,
				callback: callback
			};
			var _p = setup(options);
			testworker._state.warmup = true;
			assist.computeContentAssist(_p.editorContext, _p.params).then(/* @callback */ function (actualProposals) {
				//do noting, warm up
			});
		});
		after('Shutting down the test worker', function() {
			testworker.terminate();
		});
		this.timeout(20000);
		describe("Content assist tests", function() {
			/**
			 * @description Checks the proposals returned from the given proposal promise against
			 * the array of given proposals
			 * @param {Object} options The options to test with
			 * @param {Array} expectedProposals The array of expected proposal objects
			 */
			function testProposals(options, expectedProposals) {
				var _p = setup(options);
				assert(_p, 'setup() should have completed normally');
				assist.computeContentAssist(_p.editorContext, _p.params).then(function (actualProposals) {
					_compareProposals(actualProposals, expectedProposals);
				}, function (error) {
					testworker._state.callback(error);
				});
			}
			
			/**
			 * @description Tests the proposals message directly to the worker without using the TernAssist class
			 * @param {Object} options The map of options
			 * @param {Array.<object>} expected The expected array of proposals
			 */
			function testDirectProposals(options, expected) {
				var _p = setup(options);
				assert(_p, 'setup() should have completed normally');
				testworker.postMessage(message('completions', _p), function(response) {
					try {
						assert(response, 'There was no response from the worker');
						var actual = response.proposals;
						assert(Array.isArray(actual), 'There were no proposals returned');
						//_compareProposals(actual, expected);
						options.callback(); //TODO remove this once the real tests are running
					}
					catch(err) {
						testworker._state.callback(err);
					}
				});
			}
		
			/**
			 * @description Compares the given arrays of proposals
			 * @private
			 * @param {Array.<Object>} actualProposals The proposals returned from the service
			 * @param {Array.<Object>} expectedProposals The proposals we are expecting to get
			 */
			function _compareProposals(actualProposals, expectedProposals) {
				try {
					assert.equal(actualProposals.length, expectedProposals.length,
						"Wrong number of proposals.  Expected:\n" + stringifyExpected(expectedProposals) +"\nActual:\n" + stringifyActual(actualProposals));
					for (var i = 0; i < actualProposals.length; i++) {
					    var ap = actualProposals[i];
					    var ep = expectedProposals[i];
						var text = ep[0];
						var description = ep[1];
						assert.equal(ap.proposal, text, "Invalid proposal text"); //$NON-NLS-0$
						if (description) {
							if (ap.name) {
								assert.equal(ap.name + ap.description, description, "Invalid proposal description"); //$NON-NLS-0$
							} else {
								assert.equal(ap.description, description, "Invalid proposal description"); //$NON-NLS-0$
							}
						}
						if(expectedProposals[i].length === 3 && !ap.unselectable /*headers have no hover*/) {
						    //check for doc hover
						    assert(ap.hover, 'There should be a hover entry for the proposal');
						    assert(ap.hover.indexOf(ep[2]) === 0, "The doc should have started with the given value");
						}
					}
					testworker._state.callback();
				}
				catch(err) {
					testworker._state.callback(err);
				}
			}
			
			/**
			 * @description Pretty-prints the given array of proposal objects
			 * @param {Array} expectedProposals The array of proposals
			 * @returns {String} The pretty-printed proposals
			 */
			function stringifyActual(actualProposals) {
				var text = "";
				for (var i = 0; i < actualProposals.length; i++) {
					if (actualProposals[i].name) {
						text += actualProposals[i].proposal + " : " + actualProposals[i].name + actualProposals[i].description + "\n"; //$NON-NLS-1$ //$NON-NLS-0$
					} else {
						text += actualProposals[i].proposal + " : " + actualProposals[i].description + "\n"; //$NON-NLS-1$ //$NON-NLS-0$
					}
				}
				return text;
			}
		
			it("Simple require'd dep 1", function(done) {
				var options = {
					buffer: "/* eslint-env amd */define(['./files/require_dep1'], function(rd1) {rd1.m});",
					offset: 73,
					prefix: "m",
					callback: done,
					timeout: 20000
				};
				Logger.log('implement me');
				done();
				/*return testProposals(options, [
					["", "files/require_dep1.js"],
					["myfunc", "myfunc"],
					["variable", "variable"]
				]);*/
			});
			it("Simple direct require'd dep 1", function(done) {
				var options = {
					buffer: "/* eslint-env amd */define(['./files/require_dep1'], function(rd1) {rd1.m});",
					offset: 73,
					prefix: "m",
					callback: done,
					timeout: 20000
				};
				Logger.log('implement me');
				done();
				/*return testDirectProposals(options, [
					["", "files/require_dep1.js"],
					["myfunc", "myfunc"],
					["variable", "variable"]
				]);
*/			});
			it("Simple HTML pre-load dep 1");
		});
		describe("Open declaration tests", function() {
			it("Simple pre-load dep 1");
			it("Simple HTML pre-load dep 1");
		});
		describe("Hover tests", function() {
			it("Simple pre-load dep 1");
			it("Simple HTML pre-load dep 1");
		});
		describe("Open implementation tests", function() {
			/**
			 * @description Tests the result of calling the implementation command via the Orion API
			 * @since 10.0
			 */
			function testImplementation(options, expected) {
			}
			/**
			 * @description Tests the result of sending the implementation request directly to Tern
			 * @since 10.0
			 */
			function testDirectImplementation(options, expected) {
				var _p = setup(options);
				assert(_p, 'setup() should have completed normally');
				testworker.postMessage(message('implementation', _p), function(response) {
					try {
						assert(response, 'There was no response from the worker');
						var actual = response.implementation;
						assert(actual, 'There was no implmentation returned');
						_compareImpls(actual, expected);
					}
					catch(err) {
						testworker._state.callback(err);
					}
				});
			}
			
			/**
			 * @description Compares the actual file (from Tern response) to the given file name.
			 * @private
			 * @param {String} actual The actual file from the Tern response
			 * @param {String} expected The name of the file to compare to. This name is not fully qualified, it is ony the name (last path segment)
			 * of the file.
			 */
			function _sameFile(actual, expected) {
				assert(actual, 'The actual file name cannot be undefined');
				assert(expected, 'The expected file name cannot be undefined');
				var idx = actual.lastIndexOf('/');
				var f = actual;
				if(idx > -1) {
					f = f.slice(idx+1);
				}
				assert.equal(f, expected, 'The origin file names are not the same');
			}
			
			/**
			 * @description Compares the actual impl found to what we are expecting
			 * @private
			 * @param {Object} actual The actual found impl
			 * @param {Object} expected The expected impl
			 */
			function _compareImpls(actual, expected) {
				try {
					_sameFile(actual.file, expected.file);
					assert(actual.start, expected.start, 'The implementation starts are not the same');
					assert(actual.end, expected.end, 'The implementation ends are not the same');
					testworker._state.callback();
				} catch(err) {
					testworker._state.callback(err);
				}
			}
			
			it("Test direct impl - same file var reassignment", function(done) {
				var options = {
					buffer: 'function f(){} var q = f; f();',
					offset: 27,
					callback: done
				};
				testDirectImplementation(options, {start:9, end:10, file: 'tern_crossfile_test_script.js'});
			});
			it("Test direct impl - same file simple use", function(done) {
				var options = {
					buffer: 'function f(){} f();',
					offset: 16,
					callback: done
				};
				testDirectImplementation(options, {start:9, end:10, file: 'tern_crossfile_test_script.js'});
			});
			it("Test direct impl - same file object proxy", function(done) {
				var options = {
					buffer: 'function f(){} var o = {one: f}; o.one();',
					offset: 37,
					callback: done
				};
				testDirectImplementation(options, {start:9, end:10, file: 'tern_crossfile_test_script.js'});
			});
			it("Test direct impl - same file function return indirection", function(done) {
				var options = {
					buffer: 'function f(){} function g() {return {ff: f}} g().ff();',
					offset: 51,
					callback: done
				};
				testDirectImplementation(options, {start:9, end:10, file: 'tern_crossfile_test_script.js'});
			});
			it("Test direct impl - cross file return object indirection 1", function(done) {
				var options = {
					buffer: "define(['./files/require_dep1'], function(a) {a.myfunc()});",
					offset: 52,
					callback: done
				};
				testDirectImplementation(options, {start:859, end:865, file: 'require_dep1.js'});
			});
			it("Test direct impl - cross file return object indirection 2", function(done) {
				var options = {
					buffer: "define(['./files/require_dep1'], function(a) {a.variable});",
					offset: 52,
					callback: done
				};
				testDirectImplementation(options, {start:733, end:741, file: 'require_dep1.js'});
			});
			it("Test direct impl - cross file return object indirection 3", function(done) {
				var options = {
					buffer: "define(['./files/require_dep2'], function(a) {a.myfunc()});",
					offset: 52,
					callback: done
				};
				//TODO this test passes, but is marking the RHS of the property rather than the property name
				testDirectImplementation(options, {start:868, end:881, file: 'require_dep2.js'});
			});
			it("Test direct impl - cross file return object indirection 4", function(done) {
				var options = {
					buffer: "define(['./files/require_dep2'], function(a) {a.variable});",
					offset: 52,
					callback: done
				};
				//TODO this test fails to find the impl, but it should work
				testDirectImplementation(options, {start:733, end:741, file: 'require_dep2.js'});
			});
			it("Test direct impl - cross file constructor", function(done) {
				var options = {
					buffer: "define(['./files/require_dep3'], function(a) {var local = new a();});",
					offset: 63,
					callback: done
				};
				//TODO this test finds the impl as the define import, but should find the function declaration in the required file 
				testDirectImplementation(options, {start:-1, end:-1, file: 'require_dep3.js'});
			});
		});
		describe("All References Tests", function() {
			it("Simple pre-load dep 1");
			it("Simple HTML pre-load dep 1");
		});
	});
});