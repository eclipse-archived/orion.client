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
/*global define eclipse */

define(["dojo", "orion/assert", "orion/editor/textMateStyler", "testGrammars"],
		function(dojo, assert, mTextMateStyler, mTestGrammars) {
	var tests = {};
	
	/**
	 * @param {Function(editor)} testBody
	 * @param {Boolean} [doTearDown]
	 */
	function makeTest(testBody, doTearDown) {
		function createEditor() {
			var options = {parent: "editorDiv", readonly: true, stylesheet: ["test.css"]};
			return new orion.textview.TextView(options);
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
		assert.ok(ok, "No StyleRange in Line " + lineIndex + " matched expected {" + last + "}. StyleRanges were [" + rangeStrs.join(",") + "]");
	}
	
	
	
	
	
	
	
	// ************************************************************************************************
	// Test creation
	
	tests["test TextMateStyler - create"] = makeTest(function(editor) {
		try {
			var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleGrammar);
			assert.ok(true, "true is false");
		} catch (e) {
			assert.ok(false, "Exception creating editor");
		}
	});
	
	// ************************************************************************************************
	// Test initial styling of buffer
	
	tests["test TextMateStyler - initial - style one line"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleGrammar);
		editor.setText("fizzer");
		
		// expect fi[z][z]er
		var invalidScopeName = mTestGrammars.SampleGrammar.repository.badZ.name;
		assertLineScope(editor, styler, 0, [
				[2, 3, invalidScopeName], // z
				[3, 4, invalidScopeName]  // z
			]);
	});
	
	tests["test TextMateStyler - initial - style multiple lines"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleGrammar);
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
	tests["test TextMateStyler - initial - begin/end single line - subrule"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleBeginEndGrammar);
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
	
	tests["test TextMateStyler - initial - begin/end 1 line - subrule exited"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleBeginEndGrammar);
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
	
	tests["test TextMateStyler - initial - begin/end single line - name"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleBeginEndGrammar);
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
	
	tests["test TextMateStyler - initial - begin/end 2 lines - just delimiters"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleBeginEndGrammar);
		var lines;
		lines = [
			"<!--",
			"-->"
		];
		setLines(editor, lines);
		assertLineScope(editor, styler, 0, [ [0, 4, "punctuation.definition.comment.mylang"] ]); // <!--
		assertLineScope(editor, styler, 1, [ [0, 3, "punctuation.definition.comment.mylang"] ]); // -->
	});
	
	
	tests["test TextMateStyler - initial - begin/end 2 lines - with content"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleBeginEndGrammar);
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

	tests["test TextMateStyler - initial - begin/end 3 lines - with leading/trailing content"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleBeginEndGrammar);
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
	
	tests["test TextMateStyler - initial - b/e region inside b/e region"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleBeginEndGrammar);
		var lines;
		lines = [
			"<!--[]-->",
			"<!--[  ]-->",
			"<!--[ a ]-->",
			"<!--[   ",
			"b b"
		];
		setLines(editor, lines);
		assertLineScope(editor, styler, 0, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 5, "meta.brace.square.open.mylang", "["],
			[5, 6, "meta.brace.square.close.mylang", "]"],
			[6, 9, "punctuation.definition.comment.mylang", "-->"]
		]);
		assertLineScope(editor, styler, 1, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 5, "meta.brace.square.open.mylang", "["],
			[5, 7, "invalid.illegal.whitespace.mylang", "  "],
			[7, 8, "meta.brace.square.close.mylang", "]"],
			[8, 11, "punctuation.definition.comment.mylang", "-->"]
		]);
		assertLineScope(editor, styler, 2, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 5, "meta.brace.square.open.mylang", "["],
			[5, 6, "invalid.illegal.whitespace.mylang", " "],
			[6, 7, "meta.insquare.mylang", "a"],
			[7, 8, "invalid.illegal.whitespace.mylang", " "],
			[8, 9, "meta.brace.square.close.mylang", "]"],
			[9, 12, "punctuation.definition.comment.mylang", "-->"]
		]);
		assertLineScope(editor, styler, 3, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 5, "meta.brace.square.open.mylang", "["],
			[5, 8, "invalid.illegal.whitespace.mylang", "   "]
		]);
		assertLineScope(editor, styler, 4, [
			[0, 1, "meta.insquare.mylang", "b"],
			[1, 2, "invalid.illegal.whitespace.mylang", " "],
			[2, 3, "meta.insquare.mylang", "b"]
		]);
	});
	
	// Test for Bug 347486, ensure we try all subrules on each line
	tests["test TextMateStyler - initial - all subrules are tried"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleGrammar);
		var lines = [
			'break var "foo" null 123',
			"z if"
		];
		setLines(editor, lines);
		assertLineScope(editor, styler, 0, [
			[0, 5, "keyword.control.mylang", "break"],
			[6, 9, "keyword.other.mylang", "var"],
			[10, 15, "constant.character.mylang", '"foo"'],
			[16, 20, "constant.language.mylang", "null"],
			[21, 24, "constant.numeric.mylang", "123"]
		]);
		assertLineScope(editor, styler, 1, [
			[0, 1, "invalid.illegal.idontlikez.mylang", "z"],
			[2, 4, "keyword.control.mylang", "if"]
		]);
	}, false);
	
	// ************************************************************************************************
	// Test damage/repair styling
	
	tests["test TextMateStyler - change - inside region"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleBeginEndGrammar);
		var lines;
		lines = [
			"<!--",
			"a",
			"-->"
		];
		setLines(editor, lines);
		assertLineScope(editor, styler, 0, [ [0, 4, "punctuation.definition.comment.mylang", "<!--"] ]);
		assertLineScope(editor, styler, 1, [ [0, 1, "comment.block.mylang", "a"] ]);
		assertLineScope(editor, styler, 2, [ [0, 3, "punctuation.definition.comment.mylang", "-->"] ]);
		
		/*
		<!--
		axxxx
		-->
		*/
		changeLine(editor, "xxxx", 1, 1, 1); // insert xxxx after a on line 1
		assertLineScope(editor, styler, 0, [
			[0, 4, "punctuation.definition.comment.mylang"] // <!--
		]);
		assertLineScope(editor, styler, 1, [
			[0, 5, "comment.block.mylang"] // axxxx
		]);
		assertLineScope(editor, styler, 2, [
			[0, 3, "punctuation.definition.comment.mylang"] // -->
		]);
	}, false);
	
	tests["test TextMateStyler - change - add non-region text that follows region"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleBeginEndGrammar);
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
		*/
		assertLineScope(editor, styler, 0, [
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
	
	tests["test TextMateStyler - change - add non-region text that precedes region"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleBeginEndGrammar);
		var lines;
		lines = [
			"<!--",
			"a",
			"-->int"
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
			[0, 1, "comment.block.mylang", "a"]
		]);
		assertLineScope(editor, styler, 2, [
			[0, 3, "punctuation.definition.comment.mylang", "-->"],
			[3, 6, "storage.type.mylang", "int"]
		]);
	});
	
	// add non-region text between regions
	tests["test TextMateStyler - change - add non-region text between regions"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleBeginEndGrammar);
		setLines(editor, [
			"<!--aaa-->",
			"<!--bbb-->"
		]);
		changeLine(editor, "int xxx char", 0, 10, 10);
		/*
		<!--aaa-->int xxx char
		<!--bbb-->
		*/
		assertLineScope(editor, styler, 0, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 7, "comment.block.mylang", "aaa"],
			[7, 10, "punctuation.definition.comment.mylang", "-->"],
			[10, 13, "storage.type.mylang", "int"],
			// xxx is ignored: doesn't match anything
			[18, 22, "storage.type.mylang", "char"]
		]);
		assertLineScope(editor, styler, 1, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 7, "comment.block.mylang", "bbb"],
			[7, 10, "punctuation.definition.comment.mylang", "-->"]
		]);
	});

	// creates a new region by adding the start block
	tests["test TextMateStyler - change - add 'start' 1"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleBeginEndGrammar);
		setLines(editor, [
			"a",
			"-->"
		]);
		
		/*
		char<!--a
		-->
		*/
		changeLine(editor, "char<!--", 0, 0, 0);
		assertLineScope(editor, styler, 0, [
			[0, 4, "storage.type.mylang", "char"],
			[4, 8, "punctuation.definition.comment.mylang", "<!--"],
			[8, 9, "comment.block.mylang", "a"]
		]);
		assertLineScope(editor, styler, 1, [
			[0, 3, "punctuation.definition.comment.mylang", "-->"]
		]);
	});
	
	// creates a new region by adding the start block
	tests["test TextMateStyler - change - add 'start' 2"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleBeginEndGrammar);
		setLines(editor, [
			"xxxx<!--a",
			"-->"
		]);
		assertLineScope(editor, styler, 0, [
			[4, 8, "punctuation.definition.comment.mylang", "<!--"],
			[8, 9, "comment.block.mylang", "a"]
		]);
		assertLineScope(editor, styler, 1, [
			[0, 3, "punctuation.definition.comment.mylang", "-->"]
		]);
		
		// Add another start that knocks out the earlier one
		/*
		<!--xxxx<!--a
		-->
		*/
		changeLine(editor, "<!--", 0, 0, 0);
		assertLineScope(editor, styler, 0, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 10, "comment.block.mylang", "xxxx<!"],
			[10, 12, "invalid.illegal.badcomment.mylang", "--"],
			[12, 13, "comment.block.mylang", "a"]
		]);
		assertLineScope(editor, styler, 1, [
			[0, 3, "punctuation.definition.comment.mylang", "-->"]
		]);
		
		// Add another line just to make sure
		/*
		<!--xxxx<!--a
		b
		-->
		*/
		changeLine(editor, "\nb", 0, 13, 13);
		assertLineScope(editor, styler, 0, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 10, "comment.block.mylang", "xxxx<!"],
			[10, 12, "invalid.illegal.badcomment.mylang", "--"],
			[12, 13, "comment.block.mylang", "a"]
		]);
		assertLineScope(editor, styler, 1, [
			[0, 1, "comment.block.mylang", "b"]
		]);
		assertLineScope(editor, styler, 2, [
			[0, 3, "punctuation.definition.comment.mylang", "-->"]
		]);
	});
	
	// Creates a new region at eof. New region never matches its end (ie. extends until eof)
	tests["test TextMateStyler - change - add 'start' at eof, no 'end'"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleBeginEndGrammar);
		setLines(editor, [
			"<!--a-->"
		]);
		
		/*
		<!--a--><!--
		*/
		changeLine(editor, "<!--", 0, 8, 8);
		assertLineScope(editor, styler, 0, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 5, "comment.block.mylang", "a"],
			[5, 8, "punctuation.definition.comment.mylang", "-->"],
			[8, 12, "punctuation.definition.comment.mylang", "<!--"]
		]);
		
		/*
		<!--a--><!--b
		*/
		changeLine(editor, "b", 0, 12, 12);
		assertLineScope(editor, styler, 0, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 5, "comment.block.mylang", "a"],
			[5, 8, "punctuation.definition.comment.mylang", "-->"],
			[8, 12, "punctuation.definition.comment.mylang", "<!--"],
			[12, 13, "comment.block.mylang", "b"]
		]);
		
		/*
		<!--a--><!--b-->x
		*/
		changeLine(editor, "-->x", 0, 13, 13);
		assertLineScope(editor, styler, 0, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 5, "comment.block.mylang", "a"],
			[5, 8, "punctuation.definition.comment.mylang", "-->"],
			[8, 12, "punctuation.definition.comment.mylang", "<!--"],
			[12, 13, "comment.block.mylang", "b"],
			[13, 16, "punctuation.definition.comment.mylang", "-->"]
			// x is ignored
		]);
	});
	
	tests["test TextMateStyler - change - add 'start' at eof on new line incr"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleBeginEndGrammar);
		setLines(editor, [
			"<!--a-->"
		]);
		// Helper since line 0's scope doesn't change in this test
		function assertLine0Scope() {
			assertLineScope(editor, styler, 0, [
				[0, 4, "punctuation.definition.comment.mylang", "<!--"],
				[4, 5, "comment.block.mylang", "a"],
				[5, 8, "punctuation.definition.comment.mylang", "-->"]
			]);
		}
		
		// Add the newline first
		/*
		<!--a-->
		
		*/
		changeLine(editor, "\r\n", 0, 8, 8);
		assertLine0Scope();
		assertLineScope(editor, styler, 1, [
			// empty line
		]);
		
		// Now add the start INCREMENTALLY
		/*
		<!--a-->
		<
		*/
		changeLine(editor, "<", 1, 0, 0);
		assertLine0Scope();
		assertLineScope(editor, styler, 1, [ /* no scope on line 1 */ ]);
		
		/*
		<!--a-->
		<!
		*/
		changeLine(editor, "!", 1, 1, 1);
		assertLine0Scope();
		assertLineScope(editor, styler, 1, [ /* no scope on line 1 */ ]);
		
		/*
		<!--a-->
		<!-
		*/
		changeLine(editor, "-", 1, 2, 2);
		assertLine0Scope();
		assertLineScope(editor, styler, 1, [ /* no scope on line 1 */ ]);
				/*
		<!--a-->
		<!--
		*/
		changeLine(editor, "-", 1, 3, 3);	// FIXME
		assertLine0Scope();
		assertLineScope(editor, styler, 1, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"]
		]);
		
		// Add something inside the new start, make sure it gets the right style
		/*
		<!--a-->
		<!--b
		*/
		changeLine(editor, "b", 1, 4, 4);
		assertLineScope(editor, styler, 0, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 5, "comment.block.mylang", "a"],
			[5, 8, "punctuation.definition.comment.mylang", "-->"]
		]);
		assertLineScope(editor, styler, 1, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 5, "comment.block.mylang", "b"]
		]);
	});
	
	tests["test TextMateStyler - change - add 'end' 1"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleBeginEndGrammar);
		setLines(editor, [
			"<!--has no end"
		]);
		
		/*
		<!--has an end-->
		*/
		changeLine(editor, "an end-->", 0, 8, 14);
		assertLineScope(editor, styler, 0, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 14, "comment.block.mylang", "has an end"],
			[14, 17, "punctuation.definition.comment.mylang", "-->"]
		]);
	});
	
	// Add an end when there are multiple regions
	tests["test TextMateStyler - change - add 'end' 2"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleBeginEndGrammar);
		setLines(editor, [
			"<!--fizz-->",
			"<!--buzz"
		]);
		
		// complete buzz's end token incrementally
		/*
		<!--fizz-->
		<!--buzz-
		*/
		changeLine(editor, "-", 1, 8, 8);
		assertLineScope(editor, styler, 0, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 8, "comment.block.mylang", "fizz"],
			[8, 11, "punctuation.definition.comment.mylang", "-->"]
		]);
		assertLineScope(editor, styler, 1, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 9, "comment.block.mylang", "buzz-"]
		]);
		
		/*
		<!--fizz-->
		<!--buzz--
		*/
		changeLine(editor, "-", 1, 9, 9);
		assertLineScope(editor, styler, 0, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 8, "comment.block.mylang", "fizz"],
			[8, 11, "punctuation.definition.comment.mylang", "-->"]
		]);
		assertLineScope(editor, styler, 1, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 8, "comment.block.mylang", "buzz"],
			[8, 10, "invalid.illegal.badcomment.mylang", "--"]
		]);
		
		/*
		<!--fizz-->
		<!--buzz-->
		*/
		changeLine(editor, ">", 1, 10, 10);
		assertLineScope(editor, styler, 0, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 8, "comment.block.mylang", "fizz"],
			[8, 11, "punctuation.definition.comment.mylang", "-->"]
		]);
		assertLineScope(editor, styler, 1, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 8, "comment.block.mylang", "buzz"],
			[8, 11, "punctuation.definition.comment.mylang", "-->"]
		]);
	}, false);
	

	// Add "end" where a following region exists
	tests["test TextMateStyler - change - add 'end' 3"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleBeginEndGrammar);
		setLines(editor, [
			"<!--b",
			"<!--c-->" // here <!-- is <! (comment) and -- (invalid) not <!-- (punctuation)
		]);
		
		/*
		<!--b-->
		<!--c-->
		*/
		changeLine(editor, "-->", 0, 5, 5);
		assertLineScope(editor, styler, 0, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 5, "comment.block.mylang", "b"],
			[5, 8, "punctuation.definition.comment.mylang", "-->"]
		]);
		assertLineScope(editor, styler, 1, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 5, "comment.block.mylang", "c"],
			[5, 8, "punctuation.definition.comment.mylang", "-->"]
		]);
	});

	// Add and "end" when there exist preceding and following regions
	tests["test TextMateStyler - change - add 'end' 4"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleBeginEndGrammar);
		setLines(editor, [
			"<!--a-->",
			"<!--b",
			"<!--c-->" // here <!-- is <! (comment) and -- (invalid) not <!-- (punctuation)
		]);
		// check initial styles for sanity
		assertLineScope(editor, styler, 0, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 5, "comment.block.mylang", "a"],
			[5, 8, "punctuation.definition.comment.mylang", "-->"]
		]);
		assertLineScope(editor, styler, 1, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 5, "comment.block.mylang", "b"]
		]);
		assertLineScope(editor, styler, 2, [
			[0, 2, "comment.block.mylang", "<!"],
			[2, 4, "invalid.illegal.badcomment.mylang", "--"],
			[4, 5, "comment.block.mylang", "c"],
			[5, 8, "punctuation.definition.comment.mylang", "-->"]
		]);
		
		// Add end on line 1. Should affect line2
		/*
		<!--a-->
		<!--b-->
		<!--c-->
		*/
		changeLine(editor, "-->", 1, 5, 5);
		assertLineScope(editor, styler, 0, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 5, "comment.block.mylang", "a"],
			[5, 8, "punctuation.definition.comment.mylang", "-->"]
		]);
		assertLineScope(editor, styler, 1, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 5, "comment.block.mylang", "b"],
			[5, 8, "punctuation.definition.comment.mylang", "-->"]
		]);
		assertLineScope(editor, styler, 2, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 5, "comment.block.mylang", "c"],
			[5, 8, "punctuation.definition.comment.mylang", "-->"]
		]);
	});
	
	tests["test TextMateStyler - change - remove 'start'"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleBeginEndGrammar);
		setLines(editor, [
			"<!--xxx int-->"
		]);
		
		/*
		xxx int-->
		*/
		changeLine(editor, "", 0, 0, 4);
		assertLineScope(editor, styler, 0, [
			[4, 7, "storage.type.mylang", "int"]
		]);
	});
	
	tests["test TextMateStyler - change - remove 'end' 1"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleBeginEndGrammar);
		setLines(editor, [
			"<!--a-->",
			"<!--b-->",
			"<!--c-->"
		]);
		// Remove end on line1, affects line2 also
		/*
		<!--a-->
		<!--b
		<!--c-->x
		*/
		changeLine(editor, "", 1, 5, 8);
		assertLineScope(editor, styler, 0, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 5, "comment.block.mylang", "a"],
			[5, 8, "punctuation.definition.comment.mylang", "-->"]
		]);
		assertLineScope(editor, styler, 1, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 5, "comment.block.mylang", "b"]
		]);
		assertLineScope(editor, styler, 2, [
			[0, 2, "comment.block.mylang", "<!"],
			[2, 4, "invalid.illegal.badcomment.mylang", "--"],
			[4, 5, "comment.block.mylang", "c"],
			[5, 8, "punctuation.definition.comment.mylang", "-->"]
		]);
	});
	
	// Remove end of a nested region that has sibling regions before and after it
	tests["test TextMateStyler - change - remove 'end' 2"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleBeginEndGrammar);
		setLines(editor, [
			"<!--a",
			"[a1]",
			"[a2]", // We'll remove this one's end ]
			"[a3]",
			"-->",
			"<!--b-->"
		]);
		assertLineScope(editor, styler, 0, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 5, "comment.block.mylang", "a"]
		]);
		assertLineScope(editor, styler, 1, [
			[0, 1, "meta.brace.square.open.mylang", "["],
			[1, 3, "meta.insquare.mylang", "a1"],
			[3, 4, "meta.brace.square.close.mylang", "]"]
		]);
		assertLineScope(editor, styler, 2, [
			[0, 1, "meta.brace.square.open.mylang", "["],
			[1, 3, "meta.insquare.mylang", "a2"],
			[3, 4, "meta.brace.square.close.mylang", "]"]
		]);
		assertLineScope(editor, styler, 3, [
			[0, 1, "meta.brace.square.open.mylang", "["],
			[1, 3, "meta.insquare.mylang", "a3"],
			[3, 4, "meta.brace.square.close.mylang", "]"]
		]);
		assertLineScope(editor, styler, 4, [
			[0, 3, "punctuation.definition.comment.mylang", "-->"]
		]);
		assertLineScope(editor, styler, 5, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 5, "comment.block.mylang", "b"],
			[5, 8, "punctuation.definition.comment.mylang", "-->"]
		]);
		
		// Remove end on line2, which makes a2 region extend onto next line
		/*
		<!--a
		[a1]
		[a2
		[a3]
		-->
		<!--b-->
		*/
		changeLine(editor, "", 2, 3, 4);				// FIXME
		assertLineScope(editor, styler, 0, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 5, "comment.block.mylang", "a"]
		]);
		assertLineScope(editor, styler, 1, [
			[0, 1, "meta.brace.square.open.mylang", "["],
			[1, 3, "meta.insquare.mylang", "a1"],
			[3, 4, "meta.brace.square.close.mylang", "]"]
		]);
		assertLineScope(editor, styler, 2, [
			[0, 1, "meta.brace.square.open.mylang", "["],
			[1, 3, "meta.insquare.mylang", "a2"]
		]);
		assertLineScope(editor, styler, 3, [
			[0, 3, "meta.insquare.mylang", "[a3"],
			[3, 4, "meta.brace.square.close.mylang", "]"]
		]);
		assertLineScope(editor, styler, 4, [
			[0, 3, "punctuation.definition.comment.mylang", "-->"]
		]);
		assertLineScope(editor, styler, 5, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 5, "comment.block.mylang", "b"],
			[5, 8, "punctuation.definition.comment.mylang", "-->"]
		]);
	});
	
	tests["test TextMateStyler - change - remove 'end' at eof"] = makeTest(function(editor) {
		var styler = new mTextMateStyler.TextMateStyler(editor, mTestGrammars.SampleBeginEndGrammar);
		setLines(editor, [
			"<!--a-->",
			"<!--b-->"
		]);
		/*
		<!--a-->
		<!--b
		*/
		changeLine(editor, "", 1, 5, 8);
		assertLineScope(editor, styler, 0, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 5, "comment.block.mylang", "a"],
			[5, 8, "punctuation.definition.comment.mylang", "-->"]
		]);
		assertLineScope(editor, styler, 1, [
			[0, 4, "punctuation.definition.comment.mylang", "<!--"],
			[4, 5, "comment.block.mylang", "b"]
		]);
	}, false);

//	// TODO: more damage/repair of nested regions
//	
	return tests;
});