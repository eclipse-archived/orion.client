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
"orion/plugin", 
"javascript/outliner",
"javascript/occurrences",
"esprima/esprima",
"orion/serialize",
"orion/i18nUtil", 
"domReady!"], function(PluginProvider, Outliner, Occurrences, _, Serialize, i18nUtil, domReady) {

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
				image: "../images/javascript.png"
			}
		] 
	});
	
	var outliner = new Outliner.JavaScriptOutliner();
	
	/**
	 * Register the jsdoc-based outline
	 */
	provider.registerServiceProvider("orion.edit.outliner", outliner,
		{ contentType: ["application/javascript"],
		  name: "JSDoc outline",
		  id: "orion.javascript.outliner.jsdoc"
	});
	
	/**
	 * Register the raw source-based outline
	 */
	provider.registerServiceProvider("orion.edit.outliner", outliner, 
		{ contentType: ["application/javascript"],
		  name: "Source outline",
		  id: "orion.javascript.outliner.source"
	});
	
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
	
	var occurrences = new Occurrences.JavaScriptOccurrences();
	
	/**
	 * Register the mark occurrences support
	 */
	provider.registerService("orion.edit.occurrences", occurrences,
		{
			name: "Mark JavaScript Occurrences",	//$NON-NLS-0$
			id: "markoccurrences.editor",	//$NON-NLS-0$
			tooltip: "Mark JavaScript Occurrences",	//$NON-NLS-0$
			key: ["M", true, true], // Ctrl+Shift+M	//$NON-NLS-0$
			contentType: ["application/javascript"]	//$NON-NLS-0$
		});
	provider.connect();
});