/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global console:true define*/
define([
	'orion/assert',
	'javascript/astManager',
	'orion/Deferred',
	'javascript/occurrences'
], function(Assert, ASTManager, Deferred, Occurrences) {
	
	var astManager = new ASTManager();
	var occurrences = new Occurrences.JavaScriptOccurrences(astManager);
	var editorContext = {
		text: "",
		getText: function() {
			return new Deferred().resolve(this.text);
		}
	};
	var context = {
		selection: {
			start:-1,
			end: -1
		}	
	};
		
	/**
	 * @name tearDown
	 * @description Resets the test state between runs, must explicitly be called per-test
	 * @function
	 * @public
	 */
	function tearDown() {
		editorContext.text = "";
		astManager.updated();
		context.selection.start = -1;
		context.selection.end = -1;
	};
	
	/**
	 * @name assertOccurrence
	 * @description Checks the given occurrence against the expected start and end to make sure it is marked correctly
	 * @function
	 * @public
	 * @param {Array} results The computed occurrence elements to check
	 * @param {Array} expected The array of expected start/end pairs
	 */
	function assertOccurrences(results, expected) {
		if(!results) {
			Assert.fail("The occurrence array cannot be null");
		}
		Assert.equal(results.length, expected.length, "The wrong number of occurrences was returned");
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
				Assert.fail("Found an unknown occurrence: [start "+results[k].start+"][end "+results[k].end+"]");
			}
		}
	};
	
	/**
	 * @name setContext
	 * @description Delegate helper to set and return the context
	 * @function
	 * @public
	 * @param {Number} start The start of the editor selection
	 * @param {Number} end The end of thhe editor selection
	 * @returns {Object} the modified context object
	 */
	function setContext(start, end) {
		context.selection.start = start;
		context.selection.end = end;
		return context;
	}
	
	var Tests = {};
		
	/**
	 * Tests a function declaration
	 */
	Tests.test_funcDeclaration1 = function() {
		editorContext.text = "function F1(p1, p2) {\n"+
				"\tvar out = p1;\n"+
				"};";
		return occurrences.computeOccurrences(editorContext, setContext(13, 13)).then(function(results) {
			try {
				//expected to fail until https://bugs.eclipse.org/bugs/show_bug.cgi?id=423634 is fixed
				assertOccurrences(results, [{start:12, end:14}, {start:33, end:35}]);
			}
			finally {
				tearDown();
			}
		});
	};
	
	/**
	 * Tests a function expression
	 */
	Tests.test_funcExpression1 = function() {
		editorContext.text = "var obj = {\n"+
				"\titem: function(p1, p2) {\n"+
				"\t\tvar out = p1;\n"+
				"\t}"+
				"};";
		return occurrences.computeOccurrences(editorContext, setContext(30, 30)).then(function(results) {
			try {
				//expected to fail until https://bugs.eclipse.org/bugs/show_bug.cgi?id=423634 is fixed
				assertOccurrences(results, [{start:28, end:30}, {start:50, end:52}]);
			}
			finally {
				tearDown();
			}
		});
	};
	
	/**
	 * Tests an object expression
	 */
	Tests.test_objExpression1 = function() {
		editorContext.text = "var object = {};"+
				"var newobject = object;";
		return occurrences.computeOccurrences(editorContext, setContext(5, 5)).then(function(results) {
			try {
				assertOccurrences(results, [{start:4, end:10}, {start:32, end:38}]);
			}
			finally {
				tearDown();
			}
		});
	};
		
	/**
	 * Tests nested function declarations
	 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423835
	 */
	Tests.test_nestedFuncDecl1 = function() {
		editorContext.text = "function f(p1) { function b(p1) { var p2 = p1; };};";
		return occurrences.computeOccurrences(editorContext, setContext(12, 12)).then(function(results) {
			try {
				assertOccurrences(results, [{start:11, end:13}]);
			}
			finally {
				tearDown();
			}
		});
	};
	
	/**
	 * Tests nested function declarations
	 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423835
	 */
	Tests.test_nestedFuncDecl2 = function() {
		editorContext.text = "function f(p1) { function b(p1) { var p2 = p1; };};";
		return occurrences.computeOccurrences(editorContext, setContext(29, 29)).then(function(results) {
			try {
				assertOccurrences(results, [{start:28, end:30}, {start:43, end:45}]);
			}
			finally {
				tearDown();
			}
		});
	};
	
	/**
	 * Tests nested function declarations
	 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423835
	 */
	Tests.test_nestedFuncDecl3 = function() {
		editorContext.text = "function f(p1) { function b(p1) { var p2 = p1; };};";
		return occurrences.computeOccurrences(editorContext, setContext(44, 44)).then(function(results) {
			try {
				assertOccurrences(results, [{start:28, end:30}, {start:43, end:45}]);
			}
			finally {
				tearDown();
			}
		});
	};
	
	/**
	 * Tests nested function expressions
	 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423835
	 */
	Tests.test_nestedFuncExpr1 = function() {
		editorContext.text = "var object = {one: function(p1) { function b(p1) { var p2 = p1; }; }};";
		return occurrences.computeOccurrences(editorContext, setContext(30, 30)).then(function(results) {
			try {
				assertOccurrences(results, [{start:28, end:30}]);
			}
			finally {
				tearDown();
			}
		});
	};
	
	/**
	 * Tests nested function expressions
	 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423835
	 */
	Tests.test_nestedFuncExpr2 = function() {
		editorContext.text = "var object = {one: function(p1) { function b(p1) { var p2 = p1; }; }};";
		return occurrences.computeOccurrences(editorContext, setContext(47, 47)).then(function(results) {
			try {
				assertOccurrences(results, [{start:45, end:47}, {start:60, end:62}]);
			}
			finally {
				tearDown();
			}
		});
	};
	
	/**
	 * Tests nested function expressions
	 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423835
	 */
	Tests.test_nestedFuncExpr3 = function() {
		editorContext.text = "var object = {one: function(p1) { function b(p1) { var p2 = p1; }; }};";
		return occurrences.computeOccurrences(editorContext, setContext(62, 62)).then(function(results) {
			try {
				assertOccurrences(results, [{start:60, end:62}, {start:45, end:47}]);
			}
			finally {
				tearDown();
			}
		});
	};
	
	/**
	 * Tests nested function expressions
	 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423835
	 */
	Tests.test_nestedFuncExpr4 = function() {
		editorContext.text = "function b(p1) { var object = {one: function(p1) {var p2 = p1; } };};";
		return occurrences.computeOccurrences(editorContext, setContext(13, 13)).then(function(results) {
			try {
				assertOccurrences(results, [{start:11, end:13}]);
			}
			finally {
				tearDown();
			}
		});
	};
	
	/**
	 * Tests nested function expressions
	 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423835
	 */
	Tests.test_nestedFuncExpr5 = function() {
		editorContext.text = "function b(p1) { var object = {one: function(p1) {var p2 = p1; } };};";
		return occurrences.computeOccurrences(editorContext, setContext(47, 47)).then(function(results) {
			try {
				assertOccurrences(results, [{start:45, end:47}, {start:59, end:61}]);
			}
			finally {
				tearDown();
			}
		});
	};
	
	/**
	 * Tests nested function expressions
	 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423835
	 */
	Tests.test_nestedFuncExpr6 = function() {
		editorContext.text = "function b(p1) { var object = {one: function(p1) {var p2 = p1; } };};";
		return occurrences.computeOccurrences(editorContext, setContext(61, 61)).then(function(results) {
			try {
				assertOccurrences(results, [{start:45, end:47}, {start:59, end:61}]);
			}
			finally {
				tearDown();
			}
		});
	};
	
	/**
	 * Tests nested function expressions
	 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423835
	 */
	Tests.test_nestedFuncExpr7 = function() {
		editorContext.text = "var out = function(p1) {var inner = {object : {one: function(p1) {var p2 = p1;}}};};";
		return occurrences.computeOccurrences(editorContext, setContext(21, 21)).then(function(results) {
			try {
				assertOccurrences(results, [{start:19, end:21}]);
			}
			finally {
				tearDown();
			}
		});
	};
	
	/**
	 * Tests nested function expressions
	 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423835
	 */
	Tests.test_nestedFuncExpr8 = function() {
		editorContext.text = "var out = function(p1) {var inner = {object : {one: function(p1) {var p2 = p1;}}};};";
		return occurrences.computeOccurrences(editorContext, setContext(63, 63)).then(function(results) {
			try {
				assertOccurrences(results, [{start:61, end:63}, {start:75, end:77}]);
			}
			finally {
				tearDown();
			}
		});
	};
	
	/**
	 * Tests nested function expressions
	 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=423835
	 */
	Tests.test_nestedFuncExpr9 = function() {
		editorContext.text = "var out = function(p1) {var inner = {object : {one: function(p1) {var p2 = p1;}}};};";
		return occurrences.computeOccurrences(editorContext, setContext(77, 77)).then(function(results) {
			try {
				assertOccurrences(results, [{start:61, end:63}, {start:75, end:77}]);
			}
			finally {
				tearDown();
			}
		});
	};

	/**
	 * Tests function decls with same named params / vars in same scope
	 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=424951
	 */
	Tests.test_functionDeclUse1 = function() {
		editorContext.text = "var foo = function() {function f(prob) {} function f2() {var prob = {};	prob.foo = null;return prob;}};";
		return occurrences.computeOccurrences(editorContext, setContext(36, 36)).then(function(results) {
			try {
				assertOccurrences(results, [{start:33, end:37}]);
			}
			finally {
				tearDown();
			}
		});
	};
	
	/**
	 * Tests function decls with same named params / vars in same scope
	 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=424951
	 */
	Tests.test_functionDeclUse2 = function() {
		editorContext.text = "var foo = function() {function f(prob) {} function f2() {var prob = {};	prob.foo = null;return prob;}};";
		return occurrences.computeOccurrences(editorContext, setContext(64, 64)).then(function(results) {
			try {
				assertOccurrences(results, [{start:61, end:65}, {start:72, end:76}, {start:95, end:99}]);
			}
			finally {
				tearDown();
			}
		});
	};
	
	/**
	 * Tests function decls with same named params / vars in same scope
	 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=424951
	 */
	Tests.test_functionDeclUse3 = function() {
		editorContext.text = "var foo = function() {function f(prob) {} function f2() {var prob = {};	prob.foo = null;return prob;}};";
		return occurrences.computeOccurrences(editorContext, setContext(75, 75)).then(function(results) {
			try {
				assertOccurrences(results, [{start:61, end:65}, {start:72, end:76}, {start:95, end:99}]);
			}
			finally {
				tearDown();
			}
		});
	};
	
	/**
	 * Tests function decls with same named params / vars in same scope
	 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=424951
	 */
	Tests.test_functionDeclUse4 = function() {
		editorContext.text = "var foo = function() {function f(prob) {} function f2() {var prob = {};	prob.foo = null;return prob;}};";
		return occurrences.computeOccurrences(editorContext, setContext(98, 98)).then(function(results) {
			try {
				assertOccurrences(results, [{start:61, end:65}, {start:72, end:76}, {start:95, end:99}]);
			}
			finally {
				tearDown();
			}
		});
	};
	
	/**
	 * Tests function decls with same named params / vars in same scope
	 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=424951
	 */
	Tests.test_functionDeclUse5 = function() {
		editorContext.text = "var bar = function() {function MyObject() {}; var o = {i: function() {return new MyObject().foo;}};return MyObject;};";
		return occurrences.computeOccurrences(editorContext, setContext(36, 36)).then(function(results) {
			try {
				assertOccurrences(results, [{start:31, end:39}, {start:81, end:89}, {start:106, end:114}]);
			}
			finally {
				tearDown();
			}
		});
	};
	
	/**
	 * Tests function decls with same named params / vars in same scope
	 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=424951
	 */
	Tests.test_functionDeclUse6 = function() {
		editorContext.text = "var bar = function() {function MyObject() {}; var o = {i: function() {return new MyObject().foo;}};return MyObject;};";
		return occurrences.computeOccurrences(editorContext, setContext(86, 86)).then(function(results) {
			try {
				assertOccurrences(results, [{start:31, end:39}, {start:81, end:89}, {start:106, end:114}]);
			}
			finally {
				tearDown();
			}
		});
	};
	
	/**
	 * Tests function decls with same named params / vars in same scope
	 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=424951
	 */
	Tests.test_functionDeclUse7 = function() {
		editorContext.text = "var bar = function() {function MyObject() {}; var o = {i: function() {return new MyObject().foo;}};return MyObject;};";
		return occurrences.computeOccurrences(editorContext, setContext(111, 111)).then(function(results) {
			try {
				assertOccurrences(results, [{start:31, end:39}, {start:81, end:89}, {start:106, end:114}]);
			}
			finally {
				tearDown();
			}
		});
	};
	return Tests;
});