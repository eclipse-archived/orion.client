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
		/* Example: Adding a keyBinding and action*/
		view.setKeyBinding(new mKeyBinding.KeyBinding('s', true), "save");
		view.setAction("save", function() {
			log("*****************SAVE");
			return true;
		});
		
		var annotationModel = view.annotationModel = new mAnnotationModel.AnnotationModel(options.model.getParent());

		/* Adding the Rulers */
		var breakpointType = "orion.annotation.breakpoint";
		var taskType = "orion.annotation.task";
		var annotationRuler = view.annotationRuler = new mRulers.AnnotationRuler(annotationModel, "left", {styleClass: "ruler_annotation"});
		annotationRuler.addAnnotationType(breakpointType);
		annotationRuler.addAnnotationType(taskType);
		annotationRuler.onDblClick =  function(lineIndex, e) {
			if (lineIndex === undefined) { return; }
			var model = this._view.getModel();
			var start = model.getLineStart(lineIndex);
			var end = model.getLineEnd(lineIndex, true);
			if (model.getParent) {
				start = model.mapOffset(start);
				end = model.mapOffset(end);
			}
			var type =  (isMac ? e.metaKey : e.ctrlKey) ? taskType : breakpointType;
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
					annotation = {
						type: taskType,
						rulerTitle: "Todo: " + model.getLine(lineIndex),
						rulerHTML: "<img style='vertical-align:middle;align:left;' src='images/todo.gif'></img>",
						rulerStyle: {styleClass: "ruler_annotation_todo"},
						overviewStyle: {styleClass: "ruler_annotation_todo_overview"}
					};
				} else {
					annotation = {
						type: breakpointType,
						rulerTitle: "Breakpoint: " + model.getLine(lineIndex),
						rulerHTML: "<img style='vertical-align:middle;:left;' src='images/brkp_obj.gif'></img>",
						rulerStyle: {styleClass: "ruler_annotation_breakpoint"},
						overviewStyle: {styleClass: "ruler_annotation_breakpoint_overview"}
					};
				}
				annotation.start = start;
				annotation.end = end;
				annotationModel.addAnnotation(annotation);
			}
		};
		var foldingRuler = view.folding = new mRulers.AnnotationRuler(annotationModel, "left", {styleClass: "ruler_folding"});
		foldingRuler.addAnnotationType("orion.annotation.folding");
		var linesRuler = view.lines = new mRulers.LineNumberRuler(annotationModel, "left", {styleClass: "ruler_lines"}, {styleClass: "ruler_lines_odd"}, {styleClass: "ruler_lines_even"});
		linesRuler.onDblClick = annotationRuler.onDblClick;
		var overviewRuler = new mRulers.OverviewRuler(annotationModel, "right", {styleClass: "ruler_overview"});
		overviewRuler.addAnnotationType(breakpointType);
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
		var file = getFile("text.txt");
		if (styler) {
			styler.destroy();
			styler = null;
		}
		styler = new mTextStyler.TextStyler(view, "java");
		view.setText(file);

		var model = view.getModel();
		var annotationModel = view.annotationModel;
		var parent = model.getParent();
		styler._computeComments(parent.getCharCount());

		
		view.folding.onClick =  function(lineIndex, e) {
			if (lineIndex === undefined) { return; }
			var view = this._view;
			var model = view.getModel();
			var start = model.getLineStart(lineIndex);
			var end = model.getLineEnd(lineIndex, true);
			if (model.getParent) {
				start = model.mapOffset(start);
				end = model.mapOffset(end);
			}
			var annotation, iter = annotationModel.getAnnotations(start, end);
			while (!annotation && iter.hasNext()) {
				var a = iter.next();
				if (a.type !== "orion.annotation.folding") { continue; }
				annotation = a;
			}
			if (annotation) {
				if (annotation.expanded) {
					annotation.rulerHTML = "<img src='images/collapsed.png'></img>";
					annotation.rulerStyle = {styleClass: "ruler_folding_expanded"};
				} else {
					annotation.rulerHTML = "<img src='images/expanded.png'></img>";
					annotation.rulerStyle = {styleClass: "ruler_folding_collapsed"};
				}
				if (model.getParent) {
					if (annotation.expanded) {
						model.addProjection(annotation.projection);
					} else {
						model.removeProjection(annotation.projection);
					}
				}
				annotation.expanded = !annotation.expanded;
				annotationModel.modifyAnnotation(annotation);
				// Adding/Removing projection to the ProjectioModel will only cause ModelChangeEvent on the ProjectioModel (obviously)
				// The annotation model only listen for ModelChangeEvent on the base model (which is not changing)
				// but in this case the annotation model needs to be notified that the offset mapping has changed (and visual location of the annotation
				// have changed). 
				//BAD this should be called my the rulers, once that is notified that the annotation model changed (visually only)
				view.redrawLines(lineIndex, model.getLineCount(), view.annotationRuler);
				view.redrawLines(lineIndex, model.getLineCount(), view.lines);
				view.redrawLines(lineIndex, model.getLineCount(), view.folding);
				
			}
		};
		for (var i=0; i<styler.commentOffsets.length; i += 2) {
			var lineIndex = parent.getLineAtOffset(styler.commentOffsets[i]);
			var endLine = parent.getLineAtOffset(styler.commentOffsets[i+1]);
			if (lineIndex === endLine) { continue; }
			var projection = {
				content: new mTextModel.TextModel(""), 
				start: parent.getLineStart(lineIndex + 1),
				end: parent.getLineEnd(endLine, true)
			};
			var start = parent.getLineStart(lineIndex), end = projection.end;
//			var text = parent.getText(start, end);
//			text = text.replace(/</g, "&lt;");
//			text = text.replace(/>/g, "&gt;");
			var annotation = {
				start: start,
				end: end,
				type: "orion.annotation.folding",
				projection: projection,
//				rulerTitle: text,
				rulerHTML: "<img src='images/collapsed.png'></img>",
				rulerStyle: {styleClass: "ruler_folding_expanded"}
			};
			annotationModel.addAnnotation(annotation);
			model.addProjection(projection);
		}
		//BAD 
		view.redrawLines(0, model.getLineCount(), view.annotationRuler);
		view.redrawLines(0, model.getLineCount(), view.lines);
		view.redrawLines(0, model.getLineCount(), view.folding);
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
//		checkView();
//		if (styler) {
//			styler.destroy();
//			styler = null;
//		}
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
