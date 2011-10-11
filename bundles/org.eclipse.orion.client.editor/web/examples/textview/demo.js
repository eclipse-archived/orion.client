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
 
 define(["require", 
         "orion/textview/keyBinding",
		"orion/textview/textModel",
		"orion/textview/projectionTextModel", 
		"orion/textview/annotations", 
		"orion/textview/textView", 
		"orion/textview/rulers",
		"orion/textview/undoStack",
		"orion/editor/textMateStyler",
		"orion/editor/htmlGrammar",
		"examples/textview/textStyler",
		"tests/textview/test-performance",
		"tests/textview/test-annotationModel",
		"tests/textview/test-projectionModel"],   
 
function(require, mKeyBinding, mTextModel, mAnnotationModel, mProjectionTextModel, mTextView, mRulers, mUndoStack, mTextMateStyler, mHtmlGrammar, mTextStyler) {
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
			require.toUrl("orion/textview/textview.css"),
			require.toUrl("orion/textview/rulers.css"),
			require.toUrl("orion/textview/annotations.css"),
			require.toUrl("examples/textview/textstyler.css"),
			require.toUrl("examples/editor/htmlStyles.css")
		];
		var fullSelection = window.document.getElementById('fullSelection').checked;
		var tabSize = parseInt(window.document.getElementById('tabSize').value, 10);
		var baseModel =  new mTextModel.TextModel(), viewModel = baseModel;
		var foldingEnabled = true;
		if (foldingEnabled) {
			viewModel = new mProjectionTextModel.ProjectionTextModel(baseModel);
		}
		var options = {
			parent: "divParent",
			model: viewModel,
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

		var annotationModel = view.annotationModel = new mAnnotationModel.AnnotationModel(baseModel);
		/* Example: Adding a keyBinding and action*/
		view.setKeyBinding(new mKeyBinding.KeyBinding('h', true), "collapseAll");
		view.setAction("collapseAll", function() {
			log("*****************COLLAPSE");
			var iter = annotationModel.getAnnotations(0, baseModel.getCharCount());
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
			var iter = annotationModel.getAnnotations(0, baseModel.getCharCount());
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
		var annotationRuler = view.annotationRuler = new mRulers.AnnotationRuler(annotationModel, "left", {styleClass: "ruler annotations"});
		annotationRuler.addAnnotationType(breakpointType);
		annotationRuler.addAnnotationType(bookmarkType);
		annotationRuler.addAnnotationType(errorType);
		annotationRuler.addAnnotationType(warningType);
		annotationRuler.addAnnotationType(taskType);
		annotationRuler.setMultiAnnotation({html: "<div class='annotationHTML multiple'></div>"});
		annotationRuler.setMultiAnnotationOverlay({html: "<div class='annotationHTML overlay'></div>"});
		annotationRuler.onDblClick =  function(lineIndex, e) {
			if (lineIndex === undefined) { return; }
			var model = this._view.getModel();
			var start = model.getLineStart(lineIndex);
			var end = model.getLineEnd(lineIndex, true);
			if (model.getBaseModel) {
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
							title: "Warning: " + model.getLine(lineIndex),
							style: {styleClass: "annotation warning"},
							html: "<div class='annotationHTML warning'></div>",
							overviewStyle: {styleClass: "annotationOverview warning"}
						};
					} else if (e.altKey) {
						annotation = {
							type: errorType,
							title: "Error: " + model.getLine(lineIndex),
							style: {styleClass: "annotation error"},
							html: "<div class='annotationHTML error'></div>",
							overviewStyle: {styleClass: "annotationOverview error"}
						};
					} else if (e.shiftKey) {
						annotation = {
							type: bookmarkType,
							title: "Bookmark: " + model.getLine(lineIndex),
							style: {styleClass: "annotation bookmark"},
							html: "<div class='annotationHTML bookmark'></div>",
							overviewStyle: {styleClass: "annotationOverview bookmark"}
						};
					} else {
						annotation = {
							type: taskType,
							title: "Todo: " + model.getLine(lineIndex),
							style: {styleClass: "annotation task"},
							html: "<div class='annotationHTML task'></div>",
							overviewStyle: {styleClass: "annotationOverview task"}
						};
					}
				} else {
					annotation = {
						type: breakpointType,
						title: "Breakpoint: " + model.getLine(lineIndex),
						style: {styleClass: "annotation breakpoint"},
						html: "<div class='annotationHTML breakpoint'></div>",
						overviewStyle: {styleClass: "annotationOverview breakpoint"}
					};
				}
				annotation.start = start;
				annotation.end = end;
				annotationModel.addAnnotation(annotation);
			}
		};
		var linesRuler = view.lines = new mRulers.LineNumberRuler(annotationModel, "left", {styleClass: "ruler lines"}, {styleClass: "rulerLines odd"}, {styleClass: "rulerLines even"});
		linesRuler.onDblClick = annotationRuler.onDblClick;
		var overviewRuler = new mRulers.OverviewRuler(annotationModel, "right", {styleClass: "ruler overview"});
		overviewRuler.addAnnotationType(breakpointType);
		overviewRuler.addAnnotationType(bookmarkType);
		overviewRuler.addAnnotationType(errorType);
		overviewRuler.addAnnotationType(warningType);
		overviewRuler.addAnnotationType(taskType);
		
		view.addRuler(annotationRuler);
		view.addRuler(linesRuler);
		if (foldingEnabled) {
			var foldingRuler = view.folding = new mRulers.FoldingRuler(annotationModel, "left", {styleClass: "ruler folding"});
			foldingRuler.addAnnotationType("orion.annotation.folding");
			view.addRuler(foldingRuler);
		}
		view.addRuler(overviewRuler);
	}
	
	function setupView(text, lang) {
		checkView();
		if (styler) {
			styler.destroy();
			styler = null;
		}
		switch (lang) {
			case "js":
			case "java":
			case "css":
				styler = new mTextStyler.TextStyler(view, lang, view.annotationModel);
				break;
			case "html":
				styler = new mTextMateStyler.TextMateStyler(view, mHtmlGrammar.HtmlGrammar.grammar);
				break;
		}
		view.setText(text);
	}
	
	function createJavaSample() {
		setupView(getFile("text.txt"), "java");
	}
	
	function createJavaScriptSample() {
		setupView(getFile("/orion/textview/textView.js"), "js");
	}

	function createHtmlSample() {
		setupView(getFile("/examples/textview/demo.html"), "html");
	}
	
	function createPlainTextSample() {
		var lineCount = 50000;
		var lines = [];
		for(var i = 0; i < lineCount; i++) {
			lines.push("This is the line of text number "+i);
		}
		setupView(lines.join("\r\n"), null);
	}
	
	function createBidiTextSample() {
		var lines = [];
		lines.push("Hello \u0644\u0645\u0646\u0647");
		setupView(lines.join("\r\n"), null);
	}

	function test() {
		runTestCase(new AnnotationModelTestCase(view));
	}
	
	function performanceTest() {
		setupView("", null);
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
