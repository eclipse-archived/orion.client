/******************************************************************************* 
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation 
 ******************************************************************************/

/*global eclipse orion*/

// create editor
// create TextMateStyler
// change editor contents
// check styled regions

var testcase = (function(assert) {
	var tests = {};
	
	// All tests use these variables
	var editor, styler;
	
	function setUp() {
		var options = {parent: "editorDiv"};
		editor = new eclipse.Editor(options);
	}
	
	function tearDown() {
		editor.destroy();
		editor = null;
		styler = null;
	}
	
	function makeTest(testBody) {
		if (typeof(testBody) !== "function") { throw new Error("testBody should be a function"); }
		return function() {
			try {
				setUp();
				testBody();
			} finally {
//				tearDown();
			}
		};
	}
	
//	tests["test create styler"] = makeTest(function() {
//		try {
//			styler = new orion.styler.TextMateStyler(editor, orion.styler.test.SampleGrammar);
//			assert.ok(true, "true is false");
//		} catch (e) {
//			assert.ok(false, "Exception creating editor");
//		}
//	});
	
	tests["test style matching 1 char"] = makeTest(function() {
		styler = new orion.styler.TextMateStyler(editor, orion.styler.test.SampleGrammar);
		editor.setText("fizz");
		// TEST: The z's should get "invalid.illegal.idontlikez.mylang"
		
		var x;
		debugger;
	});
	
//	tests["test style updater after model change"] = function() {
//		// do whatever
//	};
//	
//	tests["test grammar with unsupported regex feature"] = function() {
//		// expect Error
//	};
//	
//	tests["test grammar with other unsupported feature"] = function() {
//		// expect Error
//	};
	
	return tests;
}(orion.Assert));
