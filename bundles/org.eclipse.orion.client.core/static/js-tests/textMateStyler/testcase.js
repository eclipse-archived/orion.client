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
	
	function makeTest(testBody, doTearDown) {
		doTearDown = typeof(doTearDown) === "undefined" ? true : doTearDown;
		if (typeof(testBody) !== "function") { throw new Error("testBody should be a function"); }
		return function() {
			try {
				setUp();
				testBody();
			} finally {
				if (doTearDown) {
					tearDown();
				}
			}
		};
	}
	
	tests["test create styler"] = makeTest(function() {
		try {
			styler = new orion.styler.TextMateStyler(editor, orion.styler.test.SampleGrammar);
			assert.ok(true, "true is false");
		} catch (e) {
			assert.ok(false, "Exception creating editor");
		}
	});
	
	tests["test style matching 1 char"] = makeTest(function() {
		styler = new orion.styler.TextMateStyler(editor, orion.styler.test.SampleGrammar);
		editor.setText("fizz");
		// TEST: The z's should get "invalid-illegal-idontlikez-mylang"
		// grab style from editor -- how?
	}, false /* TEMP: don't teardown, so i can observe editor */);
	
//	tests["test style updater after model change"] = makeTest(function() {
//		// do whatever
//	});
//	
//	tests["test grammar with unsupported regex feature"] = makeTest(function() {
//		// expect Error
//	});
//	
//	tests["test grammar with other unsupported feature"] = makeTest(function() {
//		// expect Error
//	});
	
	return tests;
}(orion.Assert));
