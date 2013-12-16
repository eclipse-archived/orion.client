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
	'javascript/astManager',
	'javascript/eslint/validator',
	'javascript/contentAssist/contentAssist',
	'javascript/occurrences',
	'javascript/outliner',
	'orion/i18nUtil',
	'orion/plugin'
], function(ASTManager, EslintValidator, ContentAssist, Occurrences, Outliner, i18nUtil, PluginProvider) {

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
				imageClass: "file-sprite-javascript modelDecorationSprite"
			}
		] 
	});

	/**
	 * Create the AST manager
	 */
	var astManager = new ASTManager();

	/**
	 * Register AST manager as Model Change listener
	 */
	provider.registerServiceProvider("orion.edit.model", {
			onModelChanging: astManager.updated.bind(astManager)
		},
		{
			contentType: ["application/javascript"],
			types: ["ModelChanging"]
	});

	/**
	 * Register the jsdoc-based outline
	 */
	provider.registerServiceProvider("orion.edit.outliner", new Outliner.JSOutliner(astManager),
		{ contentType: ["application/javascript"],
		  name: "Source outline",
		  title: "JavaScript source outline",
		  id: "orion.javascript.outliner.source"
	});

	/**
	 * Register the mark occurrences support
	 */
	provider.registerService("orion.edit.occurrences", new Occurrences.JavaScriptOccurrences(astManager),
		{
			contentType: ["application/javascript"]	//$NON-NLS-0$
	});
	
	/**
	 * Register the content assist support
	 */
	provider.registerServiceProvider("orion.edit.contentassist", new ContentAssist.JSContentAssist(astManager), 
		{
			contentType: ["application/javascript"],
			name: "JavaScript content assist",
			id: "orion.edit.contentassist.javascript"
	});	

	/**
	 * Register the ESLint validator
	 */
	provider.registerServiceProvider(["orion.edit.validator", "orion.cm.managedservice"], new EslintValidator(astManager),
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
					name: "ESLint",
					tags: "validation javascript js eslint".split(" "),
					category: "validation",
					properties: [
						{	id: "active",
							name: "Use ESLint to validate JavaScript files",
							type: "boolean",
							defaultValue: true
						},
						{	id: "validate_func_decl",
							name: "Report missing function declaration documentation",
							type: "number",
							defaultValue: 0,
							options: [
							    {label: "Ignore", value:0},
				                {label: "Warning", value:1},
				                {label: "Error", value:2}
				            ]
						},
						{	id: "validate_func_expr",
							name: "Report missing function expression documentation",
							type: "number",
							defaultValue: 0,
							options: [
							    {label: "Ignore", value:0},
							    {label: "Warning", value:1},
							    {label: "Error", value:2}
							]
						}
					]
				}
			]
		});

	provider.connect();
});