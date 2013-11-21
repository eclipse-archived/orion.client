/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define esprima*/
define([
	'orion/plugin', 
	'javascript/outliner',
	'javascript/occurrences',
	'javascript/esprima/esprimaJsContentAssist',
	'esprima/esprima',
	'orion/serialize',
	'orion/i18nUtil'
], function(PluginProvider, Outliner, Occurrences, EsprimaAssist, _, Serialize, i18nUtil) {

	/**
	 * Plug-in headers
	 */
	var headers = {
		name: "Orion JavaScript Tool Support",
		version: "1.0",
		description: "This plugin provides JavaScript tools support for Orion, like editing, search, navigation and code completion"
	};
	var provider = new PluginProvider(headers);
	
	/**
	 * Register the JavaScript content type
	 */
	provider.registerServiceProvider("orion.core.contenttype", {}, {
		contentTypes: [
			{	id: "application/javascript",
				"extends": "text/plain",
				name: "JavaScript",
				extension: ["js"],
				image: "/javascript/images/javascript.png"
			}
		] 
	});
	
	/**
	 * Register the jsdoc-based outline
	 */
	provider.registerServiceProvider("orion.edit.outliner", new Outliner.JSDocOutliner(),
		{ contentType: ["application/javascript"],
		  name: "JSDoc outline",
		  id: "orion.javascript.outliner.jsdoc"
	});

	/**
	 * Register the raw source-based outline
	 */
	/**provider.registerServiceProvider("orion.edit.outliner", new Outliner.JsOutliner(), 
		{ contentType: ["application/javascript"],
		  name: "Source outline",
		  id: "orion.javascript.outliner.source"
	});*/
	
	/**
	 * Register the AST provider
	 */
	provider.registerService("orion.core.astprovider",
		{ computeAST: function(context) {
				var ast = esprima.parse(context.text, {
					loc: true,
					range: true,
					raw: true,
					tokens: true,
					comment: true,
					tolerant: true
				});
				if (ast.errors) {
					ast.errors = ast.errors.map(Serialize.serializeError);
				}
				return ast;
			}
		}, {
			contentType: ["application/javascript"]
	});
	
	/**
	 * Register the mark occurrences support
	 */
	provider.registerService("orion.edit.occurrences", new Occurrences.JavaScriptOccurrences(),
		{
			contentType: ["application/javascript"]	//$NON-NLS-0$
	});
	
	/**
	 * Register the content assist support
	 */
	provider.registerServiceProvider("orion.edit.contentassist", new EsprimaAssist.EsprimaJavaScriptContentAssistProvider(), 
		{
			contentType: ["application/javascript"],
			name: "Esprima based JavaScript content assist",
			id: "orion.edit.contentassist.esprima"
	});	
		
	provider.connect();
});