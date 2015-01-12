/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
 
/*eslint-env browser, amd*/
 
define([
	"orion/editor/textTheme", 
	"orion/editor/edit"
], function(mTextTheme, edit) {

	var exports = {};
	var editor;
		
	function getFile(file) {
		try {
			var objXml = new XMLHttpRequest();
			objXml.open("GET",file,false); //$NON-NLS-0$
			objXml.send(null);
			return objXml.responseText;
		} catch (e) {
			return null;
		}
	}
	exports.getFile = getFile;
	
	function loadTheme(themeClass) {
		var theme = mTextTheme.TextTheme.getTheme();
		theme.setThemeClass(themeClass, {href: "orion/editor/themes/" + themeClass}); //$NON-NLS-0$
	}
	exports.loadTheme = loadTheme;
	
	function processTheme(themeClass, settings) {
		var theme = mTextTheme.TextTheme.getTheme();
		theme.setThemeClass(themeClass, theme.buildStyleSheet(themeClass, settings)); //$NON-NLS-0$
	}
	exports.processTheme = processTheme;
	
	function setupView(text, lang, options) {
		var editorDomNode = document.getElementById("editor");
		var status = "";
		var dirtyIndicator = "";
		var statusReporter = function(message, isError) {
			if (isError) {
				status =  "ERROR: " + message;
			} else {
				status = message;
			}
			// console.log( dirtyIndicator + status); //$NON-NLS-0$
		};
		
		editor = edit({
			parent: editorDomNode,
			lang: lang,
			contents: text, //$NON-NLS-0$
			statusReporter: statusReporter
		});
	}
	exports.setupView = setupView;
	

	return exports;
});