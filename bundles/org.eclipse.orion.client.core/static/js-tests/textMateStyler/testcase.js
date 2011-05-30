/******************************************************************************* 
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation 
 ******************************************************************************/

/*jslint laxbreak:true*/
/*global eclipse orion dojo*/

/**
 * These tests require dojo
 */
define(["orion/assert","dojo", "orion/styler/textMateStyler", "testGrammars"], function(assert, dojo, mTextMateStyler, mTestGrammars) {
	var tests = {};
	
	/**
	 * @param {Function(editor)} testBody
	 * @param {Boolean} [doTearDown]
	 */
	function makeTest(testBody, doTearDown) {
		function createEditor() {
			var options = {parent: "editorDiv", readonly: true, stylesheet: ["test.css"]};
			return new eclipse.Editor(options);
		}
		
		/** Must be called after each test to remove editor from DOM */
		function tearDown(editor) {
			if (editor) { editor.destroy(); }
		}
		
		doTearDown = typeof(doTearDown) === "undefined" ? true : doTearDown;
		if (typeof(testBody) !== "function") { throw new Error("testBody must be a function"); }
		return function() {
			var editor;
			try {
				editor = createEditor();
				testBody(editor);
			} finally {
				if (doTearDown) {
					tearDown(editor);
				}
			}
		};
	}
	
	/** Sets the given lines as the editor text */
	function setLines(editor, /**String[] or varargs*/ lines) {
		if (typeof(lines) === "string") {
			lines = Array.prototype.slice.call(arguments, 1);
		}
		editor.setText(lines.join("\n"));
	}
	
	function arraysEqual(a, b, sameOrder) {
		if (a.length !== b.length) { return false; }
		for (var i=0; i < a.length; i++) {
			var item = a[i];
			var j = b.indexOf(item);
			if (j === -1 || (sameOrder && i !== j)) { return false; }		}
		return true;	}
	
	function scope2Classes(/**String*/ scope) {
		return scope.split(".").map(function(seg, i, segs) {
				return segs.slice(0, i+1).join("-");
			});	}

	/** @returns true if style corresponds exactly to the given scope. */
	function styleMatchesScope(/**eclipse.Style*/ style, /**String*/ scope) {
		var classes = style.styleClass.split(/\s+/);
		return arraysEqual(classes, scope2Classes(scope)); 
	}
	
	/**
	 * Fails if the {@link eclipse.StyleRange[]} returned by running the styler on the line number
	 * <tt>lineIndex</tt> do not exactly match the expected result given in <tt>scopeRegions</tt>.
	 * @param {Array} scopeRegions Each element is an Array with 3 elements:
	 *   [{Number} start, {Number} end, {String} scope] where start and end are line-relative indices.
	 */
	function assertLineScope(editor, styler, lineIndex, scopeRegions) {
		var lineText = editor.getModel().getLine(lineIndex);
		var lineStart = editor.getModel().getLineStart(lineIndex);
		var lineEnd = editor.getModel().getLineEnd(lineIndex);
		var lineStyleEvent = {lineIndex: lineIndex, lineText: lineText, lineStart: lineStart, lineEnd: lineEnd};
		editor.onLineStyle(lineStyleEvent);
		
		var styleRanges = lineStyleEvent.ranges;
		assert.ok(styleRanges !== null && styleRanges !== undefined, true, "lineStyleEvent.ranges exists");
		assert.equal(styleRanges.length, scopeRegions.length, "Number of styled regions matches");
		var ok, last;
		ok = dojo.every(scopeRegions, function(scopeRegion) {
				return dojo.some(styleRanges, function(styleRange) {
					last = "start: " + scopeRegion[0] + ", end: " + scopeRegion[1] + ", scope: " + scopeRegion[2];
					return (styleRange.start === lineStart + scopeRegion[0]
						&& styleRange.end === lineStart + scopeRegion[1]
						&& styleMatchesScope(styleRange.style, scopeRegion[2]));				});
			});
		
		var rangeStrs = dojo.map(lineStyleEvent.ranges, function(styleRange) {
				var start = styleRange.start - lineStart,
				    end = styleRange.end - lineStart;
				return "{start:" + start + ", end:" + end + ", className:" + styleRange.style.styleClass + "}";
			});
		assert.ok(ok, "No StyleRange in line matched expected {" + last + "}. StyleRanges were [" + rangeStrs.join(",") + "]");
	}
	
	// Tests
//	tests["test TextMateStyler create TextMateStyler"] = makeTest(function(editor) {
//		try {
//			var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleGrammar);
//			assert.ok(true, "true is false");
//		} catch (e) {
//			assert.ok(false, "Exception creating editor");
//		}
//	});
//	
//	tests["test TextMateStyler style one line"] = makeTest(function(editor) {
//		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleGrammar);
//		editor.setText("fizzer");
//		
//		// expect fi[z][z]er
//		var invalidScopeName = mTestGrammars.SampleGrammar.repository.badZ.name;
//		assertLineScope(editor, styler, 0, [
//				[2, 3, invalidScopeName], // z
//				[3, 4, invalidScopeName]  // z
//			]);
//	});
//	
//	tests["test TextMateStyler style multiple lines"] = makeTest(function(editor) {
//		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleGrammar);
//		var line0Text = "no_important_stuff_here",
//		    line1Text = "a this xxx && yyy var";
//		setLines(editor, [line0Text, line1Text]);
//		
//		assertLineScope(editor, styler, 0, []);
//		assertLineScope(editor, styler, 1, [
//			[2, 6, "keyword.other.mylang"],					// this
//			[11, 13, "keyword.operator.logical.mylang"],	// &&
//			[18, 21, "keyword.other.mylang"]				// var
//		]);
//	});
	
//	tests["test TextMateStyler styles updated after model change"] = makeTest(function(editor) {
//		// do whatever
//	});
//	
//	tests["test TextMateStyler grammar with unsupported regex feature"] = makeTest(function(editor) {
//		// expect Error
//	});
//	
//	tests["test TextMateStyler grammar with other unsupported feature"] = makeTest(function(editor) {
//		// expect Error
//	});
	
	return tests;
});
