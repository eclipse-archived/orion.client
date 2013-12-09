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
		
	return Tests;
});