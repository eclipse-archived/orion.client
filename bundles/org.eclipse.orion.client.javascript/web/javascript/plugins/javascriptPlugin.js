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
	'esprima/esprima',
	'javascript/eslint/validator',
	'javascript/esprima/esprimaJsContentAssist',
	'javascript/occurrences',
	'javascript/outliner',
	'orion/Deferred',
	'orion/i18nUtil',
	'orion/plugin',
	'orion/serialize'
], function(Esprima, EslintValidator, EsprimaAssist, Occurrences, Outliner, Deferred, i18nUtil, PluginProvider, Serialize) {

	/**
	 * Plug-in headers
	 */
	var headers = {
		name: "Orion JavaScript Tool Support",
		version: "1.0",
		description: "This plugin provides JavaScript tools support for Orion, like editing, search, navigation, validation, and code completion."
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
				image: "../javascript/images/javascript.png"
			}
		] 
	});
	
	/**
	 * Register the jsdoc-based outline
	 */
	provider.registerServiceProvider("orion.edit.outliner", new Outliner.JSOutliner(),
		{ contentType: ["application/javascript"],
		  name: "Source outline",
		  title: "JavaScript source outline",
		  id: "orion.javascript.outliner.source"
	});

	/**
	 * Register the AST provider
	 */
	provider.registerService("orion.core.astprovider",
		{ computeAST: function(context) {
				var ast = esprima.parse(context.text, {
					range: true,
					tolerant: true,
					comment: true,
					loc: true,
					tokens: true
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

	/**
	 * Register the ESLint validator
	 */
	provider.registerServiceProvider(["orion.edit.validator", "orion.cm.managedservice"], new EslintValidator(),
		{
			contentType: ["application/javascript"],
			pid: 'eslint.config'
		});

	/**
	 * ESLint settings
	 */
	provider.registerService("orion.core.setting",
		{},
		{	settings: [
				{	pid: "eslint.config",
					name: "ESLint Validator",
					tags: "validation javascript js eslint".split(" "),
					category: "validation",
					properties: [
						{	id: "active",
							name: "Use ESLint to validate JavaScript files",
							type: "boolean",
							defaultValue: true
						}
					]
				}
			]
		});

	provider.connect();
});