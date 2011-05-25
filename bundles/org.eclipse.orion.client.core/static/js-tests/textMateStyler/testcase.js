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
var testcase = (function(assert) {
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
	
	/** Does a setText() on the range [col1,col2) in the given line. */
	function changeLine(editor, text, lineIndex, col1, col2) {
		var lineStart = editor.getModel().getLineStart(lineIndex);
		editor.setText(text, lineStart+col1, lineStart+col2);
	}
	
	function arraysEqual(a, b, sameOrder) {
		if (a.length !== b.length) { return false; }
		for (var i=0; i < a.length; i++) {
			var item = a[i];
			var j = b.indexOf(item);
			if (j === -1 || (sameOrder && i !== j)) { return false; }		}
		return true;
	}
	
	function scope2Classes(/**String*/ scope) {
		return scope.split(".").map(function(seg, i, segs) {
				return segs.slice(0, i+1).join("-");
			});
	}

	/** @returns true if style corresponds exactly to the given scope. */
	function styleMatchesScope(/**eclipse.Style*/ style, /**String*/ scope) {
		var classes = style.styleClass.split(/\s+/);
		return arraysEqual(classes, scope2Classes(scope)); 
	}
	
	/**
	 * Fails if the {@link eclipse.StyleRange[]} ranges returned by running the styler on the line number
	 * <tt>lineIndex</tt> do not exactly match the expected result given in <tt>scopeRegions</tt>.
	 * @param {Array} scopeRegions Each element of scopeRegions is an Array with the elements:
	 *   [{Number} start, {Number} end, {String} scope, {String} text?]
	 *  where start and end are line-relative indices, and the last element (text) is optional.
	 */
	function assertLineScope(editor, styler, lineIndex, scopeRegions) {
		var lineText = editor.getModel().getLine(lineIndex);
		var lineStart = editor.getModel().getLineStart(lineIndex);
		var lineEnd = editor.getModel().getLineEnd(lineIndex);
		var lineStyleEvent = {lineIndex: lineIndex, lineText: lineText, lineStart: lineStart, lineEnd: lineEnd};
		editor.onLineStyle(lineStyleEvent);
		
		var styleRanges = lineStyleEvent.ranges;
		assert.ok(styleRanges !== null && styleRanges !== undefined, true, "lineStyleEvent.ranges exists");
		assert.equal(styleRanges.length, scopeRegions.length, "Line " + lineIndex + ": Number of styled regions matches");
		var ok, last;
		ok = dojo.every(scopeRegions, function(scopeRegion) {
				return dojo.some(styleRanges, function(styleRange) {
					var start = scopeRegion[0],
					    end = scopeRegion[1],
					    scope = scopeRegion[2],
					    text = scopeRegion[3];
					last = "start=" + start + " end=" + end + " scope=" + scope + (typeof(text) === "string" ? " text=" + text : "");
					return (styleRange.start === lineStart + start
						&& styleRange.end === lineStart + end
						&& styleMatchesScope(styleRange.style, scope)
						&& (typeof(text) !== "string" || text === editor.getText(styleRange.start, styleRange.end)));				});
			});
		
		var rangeStrs = dojo.map(lineStyleEvent.ranges, function(styleRange) {
				var start = styleRange.start - lineStart,
				    end = styleRange.end - lineStart,
				    nicerScope = styleRange.style.styleClass.split(" ").pop().replace(/-/g, "."); // make easier to read
				return "{start:" + start + ", end:" + end + ", scope:" + nicerScope + "}";
			});
		assert.ok(ok, "No StyleRange in line matched expected {" + last + "}. StyleRanges were [" + rangeStrs.join(",") + "]");
	}
	
	// Tests
	tests["test TextMateStyler - create TextMateStyler"] = makeTest(function(editor) {
		try {
			var styler = new orion.styler.TextMateStyler(editor, orion.styler.test.SampleGrammar);
			assert.ok(true, "true is false");
		} catch (e) {
			assert.ok(false, "Exception creating editor");
		}
	});
	
	tests["test TextMateStyler - style one line"] = makeTest(function(editor) {
		var styler = new orion.styler.TextMateStyler(editor, orion.styler.test.SampleGrammar);
		editor.setText("fizzer");
		
		// expect fi[z][z]er
		var invalidScopeName = orion.styler.test.SampleGrammar.repository.badZ.name;
		assertLineScope(editor, styler, 0, [
				[2, 3, invalidScopeName], // z
				[3, 4, invalidScopeName]  // z
			]);
	});
	
	tests["test TextMateStyler - style multiple lines"] = makeTest(function(editor) {
		var styler = new orion.styler.TextMateStyler(editor, orion.styler.test.SampleGrammar);
		var line0Text = "no_important_stuff_here",
		    line1Text = "    this    var    &&";
		setLines(editor, [line0Text, line1Text]);
		
		assertLineScope(editor, styler, 0, []);
		assertLineScope(editor, styler, 1, [
			[4, 8, "keyword.other.mylang"],				// this
			[12, 15, "keyword.other.mylang"],			// var
			[19, 21, "keyword.operator.logical.mylang"]	// &&
		]);
	});
	
	// test begin/end on single input line
	tests["test TextMateStyler - begin/end single line - subrule"] = makeTest(function(editor) {
		var styler = new orion.styler.TextMateStyler(editor, orion.styler.test.SampleBeginEndGrammar);
		var lines;
		
		// test subrule invalid.illegal.badcomment.mylang applied to "--"
		lines = [ "<!--a--a-->" ];
		setLines(editor, lines);
		assertLineScope(editor, styler, 0, [
			[0, 4, "punctuation.definition.comment.mylang"], // <!--
			[4, 5, "comment.block.mylang"], // a
			[5, 7, "invalid.illegal.badcomment.mylang"], // --
			[7, 8, "comment.block.mylang"], // a
			[8, 11, "punctuation.definition.comment.mylang"] // -->
		]);
	});
	
	tests["test TextMateStyler - begin/end 1 line - subrule exited"] = makeTest(function(editor) {
		var styler = new orion.styler.TextMateStyler(editor, orion.styler.test.SampleBeginEndGrammar);
		var lines;
		
		// Test that the rule assigning -- to "invalid.illegal.badcomment.mylang" only takes effect
		// inside the <!-- --> block and not outside it
		lines = [ "-- <!--a--b--> --" ];
		setLines(editor, lines);
		assertLineScope(editor, styler, 0, [
			[3, 7, "punctuation.definition.comment.mylang"], // <!--
			[7, 8, "comment.block.mylang"], // a
			[8, 10, "invalid.illegal.badcomment.mylang"], // --
			[10, 11, "comment.block.mylang"], // b
			[11, 14, "punctuation.definition.comment.mylang"] // -->
		]);
	});
	
	tests["test TextMateStyler - begin/end single line - name"] = makeTest(function(editor) {
		var styler = new orion.styler.TextMateStyler(editor, orion.styler.test.SampleBeginEndGrammar);
		var lines;
		
		// test that "name" of begin/end rule is applied to text between the delimiters
		lines = [ "<!--aaaaaa-->" ];
		setLines(editor, lines);
		assertLineScope(editor, styler, 0, [
			[0, 4,   "punctuation.definition.comment.mylang"], // <!--
			[4, 10,  "comment.block.mylang"], // aaaaaa
			[10, 13, "punctuation.definition.comment.mylang"] // -->
		]);
	});
	
	tests["test TextMateStyler - begin/end 2 lines - just delimiters"] = makeTest(function(editor) {
		var styler = new orion.styler.TextMateStyler(editor, orion.styler.test.SampleBeginEndGrammar);
		var lines;
		lines = [
			"<!--",
			"-->"
		];
		setLines(editor, lines);
		assertLineScope(editor, styler, 0, [ [0, 4, "punctuation.definition.comment.mylang"] ]); // <!--
		assertLineScope(editor, styler, 1, [ [0, 3, "punctuation.definition.comment.mylang"] ]); // -->
	});
		
	tests["test TextMateStyler - begin/end 2 lines - with content"] = makeTest(function(editor) {
		var styler = new orion.styler.TextMateStyler(editor, orion.styler.test.SampleBeginEndGrammar);
		var lines;
		lines = [
			"<!--a",
			"b-->"
		];
		setLines(editor, lines);
		assertLineScope(editor, styler, 0, [
			[0, 4, "punctuation.definition.comment.mylang"], // <!--
			[4, 5, "comment.block.mylang"]  // a
		]);
		assertLineScope(editor, styler, 1, [
			[0, 1, "comment.block.mylang"], // b
			[1, 4, "punctuation.definition.comment.mylang"] // -->
		]);
	});

	tests["test TextMateStyler - begin/end 3 lines - with leading/trailing content"] = makeTest(function(editor) {
		var styler = new orion.styler.TextMateStyler(editor, orion.styler.test.SampleBeginEndGrammar);
		var lines;
		lines = [
			"a<!--c",
			"commentc",
			"omment-->bb"
		];
		setLines(editor, lines);
		assertLineScope(editor, styler, 0, [
			[1, 5, "punctuation.definition.comment.mylang"], // <!--
			[5, 6, "comment.block.mylang"] // c
		]);
		assertLineScope(editor, styler, 1, [
			[0, 8, "comment.block.mylang"] // commentc
		]);
		assertLineScope(editor, styler, 2, [
			[0, 6, "comment.block.mylang"], // omment
			[6, 9, "punctuation.definition.comment.mylang"] // -->
		]);
	});
	
	// ************************************************************************************************
	// Styling after edits
	
	tests["test TextMateStyler - change inside region"] = makeTest(function(editor) {
		var styler = new orion.styler.TextMateStyler(editor, orion.styler.test.SampleBeginEndGrammar);
		var lines;
		lines = [
			"<!--",
			"a",
			"-->"
		];
		setLines(editor, lines);
		
		changeLine(editor, "xxxx", 1, 1, 1); // insert xxxx after a on line 1
		/*
		<!--
		axxxx
		-->
		*/
		assertLineScope(editor, styler, 0, [
			[0, 4, "punctuation.definition.comment.mylang"] // <!--
		]);
		assertLineScope(editor, styler, 1, [
			[0, 5, "comment.block.mylang"] // axxxx
		]);
		assertLineScope(editor, styler, 2, [
			[0, 3, "punctuation.definition.comment.mylang"] // -->
		]);
	});
	
	tests["test TextMateStyler - change that follows region"] = makeTest(function(editor) {
		var styler = new orion.styler.TextMateStyler(editor, orion.styler.test.SampleBeginEndGrammar);
		var lines;
		lines = [
			"<!--",
			"a",
			"-->"
		];
		setLines(editor, lines);
		
		changeLine(editor, "char", 2, 3, 3);
		/*
		<!--
		a
		-->char
		*/		assertLineScope(editor, styler, 0, [
			[0, 4, "punctuation.definition.comment.mylang"] // <!--
		]);
		assertLineScope(editor, styler, 1, [
			[0, 1, "comment.block.mylang"] // a
		]);
		assertLineScope(editor, styler, 2, [
			[0, 3, "punctuation.definition.comment.mylang"], // -->
			[3, 7, "storage.type.mylang"] // char
		]);
	});
	
	tests["test TextMateStyler - change that precedes region"] = makeTest(function(editor) {
		var styler = new orion.styler.TextMateStyler(editor, orion.styler.test.SampleBeginEndGrammar);
		var lines;
		lines = [
			"<!--",
			"a",
			"-->"
		];
		setLines(editor, lines);
		
		changeLine(editor, "char", 0, 0, 0);
		/*
		char<!--
		a
		-->
		*/
		assertLineScope(editor, styler, 0, [
			[0, 4, "storage.type.mylang", "char"],
			[4, 8, "punctuation.definition.comment.mylang", "<!--"]
		]);
		assertLineScope(editor, styler, 1, [
			[0, 1, "comment.block.mylang", "a"] // a
		]);
		assertLineScope(editor, styler, 2, [
			[0, 3, "punctuation.definition.comment.mylang", "-->"] // -->
		]);
	});
	
	// creates a new region by adding the start block
	tests["test TextMateStyler - change - add 'start'"] = makeTest(function(editor) {
		var styler = new orion.styler.TextMateStyler(editor, orion.styler.test.SampleBeginEndGrammar);
		setLines(editor, [
			"a",
			"-->"
		]);
		changeLine(editor, "char<!--", 0, 0, 0);
		
		/*
		char<!--a
		-->
		*/
		assertLineScope(editor, styler, 0, [
			[0, 4, "storage.type.mylang", "char"],
			[4, 8, "punctuation.definition.comment.mylang", "<!--"],
			[8, 9, "comment.block.mylang", "a"]
		]);
		assertLineScope(editor, styler, 1, [
			[0, 3, "punctuation.definition.comment.mylang", "-->"]
		]);
		// how to test that redrawLines() is called? ack
	}, false);
	
//	tests["test TextMateStyler - change - add 'end'"] = makeTest(function(editor) {
//		var styler = new orion.styler.TextMateStyler(editor, orion.styler.test.SampleBeginEndGrammar);
//		var lines;
//	});
//	
//	tests["test TextMateStyler - change - remove 'start'"] = makeTest(function(editor) {
//		var styler = new orion.styler.TextMateStyler(editor, orion.styler.test.SampleBeginEndGrammar);
//		var lines;
//	});
//	
//	tests["test TextMateStyler - change - remove 'end'"] = makeTest(function(editor) {
//		var styler = new orion.styler.TextMateStyler(editor, orion.styler.test.SampleBeginEndGrammar);
//		var lines;
//	});
	
//	tests["test TextMateStyler - grammar with unsupported regex feature"] = makeTest(function(editor) {
//		// expect Error
//	});
//	
//	tests["test TextMateStyler - grammar with other unsupported feature"] = makeTest(function(editor) {
//		// expect Error
//	});
	
	return tests;
}(orion.Assert));
