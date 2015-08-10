/*******************************************************************************
 * @license
 * Copyright (c) 2012, 2015 VMware, Inc. and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     Andrew Eisenberg (VMware) - initial API and implementation
 *     IBM Corporation - Various improvements
 ******************************************************************************/
/*eslint-env amd, mocha, node*/
/*global doctrine*/
define([
	'javascript/contentAssist/contentAssist',
	'chai/chai',
	'orion/objects',
	'orion/Deferred',
	'esprima',
	'mocha/mocha', //mjust stay at the end, not a module
	'doctrine' //must stay at the end, does not export a module 
], function(ContentAssist, chai, objects, Deferred, Esprima) {
	var assert = chai.assert;
/* eslint-disable missing-nls */
	describe('Content Assist Tests', function() {
		/**
		 * @description Parse the snippet
		 * @returns {Object} The AST
		 */
		function parseFull(contents) {
			var ast = Esprima.parse(contents, {
						range: true,
						tolerant: true,
						comment: true,
						tokens: true
					});
			ast.source = contents;
			return ast;
		}
	
		/**
		 * @description Sets up the test
		 * @param {Object} options The options the set up with
		 * @returns {Object} The object with the initialized values
		 */
		function setup(options) {
			var buffer = options.buffer,
			    prefix = options.prefix,
			    offset = options.offset,
			    contentType = options.contenttype ? options.contenttype : 'application/javascript',
			    lintOptions = options.lintOptions,
			    editorContextMixin = options.editorContextMixin || {},
			    paramsMixin = options.paramsMixin || {};
			if (!prefix) {
				prefix = "";
			}
			if (!offset) {
				if (typeof buffer !== "string") {
					throw new Error("invalid buffer");
				}
				offset = buffer.indexOf("/**/");
				if (offset < 0) {
					offset = buffer.length;
				}
			}
	
			var astManager = {
				/*override*/
				getAST: function() {
					return new Deferred().resolve(parseFull(buffer));
				}
			};
			var contentAssist = new ContentAssist.JSContentAssist(astManager, lintOptions);
			var editorContext = {
				/*override*/
				getText: function() {
					return new Deferred().resolve(buffer);
				},
				
				getFileMetadata: function() {
    			    var o = Object.create(null);
    			    o.contentType = Object.create(null);
    			    o.contentType.id = contentType;
    			    o.location = 'content_assist_test_script.js';
    			    return new Deferred().resolve(o);
    			}
			};
			
			var params = {offset: offset, prefix : prefix, keyword: false, template: false };
			objects.mixin(editorContext, editorContextMixin);
			objects.mixin(params, paramsMixin);
			return {
				astManager: astManager,
				contentAssist: contentAssist,
				editorContext: editorContext,
				params: params
			};
		}
	
		// Also accepts a single object containing a map of arguments
		var buffers = {};
		var currentName = null;
		/**
		 * @description Computes the assist proposals from the given options
		 * @param {String} buffer The source to parse
		 * @param {String} prefix The prefix to use or null
		 * @param {Number} offset The offset into the source
		 * @param {Object} lintOptions Lit options to use
		 * @param {EditorContext} editorContextMixin The ditro context object to use
		 * @param {Object} paramsMixin The paraneters object
		 * @returns {Promise} The promise to compute proposals
		 */
		function computeContentAssist(buffer, prefix, offset, lintOptions, editorContextMixin, paramsMixin) {
			buffers[currentName] = buffer;
	
			var result;
			if (arguments.length === 1 && typeof arguments[0] === "object") {
				// Single param containing a map of arguments for setup()
				result = setup.apply(this, Array.prototype.slice.call(arguments));
			} else {
				result = setup({
					buffer: buffer,
					prefix: prefix,
					offset: offset,
					lintOptions: lintOptions,
					editorContextMixin: editorContextMixin,
					paramsMixin: paramsMixin
				});
			}
			var contentAssist = result.contentAssist, editorContext = result.editorContext, params = result.params;
			return contentAssist.computeContentAssist(editorContext, params);
		}
	
		/**
		 * @description Conpares the given proposal to the given text and description
		 * @param {Object} proposal The proposal returned from the content assist
		 * @param {String} text The name of the proposal to compare
		 * @param {String} description The description to compare
		 */
		function testProposal(proposal, text, description) {
			assert.equal(proposal.proposal, text, "Invalid proposal text"); //$NON-NLS-0$
			if (description) {
				if (proposal.name) {
					assert.equal(proposal.name + proposal.description, description, "Invalid proposal description"); //$NON-NLS-0$
				} else {
					assert.equal(proposal.description, description, "Invalid proposal description"); //$NON-NLS-0$
				}
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
		 * @param {orion.Promise} actualProposalsPromise The promise to return proposals
		 * @param {Array} expectedProposals The array of expected proposal objects
		 */
		function testProposals(actualProposalsPromise, expectedProposals) {
			return actualProposalsPromise.then(function (actualProposals) {
				assert.equal(actualProposals.length, expectedProposals.length,
					"Wrong number of proposals.  Expected:\n" + stringifyExpected(expectedProposals) +"\nActual:\n" + stringifyActual(actualProposals));
	
				for (var i = 0; i < actualProposals.length; i++) {
				    var ap = actualProposals[i];
				    var ep = expectedProposals[i];
					testProposal(ap, ep[0], ep[1]);
					if(expectedProposals[i].length === 3) {
					    //check for doc hover
					    assert(ap.hover, 'There should be a hover entry for the proposal');
					    assert(ap.hover.indexOf(ep[2]) === 0, "The doc should have started with the given value"); 
					}
				}
			}, function (error) {
				assert.fail(error);
			});
		}
	
		/**
		 * @description Asserts that a given proposal is NOT present in a list of actual proposals.
		 * @param {Object} expectedProposal The proposal we are not expecting to see
		 * @param {orion.Promise} actualProposalsPromise The promise to return proposals
		 */
		function assertNoProposal(expectedProposal, actualProposalsPromise) {
			return actualProposalsPromise.then(function(actualProposals) {
				for (var i = 0; i < actualProposals.length; i++) {
					if (typeof(actualProposals[i]) === "string" && actualProposals[i].indexOf(expectedProposal) === 0) {
						assert.fail("Did not expect to find proposal \'" + expectedProposal + "\' in: " + print(actualProposals));
					}
					if (typeof(actualProposals[i].proposal) === "string" && actualProposals[i].proposal.indexOf(expectedProposal) === 0) {
						assert.fail("Did not expect to find proposal \'" + expectedProposal + "\' in: " + print(actualProposals));
					}
				}
			});
			//we didn't find it, so pass
		}
	
		/**
		 * Asserts that a proposal is present in a list of actual proposals. The test ensures that some actual proposal contains
		 * all the required words and none of the prohibited words.
		 * @since 5.0
		 */
		function assertProposalMatching(/*String[]*/ required, /*String[]*/ prohibited, actualProposalsPromise) {
			return actualProposalsPromise.then(function(actualProposals) {
				/**
				 * @description Checks if the given text has the given word in it
				 * @param {String} text 
				 * @param {String} word
				 */
				function matches(text, word) {
					return text.indexOf(word) !== -1;
				}
				for (var i = 0; i < actualProposals.length; i++) {
					var proposal = actualProposals[i];
					if (typeof proposal.proposal !== "string") {
						continue;
					}
					var matchesProposal = matches.bind(null, proposal.proposal);
					if (required.every(matchesProposal) && !prohibited.some(matchesProposal)) {
						return;
					}
				}
				assert.fail("Expected to find proposal matching all of '" + required.join("','") + "' and none of '" + prohibited.join("','") + "' in: " + print(actualProposals));
			});
		}
	
		/**
		 * Asserts that a given proposal is present in a list of actual proposals. The test just ensures that an actual
		 * proposal starts with the expected value.
		 * @param expectedProposal {String} The expected proposal string
		 * @param actualProposalsPromise {orion.Promise} Promise to return the actual proposals
		 * @since 5.0
		 */
		function assertProposal(expectedProposal, actualProposalsPromise) {
			return actualProposalsPromise.then(function(actualProposals) {
				for (var i = 0; i < actualProposals.length; i++) {
					if (typeof(actualProposals[i].proposal) === "string" && actualProposals[i].proposal.indexOf(expectedProposal) === 0) {
						return;
					}
				}
				//we didn't find it, so fail
				assert.fail("Expected to find proposal \'" + expectedProposal + "\' in: " + print(actualProposals));
			});
		}
		
		/**
		 * @dscription Prints out the list of proposals
		 * @since 5.0
		 */
		function print(proposals) {
			return proposals.map(function(proposal) {
				return proposal.proposal.replace(/\n/g, "\\n").replace(/\t/g, "\\t");
			});
		}
	
		//////////////////////////////////////////////////////////
		// tests
		//////////////////////////////////////////////////////////
		it("test in function 1", function() {
			var results = computeContentAssist("function fun(a, b, c) {}\nfunction other(a, b, c) {}", "", 49);
			return testProposals(results, [
				["a", "a : {}"],
				["arguments", "arguments : Arguments"],
				["b", "b : {}"],
				["c", "c : {}"],
				["this", "this : {}"],
				["", "---------------------------------"],
				["Array([val])", "Array([val]) : Array"],
				["Boolean([val])", "Boolean([val]) : Boolean"],
				["Date([val])", "Date([val]) : Date"],
				["decodeURI(uri)", "decodeURI(uri) : String"],
				["decodeURIComponent(encodedURIString)", "decodeURIComponent(encodedURIString) : String"],
				["encodeURI(uri)", "encodeURI(uri) : String"],
				["encodeURIComponent(decodedURIString)", "encodeURIComponent(decodedURIString) : String"],
				["Error([err])", "Error([err]) : Error"],
				["eval(toEval)", "eval(toEval) : Object"],
				["fun(a, b, c)", "fun(a, b, c) : undefined"],
				["Function()", "Function() : Function"],
				["isFinite(num)", "isFinite(num) : Boolean"],
				["isNaN(num)", "isNaN(num) : Boolean"],
				["Number([val])", "Number([val]) : Number"],
				["Object([val])", "Object([val]) : Object"],
				["other(a, b, c)", "other(a, b, c) : undefined"],
				["parseFloat(str, [radix])", "parseFloat(str, [radix]) : Number"],
				["parseInt(str, [radix])", "parseInt(str, [radix]) : Number"],
				["RegExp([val])", "RegExp([val]) : RegExp"],
				["String([val])", "String([val]) : String"],
				["Infinity", "Infinity : Number"],
				["JSON", "JSON : JSON"],
				["Math", "Math : Math"],
				["NaN", "NaN : Number"],
				["undefined", "undefined : undefined"],
				["", "---------------------------------"],
				["hasOwnProperty(property)", "hasOwnProperty(property) : Boolean"],
				["isPrototypeOf(object)", "isPrototypeOf(object) : Boolean"],
				["propertyIsEnumerable(property)", "propertyIsEnumerable(property) : Boolean"],
				["toLocaleString()", "toLocaleString() : String"],
				["toString()", "toString() : String"],
				["valueOf()", "valueOf() : Object"]
			]);
		});
		it("test in function 2", function() {
			var results = computeContentAssist("function fun(a, b, c) {}\nfunction other(a, b, c) {\nnuthin}", "", 50);
			return testProposals(results, [
				["a", "a : {}"],
				["arguments", "arguments : Arguments"],
				["b", "b : {}"],
				["c", "c : {}"],
				["this", "this : {}"],
				["", "---------------------------------"],
				["Array([val])", "Array([val]) : Array"],
				["Boolean([val])", "Boolean([val]) : Boolean"],
				["Date([val])", "Date([val]) : Date"],
				["decodeURI(uri)", "decodeURI(uri) : String"],
				["decodeURIComponent(encodedURIString)", "decodeURIComponent(encodedURIString) : String"],
				["encodeURI(uri)", "encodeURI(uri) : String"],
				["encodeURIComponent(decodedURIString)", "encodeURIComponent(decodedURIString) : String"],
				["Error([err])", "Error([err]) : Error"],
				["eval(toEval)", "eval(toEval) : Object"],
				["fun(a, b, c)", "fun(a, b, c) : undefined"],
				["Function()", "Function() : Function"],
				["isFinite(num)", "isFinite(num) : Boolean"],
				["isNaN(num)", "isNaN(num) : Boolean"],
				["Number([val])", "Number([val]) : Number"],
				["Object([val])", "Object([val]) : Object"],
				["other(a, b, c)", "other(a, b, c) : undefined"],
				["parseFloat(str, [radix])", "parseFloat(str, [radix]) : Number"],
				["parseInt(str, [radix])", "parseInt(str, [radix]) : Number"],
				["RegExp([val])", "RegExp([val]) : RegExp"],
				["String([val])", "String([val]) : String"],
				["Infinity", "Infinity : Number"],
				["JSON", "JSON : JSON"],
				["Math", "Math : Math"],
				["NaN", "NaN : Number"],
				["nuthin", "nuthin : {}"],
				["undefined", "undefined : undefined"],
				["", "---------------------------------"],
				["hasOwnProperty(property)", "hasOwnProperty(property) : Boolean"],
				["isPrototypeOf(object)", "isPrototypeOf(object) : Boolean"],
				["propertyIsEnumerable(property)", "propertyIsEnumerable(property) : Boolean"],
				["toLocaleString()", "toLocaleString() : String"],
				["toString()", "toString() : String"],
				["valueOf()", "valueOf() : Object"]
			]);
		});
		it("test in function 3", function() {
			var results = computeContentAssist("function fun(a, b, c) {}\nfunction other(a, b, c) {f}", "f", 51);
			return testProposals(results, [
				["fun(a, b, c)", "fun(a, b, c) : undefined"],
				["Function()", "Function() : Function"]
			]);
		});
		it("test in function 4", function() {
			var results = computeContentAssist("function fun(a, b, c) {}\nfunction other(aa, ab, c) {a}", "a", 53);
			return testProposals(results, [
				["aa", "aa : {}"],
				["ab", "ab : {}"],
				["arguments", "arguments : Arguments"],
				["", "---------------------------------"],
				["Array([val])", "Array([val]) : Array"]
			]);
		});
		it("test in function 5", function() {
			var results = computeContentAssist("function fun(a, b, c) {}\nfunction other(aa, ab, c) {var abb;\na\nvar aaa}", "a", 62);
			return testProposals(results, [
				["aaa", "aaa : {}"],
				["abb", "abb : {}"],
				["", "---------------------------------"],
				["aa", "aa : {}"],
				["ab", "ab : {}"],
				["arguments", "arguments : Arguments"],
				["", "---------------------------------"],
				["Array([val])", "Array([val]) : Array"]
			]);
		});
		it("test in function 6", function() {
			var results = computeContentAssist("function fun(a, b, c) {\n function other(aa, ab, c) {\n var abb;\na\nvar aaa\n}\n}", "a", 65);
			return testProposals(results, [
				["aaa", "aaa : {}"],
				["abb", "abb : {}"],
				["", "---------------------------------"],
				["aa", "aa : {}"],
				["ab", "ab : {}"],
				["arguments", "arguments : Arguments"],
				["", "---------------------------------"],
				["a", "a : {}"],
				["", "---------------------------------"],
				["Array([val])", "Array([val]) : Array"]
			]);
		});
		it("test in function 7", function() {
			// should not see 'aaa' or 'abb' since declared in another function
			var results = computeContentAssist(
			"function fun(a, b, c) {\n" +
			"function other(aa, ab, ac) {\n"+
			"var abb;\na\nvar aaa\n}\n}", "", 23);
			return testProposals(results, [
				["a", "a : {}"],
				["arguments", "arguments : Arguments"],
				["b", "b : {}"],
				["c", "c : {}"],
				["this", "this : {}"],
				["", "---------------------------------"],
				["Array([val])", "Array([val]) : Array"],
				["Boolean([val])", "Boolean([val]) : Boolean"],
				["Date([val])", "Date([val]) : Date"],
				["decodeURI(uri)", "decodeURI(uri) : String"],
				["decodeURIComponent(encodedURIString)", "decodeURIComponent(encodedURIString) : String"],
				["encodeURI(uri)", "encodeURI(uri) : String"],
				["encodeURIComponent(decodedURIString)", "encodeURIComponent(decodedURIString) : String"],
				["Error([err])", "Error([err]) : Error"],
				["eval(toEval)", "eval(toEval) : Object"],
				["fun(a, b, c)", "fun(a, b, c) : undefined"],
				["Function()", "Function() : Function"],
				["isFinite(num)", "isFinite(num) : Boolean"],
				["isNaN(num)", "isNaN(num) : Boolean"],
				["Number([val])", "Number([val]) : Number"],
				["Object([val])", "Object([val]) : Object"],
				["other(aa, ab, ac)", "other(aa, ab, ac) : undefined"],
				["parseFloat(str, [radix])", "parseFloat(str, [radix]) : Number"],
				["parseInt(str, [radix])", "parseInt(str, [radix]) : Number"],
				["RegExp([val])", "RegExp([val]) : RegExp"],
				["String([val])", "String([val]) : String"],
				["Infinity", "Infinity : Number"],
				["JSON", "JSON : JSON"],
				["Math", "Math : Math"],
				["NaN", "NaN : Number"],
				["undefined", "undefined : undefined"],
				["", "---------------------------------"],
				["hasOwnProperty(property)", "hasOwnProperty(property) : Boolean"],
				["isPrototypeOf(object)", "isPrototypeOf(object) : Boolean"],
				["propertyIsEnumerable(property)", "propertyIsEnumerable(property) : Boolean"],
				["toLocaleString()", "toLocaleString() : String"],
				["toString()", "toString() : String"],
				["valueOf()", "valueOf() : Object"]
			]);
		});
		it("test in function 8", function() {
			// should not see 'aaa' since that is declared later
			var results = computeContentAssist("function fun(a, b, c) {\nfunction other(aa, ab, ac) {\n var abb;\na\nvar aaa\n} \n}", "", 75);
			return testProposals(results, [
				["other(aa, ab, ac)", "other(aa, ab, ac) : undefined"],
				["", "---------------------------------"],
				["a", "a : {}"],
				["arguments", "arguments : Arguments"],
				["b", "b : {}"],
				["c", "c : {}"],
				["this", "this : {}"],
				["", "---------------------------------"],
				["Array([val])", "Array([val]) : Array"],
				["Boolean([val])", "Boolean([val]) : Boolean"],
				["Date([val])", "Date([val]) : Date"],
				["decodeURI(uri)", "decodeURI(uri) : String"],
				["decodeURIComponent(encodedURIString)", "decodeURIComponent(encodedURIString) : String"],
				["encodeURI(uri)", "encodeURI(uri) : String"],
				["encodeURIComponent(decodedURIString)", "encodeURIComponent(decodedURIString) : String"],
				["Error([err])", "Error([err]) : Error"],
				["eval(toEval)", "eval(toEval) : Object"],
				["fun(a, b, c)", "fun(a, b, c) : undefined"],
				["Function()", "Function() : Function"],
				["isFinite(num)", "isFinite(num) : Boolean"],
				["isNaN(num)", "isNaN(num) : Boolean"],
				["Number([val])", "Number([val]) : Number"],
				["Object([val])", "Object([val]) : Object"],
				["parseFloat(str, [radix])", "parseFloat(str, [radix]) : Number"],
				["parseInt(str, [radix])", "parseInt(str, [radix]) : Number"],
				["RegExp([val])", "RegExp([val]) : RegExp"],
				["String([val])", "String([val]) : String"],
				["Infinity", "Infinity : Number"],
				["JSON", "JSON : JSON"],
				["Math", "Math : Math"],
				["NaN", "NaN : Number"],
				["undefined", "undefined : undefined"],
				["", "---------------------------------"],
				["hasOwnProperty(property)", "hasOwnProperty(property) : Boolean"],
				["isPrototypeOf(object)", "isPrototypeOf(object) : Boolean"],
				["propertyIsEnumerable(property)", "propertyIsEnumerable(property) : Boolean"],
				["toLocaleString()", "toLocaleString() : String"],
				["toString()", "toString() : String"],
				["valueOf()", "valueOf() : Object"]
			]);
		});
	    
		// TODO MS disabling this test.  It's not clear to me this is the desired behavior,
		// since we don't really have any idea if the global object will be passed as 'this'
		// it("test get global var"] = function() {
		// 	// should infer that we are referring to the globally defined xxx, not the param
		// 	var results = computeContentAssist("var xxx = 9;\nfunction fff(xxx) { this.xxx.toF}", "toF", 45);
		// 	return testProposals(results, [
		// 		["toFixed(digits)", "toFixed(digits) : Number"]
		// 	]);
		// };
	
		it("test get local var", function() {
			// should infer that we are referring to the locally defined xxx, not the global
			var results = computeContentAssist("var xxx = 9;\nfunction fff(xxx) { xxx.toF}", "toF", 40);
			return testProposals(results, [
			]);
		});
	
		it("test Math 1", function() {
			var results = computeContentAssist("Mat", "Mat");
			return testProposals(results, [
				["Math", "Math : Math"]
			]);
		});
		it("test Math 2", function() {
			var results = computeContentAssist("this.Mat", "Mat");
			return testProposals(results, [
				["Math", "Math : Math"]
			]);
		});
		it("test Math 3", function() {
			// Math not available when this isn't the global this
			var results = computeContentAssist("var ff = { f: this.Mat }", "Mat", 22);
			return testProposals(results, [
			]);
		});
		it("test Math 4", function() {
			var results = computeContentAssist("this.Math.E", "E");
			return testProposals(results, [
				["E", "E : Number"]
			]);
		});
		it("test JSON 4", function() {
			var results = computeContentAssist("this.JSON.st", "st");
			return testProposals(results, [
				["stringify(json)", "stringify(json) : String"]
			]);
		});
		it("test multi-dot inferencing 1", function() {
			var results = computeContentAssist("var a = \"\";\na.charAt().charAt().charAt().ch", "ch");
			return testProposals(results, [
				["charAt(index)", "charAt(index) : String"],
				["charCodeAt(index)", "charCodeAt(index) : Number"]
			]);
		});
		it("test multi-dot inferencing 2", function() {
			var results = computeContentAssist(
			"var zz = {};\nzz.zz = zz;\nzz.zz.zz.z", "z");
			return testProposals(results, [
				["zz", "zz : {zz:{zz:{...}}}"]
			]);
		});
		it("test multi-dot inferencing 3", function() {
			var results = computeContentAssist(
			"var x = { yy : { } };\nx.yy.zz = 1;\nx.yy.z", "z");
			return testProposals(results, [
				["zz", "zz : Number"]
			]);
		});
		it("test multi-dot inferencing 4", function() {
			var results = computeContentAssist(
			"var x = { yy : { } };\nx.yy.zz = 1;\nx.yy.zz.toF", "toF");
			return testProposals(results, [
				["toFixed(digits)", "toFixed(digits) : String"]
			]);
		});
		it("test constructor 1", function() {
			var results = computeContentAssist(
			"function Fun() {\n	this.xxx = 9;\n	this.uuu = this.x;}", "x", 50);
			return testProposals(results, [
				["xxx", "xxx : Number"]
			]);
		});
		it("test constructor 2", function() {
			var results = computeContentAssist(
			"function Fun() {	this.xxx = 9;	this.uuu = this.xxx; }\n" +
			"var y = new Fun();\n" +
			"y.x", "x");
			return testProposals(results, [
				["xxx", "xxx : Number"]
			]);
		});
		it("test constructor 3", function() {
			var results = computeContentAssist(
			"function Fun() {	this.xxx = 9;	this.uuu = this.xxx; }\n" +
			"var y = new Fun();\n" +
			"y.xxx.toF", "toF");
			return testProposals(results, [
				["toFixed(digits)", "toFixed(digits) : String"]
			]);
		});
		it("test constructor 3", function() {
			var results = computeContentAssist(
			"function Fun() {	this.xxx = 9;	this.uuu = this.xxx; }\n" +
			"var y = new Fun();\n" +
			"y.uuu.toF", "toF");
			return testProposals(results, [
				["toFixed(digits)", "toFixed(digits) : String"]
			]);
		});
	
		it("test constructor 4", function() {
			var results = computeContentAssist(
			"var Fun = function () {	this.xxx = 9;	this.uuu = this.xxx; }\n" +
			"var y = new Fun();\n" +
			"y.uuu.toF", "toF");
			return testProposals(results, [
				["toFixed(digits)", "toFixed(digits) : String"]
			]);
		});
	
		it("test constructor 5", function() {
			var results = computeContentAssist(
			"var x = { Fun : function () { this.xxx = 9;	this.uuu = this.xxx; } }\n" +
			"var y = new x.Fun();\n" +
			"y.uuu.toF", "toF");
			return testProposals(results, [
				["toFixed(digits)", "toFixed(digits) : String"]
			]);
		});
	
		it("test constructor 6", function() {
			var results = computeContentAssist(
			"var x = { Fun : function () { this.xxx = 9;	this.uuu = this.xxx; } }\n" +
			"var y = new x.Fun().uuu.toF", "toF");
			return testProposals(results, [
				["toFixed(digits)", "toFixed(digits) : String"]
			]);
		});
	
		it("test constructor 7", function() {
			var results = computeContentAssist(
			"var Fun = function () {	this.xxx = 9;	this.uuu = this.xxx; }\n" +
			"var x = { Fun : Fun };\n" +
			"var y = new x.Fun();\n" +
			"y.uuu.toF", "toF");
			return testProposals(results, [
				["toFixed(digits)", "toFixed(digits) : String"]
			]);
		});
	
		it("test constructor 8", function() {
			var results = computeContentAssist(
			"var FunOrig = function () {	this.xxx = 9;	this.uuu = this.xxx; }\n" +
			"var x = { Fun : FunOrig };\n" +
			"var y = new x.Fun();\n" +
			"y.uuu.toF", "toF");
			return testProposals(results, [
				["toFixed(digits)", "toFixed(digits) : String"]
			]);
		});
	
		// functions should not be available outside the scope that declares them
		it("test constructor 9", function() {
			var results = computeContentAssist(
			"function outer() { function Inner() { }}\n" +
			"Inn", "Inn");
			return testProposals(results, [
				// TODO FIXADE adding all constructors to global scope.  not correct
				["Inner()", "Inner() : Inner"]
			]);
		});
	
		// should be able to reference functions using qualified name
		it("test constructor 10", function() {
			var results = computeContentAssist(
			"var outer = { Inner : function() { }}\n" +
			"outer.Inn", "Inn");
			return testProposals(results, [
				["Inner()", "Inner() : outer.Inner"]
			]);
		});
	
		it("test Function args 1", function() {
			var results = computeContentAssist(
			"var ttt, uuu;\nttt()", "", 18);
			return testProposals(results, [
				["Array([val])", "Array([val]) : Array"],
				["Boolean([val])", "Boolean([val]) : Boolean"],
				["Date([val])", "Date([val]) : Date"],
				["decodeURI(uri)", "decodeURI(uri) : String"],
				["decodeURIComponent(encodedURIString)", "decodeURIComponent(encodedURIString) : String"],
				["encodeURI(uri)", "encodeURI(uri) : String"],
				["encodeURIComponent(decodedURIString)", "encodeURIComponent(decodedURIString) : String"],
				["Error([err])", "Error([err]) : Error"],
				["eval(toEval)", "eval(toEval) : Object"],
				["Function()", "Function() : Function"],
				["isFinite(num)", "isFinite(num) : Boolean"],
				["isNaN(num)", "isNaN(num) : Boolean"],
				["Number([val])", "Number([val]) : Number"],
				["Object([val])", "Object([val]) : Object"],
				["parseFloat(str, [radix])", "parseFloat(str, [radix]) : Number"],
				["parseInt(str, [radix])", "parseInt(str, [radix]) : Number"],
				["RegExp([val])", "RegExp([val]) : RegExp"],
				["String([val])", "String([val]) : String"],
				["Infinity", "Infinity : Number"],
				["JSON", "JSON : JSON"],
				["Math", "Math : Math"],
				["NaN", "NaN : Number"],
				["this", "this : Global"],
				["ttt", "ttt : {}"],
				["undefined", "undefined : undefined"],
				["uuu", "uuu : {}"],
				["", "---------------------------------"],
				["hasOwnProperty(property)", "hasOwnProperty(property) : Boolean"],
				["isPrototypeOf(object)", "isPrototypeOf(object) : Boolean"],
				["propertyIsEnumerable(property)", "propertyIsEnumerable(property) : Boolean"],
				["toLocaleString()", "toLocaleString() : String"],
				["toString()", "toString() : String"],
				["valueOf()", "valueOf() : Object"]
			]);
		});
		it("test Function args 2", function() {
			var results = computeContentAssist(
			"var ttt, uuu;\nttt(ttt, )", "", 23);
			return testProposals(results, [
				["Array([val])", "Array([val]) : Array"],
				["Boolean([val])", "Boolean([val]) : Boolean"],
				["Date([val])", "Date([val]) : Date"],
				["decodeURI(uri)", "decodeURI(uri) : String"],
				["decodeURIComponent(encodedURIString)", "decodeURIComponent(encodedURIString) : String"],
				["encodeURI(uri)", "encodeURI(uri) : String"],
				["encodeURIComponent(decodedURIString)", "encodeURIComponent(decodedURIString) : String"],
				["Error([err])", "Error([err]) : Error"],
				["eval(toEval)", "eval(toEval) : Object"],
				["Function()", "Function() : Function"],
				["isFinite(num)", "isFinite(num) : Boolean"],
				["isNaN(num)", "isNaN(num) : Boolean"],
				["Number([val])", "Number([val]) : Number"],
				["Object([val])", "Object([val]) : Object"],
				["parseFloat(str, [radix])", "parseFloat(str, [radix]) : Number"],
				["parseInt(str, [radix])", "parseInt(str, [radix]) : Number"],
				["RegExp([val])", "RegExp([val]) : RegExp"],
				["String([val])", "String([val]) : String"],
				["Infinity", "Infinity : Number"],
				["JSON", "JSON : JSON"],
				["Math", "Math : Math"],
				["NaN", "NaN : Number"],
				["this", "this : Global"],
				["ttt", "ttt : {}"],
				["undefined", "undefined : undefined"],
				["uuu", "uuu : {}"],
				["", "---------------------------------"],
				["hasOwnProperty(property)", "hasOwnProperty(property) : Boolean"],
				["isPrototypeOf(object)", "isPrototypeOf(object) : Boolean"],
				["propertyIsEnumerable(property)", "propertyIsEnumerable(property) : Boolean"],
				["toLocaleString()", "toLocaleString() : String"],
				["toString()", "toString() : String"],
				["valueOf()", "valueOf() : Object"]
			]);
		});
		it("test Function args 3", function() {
			var results = computeContentAssist(
			"var ttt, uuu;\nttt(ttt, , uuu)", "", 23);
			return testProposals(results, [
				["Array([val])", "Array([val]) : Array"],
				["Boolean([val])", "Boolean([val]) : Boolean"],
				["Date([val])", "Date([val]) : Date"],
				["decodeURI(uri)", "decodeURI(uri) : String"],
				["decodeURIComponent(encodedURIString)", "decodeURIComponent(encodedURIString) : String"],
				["encodeURI(uri)", "encodeURI(uri) : String"],
				["encodeURIComponent(decodedURIString)", "encodeURIComponent(decodedURIString) : String"],
				["Error([err])", "Error([err]) : Error"],
				["eval(toEval)", "eval(toEval) : Object"],
				["Function()", "Function() : Function"],
				["isFinite(num)", "isFinite(num) : Boolean"],
				["isNaN(num)", "isNaN(num) : Boolean"],
				["Number([val])", "Number([val]) : Number"],
				["Object([val])", "Object([val]) : Object"],
				["parseFloat(str, [radix])", "parseFloat(str, [radix]) : Number"],
				["parseInt(str, [radix])", "parseInt(str, [radix]) : Number"],
				["RegExp([val])", "RegExp([val]) : RegExp"],
				["String([val])", "String([val]) : String"],
				["Infinity", "Infinity : Number"],
				["JSON", "JSON : JSON"],
				["Math", "Math : Math"],
				["NaN", "NaN : Number"],
				["this", "this : Global"],
				["ttt", "ttt : {}"],
				["undefined", "undefined : undefined"],
				["uuu", "uuu : {}"],
				["", "---------------------------------"],
				["hasOwnProperty(property)", "hasOwnProperty(property) : Boolean"],
				["isPrototypeOf(object)", "isPrototypeOf(object) : Boolean"],
				["propertyIsEnumerable(property)", "propertyIsEnumerable(property) : Boolean"],
				["toLocaleString()", "toLocaleString() : String"],
				["toString()", "toString() : String"],
				["valueOf()", "valueOf() : Object"]
			]);
		});
	
		// check that function args don't get assigned the same type
		it("test function args 4", function() {
			var results = computeContentAssist(
				"function tt(aaa, bbb) { aaa.foo = 9;bbb.foo = ''\naaa.f}", "f", 54);
			return testProposals(results, [
				["foo", "foo : Number"]
			]);
		});
	
		// check that function args don't get assigned the same type
		it("test function args 5", function() {
			var results = computeContentAssist(
				"function tt(aaa, bbb) { aaa.foo = 9;bbb.foo = ''\nbbb.f}", "f", 54);
			return testProposals(results, [
				["foo", "foo : String"]
			]);
		});
	
		// FIXADE failing since we do not handle constructors that are not identifiers
	//	it("test constructor 5", function() {
	//		var results = computeContentAssist(
	//		"var obj = { Fun : function() {	this.xxx = 9;	this.uuu = this.xxx; } }\n" +
	//		"var y = new obj.Fun();\n" +
	//		"y.uuu.toF", "toF");
	//		return testProposals(results, [
	//			["toFixed(digits)", "toFixed(digits) : String"]
	//		]);
	//	});
		it("test constructor 6", function() {
			var results = computeContentAssist(
			"function Fun2() {\n function Fun() {	this.xxx = 9;	this.uuu = this.xxx; }\n var y = new Fun();\n y.uuu.toF}", "toF", 103);
			return testProposals(results, [
				["toFixed(digits)", "toFixed(digits) : String"]
			]);
		});
	
	
		it("test nested object expressions 1", function() {
			var results = computeContentAssist(
			"var ttt = { xxx : { yyy : { zzz : 1} } };\n" +
			"ttt.xxx.y", "y");
			return testProposals(results, [
				["yyy", "yyy : {zzz:Number}"]
			]);
		});
		it("test nested object expressions 2", function() {
			var results = computeContentAssist(
			"var ttt = { xxx : { yyy : { zzz : 1} } };\n" +
			"ttt.xxx.yyy.z", "z");
			return testProposals(results, [
				["zzz", "zzz : Number"]
			]);
		});
		it("test nested object expressions 3", function() {
			var results = computeContentAssist(
			"var ttt = { xxx : { yyy : { zzz : 1} } };\n" +
			"ttt.xxx.yyy.zzz.toF", "toF");
			return testProposals(results, [
				["toFixed(digits)", "toFixed(digits) : String"]
			]);
		});
	
		it("test function expression 1", function() {
			var results = computeContentAssist(
			"var ttt = function(a, b, c) { };\ntt", "tt");
			return testProposals(results, [
				["ttt(a, b, c)", "ttt(a, b, c) : undefined"]
			]);
		});
		it("test function expression 2", function() {
			var results = computeContentAssist(
			"ttt = function(a, b, c) { };\ntt", "tt");
			return testProposals(results, [
				["ttt(a, b, c)", "ttt(a, b, c) : undefined"]
			]);
		});
		it("test function expression 3", function() {
			var results = computeContentAssist(
			"ttt = { rrr : function(a, b, c) { } };\nttt.rr", "rr");
			return testProposals(results, [
				["rrr(a, b, c)", "rrr(a, b, c) : undefined"]
			]);
		});
		it("test function expression 4", function() {
			var results = computeContentAssist(
			"var ttt = function(a, b) { };\nvar hhh = ttt;\nhhh", "hhh");
			return testProposals(results, [
				["hhh(a, b)", "hhh(a, b) : undefined"]
			]);
		});
		it("test function expression 4a", function() {
			var results = computeContentAssist(
			"function ttt(a, b) { };\nvar hhh = ttt;\nhhh", "hhh");
			return testProposals(results, [
				["hhh(a, b)", "hhh(a, b) : undefined"]
			]);
		});
		it("test function expression 5", function() {
			var results = computeContentAssist(
			"var uuu = {	flart : function (a,b) { } };\nhhh = uuu.flart;\nhhh", "hhh");
			return testProposals(results, [
				["hhh(a, b)", "hhh(a, b) : undefined"]
			]);
		});
		it("test function expression 6", function() {
			var results = computeContentAssist(
			"var uuu = {	flart : function (a,b) { } };\nhhh = uuu.flart;\nhhh.app", "app");
			return testProposals(results, [
				["apply(func, [argArray])", "apply(func, [argArray]) : Object"]
			]);
		});
	
		it("test globals 1", function() {
			var results = computeContentAssist("/*global faaa */\nfa", "fa");
			return testProposals(results, [
				["faaa", "faaa : {}"]
			]);
		});
		it("test globals 2", function() {
			var results = computeContentAssist("/*global  \t\n faaa \t\t\n faaa2  */\nfa", "fa");
			return testProposals(results, [
				["faaa", "faaa : {}"],
				["faaa2", "faaa2 : {}"]
			]);
		});
		it("test globals 3", function() {
			var results = computeContentAssist("/*global  \t\n faaa \t\t\n fass2  */\nvar t = 1;\nt.fa", "fa");
			return testProposals(results, [
			]);
		});
	
		it("test globals 4", function() {
			var results = computeContentAssist("/*global  \t\n faaa:true \t\t\n faaa2:false  */\nfa", "fa");
			return testProposals(results, [
				["faaa", "faaa : {}"],
				["faaa2", "faaa2 : {}"]
			]);
		});
	
		it("test globals 5", function() {
			var results = computeContentAssist("/*global  \t\n faaa:true, \t\t\n faaa2:false,  */\nfa", "fa");
			return testProposals(results, [
				["faaa", "faaa : {}"],
				["faaa2", "faaa2 : {}"]
			]);
		});
	
	
	
		////////////////////////////
		// tests for complex names
		////////////////////////////
		it("test complex name 1", function() {
			var results = computeContentAssist("function Ttt() { }\nvar ttt = new Ttt();\ntt", "tt");
			return testProposals(results, [
				["Ttt()", "Ttt() : Ttt"],
				["ttt", "ttt : Ttt"]
			]);
		});
		it("test complex name 2", function() {
			var results = computeContentAssist("var Ttt = function() { };\nvar ttt = new Ttt();\ntt", "tt");
			return testProposals(results, [
				["Ttt()", "Ttt() : Ttt"],
				["ttt", "ttt : Ttt"]
			]);
		});
		it("test complex name 3", function() {
			var results = computeContentAssist("var ttt = { };\ntt", "tt");
			return testProposals(results, [
				["ttt", "ttt : {}"]
			]);
		});
		it("test complex name 4", function() {
			var results = computeContentAssist("var ttt = { aa: 1, bb: 2 };\ntt", "tt");
			return testProposals(results, [
				["ttt", "ttt : {aa:Number,bb:Number}"]
			]);
		});
		it("test complex name 5", function() {
			var results = computeContentAssist("var ttt = { aa: 1, bb: 2 };\nttt.cc = 9;\ntt", "tt");
			return testProposals(results, [
				["ttt", "ttt : {aa:Number,bb:Number,cc:Number}"]
			]);
		});
	
		////////////////////////////
		// tests for broken syntax
		////////////////////////////
	
		it("test broken after dot 1", function() {
			var results = computeContentAssist("var ttt = { ooo:8};\nttt.", "");
			return testProposals(results, [
				["ooo", "ooo : Number"],
				["", "---------------------------------"],
				["hasOwnProperty(property)", "hasOwnProperty(property) : Boolean"],
				["isPrototypeOf(object)", "isPrototypeOf(object) : Boolean"],
				["propertyIsEnumerable(property)", "propertyIsEnumerable(property) : Boolean"],
				["toLocaleString()", "toLocaleString() : String"],
				["toString()", "toString() : String"],
				["valueOf()", "valueOf() : Object"]
			]);
		});
	
		it("test broken after dot 2", function() {
			var results = computeContentAssist("var ttt = { ooo:8};\nif (ttt.) { ttt }", "", "var ttt = { ooo:8};\nif (ttt.".length);
			return testProposals(results, [
				["ooo", "ooo : Number"],
				["", "---------------------------------"],
				["hasOwnProperty(property)", "hasOwnProperty(property) : Boolean"],
				["isPrototypeOf(object)", "isPrototypeOf(object) : Boolean"],
				["propertyIsEnumerable(property)", "propertyIsEnumerable(property) : Boolean"],
				["toLocaleString()", "toLocaleString() : String"],
				["toString()", "toString() : String"],
				["valueOf()", "valueOf() : Object"]
			]);
		});
		it("test broken after dot 3", function() {
			var results = computeContentAssist("var ttt = { ooo:this.};", "", "var ttt = { ooo:this.".length);
			return testProposals(results, [
				["ooo", "ooo : {ooo:{ooo:{...}}}"],
				["", "---------------------------------"],
				["hasOwnProperty(property)", "hasOwnProperty(property) : Boolean"],
				["isPrototypeOf(object)", "isPrototypeOf(object) : Boolean"],
				["propertyIsEnumerable(property)", "propertyIsEnumerable(property) : Boolean"],
				["toLocaleString()", "toLocaleString() : String"],
				["toString()", "toString() : String"],
				["valueOf()", "valueOf() : Object"]
			]);
		});
		// same as above, except use 
		it("test broken after dot 3a", function() {
			var results = computeContentAssist("var ttt = { ooo:this.};", "", 21);
			return testProposals(results, [
				["ooo", "ooo : {ooo:{ooo:{...}}}"],
				["", "---------------------------------"],
				["hasOwnProperty(property)", "hasOwnProperty(property) : Boolean"],
				["isPrototypeOf(object)", "isPrototypeOf(object) : Boolean"],
				["propertyIsEnumerable(property)", "propertyIsEnumerable(property) : Boolean"],
				["toLocaleString()", "toLocaleString() : String"],
				["toString()", "toString() : String"],
				["valueOf()", "valueOf() : Object"]
			]);
		});
	
		it("test broken after dot 4", function() {
			var results = computeContentAssist("var ttt = { ooo:8};\nfunction ff() { \nttt.}", "", "var ttt = { ooo:8};\nfunction ff() { \nttt.".length);
			return testProposals(results, [
				["ooo", "ooo : Number"],
				["", "---------------------------------"],
				["hasOwnProperty(property)", "hasOwnProperty(property) : Boolean"],
				["isPrototypeOf(object)", "isPrototypeOf(object) : Boolean"],
				["propertyIsEnumerable(property)", "propertyIsEnumerable(property) : Boolean"],
				["toLocaleString()", "toLocaleString() : String"],
				["toString()", "toString() : String"],
				["valueOf()", "valueOf() : Object"]
			]);
		});
		// same as above, except use 
		it("test broken after dot 4a", function() {
			var results = computeContentAssist("var ttt = { ooo:8};\nfunction ff() { \nttt.}", "", 41);
			return testProposals(results, [
				["ooo", "ooo : Number"],
				["", "---------------------------------"],
				["hasOwnProperty(property)", "hasOwnProperty(property) : Boolean"],
				["isPrototypeOf(object)", "isPrototypeOf(object) : Boolean"],
				["propertyIsEnumerable(property)", "propertyIsEnumerable(property) : Boolean"],
				["toLocaleString()", "toLocaleString() : String"],
				["toString()", "toString() : String"],
				["valueOf()", "valueOf() : Object"]
			]);
		});
	
		it("test broken after dot 5", function() {
			var results = computeContentAssist(
				"var first = {ooo:9};\n" +
				"first.\n" +
				"var jjj;", "",
	
				("var first = {ooo:9};\n" +
				"first.").length);
	
			return testProposals(results, [
				["ooo", "ooo : Number"],
				["", "---------------------------------"],
				["hasOwnProperty(property)", "hasOwnProperty(property) : Boolean"],
				["isPrototypeOf(object)", "isPrototypeOf(object) : Boolean"],
				["propertyIsEnumerable(property)", "propertyIsEnumerable(property) : Boolean"],
				["toLocaleString()", "toLocaleString() : String"],
				["toString()", "toString() : String"],
				["valueOf()", "valueOf() : Object"]
			]);
		});
	
	
		it("test broken after dot 6", function() {
			var results = computeContentAssist(
				"var first = {ooo:9};\n" +
				"first.\n" +
				"if (x) { }", "",
	
				("var first = {ooo:9};\n" +
				"first.").length);
	
			return testProposals(results, [
				["ooo", "ooo : Number"],
				["", "---------------------------------"],
				["hasOwnProperty(property)", "hasOwnProperty(property) : Boolean"],
				["isPrototypeOf(object)", "isPrototypeOf(object) : Boolean"],
				["propertyIsEnumerable(property)", "propertyIsEnumerable(property) : Boolean"],
				["toLocaleString()", "toLocaleString() : String"],
				["toString()", "toString() : String"],
				["valueOf()", "valueOf() : Object"]
			]);
		});
	
		///////////////////////////////////////////////
		// Binary and unary expressions
		///////////////////////////////////////////////
		it("test binary expr1", function() {
			var results = computeContentAssist(
				"(1 + 2).toF", "toF");
			return testProposals(results, [
				["toFixed(digits)", "toFixed(digits) : String"]
			]);
		});
		it("test binary expr2", function() {
			var results = computeContentAssist(
				"(1 + '').char", "char");
			return testProposals(results, [
				["charAt(index)", "charAt(index) : String"],
				["charCodeAt(index)", "charCodeAt(index) : Number"]
			]);
		});
		it("test binary expr3", function() {
			var results = computeContentAssist(
				"('' + 2).char", "char");
			return testProposals(results, [
				["charAt(index)", "charAt(index) : String"],
				["charCodeAt(index)", "charCodeAt(index) : Number"]
			]);
		});
		it("test binary expr4", function() {
			var results = computeContentAssist(
				"('' + hucairz).char", "char");
			return testProposals(results, [
				["charAt(index)", "charAt(index) : String"],
				["charCodeAt(index)", "charCodeAt(index) : Number"]
			]);
		});
		it("test binary expr5", function() {
			var results = computeContentAssist(
				"(hucairz + hucairz).toF", "toF");
			return testProposals(results, [
				["toFixed(digits)", "toFixed(digits) : String"]
			]);
		});
		it("test binary expr6", function() {
			var results = computeContentAssist(
				"(hucairz - hucairz).toF", "toF");
			return testProposals(results, [
				["toFixed(digits)", "toFixed(digits) : String"]
			]);
		});
		it("test binary expr7", function() {
			var results = computeContentAssist(
				"('' - '').toF", "toF");
			return testProposals(results, [
				["toFixed(digits)", "toFixed(digits) : String"]
			]);
		});
		it("test binary expr8", function() {
			var results = computeContentAssist(
				"('' & '').toF", "toF");
			return testProposals(results, [
				["toFixed(digits)", "toFixed(digits) : String"]
			]);
		});
		it("test binary expr9", function() {
			var results = computeContentAssist(
				"({ a : 9 } && '').a.toF", "toF");
			return testProposals(results, [
				["toFixed(digits)", "toFixed(digits) : String"]
			]);
		});
		it("test binary expr10", function() {
			var results = computeContentAssist(
				"({ a : 9 } || '').a.toF", "toF");
			return testProposals(results, [
				["toFixed(digits)", "toFixed(digits) : String"]
			]);
		});
		it("test binary expr11", function() {
			var results = computeContentAssist(
				"var aaa = function() { return hucairz || hucairz; }\naa", "aa");
			return testProposals(results, [
				["aaa()", "aaa() : {}"]
			]);
		});
		it("test binary expr12", function() {
			var results = computeContentAssist(
				"var aaa = function() { return hucairz | hucairz; }\naa", "aa");
			return testProposals(results, [
				["aaa()", "aaa() : Number"]
			]);
		});
		it("test binary expr12", function() {
			var results = computeContentAssist(
				"var aaa = function() { return hucairz == hucairz; }\naa", "aa");
			return testProposals(results, [
				["aaa()", "aaa() : Boolean"]
			]);
		});
	
		it("test unary expr1", function() {
			var results = computeContentAssist(
				"(x += y).toF", "toF");
			return testProposals(results, [
				["toFixed(digits)", "toFixed(digits) : String"]
			]);
		});
		it("test unary expr2", function() {
			var results = computeContentAssist(
				"(x += 1).toF", "toF");
			return testProposals(results, [
				["toFixed(digits)", "toFixed(digits) : String"]
			]);
		});
		it("test unary expr3", function() {
			var results = computeContentAssist(
				"var x = '';\n(x += 1).char", "char");
			return testProposals(results, [
				["charAt(index)", "charAt(index) : String"],
				["charCodeAt(index)", "charCodeAt(index) : Number"]
			]);
		});
		it("test unary expr4", function() {
			var results = computeContentAssist(
				"var aaa = function() { return !hucairz; }\naa", "aa");
			return testProposals(results, [
				["aaa()", "aaa() : Boolean"]
			]);
		});
	
		///////////////////////////////////////////////
		// Mucking around with a constructor function's prototype
		///////////////////////////////////////////////
		it("test constructor prototype1", function() {
			var results = computeContentAssist(
				"var AAA = function() { };\nAAA.prototype.foo = 9;\nnew AAA().f", "f");
			return testProposals(results, [
				["foo", "foo : Number"]
			]);
		});
		/* constructors */
		it("test constructor prototype2", function() {
			var results = computeContentAssist(
				"var AAA = function() { };\nAAA.prototype = { foo : 9 };\nnew AAA().f", "f");
			return testProposals(results, [
				["foo", "foo : Number"]
			]);
		});
		
		/* constructors */
		it("test constructor prototype3", function() {
			var results = computeContentAssist(
				"var AAA = function() { this.foo = 0; };\nAAA.prototype = { foo : '' };\nnew AAA().f", "f");
			return testProposals(results, [
				["foo", "foo : Number"]
			]);
		});
		
		/* constructors */
		it("test constructor prototype4", function() {
			var results = computeContentAssist(
				"var AAA = function() { };\nAAA.prototype = { foo : 9 };\nvar x = new AAA();\n x.f", "f");
			return testProposals(results, [
				["foo", "foo : Number"]
			]);
		});
		
		/* constructors */
		it("test constructor prototype5", function() {
			var results = computeContentAssist(
				"var AAA = function() { };\nAAA.prototype = { foo : '' };\nvar x = new AAA();\nx.foo = 9;\nx.f", "f");
			return testProposals(results, [
				["foo", "foo : Number"]
			]);
		});
		
		/* constructors */
		it("test constructor prototype6", function() {
			var results = computeContentAssist(
				"var Fun = function() { };\n" +
				"var obj = new Fun();\n" +
				"Fun.prototype.num = 0;\n" +
				"obj.n", "n");
			return testProposals(results, [
				["num", "num : Number"]
			]);
		});
		
		/* constructors */
		it("test dotted constructor1", function() {
			var results = computeContentAssist(
				"var obj = { Fun : function() { }, fun : function() {}, fun2 : 9 }\nnew obj", "obj");
			return testProposals(results, [
				["obj.Fun()", "obj.Fun() : obj.Fun"],
				["Object([val])", "Object([val]) : Object"],
				["obj", "obj : {Fun:function(new:obj.Fun):obj.Fun,fun:function(),fun2:Number}"]
			]);
		});
		
		/* constructors */
		it("test dotted constructor2", function() {
			var results = computeContentAssist(
				"var obj = { Fun : function() { } }\nnew obj.F", "F");
			return testProposals(results, [
				["Fun()", "Fun() : obj.Fun"]
			]);
		});
		
		/* constructors */
		it("test dotted constructor3", function() {
			var results = computeContentAssist(
				"var obj = { };\nobj.Fun = function() { };\nnew obj", "obj");
			return testProposals(results, [
				["obj.Fun()", "obj.Fun() : obj.Fun"],
				["Object([val])", "Object([val]) : Object"],
				["obj", "obj : {Fun:function(new:obj.Fun):obj.Fun}"]
			]);
		});
		
		/* constructors */
		it("test dotted constructor4", function() {
			var results = computeContentAssist(
				"var obj = { inner : { Fun : function() { } } }\nnew obj", "obj");
			return testProposals(results, [
				["obj.inner.Fun()", "obj.inner.Fun() : obj.inner.Fun"],
				["Object([val])", "Object([val]) : Object"],
				["obj", "obj : {inner:{Fun:function(new:obj.inner.Fun):obj.inner.Fun}}"]
			]);
		});
		
		/* constructors */
		it("test dotted constructor5", function() {
			var results = computeContentAssist(
				"var obj = { inner : {} }\nobj.inner.Fun = function() { }\nnew obj", "obj");
			return testProposals(results, [
				["obj.inner.Fun()", "obj.inner.Fun() : obj.inner.Fun"],
				["Object([val])", "Object([val]) : Object"],
				["obj", "obj : {inner:{Fun:function(new:obj.inner.Fun):obj.inner.Fun}}"]
	
			]);
		});
		
		/* constructors */
		it("test dotted constructor6", function() {
			var results = computeContentAssist(
				"var obj = { inner : {} }\nobj.inner.inner2 = { Fun : function() { } }\nnew obj", "obj");
			return testProposals(results, [
				["obj.inner.inner2.Fun()", "obj.inner.inner2.Fun() : obj.inner.inner2.Fun"],
				["Object([val])", "Object([val]) : Object"],
				["obj", "obj : {inner:{inner2:{...}}}"]
			]);
		});
	
		// assign to another---should only have one proposal since we don't change the type name
		it("test dotted constructor7", function() {
			var results = computeContentAssist(
				"var obj = { inner : { Fun : function() { }  } }\n" +
				"var other = obj\n" +
				"new other.inner", "inner");
			return testProposals(results, [
				["inner", "inner : {Fun:function(new:obj.inner.Fun):obj.inner.Fun}"]
			]);
		});
	
		// assign sub-part to another---should only have one proposal since we don't change the type name
		it("test dotted constructor8", function() {
			var results = computeContentAssist(
				"var obj = { inner : { Fun : function() { } } }\n" +
				"var other = obj.inner\n" +
				"new other", "other");
			return testProposals(results, [
				["other", "other : {Fun:function(new:obj.inner.Fun):obj.inner.Fun}"]
			]);
		});
	
		// overloaded constructors
		it("test dotted constructor9", function() {
			var results = computeContentAssist(
				"var obj = { Fun : function() { this.yy1 = 9; } }\n" +
				"var obj2 = { Fun : function() { this.yy2 = 9; } }\n" +
				"var xxx = new obj.Fun();\n" +
				"xxx.yy", "yy");
			return testProposals(results, [
				["yy1", "yy1 : Number"]
			]);
		});
		
		/* constructors */
		it("test dotted constructor10", function() {
			var results = computeContentAssist(
				"var obj = { Fun : function() { } }\nobj.Fun.prototype = { yy1 : 9};\n" +
				"var obj2 = { Fun : function() { } }\nobj2.Fun.prototype = { yy2 : 9};\n" +
				"var xxx = new obj.Fun();\n" +
				"xxx.yy", "yy");
			return testProposals(results, [
				["yy1", "yy1 : Number"]
			]);
		});
	
		// constructor declared inside a function should not be available externally
		it("test constructor in function", function() {
			var results = computeContentAssist(
				"var obj = function() { var Fn = function() { }; };\n" +
				"new Fn", "Fn");
			return testProposals(results, [
			]);
		});
	
		// Not ideal, but a constructor being used from a constructed object is not dotted, but should be
		it("test constructor in constructor Not Ideal", function() {
			var results = computeContentAssist(
				"function Fun() { this.Inner = function() { }}\n" +
				"var f = new Fun()\n" +
				"new f.Inner", "Inner");
			return testProposals(results, [
				// should be Fun.Inner, but is not
				["Inner()", "Inner() : Inner"]
			]);
		});
	
		// should not be able to redefine or add to global types
		it("test global redefine1", function() {
			var results = computeContentAssist(
				"this.JSON = {};\n" +
				"JSON.st", "st");
			return testProposals(results, [
				["stringify(json)", "stringify(json) : String"]
			]);
		});
		// should not be able to redefine or add to global types
		it("test global redefine2", function() {
			var results = computeContentAssist(
				"this.JSON.stFOO;\n" +
				"JSON.st", "st");
			return testProposals(results, [
				["stringify(json)", "stringify(json) : String"]
			]);
		});
	
		////////////////////////////////////////
		// jsdoc tests
		////////////////////////////////////////
		if (!doctrine.isStub) {
	       /**
	        * Test the @returns tag in assist
	        * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=459499
	        * @since 8.0
	        */
			it("test simple jsdoc returns 1", function() {
				var results = computeContentAssist(
					"/** @returns {Number}*/\n" +
					"var xx = function() { };\nx", "x"
				);
				return testProposals(results, [
					["xx()", "xx() : Number"]
				]);
			});
	
	       /**
	        * Test the @returns tag in assist
	        * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=459499
	        * @since 8.0
	        */
			it("test returns jsdoc 1", function() {
				var results = computeContentAssist(
					"/** @returns {function(a:String,?Number):Number} xx2\n */" +
					"var flart = function(xx1,xx2) { }\nflar",
					"flar");
				// hmmmm... functions returning functions not really showing up
				return testProposals(results, [
					["flart(xx1, xx2)", "flart(xx1, xx2) : function(a:String,?Number):Number"]
				]);
			});
	
			/**
	        * Test the @returns tag in assist
	        * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=459499
	        * @since 8.0
	        */
			it("test returns jsdoc 2", function() {
				var results = computeContentAssist(
					"/** @returns {function(String):Number} xx2\n */" +
					"var flart = function(xx1,xx2) { }\n" +
					"var other = flart();\noth", "oth");
				return testProposals(results, [
					["other(String)", "other(String) : Number"]
				]);
			});
	
			// the param tag
			it("test param jsdoc1", function() {
				var results = computeContentAssist(
					"/** @param {String} xx1\n@param {Number} xx2 */ var flart = function(xx1,xx2) { xx }", "xx", 81);
				return testProposals(results, [
					["xx1", "xx1 : String"],
					["xx2", "xx2 : Number"]
				]);
			});
	
			//jsdoc test
			it("test param jsdoc2", function() {
				var results = computeContentAssist(
					"/** @param {Number} xx2\n@param {String} xx1\n */ var flart = function(xx1,xx2) { xx }",
					"xx", 82);
				return testProposals(results, [
					["xx1", "xx1 : String"],
					["xx2", "xx2 : Number"]
				]);
			});
	
			//jsdoc test
			it("test param jsdoc3", function() {
				var results = computeContentAssist(
					"/** @param {function(String,Number):Number} xx2\n */ var flart = function(xx1,xx2) { xx }",
					"xx", 86);
				return testProposals(results, [
					["xx2(String, Number)", "xx2(String, Number) : Number"],
					["xx1", "xx1 : {}"]
				]);
			});
	
			//jsdoc test
			it("test param jsdoc4", function() {
				var results = computeContentAssist(
					"/** @param {function(a:String,Number):Number} xx2\n */ var flart = function(xx1,xx2) { xx }",
					"xx", 88);
				return testProposals(results, [
					["xx2(a, Number)", "xx2(a, Number) : Number"],
					["xx1", "xx1 : {}"]
				]);
			});
	
			//jsdoc test
			it("test param jsdoc5", function() {
				var results = computeContentAssist(
					"/** @param {function(a:String,?Number):Number} xx2\n */ var flart = function(xx1,xx2) { xx }",
					"xx", 89);
				return testProposals(results, [
					["xx2(a, arg1)", "xx2(a, arg1) : Number"],
					["xx1", "xx1 : {}"]
				]);
			});
	
			// the return tag
			it("test return jsdoc1", function() {
				var results = computeContentAssist(
					"/** @return {function(a:String,?Number):Number} xx2\n */" +
					"var flart = function(xx1,xx2) { }\nflar",
					"flar");
				// hmmmm... functions returning functions not really showing up
				return testProposals(results, [
					["flart(xx1, xx2)", "flart(xx1, xx2) : function(a:String,?Number):Number"]
				]);
			});
	
			//jsdoc test
			it("test return jsdoc2", function() {
				var results = computeContentAssist(
					"/** @return {function(String):Number} xx2\n */" +
					"var flart = function(xx1,xx2) { }\n" +
					"var other = flart();\noth", "oth");
				return testProposals(results, [
					["other(String)", "other(String) : Number"]
				]);
			});
			//jsdoc test
			it("test object literal fn return jsdoc1", function() {
				var results = computeContentAssist(
					"var foo = {\n" +
					"  /** @return {String} foo */\n" +
					"  fun : function(foo) { }\n" +
					"}\n" +
					"var res = foo.fun();\n" +
					"res", "res");
				return testProposals(results, [
					["res", "res : String"]
				]);
			});
		}
	
		//undefined
		it("test reassignment undef->Obj", function() {
			var results = computeContentAssist(
				"var v = { a : undefined };\n" +
				"v.a = new Object();\n" +
				"v.a", "a");
			return testProposals(results, [
				["a", "a : Object"]
			]);
		});
		it("test reassignment undef->{ }", function() {
			var results = computeContentAssist(
				"var v = { a : undefined };\n" +
				"v.a = { };\n" +
				"v.a", "a");
			return testProposals(results, [
				["a", "a : {}"]
			]);
		});
		it("test reassignment undef->{a}", function() {
			var results = computeContentAssist(
				"var v = { a : undefined };\n" +
				"v.a = { a: 9 };\n" +
				"v.a", "a");
			return testProposals(results, [
				["a", "a : {a:Number}"]
			]);
		});
		it("test reassignment undef->any", function() {
			var results = computeContentAssist(
				"var v = { a : undefined };\n" +
				"v.a = 9;\n" +
				"v.a", "a");
			return testProposals(results, [
				["a", "a : Number"]
			]);
		});
	
		// Obj
		it("test reassignment obj->undefined", function() {
			var results = computeContentAssist(
				"var v = { a : new Object() };\n" +
				"v.a = undefined;\n" +
				"v.a", "a");
			return testProposals(results, [
				["a", "a : Object"]
			]);
		});
		it("test reassignment obj->{ }", function() {
			var results = computeContentAssist(
				"var v = { a : new Object() };\n" +
				"v.a = { };\n" +
				"v.a", "a");
			return testProposals(results, [
				["a", "a : {}"]
			]);
		});
		it("test reassignment obj->{a}", function() {
			var results = computeContentAssist(
				"var v = { a : new Object() };\n" +
				"v.a = { a: 9 };\n" +
				"v.a", "a");
			return testProposals(results, [
				["a", "a : {a:Number}"]
			]);
		});
		it("test reassignment obj->any", function() {
			var results = computeContentAssist(
				"var v = { a : new Object() };\n" +
				"v.a = 9;\n" +
				"v.a", "a");
			return testProposals(results, [
				["a", "a : Number"]
			]);
		});
	
		// { }
		it("test reassignment { }->undefined", function() {
			var results = computeContentAssist(
				"var v = { a : { } };\n" +
				"v.a = undefined;\n" +
				"v.a", "a");
			return testProposals(results, [
				["a", "a : {}"]
			]);
		});
		it("test reassignment { }->obj", function() {
			var results = computeContentAssist(
				"var v = { a : { } };\n" +
				"v.a = new Object();\n" +
				"v.a", "a");
			return testProposals(results, [
				["a", "a : {}"]
			]);
		});
		it("test reassignment { }->{a}", function() {
			var results = computeContentAssist(
				"var v = { a : { } };\n" +
				"v.a = { a: 9 };\n" +
				"v.a", "a");
			return testProposals(results, [
				["a", "a : {a:Number}"]
			]);
		});
		it("test reassignment { }->any", function() {
			var results = computeContentAssist(
				"var v = { a : { } };\n" +
				"v.a = 9;\n" +
				"v.a", "a");
			return testProposals(results, [
				["a", "a : Number"]
			]);
		});
	
		// {a}
		it("test reassignment {a}->undefined", function() {
			var results = computeContentAssist(
				"var v = { a : { a:9 } };\n" +
				"v.a = undefined;\n" +
				"v.a", "a");
			return testProposals(results, [
				["a", "a : {a:Number}"]
			]);
		});
		it("test reassignment {a}->obj", function() {
			var results = computeContentAssist(
				"var v = { a : {a:9 } };\n" +
				"v.a = new Object();\n" +
				"v.a", "a");
			return testProposals(results, [
				["a", "a : {a:Number}"]
			]);
		});
		it("test reassignment {a}->{ }", function() {
			var results = computeContentAssist(
				"var v = { a : {a:9} };\n" +
				"v.a = { };\n" +
				"v.a", "a");
			return testProposals(results, [
				["a", "a : {a:Number}"]
			]);
		});
		it("test reassignment {a}->{a}", function() {
			var results = computeContentAssist(
				"var v = { a : {a:9} };\n" +
				"v.a = {b:9};\n" +
				"v.a", "a");
			return testProposals(results, [
				["a", "a : {b:Number}"]
			]);
		});
		it("test reassignment {a}->any", function() {
			var results = computeContentAssist(
				"var v = { a : {a:9} };\n" +
				"v.a = 9;\n" +
				"v.a", "a");
			return testProposals(results, [
				["a", "a : Number"]
			]);
		});
	
		// any
		it("test reassignment any->undefined", function() {
			var results = computeContentAssist(
				"var v = { a : 9 };\n" +
				"v.a = undefined;\n" +
				"v.a", "a");
			return testProposals(results, [
				["a", "a : Number"]
			]);
		});
		it("test reassignment any->obj", function() {
			var results = computeContentAssist(
				"var v = { a : 9 };\n" +
				"v.a = new Object();\n" +
				"v.a", "a");
			return testProposals(results, [
				["a", "a : Number"]
			]);
		});
		it("test reassignment any->{ }", function() {
			var results = computeContentAssist(
				"var v = { a : 9 };\n" +
				"v.a = { };\n" +
				"v.a", "a");
			return testProposals(results, [
				["a", "a : Number"]
			]);
		});
		it("test reassignment any->{a}", function() {
			var results = computeContentAssist(
				"var v = { a : {a:9} };\n" +
				"v.a = { a: 9};\n" +
				"v.a", "a");
			return testProposals(results, [
				["a", "a : {a:Number}"]
			]);
		});
		it("test reassignment any->any", function() {
			var results = computeContentAssist(
				"var v = { a : {a:9} };\n" +
				"v.a = '';\n" +
				"v.a", "a");
			return testProposals(results, [
				["a", "a : String"]
			]);
		});
	
		///////////////////////////////////////////////////
		// testing default jslint options
		///////////////////////////////////////////////////
		var jsOptionsBrowser = {"options": { "browser": true }};
		var jsOptionsNoBrowser = {"options": { "browser": false }};
		var jsOptions1Global = {"global": [ "aaa" ]};
		var jsOptions2Globals = {"global": [ "aaa", "aab"]};
		var jsOptionsAndGlobals = {"global": [ "aaa", "aab"], "options": { "browser": true }};
	
		it("test browser:true in options", function() {
			var results = computeContentAssist(
				"wind", "wind", null, jsOptionsBrowser);
			return testProposals(results, [
				["window", "window : Global"]
			]);
		});
	
		it("test browser:false in options", function() {
			var results = computeContentAssist(
				"wind", "wind", null, jsOptionsNoBrowser);
			return testProposals(results, [
			]);
		});
	
		it("test browser:true in options overriden by browser:false in text", function() {
			var results = computeContentAssist(
				"/*jslint browser:false */\nwind", "wind", null, jsOptionsBrowser);
			return testProposals(results, [
			]);
		});
	
		it("test browser:false in options overriden by browser:true in text", function() {
			var results = computeContentAssist(
				"/*jslint browser:true */\nwind", "wind", null, jsOptionsNoBrowser);
			return testProposals(results, [
				["window", "window : Global"]
			]);
		});
	
		it("test 1 global in options", function() {
			var results = computeContentAssist(
				"aa", "aa", null, jsOptions1Global);
			return testProposals(results, [
				["aaa", "aaa : {}"]
			]);
		});
	
		it("test 2 globals in options", function() {
			var results = computeContentAssist(
				"aa", "aa", null, jsOptions2Globals);
			return testProposals(results, [
				["aaa", "aaa : {}"],
				["aab", "aab : {}"]
			]);
		});
	
		it("test 2 globals in options and in text", function() {
			var results = computeContentAssist(
				"/*global aac */\naa", "aa", null, jsOptions2Globals);
			return testProposals(results, [
				["aaa", "aaa : {}"],
				["aab", "aab : {}"],
				["aac", "aac : {}"]
			]);
		});
	
		it("test globals and browser1", function() {
			var results = computeContentAssist(
				"aa", "aa", null, jsOptionsAndGlobals);
			return testProposals(results, [
				["aaa", "aaa : {}"],
				["aab", "aab : {}"]
			]);
		});
	
		it("test globals and browser2", function() {
			var results = computeContentAssist(
				"wind", "wind", null, jsOptionsAndGlobals);
			return testProposals(results, [
				["window", "window : Global"]
			]);
		});
	
		// SCRIPTED-170
		it("test obj literal with underscore2", function() {
			var results = computeContentAssist(
				"function hasOwnProperty() { }\n" +
				"({}).hasOwnProperty();");
			return testProposals(results, [
				["Array([val])", "Array([val]) : Array"],
				["Boolean([val])", "Boolean([val]) : Boolean"],
				["Date([val])", "Date([val]) : Date"],
				["decodeURI(uri)", "decodeURI(uri) : String"],
				["decodeURIComponent(encodedURIString)", "decodeURIComponent(encodedURIString) : String"],
				["encodeURI(uri)", "encodeURI(uri) : String"],
				["encodeURIComponent(decodedURIString)", "encodeURIComponent(decodedURIString) : String"],
				["Error([err])", "Error([err]) : Error"],
				["eval(toEval)", "eval(toEval) : Object"],
				["Function()", "Function() : Function"],
				["isFinite(num)", "isFinite(num) : Boolean"],
				["isNaN(num)", "isNaN(num) : Boolean"],
				["Number([val])", "Number([val]) : Number"],
				["Object([val])", "Object([val]) : Object"],
				["parseFloat(str, [radix])", "parseFloat(str, [radix]) : Number"],
				["parseInt(str, [radix])", "parseInt(str, [radix]) : Number"],
				["RegExp([val])", "RegExp([val]) : RegExp"],
				["String([val])", "String([val]) : String"],
				["Infinity", "Infinity : Number"],
				["JSON", "JSON : JSON"],
				["Math", "Math : Math"],
				["NaN", "NaN : Number"],
				["this", "this : Global"],
				["undefined", "undefined : undefined"],
				["", "---------------------------------"],
				["hasOwnProperty(property)", "hasOwnProperty(property) : Boolean"],
				["isPrototypeOf(object)", "isPrototypeOf(object) : Boolean"],
				["propertyIsEnumerable(property)", "propertyIsEnumerable(property) : Boolean"],
				["toLocaleString()", "toLocaleString() : String"],
				["toString()", "toString() : String"],
				["valueOf()", "valueOf() : Object"]
			]);
		});
	
		// computed member expressions
		it("test computed member expressions1", function() {
			var results = computeContentAssist(
				"var foo = { at: { bar: 0} };\n" +
				"foo['at'].b", "b");
			return testProposals(results, [
				["bar", "bar : Number"]
			]);
		});
	
		it("test computed member expressions2", function() {
			var results = computeContentAssist(
				"var foo = { at: { bar: 0} };\n" +
				"foo[at].b", "b");
			return testProposals(results, [
			]);
		});
	
		it("test computed member expressions3", function() {
			var results = computeContentAssist(
				"var foo = { at: { bar: 0} };\n" +
				"foo[9].at.bar.toF", "toF");
			return testProposals(results, [
			]);
		});
	
		it("test computed member expressions4", function() {
			var results = computeContentAssist(
				"var foo = { at: { bar: 0} };\n" +
				"foo['at'].bar.toF", "toF");
			return testProposals(results, [
				["toFixed(digits)", "toFixed(digits) : String"]
			]);
		});
	
		it("test computed member expressions5", function() {
			var results = computeContentAssist(
				"var foo = { at: { bar: 0} };\n" +
				"foo[at.foo.bar].");
			return testProposals(results, [
				["hasOwnProperty(property)", "hasOwnProperty(property) : Boolean"],
				["isPrototypeOf(object)", "isPrototypeOf(object) : Boolean"],
				["propertyIsEnumerable(property)", "propertyIsEnumerable(property) : Boolean"],
				["toLocaleString()", "toLocaleString() : String"],
				["toString()", "toString() : String"],
				["valueOf()", "valueOf() : Object"]
			]);
		});
	
		it("test computed member expressions6", function() {
			var results = computeContentAssist(
				"var x = 0;\n var foo = [];\n foo[x.]", "", 33);
			return testProposals(results, [
				["toExponential(digits)", "toExponential(digits) : String"],
				["toFixed(digits)", "toFixed(digits) : String"],
				["toPrecision(digits)", "toPrecision(digits) : String"],
				["", "---------------------------------"],
				["hasOwnProperty(property)", "hasOwnProperty(property) : Boolean"],
				["isPrototypeOf(object)", "isPrototypeOf(object) : Boolean"],
				["propertyIsEnumerable(property)", "propertyIsEnumerable(property) : Boolean"],
				["toLocaleString()", "toLocaleString() : String"],
				["toString()", "toString() : String"],
				["valueOf()", "valueOf() : Object"]
			]);
		});
	
		// Issue 221 problems with navigating to proto definitions inside of constructors
		it('test proto ref in this1', function() {
			var results = computeContentAssist(
				"function TextView () {\n this._init;\n }\n TextView.prototype = {\n _init: function() { }\n };", "_init", 34);
			return testProposals(results, [
				["_init()", "_init() : TextView.prototype._init"]
			]);
		});
		it('test proto ref in this2 - ', function() {
			var results = computeContentAssist(
				"function TextView () {\n this._init;\n }\n TextView.prototype._init = function() { };", "_init", 34);
			return testProposals(results, [
				["_init()", "_init() : TextView.prototype._init"]
			]);
		});
		it('test proto ref in this3 - ', function() {
			var results = computeContentAssist(
				"function TextView () { }\n" +
				"TextView.prototype._init = function() { };\n" +
				"new TextView()._init", "_init");
			return testProposals(results, [
				["_init()", "_init() : TextView.prototype._init"]
			]);
		});
	
		// tests for richer function types
		it('test function with property', function() {
			var results = computeContentAssist(
				"function f() { }\n" +
				"f.xxxx = 3;\n" +
				"f.x", "x");
			return testProposals(results, [
				["xxxx", "xxxx : Number"]
			]);
		});
		it("test lowercase constructor 1", function() {
			var results = computeContentAssist(
			"function fun() {\n	this.xxx = 9;\n	this.uuu = this.x;}", "x", 50);
			return testProposals(results, [
				["xxx", "xxx : Number"]
			]);
		});
		it("test lowercase constructor 2", function() {
			var results = computeContentAssist(
			"function fun() {	this.xxx = 9;	this.uuu = this.xxx; }\n" +
			"var y = new fun();\n" +
			"y.x", "x");
			return testProposals(results, [
				["xxx", "xxx : Number"]
			]);
		});
		it("test lowercase constructor prototype", function() {
			var results = computeContentAssist(
				"var aaa = function() { };\naaa.prototype = { foo : 9 };\nnew aaa().f", "f");
			return testProposals(results, [
				["foo", "foo : Number"]
			]);
		});
		it("test object literal usage-based inference", function() {
			var results = computeContentAssist(
				"var p = { xxxx: function() { }, yyyy: function() { this.x; } };", "x", 57);
			return testProposals(results, [
				["xxxx()", "xxxx() : undefined"]
			]);
		});
		it("test object literal usage-based inference 2", function() {
			var results = computeContentAssist(
				"var p = { xxxx: function() { this.yyyy = 3; }, yyyy: function() {} };\n" +
				"var q = new p.xxxx();\n" +
				"q.y", "y");
			return testProposals(results, [
				["yyyy", "yyyy : Number"]
			]);
		});
	
		it("test object literal usage-based inference 3", function() {
			var results = computeContentAssist(
				"var p = { f1: function(a) { this.cccc = a; }, f2: function(b) { this.dddd = b; }, f3: function() { var y = this.ccc } };", "ccc", 115);
			return testProposals(results, [
				["cccc", "cccc : {}"]
			]);
		});
	
		it("test object literal usage-based inference 4", function() {
			var results = computeContentAssist(
				"var p = { o1: { cccc: 3 }, f1: function() { this.o1.ffff = 4; }, f2: function() { var y = this.o1.ccc } };", "ccc", 101);
			return testProposals(results, [
				["cccc", "cccc : Number"]
			]);
		});
	
		it("test object literal usage-based inference 5", function() {
			var results = computeContentAssist(
				"var p = { o1: { cccc: 3 }, f1: function() { this.o1.ffff = 4; }, f2: function() { var y = this.o1.fff } };", "fff", 101);
			return testProposals(results, [
				["ffff", "ffff : Number"]
			]);
		});
	  
		/**
		 * Test that keyword suggestions are not made when looking for a member function or property.
		 * @since 5.0
		 */
		it('testKeywordCompletionInVariableMember', function() {
			var result = computeContentAssist("var x; x.to", 
												'to',
												11,
												{},
												{},
												{keyword:true, template:true});
			return testProposals(result, [
					["toLocaleString()", "toLocaleString() : String"],
					["toString()", "toString() : String"]
			]);
		});
	
		/**
		 * Test completion of control structure templates in the body of a function.
		 * @since 5.0
		 */
		it('testTemplateInFunctionBody', function() {
			var result = computeContentAssist("function x(a) {\n ", 
												' ',
												18,
												{},
												{},
												{keyword:true, template:true});
			assertNoProposal("toString", result);
			assertProposal("for", result);
			assertProposal("while", result);
			assertProposalMatching(["while", "(condition)"], ["do"], result); // while (condition) with no 'do'
			assertProposal("switch", result);
			assertProposalMatching(["switch", "case"], [], result); // switch..case
			assertProposal("try", result);
			assertProposal("if", result);
			assertProposalMatching(["if", "(condition)"], [], result); // if (condition)
			assertProposal("do", result);
			assertProposalMatching(["do", "while"], [], result); // do..while
		});
	
		/**
		 * Test completion of control structure templates in the body of a function.
		 */
		it('testKeywordsInFunctionBodyWithPrefix', function() {
			var result = computeContentAssist("function x(a) {\n t", 
												't',
												19,
												{},
												{},
												{keyword:true, template:true});
			assertNoProposal("toString".substr(1), result);
			assertProposal("this".substr(1), result);
			assertProposal("throw".substr(1), result);
			assertProposal("try".substr(1), result);
			assertProposal("typeof".substr(1), result);
			assertProposalMatching(["try {".substr(1), "catch ("], ["finally"], result); // try..catch with no finally
			assertProposalMatching(["try {".substr(1), "catch (", "finally"], [], result); // try..catch..finally
		});
	
		/**
		 * Test completion of control structure templates in the body of a function.
		 */
		it('testTemplateInFunctionBodyWithPrefix', function() {
			var result = computeContentAssist("function x(a) {\n f",
												'f',
												19,
												{},
												{},
												{keyword:true, template:true});
			assertNoProposal("toString", result);
			assertProposal("for".substr(1), result);
			assertProposalMatching(["for".substr(1), "in"], [], result);
			assertProposalMatching(["for".substr(1), "array"], [], result);
			assertNoProposal("while", result);
			assertNoProposal("switch", result);
			assertNoProposal("try", result);
			assertNoProposal("if", result);
			assertNoProposal("do", result);
		});
	
		/**
		 * Test completion after non-whitespace chars and there should be no template content assist
		 */
		it('testTemplateAfterNonWhitespace1', function() {
			var result = computeContentAssist("x.", 
												'.',
												2,
												{},
												{},
												{keyword:true, template:true});
			assertNoProposal("toString", result);
			assertNoProposal("for".substr(1), result);
			assertNoProposal("while", result);
			assertNoProposal("switch", result);
			assertNoProposal("try", result);
			assertNoProposal("if", result);
			assertNoProposal("do", result);
		});
	
		/**
		 * Test completion after non-whitespace chars and there should be no template content assist
		 */
		it('testTemplateAfterNonWhitespace2', function() {
			var result = computeContentAssist("x.  ",
												' ',
												2,
												{},
												{},
												{keyword:true, template:true});
			assertNoProposal("toString", result);
			assertProposal("for".substr(1), result);
			assertProposal("while", result);
			assertProposal("switch", result);
			assertProposal("try", result);
			assertProposal("if", result);
			assertProposal("do", result);
		});
	
		/**
		 * Test completion after non-whitespace chars and there should be no template content assist
		 */
		it('testTemplateAfterNonWhitespace3', function() {
			var result = computeContentAssist("$  ",
												' ',
												1,
												{},
												{},
												{keyword:true, template:true});
			assertNoProposal("toString", result);
			assertProposal("for".substr(1), result);
			assertProposal("while", result);
			assertProposal("switch", result);
			assertProposal("try", result);
			assertProposal("if", result);
			assertProposal("do", result);
		});
	
		/**
		 * Test completion after non-whitespace chars.  should be templates because 
		 * there is a newline
		 */
		it('testTemplateAfterNonWhitespace4', function() {
			var result = computeContentAssist("x.\n  ",
												' ',
												5,
												{},
												{},
												{keyword:true, template:true});
			assertNoProposal("toString", result);
			assertProposal("for", result);
			assertProposal("while", result);
			assertProposal("switch", result);
			assertProposal("try", result);
			assertProposal("if", result);
			assertProposal("do", result);
		});
	
	      
		/**
		 * Test cyclic types
		 */
		it("test cycle 1", function() {
			var results = computeContentAssist(
				"var f1 = function f1() {};\n" +
				"var f2 = function f2() {};\n" +
				"var new_f1 = new f1();\n" +
				"f1.prototype = new_f1;\n" +
				"f2.prototype = new_f1;\n" +
				"var x = new f1();\n" +
				"x.f.g", "g");
			return testProposals(results, []);
		});
	
		/**
		 * Test cyclic types
		 */
		it("test cycle 2", function() {
			var results = computeContentAssist(
				"function foo() {\n" +
				"this._init = function() { return this; }\n" +
				"this.cmd = function() {\n" +
				"this._in", "_in");
			return testProposals(results, [
				["_init()", "_init() : _init"]
			]);
	     });
	
		/**
		 * Test cyclic types
		 */
	    it("test cycle 3 ", function() {
			var results = computeContentAssist(
				"var f2 = function () {};\n" +
				"var new_f2 = new f2();\n" +
				"f2.prototype = new_f2;\n" +
				"var c = new f2();\n" +
				"c.fff", "fff");
			return testProposals(results, []);
		});
	
		it("test one-shot closure 1", function() {
		    var results = computeContentAssist("var x = {ffff : 3 }; (function (p) { p.fff })(x);", "fff", 42);
		    return testProposals(results, [
		       ["ffff", "ffff : Number"]
		    ]);
	     });
	
		it("test one-shot closure 2", function() {
		    var results = computeContentAssist("(function() { var x = { y: { zzz: 3 }, f: function() { var s = this.y.zz } };}());", "zz", 72);
		    return testProposals(results, [
		       ["zzz", "zzz : Number"]
		    ]);
		});
	  
		/**
		 * Tests that an empty snippet with no prefix returns templates
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=439741
		 */
		it("test empty template prefix 1", function() {
			var results = computeContentAssist("", "", 0);
			assertProposal('amqp', results);
			assertProposal('with', results);
		});
		/**
		 * Tests that a snippet with no prefix returns templates
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=439741
		 */
		it("test empty template prefix 2", function() {
			var results = computeContentAssist("var foo = 10;\n ", "", 15);
			assertProposal('amqp', results);
			assertProposal('with', results);
		});
		
	});
});
