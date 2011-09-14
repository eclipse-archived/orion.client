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
		"orion/textview/annotationModel", 
		"orion/textview/projectionTextModel", 
		"orion/textview/textView", 
		"orion/textview/rulers",
		"orion/textview/undoStack",
		"orion/editor/textMateStyler",
		"orion/editor/htmlGrammar",
		"examples/textview/textStyler",
		"tests/textview/test-performance",
		"tests/textview/test-annotationModel",
		"tests/textview/test-projectionModel"],   
 
function(mKeyBinding, mTextModel, mAnnotationModel, mProjectionTextModel, mTextView, mRulers, mUndoStack, mTextMateStyler, mHtmlGrammar, mTextStyler) {
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
			model: new mProjectionTextModel.ProjectionTextModel(new mTextModel.TextModel()),
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

		view.setKeyBinding(new mKeyBinding.KeyBinding('s', true), "save");
		view.setAction("save", function() {
			log("*****************SAVE");
			return true;
		});

		var annotationModel = view.annotationModel = new mAnnotationModel.AnnotationModel(options.model.getParent());
		/* Example: Adding a keyBinding and action*/
		view.setKeyBinding(new mKeyBinding.KeyBinding('h', true), "collapseAll");
		view.setAction("collapseAll", function() {
			log("*****************COLLAPSE");
			var iter = annotationModel.getAnnotations(0, options.model.getParent().getCharCount());
			view.setRedraw(false);
			while (iter.hasNext()) {
				var a = iter.next();
				if (a.type === "orion.annotation.folding") {
					a.collapse();
					annotationModel.modifyAnnotation(a);
				}
			}
			view.setRedraw(true);
			return true;
		});
		/* Example: Adding a keyBinding and action*/
		view.setKeyBinding(new mKeyBinding.KeyBinding('j', true), "expandAll");
		view.setAction("expandAll", function() {
			log("*****************EXPAND");
			var iter = annotationModel.getAnnotations(0, options.model.getParent().getCharCount());
			view.setRedraw(false);
			while (iter.hasNext()) {
				var a = iter.next();
				if (a.type === "orion.annotation.folding") {
					a.expand();
					annotationModel.modifyAnnotation(a);
				}
			}
			view.setRedraw(true);
			return true;
		});
		

		/* Adding the Rulers */
		var breakpointType = "orion.annotation.breakpoint";
		var bookmarkType = "orion.annotation.bookmark";
		var errorType = "orion.annotation.error";
		var warningType = "orion.annotation.warning";
		var taskType = "orion.annotation.task";
		var annotationRuler = view.annotationRuler = new mRulers.AnnotationRuler(annotationModel, "left", {styleClass: "ruler_annotation"});
		annotationRuler.addAnnotationType(breakpointType);
		annotationRuler.addAnnotationType(bookmarkType);
		annotationRuler.addAnnotationType(errorType);
		annotationRuler.addAnnotationType(warningType);
		annotationRuler.addAnnotationType(taskType);
		annotationRuler.setMultiAnnotation({rulerHTML: "<img src='images/multiple.gif'/>"});
		annotationRuler.onDblClick =  function(lineIndex, e) {
			if (lineIndex === undefined) { return; }
			var model = this._view.getModel();
			var start = model.getLineStart(lineIndex);
			var end = model.getLineEnd(lineIndex, true);
			if (model.getParent) {
				start = model.mapOffset(start);
				end = model.mapOffset(end);
			}
			var type;
			if (isMac ? e.metaKey : e.ctrlKey) {
				if (e.shiftKey && e.altKey) {
					type = warningType;
				} else if (e.altKey) {
					type = errorType;
				} else if (e.shiftKey) {
					type = bookmarkType;
				} else {
					type = taskType;
				}
			} else {
				type = breakpointType;
			}
			var annotations = annotationModel.getAnnotations(start, end);
			var annotation, temp;
			while ((temp = annotations.next()) !== null) {
				if (temp.type === type) {
					annotation = temp;
					break;
				}
			}
			if (annotation) {
				annotationModel.removeAnnotation(annotation);
			} else {
				if (isMac ? e.metaKey : e.ctrlKey) {
					if (e.shiftKey && e.altKey) {
						annotation = {
							type: warningType,
							rulerTitle: "Warning: " + model.getLine(lineIndex),
							rulerHTML: "<img style='vertical-align:middle;align:center;' src='images/warning.png'></img>",
							rulerStyle: {styleClass: "ruler_annotation_waring"},
							overviewStyle: {styleClass: "ruler_annotation_warning_overview"}
						};
					} else if (e.altKey) {
						annotation = {
							type: errorType,
							rulerTitle: "Error: " + model.getLine(lineIndex),
							rulerHTML: "<img style='vertical-align:middle;align:center;' src='images/error.gif'></img>",
							rulerStyle: {styleClass: "ruler_annotation_error"},
							overviewStyle: {styleClass: "ruler_annotation_error_overview"}
						};
					} else if (e.shiftKey) {
						annotation = {
							type: bookmarkType,
							rulerTitle: "Bookmark: " + model.getLine(lineIndex),
							rulerHTML: "<img style='vertical-align:middle;align:center;' src='images/bookmark.gif'></img>",
							rulerStyle: {styleClass: "ruler_annotation_bookmark"},
							overviewStyle: {styleClass: "ruler_annotation_bookmark_overview"}
						};
					} else {
						annotation = {
							type: taskType,
							rulerTitle: "Todo: " + model.getLine(lineIndex),
							rulerHTML: "<img style='vertical-align:middle;align:center;' src='images/todo.gif'></img>",
							rulerStyle: {styleClass: "ruler_annotation_todo"},
							overviewStyle: {styleClass: "ruler_annotation_todo_overview"}
						};
					}
				} else {
					annotation = {
						type: breakpointType,
						rulerTitle: "Breakpoint: " + model.getLine(lineIndex),
						rulerHTML: "<img style='vertical-align:middle;align:center;' src='images/breakpoint.gif'></img>",
						rulerStyle: {styleClass: "ruler_annotation_breakpoint"},
						overviewStyle: {styleClass: "ruler_annotation_breakpoint_overview"}
					};
				}
				annotation.start = start;
				annotation.end = end;
				annotationModel.addAnnotation(annotation);
			}
		};
		var foldingRuler = view.folding = new mRulers.FoldingRuler(annotationModel, "left", {styleClass: "ruler_folding"});
		foldingRuler.addAnnotationType("orion.annotation.folding");
		var linesRuler = view.lines = new mRulers.LineNumberRuler(annotationModel, "left", {styleClass: "ruler_lines"}, {styleClass: "ruler_lines_odd"}, {styleClass: "ruler_lines_even"});
		linesRuler.onDblClick = annotationRuler.onDblClick;
		var overviewRuler = new mRulers.OverviewRuler(annotationModel, "right", {styleClass: "ruler_overview"});
		overviewRuler.addAnnotationType(breakpointType);
		overviewRuler.addAnnotationType(bookmarkType);
		overviewRuler.addAnnotationType(errorType);
		overviewRuler.addAnnotationType(warningType);
		overviewRuler.addAnnotationType(taskType);
		
		/* */
//		var testAnnotationType = "orion.annotation.test";
//		annotationRuler.addAnnotationType(testAnnotationType);
//		view.setKeyBinding(new mKeyBinding.KeyBinding('b', true), "addannotation");
//		view.setAction("addannotation", function() {
//			var selection = view.getSelection();
//			if (selection.start === selection.end) {return;}
//			var model = view.getModel();
//			var annotation = {
//				type: testAnnotationType,
//				rulerTitle: "test",
//				rulerHTML: "<img style='vertical-align:middle;:left;' src='images/brkp_obj.gif'></img>",
//				rulerStyle: {style: {background: "blue"}},
//				overviewStyle: {styleClass: "ruler_annotation_breakpoint_overview"}
//			};
//			if (model.getParent) {
//				selection.start = model.mapOffset(selection.start);
//				selection.end = model.mapOffset(selection.end);
//			}
//			annotation.start = selection.start;
//			annotation.end = selection.end;
//			annotationModel.addAnnotation(annotation);
//			log("added annotation to:", selection.start, selection.end);
//			return true;
//		});
		var testAnnotationType = "orion.annotation.test";
		linesRuler.addAnnotationType(testAnnotationType);
		overviewRuler.addAnnotationType(testAnnotationType);
		view.setKeyBinding(new mKeyBinding.KeyBinding('b', true), "addannotation");
		view.setAction("addannotation", function() {
			var selection = view.getSelection();
			if (selection.start === selection.end) {return;}
			var model = view.getModel();
			var annotation = {
				type: testAnnotationType,
				rulerTitle: "test",
				rulerHTML: "",
				rulerStyle: {style: {background: "blue"}},
				overviewStyle: {styleClass: "ruler_annotation_breakpoint_overview"}
			};
			if (model.getParent) {
				selection.start = model.mapOffset(selection.start);
				selection.end = model.mapOffset(selection.end);
			}
			annotation.start = selection.start;
			annotation.end = selection.end;
			annotationModel.addAnnotation(annotation);
			log("added annotation to:", selection.start, selection.end);
			return true;
		});
		testAnnotationType = "orion.annotation.test2";
		linesRuler.addAnnotationType(testAnnotationType);
		overviewRuler.addAnnotationType(testAnnotationType);
		view.setKeyBinding(new mKeyBinding.KeyBinding('m', true), "addannotation2");
		view.setAction("addannotation2", function() {
			var selection = view.getSelection();
			if (selection.start === selection.end) {return;}
			var model = view.getModel();
			var annotation = {
				type: testAnnotationType,
				rulerTitle: "test",
				rulerHTML: "",
				rulerStyle: {style: {color: "red"}},
				overviewStyle: {styleClass: "ruler_annotation_todo_overview"}
			};
			if (model.getParent) {
				selection.start = model.mapOffset(selection.start);
				selection.end = model.mapOffset(selection.end);
			}
			annotation.start = selection.start;
			annotation.end = selection.end;
			annotationModel.addAnnotation(annotation);
			log("added annotation to:", selection.start, selection.end);
			return true;
		});
		
		view.addRuler(annotationRuler);
		view.addRuler(linesRuler);
		view.addRuler(foldingRuler);
		view.addRuler(overviewRuler);
	}
	
	function createJavaSample() {
		checkView();
		view.setText("loading java file");
		var file = getFile("text.txt");
		if (styler) {
			styler.destroy();
			styler = null;
		}
		styler = new mTextStyler.TextStyler(view, "java");
		view.setText(file);
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
	}
	

	function test() {
		runTestCase(new AnnotationModelTestCase(view));
	}
	
	function performanceTest() {
		checkView();
		if (styler) {
			styler.destroy();
			styler = null;
		}
		/* Note: PerformanceTest is not using require js */
		var test = new PerformanceTest(view);
		var select = document.getElementById("performanceTestSelect");
		test[select.value]();
	}
	
	function runTestCase(test) {
		for (var m in test) {
			if (m.indexOf("test_") === 0) {
				log("Running:", m.substring(5));
				test[m]();
			}
		}
		log("All tests finished");
	}
	
	function projectionTest() {
		runTestCase(new ProjectionTextModelTestCase(view));
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
	document.getElementById("projectionTest").onclick = projectionTest;
		 
 });
