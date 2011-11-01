/*******************************************************************************
 * @license
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
 
/*globals define window document setTimeout */

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

define(['examples/textview/demoSetup', 'tests/textview/test-performance'],   
 
function(mSetup, mTestPerformance) {

	function setupView(text, lang) {
		mSetup.fullSelection = window.document.getElementById('fullSelection').checked;
		mSetup.tabSize = parseInt(window.document.getElementById('tabSize').value, 10);
		return mSetup.setupView(text, lang);
	}

	function clearLog () {
		var console = window.document.getElementById('console');
		if (!console) { return; }
		var document = console.contentWindow.document;
		var body = document.body;
		while (body.hasChildNodes()) { body.removeChild(body.lastChild); }
	}
	
	function createJavaSample() {
		return setupView(mSetup.getFile("text.txt"), "java");
	}
	
	function createJavaScriptSample() {
		return setupView(mSetup.getFile("/orion/textview/textView.js"), "js");
	}

	function createHtmlSample() {
		return setupView(mSetup.getFile("/examples/textview/demo.html"), "html");
	}
	
	function createPlainTextSample() {
		var lineCount = 50000;
		var lines = [];
		for(var i = 0; i < lineCount; i++) {
			lines.push("This is the line of text number "+i);
		}
		return setupView(lines.join("\r\n"), null);
	}
	
	function createBidiTextSample() {
		var lines = [];
		lines.push("Hello \u0644\u0645\u0646\u0647");
		return setupView(lines.join("\r\n"), null);
	}

	function test() {
	}
	
	function performanceTest() {
		var select = document.getElementById("performanceTestSelect");
		mTestPerformance[select.value]();
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
	var select = document.getElementById("performanceTestSelect");
	var prefix = "test";
	for (var property in mTestPerformance) {
		if (property.indexOf(prefix) === 0) {
			var option = document.createElement("OPTION");
			option.setAttribute("value", property);
			option.appendChild(document.createTextNode(property.substring(prefix.length	)));
			select.appendChild(option);
		}
	}
 });
