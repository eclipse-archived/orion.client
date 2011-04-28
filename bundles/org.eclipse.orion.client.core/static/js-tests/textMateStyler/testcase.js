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
		if (typeof(testBody) !== "function") { throw new Error("testBody must be a function"); }
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
	
	/** Fails if node does not have one of the expectedClasses. */
	function assertHasClasses(/**DomNode*/ node, /**String[]*/ expectedClasses, /**String*/ msg_opt) {
		var actualClasses = node.className.split(/\s+/);
		var lastClass;
		var fail = expectedClasses.some(function(clazz) {
				lastClass = clazz;
				return actualClasses.indexOf(clazz) === -1;
			});
		if (fail) {
			msg_opt = msg_opt || ("Node " + node.textContent + " has class '" + lastClass + "' among '" + node.className + "'");
			assert.ok(false, msg_opt);
		}
	}
	
	/** Fails if node's CSS classes don't correspond exactly to the given scope. */
	function assertHasScope(/**DomNode*/ node, /**String*/ scope, /**String*/ msg_opt) {
		assertHasClasses(node, scope.split(".").map(
				function(seg, i, segs) {
					return segs.slice(0, i+1).join("-");
				}),  msg_opt);
	}

	// Tests
	tests["test create styler"] = makeTest(function() {
		try {
			styler = new orion.styler.TextMateStyler(editor, orion.styler.test.SampleGrammar);
			assert.ok(true, "true is false");
		} catch (e) {
			assert.ok(false, "Exception creating editor");
		}
	});
	
	tests["test style 2 z's"] = makeTest(function() {
		styler = new orion.styler.TextMateStyler(editor, orion.styler.test.SampleGrammar);
		editor.setText("fizzer");
		
		var lineNode = editor._getLineNode(0);
		assert.equal(lineNode.childElementCount, 4, "4 regions"); // [fi][z][z][er]
		var z1 = lineNode.childNodes[1],
		    z2 = lineNode.childNodes[2];
		assert.equal(z1.textContent, "z", "child[1] text is z");
		assert.equal(z2.textContent, "z", "child[2] text is z");
		
		var invalidScopeName = orion.styler.test.SampleGrammar.repository.badZ.name;
		assertHasScope(z1, invalidScopeName, "1st z has the expected scope");
		assertHasScope(z2, invalidScopeName, "2nd z has the expected scope");
	});
	
//	tests["test style update after model change"] = makeTest(function() {
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
