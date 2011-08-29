/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *     Mihai Sucan (Mozilla Foundation) - fix for bug 350636
 *******************************************************************************/
 
 /*globals window define document navigator setTimeout XMLHttpRequest PerformanceTest */
 
 
function log (text) {
	var console = window.document.getElementById('console');
	if (!console) { return; }
	for (var n = 1; n < arguments.length; n++) {
		text += " ";
		text += arguments[n];
	}
	
	var document = console.contentWindow.document;
	var t = document.createTextNode(text);
	document.body.appendChild(t);
	var br = document.createElement("br");
	document.body.appendChild(br);
	if (!console.scroll) {
		console.scroll = true;
		setTimeout(function() {
			document.body.lastChild.scrollIntoView(false);
			console.scroll = false;
		}, 0);
	}
}
 
 define(["orion/textview/keyBinding",
		"orion/textview/textModel", 
		"orion/textview/projectionTextModel", 
		"orion/textview/textView", 
		"orion/textview/rulers",
		"orion/textview/undoStack",
		"orion/editor/textMateStyler",
		"orion/editor/htmlGrammar",
		"examples/textview/textStyler",
		"tests/textview/test-performance"],   
 
function(mKeyBinding, mTextModel, mProjectionTextModel, mTextView, mRulers, mUndoStack, mTextMateStyler, mHtmlGrammar, mTextStyler) {
	var view = null;
	var styler = null;
	var isMac = navigator.platform.indexOf("Mac") !== -1;
	
	function clearLog () {
		var console = window.document.getElementById('console');
		if (!console) { return; }
		var document = console.contentWindow.document;
		var body = document.body;
		while (body.hasChildNodes()) { body.removeChild(body.lastChild); }
	}
	
	function getFile(file) {
		try {
			var objXml = new XMLHttpRequest();
			objXml.open("GET",file,false);
			objXml.send(null);
			return objXml.responseText;
		} catch (e) {
			return null;
		}
	}
	
	function checkView() {
		if (view) { return; }
		var stylesheets = [
			"/orion/textview/textview.css",
			"/orion/textview/rulers.css",
			"/examples/textview/textstyler.css",
			"/examples/editor/htmlStyles.css"
		];
		var fullSelection = window.document.getElementById('fullSelection').checked;
		var tabSize = parseInt(window.document.getElementById('tabSize').value, 10);
		var options = {
			parent: "divParent",
			model: new mTextModel.TextModel(),
			stylesheet: stylesheets,
			fullSelection: fullSelection,
			tabSize: tabSize > 0 ? tabSize : 4
		};
		view = new mTextView.TextView(options);
		
		/* Undo stack */
		var undoStack = new mUndoStack.UndoStack(view, 200);
		view.setKeyBinding(new mKeyBinding.KeyBinding('z', true), "undo");
		view.setAction("undo", function() {
			undoStack.undo();
			return true;
		});
		view.setKeyBinding(isMac ? new mKeyBinding.KeyBinding('z', true, true) : new mKeyBinding.KeyBinding('y', true), "redo");
		view.setAction("redo", function() {
			undoStack.redo();
			return true;
		});
		
		/* Example: Adding a keyBinding and action*/
		view.setKeyBinding(new mKeyBinding.KeyBinding('s', true), "save");
		view.setAction("save", function() {
			log("*****************SAVE");
			return true;
		});
	
		/* Adding the Rulers */	
		var breakpoint = {
			html: "<img src='images/brkp_obj.gif'></img>",
			style: {styleClass: "ruler_annotation_breakpoint"},
			overviewStyle: {styleClass: "ruler_annotation_breakpoint_overview"}
		};
		var todo = {
			html: "<img src='images/todo.gif'></img>",
			style: {styleClass: "ruler_annotation_todo"},
			overviewStyle: {styleClass: "ruler_annotation_todo_overview"}
		};
		var annotation = new mRulers.AnnotationRuler("left", {styleClass: "ruler_annotation"}, breakpoint);
		annotation.onDblClick =  function(lineIndex, e) {
			if (lineIndex === undefined) { return; }
			annotation.setAnnotation(lineIndex, annotation.getAnnotation(lineIndex) !== undefined ? undefined : e.ctrlKey ? todo : breakpoint);
		};
		var lines = new mRulers.LineNumberRuler("left", {styleClass: "ruler_lines"}, {styleClass: "ruler_lines_odd"}, {styleClass: "ruler_lines_even"});
		lines.onDblClick = annotation.onDblClick;
		var overview = new mRulers.OverviewRuler("right", {styleClass: "ruler_overview"}, annotation);
		view.addRuler(annotation);
		view.addRuler(lines);
		view.addRuler(overview);
	}
	
	function createJavaSample() {
		checkView();
		var file =  getFile("text.txt");
		if (styler) {
			styler.destroy();
			styler = null;
		}
		var model = new mProjectionTextModel.ProjectionTextModel(new mTextModel.TextModel(file));
		view.setModel(model);
		styler = new mTextStyler.TextStyler(view, "java");

		styler._computeComments(model.getCharCount());

		var parent = model.getParent();
		for (var i=0; i<styler.commentOffsets.length; i += 2) {
			model.addProjection({
				content: new mTextModel.TextModel(""), 
				start: parent.getLineStart(parent.getLineAtOffset(styler.commentOffsets[i]) + 1),
				end: parent.getLineEnd(parent.getLineAtOffset(styler.commentOffsets[i+1]), true)});
		}
//
//		var parent = model.getParent();
//		for (var i=0; i<styler.commentOffsets.length; i += 2) {
//			var startLine = parent.getLineAtOffset(styler.commentOffsets[i]);
//			model.addProjection({
//				content: new mTextModel.TextModel(parent.getLine(startLine, true)),
//				start: parent.getLineStart(startLine),
//				end: parent.getLineEnd(parent.getLineAtOffset(styler.commentOffsets[i+1]), true)});
//		}
	}
	
	function createJavaScriptSample() {
		checkView();
		var file =  getFile("/orion/textview/textView.js");
		if (styler) {
			styler.destroy();
			styler = null;
		}
		styler = new mTextStyler.TextStyler(view, "js");
		view.setText(file);
	}

	function createHtmlSample() {
		checkView();
		var file =  getFile("/examples/textview/demo.html");
		if (styler) {
			styler.destroy();
			styler = null;
		}
		styler = new mTextMateStyler.TextMateStyler(view, mHtmlGrammar.HtmlGrammar.grammar);
		view.setText(file);
	}
	
	function createPlainTextSample() {
		checkView();
		var lineCount = 50000;
		var lines = [];
		for(var i = 0; i < lineCount; i++) {
			lines.push("This is the line of text number "+i);
		}
		if (styler) {
			styler.destroy();
			styler = null;
		}
		view.setText(lines.join("\r\n"));
	}
	
	function createBidiTextSample() {
		checkView();
		var lines = [];
		lines.push("Hello \u0644\u0645\u0646\u0647");
		if (styler) {
			styler.destroy();
			styler = null;
		}
		view.setText(lines.join("\r\n"));
	}function assertEquals(msg, expected, actual) {
		if (expected !== actual) {
			log ("Failed", msg, "Expected:", expected, "Actual:", actual);
		}
	}
		
	                                        //01xxx xxxx23 4567xx xxx890
	function test() {                       //01234 567890 123456 789012
		//var model = new mTextModel.TextModel("line1\nline2\nline3\nline4", "\n");
//											  0          1          2          3          4           5         6 
//											  0123456 78901 2345678901234 567890 12345678901 234567 8901234567890123
//		                                      0xx1xxx xx234 5678xx9012345 67xx89 012xxxxxxxx xxxxx3 4567890123456789
//                                                                 1             2                        3         
		var model = new mTextModel.TextModel("silenio\nesta\naqui na casa\nworld\nabcdefghij\nxxxxl\nmxxxxxxxxxxxxxz", "\n");
//		                                                     x             x      x                  x
		var test1 = new mProjectionTextModel.ProjectionTextModel(model);
		
		var i, a1;
		
		test1.addProjection({start: 1, end: 3, content: ""});// -2
		test1.addProjection({start: 4, end: 9, content: ""});//-5
		test1.addProjection({start: 16, end: 18, content: ""});//-2
		test1.addProjection({start: 27, end: 29, content: ""});//-2
		test1.addProjection({start: 34, end: 47, content: ""});//-13, total 24
		assertEquals("a", 40, test1.getCharCount());
		assertEquals("b", 64, model.getCharCount());
		assertEquals("c", 5, test1.getLineCount());
		assertEquals("d", 7, model.getLineCount());
		a1 = [0,3,9,10,11,12,13,14,15,18,19,20,21,22,23,24,25,26,29,30,31,32,33,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63];
		for (i=0; i<a1.length; i++) {
			assertEquals("e="+i, a1[i], test1.mapOffset(i));
		}
		for (i=0; i<a1.length; i++) {
			assertEquals("f="+a1[i], i, test1.mapOffset(a1[i], true));
		}
		a1 = [1,2,4,5,6,7,8,16,17,27,28,34,35,36,37,38,39,40,41,42,43,44,45,46];
		for (i=0; i<a1.length; i++) {
			assertEquals("g="+i, -1, test1.mapOffset(a1[i], true));
		}
		a1 = [1,2,4,5,6,7,8,16,17,27,28,34,35,36,37,38,39,40,41,42,43,44,45,46];
		for (i=0; i<a1.length; i++) {
			assertEquals("g="+i, -1, test1.mapOffset(a1[i], true));
		}
		a1 = [0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4];
		for (i=0; i<a1.length; i++) {
			assertEquals("g="+i, a1[i], test1.getLineAtOffset(i));
		}
		
		
		model = new mTextModel.TextModel("STARTEND", "\n");
		test1 = new mProjectionTextModel.ProjectionTextModel(model);
		test1.addProjection({start: 5, end: 5, content: "CENTER"});
		//assertEquals("a1", "STARTCENTEREND", test1.getText());
		assertEquals("a", 14, test1.getCharCount());
		assertEquals("b", 8, model.getCharCount());
		a1 = [0,1,2,3,4,-1,-1,-1,-1,-1,-1,5,6,7];
		for (i=0; i<a1.length; i++) {
			assertEquals("e2="+i, a1[i], test1.mapOffset(i));//to parent
		}
		a1 = [0,1,2,3,4,11,12,13];
		for (i=0; i<a1.length; i++) {
			assertEquals("f2="+a1[i], a1[i], test1.mapOffset(i, true));//from parent
		}
//		                                  0123456789
		model = new mTextModel.TextModel("STARTXXEND", "\n");
		test1 = new mProjectionTextModel.ProjectionTextModel(model);
		test1.addProjection({start: 5, end: 7, content: "CENTER"});
		//assertEquals("a1", "STARTCENTEREND", test1.getText());
		assertEquals("a", 14, test1.getCharCount());
		assertEquals("b", 10, model.getCharCount());
		a1 = [0,1,2,3,4,-1,-1,-1,-1,-1,-1,7,8,9];
		for (i=0; i<a1.length; i++) {
			assertEquals("g2="+i, a1[i], test1.mapOffset(i));//to parent
		}
		a1 = [0,1,2,3,4,-1,-1,11,12,13];
		for (i=0; i<a1.length; i++) {
			assertEquals("h2="+a1[i], a1[i], test1.mapOffset(i, true));//from parent
		}
		//assertEquals("a", "STARTCENTEREND", test1.getLine(0));
		
		model = new mTextModel.TextModel("STARTEND", "\n");
		test1 = new mProjectionTextModel.ProjectionTextModel(model);
		test1.addProjection({start: 5, end: 5, content: "\nCENTER\n"});
//		                      01234 5678901 2345
		assertEquals("a1", "START\nCENTER\nEND", test1.getText(0, test1.getCharCount()));
		assertEquals("a", 16, test1.getCharCount());
		assertEquals("b", 8, model.getCharCount());
		assertEquals("c", 3, test1.getLineCount());
		assertEquals("d", 1, model.getLineCount());
		a1 = [0,0,0,0,0,0,1,1,1,1,1,1,1,2,2,2];
		for (i=0; i<test1.getCharCount(); i++) {
			assertEquals("h2="+i, a1[i], test1.getLineAtOffset(i));//to parent
		}
		assertEquals("a1", "START\n", test1.getLine(0, true));
		assertEquals("a2", "CENTER\n", test1.getLine(1, true));
		assertEquals("a3", "END", test1.getLine(2, true));
//		
//line index                              0      1        2             3      4    5        6              7  8	   9
//line offsets                            0      6        14            27     33   37       45             59 61      68
//                                        0          1          2          3           4          5           6          7
//                                        01234 56789012 3456789012345 678901 23456 78901234 5678901234567 89 0123456 7890123456
		model = new mTextModel.TextModel("01234\n0123456\n012345678901\n01234\n012\n0123456\n0123456789012\n0\n012345\n012345678", "\n");
// deletions                              01  4\n0  34       345678901\n012          123456\n0123456789          23         5678 
// inserts                                                      abcd       ABCDEFG                  abcd\nef\nghijlmn\nopqrst
//                                                                                                                 ABCDE\nFGHIJK\nLMN
// results                                014\n034345abcd678901\n012ABCDEFG123456\n0123456abcd\nef\nghijlmn\nopqrst78923ABCDE\nFGHIJK\nLMN5678    
//                                        012 34567890123456789 01234567890123456 789012345678 901 23456789 01234567890123456 7890123 45678901
//                                                   1          2         3          4          5           6         7          8          9
		test1 = new mProjectionTextModel.ProjectionTextModel(model);
		test1.addProjection({start: 2, end: 4, content: ""});//green remove 23 on line 0														-2
		test1.addProjection({start: 7, end: 9, content: ""});//green remove 12 on line 1														-2
		test1.addProjection({start: 11, end: 17, content: ""});//green remove from 5 on line 1 to 3 line 2 (56\n012)							-6
		test1.addProjection({start: 20, end: 20, content: "abcd"});//orange add abcd to 6 on line 2												+4
		test1.addProjection({start: 30, end: 38, content: "ABCDEFG"});//red replace 3 on line 3 to 1 on line 5 (34\n012\n0) by ABCDEFG		-8,+7 -1	
		test1.addProjection({start: 52, end: 52, content: "abcd\nef\nghijlmn\nopqrst"});//orange add abcd\nef\nghijlmn\nopqrst to 7 on line 6   +22  
		test1.addProjection({start: 55, end: 63, content: ""});//green remove from 10 on line 6 to 2 on line 8                                  -8
		test1.addProjection({start: 65, end: 73, content: "ABCDE\nFGHIJK\nLMN"});//red replace 4 on line 8 to 5 on line 9  by ABCDE\nFGHIJK\nLMN -8, +16, +8
		assertEquals("a", 77, model.getCharCount());
		assertEquals("b", 92, test1.getCharCount());
		assertEquals("d", 10, model.getLineCount());
		assertEquals("c", 9, test1.getLineCount());
//		
		//map to parent
		//    0                       1                             2                             3                             4                             5                             6                             7                             8                            9
		//    0 1 2 3 4 5 6  7  8  9  0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5  6  7  8  9  0  1 
		a1 = [0,1,4,5,6,9,10,17,18,19,-1,-1,-1,-1,20,21,22,23,24,25,26,27,28,29,-1,-1,-1,-1,-1,-1,-1,38,39,40,41,42,43,44,45,46,47,48,49,50,51,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,52,53,54,63,64,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,73,74,75,76];
		for (i=0; i<a1.length; i++) {
			assertEquals("g2="+i, a1[i], test1.mapOffset(i));//to parent
		}

		//    0                       1                             2                             3                             4                             5                             6                             7                  
		//    0 1  2  3 4 5 6  7  8 9 0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5  6
		a1 = [0,1,-1,-1,2,3,4,-1,-1,5,6,-1,-1,-1,-1,-1,-1, 7, 8, 9,14,15,16,17,18,19,20,21,22,23,-1,-1,-1,-1,-1,-1,-1,-1,31,32,33,34,35,36,37,38,39,40,41,42,43,44,67,68,69,-1,-1,-1,-1,-1,-1,-1,-1,70,71,-1,-1,-1,-1,-1,-1,-1,-1,88,89,90,91];
		for (i=0; i<a1.length; i++) {
			assertEquals("h2="+a1[i], a1[i], test1.mapOffset(i, true));//from parent
		}
		
		//getLineAtOffset
		a1 = [0,0,0,0,  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1, 2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2, 3,3,3,3,3,3,3,3,3,3,3,3, 4,4,4, 5,5,5,5,5,5,5,5, 6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6, 7,7,7,7,7,7,7, 8,8,8,8,8,8,8];
		for (i=0; i<test1.getCharCount(); i++) {
			assertEquals("i2="+i, a1[i], test1.getLineAtOffset(i));
		}
		
		//getLineStart
		a1 = [0, 4, 21, 38, 50, 53, 61, 78, 85];
		for (i=0; i<test1.getLineCount(); i++) {
			assertEquals("j2="+i, a1[i], test1.getLineStart(i));
		}
		a1 = [4, 21, 38, 50, 53, 61, 78, 85, 92];
		for (i=0; i<test1.getLineCount(); i++) {
			assertEquals("j2="+i, a1[i], test1.getLineEnd(i, true));
		}
		a1 = [3, 20, 37, 49, 52, 60, 77, 84, 92];
		for (i=0; i<test1.getLineCount(); i++) {
			assertEquals("j3="+i, a1[i], test1.getLineEnd(i));
		}
		a1 = ["014\n", "034345abcd678901\n", "012ABCDEFG123456\n", "0123456abcd\n", "ef\n", "ghijlmn\n", "opqrst78923ABCDE\n", "FGHIJK\n", "LMN5678"];
		for (i=0; i<test1.getLineCount(); i++) {
			assertEquals("j4="+i, a1[i], test1.getLine(i, true));
//			log(test1.getLine(i, true));
		}
		var resultText = "014\n034345abcd678901\n012ABCDEFG123456\n0123456abcd\nef\nghijlmn\nopqrst78923ABCDE\nFGHIJK\nLMN5678";
		assertEquals("getText=", resultText, test1.getText());
//		for (i=0; i<test1.getCharCount(); i+=1) {
//			assertEquals("getText1="+i, resultText.substring(i, i+1), test1.getText(i, i+1));
//		}
//		for (i=0; i<test1.getCharCount(); i+=2) {
//			assertEquals("getText2="+i, resultText.substring(i, i+2), test1.getText(i, i+2));
//		}
		for (var j=1; j<test1.getCharCount(); j++) {
			for (i=0; i+j<test1.getCharCount(); i+=j) {
				assertEquals("getText(" + i + "-" + j + ")=", resultText.substring(i, i+j), test1.getText(i, i+j));
			}
		}
		
		
		//line start 
		log("All tests finished2");
	}
	
	function performanceTest() {
		checkView();
//		if (styler) {
//			styler.destroy();
//			styler = null;
//		}
		/* Note: PerformanceTest is not using require js */
		var test = new PerformanceTest(view);
		var select = document.getElementById("performanceTestSelect");
		test[select.value]();
	}

	/* Adding events */
	document.getElementById("createJavaSample").onclick = createJavaSample;
	document.getElementById("createJavaScriptSample").onclick = createJavaScriptSample;
	document.getElementById("createHtmlSample").onclick = createHtmlSample;
	document.getElementById("createPlainTextSample").onclick = createPlainTextSample;
	document.getElementById("createBidiTextSample").onclick = createBidiTextSample;
	document.getElementById("clearLog").onclick = clearLog;
	document.getElementById("test").onclick = test;
	document.getElementById("performanceTest").onclick = performanceTest;
		 
 });
