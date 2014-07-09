/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global esprima*/
/*eslint-env amd*/
define(['orion/plugin', 
'webtools/htmlContentAssist', 
'orion/editor/stylers/text_html/syntax', 
'webtools/cssContentAssist', 
'webtools/cssValidator',
'webtools/cssOutliner',
'orion/editor/stylers/text_css/syntax'
], function(PluginProvider, htmlContentAssist, mHTML, cssContentAssist, mCssValidator, mCssOutliner, mCSS) {
	/**
	 * Plug-in headers
	 */
	var headers = {
		name: "Orion Web Tools Support",
		version: "1.0",
		description: "This plug-in provides web language tools support for Orion, including HTML, CSS and Markdown."
	};
	var provider = new PluginProvider(headers);

	/**
	 * Register the content types: HTML, CSS
	 */
	provider.registerServiceProvider("orion.core.contenttype", {}, {
		contentTypes: [
			{	id: "text/html",
				"extends": "text/plain",
				name: "HTML",
				extension: ["html", "htm"],
				imageClass: "file-sprite-html modelDecorationSprite"
			},
			{	id: "text/css",
				"extends": "text/plain",
				name: "CSS",
				extension: ["css"],
				imageClass: "file-sprite-css modelDecorationSprite"
			}
		] 
	});
	
	/**
	 * Register content assist providers
	 */
	provider.registerService("orion.edit.contentassist",
		new htmlContentAssist.HTMLContentAssistProvider(),
		{	name: "HTML content assist",
			contentType: ["text/html"],
			charTriggers: "<",
			excludedStyles: "(comment.*|string.*)"
		});
	provider.registerService("orion.edit.contentassist",
		new cssContentAssist.CssContentAssistProvider(),
		{	name: "CSS content assist",
			contentType: ["text/css"]
		});

	provider.registerService("orion.edit.validator", new mCssValidator.CssValidator(),
		{
			contentType: ["text/css"]
		});
	
	provider.registerService("orion.edit.outliner", new mCssOutliner.CssOutliner(), 
		{
			id: "orion.outline.css.csslint",
			name: "CSS rule outline",
			contentType: ["text/css"]
		});
		
	/**
	 * Register syntax styling
	 */
	var newGrammars = {};
	mCSS.grammars.forEach(function(current){
		newGrammars[current.id] = current;
	});
	mHTML.grammars.forEach(function(current){
		newGrammars[current.id] = current;
	});
	for (var current in newGrammars) {
	    if (newGrammars.hasOwnProperty(current)) {
   			provider.registerService("orion.edit.highlighter", {}, newGrammars[current]);
  		}
    }

	provider.connect();
});
