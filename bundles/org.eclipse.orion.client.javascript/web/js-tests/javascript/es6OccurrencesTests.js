/*******************************************************************************
 * @license
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env amd, mocha*/
/* eslint-disable missing-nls */
define([
	'chai/chai',
	'orion/Deferred',
	'javascript/occurrences',
	'mocha/mocha'  //must stay at the end, not a module
], function(chai, Deferred, Occurrences) {
	var assert = chai.assert;

	return /* @callback */ function(worker) {
		var occurrences;
		var jsFile = 'tern_occurrences_test_script.js';
		var htmlFile = 'tern_occurrences_test_script.html';
		var timeoutReturn = ['Occurrences timed out'];
		var jsProject = {
			getEcmaLevel: function getEcmaLevel() {
				// Defaults to ES5
			}
		};
			
		/**
		 * @description Sets up the test
		 * @param {Object} options The options the set up with
		 * @returns {Object} The object with the initialized values
		 */
		function setup(options) {
			var state = Object.create(null);
			var buffer = state.buffer = typeof options.buffer === 'undefined' ? '' : options.buffer;
			
			var contentType = options.contentType ? options.contentType : 'application/javascript';
			var	file = state.file = jsFile;				
			if (contentType === 'text/html'){
				// Tern plug-ins don't have the content type, only the name of the file
				file = state.file = htmlFile;
			}
			var ecma = options.ecma ? options.ecma : 5;
			jsProject.getEcmaLevel = function() {
				return new Deferred().resolve(ecma);
			};
			assert(options.callback, 'You must provide a test callback for worker-based tests');
			state.callback = options.callback;
			worker.setTestState(state);
			
			// Delete any test files created by previous tests
			worker.postMessage({request: 'delFile', args:{file: jsFile}});
			worker.postMessage({request: 'delFile', args:{file: htmlFile}});
			
			var editorContext = {
				/*override*/
				getText: function() {
					return new Deferred().resolve(buffer);
				},
				/** @callback */
				getFileMetadata: function() {
				    var o = Object.create(null);
				    o.contentType = Object.create(null);
				    o.contentType.id = contentType;
				    o.location = file;
				    return new Deferred().resolve(o);
			    }
			};
			var params = {selection:options.selection, timeout: options.timeout ? options.timeout : 20000, timeoutReturn: timeoutReturn};
			return {
				editorContext: editorContext,
				params: params
			};
		}
		
		/**
		 * @description Checks the proposals returned from the given proposal promise against
		 * the array of given proposals
		 * @param {Object} options The options to test with
		 * @param {Array} expectedProposals The array of expected proposal objects
		 */
		function computeOccurrences(text, options, expected) {
			options.buffer = text;
			var _p = setup(options);
			assert(_p, 'setup() should have completed normally');
			occurrences.computeOccurrences(_p.editorContext, _p.params).then(function (actual) {
				try {
					assert(actual, "Error occurred, returned occurrences was undefined");
					if (actual === timeoutReturn){
						assert(false, "The occurrences operation timed out");
					}
					
					assert.equal(actual.length, expected.length, "The wrong number of occurrences was returned. Expected: " + listOccurrences(expected) + " Returned: " + listOccurrences(actual));
					for(var i = 0; i < expected.length; i++) {
						//for each expected result try to find it in the results, and remove it if it is found
						for(var j = 0; j < actual.length; j++) {
							if(!actual[j]) {
								continue;
							}
							if((expected[i].start === actual[j].start) && (expected[i].end === actual[j].end)) {
								actual[j] = null;
							}
						}
					}
					for(var k = 0; k < actual.length; k++) {
						if(actual[k]) {
							assert.ok(false, "Found an unknown occurrence: [start "+actual[k].start+"][end "+actual[k].end+"]. Expected: " + listOccurrences(expected) + " Returned: " + listOccurrences(actual));
						}
					}
					worker.getTestState().callback();
				} catch(err) {
					worker.getTestState().callback(err);
				}
			}, function (error) {
				worker.getTestState().callback(error);
			});
		}
		
		/**
		 * @name getResultsOccurrences
		 * @description Returns a string listing the found occurrences
		 * @param results the array results to create the string from
		 * @returns returns string with list of results
		 */
		function listOccurrences(occurrences){
			var foundOccurrences = '';
			for (var i=0; i<occurrences.length; i++) {
				if (occurrences[i]){
					foundOccurrences += occurrences[i].start + '-' + occurrences[i].end;
					if (i < occurrences.length-1){
						foundOccurrences += ', ';
					}
				}
			}
			return foundOccurrences;
		}
			
		/**
		 * @name setContext
		 * @description Delegate helper to create options object
		 * @function
		 * @public
		 * @param {Function} callback The function to call when done
		 * @param {Number} start The start of the editor selection
		 * @param {Number} end The end of thhe editor selection
		 * @param {String} contentType Optional content type descriptor
		 * @returns {Object} options object
		 */
		function getOptions(callback, start, end, contentType) {
			return {callback: callback, selection: {start: start, end: end}, contentType: contentType};
		}
		
		describe('ES6 Occurrences Tests', function() {
			this.timeout(20000);
			before('Message the server for warm up', function(done) {
				occurrences = new Occurrences.JavaScriptOccurrences(worker);
				worker.start(done,  {options:{ecmaVersion:6, sourceType:"module"}});
			});
			
			describe('Arrow Function', function(){
				/**
				 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=471011
				 * @since 10.0
				 */
				it('arrow function expression 1', function(done) {
					var text = "n => {n.length;}";
					return computeOccurrences(text, getOptions(done, 0,1), [{start:0, end:1}, {start:6, end:7}]);
				});
				/**
				 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=471011
				 * @since 10.0
				 */
				it('arrow function expression 2', function(done) {
					var text = "var n = 10; n => {n.length;}";
					return computeOccurrences(text, getOptions(done, 12,13), [{start:12, end:13}, {start:18, end:19}]);
				});
				/**
				 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=471011
				 * @since 10.0
				 */
				it('arrow function expression 3', function(done) {
					var text = "n => f => {n.length;}";
					return computeOccurrences(text, getOptions(done, 11,12), [{start:0, end:1}, {start:11, end:12}]);
				});
				/**
				 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=471011
				 * @since 10.0
				 */
				it('arrow function expression 4', function(done) {
					var text = "var n = 'hello'; n => f => {n.length;}";
					return computeOccurrences(text, getOptions(done, 17,18), [{start:17, end:18}, {start:28, end:29}]);
				});
				/**
				 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=471011
				 * @since 10.0
				 */
				it('arrow function expression 5', function(done) {
					var text = "var n = []; n.map(n => {n.length;});";
					return computeOccurrences(text, getOptions(done, 18,18), [{start:18, end:19}, {start:24, end:25}]);
				});
				/**
				 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=471011
				 * @since 10.0
				 */
				it('arrow function expression 6', function(done) {
					var text = "var n = []; n.map(n => {n.length;});";
					return computeOccurrences(text, getOptions(done, 12, 12), [{start:4, end:5}, {start:12, end:13}]);
				});
				/**
				 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=471011
				 * @since 10.0
				 */
				it('arrow function expression 7', function(done) {
					var text = "var n = []; n.map(n => n => {n.length;});";
					return computeOccurrences(text, getOptions(done, 12, 12), [{start:4, end:5}, {start:12, end:13}]);
				});
				/**
				 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=471011
				 * @since 10.0
				 */
				it('arrow function expression 8', function(done) {
					var text = "var n = []; n.map(n => n => {n.length;});";
					return computeOccurrences(text, getOptions(done, 24, 24), [{start:23, end:24}, {start:29, end:30}]);
				});
			});
			describe('Import / Export declaration', function(){
				it('Named import declaration 1', function(done) {
					worker.createTestFile("a", "");
					var text = "import * as myModule from \"a\"; myModule.doStuff();";
					return computeOccurrences(text, getOptions(done, 17, 17), [{start:12, end:20}, {start:31, end:39}]);
				});
				it('Named import declaration 2', function(done) {
					worker.createTestFile("a", "");
					var text = "import * as myModule from \"a\"; myModule.doStuff();";
					return computeOccurrences(text, getOptions(done, 33, 36), [{start:12, end:20}, {start:31, end:39}]);
				});
				it('Default import declaration 1', function(done) {
					worker.createTestFile("a", "");
					var text = "import myDefMod from \"a\"; myDefMod.doStuff();";
					return computeOccurrences(text, getOptions(done, 12, 12), [{start:7, end:15}, {start:26, end:34}]);
				});
				it('Default import declaration 2', function(done) {
					worker.createTestFile("a", "");
					var text = "import myDefMod from \"a\"; myDefMod.doStuff();";
					return computeOccurrences(text, getOptions(done, 30, 34), [{start:7, end:15}, {start:26, end:34}]);
				});
				it('Multiple named import declaration 1', function(done) {
					worker.createTestFile("a", "");
					var text = "import { myFunc, myVar } from \"a\"; myFunc(); var z = myVar;";
					return computeOccurrences(text, getOptions(done, 9, 15), [{start:9, end:15}, {start:35, end:41}]);
				});
				it('Multiple named import declaration 2', function(done) {
					worker.createTestFile("a", "");
					var text = "import { myFunc, myVar } from \"a\"; myFunc(); var z = myVar;";
					return computeOccurrences(text, getOptions(done, 36, 36), [{start:9, end:15}, {start:35, end:41}]);
				});
				it('Multiple named import declaration 3', function(done) {
					worker.createTestFile("a", "");
					var text = "import { myFunc, myVar } from \"a\"; myFunc(); var z = myVar;";
					return computeOccurrences(text, getOptions(done, 17, 19), [{start:17, end:22}, {start:53, end:58}]);
				});
				it('Multiple named import declaration 4', function(done) {
					worker.createTestFile("a", "");
					var text = "import { myFunc, myVar } from \"a\"; myFunc(); var z = myVar;";
					return computeOccurrences(text, getOptions(done, 54, 55), [{start:17, end:22}, {start:53, end:58}]);
				});
				it('Renamed multiple import declaration 1', function(done) {
					worker.createTestFile("a", "");
					var text = "import { myFunc as ONE, myVar as TWO } from \"a\"; ONE(); var z = TWO; myFunc(); var z = myVar;";
					return computeOccurrences(text, getOptions(done, 19, 21), [{start:19, end:22}, {start:49, end:52}]);
				});
				it('Renamed multiple import declaration 2', function(done) {
					worker.createTestFile("a", "");
					var text = "import { myFunc as ONE, myVar as TWO } from \"a\"; ONE(); var z = TWO; myFunc(); var z = myVar;";
					return computeOccurrences(text, getOptions(done, 19, 21), [{start:19, end:22}, {start:49, end:52}]);
				});
				it('Renamed multiple import declaration 3', function(done) {
					worker.createTestFile("a", "");
					var text = "import { myFunc as ONE, myVar as TWO } from \"a\"; ONE(); var z = TWO; myFunc(); var z = myVar;";
					return computeOccurrences(text, getOptions(done, 33, 34), [{start:33, end:36}, {start:64, end:67}]);
				});
				it('Renamed multiple import declaration 4', function(done) {
					worker.createTestFile("a", "");
					var text = "import { myFunc as ONE, myVar as TWO } from \"a\"; ONE(); var z = TWO; myFunc(); var z = myVar;";
					return computeOccurrences(text, getOptions(done, 65, 65), [{start:33, end:36}, {start:64, end:67}]);
				});
				it('Renamed multiple import declaration 5', function(done) {
					worker.createTestFile("a", "");
					var text = "import { myFunc as ONE, myVar as TWO } from \"a\"; ONE(); var z = TWO; myFunc(); var z = myVar;";
					return computeOccurrences(text, getOptions(done, 9, 15), []);
				});
				it('Renamed multiple import declaration 6', function(done) {
					worker.createTestFile("a", "");
					var text = "import { myFunc as ONE, myVar as TWO } from \"a\"; ONE(); var z = TWO; myFunc(); var z = myVar;";
					return computeOccurrences(text, getOptions(done, 72, 72), [{start:69, end:75}]);
				});
				it('Renamed multiple import declaration 7', function(done) {
					worker.createTestFile("a", "");
					var text = "import { myFunc as ONE, myVar as TWO } from \"a\"; ONE(); var z = TWO; myFunc(); var z = myVar;";
					return computeOccurrences(text, getOptions(done, 24, 26), []);
				});
				it('Renamed multiple import declaration 8', function(done) {
					worker.createTestFile("a", "");
					var text = "import { myFunc as ONE, myVar as TWO } from \"a\"; ONE(); var z = TWO; myFunc(); var z = myVar;";
					return computeOccurrences(text, getOptions(done, 90, 90), [{start:87, end:92}]);
				});
				it('Hoisted named import declaration 1', function(done) {
					worker.createTestFile("a", "");
					var text = "localFunc(); import { myFunc } from 'a'; function localFunc(){ myFunc() };";
					return computeOccurrences(text, getOptions(done, 26, 26), [{start:22, end:28}, {start:63, end:69}]);
				});
				it('Hoisted named import declaration 2', function(done) {
					worker.createTestFile("a", "");
					var text = "localFunc(); import { myFunc } from 'a'; function localFunc(){ myFunc() };";
					return computeOccurrences(text, getOptions(done, 65, 65), [{start:22, end:28}, {start:63, end:69}]);
				});
				it('Named export 1', function(done) {
					var text = "var a = 3; export { a }; a++;";
					return computeOccurrences(text, getOptions(done, 4, 4), [{start:4, end:5}, {start:20, end:21}, {start:25, end:26}]);
				});
				it('Named export 2', function(done) {
					var text = "var a = 3; export { a }; a++;";
					return computeOccurrences(text, getOptions(done, 20, 21), [{start:4, end:5}, {start:20, end:21}, {start:25, end:26}]);
				});
				it('Named export 3', function(done) {
					var text = "var a = 3; export { a }; a++;";
					return computeOccurrences(text, getOptions(done, 25, 25), [{start:4, end:5}, {start:20, end:21}, {start:25, end:26}]);
				});
				it('Multiple named export 1', function(done) {
					var text = "var a = 3; const b = '3'; export { a, b };";
					return computeOccurrences(text, getOptions(done, 4, 4), [{start:4, end:5}, {start:35, end:36}]);
				});
				it('Multiple named export 2', function(done) {
					var text = "var a = 3; const b = '3'; export { a, b };";
					return computeOccurrences(text, getOptions(done, 35, 36), [{start:4, end:5}, {start:35, end:36}]);
				});
				it('Multiple named export 3', function(done) {
					var text = "var a = 3; const b = '3'; export { a, b };";
					return computeOccurrences(text, getOptions(done, 17, 18), [{start:17, end:18}, {start:38, end:39}]);
				});
				it('Multiple named export 4', function(done) {
					var text = "var a = 3; const b = '3'; export { a, b };";
					return computeOccurrences(text, getOptions(done, 39, 39), [{start:17, end:18}, {start:38, end:39}]);
				});
				it('Inline expression export 1', function(done) {
					var text = "a++; export let a = 4; a++;";
					return computeOccurrences(text, getOptions(done, 0, 0), [{start:0, end:1}, {start:16, end:17}, {start:23, end:24}]);
				});
				it('Inline expression export 2', function(done) {
					var text = "a++; export let a = 4; a++;";
					return computeOccurrences(text, getOptions(done, 16, 16), [{start:0, end:1}, {start:16, end:17}, {start:23, end:24}]);
				});
				it('Inline expression export 3', function(done) {
					var text = "a++; export let a = 4; a++;";
					return computeOccurrences(text, getOptions(done, 23, 23), [{start:0, end:1}, {start:16, end:17}, {start:23, end:24}]);
				});
				it('Inline expression export 1', function(done) {
					var text = "a++; export let a = 4; a++;";
					return computeOccurrences(text, getOptions(done, 0, 0), [{start:0, end:1}, {start:16, end:17}, {start:23, end:24}]);
				});
				it('Renamed export 1', function(done) {
					var text = "var a = 3; export { a as b }; a++; b++;";
					return computeOccurrences(text, getOptions(done, 4, 4), [{start:4, end:5}, {start:20, end:21}, {start:30, end:31}]);
				});
				it('Renamed export 2', function(done) {
					var text = "var a = 3; export { a as b }; a++; b++;";
					return computeOccurrences(text, getOptions(done, 21, 21), [{start:4, end:5}, {start:20, end:21}, {start:30, end:31}]);
				});
				it('Renamed export 3', function(done) {
					var text = "var a = 3; export { a as b }; a++; b++;";
					return computeOccurrences(text, getOptions(done, 30, 31), [{start:4, end:5}, {start:20, end:21}, {start:30, end:31}]);
				});
				it('Renamed export 4', function(done) {
					var text = "var a = 3; export { a as b }; a++; b++;";
					return computeOccurrences(text, getOptions(done, 25, 26), []);
				});
				it('Renamed export 5', function(done) {
					var text = "var a = 3; export { a as b }; a++; b++;";
					return computeOccurrences(text, getOptions(done, 35, 36), [{start:35, end:36}]);
				});
				it('Named function export 1', function(done) {
					var text = "export function a(){}; a();";
					return computeOccurrences(text, getOptions(done, 16, 17), [{start:16, end:17}, {start:23, end:24}]);
				});
				it('Named function export 2', function(done) {
					var text = "export function a(){}; a();";
					return computeOccurrences(text, getOptions(done, 23, 24), [{start:16, end:17}, {start:23, end:24}]);
				});
				it('Default expression export 1', function(done) {
					var text = "var a = 3; export default a; a++;";
					return computeOccurrences(text, getOptions(done, 4, 4), [{start:4, end:5}, {start:26, end:27}, {start:29, end:30}]);
				});
				it('Default expression export 2', function(done) {
					var text = "var a = 3; export default a; a++;";
					return computeOccurrences(text, getOptions(done, 26, 26), [{start:4, end:5}, {start:26, end:27}, {start:29, end:30}]);
				});
				it('Default expression export 3', function(done) {
					var text = "var a = 3; export default a; a++;";
					return computeOccurrences(text, getOptions(done, 29, 30), [{start:4, end:5}, {start:26, end:27}, {start:29, end:30}]);
				});
				it('Default named function export 1', function(done) {
					var text = "export default function a(){}; a();";
					return computeOccurrences(text, getOptions(done, 24, 24), [{start:24, end:25}, {start:31, end:32}]);
				});
				it('Default named function export 2', function(done) {
					var text = "export default function a(){}; a();";
					return computeOccurrences(text, getOptions(done, 32, 32), [{start:24, end:25}, {start:31, end:32}]);
				});
				it('From export 1', function(done) {
					worker.createTestFile("a", "");
					var text = "export { a, b } from 'a'; a++; b++;";
					return computeOccurrences(text, getOptions(done, 9, 9), [{start:9, end:10}, {start:26, end:27}]);
				});
				it('From export 2', function(done) {
					worker.createTestFile("a", "");
					var text = "export { a, b } from 'a'; a++; b++;";
					return computeOccurrences(text, getOptions(done, 26, 27), [{start:9, end:10}, {start:26, end:27}]);
				});
				it('From export 3', function(done) {
					worker.createTestFile("a", "");
					var text = "export { a, b } from 'a'; a++; b++;";
					return computeOccurrences(text, getOptions(done, 12, 12), [{start:12, end:13}, {start:31, end:32}]);
				});
				it('From export 4', function(done) {
					worker.createTestFile("a", "");
					var text = "export { a, b } from 'a'; a++; b++;";
					return computeOccurrences(text, getOptions(done, 32, 32), [{start:12, end:13}, {start:31, end:32}]);
				});
				it('Named from export 1', function(done) {
					worker.createTestFile("a", "");
					var text = "export { a as b } from 'a'; a++; b++;";
					return computeOccurrences(text, getOptions(done, 9, 9), [{start:9, end:10}, {start:28, end:29}]);
				});
				it('Named from export 2', function(done) {
					worker.createTestFile("a", "");
					var text = "export { a as b } from 'a'; a++; b++;";
					return computeOccurrences(text, getOptions(done, 28, 28), [{start:9, end:10}, {start:28, end:29}]);
				});
				it('Named from export 3', function(done) {
					worker.createTestFile("a", "");
					var text = "export { a as b } from 'a'; a++; b++;";
					return computeOccurrences(text, getOptions(done, 14, 14), []);
				});
				it('Named from export 4', function(done) {
					worker.createTestFile("a", "");
					var text = "export { a as b } from 'a'; a++; b++;";
					return computeOccurrences(text, getOptions(done, 33, 33), [{start:33, end:34}]);
				});
			});
			// TODO Add some HTML tests for ES6
			describe.skip('ES6 Occurrences Tests in HTML', function() {
				/**
				 * Tests computing occurrences from a script block in the <head> block
				 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=430299
				 */
				it('test_htmlHead1', function(done) {
				    var text = "<!DOCTYPE html><head><script>function f() {}</script></head><html></html>";
					return computeOccurrences(text, getOptions(done, 39, 39, 'text/html'), [{start:38, end:39}]);
				});
				
			});
		});
	};
});
