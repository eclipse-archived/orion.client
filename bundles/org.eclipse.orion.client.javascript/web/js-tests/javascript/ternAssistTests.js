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
/* eslint-disable missing-nls */
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
		} else if(typeof(ev.data) === 'string' && ev.data === 'server_ready' && state.warmup) {
			delete state.warmup;
			state.callback();
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
	var envs = Object.create(null);
	var astManager = new ASTManager.ASTManager(Esprima);
	var ternAssist = new TernAssist.TernContentAssist(astManager, ternworker, function() {
			return new Deferred().resolve(envs);
		});

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

	before('Message the server for warm up', function(callback) {
		this.timeout(10000);
		var options = {
			buffer: "xx",
			prefix: "xx",
			offset: 1,
			callback: callback
		};
		var _p = setup(options);
		state.warmup = true;
		ternAssist.computeContentAssist(_p.editorContext, _p.params).then(/* @callback */ function (actualProposals) {
			//do noting, warm up
		});
	});

	describe('Tern Content Assist Tests', function() {
		this.timeout(10000);
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
		describe('Function Templates and Keywords', function() {
			/**
			 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=425675
			 * @since 5.0
			 */
			it("test completions for Function1", function(done) {
				var options = {
					buffer: "var foo; foo !== null ? fun : function(f2) {};", 
					prefix: "fun",
					offset: 27,
					templates: true,
					keywords: true,
					callback: done};
				return testProposals(options, [
						//proposal, description
						["function", "function - Keyword"],
						["", "Templates"], 
						["/**\n * @name name\n * @param parameter\n */\nfunction name (parameter) {\n\t\n}", "function - function declaration"]
						]);
			});
			/**
			 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=425675
			 * @since 5.0
			 */
			it("test completions for Function2", function(done) {
				var options = {
					buffer: "var foo; foo !== null ? function(f2) {} : fun;",
					prefix: "fun",
					offset: 45,
					templates: true,
					keywords: true,
					callback: done
				};
				return testProposals(options, [
						//proposal, description
						["function", "function - Keyword"],
						["", "Templates"], 
						["/**\n * @name name\n * @param parameter\n */\nfunction name (parameter) {\n\t\n}", "function - function declaration"],
						]);
			});
			/**
			 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=425675
			 * @since 5.0
			 */
			it("test completions for Function3", function(done) {
				var options = {
					buffer: "var foo = {f: fun};", 
					prefix: 'fun',
					offset: 17,
					templates: true,
					keywords: true,
					callback: done
				};
				return testProposals(options, [
						//proposal, description
						["function", "function - Keyword"],
						["", "Templates"], 
						['ction(parameter) {\n\t\n}', 'function - member function expression'],
						]);
			});
			/**
			 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=425675
			 * @since 5.0
			 */
			it("test completions for Function4", function(done) {
				var options = {
					buffer: "var foo = {f: fun};", 
					prefix: 'fun',
					offset: 17,
					templates: true,
					keywords: true,
					callback: done
				};
				return testProposals(options, [
						//proposal, description
						["function", "function - Keyword"],
						["", "Templates"], 
						['ction(parameter) {\n\t\n}', 'function - member function expression'],
						]);
			});
			/**
			 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=425675
			 * @since 5.0
			 */
			it("test completions for Function5", function(done) {
				var options = {
					buffer: "fun", 
					prefix: 'fun',
					offset: 3,
					templates: true,
					keywords: true,
					callback: done
				};
				return testProposals(options, [
						//proposal, description
						["function", "function - Keyword"],
						["", "Templates"], 
						["/**\n * @name name\n * @param parameter\n */\nfunction name (parameter) {\n\t\n}", "function - function declaration"],
						]);
			});
			/*
			 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=426284
			 * @since 6.0
			 */
			it("test completions for Function6", function(done) {
				var options = {
					buffer: "var foo = {f: t};", 
					prefix: 't',
					offset: 15,
					keywords:true, 
					templates:true,
					callback: done
				};
				return testProposals(options, [
						//proposal, description
						["this", "this - Keyword"],
						['throw', 'throw - Keyword'],
						['try', 'try - Keyword'],
						["typeof", "typeof - Keyword"],
						['', 'ecma5'],
						["toLocaleString()", "toLocaleString() : string"],
						["toString()", "toString() : string"],
						
						]);
			});
			/**
			 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=426284
			 * @since 6.0
			 */
			it("test completions for Function7", function(done) {
				var options = {
					buffer: "var foo = {f: h};", 
					prefix: 'h',
					offset: 15,
					keywords: true, 
					templates: true,
					callback: done
				};
				return testProposals(options, [
						['', 'ecma5'],
						['hasOwnProperty(prop)', 'hasOwnProperty(prop) : bool']
						]);
			});
			
			/**
			 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=426284
			 * @since 6.0
			 */
			it("test completions for Function8", function(done) {
				var options = {
					buffer: "var foo = {f: n};", 
					prefix: 'n',
					offset: 15,
					keywords: true, 
					templates: true,
					callback: done
				};
				return testProposals(options, [
						//proposal, description
						["new", "new - Keyword"]
						]);
			});
		});
		describe('ESLint Directive Tests', function() {
			/**
			 * Tests the eslint* templates in source
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440569
			 */
			it("test eslint* template 1", function(done) {
				var options = {
					buffer: "es", 
					prefix: "es", 
					offset: 2,
					callback: done,
					templates: true
				};
				testProposals(options, [
					['', 'Templates'],
				    ['/* eslint rule-id:0/1*/', 'eslint - ESLint rule enable / disable directive'],
				    ['/* eslint-disable rule-id */', 'eslint-disable - ESLint rule disablement directive'],
				    ['/* eslint-enable rule-id */', 'eslint-enable - ESLint rule enablement directive'],
				    ['/* eslint-env library*/', 'eslint-env - ESLint environment directive']]
				);
			});
			/**
			 * Tests the eslint* templates in comments
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440569
			 */
			it("test eslint* template 2", function(done) {
				var options = {
					buffer: "/* es", 
					prefix: "es", 
					offset: 5,
					callback: done,
					templates: true
				};
				testProposals(options, [
					['', 'Templates'],
				    ['lint rule-id:0/1 ', 'eslint - ESLint rule enable or disable'],
				    ['lint-disable rule-id ', 'eslint-disable - ESLint rule disablement directive'],
				    ['lint-enable rule-id ', 'eslint-enable - ESLint rule enablement directive'],
				    ['lint-env library', 'eslint-env - ESLint environment directive']]
				);
			});
			/**
			 * Tests the eslint* templates in comments
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440569
			 */
			it("test eslint* template 3", function(done) {
				var options = {
					buffer: "/* es */", 
					prefix: "es", 
					offset: 5,
					callback: done,
					templates: true
				};
				testProposals(options, [
					['', 'Templates'],
				    ['lint rule-id:0/1 ', 'eslint - ESLint rule enable or disable'],
				    ['lint-disable rule-id ', 'eslint-disable - ESLint rule disablement directive'],
				    ['lint-enable rule-id ', 'eslint-enable - ESLint rule enablement directive'],
				    ['lint-env library', 'eslint-env - ESLint environment directive']]
				);
			});
			/**
			 * Tests the eslint* templates in comments
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440569
			 */
			it("test eslint* template 4", function(done) {
				var options = {
					buffer: "var f; /* es", 
					prefix: "es", 
					offset: 12,
					callback: done,
					templates: true
				};
				testProposals(options, [
					['', 'Templates'],
				    ['lint rule-id:0/1 ', 'eslint - ESLint rule enable or disable'],
				    ['lint-disable rule-id ', 'eslint-disable - ESLint rule disablement directive'],
				    ['lint-enable rule-id ', 'eslint-enable - ESLint rule enablement directive'],
				    ['lint-env library', 'eslint-env - ESLint environment directive']]
				);
			});
			/**
			 * Tests that no eslint* templates are in jsdoc comments
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440569
			 */
			it("test eslint* template 5", function(done) {
				var options = {
					buffer: "/** es", 
					prefix: "es", 
					offset: 6,
					callback: done,
					templates: true
				};
				testProposals(options, []);
			});
			/**
			 * Tests that eslint* templates will be proposed further in comment with no content beforehand
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440569
			 * @since 7.0
			 */
			it("test eslint* template 6", function(done) {
				var options = {
					buffer: "/* \n\n es", 
					prefix: "es", 
					offset: 10,
					callback: done,
					templates: true
				};
				testProposals(options, [
					['','Templates'],
				    ['/* eslint rule-id:0/1*/', 'eslint - ESLint rule enable / disable directive'],
				    ['/* eslint-disable rule-id */', 'eslint-disable - ESLint rule disablement directive'],
				    ['/* eslint-enable rule-id */', 'eslint-enable - ESLint rule enablement directive'],
				    ['/* eslint-env library*/', 'eslint-env - ESLint environment directive']]
				);
			});
			/**
			 * Tests that no eslint* templates are in comments after other content
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440569
			 * @since 7.0
			 */
//			it("test eslint* template 7", function(done) {
//				var options = {
//					buffer: "/* foo \n\n es", 
//					prefix: "es", 
//					offset: 10,
//					callback: done,
//					templates: true
//				};
//				testProposals(options, []);
//			});
			/**
			 * Tests that no eslint* templates are proposed when there is already one
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440569
			 * @since 7.0
			 */
			it("test eslint* template 9", function(done) {
				var options = {
					buffer: "/* eslint ", 
					prefix: "eslint", 
					offset: 9,
					callback: done,
					templates: true
				};
	            testProposals(options, [
	            	['', 'Templates'],
				    [' rule-id:0/1 ', 'eslint - ESLint rule enable or disable'],
				    ['-disable rule-id ', 'eslint-disable - ESLint rule disablement directive'],
				    ['-enable rule-id ', 'eslint-enable - ESLint rule enablement directive'],
				    ['-env library', 'eslint-env - ESLint environment directive']]
				);
			});
			/**
			 * Tests that eslint-env environs are proposed
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440569
			 * @since 7.0
			 */
			it("test eslint-env proposals 1", function(done) {
				var options = {
					buffer: "/* eslint-env ", 
					prefix: "", 
					offset: 14,
					callback: done,
					templates: true
				};
				testProposals(options, [
				     ['amd', 'amd - ESLint environment name'],
				     ['browser', 'browser - ESLint environment name'],
				     ['jasmine', 'jasmine - ESLint environment name'],
					 ['jquery', 'jquery - ESLint environment name'],
					 ['meteor', 'meteor - ESLint environment name'],
				     ['mocha', 'mocha - ESLint environment name'],
				     ['node', 'node - ESLint environment name'],
				     ['phantomjs', 'phantomjs - ESLint environment name'],
					 ['prototypejs', 'prototypejs - ESLint environment name'],
					 ['shelljs', 'shelljs - ESLint environment name']
				     ]);
			});
			/**
			 * Tests that eslint-env environs are proposed
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440569
			 * @since 7.0
			 */
			it("test eslint-env proposals 2", function(done) {
				var options = {
					buffer: "/* eslint-env a", 
					prefix: "a", 
					offset: 15,
					callback: done,
					templates: true
				};
				testProposals(options, [
				     ['amd', 'amd - ESLint environment name'],
				     ]);
			});
			/**
			 * Tests that eslint rules are proposed
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440569
			 * @since 7.0
			 */
			it("test eslint rule proposals 1", function(done) {
				var options = {
					buffer: "/* eslint c", 
					prefix: "c", 
					offset: 11,
					callback: done,
					templates: true
				};
				testProposals(options, [
				     ['curly', 'curly - ESLint rule']
				     ]);
			});
			/**
			 * Tests that eslint rules are proposed
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440569
			 * @since 7.0
			 */
			it("test eslint rule proposals 2", function(done) {
				var options = {
					buffer: "/* eslint no-js", 
					prefix: "no-js", 
					offset: 15,
					callback: done,
					templates: true
				};
				testProposals(options, [
				     ['no-jslint', 'no-jslint - ESLint rule'],
				     ]);
			});
			/**
			 * Tests that eslint rules are proposed
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440569
			 * @since 7.0
			 */
			it("test eslint rule proposals 3", function(done) {
				var options = {
					buffer: "/* eslint-enable no-js", 
					prefix: "no-js", 
					offset: 22,
					callback: done,
					templates: true
				};
				testProposals(options, [
				     ['no-jslint', 'no-jslint - ESLint rule'],
				     ]);
			});
			/**
			 * Tests that eslint rules are proposed
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440569
			 * @since 7.0
			 */
			it("test eslint rule proposals 4", function(done) {
				var options = {
					buffer: "/* eslint-disable no-js", 
					prefix: "no-js", 
					offset: 23,
					callback: done,
					templates: true
				};
				testProposals(options, [
				     ['no-jslint', 'no-jslint - ESLint rule'],
				     ]);
			});
			/**
			 * Tests that eslint rules are proposed
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440569
			 * @since 7.0
			 */
			it("test eslint rule proposals 5", function(done) {
				var options = {
					buffer: "/* eslint-enable no-jslint, c", 
					prefix: "c", 
					offset: 29,
					callback: done,
					templates: true
				};
				testProposals(options, [
				     ['curly', 'curly - ESLint rule']
				     ]);
			});
		});
//		describe('MySQl Index Tests', function() {
//			/**
//			 * Tests mysql index
//			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=426486
//			 * @since 7.0
//			 */
//			it("test mysql index 1", function(done) {
//				var options = {
//					buffer: "require('mysql').createP", 
//					prefix: "createP", 
//					offset: 24,
//					callback: done
//				};
//				testProposals(options, [
//					['', 'mysql'],
//				    ['ool', 'createPool(config) : Pool'],
//				    ['oolCluster', 'createPoolCluster(config) : PoolCluster']
//				]);
//			});
//			/**
//			 * Tests mysql index
//			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=426486
//			 * @since 7.0
//			 */
//			it("test mysql index 2", function(done) {
//				var options = {
//					buffer: "require('mysql').createC", 
//					prefix: "createC", 
//					offset: 25,
//					callback: done
//				};
//				testProposals(options, [
//					['', 'mysql'],
//				    ['onnection', 'createConnection(config) : Connection']
//				]);
//			});
//			/**
//			 * Tests mysql index
//			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=426486
//			 * @since 7.0
//			 */
//			it("test mysql index 3", function(done) {
//				var options = {
//					buffer: "require('mysql').createQ", 
//					prefix: "createQ", 
//					offset: 25,
//					callback: done
//				};
//				testProposals(options, [
//					['', 'mysql'],
//				    ['uery', 'createQuery(sql, values, cb) : Query']
//				]);
//			});
//			/**
//			 * Tests mysql index for indirect proposals
//			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=426486
//			 * @since 7.0
//			 */
//			it("test mysql index 4", function(done) {
//				var options = {
//					buffer: "require('mysql').createQuery(null,null,null).sta",
//					prefix: "sta", 
//					offset: 47,
//					callback:done
//				};
//				testProposals(options, [
//					['', 'mysql'],
//				    ['rt', 'start()']
//				]);
//			});
//		});
	});
});