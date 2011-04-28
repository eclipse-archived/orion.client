/******************************************************************************* 
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation 
 ******************************************************************************/

/*global eclipse orion dojo*/

// create editor
// create TextMateStyler
// change editor contents
// check styled regions

/**
 * These tests require dojo
 */
var testcase = (function(assert) {
	var tests = {};
	
	// All tests use these variables
	var editor, styler;
	
	function setUp() {
		var options = {parent: "editorDiv", readonly: true, stylesheet: ["test.css"]};
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
	
	/** Fails if node's CSS classes do not exactly match expectedClasses. */
	function assertHasClasses(/**DomNode*/ node, /**String[]*/ expectedClasses, /**String*/ msg_opt) {
		var actualClasses = node.className.split(/\s+/);
		var lastClass;
		var fail = false;
		fail = fail || (actualClasses.length !== expectedClasses.length);
		fail = fail || expectedClasses.some(function(clazz) {
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
	
	/** Sets the given lines as the editor text */
	function setLines(editor, /**String[] or varargs*/ lines) {
		if (typeof(lines) === "string") {
			lines = Array.prototype.slice.call(arguments, 1);
		}
		editor.setText(lines.join("\n"));
	}
	
	/** @returns {Number} Number of styled regions in the line */
	function numRegions(/**DomNode*/ lineNode) {
		// get the number of child <span>s but in IE & FF there's a bogus <span> </span> at the end of every line
		// FIXME this is brittle
		var childRegions = dojo.query("span", lineNode);
		return (dojo.isIE || dojo.isFF) ? childRegions.length-1 : childRegions.length;
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
	
	tests["test style one line"] = makeTest(function() {
		styler = new orion.styler.TextMateStyler(editor, orion.styler.test.SampleGrammar);
		editor.setText("fizzer");
		
		// FIXME: IE adds 1 extra node to each line??
		var lineNode = editor._getLineNode(0);
		assert.equal(numRegions(lineNode), 4, "4 regions"); // [fi][z][z][er]
		var z1 = lineNode.childNodes[1],
		    z2 = lineNode.childNodes[2];
		assert.equal(z1.textContent, "z", "child[1] text is z");
		assert.equal(z2.textContent, "z", "child[2] text is z");
		
		var invalidScopeName = orion.styler.test.SampleGrammar.repository.badZ.name;
		assertHasScope(z1, invalidScopeName, "1st z has the expected scope");
		assertHasScope(z2, invalidScopeName, "2nd z has the expected scope");
	});
	
	tests["test style multiple lines"] = makeTest(function() {
		styler = new orion.styler.TextMateStyler(editor, orion.styler.test.SampleGrammar);
		var line0Text = "no_important_stuff_here",
		    line1Text = "a this xxx && yyy var";
		setLines(editor, [line0Text, line1Text]);
		
		var line0 = editor._getLineNode(0),
		    line1 = editor._getLineNode(1);
		assert.equal(numRegions(line0), 1, "line0 has 1 region"); // [no_important_stuff_here]
		assert.equal(numRegions(line1), 6, "line1 has 6 regions"); // [a ][this][ xxx ][void][ yyy ][var]
		
		var span00 = line0.childNodes[0];
		assertHasScope(span00, "", "No style in line0");
		
		var span10 = line1.childNodes[0],
		    span11 = line1.childNodes[1],
		    span12 = line1.childNodes[2],
		    span13 = line1.childNodes[3],
		    span14 = line1.childNodes[4],
		    span15 = line1.childNodes[5];
	    assert.equal(span10.textContent, "a ",  "line1's region 0 is 'a '");
		assert.equal(span11.textContent, "this",  "line1's region 0 is 'this'");
		assert.equal(span12.textContent, " xxx ", "line1's region 1 is ' xxx '");
		assert.equal(span13.textContent, "&&",  "line1's region 2 is '&&'");
		assert.equal(span14.textContent, " yyy ", "line1's region 3 is ' yyy '");
		assert.equal(span15.textContent, "var",   "line1's region 4 is 'var'");
		assertHasScope(span10, "", "'a ' has correct scope");
		assertHasScope(span11, "keyword.other.mylang", "'this' has correct scope");
		assertHasScope(span12, "", "' xxx ' has correct scope");
		assertHasScope(span13, "keyword.operator.logical.mylang", "'&&' has correct scope");
		assertHasScope(span14, "", "' yyy ' has correct scope");
		assertHasScope(span15, "keyword.other.mylang", "'var' has correct scope");
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
