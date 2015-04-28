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
/*eslint-env amd, mocha, node, browser*/
/*global doctrine*/
define([
'javascript/contentAssist/ternAssist',
'javascript/astManager',
'esprima',
'chai/chai',
'orion/Deferred',
'mocha/mocha', //must stay at the end, not a module
'doctrine' //must stay at the end, does not export a module 
], function(TernAssist, ASTManager, Esprima, chai, Deferred) {
	var assert = chai.assert;

	var state;
	var ternworker = new Worker('../../javascript/plugins/ternWorker.js');
	ternworker.onmessage = function(ev) {
		if(typeof(ev.data) === 'object') {
			var _d = ev.data;
			if(_d.request === 'read') {
				ternworker.postMessage({request: 'read', args: {contents: state.buffer, file: state.file}});
			} else if(typeof(_d.request) === 'string') {
				//don't process requests other than the ones we want
				return;
			} else if(_d.error) {
				var err = _d.error;
				if(err instanceof Error) {
					state.callback(err);
				} else if(typeof(err) === 'string') {
					if(typeof(_d.message) === 'string') {
						state.callback(new Error(err+": "+_d.message));
					} else {
						//wrap it
						state.callback(new Error(err));
					}
				} else if(err && typeof(err.message) === 'string') {
					state.callback(new Error(err.message));
				}
			}
			else {
				state.callback(new Error('Got message I don\'t know'));
			}
		}
	};
	ternworker.onerror = function(err) {
		if(err instanceof Error) {
			state.callback(err);
		} else if(typeof(err) === 'string') {
			//wrap it
			state.callback(new Error(err));
		} else if(err && typeof(err.message) === 'string') {
			state.callback(new Error(err.message));
		}
	};
	ternworker.postMessage('tests_ready');
	
	var astManager = new ASTManager.ASTManager(Esprima);
	var ternAssist = new TernAssist.TernContentAssist(astManager, ternworker);

	/**
	 * @description Sets up the test
	 * @param {Object} options The options the set up with
	 * @returns {Object} The object with the initialized values
	 */
	function setup(options) {
		state = Object.create(null);
		var buffer = state.buffer = typeof(options.buffer) === 'undefined' ? '' : options.buffer,
		    prefix = state.prefix = typeof(options.prefix) === 'undefined' ? '' : options.prefix,
		    offset = state.offset = typeof(options.offset) === 'undefined' ? 0 : options.offset,
		    keywords = typeof(options.keywords) === 'undefined' ? false : options.keywords,
		    templates = typeof(options.templates) === 'undefined' ? false : options.templates,
		    contentType = options.contenttype ? options.contenttype : 'application/javascript',
			file = state.file = 'tern_content_assist_test_script.js';
			assert(options.callback, 'You must provide a test callback for worker-based tests');
			state.callback = options.callback;
			ternworker.postMessage({request: 'delfile', args:{file: file}});
			
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
		var params = {offset: offset, prefix : prefix, keywords: keywords, template: templates};
		return {
			editorContext: editorContext,
			params: params
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
				state.callback();
			}
			catch(err) {
				state.callback(err);
			}
		}, function (error) {
			state.callback(error);
		});
	}

	before('Message the server', function() {
		ternworker.postMessage('before_all');
	});

	describe('Tern Content Assist Tests', function() {
		this.timeout(20000);
		describe('Complete Syntax', function() {
			it("test no dupe 1", function(done) {
				var options = {
					buffer: "x",
					prefix: "x",
					offset: 1,
					callback: done
				};
				testProposals(options, []);
			});
			it("test no dupe 2", function(done) {
				var options = {
					buffer: "var coo = 9; var other = function(coo) { c }",
					prefix: "c",
					offset: 42,
					callback: done
				};
				testProposals(options, [
					["coo", "coo : Any"]
				]);
			});
		
			it("test no dupe 3", function(done) {
				var options = {
					buffer: "var coo = { }; var other = function(coo) { coo = 9;\nc }",
					prefix: "c",
					offset: 53,
					callback: done
				};
				testProposals(options, [
					["coo", "coo : Number"]
				]);
			});
		});
		describe('Incomplete Syntax', function() {
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=465334
			 */
			it("test shorthand if 1", function(done) {
				var options = {
					buffer: "var foo = {}; var bar = foo ? f",
					prefix: "f",
					offset: 31,
					callback: done
				};
				testProposals(options, [
					["foo", "foo : foo"]
				]);
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=465334
			 */
			it("test shorthand if 2", function(done) {
				var options = {
					buffer: "var foo = {}; var bar = foo && !false && foo.baz || foo.err ? foo : u",
					prefix: "u",
					offset: 69,
					callback: done
				};
				testProposals(options, [
					["", "ecma5", ""],
					["undefined", "undefined : Any"]
				]);
			});
		});
	});
});
