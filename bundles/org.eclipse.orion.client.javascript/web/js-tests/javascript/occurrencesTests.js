/*******************************************************************************
 * @license
 * Copyright (c) 2013, 2015 IBM Corporation and others.
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
	'esprima/esprima',
	'orion/Deferred',
	'javascript/astManager',
	'javascript/cuProvider',
	'javascript/occurrences',
	'javascript/validator',
	'eslint/lib/eslint',
	'js-tests/javascript/testingWorker',
	'mocha/mocha'  //must stay at the end, not a module
], function(chai, Esprima, Deferred, ASTManager, CUProvider, Occurrences, Validator, ESLint, TestWorker) {
	var assert = chai.assert;
	var testworker;
	
	describe('Occurrences Tests', function() {
		/**
		 * @description Sets up the test
		 * @param {Object} options {buffer, contentType}
		 * @returns {Object} The object with the initialized values
		 */
		function setup(options) {
			var buffer = options.buffer;
			var astManager = new ASTManager.ASTManager(Esprima);
			var validator = new Validator(testworker, CUProvider);
			validator._enableOnly("NOTARULE");
			var state = Object.create(null);
			assert(options.callback, "You must provide a callback for a worker-based test");
			state.callback = options.callback;
			testworker.setTestState(state);
			var occurrences = new Occurrences.JavaScriptOccurrences(astManager, CUProvider);
			var editorContext = {
				contentTypeId: "application/javascript",
				/**
				 * get the text
				 */
				getText: function() {
					return new Deferred().resolve(buffer);
				},
				
				getFileMetadata: function() {
				    var o = Object.create(null);
				    o.contentType = Object.create(null);
				    o.contentType.id = this.contentTypeId;
				    o.location = 'occurrences_test_script.js';
				    return new Deferred().resolve(o);
				}
			};
			var ctext = {
				selection: options.selection,
				contentType: 'application/javascript'
			};
			return {
				validator: validator,
				editorContext: editorContext,
				context: ctext,
				occurrences: occurrences
			};

		}
		/**
		 * @callback from Mocha after each test runs
		 */
		afterEach(function() {
			CUProvider.onModelChanging({file:{location: 'occurrences_test_script.js'}});
		});
		
		/**
		 * @name assertOccurrence
		 * @description Checks the given occurrence against the expected start and end to make sure it is marked correctly
		 * @function
		 * @public
		 * @param {Array} results The computed occurrence elements to check
		 * @param {Array} expected The array of expected start/end pairs
		 */
		function assertOccurrences(results, expected) {
			try {
				if(!results) {
					assert.ok(false, "The occurrence array cannot be null");
				}
				var foundOccurrences = '';
				for (var l=0; l<results.length; l++) {
					if (results[l]){
						foundOccurrences += results[l].start + '-' + results[l].end + ', ';
					}
				}
				assert.equal(results.length, expected.length, "The wrong number of occurrences was returned. Expected: " + listOccurrences(expected) + " Returned: " + listOccurrences(results));
				for(var i = 0; i < expected.length; i++) {
					//for each expected result try to find it in the results, and remove it if it is found
					for(var j = 0; j < results.length; j++) {
						if(!results[j]) {
							continue;
						}
						if((expected[i].start === results[j].start) && (expected[i].end === results[j].end)) {
							results[j] = null;
						}
					}
				}
				for(var k = 0; k < results.length; k++) {
					if(results[k]) {
						assert.ok(false, "Found an unknown occurrence: [start "+results[k].start+"][end "+results[k].end+"]. Expected: " + listOccurrences(expected) + " Returned: " + listOccurrences(results));
					}
				}
				testworker.getTestState().callback();
			}
			catch(err) {
				testworker.getTestState().callback(err);
			}	
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
					if (i < (occurrences.length-1)){
						foundOccurrences += ', ';
					}
				}
			}
			return foundOccurrences;
		}
		
		before('Start the testing worker', function(callback) {
			this.timeout(20000);
			testworker = TestWorker.instance({callback: callback});
		});

		after("Shut down the testing worker", function() {
			testworker.terminate();
		});
		this.timeout(1000000);

		/**
		 * Tests a function declaration
		 */
		it('test_funcDeclaration1', function(callback) {
			var obj = setup({
				buffer: "function F1(p1, p2) {\n"+
					"\tvar out = p1;\n"+
					"};",
				selection: {
					start: 13,
					end: 13
				},
				callback: callback
			});
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context).then(
				function(results) {
					//expected to fail until https://bugs.eclipse.org/bugs/show_bug.cgi?id=423634 is fixed
					assertOccurrences(results, [{start:12, end:14}, {start:33, end:35}]);
				}, function (error) {
					testworker.getTestState().callback(error);
				});
		});
		
		/**
		 * Tests a function expression
		 */
		it('test_funcExpression1', function(callback) {
			var obj = setup({
				buffer: "var obj = {\n"+
					"\titem: function(p1, p2) {\n"+
					"\t\tvar out = p1;\n"+
					"\t}"+
					"};",
				selection: {
					start: 30,
					end: 30
				},
				callback: callback
			});
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context).then(
				function(results) {
					//expected to fail until https://bugs.eclipse.org/bugs/show_bug.cgi?id=423634 is fixed
					assertOccurrences(results, [{start:28, end:30}, {start:50, end:52}]);
				}, function (error) {
					testworker.getTestState().callback(error);
				});
		});
		
		/**
		 * Tests an object expression
		 */
		it('test_objExpression1', function(callback) {
			var obj = setup({
				buffer: "var object = {};"+
					"var newobject = object;",
				selection: {
					start: 5,
					end: 5
				},
				callback: callback
			});
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context).then(
				function(results) {
					assertOccurrences(results, [{start:4, end:10}, {start:32, end:38}]);
				}, function (error) {
					testworker.getTestState().callback(error);
				});
		});
			
		/**
		 * Tests nested function declarations
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423835
		 */
		it('test_nestedFuncDecl1', function(callback) {
			var obj = setup({
				buffer: "function f(p1) { function b(p1) { var p2 = p1; };};",
				selection: {
					start: 12,
					end: 12
				},
				callback: callback
			});
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context).then(
				function(results) {
					assertOccurrences(results, [{start:11, end:13}]);
				}, function (error) {
					testworker.getTestState().callback(error);
				});
		});
		
		/**
		 * Tests nested function declarations
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423835
		 */
		it('test_nestedFuncDecl2', function(callback) {
			var obj = setup({
				buffer: "function f(p1) { function b(p1) { var p2 = p1; };};",
				selection: {
					start: 29,
					end: 29
				},
				callback: callback
			});
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context).then(
				function(results) {
					assertOccurrences(results, [{start:28, end:30}, {start:43, end:45}]);
				}, function (error) {
					testworker.getTestState().callback(error);
				});
		});
		
		/**
		 * Tests nested function declarations
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423835
		 */
		it('test_nestedFuncDecl3', function(callback) {
			var obj = setup({
				buffer: "function f(p1) { function b(p1) { var p2 = p1; };};",
				selection: {
					start: 44,
					end: 44
				},
				callback: callback
			});
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context).then(
				function(results) {
					assertOccurrences(results, [{start:28, end:30}, {start:43, end:45}]);
				}, function (error) {
					testworker.getTestState().callback(error);
				});
		});
		
		/**
		 * Tests nested function expressions
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423835
		 */
		it('test_nestedFuncExpr1', function(callback) {
			var obj = setup({
				buffer: "var object = {one: function(p1) { function b(p1) { var p2 = p1; }; }};",
				selection: {
					start: 30,
					end: 30
				},
				callback: callback
			});
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context).then(
				function(results) {
					assertOccurrences(results, [{start:28, end:30}]);
				}, function (error) {
					testworker.getTestState().callback(error);
				});
		});
		
		/**
		 * Tests nested function expressions
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423835
		 */
		it('test_nestedFuncExpr2', function() {
			editorContext.text = "var object = {one: function(p1) { function b(p1) { var p2 = p1; }; }};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(47, 47)).then(function(results) {
				assertOccurrences(results, [{start:45, end:47}, {start:60, end:62}]);
			});
		});
		
		/**
		 * Tests nested function expressions
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423835
		 */
		it('test_nestedFuncExpr3', function() {
			editorContext.text = "var object = {one: function(p1) { function b(p1) { var p2 = p1; }; }};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(62, 62)).then(function(results) {
				assertOccurrences(results, [{start:60, end:62}, {start:45, end:47}]);
			});
		});
		
		/**
		 * Tests nested function expressions
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423835
		 */
		it('test_nestedFuncExpr4', function() {
			editorContext.text = "function b(p1) { var object = {one: function(p1) {var p2 = p1; } };};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(13, 13)).then(function(results) {
				assertOccurrences(results, [{start:11, end:13}]);
			});
		});
		
		/**
		 * Tests nested function expressions
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423835
		 */
		it('test_nestedFuncExpr5', function() {
			editorContext.text = "function b(p1) { var object = {one: function(p1) {var p2 = p1; } };};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(47, 47)).then(function(results) {
				assertOccurrences(results, [{start:45, end:47}, {start:59, end:61}]);
			});
		});
		
		/**
		 * Tests nested function expressions
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423835
		 */
		it('test_nestedFuncExpr6', function() {
			editorContext.text = "function b(p1) { var object = {one: function(p1) {var p2 = p1; } };};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(61, 61)).then(function(results) {
				assertOccurrences(results, [{start:45, end:47}, {start:59, end:61}]);
			});
		});
		
		/**
		 * Tests nested function expressions
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423835
		 */
		it('test_nestedFuncExpr7', function() {
			editorContext.text = "var out = function(p1) {var inner = {object : {one: function(p1) {var p2 = p1;}}};};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(21, 21)).then(function(results) {
				assertOccurrences(results, [{start:19, end:21}]);
			});
		});
		
		/**
		 * Tests nested function expressions
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423835
		 */
		it('test_nestedFuncExpr8', function() {
			editorContext.text = "var out = function(p1) {var inner = {object : {one: function(p1) {var p2 = p1;}}};};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(63, 63)).then(function(results) {
				assertOccurrences(results, [{start:61, end:63}, {start:75, end:77}]);
			});
		});
		
		/**
		 * Tests nested function expressions
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423835
		 */
		it('test_nestedFuncExpr9', function() {
			editorContext.text = "var out = function(p1) {var inner = {object : {one: function(p1) {var p2 = p1;}}};};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(77, 77)).then(function(results) {
				assertOccurrences(results, [{start:61, end:63}, {start:75, end:77}]);
			});
		});
	
		/**
		 * Tests function decls with same named params / vars in same scope
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=424951
		 */
		it('test_functionDeclUse1', function() {
			editorContext.text = "var foo = function() {function f(prob) {} function f2() {var prob = {};	prob.foo = null;return prob;}};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(36, 36)).then(function(results) {
				assertOccurrences(results, [{start:33, end:37}]);
			});
		});
		
		/**
		 * Tests function decls with same named params / vars in same scope
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=424951
		 */
		it('test_functionDeclUse2', function() {
			editorContext.text = "var foo = function() {function f(prob) {} function f2() {var prob = {};	prob.foo = null;return prob;}};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(64, 64)).then(function(results) {
				assertOccurrences(results, [{start:61, end:65}, {start:72, end:76}, {start:95, end:99}]);
			});
		});
		
		/**
		 * Tests function decls with same named params / vars in same scope
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=424951
		 */
		it('test_functionDeclUse3', function() {
			editorContext.text = "var foo = function() {function f(prob) {} function f2() {var prob = {};	prob.foo = null;return prob;}};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(75, 75)).then(function(results) {
				assertOccurrences(results, [{start:61, end:65}, {start:72, end:76}, {start:95, end:99}]);
			});
		});
		
		/**
		 * Tests function decls with same named params / vars in same scope
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=424951
		 */
		it('test_functionDeclUse4', function() {
			editorContext.text = "var foo = function() {function f(prob) {} function f2() {var prob = {};	prob.foo = null;return prob;}};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(98, 98)).then(function(results) {
				assertOccurrences(results, [{start:61, end:65}, {start:72, end:76}, {start:95, end:99}]);
			});
		});
		
		/**
		 * Tests function decls with same named params / vars in same scope
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=424951
		 */
		it('test_functionDeclUse5', function() {
			editorContext.text = "var bar = function() {function MyObject() {}; var o = {i: function() {return new MyObject().foo;}};return MyObject;};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(36, 36)).then(function(results) {
				assertOccurrences(results, [{start:31, end:39}, {start:81, end:89}, {start:106, end:114}]);
			});
		});
		
		/**
		 * Tests function decls with same named params / vars in same scope
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=424951
		 */
		it('test_functionDeclUse6', function() {
			editorContext.text = "var bar = function() {function MyObject() {}; var o = {i: function() {return new MyObject().foo;}};return MyObject;};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(86, 86)).then(function(results) {
				assertOccurrences(results, [{start:31, end:39}, {start:81, end:89}, {start:106, end:114}]);
			});
		});
		
		/**
		 * Tests function decls with same named params / vars in same scope
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=424951
		 */
		it('test_functionDeclUse7', function() {
			editorContext.text = "var bar = function() {function MyObject() {}; var o = {i: function() {return new MyObject().foo;}};return MyObject;};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(111, 111)).then(function(results) {
				assertOccurrences(results, [{start:31, end:39}, {start:81, end:89}, {start:106, end:114}]);
			});
		});
		
		/**
		 * Tests multiple function decls marked in use and returns
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=425036
		 */
		it('test_functionDeclScopes1', function() {
			editorContext.text = "var foo = function() {function c2() {};	c2.prototype.constructor = c2;function c() {};c.prototype.constructor = c;return {c: c}};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(33, 33)).then(function(results) {
				assertOccurrences(results, [{start:31, end:33}, {start:40, end:42}, {start:67, end:69}]);
			});
		});
		
		/**
		 * Tests multiple function decls marked in use and returns
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=425036
		 */
		it('test_functionDeclScopes2', function() {
			editorContext.text = "var foo = function() {function c2() {};	c2.prototype.constructor = c2;function c() {};c.prototype.constructor = c;return {c: c}};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(41, 41)).then(function(results) {
				assertOccurrences(results, [{start:31, end:33}, {start:40, end:42}, {start:67, end:69}]);
			});
		});
		
		/**
		 * Tests multiple function decls marked in use and returns
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=425036
		 */
		it('test_functionDeclScopes3', function() {
			editorContext.text = "var foo = function() {function c2() {};	c2.prototype.constructor = c2;function c() {};c.prototype.constructor = c;return {c: c}};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(68, 68)).then(function(results) {
				assertOccurrences(results, [{start:31, end:33}, {start:40, end:42}, {start:67, end:69}]);
			});
		});
		
		/**
		 * Tests multiple function decls marked in use and returns
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=425036
		 */
		it('test_functionDeclScopes4', function() {
			editorContext.text = "var foo = function() {function c2() {};	c2.prototype.constructor = c2;function c() {};c.prototype.constructor = c;return {c: c}};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(80, 80)).then(function(results) {
				assertOccurrences(results, [{start:79, end:80}, {start:86, end:87}, {start:112, end:113}, {start:125, end:126}]);
			});
		});
		
		/**
		 * Tests multiple function decls marked in use and returns
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=425036
		 */
		it('test_functionDeclScopes5', function() {
			editorContext.text = "var foo = function() {function c2() {};	c2.prototype.constructor = c2;function c() {};c.prototype.constructor = c;return {c: c}};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(87, 87)).then(function(results) {
				assertOccurrences(results, [{start:79, end:80}, {start:86, end:87}, {start:112, end:113}, {start:125, end:126}]);
			});
		});
		
		/**
		 * Tests multiple function decls marked in use and returns
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=425036
		 */
		it('test_functionDeclScopes6', function() {
			editorContext.text = "var foo = function() {function c2() {};	c2.prototype.constructor = c2;function c() {};c.prototype.constructor = c;return {c: c}};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(113, 113)).then(function(results) {
				assertOccurrences(results, [{start:79, end:80}, {start:86, end:87}, {start:112, end:113}, {start:125, end:126}]);
			});
		});
		
		/**
		 * Tests multiple function decls marked in use and returns
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=425036
		 */
		it('test_functionDeclScopes7', function() {
			editorContext.text = "var foo = function() {function c2() {};	c2.prototype.constructor = c2;function c() {};c.prototype.constructor = c;return {c: c}};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(126, 126)).then(function(results) {
				assertOccurrences(results, [{start:79, end:80}, {start:86, end:87}, {start:112, end:113}, {start:125, end:126}]);
			});
		});
		
		/**
		 * Tests this usage in global
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=424756
		 */
		it('test_thisUsageGlobal', function() {
			editorContext.text = "this.v1 = 1; var v2 = this.v1 + 1;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(2, 2)).then(function(results) {
				assertOccurrences(results, [{start:0, end:4}, {start:22, end:26}]);
			});
		});
		
		/**
		 * Tests this usage from 2 functions
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=424756
		 */
		it('test_thisUsageFunctions', function() {
			editorContext.text = "function f1(p1) {this.p1=p1;}; function f2(p2) {this.p2=p2;};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(19, 19)).then(function(results) {
				assertOccurrences(results, [{start:17, end:21}, {start:48, end:52}]);
			});
		});
		
		/**
		 * Tests this usage in 2 objects
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=424756
		 */
		it('test_thisUsageObjects1', function() {
			editorContext.text = "var o1={v1: 'a', f1: function(){ if (this.v1){ this.v1++; }}}; var o2={v1: 'a', f1: function(){ if (this.v1){ this.v1++; }}};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(39, 39)).then(function(results) {
				assertOccurrences(results, [{start:37, end:41}, {start:47, end:51}]);
			});
		});
		
		/**
		 * Tests this usage in 2 objects
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=424756
		 */
		it('test_thisUsageObjects2', function() {
			editorContext.text = "var o1={v1: 'a', f1: function(){ if (this.v1){ this.v1++; }}}; var o2={v1: 'a', f1: function(){ if (this.v1){ this.v1++; }}};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(102, 102)).then(function(results) {
				assertOccurrences(results, [{start:100, end:104}, {start:110, end:114}]);
			});
		});
		
		/**
		 * Tests this usage in the root (global) scope of the file
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=426930
		 */
		it('test_thisUsageGlobal1', function() {
			editorContext.text = "function f1() {this.foo =1;};this.bar = 2;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(17, 17)).then(function(results) {
				assertOccurrences(results, [{start:15, end:19}, {start:29, end:33}]);
			});
		});
		
		/**
		 * Tests this usage in the root (global) scope of the file
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=426930
		 */
		it('test_thisUsageGlobal2', function() {
			editorContext.text = "function f1() {this.foo =1;};this.bar = 2;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(31, 31)).then(function(results) {
				assertOccurrences(results, [{start:15, end:19}, {start:29, end:33}]);
			});
		});
		
		/**
		 * Tests this usage in the root (global) scope of the file
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=426930
		 */
		it('test_thisUsageGlobal3', function() {
			editorContext.text = "function f1() {this.foo =1;function f2() {this.baz = 3;}};this.bar = 2;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(17, 17)).then(function(results) {
				assertOccurrences(results, [{start:15, end:19}, {start:42, end:46}, {start:58, end:62}]);
			});
		});
		
		/**
		 * Tests this usage in the root (global) scope of the file
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=426930
		 */
		it('test_thisUsageGlobal4', function() {
			editorContext.text = "function f1() {this.foo =1;function f2() {this.baz = 3;}};this.bar = 2;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(44, 44)).then(function(results) {
				assertOccurrences(results, [{start:15, end:19}, {start:42, end:46}, {start:58, end:62}]);
			});
		});
		
		/**
		 * Tests this usage in the root (global) scope of the file
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=426930
		 */
		it('test_thisUsageGlobal3', function() {
			editorContext.text = "function f1() {this.foo =1;function f2() {this.baz = 3;}};this.bar = 2;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(60, 60)).then(function(results) {
				assertOccurrences(results, [{start:15, end:19}, {start:42, end:46}, {start:58, end:62}]);
			});
		});
		
		/**
		 * Tests this usage in an object expression passed as a param
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=426930
		 */
		it('test_thisUsageCallExpressionObject1', function() {
			editorContext.text = "call({f1: function() {this.bool;},f2: function() {this.bool;},f3: function() {this.bool;}});this.end = true;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(24, 24)).then(function(results) {
				assertOccurrences(results, [{start:22, end:26}, {start:50, end:54}, {start:78, end:82}]);
			});
		});
		
		/**
		 * Tests this usage in an object expression passed as a param
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=426930
		 */
		it('test_thisUsageCallExpressionObject2', function() {
			editorContext.text = "call({f1: function() {this.bool;},f2: function() {this.bool;},f3: function() {this.bool;}});this.end = true;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(53, 53)).then(function(results) {
				assertOccurrences(results, [{start:22, end:26}, {start:50, end:54}, {start:78, end:82}]);
			});
		});
		
		/**
		 * Tests this usage in an object expression passed as a param
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=426930
		 */
		it('test_thisUsageCallExpressionObject3', function() {
			editorContext.text = "call({f1: function() {this.bool;},f2: function() {this.bool;},f3: function() {this.bool;}});this.end = true;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(81, 81)).then(function(results) {
				assertOccurrences(results, [{start:22, end:26}, {start:50, end:54}, {start:78, end:82}]);
			});
		});
		
		/**
		 * Tests this usage when function expressions are nested inside call expressions
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=424756
		 */
		it('test_thisUsageCallExpressions1', function() {
			editorContext.text = "function f1(p1) {this.a1=p1; this.f2(function(p2) {this.a2=p2; this.f3(function(p3) {this.a3=p3;});}, function(p4) {this.a4=p4;});};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(19, 19)).then(function(results) {
				assertOccurrences(results, [{start:17, end:21}, {start:29, end:33}]);
			});
		});
		
		/**
		 * Tests this usage when function expressions are nested inside call expressions
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=424756
		 */
		it('test_thisUsageCallExpressions2', function() {
			editorContext.text = "function f1(p1) {this.a1=p1; this.f2(function(p2) {this.a2=p2; this.f3(function(p3) {this.a3=p3;});}, function(p4) {this.a4=p4;});};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(52, 52)).then(function(results) {
				assertOccurrences(results, [{start:51, end:55}, {start:63, end:67}]);
			});
		});
		
		/**
		 * Tests this usage when function expressions are nested inside call expressions
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=424756
		 */
		it('test_thisUsageCallExpressions3', function() {
			editorContext.text = "function f1(p1) {this.a1=p1; this.f2(function(p2) {this.a2=p2; this.f3(function(p3) {this.a3=p3;});}, function(p4) {this.a4=p4;});};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(87, 87)).then(function(results) {
				assertOccurrences(results, [{start:85, end:89}]);
			});
		});
		
			/**
		 * Tests this usage when function expressions are nested inside call expressions
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=424756
		 */
		it('test_thisUsageCallExpressions4', function() {
			editorContext.text = "function f1(p1) {this.a1=p1; this.f2(function(p2) {this.a2=p2; this.f3(function(p3) {this.a3=p3;});}, function(p4) {this.a4=p4;});};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(116, 116)).then(function(results) {
				assertOccurrences(results, [{start:116, end:120}]);
			});
		});
		
		/**
		 * Tests logic expressions that contain identifier nodes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=426933
		 */
		it('test_logicExpression1', function() {
			editorContext.text = "function f(p1) { var v = (p1 && p1.foo)};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(12, 12)).then(function(results) {
				assertOccurrences(results, [{start:11, end:13}, {start:26, end:28}, {start:32, end:34}]);
			});
		});
		
		/**
		 * Tests logic expressions that contain identifier nodes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=426933
		 */
		it('test_logicExpression2', function() {
			editorContext.text = "function f(p1) { var v = (p1 && p1.foo)};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(27, 27)).then(function(results) {
				assertOccurrences(results, [{start:11, end:13}, {start:26, end:28}, {start:32, end:34}]);
			});
		});
		
		/**
		 * Tests logic expressions that contain identifier nodes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=426933
		 */
		it('test_logicExpression3', function() {
			editorContext.text = "function f(p1) { var v = (p1 && p1.foo)};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(33, 33)).then(function(results) {
				assertOccurrences(results, [{start:11, end:13}, {start:26, end:28}, {start:32, end:34}]);
			});
		});
		
		/**
		 * Tests logic expressions that contain identifier nodes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=426933
		 */
		it('test_logicExpression4', function() {
			editorContext.text = "var o = { p: function() {function f(p1) { var v = (p1 && p1.foo)}}};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(37, 37)).then(function(results) {
				assertOccurrences(results, [{start:36, end:38}, {start:51, end:53}, {start:57, end:59}]);
			});
		});
		
		/**
		 * Tests logic expressions that contain identifier nodes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=426933
		 */
		it('test_logicExpression5', function() {
			editorContext.text = "var o = { p: function() {function f(p1) { var v = (p1 && p1.foo)}}};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(52, 52)).then(function(results) {
				assertOccurrences(results, [{start:36, end:38}, {start:51, end:53}, {start:57, end:59}]);
			});
		});
		
		/**
		 * Tests logic expressions that contain identifier nodes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=426933
		 */
		it('test_logicExpression6', function() {
			editorContext.text = "var o = { p: function() {function f(p1) { var v = (p1 && p1.foo)}}};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(58, 58)).then(function(results) {
				assertOccurrences(results, [{start:36, end:38}, {start:51, end:53}, {start:57, end:59}]);
			});
		});
		
		/**
		 * Tests logic expressions that contain identifier nodes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427836
		 */
		it('test_newExpression1', function() {
			editorContext.text = "var foo = 1;function f1() {};var bar = new f1(foo);";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(6, 6)).then(function(results) {
				assertOccurrences(results, [{start:4, end:7}, {start:46, end:49}]);
			});
		});
		
		/**
		 * Tests logic expressions that contain identifier nodes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427836
		 */
		it('test_newExpression2', function() {
			editorContext.text = "var foo = 1;function f1() {};var bar = new f1(foo);";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(48, 48)).then(function(results) {
				assertOccurrences(results, [{start:4, end:7}, {start:46, end:49}]);
			});
		});
		
		/**
		 * Tests logic expressions that contain identifier nodes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427836
		 */
		it('test_newExpression3', function() {
			editorContext.text = "var foo = 1;function f1() {};var o = {a: function() {var bar = new f1(foo);}}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(6, 6)).then(function(results) {
				assertOccurrences(results, [{start:4, end:7}, {start:70, end:73}]);
			});
		});
		
		/**
		 * Tests logic expressions that contain identifier nodes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427836
		 */
		it('test_newExpression4', function() {
			editorContext.text = "var foo = 1;function f1() {};var o = {a: function() {var bar = new f1(foo);}}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(72, 72)).then(function(results) {
				assertOccurrences(results, [{start:4, end:7}, {start:70, end:73}]);
			});
		});
		
		/**
		 * Tests logic expressions that contain identifier nodes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427836
		 */
		it('test_newExpression5', function() {
			editorContext.text = "var foo = 1;function f1() {};function f2() {var bar = new f1(foo);}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(6, 6)).then(function(results) {
				assertOccurrences(results, [{start:4, end:7}, {start:61, end:64}]);
			});
		});
		
		/**
		 * Tests logic expressions that contain identifier nodes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427836
		 */
		it('test_newExpression6', function() {
			editorContext.text = "var foo = 1;function f1() {};function f2() {var bar = new f1(foo);}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(62, 62)).then(function(results) {
				assertOccurrences(results, [{start:4, end:7}, {start:61, end:64}]);
			});
		});
	
		/**
		 * Tests when a variable is redefined
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427928
		 */
		it('test_redefineSimpleVariable1', function() {
			editorContext.text = "var reDef; var a=reDef; var reDef; var b=reDef;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(4, 9)).then(function(results) {
				assertOccurrences(results, [{start:4, end:9}, {start:17, end:22}, {start:28, end:33}, {start:41, end:46}]);
			});
		});
		
		/**
		 * Tests when a variable is redefined
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427928
		 */
		it('test_redefineSimpleVariable2', function() {
			editorContext.text = "var reDef; var a=reDef; var reDef; var b=reDef;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(17, 17)).then(function(results) {
				assertOccurrences(results, [{start:4, end:9}, {start:17, end:22}, {start:28, end:33}, {start:41, end:46}]);
			});
		});
		
		/**
		 * Tests when a variable is redefined
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427928
		 */
		it('test_redefineSimpleVariable3', function() {
			editorContext.text = "var reDef; var a=reDef; var reDef; var b=reDef;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(30, 30)).then(function(results) {
				assertOccurrences(results, [{start:4, end:9}, {start:17, end:22}, {start:28, end:33}, {start:41, end:46}]);
			});
		});
		
		/**
		 * Tests when a variable is redefined
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427928
		 */
		it('test_redefineSimpleVariable4', function() {
			editorContext.text = "var reDef; var a=reDef; var reDef; var b=reDef;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(46, 46)).then(function(results) {
				assertOccurrences(results, [{start:4, end:9}, {start:17, end:22}, {start:28, end:33}, {start:41, end:46}]);
			});
		});
		
		/**
		 * Tests when a variable is redefined in nested scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427928
		 */
		it('test_redefineNestedVariable1', function() {
			editorContext.text = "var reDef; var a=reDef; function f1(){var b=reDef;} function f2(reDef){var c=reDef;	var reDef; var d=reDef;	function f3(){var e=reDef;}} var f=reDef;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(4, 9)).then(function(results) {
				assertOccurrences(results, [{start:4, end:9}, {start:17, end:22}, {start:44, end:49}, {start:143, end:148}]);
			});
		});
		
		/**
		 * Tests when a variable is redefined in nested scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427928
		 */
		it('test_redefineNestedVariable2', function() {
			editorContext.text = "var reDef; var a=reDef; function f1(){var b=reDef;} function f2(reDef){var c=reDef;	var reDef; var d=reDef;	function f3(){var e=reDef;}} var f=reDef;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(66, 66)).then(function(results) {
				assertOccurrences(results, [{start:64, end:69}, {start:77, end:82}, {start:88, end:93}, {start:101, end:106}, {start:128, end:133}]);
			});
		});
		
		/**
		 * Tests when a variable is redefined in nested scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427928
		 */
		it('test_redefineNestedVariable3', function() {
			editorContext.text = "var reDef; var a=reDef; function f1(){var b=reDef;} function f2(reDef){var c=reDef;	var reDef; var d=reDef;	function f3(){var e=reDef;}} var f=reDef;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(133, 133)).then(function(results) {
				assertOccurrences(results, [{start:64, end:69}, {start:77, end:82}, {start:88, end:93}, {start:101, end:106}, {start:128, end:133}]);
			});
		});
		
		/**
		 * Tests when a variable is redefined in nested scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427928
		 */
		it('test_redefineNestedVariable4', function() {
			editorContext.text = "var reDef; var a=reDef; function f1(){var b=reDef;} function f2(reDef){var c=reDef;	var reDef; var d=reDef;	function f3(){var e=reDef;}} var f=reDef;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(143, 143)).then(function(results) {
				assertOccurrences(results, [{start:4, end:9}, {start:17, end:22}, {start:44, end:49}, {start:143, end:148}]);
			});
		});
		
		/**
		 * Tests when a function is redefined
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427928
		 */
		it('test_redefineSimpleFunction1', function() {
			editorContext.text = "function reDef(){}; reDef(); function reDef(){}; reDef();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(9, 14)).then(function(results) {
				assertOccurrences(results, [{start:9, end:14}, {start:20, end:25}, {start:38, end:43}, {start:49, end:54}]);
			});
		});
		
		/**
		 * Tests when a function is redefined
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427928
		 */
		it('test_redefineSimpleFunction2', function() {
			editorContext.text = "function reDef(){}; reDef(); function reDef(){}; reDef();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(20, 20)).then(function(results) {
				assertOccurrences(results, [{start:9, end:14}, {start:20, end:25}, {start:38, end:43}, {start:49, end:54}]);
			});
		});
		
		/**
		 * Tests when a function is redefined
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427928
		 */
		it('test_redefineSimpleFunction3', function() {
			editorContext.text = "function reDef(){}; reDef(); function reDef(){}; reDef();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(40, 40)).then(function(results) {
				assertOccurrences(results, [{start:9, end:14}, {start:20, end:25}, {start:38, end:43}, {start:49, end:54}]);
			});
		});
		
		/**
		 * Tests when a function is redefined
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427928
		 */
		it('test_redefineSimpleFunction4', function() {
			editorContext.text = "function reDef(){}; reDef(); function reDef(){}; reDef();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(54, 54)).then(function(results) {
				assertOccurrences(results, [{start:9, end:14}, {start:20, end:25}, {start:38, end:43}, {start:49, end:54}]);
			});
		});
		
		/**
		 * Tests when a function is redefined in nested scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427928
		 */
		it('test_redefineNestedFunction1', function() {
			editorContext.text = "function reDef(){}; reDef(); function f1(){reDef();} function f2(reDef){reDef(); function reDef(){}; reDef(); function f3(){reDef();}} reDef();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(9, 14)).then(function(results) {
				assertOccurrences(results, [{start:9, end:14}, {start:20, end:25}, {start:43, end:48}, {start:135, end:140}]);
			});
		});
		
		/**
		 * Tests when a function is redefined in nested scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427928
		 */
		it('test_redefineNestedFunction2', function() {
			editorContext.text = "function reDef(){}; reDef(); function f1(){reDef();} function f2(reDef){reDef(); function reDef(){}; reDef(); function f3(){reDef();}} reDef();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(67, 67)).then(function(results) {
				assertOccurrences(results, [{start:65, end:70}, {start:72, end:77}, {start:90, end:95}, {start:101, end:106}, {start:124, end:129}]);
			});
		});
		
		/**
		 * Tests when a function is redefined in nested scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427928
		 */
		it('test_redefineNestedFunction3', function() {
			editorContext.text = "function reDef(){}; reDef(); function f1(){reDef();} function f2(reDef){reDef(); function reDef(){}; reDef(); function f3(){reDef();}} reDef();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(129, 129)).then(function(results) {
				assertOccurrences(results, [{start:65, end:70}, {start:72, end:77}, {start:90, end:95}, {start:101, end:106}, {start:124, end:129}]);
			});
		});
		
		/**
		 * Tests when a function is redefined in nested scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=427928
		 */
		it('test_redefineNestedFunction4', function() {
			editorContext.text = "function reDef(){}; reDef(); function f1(){reDef();} function f2(reDef){reDef(); function reDef(){}; reDef(); function f3(){reDef();}} reDef();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(135, 135)).then(function(results) {
				assertOccurrences(results, [{start:9, end:14}, {start:20, end:25}, {start:43, end:48}, {start:135, end:140}]);
			});
		});
		
		/**
		 * Tests when a redefine happens with occurrences in sibling scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=448535
		 */
		it('test_redefineSiblingScopes1', function() {
			editorContext.text = "var reDef; reDef(); function g(){ reDef(); } function reDef(){} function h(){ reDef(); } var reDef;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(4, 4)).then(function(results) {
				assertOccurrences(results, [{start:4, end:9}, {start:11, end:16}, {start:34, end:39}, {start:54, end:59}, {start:78, end:83}, {start:93, end:98}]);
			});
		});
		
		/**
		 * Tests when a redefine happens with occurrences in sibling scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=448535
		 */
		it('test_redefineSiblingScopes2', function() {
			editorContext.text = "var reDef; reDef(); function g(){ reDef(); } function reDef(){} function h(){ reDef(); } var reDef;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(11, 12)).then(function(results) {
				assertOccurrences(results, [{start:4, end:9}, {start:11, end:16}, {start:34, end:39}, {start:54, end:59}, {start:78, end:83}, {start:93, end:98}]);
			});
		});
		
		/**
		 * Tests when a redefine happens with occurrences in sibling scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=448535
		 */
		it('test_redefineSiblingScopes3', function() {
			editorContext.text = "var reDef; reDef(); function g(){ reDef(); } function reDef(){} function h(){ reDef(); } var reDef;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(34, 39)).then(function(results) {
				assertOccurrences(results, [{start:4, end:9}, {start:11, end:16}, {start:34, end:39}, {start:54, end:59}, {start:78, end:83}, {start:93, end:98}]);
			});
		});
		
		/**
		 * Tests when a redefine happens with occurrences in sibling scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=448535
		 */
		it('test_redefineSiblingScopes4', function() {
			editorContext.text = "var reDef; reDef(); function g(){ reDef(); } function reDef(){} function h(){ reDef(); } var reDef;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(59, 59)).then(function(results) {
				assertOccurrences(results, [{start:4, end:9}, {start:11, end:16}, {start:34, end:39}, {start:54, end:59}, {start:78, end:83}, {start:93, end:98}]);
			});
		});
		
		/**
		 * Tests when a redefine happens with occurrences in sibling scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=448535
		 */
		it('test_redefineSiblingScopes5', function() {
			editorContext.text = "var reDef; reDef(); function g(){ reDef(); } function reDef(){} function h(){ reDef(); } var reDef;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(78, 78)).then(function(results) {
				assertOccurrences(results, [{start:4, end:9}, {start:11, end:16}, {start:34, end:39}, {start:54, end:59}, {start:78, end:83}, {start:93, end:98}]);
			});
		});
		
		/**
		 * Tests when a redefine happens with occurrences in sibling scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=448535
		 */
		it('test_redefineSiblingScopes6', function() {
			editorContext.text = "var reDef; reDef(); function g(){ reDef(); } function reDef(){} function h(){ reDef(); } var reDef;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(94, 98)).then(function(results) {
				assertOccurrences(results, [{start:4, end:9}, {start:11, end:16}, {start:34, end:39}, {start:54, end:59}, {start:78, end:83}, {start:93, end:98}]);
			});
		});
		
		/**
		 * Tests that occurrences with redefines are only marked inside appropriate scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=438317
		 */
		it('test_redefineScopesVar1', function() {
			editorContext.text = "var reDef; function f(){ var reDef; } log(reDef);";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(4, 4)).then(function(results) {
				assertOccurrences(results, [{start:4, end:9}, {start:42, end:47}]);
			});
		});
		
		/**
		 * Tests that occurrences with redefines are only marked inside appropriate scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=438317
		 */
		it('test_redefineScopesVar2', function() {
			editorContext.text = "var reDef; function f(){ var reDef; } log(reDef);";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(30, 32)).then(function(results) {
				assertOccurrences(results, [{start:29, end:34}]);
			});
		});
		
		/**
		 * Tests that occurrences with redefines are only marked inside appropriate scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=438317
		 */
		it('test_redefineScopesVar3', function() {
			editorContext.text = "var reDef; function f(){ var reDef; } log(reDef);";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(45, 45)).then(function(results) {
				assertOccurrences(results, [{start:4, end:9}, {start:42, end:47}]);
			});
		});
		
		/**
		 * Tests that occurrences with redefines are only marked inside appropriate scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=438317
		 */
		it('test_redefineScopesFuncDecl1', function() {
			editorContext.text = "function reDef() { function reDef(){}; } reDef();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(9, 9)).then(function(results) {
				assertOccurrences(results, [{start:9, end:14}, {start:41, end:46}]);
			});
		});
		
		/**
		 * Tests that occurrences with redefines are only marked inside appropriate scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=438317
		 */
		it('test_redefineScopesFuncDecl2', function() {
			editorContext.text = "function reDef() { function reDef(){}; } reDef();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(28, 33)).then(function(results) {
				assertOccurrences(results, [{start:28, end:33}]);
			});
		});
		
		/**
		 * Tests that occurrences with redefines are only marked inside appropriate scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=438317
		 */
		it('test_redefineScopesFuncDecl3', function() {
			editorContext.text = "function reDef() { function reDef(){}; } reDef();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(45, 46)).then(function(results) {
				assertOccurrences(results, [{start:9, end:14}, {start:41, end:46}]);
			});
		});
		
		/**
		 * Tests that occurrences with redefines are only marked inside appropriate scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=438317
		 */
		it('test_redefineScopesFuncExpr1', function() {
			editorContext.text = "var a = function reDef() { var b = function reDef(){}; };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(17, 17)).then(function(results) {
				assertOccurrences(results, [{start:17, end:22}]);
			});
		});
		
		/**
		 * Tests that occurrences with redefines are only marked inside appropriate scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=438317
		 */
		it('test_redefineScopesFuncExpr2', function() {
			editorContext.text = "var a = function reDef() { var b = function reDef(){}; };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(44, 44)).then(function(results) {
				assertOccurrences(results, [{start:44, end:49}]);
			});
		});
		
		/**
		 * Tests that occurrences with redefines are only marked inside appropriate scopes
		 * As the selected 'reDef' isn't defined in the program scope, we assume it belongs to the global scope
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=447962
		 */
		it('test_redefineScopesFuncExpr3', function() {
			editorContext.text = "var a = function reDef() { var b = function reDef(){}; }; reDef();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(63, 63)).then(function(results) {
				assertOccurrences(results, [{start:58, end:63}]);
			});
		});
		
		/**
		 * Tests that occurrences with redefines are only marked inside appropriate scopes
		 * As the selected 'reDef' isn't defined in the program scope, we assume it belongs to the global scope
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=447962
		 */
		it('test_redefineScopesFuncExprVar1', function() {
			editorContext.text = "var a = function reDef(){ reDef(); }; var reDef; reDef();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(17, 17)).then(function(results) {
				assertOccurrences(results, [{start:17, end:22}, {start:26, end:31}]);
			});
		});
		
		/**
		 * Tests that occurrences with redefines are only marked inside appropriate scopes
		 * As the selected 'reDef' isn't defined in the program scope, we assume it belongs to the global scope
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=447962
		 */
		it('test_redefineScopesFuncExprVar2', function() {
			editorContext.text = "var a = function reDef(){ reDef(); }; var reDef; reDef();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(27, 29)).then(function(results) {
				assertOccurrences(results, [{start:17, end:22}, {start:26, end:31}]);
			});
		});
		
		/**
		 * Tests that occurrences with redefines are only marked inside appropriate scopes
		 * As the selected 'reDef' isn't defined in the program scope, we assume it belongs to the global scope
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=447962
		 */
		it('test_redefineScopesFuncExprVar3', function() {
			editorContext.text = "var a = function reDef(){ reDef(); }; var reDef; reDef();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(47, 47)).then(function(results) {
				assertOccurrences(results, [{start:42, end:47}, {start:49, end:54}]);
			});
		});
		
		/**
		 * Tests that occurrences with redefines are only marked inside appropriate scopes
		 * As the selected 'reDef' isn't defined in the program scope, we assume it belongs to the global scope
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=447962
		 */
		it('test_redefineScopesFuncExprVar4', function() {
			editorContext.text = "var a = function reDef(){ reDef(); }; var reDef; reDef();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(49, 54)).then(function(results) {
				assertOccurrences(results, [{start:42, end:47}, {start:49, end:54}]);
			});
		});
		
		/**
		 * Tests that even though assignment comes before declaration, occurrences recognizes that the declaration will be hoisted to the top of the scope
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=438317
		 */
		it('test_redefineScopesHoisting1', function() {
			editorContext.text = "var reDef; function f() { log(reDef); var reDef; }";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(35, 35)).then(function(results) {
				assertOccurrences(results, [{start:30, end:35}, {start:42, end:47}]);
			});
		});
		
		/**
		 * Tests that even though call comes before declaration, occurrences recognizes that the declaration will be hoisted to the top of the scope
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=438317
		 */
		it('test_redefineScopesHoisting2', function() {
			editorContext.text = "function reDef(){}; function f() { reDef(); function reDef(){}; }";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(35, 35)).then(function(results) {
				assertOccurrences(results, [{start:35, end:40}, {start:53, end:58}]);
			});
		});
		
		//RECOVERED OCCURRENCES
		/**
		 * Tests computing occurrences within an AST that has been recovered
		 */
		it('test_recovered_occurrence 1', function() {
			editorContext.text = "var one = 1; func(one two); one = 23";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(7, 7)).then(function(results) {
				assertOccurrences(results, [{start:4, end:7}, {start:18, end:21}, {start:28, end:31}]);
			});
		});
		
		/**
		 * Tests computing occurrences within an AST that has been recovered
		 */
		it('test_recovered_occurrence 2', function() {
			editorContext.text = "var one = 1; var o = {f:one d:2}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(27, 27)).then(function(results) {
				assertOccurrences(results, [{start:4, end:7}, {start:24, end:27}]);
			});
		});
		
		/**
		 * Tests computing occurrences for for-loop inits
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=435941
		 */
		it('test_for_init_1', function() {
			editorContext.text = "var f = 3; for(f; i < 10; i++) {}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(5, 5)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:15, end:16}]);
			});
		});
		
		/**
		 * Tests computing occurrences for for-loop inits
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=435941
		 */
		it('test_for_init_2', function() {
			editorContext.text = "var f = 3; for(f; i < 10; i++) {}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(15, 15)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:15, end:16}]);
			});
		});
		
		/**
		 * Tests computing occurrences for for-loop inits
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=435941
		 */
		it('test_for_init_3', function() {
			editorContext.text = "var f = 3; for(var i = f; i < 10; i++) {}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(4, 4)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:23, end:24}]);
			});
		});
		
		/**
		 * Tests computing occurrences for do-while tests
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=435941
		 */
		it('test_do_while_test_1', function() {
			editorContext.text = "var f = 3; do{} while(f) {}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(5, 5)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:22, end:23}]);
			});
		});
		
		/**
		 * Tests computing occurrences for do-while tests
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=435941
		 */
		it('test_do_while_test_2', function() {
			editorContext.text = "var f = 3; do{} while(f) {}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(22, 22)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:22, end:23}]);
			});
		});
		
		/**
		 * Tests computing occurrences for do-while tests
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=435941
		 */
		it('test_do_while_test_3', function() {
			editorContext.text = "var f = 3; do{} while(f < 12) {}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(22, 22)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:22, end:23}]);
			});
		});
		/**
		 * Tests computing occurrences for with statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=436630
		 */
		it('test_with_1', function() {
			editorContext.text = "var f = 3; with(f) {f = 2;}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(4, 4)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:16, end:17}, {start:20, end:21}]);
			});
		});
		/**
		 * Tests computing occurrences for with statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=436630
		 */
		it('test_with_2', function() {
			editorContext.text = "var f = 3; with(f) {f = 2;}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(16, 16)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:16, end:17}, {start:20, end:21}]);
			});
		});
		/**
		 * Tests computing occurrences for with statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=436630
		 */
		it('test_with_test_3', function() {
			editorContext.text = "var f = 3; with(f) {f = 2;}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(20, 20)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:16, end:17}, {start:20, end:21}]);
			});
		});
		/**
		 * Tests computing occurrences for for-in statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=436630
		 */
		it('test_for-in_1', function() {
			editorContext.text = "var f = 3; for(f in bar) {f = 2;}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(4, 4)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:15, end:16}, {start:26, end:27}]);
			});
		});
		/**
		 * Tests computing occurrences for for-in statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=436630
		 */
		it('test_for-in_2', function() {
			editorContext.text = "var f = 3; for(f in bar) {f = 2;}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(15, 15)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:15, end:16}, {start:26, end:27}]);
			});
		});
		/**
		 * Tests computing occurrences for for-in statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=436630
		 */
		it('test_for-in_3', function() {
			editorContext.text = "var f = 3; for(f in bar) {f = 2;}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(26, 26)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:15, end:16}, {start:26, end:27}]);
			});
		});
		/**
		 * Tests computing occurrences for for-in statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=436630
		 */
		it('test_for-in_4', function() {
			editorContext.text = "var f = 3; for(var q in f) {q = f;}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(4, 4)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:24, end:25}, {start:32, end:33}]);
			});
		});
		/**
		 * Tests computing occurrences for for-in statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=436630
		 */
		it('test_for-in_5', function() {
			editorContext.text = "var f = 3; for(var q in f) {q = f;}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(24, 24)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:24, end:25}, {start:32, end:33}]);
			});
		});
		/**
		 * Tests computing occurrences for for-in statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=436630
		 */
		it('test_for-in_6', function() {
			editorContext.text = "var f = 3; for(var q in f) {q = f;}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(32, 32)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:24, end:25}, {start:32, end:33}]);
			});
		});
		/**
		 * Tests computing occurrences for while statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=436728
		 */
		it('test_while_1', function() {
			editorContext.text = "var f = 3; while(f) {var q = f;}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(4, 4)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:17, end:18}, {start:29, end:30}]);
			});
		});
		/**
		 * Tests computing occurrences for while statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=436728
		 */
		it('test_while_2', function() {
			editorContext.text = "var f = 3; while(f) {var q = f;}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(17, 17)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:17, end:18}, {start:29, end:30}]);
			});
		});
		/**
		 * Tests computing occurrences for while statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=436728
		 */
		it('test_while_3', function() {
			editorContext.text = "var f = 3; while(f) {var q = f;}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(29, 29)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:17, end:18}, {start:29, end:30}]);
			});
		});
		
		/**
		 * Tests computing occurrences for object properties and references to them
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423083
		 */
		it('test_object_properties_1A', function() {
			editorContext.text = "Objects.mixin({ test1: function() {}, test2: function() { return this.test1(); } });";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(19, 19)).then(function(results) {
				assertOccurrences(results, [{start:16, end:21}, {start:70, end:75}]);
			});
		});
		
		/**
		 * Tests computing occurrences for object properties and references to them
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423083
		 */
		it('test_object_properties_1B', function() {
			editorContext.text = "Objects.mixin({ test1: function() {}, test2: function() { return this.test1(); } });";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(71, 71)).then(function(results) {
				assertOccurrences(results, [{start:16, end:21}, {start:70, end:75}]);
			});
		});
		
		/**
		 * Tests computing occurrences for object properties and references to them
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423083
		 */
		it('test_object_properties_2A', function() {
			editorContext.text = "var foo = { test1: function() {}, test2: function() { return this.test1(); } };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(15, 15)).then(function(results) {
				assertOccurrences(results, [{start:12, end:17}, {start:66, end:71}]);
			});
		});
		
		/**
		 * Tests computing occurrences for object properties and references to them
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423083
		 */
		it('test_object_properties_2B', function() {
			editorContext.text = "var foo = { test1: function() {}, test2: function() { return this.test1(); } };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(66, 71)).then(function(results) {
				assertOccurrences(results, [{start:12, end:17}, {start:66, end:71}]);
			});
		});
		
		/**
		 * Tests computing occurrences for object properties and references to them
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423083
		 */
		it('test_object_properties_3A', function() {
			editorContext.text = "var foo = {a: this.a(), b: {a: this.a(), c: {a: this.a()}}, c: this.a()};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(11, 11)).then(function(results) {
				assertOccurrences(results, [{start:11, end:12}, {start:19, end:20}, {start:68, end:69}]);
			});
		});
		
		/**
		 * Tests computing occurrences for object properties and references to them
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423083
		 */
		it('test_object_properties_3B', function() {
			editorContext.text = "var foo = {a: this.a(), b: {a: this.a(), c: {a: this.a()}}, c: this.a()};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(28, 28)).then(function(results) {
				assertOccurrences(results, [{start:28, end:29}, {start:36, end:37}]);
			});
		});
		
		/**
		 * Tests computing occurrences for object properties and references to them
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423083
		 */
		it('test_object_properties_3C', function() {
			editorContext.text = "var foo = {a: this.a(), b: {a: this.a(), c: {a: this.a()}}, c: this.a()};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(60, 61)).then(function(results) {
				assertOccurrences(results, [{start:60, end:61}]);
			});
		});
		
		/**
		 * Tests computing occurrences for object properties and references to them
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423083
		 */
		it('test_object_properties_3D', function() {
			editorContext.text = "var foo = {a: this.a(), b: {a: this.a(), c: {a: this.a()}}, c: this.a()};";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(68, 69)).then(function(results) {
				assertOccurrences(results, [{start:11, end:12}, {start:19, end:20}, {start:68, end:69}]);
			});
		});
		
		/**
		 * Tests computing occurrences for a named func expression inside an object property (and that params are skipped)
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=439641
		 */
		it('test_object_properties_named_expressions1', function() {
			editorContext.text = "var a={ f: function f(p1, p2) {}, g: function g() { this.f(); } }; f();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(9, 9)).then(function(results) {
				assertOccurrences(results, [{start:8, end:9}, {start:20, end:21}, {start:57, end:58}]);
			});
		});
		
		/**
		 * Tests computing occurrences for a named func expression inside an object property (and that params are skipped)
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=439641
		 */
		it('test_object_properties_named_expressions2', function() {
			editorContext.text = "var a={ f: function f(p1, p2) {}, g: function g() { this.f(); } }; f();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(20, 20)).then(function(results) {
				assertOccurrences(results, [{start:8, end:9}, {start:20, end:21}, {start:57, end:58}]);
			});
		});
		
		/**
		 * Tests computing occurrences for a named func expression inside an object property (and that params are skipped)
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=439641
		 */
		it('test_object_properties_named_expressions3', function() {
			editorContext.text = "var a={ f: function f(p1, p2) {}, g: function g() { this.f(); } }; f();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(57, 58)).then(function(results) {
				assertOccurrences(results, [{start:8, end:9}, {start:20, end:21}, {start:57, end:58}]);
			});
		});
		
		/**
		 * Tests computing occurrences for a named func expression inside an object property (and that params are skipped)
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=439641
		 */
		it('test_object_properties_named_expressions4', function() {
			editorContext.text = "var a={ f: function f(p1, p2) {p1++;}, g: function g() { this.f(); } }; f();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(23, 23)).then(function(results) {
				assertOccurrences(results, [{start:22, end:24}, {start:31, end:33}]);
			});
		});
		
		/**
		 * Tests computing occurrences for object property used in two sibling scopes and defined in an outside scope
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=439156
		 */
		it('test_ObjectPropsSiblingScopes1', function() {
			editorContext.text = "var a = { f: function (){ this.g(); var b = { p: this.g() }; var c = { p: this.g() }; }, g: function (){} };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(31, 32)).then(function(results) {
				assertOccurrences(results, [{start:31, end:32}, {start:54, end:55}, {start:79, end:80}, {start:89, end:90}]);
			});
		});
		
		/**
		 * Tests computing occurrences for object property used in two sibling scopes and defined in an outside scope
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=439156
		 */
		it('test_ObjectPropsSiblingScopes2', function() {
			editorContext.text = "var a = { f: function (){ this.g(); var b = { p: this.g() }; var c = { p: this.g() }; }, g: function (){} };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(54, 54)).then(function(results) {
				assertOccurrences(results, [{start:31, end:32}, {start:54, end:55}, {start:79, end:80}, {start:89, end:90}]);
			});
		});
		
		/**
		 * Tests computing occurrences for object property used in two sibling scopes and defined in an outside scope
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=439156
		 */
		it('test_ObjectPropsSiblingScopes3', function() {
			editorContext.text = "var a = { f: function (){ this.g(); var b = { p: this.g() }; var c = { p: this.g() }; }, g: function (){} };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(79, 79)).then(function(results) {
				assertOccurrences(results, [{start:31, end:32}, {start:54, end:55}, {start:79, end:80}, {start:89, end:90}]);
			});
		});
		
		/**
		 * Tests computing occurrences for object property used in two sibling scopes and defined in an outside scope
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=439156
		 */
		it('test_ObjectPropsSiblingScopes4', function() {
			editorContext.text = "var a = { f: function (){ this.g(); var b = { p: this.g() }; var c = { p: this.g() }; }, g: function (){} };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(89, 90)).then(function(results) {
				assertOccurrences(results, [{start:31, end:32}, {start:54, end:55}, {start:79, end:80}, {start:89, end:90}]);
			});
		});
		
		/**
		 * Tests computing occurrences for object property used in sibling scopes and defined in multiple nested scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=439156
		 */
		it('test_ObjectPropsNestedScopes1', function() {
			editorContext.text = "var a = { f: function (){ this.g(); var b = { p: this.g() g: function (){} }; var c = { p: this.g() }; }, g: function (){} };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(31, 32)).then(function(results) {
				assertOccurrences(results, [{start:31, end:32}, {start:96, end:97}, {start:106, end:107}]);
			});
		});	
		
		/**
		 * Tests computing occurrences for object property used in sibling scopes and defined in multiple nested scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=439156
		 */
		it('test_ObjectPropsNestedScopes2', function() {
			editorContext.text = "var a = { f: function (){ this.g(); var b = { p: this.g() g: function (){} }; var c = { p: this.g() }; }, g: function (){} };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(96, 96)).then(function(results) {
				assertOccurrences(results, [{start:31, end:32}, {start:96, end:97}, {start:106, end:107}]);
			});
		});
		
		/**
		 * Tests computing occurrences for object property used in sibling scopes and defined in multiple nested scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=439156
		 */
		it('test_ObjectPropsNestedScopes3', function() {
			editorContext.text = "var a = { f: function (){ this.g(); var b = { p: this.g() g: function (){} }; var c = { p: this.g() }; }, g: function (){} };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(106, 106)).then(function(results) {
				assertOccurrences(results, [{start:31, end:32}, {start:96, end:97}, {start:106, end:107}]);
			});
		});
		
		/**
		 * Tests computing occurrences for object property used in sibling scopes and defined in multiple nested scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=439156
		 */
		it('test_ObjectPropsNestedScopes4', function() {
			editorContext.text = "var a = { f: function (){ this.g(); var b = { p: this.g() g: function (){} }; var c = { p: this.g() }; }, g: function (){} };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(54, 55)).then(function(results) {
				assertOccurrences(results, [{start:54, end:55}, {start:58, end:59}]);
			});
		});
		
		/**
		 * Tests computing occurrences for object property used in sibling scopes and defined in multiple nested scopes
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=439156
		 */
		it('test_ObjectPropsNestedScopes5', function() {
			editorContext.text = "var a = { f: function (){ this.g(); var b = { p: this.g() g: function (){} }; var c = { p: this.g() }; }, g: function (){} };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(58, 58)).then(function(results) {
				assertOccurrences(results, [{start:54, end:55}, {start:58, end:59}]);
			});
		});
		
		/**
		 * Tests whether occurrences finds and selects the correct token/word/node
		 */
		it('test_punctuators_1A', function() {
			editorContext.text = "var \tfoo ; bar\n;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(4, 4)).then(function(results) {
				assertOccurrences(results, []);
			});
		});
		
		/**
		 * Tests whether occurrences finds and selects the correct token/word/node
		 */
		it('test_punctuators_1B', function() {
			editorContext.text = "var \tfoo ; bar\n;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(9, 9)).then(function(results) {
				assertOccurrences(results, []);
			});
		});
		
		/**
		 * Tests whether occurrences finds and selects the correct token/word/node
		 */
		it('test_punctuators_1C', function() {
			editorContext.text = "var \tfoo ; bar\n;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(10, 10)).then(function(results) {
				assertOccurrences(results, []);
			});
		});
		
		/**
		 * Tests whether occurrences finds and selects the correct token/word/node
		 */
		it('test_punctuators_1D', function() {
			editorContext.text = "var \tfoo ; bar\n;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(15, 15)).then(function(results) {
				assertOccurrences(results, []);
			});
		});
		
		/**
		 * Tests named function expressions
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=438083
		 */
		it('test_namedFuncExpr1', function() {
			editorContext.text = "var a; log(a); var x = function a(){ log(a); var y = function a(){ log(a); }; };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(11, 11)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:11, end:12}]);
			});
		});
		
		/**
		 * Tests named function expressions
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=438083
		 */
		it('test_namedFuncExpr2', function() {
			editorContext.text = "var a; log(a); var x = function a(){ log(a); var y = function a(){ log(a); }; };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(32, 32)).then(function(results) {
				assertOccurrences(results, [{start:32, end:33}, {start:41, end:42}]);
			});
		});
		
		/**
		 * Tests named function expressions
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=438083
		 */
		it('test_namedFuncExpr3', function() {
			editorContext.text = "var a; log(a); var x = function a(){ log(a); var y = function a(){ log(a); }; };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(41, 42)).then(function(results) {
				assertOccurrences(results, [{start:32, end:33}, {start:41, end:42}]);
			});
		});
		
		
		/**
		 * Tests named function expressions
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=438083
		 */
		it('test_namedFuncExpr4', function() {
			editorContext.text = "var a; log(a); var x = function a(){ log(a); var y = function a(){ log(a); }; };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(63, 63)).then(function(results) {
				assertOccurrences(results, [{start:62, end:63}, {start:71, end:72}]);
			});
		});
		
		/**
		 * Tests named function expressions
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=438083
		 */
		it('test_namedFuncExpr5', function() {
			editorContext.text = "var a; log(a); var x = function a(){ log(a); var y = function a(){ log(a); }; };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(72, 72)).then(function(results) {
				assertOccurrences(results, [{start:62, end:63}, {start:71, end:72}]);
			});
		});
		
		/**
		 * Tests named function expression in object property
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=439641
		 * TODO Add a test if the caret is in the named function expression or the call expression.
		 */
		it('test_namedFuncExpr6', function() {
			editorContext.text = "var x = { a: function a() {} }; a();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(11, 11)).then(function(results) {
				assertOccurrences(results, [{start:10, end:11}, {start:22, end:23}]);
			});
		});
		
		/**
		 * Tests throw statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=438402
		 */
		it('test_throwStatement1', function() {
			editorContext.text = "var a; throw a;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(4, 4)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:13, end:14}]);
			});
		});
		
		/**
		 * Tests throw statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=438402
		 */
		it('test_throwStatement2', function() {
			editorContext.text = "var a; function f() { if(a) { throw a; }}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(25, 25)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:25, end:26}, {start:36, end:37}]);
			});
		});
		
		/**
		 * Tests throw statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=438402
		 */
		it('test_throwStatement3', function() {
			editorContext.text = "var a; function f() { if(a) { throw a; }}";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(36, 36)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:25, end:26}, {start:36, end:37}]);
			});
		});
		
		/**
		 * Tests labeled statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=436728
		 */
		it('test_labeledStatement1', function() {
			editorContext.text = "var a = 9; a: while(a) { if(false) { var b = {}; b: for(var x in b) { if(b === null || x === null) { break b; } } continue a; } }";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(4, 5)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:20, end:21}]);
			});
		});

		/**
		 * Tests labeled statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=436728
		 */
		it('test_labeledStatement2', function() {
			editorContext.text = "var a = 9; a: while(a) { if(false) { var b = {}; b: for(var x in b) { if(b === null || x === null) { break b; } } continue a; } }";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(11, 12)).then(function(results) {
				assertOccurrences(results, [{start:11, end:12}, {start:123, end:124}]);
			});
		});
		
		/**
		 * Tests labeled statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=436728
		 */
		it('test_labeledStatement3', function() {
			editorContext.text = "var a = 9; a: while(a) { if(false) { var b = {}; b: for(var x in b) { if(b === null || x === null) { break b; } } continue a; } }";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(123, 124)).then(function(results) {
				assertOccurrences(results, [{start:11, end:12}, {start:123, end:124}]);
			});
		});
		/**
		 * Tests labeled statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=436728
		 */
		it('test_labeledStatement4', function() {
			editorContext.text = "var a = 9; a: while(a) { if(false) { var b = {}; b: for(var x in b) { if(b === null || x === null) { break b; } } continue a; } }";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(49, 50)).then(function(results) {
				assertOccurrences(results, [{start:49, end:50}, {start:107, end:108}]);
			});
		});
		
		/**
		 * Tests labeled statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=436728
		 */
		it('test_labeledStatement5', function() {
			editorContext.text = "var a = 9; a: while(a) { if(false) { var b = {}; b: for(var x in b) { if(b === null || x === null) { break b; } } continue a; } }";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(65, 66)).then(function(results) {
				assertOccurrences(results, [{start:41, end:42}, {start:65, end:66}, {start:73, end:74}]);
			});
		});
		
		/**
		 * Tests labeled statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=436728
		 */
		it('test_labeledStatement6', function() {
			editorContext.text = "var a = 9; a: while(a) { if(false) { var b = {}; b: for(var x in b) { if(b === null || x === null) { break b; } } continue a; } }";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(107, 108)).then(function(results) {
				assertOccurrences(results, [{start:49, end:50}, {start:107, end:108}]);
			});
		});		
		
		/**
		 * Tests repeated labeled statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440928
		 */
		it('test_labeledStatementRepeat1', function() {
			editorContext.text = "a: while(true){ break a; } a: while(true){ break a; }";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(0, 1)).then(function(results) {
				assertOccurrences(results, [{start:0, end:1}, {start:22, end:23}]);
			});
		});	
		
		/**
		 * Tests repeated labeled statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440928
		 */
		it('test_labeledStatementRepeat2', function() {
			editorContext.text = "a: while(true){ break a; } a: while(true){ break a; }";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(23, 23)).then(function(results) {
				assertOccurrences(results, [{start:0, end:1}, {start:22, end:23}]);
			});
		});	
		
		/**
		 * Tests repeated labeled statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440928
		 */
		it('test_labeledStatementRepeat3', function() {
			editorContext.text = "a: while(true){ break a; } a: while(true){ break a; }";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(27, 27)).then(function(results) {
				assertOccurrences(results, [{start:27, end:28}, {start:49, end:50}]);
			});
		});	
		
		/**
		 * Tests repeated labeled statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440928
		 */
		it('test_labeledStatementRepeat4', function() {
			editorContext.text = "a: while(true){ break a; } a: while(true){ break a; }";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(49, 50)).then(function(results) {
				assertOccurrences(results, [{start:27, end:28}, {start:49, end:50}]);
			});
		});	
		
		/**
		 * Tests nested loop labeled statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440928
		 */
		it('test_labeledStatementNestedLoop1', function() {
			editorContext.text = "a: while(true){ while(true) { break a; } }";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(0, 0)).then(function(results) {
				assertOccurrences(results, [{start:0, end:1}, {start:36, end:37}]);
			});
		});	
		
		/**
		 * Tests nested loop labeled statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440928
		 */
		it('test_labeledStatementNestedLoop2', function() {
			editorContext.text = "a: while(true){ while(true) { break a; } }";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(37, 37)).then(function(results) {
				assertOccurrences(results, [{start:0, end:1}, {start:36, end:37}]);
			});
		});	
		
		/**
		 * Tests nested labeled statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440928
		 */
		it('test_labeledStatementNestedLabel1', function() {
			editorContext.text = "a: while(true){ b: while(true) { if (true) { continue a; } else { continue b; } } }";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(0, 1)).then(function(results) {
				assertOccurrences(results, [{start:0, end:1}, {start:54, end:55}]);
			});
		});	
		
		/**
		 * Tests nested labeled statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440928
		 */
		it('test_labeledStatementNestedLabel2', function() {
			editorContext.text = "a: while(true){ b: while(true) { if (true) { continue a; } else { continue b; } } }";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(54, 54)).then(function(results) {
				assertOccurrences(results, [{start:0, end:1}, {start:54, end:55}]);
			});
		});
		
		/**
		 * Tests nested labeled statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440928
		 */
		it('test_labeledStatementNestedLabel3', function() {
			editorContext.text = "a: while(true){ b: while(true) { if (true) { continue a; } else { continue b; } } }";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(16, 16)).then(function(results) {
				assertOccurrences(results, [{start:16, end:17}, {start:75, end:76}]);
			});
		});
		
		/**
		 * Tests nested labeled statements
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=440928
		 */
		it('test_labeledStatementNestedLabel4', function() {
			editorContext.text = "a: while(true){ b: while(true) { if (true) { continue a; } else { continue b; } } }";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(75, 76)).then(function(results) {
				assertOccurrences(results, [{start:16, end:17}, {start:75, end:76}]);
			});
		});
		
		/**
		 * Tests global usage
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=429173
		 */
		it('test_global1', function() {
			editorContext.text = "(function() { window.alert('hi'); }()); window.setTimeout(); window.confirm('florp');";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(14, 14)).then(function(results) {
				assertOccurrences(results, [{start:14, end:20}, {start:40, end:46}, {start: 61, end: 67}]);
			});
		});
		
		/**
		 * Tests global usage
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=429173
		 */
		it('test_global2', function() {
			editorContext.text = "(function() { window.alert('hi'); }()); window.setTimeout(); window.confirm('florp');";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(40, 41)).then(function(results) {
				assertOccurrences(results, [{start:14, end:20}, {start:40, end:46}, {start: 61, end: 67}]);
			});
		});
		
		/**
		 * Tests global usage
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=429173
		 */
		it('test_global3', function() {
			editorContext.text = "(function() { window.alert('hi'); }()); window.setTimeout(); window.confirm('florp');";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(61, 62)).then(function(results) {
				assertOccurrences(results, [{start:14, end:20}, {start:40, end:46}, {start: 61, end: 67}]);
			});
		});
		
		/**
		 * Tests usage inside of a non-defining scope
		 * Everything should be marked, no matter which is selected
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=445410
		 */
		it('test_nonDefiningScope1', function() {
			editorContext.text = "f(); function g(){ f(); } function f(){} function h(){ f(); } f();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(1,1)).then(function(results) {
				assertOccurrences(results, [{start:0, end:1}, {start:19, end:20}, {start: 35, end: 36}, {start: 55, end: 56}, {start: 62, end: 63}]);
			});
		});
		
		/**
		 * Tests usage inside of a non-defining scope
		 * Everything should be marked, no matter which is selected
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=445410
		 */
		it('test_nonDefiningScope2', function() {
			editorContext.text = "f(); function g(){ f(); } function f(){} function h(){ f(); } f();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(20,20)).then(function(results) {
				assertOccurrences(results, [{start:0, end:1}, {start:19, end:20}, {start: 35, end: 36}, {start: 55, end: 56}, {start: 62, end: 63}]);
			});
		});
		
		/**
		 * Tests usage inside of a non-defining scope
		 * Everything should be marked, no matter which is selected
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=445410
		 */
		it('test_nonDefiningScope3', function() {
			editorContext.text = "f(); function g(){ f(); } function f(){} function h(){ f(); } f();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(35,35)).then(function(results) {
				assertOccurrences(results, [{start:0, end:1}, {start:19, end:20}, {start: 35, end: 36}, {start: 55, end: 56}, {start: 62, end: 63}]);
			});
		});
		
		/**
		 * Tests usage inside of a non-defining scope
		 * Everything should be marked, no matter which is selected
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=445410
		 */
		it('test_nonDefiningScope4', function() {
			editorContext.text = "f(); function g(){ f(); } function f(){} function h(){ f(); } f();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(55,55)).then(function(results) {
				assertOccurrences(results, [{start:0, end:1}, {start:19, end:20}, {start: 35, end: 36}, {start: 55, end: 56}, {start: 62, end: 63}]);
			});
		});
		
		/**
		 * Tests usage inside of a non-defining scope
		 * Everything should be marked, no matter which is selected
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=445410
		 */
		it('test_nonDefiningScope5', function() {
			editorContext.text = "f(); function g(){ f(); } function f(){} function h(){ f(); } f();";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(62,63)).then(function(results) {
				assertOccurrences(results, [{start:0, end:1}, {start:19, end:20}, {start: 35, end: 36}, {start: 55, end: 56}, {start: 62, end: 63}]);
			});
		});
		
		/**
		 * Tests usage inside of a non-defining scope and that it doesn't conflict with the global occurrence list
		 * Everything should be marked, no matter which is selected
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=445410
		 */
		it('test_nonDefiningScopeNonGlobal', function() {
			editorContext.text = "function a() { f(); function g(){ f(); } function f(){} function h(){ f(); } f(); }";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(78,78)).then(function(results) {
				assertOccurrences(results, [{start:15, end:16}, {start:34, end:35}, {start: 50, end: 51}, {start: 70, end: 71}, {start: 77, end: 78}]);
			});
		});
		
		/**
		 * Tests selections inside member expressions and whether they should be object property checks
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=448543
		 */
		it('test_memberExpressionAsObjectProp1', function() {
			editorContext.text = "var a = {a: function a(){ var that = this; that.b(); return function() { that.b(); } }, b: function b(){} };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(4,4)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}]);
			});
		});
		
		/**
		 * Tests selections inside member expressions and whether they should be object property checks
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=448543
		 */
		it('test_memberExpressionAsObjectProp2', function() {
			editorContext.text = "var a = {a: function a(){ var that = this; that.b(); return function() { that.b(); } }, b: function b(){} };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(9,10)).then(function(results) {
				assertOccurrences(results, [{start:9, end:10}, {start:21, end:22}]);
			});
		});
		
		/**
		 * Tests selections inside member expressions and whether they should be object property checks
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=448543
		 */
		it('test_memberExpressionAsObjectProp3', function() {
			editorContext.text = "var a = {a: function a(){ var that = this; that.b(); return function() { that.b(); } }, b: function b(){} };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(32,32)).then(function(results) {
				assertOccurrences(results, [{start:30, end:34}, {start:43, end:47}, {start: 73, end: 77}]);
			});
		});
		
		/**
		 * Tests selections inside member expressions and whether they should be object property checks
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=448543
		 */
		it('test_memberExpressionAsObjectProp4', function() {
			editorContext.text = "var a = {a: function a(){ var that = this; that.b(); return function() { that.b(); } }, b: function b(){} };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(75,83)).then(function(results) {
				assertOccurrences(results, [{start:30, end:34}, {start:43, end:47}, {start: 73, end: 77}]);
			});
		});
		
		/**
		 * Tests selections inside member expressions and whether they should be object property checks
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=448543
		 */
		it('test_memberExpressionAsObjectProp5', function() {
			editorContext.text = "var a = {a: function a(){ var that = this; that.b(); return function() { that.b(); } }, b: function b(){} };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(48,49)).then(function(results) {
				assertOccurrences(results, [{start:48, end:49}, {start:78, end:79}, {start: 88, end: 89}, {start: 100, end: 101}]);
			});
		});
		
		/**
		 * Tests selections inside member expressions and whether they should be object property checks
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=448543
		 */
		it('test_memberExpressionAsObjectProp6', function() {
			editorContext.text = "var a = {a: function a(){ var that = this; that.b(); return function() { that.b(); } }, b: function b(){} };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(78,78)).then(function(results) {
				assertOccurrences(results, [{start:48, end:49}, {start:78, end:79}, {start: 88, end: 89}, {start: 100, end: 101}]);
			});
		});
		
		/**
		 * Tests selections inside member expressions and whether they should be object property checks
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=448543
		 */
		it('test_memberExpressionAsObjectProp7', function() {
			editorContext.text = "var a = {a: function a(){ var that = this; that.b(); return function() { that.b(); } }, b: function b(){} };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(88,88)).then(function(results) {
				assertOccurrences(results, [{start:48, end:49}, {start:78, end:79}, {start: 88, end: 89}, {start: 100, end: 101}]);
			});
		});
		
		/**
		 * Tests selections inside member expressions and whether they should be object property checks
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=448543
		 */
		it('test_memberExpressionAsObjectProp8', function() {
			editorContext.text = "var a = {a: function a(){ var that = this; that.b(); return function() { that.b(); } }, b: function b(){} };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(100,101)).then(function(results) {
				assertOccurrences(results, [{start:48, end:49}, {start:78, end:79}, {start: 88, end: 89}, {start: 100, end: 101}]);
			});
		});
		
		/**
		 * Tests selections inside a computed property identifer are not treated as member expressions
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=452161
		 */
		it('test_computedObjectProperty1', function() {
			editorContext.text = "var x = {a: {}, b: function(a) {var c = arr[a];} };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(9,10)).then(function(results) {
				assertOccurrences(results, [{start:9, end:10}]);
			});
		});
		
		/**
		 * Tests selections inside a computed property identifer are not treated as member expressions
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=452161
		 */
		it('test_computedObjectProperty2', function() {
			editorContext.text = "var x = {a: {}, b: function(a) {var c = arr[a];} };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(28,29)).then(function(results) {
				assertOccurrences(results, [{start:28, end:29}, {start:44, end:45}]);
			});
		});
		
		/**
		 * Tests selections inside a computed property identifer are not treated as member expressions
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=452161
		 */
		it('test_computedObjectProperty3', function() {
			editorContext.text = "var x = {a: {}, b: function(a) {var c = arr[a];} };";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(44,45)).then(function(results) {
				assertOccurrences(results, [{start:28, end:29}, {start:44, end:45}]);
			});
		});
		
		/**
		 * Tests that expression statements are marked as occurrences
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=453337
		 */
		it('test_expressionStatements1', function() {
			editorContext.text = "var a; a; a=1; a;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(4,4)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:7, end:8}, {start:10, end:11}, {start:15, end:16}]);
			});
		});
		
		/**
		 * Tests that expression statements are marked as occurrences
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=453337
		 */
		it('test_expressionStatements2', function() {
			editorContext.text = "var a; a; a=1; a;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(8,8)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:7, end:8}, {start:10, end:11}, {start:15, end:16}]);
			});
		});
		
		/**
		 * Tests that expression statements are marked as occurrences
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=453337
		 */
		it('test_expressionStatements3', function() {
			editorContext.text = "var a; a; a=1; a;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(10,11)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:7, end:8}, {start:10, end:11}, {start:15, end:16}]);
			});
		});
		
		/**
		 * Tests that expression statements are marked as occurrences
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=453337
		 */
		it('test_expressionStatements4', function() {
			editorContext.text = "var a; a; a=1; a;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(15,16)).then(function(results) {
				assertOccurrences(results, [{start:4, end:5}, {start:7, end:8}, {start:10, end:11}, {start:15, end:16}]);
			});
		});
		
		/**
		 * Tests that expression statements are marked as occurrences
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=453337
		 */
		it('test_expressionStatementsHoisting1', function() {
			editorContext.text = "a; var a;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(0,1)).then(function(results) {
				assertOccurrences(results, [{start:0, end:1}, {start:7, end:8}]);
			});
		});
		
		/**
		 * Tests that expression statements are marked as occurrences
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=453337
		 */
		it('test_expressionStatementsHoisting2', function() {
			editorContext.text = "a; var a;";
			return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(7,7)).then(function(results) {
				assertOccurrences(results, [{start:0, end:1}, {start:7, end:8}]);
			});
		});
		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=473861
		 * @since 10.0
		 */
		it('should not mutate the AST 1', function() {
			editorContext.text = "switch(tag.title) {case 'name': {tag.name;break;}case 'return': {tag.description;break;}}";
			return astManager.getAST(editorContext).then(function(ast) {
				var config = { rules: {} };
    			config.rules['no-fallthrough'] = 1;
				ESLint.verify(ast, config);
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(34, 34)).then(function(results) {
					assertOccurrences(results, [{start:7, end:10}, {start:33, end:36}, {start:65, end:68}]);
				});
			});
		});
		describe('ES6 Occurrences Tests', function() {
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=471011
			 * @since 10.0
			 */
			it('arrow function expression 1', function() {
				editorContext.text = "n => {n.length;}";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(0,1)).then(function(results) {
					assertOccurrences(results, [{start:0, end:1}, {start:6, end:7}]);
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=471011
			 * @since 10.0
			 */
			it('arrow function expression 2', function() {
				editorContext.text = "var n = 10; n => {n.length;}";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(12,13)).then(function(results) {
					assertOccurrences(results, [{start:12, end:13}, {start:18, end:19}]);
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=471011
			 * @since 10.0
			 */
			it('arrow function expression 3', function() {
				editorContext.text = "n => f => {n.length;}";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(11,12)).then(function(results) {
					assertOccurrences(results, [{start:0, end:1}, {start:11, end:12}]);
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=471011
			 * @since 10.0
			 */
			it('arrow function expression 4', function() {
				editorContext.text = "var n = 'hello'; n => f => {n.length;}";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(17,18)).then(function(results) {
					assertOccurrences(results, [{start:17, end:18}, {start:28, end:29}]);
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=471011
			 * @since 10.0
			 */
			it('arrow function expression 5', function() {
				editorContext.text = "var n = []; n.map(n => {n.length;});";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(18,18)).then(function(results) {
					assertOccurrences(results, [{start:18, end:19}, {start:24, end:25}]);
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=471011
			 * @since 10.0
			 */
			it('arrow function expression 6', function() {
				editorContext.text = "var n = []; n.map(n => {n.length;});";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(12, 12)).then(function(results) {
					assertOccurrences(results, [{start:4, end:5}, {start:12, end:13}]);
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=471011
			 * @since 10.0
			 */
			it('arrow function expression 7', function() {
				editorContext.text = "var n = []; n.map(n => n => {n.length;});";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(12, 12)).then(function(results) {
					assertOccurrences(results, [{start:4, end:5}, {start:12, end:13}]);
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=471011
			 * @since 10.0
			 */
			it('arrow function expression 8', function() {
				editorContext.text = "var n = []; n.map(n => n => {n.length;});";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(24, 24)).then(function(results) {
					assertOccurrences(results, [{start:23, end:24}, {start:29, end:30}]);
				});
			});
		});
		describe('Define and Require Statement Occurrences Tests', function() {
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=451957
			 * @since 10.0
			 */
			it('Unnamed Define statement 1', function() {
				editorContext.text = "define(['A', 'B'], function (a, b) { var x = a; var y = b; });";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(10,10)).then(function(results) {
					assertOccurrences(results, [{start:8, end:11}, {start:29, end:30}, {start:45, end:46}]);
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=451957
			 * @since 10.0
			 */
			it('Unnamed Define statement 2', function() {
				editorContext.text = "define(['A', 'B'], function (a, b) { var x = a; var y = b; });";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(29,29)).then(function(results) {
					assertOccurrences(results, [{start:8, end:11}, {start:29, end:30}, {start:45, end:46}]);
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=451957
			 * @since 10.0
			 */
			it('Unnamed Define statement 3', function(callback) {
				var obj = setup({
					buffer: "define(['A', 'B'], function (a, b) { var x = a; var y = b; });",
					selection: {
						start: 46,
						end: 46
					},
					callback: callback
				});
				// TODO This functionality depends on having node.parent which is currently added to the AST by ESLint
				return obj.validator.computeProblems(obj.editorContext).then(
					function() {
						return obj.occurrences.computeOccurrences(obj.editorContext, obj.context).then(function(results) {
							assertOccurrences(results, [{start:8, end:11}, {start:29, end:30}, {start:45, end:46}]);
						});
					}, function (error) {
						testworker.getTestState().callback(error);
					});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=451957
			 * @since 10.0
			 */
			it('Unnamed Define statement 4', function() {
				editorContext.text = "define(['A', 'B'], function (a, b) { var x = a; var y = b; });";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(14,15)).then(function(results) {
					assertOccurrences(results, [{start:13, end:16}, {start:32, end:33}, {start:56, end:57}]);
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=451957
			 * @since 10.0
			 */
			it('Unnamed Define statement 5', function() {
				editorContext.text = "define(['A', 'B'], function (a, b) { var x = a; var y = b; });";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(33,33)).then(function(results) {
					assertOccurrences(results, [{start:13, end:16}, {start:32, end:33}, {start:56, end:57}]);
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=451957
			 * @since 10.0
			 */
			it('Unnamed Define statement 6', function() {
				editorContext.text = "define(['A', 'B'], function (a, b) { var x = a; var y = b; });";
				// TODO This functionality depends on having node.parent which is currently added to the AST by ESLint
				return validator.computeProblems(editorContext).then(function() {
					return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(56,56)).then(function(results) {
						assertOccurrences(results, [{start:13, end:16}, {start:32, end:33}, {start:56, end:57}]);
					});
				});
			});			
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=451957
			 * @since 10.0
			 */
			it('Named Define statement 1', function() {
				editorContext.text = "define('ABC', ['A', 'B'], function (a, b) { var x = a; var y = b; });";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(17,17)).then(function(results) {
					assertOccurrences(results, [{start:15, end:18}, {start:36, end:37}, {start:52, end:53}]);
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=451957
			 * @since 10.0
			 */
			it('Named Define statement 2', function() {
				editorContext.text = "define('ABC', ['A', 'B'], function (a, b) { var x = a; var y = b; });";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(37,37)).then(function(results) {
					assertOccurrences(results, [{start:15, end:18}, {start:36, end:37}, {start:52, end:53}]);
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=451957
			 * @since 10.0
			 */
			it('Named Define statement 3', function() {
				editorContext.text = "define('ABC', ['A', 'B'], function (a, b) { var x = a; var y = b; });";
				// TODO This functionality depends on having node.parent which is currently added to the AST by ESLint
				return validator.computeProblems(editorContext).then(function() {
					return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(52,53)).then(function(results) {
						assertOccurrences(results, [{start:15, end:18}, {start:36, end:37}, {start:52, end:53}]);
					});
				});

			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=451957
			 * @since 10.0
			 */
			it('Named Define statement 4', function() {
				editorContext.text = "define('ABC', ['A', 'B'], function (a, b) { var x = a; var y = b; });";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(21,21)).then(function(results) {
					assertOccurrences(results, [{start:20, end:23}, {start:39, end:40}, {start:63, end:64}]);
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=451957
			 * @since 10.0
			 */
			it('Named Define statement 5', function() {
				editorContext.text = "define('ABC', ['A', 'B'], function (a, b) { var x = a; var y = b; });";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(39,39)).then(function(results) {
					assertOccurrences(results, [{start:20, end:23}, {start:39, end:40}, {start:63, end:64}]);
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=451957
			 * @since 10.0
			 */
			it('Named Define statement 6', function() {
				editorContext.text = "define('ABC', ['A', 'B'], function (a, b) { var x = a; var y = b; });";
				// TODO This functionality depends on having node.parent which is currently added to the AST by ESLint
				return validator.computeProblems(editorContext).then(function() {
					return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(64,64)).then(function(results) {
						assertOccurrences(results, [{start:20, end:23}, {start:39, end:40}, {start:63, end:64}]);
					});
				});

			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=451957
			 * @since 10.0
			 */
			it('Mismatched Define statement 1', function() {
				editorContext.text = "define(['A', 'B'], function (a) { var x = a; var b = null; });";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(9,9)).then(function(results) {
					assertOccurrences(results, [{start:8, end:11}, {start:29, end:30}, {start:42, end:43}]);
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=451957
			 * @since 10.0
			 */
			it('Mismatched Define statement 2', function() {
				editorContext.text = "define(['A', 'B'], function (a) { var x = a; var b = null; });";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(29,29)).then(function(results) {
					assertOccurrences(results, [{start:8, end:11}, {start:29, end:30}, {start:42, end:43}]);
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=451957
			 * @since 10.0
			 */
			it('Mismatched Define statement 3', function() {
				editorContext.text = "define(['A', 'B'], function (a) { var x = a; var b = null; });";
				// TODO This functionality depends on having node.parent which is currently added to the AST by ESLint
				return validator.computeProblems(editorContext).then(function() {
					return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(43,43)).then(function(results) {
						assertOccurrences(results, [{start:8, end:11}, {start:29, end:30}, {start:42, end:43}]);
					});
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=451957
			 * @since 10.0
			 */
			it('Mismatched Define statement 4', function() {
				editorContext.text = "define(['A', 'B'], function (a) { var x = a; var b = null; });";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(14,14)).then(function(results) {
					assertOccurrences(results, []);
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=451957
			 * @since 10.0
			 */
			it('Mismatched Define statement 5', function() {
				editorContext.text = "define(['A', 'B'], function (a) { var x = a; var b = null; });";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(49,50)).then(function(results) {
					assertOccurrences(results, [{start:49, end:50}]);
				});
			});
			// TODO Require statements not supported yet
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=474816
			 * @since 10.0
			 */
			it('Require statement 1', function() {
				editorContext.text = "define(function (require) { var a = require('A'); });";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(20,20)).then(function(results) {
					assertOccurrences(results, [{start:17, end:24}, {start:36, end:43}]);
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=474816
			 * @since 10.0
			 */
			it('Require statement 2', function() {
				editorContext.text = "define(function (require) { var a = require('A'); });";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(36,36)).then(function(results) {
					assertOccurrences(results, [{start:17, end:24}, {start:36, end:43}]);
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=474816
			 * @since 10.0
			 */
			it.skip('Require statement 3', function() {
				editorContext.text = "define(function (require) { var a = require('A'); });";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(32,33)).then(function(results) {
					assertOccurrences(results, [{start:32, end:33}, {start:44, end:47}]);
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=474816
			 * @since 10.0
			 */
			it.skip('Require statement 4', function() {
				editorContext.text = "define(function (require) { var a = require('A'); });";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(45,45)).then(function(results) {
					assertOccurrences(results, [{start:32, end:33}, {start:44, end:47}]);
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=474816
			 * @since 10.0
			 */
			it.skip('Require with Define statement 1', function() {
				editorContext.text = "define(['require', 'A'], function (require) { var a = require('A'); });";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(21,21)).then(function(results) {
					assertOccurrences(results, [{start:20, end:21}, {start:50, end:51}, {start:62, end:65}]);
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=474816
			 * @since 10.0
			 */
			it.skip('Require with Define statement 1', function() {
				editorContext.text = "define(['require', 'A'], function (require) { var a = require('A'); });";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(50,50)).then(function(results) {
					assertOccurrences(results, [{start:20, end:21}, {start:50, end:51}, {start:62, end:65}]);
				});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=474816
			 * @since 10.0
			 */
			it.skip('Require with Define statement 1', function() {
				editorContext.text = "define(['require', 'A'], function (require) { var a = require('A'); });";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(63,63)).then(function(results) {
					assertOccurrences(results, [{start:20, end:21}, {start:50, end:51}, {start:62, end:65}]);
				});
			});
		});
		describe('HTML script block occurrences tests', function() {
			/**
			 * Tests computing occurrences from a script block in the <head> block
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=430299
			 */
			it('test_htmlHead1', function() {
			    editorContext.contentTypeId = 'text/html';
				editorContext.text = "<!DOCTYPE html><head><script>function f() {}</script></head><html></html>";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(39, 39, 'text/html')).then(function(results) {
					assertOccurrences(results, [{start:38, end:39}]);
				});
			});
			
			/**
			 * Tests computing occurrences from a script block in the <head> block
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=430299
			 */
			it('test_htmlHead2', function() {
			    editorContext.contentTypeId = 'text/html';
				editorContext.text = "<!DOCTYPE html><head><scRipt>function f() {}</script></head><html></html>";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(39, 39, 'text/html')).then(function(results) {
					assertOccurrences(results, [{start:38, end:39}]);
				});
			});
			
			/**
			 * Tests computing occurrences from a script block in the <head> block
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=430299
			 */
			it('test_htmlHead3', function() {
			    editorContext.contentTypeId = 'text/html';
				editorContext.text = "<!DOCTYPE html><head><scRipt  >function f() {}</script></head><html></html>";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(41, 41, 'text/html')).then(function(results) {
					assertOccurrences(results, [{start:40, end:41}]);
				});
			});
			
			/**
			 * Tests computing occurrences from a script block in the <head> block
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=430299
			 */
			it('test_htmlHeadMulti1', function() {
			    editorContext.contentTypeId = 'text/html';
				editorContext.text = "<!DOCTYPE html><head><script>function f() {}</script><script>function f() {}</script></head><html></html>";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(39, 39, 'text/html')).then(function(results) {
					assertOccurrences(results, [{start:38, end:39}, {start:70, end:71}]);
				});
			});
			
			/**
			 * Tests computing occurrences from a script block in the <head> block
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=430299
			 */
			it('test_htmlHeadMulti2', function() {
			    editorContext.contentTypeId = 'text/html';
				editorContext.text = "<!DOCTYPE html><head><scRipt>function f() {}</script><script>function f() {}</script></head><html></html>";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(39, 39, 'text/html')).then(function(results) {
					assertOccurrences(results, [{start:38, end:39}, {start:70, end:71}]);
				});
			});
			
			/**
			 * Tests computing occurrences from a script block in the <head> block
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=430299
			 */
			it('test_htmlHeadMulti3', function() {
			    editorContext.contentTypeId = 'text/html';
				editorContext.text = "<!DOCTYPE html><head><scRipt   >function f() {}</script><script>function f() {}</script></head><html></html>";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(42, 42, 'text/html')).then(function(results) {
					assertOccurrences(results, [{start:41, end:42}, {start:73, end:74}]);
				});
			});
			
			/**
			 * Tests computing occurrences from a script block in the <head> block
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=430299
			 */
			it('test_htmlHeadMulti4', function() {
			    editorContext.contentTypeId = 'text/html';
				editorContext.text = "<!DOCTYPE html><head><scRipt   >function f() {}</script><script>function f() {}</script></head><html></html>";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(74, 74, 'text/html')).then(function(results) {
					assertOccurrences(results, [{start:41, end:42}, {start:73, end:74}]);
				});
			});
			/**
			 * Tests support for occurrences inside embedded script blocks in HTML
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it('HTML script block - simple occurrences 1', function() {
				editorContext.text = "<html><head><script>var xx = 0; xx = 5;</script></head></html>";
				editorContext.contentTypeId = "text/html";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(25,25)).then(function(results) {
					assertOccurrences(results, [{start:24, end:26}, {start:32, end:34}]);
				});
			});
			/**
			 * Tests support for occurrences inside embedded script blocks in HTML
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it('HTML script block - simple occurrences 2', function() {
				editorContext.text = "<html><head><script>var xx = 0; xx = 5;</script></head></html>";
				editorContext.contentTypeId = "text/html";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(32,34)).then(function(results) {
					assertOccurrences(results, [{start:24, end:26}, {start:32, end:34}]);
				});
			});
			/**
			 * Tests support for occurrences inside embedded script blocks in HTML
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it('HTML script block - simple occurrences missing semi 1', function() {
				editorContext.text = "<html><head><script>var xx = 0; xx</script></head></html>";
				editorContext.contentTypeId = "text/html";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(24,24)).then(function(results) {
					assertOccurrences(results, [{start:24, end:26}, {start:32, end:34}]);
				});
			});
			/**
			 * Tests support for occurrences inside embedded script blocks in HTML
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it('HTML script block - simple occurrences missing semi 2', function() {
				editorContext.text = "<html><head><script>var xx = 0; xx</script></head></html>";
				editorContext.contentTypeId = "text/html";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(34,34)).then(function(results) {
					assertOccurrences(results, [{start:24, end:26}, {start:32, end:34}]);
				});
			});
			/**
			 * Tests support for occurrences inside embedded script blocks in HTML
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it('HTML script block - empty script block', function() {
				editorContext.text = "<html><head><script></script></head></html>";
				editorContext.contentTypeId = "text/html";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(20,20)).then(function(results) {
					assertOccurrences(results, []);
				});
			});
			/**
			 * Tests support for occurrences inside embedded script blocks in HTML
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it('HTML script block - multi block occurrences 1', function() {
				editorContext.text = "<html><head><script>var xx = 0; xx;</script></head><body><a>xx</a><script>xx;</script></body></html>";
				editorContext.contentTypeId = "text/html";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(26,26)).then(function(results) {
					assertOccurrences(results, [{start:24, end:26}, {start:32, end:34}, {start:74, end:76}]);
				});
			});
			/**
			 * Tests support for occurrences inside embedded script blocks in HTML
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it('HTML script block - multi block occurrences 2', function() {
				editorContext.text = "<html><head><script>var xx = 0; xx;</script></head><body><a>xx</a><script>xx;</script></body></html>";
				editorContext.contentTypeId = "text/html";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(34,34)).then(function(results) {
					assertOccurrences(results, [{start:24, end:26}, {start:32, end:34}, {start:74, end:76}]);
				});
			});
			/**
			 * Tests support for occurrences inside embedded script blocks in HTML
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it('HTML script block - multi block occurrences 3', function() {
				editorContext.text = "<html><head><script>var xx = 0; xx;</script></head><body><a>xx</a><script>xx;</script></body></html>";
				editorContext.contentTypeId = "text/html";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(74,76)).then(function(results) {
					assertOccurrences(results, [{start:24, end:26}, {start:32, end:34}, {start:74, end:76}]);
				});
			});
			/**
			 * Tests support for occurrences inside embedded script blocks in HTML
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it('HTML script block - multi block occurrences hoisting 1', function() {
				editorContext.text = "<html><head><script>xx;</script></head><body><a>xx</a><script>xx; var xx = 0;</script></body></html>";
				editorContext.contentTypeId = "text/html";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(21,21)).then(function(results) {
					assertOccurrences(results, [{start:20, end:22}, {start:62, end:64}, {start:70, end:72}]);
				});
			});
			/**
			 * Tests support for occurrences inside embedded script blocks in HTML
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it('HTML script block - multi block occurrences hoisting 2', function() {
				editorContext.text = "<html><head><script>xx;</script></head><body><a>xx</a><script>xx; var xx = 0;</script></body></html>";
				editorContext.contentTypeId = "text/html";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(62,62)).then(function(results) {
					assertOccurrences(results, [{start:20, end:22}, {start:62, end:64}, {start:70, end:72}]);
				});
			});
			/**
			 * Tests support for occurrences inside embedded script blocks in HTML
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it('HTML script block - multi block occurrences hoisting 3', function() {
				editorContext.text = "<html><head><script>xx;</script></head><body><a>xx</a><script>xx; var xx = 0;</script></body></html>";
				editorContext.contentTypeId = "text/html";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(71,72)).then(function(results) {
					assertOccurrences(results, [{start:20, end:22}, {start:62, end:64}, {start:70, end:72}]);
				});
			});
			/**
			 * Tests support for occurrences inside embedded script blocks in HTML
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it('HTML wrapped function call - script blocks show occurrences 1', function() {
				editorContext.text = '<html><head><script>this.xx = function(){};</script></head><body><a onclick="xx()">xx()</a></body></html>';
				editorContext.contentTypeId = "text/html";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(25,25)).then(function(results) {
					assertOccurrences(results, [{start:25, end:27}]);
				});
			});
			/**
			 * Tests support for occurrences inside embedded script blocks in HTML
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it('HTML wrapped function call - script blocks show occurrences 2', function() {
				editorContext.text = '<html><head><script>this.xx = function(){};</script></head><body><a onclick="xx()">xx()</a></body></html>';
				editorContext.contentTypeId = "text/html";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(77,77)).then(function(results) {
					assertOccurrences(results, [{start:77, end:79}]);
				});
			});
			/**
			 * Tests support for occurrences inside embedded script blocks in HTML
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it('HTML wrapped function call - script blocks show occurrences 3', function() {
				editorContext.text = '<html><head><script>var xx = function(){};</script></head><body><a onclick="xx()">xx()</a></body></html>';
				editorContext.contentTypeId = "text/html";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(24,24)).then(function(results) {
					assertOccurrences(results, [{start:24, end:26}, {start:76, end:78}]);
				});
			});
			/**
			 * Tests support for occurrences inside embedded script blocks in HTML
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it('HTML wrapped function call - script blocks show occurrences 4', function() {
				editorContext.text = '<html><head><script>var xx = function(){};</script></head><body><a onclick="xx()">xx()</a></body></html>';
				editorContext.contentTypeId = "text/html";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(76,76)).then(function(results) {
					assertOccurrences(results, [{start:24, end:26}, {start:76, end:78}]);
				});
			});
			/**
			 * Tests support for occurrences inside embedded script blocks in HTML
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it('HTML wrapped function call - occurrences ignore order 1', function() {
				editorContext.text = '<html><body><a onclick="xx()">xx()</a><script>this.xx = function(){};</script></body></html>';
				editorContext.contentTypeId = "text/html";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(25,25)).then(function(results) {
					assertOccurrences(results, [{start:24, end:26}]);
				});
			});
			/**
			 * Tests support for occurrences inside embedded script blocks in HTML
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it('HTML wrapped function call - occurrences ignore order 2', function() {
				editorContext.text = '<html><body><a onclick="xx()">xx()</a><script>this.xx = function(){};</script></body></html>';
				editorContext.contentTypeId = "text/html";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(51,53)).then(function(results) {
					assertOccurrences(results, [{start:51, end:53}]);
				});
			});
			/**
			 * Tests support for occurrences inside embedded script blocks in HTML
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it('HTML wrapped function call - occurrences ignore order 3', function() {
				editorContext.text = '<html><body><a onclick="xx()">xx()</a><script>var xx = function(){};</script></body></html>';
				editorContext.contentTypeId = "text/html";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(25,25)).then(function(results) {
					assertOccurrences(results, [{start:24, end:26}, {start:50, end:52}]);
				});
			});
			/**
			 * Tests support for occurrences inside embedded script blocks in HTML
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it('HTML wrapped function call - occurrences ignore order 4', function() {
				editorContext.text = '<html><body><a onclick="xx()">xx()</a><script>var xx = function(){};</script></body></html>';
				editorContext.contentTypeId = "text/html";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(50,52)).then(function(results) {
					assertOccurrences(results, [{start:24, end:26}, {start:50, end:52}]);
				});
			});
			/**
			 * Tests support for occurrences inside embedded script blocks in HTML
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=476592
			 * @since 10.0
			 */
			it('HTML wrapped function call - occurrences only inside blocks', function() {
				editorContext.text = '<html><body><a onclick="xx()">xx()</a><script>this.xx = function(){};</script></body></html>';
				editorContext.contentTypeId = "text/html";
				return obj.occurrences.computeOccurrences(obj.editorContext, obj.context(30,30)).then(function(results) {
					assertOccurrences(results, []);
				});
			});
			
		});
	});
});
