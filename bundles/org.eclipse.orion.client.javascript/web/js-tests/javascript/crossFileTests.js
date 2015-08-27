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
'javascript/astManager',
'esprima',
'chai/chai',
'orion/Deferred',
'js-tests/javascript/testingWorker',
'mocha/mocha', //must stay at the end, not a module
'doctrine' //must stay at the end, does not export a module
], function(TernAssist, ASTManager, Esprima, chai, Deferred, TestWorker) {
	var assert = chai.assert;
 
	var testworker;
	var envs = Object.create(null);
	var astManager = new ASTManager.ASTManager(Esprima);
	var ternAssist;
	var fileMap = Object.create(null);
	
	/**
	 * @description Sets up the test
	 * @param {Object} options The options the set up with
	 * @returns {Object} The object with the initialized values
	 */
	function setup(options) {
		var state = Object.create(null);
		fileMap = Object.create(null);
		var buffer = state.buffer = typeof(options.buffer) === 'undefined' ? '' : options.buffer,
		    prefix = state.prefix = typeof(options.prefix) === 'undefined' ? '' : options.prefix,
		    offset = state.offset = typeof(options.offset) === 'undefined' ? 0 : options.offset,
		    line = state.line = typeof(options.line) === 'undefined' ? '' : options.line,
		    keywords = typeof(options.keywords) === 'undefined' ? false : options.keywords,
		    templates = typeof(options.templates) === 'undefined' ? false : options.templates,
		    contentType = options.contenttype ? options.contenttype : 'application/javascript',
			file = state.file = 'tern_content_assist_test_script.js';
			assert(options.callback, 'You must provide a test callback for worker-based tests');
			state.callback = options.callback;
		testworker.setTestState(state);
		testworker.postMessage({request: 'delfile', args:{file: file}});
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
		var params = {offset: offset, prefix : prefix, keywords: keywords, template: templates, line: line};
		return {
			editorContext: editorContext,
			params: params
		};
	}

	/**
	 * @description Adds a file to the file map
	 * @param {String} name The name of the file
	 * @param {String} source The source for the file
	 * @param {String} contentType The content type
	 * @since 10.0
	 */
	function addFile(name, source, contentType) {
		var meta = Object.create(null);
		meta.contenttype = Object.create(null);
		meta.contenttype.id = contentType;
		meta.location = name;
		meta.contents = source;
		fileMap[name] = meta;
	}

	function removeFile(name) {
		if(fileMap[name]) {
			delete fileMap[name];
		}
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

	/**
	 * @description Checks the proposals returned from the given proposal promise against
	 * the array of given proposals
	 * @param {Object} options The options to test with
	 * @param {Array} expectedProposals The array of expected proposal objects
	 */
	function testProposals(options, expectedProposals) {
		var _p = setup(options);
		assert(_p, 'setup() should have completed normally');
		ternAssist.computeContentAssist(_p.editorContext, _p.params).then(function (actualProposals) {
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
		}, function (error) {
			testworker._state.callback(error);
		});
	}

	describe("Cross-file Tests", function() {
		before('Message the server for warm up on cross file tests', function(callback) {
			testworker = TestWorker.instance();
			ternAssist = new TernAssist.TernContentAssist(astManager, testworker, function() {
				return new Deferred().resolve(envs);
			});
			this.timeout(10000);
			var options = {
				buffer: "xx",
				prefix: "xx",
				offset: 1,
				callback: callback
			};
			var _p = setup(options);
			testworker._state.warmup = true;
			ternAssist.computeContentAssist(_p.editorContext, _p.params).then(/* @callback */ function (actualProposals) {
				//do noting, warm up
			});
		});
		after('Shutting down the test worker', function() {
			if(testworker) {
				testworker.terminate();
			}
		});
		describe("Content assist tests", function() {
			it("Simple pre-load dep 1");
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
			it("Simple pre-load dep 1");
			it("Simple HTML pre-load dep 1");
		});
		describe("All References Tests", function() {
			it("Simple pre-load dep 1");
			it("Simple HTML pre-load dep 1");
		});
	});
});