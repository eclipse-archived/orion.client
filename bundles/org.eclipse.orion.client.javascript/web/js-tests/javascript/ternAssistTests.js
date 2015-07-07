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
					["coo", "coo : any"]
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
					["coo", "coo : number"]
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
					["undefined", "undefined : any"]
				]);
			});
		});
		describe('Simple File Completions', function() {
			it("empty 1", function(done) {
				var options = {
					buffer: "x",
					prefix: "x",
					offset: 1,
					callback: done
				};
				testProposals(options, []);
			});
			it("empty 2", function(done) {
				var options = {
					buffer: "",
					offset: 0,
					callback: done
				};
				return testProposals(options, [
					['exports', 'exports : exports'],
					['module', 'module : Module'],
 					['', 'ecma5'],
					['Array(size)', ''],
					['Boolean(value)', 'Boolean(value) : bool'],
					['Date(ms)', 'Date(ms)'],
					['Error(message)', ''],
					['EvalError(message)', ''],
					['Function(body)', 'Function(body) : fn()'],
					['Number(value)', 'Number(value) : number'],
					['Object()', 'Object()'],
					['RangeError(message)', ''],
					['ReferenceError(message)', ''],
					['RegExp(source, flags?)', ''],
					['String(value)', 'String(value) : string'],
					['SyntaxError(message)', ''],
					['URIError(message)', ''],
					['decodeURI(uri)', 'decodeURI(uri) : string'],
					['decodeURIComponent(uri)', 'decodeURIComponent(uri) : string'],
					['encodeURI(uri)', 'encodeURI(uri) : string'],
					['encodeURIComponent(uri)', 'encodeURIComponent(uri) : string'],
					['eval(code)', 'eval(code)'],
					['isNaN(value)', 'isNaN(value) : bool'],
					['parseFloat(string)', 'parseFloat(string) : number'],
					['parseInt(string, radix?)', 'parseInt(string, radix?) : number'],
					['Infinity', 'Infinity : number'],
					['JSON', 'JSON : JSON'],
					['Math', 'Math : Math'],
					['NaN', 'NaN : number'],
					['undefined', 'undefined : any']
				]);
			});
			it("test Single Var Content Assist", function(done) {
				var options = {
					buffer: "var zzz = 9;\n",
					prefix: '',
					offset: 13,
					callback: done
				};
				return testProposals(options, [
					['exports', 'exports : exports'],
					['module', 'module : Module'],
					["zzz", "zzz : number"],
 					['', 'ecma5'],
					['Array(size)', ''],
					['Boolean(value)', 'Boolean(value) : bool'],
					['Date(ms)', 'Date(ms)'],
					['Error(message)', ''],
					['EvalError(message)', ''],
					['Function(body)', 'Function(body) : fn()'],
					['Number(value)', 'Number(value) : number'],
					['Object()', 'Object()'],
					['RangeError(message)', ''],
					['ReferenceError(message)', ''],
					['RegExp(source, flags?)', ''],
					['String(value)', 'String(value) : string'],
					['SyntaxError(message)', ''],
					['URIError(message)', ''],
					['decodeURI(uri)', 'decodeURI(uri) : string'],
					['decodeURIComponent(uri)', 'decodeURIComponent(uri) : string'],
					['encodeURI(uri)', 'encodeURI(uri) : string'],
					['encodeURIComponent(uri)', 'encodeURIComponent(uri) : string'],
					['eval(code)', 'eval(code)'],
					['isNaN(value)', 'isNaN(value) : bool'],
					['parseFloat(string)', 'parseFloat(string) : number'],
					['parseInt(string, radix?)', 'parseInt(string, radix?) : number'],
					['Infinity', 'Infinity : number'],
					['JSON', 'JSON : JSON'],
					['Math', 'Math : Math'],
					['NaN', 'NaN : number'],
					['undefined', 'undefined : any']
				]);
			});
			it("test Single Var Content Assist 2", function(done) {
				var options = {
					buffer: "var zzz;\n",
					prefix: '',
					offset: 9,
					callback: done
				};
				return testProposals(options, [
					['exports', 'exports : exports'],
					['module', 'module : Module'],
					["zzz", "zzz : any"],
 					['', 'ecma5'],
					['Array(size)', ''],
					['Boolean(value)', 'Boolean(value) : bool'],
					['Date(ms)', 'Date(ms)'],
					['Error(message)', ''],
					['EvalError(message)', ''],
					['Function(body)', 'Function(body) : fn()'],
					['Number(value)', 'Number(value) : number'],
					['Object()', 'Object()'],
					['RangeError(message)', ''],
					['ReferenceError(message)', ''],
					['RegExp(source, flags?)', ''],
					['String(value)', 'String(value) : string'],
					['SyntaxError(message)', ''],
					['URIError(message)', ''],
					['decodeURI(uri)', 'decodeURI(uri) : string'],
					['decodeURIComponent(uri)', 'decodeURIComponent(uri) : string'],
					['encodeURI(uri)', 'encodeURI(uri) : string'],
					['encodeURIComponent(uri)', 'encodeURIComponent(uri) : string'],
					['eval(code)', 'eval(code)'],
					['isNaN(value)', 'isNaN(value) : bool'],
					['parseFloat(string)', 'parseFloat(string) : number'],
					['parseInt(string, radix?)', 'parseInt(string, radix?) : number'],
					['Infinity', 'Infinity : number'],
					['JSON', 'JSON : JSON'],
					['Math', 'Math : Math'],
					['NaN', 'NaN : number'],
					['undefined', 'undefined : any']
				]);
			});
			it("test multi var content assist 1", function(done) {
				var options = {
					buffer: "var zzz;\nvar xxx, yyy;\n",
					prefix: '',
					offset: 23,
					callback: done
				};
				return testProposals(options, [
					['exports', 'exports : exports'],
					['module', 'module : Module'],
					["xxx", "xxx : any"],
					["yyy", "yyy : any"],
					["zzz", "zzz : any"],
 					['', 'ecma5'],
					['Array(size)', ''],
					['Boolean(value)', 'Boolean(value) : bool'],
					['Date(ms)', 'Date(ms)'],
					['Error(message)', ''],
					['EvalError(message)', ''],
					['Function(body)', 'Function(body) : fn()'],
					['Number(value)', 'Number(value) : number'],
					['Object()', 'Object()'],
					['RangeError(message)', ''],
					['ReferenceError(message)', ''],
					['RegExp(source, flags?)', ''],
					['String(value)', 'String(value) : string'],
					['SyntaxError(message)', ''],
					['URIError(message)', ''],
					['decodeURI(uri)', 'decodeURI(uri) : string'],
					['decodeURIComponent(uri)', 'decodeURIComponent(uri) : string'],
					['encodeURI(uri)', 'encodeURI(uri) : string'],
					['encodeURIComponent(uri)', 'encodeURIComponent(uri) : string'],
					['eval(code)', 'eval(code)'],
					['isNaN(value)', 'isNaN(value) : bool'],
					['parseFloat(string)', 'parseFloat(string) : number'],
					['parseInt(string, radix?)', 'parseInt(string, radix?) : number'],
					['Infinity', 'Infinity : number'],
					['JSON', 'JSON : JSON'],
					['Math', 'Math : Math'],
					['NaN', 'NaN : number'],
					['undefined', 'undefined : any']
				]);
			});
			it("test multi var content assist 2", function(done) {
				var options = {
					buffer: "var zzz;\nvar zxxx, xxx, yyy;\nz",
					prefix: 'z',
					offset: 29,
					callback: done
				};
				return testProposals(options, [
					["zxxx", "zxxx : any"],
					["zzz", "zzz : any"]
				]);
			});
			it("test single function content assist", function(done) {
				var options = {
					buffer: "function fun(a, b, c) {}\n",
					prefix: '',
					offset: 25,
					callback: done
				};
				return testProposals(options, [
					['fun(a, b, c)', ''],
					['exports', 'exports : exports'],
					['module', 'module : Module'],
 					['', 'ecma5'],
					['Array(size)', ''],
					['Boolean(value)', 'Boolean(value) : bool'],
					['Date(ms)', 'Date(ms)'],
					['Error(message)', ''],
					['EvalError(message)', ''],
					['Function(body)', 'Function(body) : fn()'],
					['Number(value)', 'Number(value) : number'],
					['Object()', 'Object()'],
					['RangeError(message)', ''],
					['ReferenceError(message)', ''],
					['RegExp(source, flags?)', ''],
					['String(value)', 'String(value) : string'],
					['SyntaxError(message)', ''],
					['URIError(message)', ''],
					['decodeURI(uri)', 'decodeURI(uri) : string'],
					['decodeURIComponent(uri)', 'decodeURIComponent(uri) : string'],
					['encodeURI(uri)', 'encodeURI(uri) : string'],
					['encodeURIComponent(uri)', 'encodeURIComponent(uri) : string'],
					['eval(code)', 'eval(code)'],
					['isNaN(value)', 'isNaN(value) : bool'],
					['parseFloat(string)', 'parseFloat(string) : number'],
					['parseInt(string, radix?)', 'parseInt(string, radix?) : number'],
					['Infinity', 'Infinity : number'],
					['JSON', 'JSON : JSON'],
					['Math', 'Math : Math'],
					['NaN', 'NaN : number'],
					['undefined', 'undefined : any']
				]);
			});
			it("test multi function content assist 1", function(done) {
				var options = {
					buffer: "function fun(a, b, c) {}\nfunction other(a, b, c) {}\n",
					prefix: '',
					offset: 52,
					callback: done
				};
				return testProposals(options, [
					['fun(a, b, c)', ''],
					['other(a, b, c)', ''],
					['exports', 'exports : exports'],
					['module', 'module : Module'],
 					['', 'ecma5'],
					['Array(size)', ''],
					['Boolean(value)', 'Boolean(value) : bool'],
					['Date(ms)', 'Date(ms)'],
					['Error(message)', ''],
					['EvalError(message)', ''],
					['Function(body)', 'Function(body) : fn()'],
					['Number(value)', 'Number(value) : number'],
					['Object()', 'Object()'],
					['RangeError(message)', ''],
					['ReferenceError(message)', ''],
					['RegExp(source, flags?)', ''],
					['String(value)', 'String(value) : string'],
					['SyntaxError(message)', ''],
					['URIError(message)', ''],
					['decodeURI(uri)', 'decodeURI(uri) : string'],
					['decodeURIComponent(uri)', 'decodeURIComponent(uri) : string'],
					['encodeURI(uri)', 'encodeURI(uri) : string'],
					['encodeURIComponent(uri)', 'encodeURIComponent(uri) : string'],
					['eval(code)', 'eval(code)'],
					['isNaN(value)', 'isNaN(value) : bool'],
					['parseFloat(string)', 'parseFloat(string) : number'],
					['parseInt(string, radix?)', 'parseInt(string, radix?) : number'],
					['Infinity', 'Infinity : number'],
					['JSON', 'JSON : JSON'],
					['Math', 'Math : Math'],
					['NaN', 'NaN : number'],
					['undefined', 'undefined : any']
				]);
			});
			it("test no dupe 1", function(done) {
				var options = {
					buffer: "var coo = 9; var other = function(coo) { c }", 
					prefix: "c", 
					offset: 42,
					callback: done
				};
				return testProposals(options, [
					["coo", "coo : any"]
				]);
			});
			it("test no dupe 2", function(done) {
				var options = {
					buffer: "var coo = { }; var other = function(coo) { coo = 9;\nc }", 
					prefix: "c", 
					offset: 53,
					callback: done
				};
				return testProposals(options, [
					["coo", "coo : number"]
				]);
			});
			it("test no dupe 3", function(done) {
				var options = {
					buffer: "var coo = function () { var coo = 9; \n c};", 
					prefix: "c", 
					offset: 40,
					callback: done
				};
				return testProposals(options, [
					["coo", "coo : number"]
				]);
			});
			it("test no dupe 4", function(done) {
				var options = {
					buffer: "var coo = 9; var other = function () { var coo = function() { return 9; }; \n c};", 
					prefix: "c", 
					offset: 78,
					callback: done
				};
				return testProposals(options, [
					["coo()", "coo() : number"]
				]);
			});
			it("test scopes 1", function(done) {
				// only the outer foo is available
				var options = {
					buffer: "var coo;\nfunction other(a, b, c) {\nfunction inner() { var coo2; }\nco}", 
					prefix: "co", 
					offset: 68,
					callback: done
				};
				return testProposals(options, [
					["coo", "coo : any"]
				]);
			});
			it("test scopes 2", function(done) {
				// the inner assignment should not affect the value of foo
				var options = {
					buffer: "var foo;\n var foo = 1;\nfunction other(a, b, c) {\nfunction inner() { foo2 = \"\"; }\nfoo.toF}", 
					prefix: "toF", 
					offset: 88,
					callback: done
				};
				return testProposals(options, [
					['', 'ecma5'],
					["toFixed(digits)", "toFixed(digits) : string"]
				]);
			});
			it("test multi function content assist 2", function(done) {
				var options = {
					buffer: "function ffun(a, b, c) {}\nfunction other(a, b, c) {}\nff", 
					prefix: "ff",
					offset: 53,
					callback: done
				};
				return testProposals(options, [
					["ffun(a, b, c)", ""]
				]);
			});
		    /**
		     * Tests inferencing with $$-qualified members
		     * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=439628
		     * @since 7.0
		     */
		    it("test inferencing $$-qualified member types", function(done) {
				var options = {
					buffer: "var baz = foo.$$fntype && foo.$$fntype.foo;A", 
					prefix: "A", 
					offset: 44,
					callback: done
				};
				return testProposals(options, [
					['', 'ecma5'],
				    ["Array(size)", "Array(size)"]
				]);
			});
			// all inferencing based content assist tests here
			it("test Object inferencing with Variable", function(done) {
				var options = {
					buffer: "var t = {}\nt.h", 
					prefix: "h",
					offset: 13,
					callback: done
				};
				return testProposals(options, [
					['', 'ecma5'],
					["hasOwnProperty(prop)", "hasOwnProperty(prop) : bool"]
				]);
			});
			it("test Object Literal inferencing", function(done) {
				var options = {
					buffer: "var t = { hhh : 1, hh2 : 8}\nt.h", 
					prefix: "h",
					offset: 30,
					callback: done
				};
				return testProposals(options, [
					["hh2", "hh2 : number"],
					["hhh", "hhh : number"],
					["", "ecma5"],
					["hasOwnProperty(prop)", "hasOwnProperty(prop) : bool"]
				]);
			});
			it("test Simple String inferencing", function(done) {
				var options = {
					buffer: "''.char", 
					prefix: "char",
					offset: 7,
					callback: done
				};
				return testProposals(options, [
					['', 'ecma5'],
					["charAt(i)", "charAt(i) : string"],
					["charCodeAt(i)", "charCodeAt(i) : number"]
				]);
			});
			it("test Simple Date inferencing", function(done) {
				var options = {
					buffer: "new Date().setD", 
					prefix: "setD",
					offset: 15,
					callback: done
				};
				return testProposals(options, [
					['', 'ecma5'],
					["setDate(day)", "setDate(day) : number"]
				]);
			});
			it("test Number inferencing with Variable", function(done) {
				var options = {
					buffer: "var t = 1\nt.to", 
					prefix: "to",
					offset: 14,
					callback: done
				};
				return testProposals(options, [
					['', 'ecma5'],
					["toExponential(digits)", "toExponential(digits) : string"],
					["toFixed(digits)", "toFixed(digits) : string"],
					["toLocaleString()", "toLocaleString() : string"],
					["toString(radix?)", "toString(radix?) : string"]
				]);
			});
			it("test Data flow Object Literal inferencing", function(done) {
				var options = {
					buffer: "var s = { hhh : 1, hh2 : 8}\nvar t = s;\nt.h", 
					prefix: "h",
					offset: 42,
					callback: done
				};
				return testProposals(options, [
					["hh2", "hh2 : number"],
					["hhh", "hhh : number"],
					["", "ecma5"],
					["hasOwnProperty(prop)", "hasOwnProperty(prop) : bool"]
				]);
			});
			it("test Data flow inferencing 1", function(done) {
				var options = {
					buffer: "var ttt = 9\nttt.toF", 
					prefix: "toF",
					offset: 19,
					callback: done
				};
				return testProposals(options, [
					['', 'ecma5'],
					["toFixed(digits)", "toFixed(digits) : string"]
				]);
			});
			it("test Data flow inferencing 2", function(done) {
				var options = {
					buffer: "ttt = 9\nttt.toF", 
					prefix: "toF",
					offset: 15,
					callback: done
				};
				return testProposals(options, [
					['', 'ecma5'],
					["toFixed(digits)", "toFixed(digits) : string"]
				]);
			});
			it("test Data flow inferencing 3", function(done) {
				var options = {
					buffer: "var ttt = ''\nttt = 9\nttt.toF", 
					prefix: "toF",
					offset: 28,
					callback: done
				};
				return testProposals(options, [
					['', 'ecma5'],
					["toFixed(digits)", "toFixed(digits) : string"]
				]);
			});
			it("test Data flow inferencing 4", function(done) {
				var options = {
					buffer: "var name = toString(property.key.value);\nname.co", 
					prefix: "co",
					offset: 48,
					callback: done
				};
				return testProposals(options, [
					['', 'ecma5'],
					["concat(other)", "concat(other) : string"]
				]);
			});
			it("test Simple this", function(done) {
				var options = {
					buffer: "var ssss = 4;\nthis.ss", 
					prefix: "ss",
					offset: 21,
					callback: done
				};
				return testProposals(options, [
					//["ssss", "ssss : number"]
				]);
			});
			it("test Object Literal inside", function(done) {
				var options = {
					buffer: "var x = { the : 1, far : this.th };", 
					prefix: "th", 
					offset: 32,
					callback: done
				};
				return testProposals(options, [
					["the", "the : number"]
				]);
			});
			it("test Object Literal outside", function(done) {
				var options = {
					buffer: "var x = { the : 1, far : 2 };\nx.th", 
					prefix: "th",
					offset: 34,
					callback: done
				};
				return testProposals(options, [
					["the", "the : number"]
				]);
			});
			it("test Object Literal none", function(done) {
				var options = {
					buffer: "var x = { the : 1, far : 2 };\nthis.th", 
					prefix: "th",
					offset: 37,
					callback: done
				};
				return testProposals(options, [
					["the", "the : number"]
				]);
			});
			it("test Object Literal outside 2", function(done) {
				var options = {
					buffer: "var x = { the : 1, far : 2 };\nvar who = x.th", 
					prefix: "th",
					offset: 44,
					callback: done
				};
				return testProposals(options, [
					["the", "the : number"]
				]);
			});
			it("test Object Literal outside 3", function(done) {
				var options = {
					buffer: "var x = { the : 1, far : 2 };\nwho(x.th)", 
					prefix: "th", 
					offset: 38,
					callback: done
				};
				return testProposals(options, [
					["the", "the : number"]
				]);
			});
			it("test Object Literal outside 4", function(done) {
				var options = {
					buffer: "var x = { the : 1, far : 2 };\nwho(yyy, x.th)", 
					prefix: "th",
					offset: 43,
					callback: done
				};
				return testProposals(options, [
					["the", "the : number"]
				]);
			});
			it("test this reference 1", function(done) {
				var options = {
					buffer: "var xxxx;\nthis.x", 
					prefix: "x",
					offset: 16,
					callback: done
				};
				return testProposals(options, [
					///["xxxx", "xxxx : any"]
				]);
			});
			it("test binary expression 1", function(done) {
				var options = {
					buffer: "(1+3).toF", 
					prefix: "toF",
					offset: 9,
					callback: done
				};
				return testProposals(options, [
					['', 'ecma5'],
					["toFixed(digits)", "toFixed(digits) : string"]
				]);
			});
			it("test for loop 1", function(done) {
				var options = {
					buffer: "for (var ii=0;i<8;ii++) { ii }", 
					prefix: "i", 
					offset: 15,
					callback: done
				};
				return testProposals(options, [
					["ii", "ii : number"],
					['', 'ecma5'],
					//["isFinite(num)", "isFinite(num) : bool"],
					["isNaN(value)", "isNaN(value) : bool"],
					//["isPrototypeOf(object)", "isPrototypeOf(object) : bool"],
					//["Infinity", "Infinity : number"],
				]);
			});
			it("test for loop 2", function(done) {
				var options = {
					buffer: "for (var ii=0;ii<8;i++) { ii }", 
					prefix: "i", 
					offset: 20,
					callback: done
				};
				return testProposals(options, [
					["ii", "ii : number"],
					['', 'ecma5'],
					//["isFinite(num)", "isFinite(num) : bool"],
					["isNaN(value)", "isNaN(value) : bool"],
					//["isPrototypeOf(object)", "isPrototypeOf(object) : bool"],
					//["Infinity", "Infinity : number"]
				]);
			});
			it("test for loop 3", function(done) {
				var options = {
					buffer: "for (var ii=0;ii<8;ii++) { i }", 
					prefix: "i", 
					offset: 28,
					callback: done
				};
				return testProposals(options, [
					["ii", "ii : number"],
					['', 'ecma5'],
					//["isFinite(num)", "isFinite(num) : bool"],
					["isNaN(value)", "isNaN(value) : bool"],
					//["isPrototypeOf(object)", "isPrototypeOf(object) : bool"],
					//["Infinity", "Infinity : number"],
				]);
			});
			it("test while loop 1", function(done) {
				var options = {
					buffer: "var iii;\nwhile(ii === null) {\n}", 
					prefix: "ii", 
					offset: 17,
					callback: done
				};
				return testProposals(options, [
					["iii", "iii : any"]
				]);
			});
			it("test while loop 2", function(done) {
				var options = {
					buffer: "var iii;\nwhile(this.ii === null) {\n}", 
					prefix: "ii", 
					offset: 22,
					callback: done
				};
				return testProposals(options, [
					//TODO does not find global defined in global
					//["iii", "iii : any"]
				]);
			});
			it("test while loop 3", function(done) {
				var options = {
					buffer: "var iii;\nwhile(iii === null) {this.ii\n}", 
					prefix: "ii", 
					offset: 37,
					callback: done
				};
				return testProposals(options, [
					//TODO does not find global defined in global
					//["iii", "iii : any"]
				]);
			});
			it("test catch clause 1", function(done) {
				var options = {
					buffer: "try { } catch (eee) {e  }", 
					prefix: "e", 
					offset: 22,
					callback: done
				};
				return testProposals(options, [
					//TODO does not propose Error
					//["eee", "eee : Error"],
					['exports', 'exports : exports'],
					["", "ecma5"],
					["encodeURI(uri)", "encodeURI(uri) : string"],
					["encodeURIComponent(uri)", "encodeURIComponent(uri) : string"],
					["eval(code)", "eval(code)"]
				]);
			});
			it("test catch clause 2", function(done) {
				// the type of the catch variable is Error
				var options = {
					buffer: "try { } catch (eee) {\neee.me  }", 
					prefix: "me", 
					offset: 28,
					callback: done
				};
				return testProposals(options, [
					//TODO does not correctly infer Error
					//["message", "message : string"]
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