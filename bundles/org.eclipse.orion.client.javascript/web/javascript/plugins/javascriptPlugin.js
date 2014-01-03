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
	'orion/plugin',
	'orion/editor/stylers/js/js',
	'orion/editor/stylers/jsonSchema/jsonSchema'
], function(ASTManager, EslintValidator, ContentAssist, Occurrences, Outliner, i18nUtil, PluginProvider, mJS, mJSONSchema) {

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
					name: "ESLint Validator",
					tags: "validation javascript js eslint".split(" "),
					category: "validation",
					properties: [
						{	id: "active",
							name: "Use ESLint to validate JavaScript files",
							type: "boolean",
							defaultValue: true
						},
						{	id: "validate_eqeqeq",
							name: "Discouraged '==' use",
							type: "number",
							defaultValue: 1,
							options: [
								{label: "Ignore", value:0},
								{label: "Warning", value:1},
								{label: "Error", value:2}
							]
						},
						{	id: "validate_use_before_define",
							name: "Member used before definition",
							type: "number",
							defaultValue: 1,
							options: [
								{label: "Ignore", value:0},
								{label: "Warning", value:1},
								{label: "Error", value:2}
							]
						},
						{	id: "validate_missing_semi",
							name: "Missing semicolons",
							type: "number",
							defaultValue: 1,
							options: [
								{label: "Ignore", value:0},
								{label: "Warning", value:1},
								{label: "Error", value:2}
							]
						},
						{	id: "validate_no_undef",
							name: "Undefined member use",
							type: "number",
							defaultValue: 2,
							options: [
								{label: "Ignore", value:0},
								{label: "Warning", value:1},
								{label: "Error", value:2}
							]
						},
						{	id: "validate_no_unused_vars",
							name: "Unused variables",
							type: "number",
							defaultValue: 1,
							options: [
								{label: "Ignore", value:0},
								{label: "Warning", value:1},
								{label: "Error", value:2}
							]
						},
						{	id: "validate_no_redeclare",
							name: "Variable re-declarations",
							type: "number",
							defaultValue: 1,
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

	/**
	 * Register syntax styling for js, json and json schema content
	 */
	provider.registerServiceProvider("orion.edit.highlighter", { //$NON-NLS-0$
    }, {
        id: "orion.js", //$NON-NLS-0$
		contentTypes: ["application/javascript"], //$NON-NLS-0$
		patterns: [
			{
				include: "orion.patterns" //$NON-NLS-0$
			}, {
				match: "\\b(?:" + mJS.keywords.join("|") + ")\\b", //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				name: "KEYWORD" //$NON-NLS-0$
			}, {
				begin: "'[^'\\n]*\\\\\n", //$NON-NLS-0$
				end: "(?:[^'\\n]*\\\\\\n)*[^'\\n]*'?", //$NON-NLS-0$
				name: "MULTILINE_STRING" //$NON-NLS-0$
			}, {
				begin: "\"[^\"\\n]*\\\\\n", //$NON-NLS-0$
				end: "(?:[^\"\\n]*\\\\\\n)*[^\"\\n]*\"?", //$NON-NLS-0$
				name: "MULTILINE_STRING" //$NON-NLS-0$
			}
		]
	});
	provider.registerServiceProvider("orion.edit.highlighter", { //$NON-NLS-0$
    }, {
        id: "orion.json", //$NON-NLS-0$
		contentTypes: ["application/json"], //$NON-NLS-0$
		patterns: [
			{
				include: "orion.patterns" //$NON-NLS-0$
			}, {
				match: "\\b(?:true|false|null)\\b", //$NON-NLS-0$
				name: "KEYWORD" //$NON-NLS-0$
			}, {
				/* override orion.patterns#comment_singleline */
				id: "comment_singleline" //$NON-NLS-0$
			}, {
				/* override orion.patterns#comment_multiline */
				id: "comment_multiline" //$NON-NLS-0$
			}
		]
	});
	provider.registerServiceProvider("orion.edit.highlighter", { //$NON-NLS-0$
    }, {
        id: "orion.json.schema", //$NON-NLS-0$
		contentTypes: ["application/schema+json"], //$NON-NLS-0$
		patterns: [
			{
				include: "orion.json" //$NON-NLS-0$
			}, {
				match: "(?:\\$schema|(?:\\b(?:" + mJSONSchema.keywords.join("|") + ")))\\b", //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				name: "KEYWORD" //$NON-NLS-0$
			}
		]
	});

	provider.connect();
});
