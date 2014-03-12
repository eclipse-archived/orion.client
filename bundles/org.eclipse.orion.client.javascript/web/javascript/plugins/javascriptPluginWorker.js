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
/*global esprima importScripts*/
/*jslint amd:true */

if (typeof importScripts !== "function")
	throw new Error("This script must be run from a Worker");

importScripts("../../requirejs/require.js");
require(
	{
		baseUrl: '../../',
		paths: {
			text: 'requirejs/text',
			i18n: 'requirejs/i18n',
			domReady: 'requirejs/domReady',
			esprima: 'esprima/esprima',
			estraverse: 'estraverse/estraverse',
			escope: 'escope/escope'
		},
		packages: [
			{
				name: "eslint",
				location: "eslint/lib",
				main: "eslint"
			},
			{
				name: "eslint/conf",
				main: "eslint/conf"
		}]
	},[
		'javascript/astManager',
		'javascript/contentAssist/indexFiles/mongodbIndex',
		'javascript/contentAssist/indexFiles/mysqlIndex',
		'javascript/contentAssist/indexFiles/postgresIndex',
		'javascript/contentAssist/indexFiles/redisIndex',
		'javascript/contentAssist/indexFiles/expressIndex',
		'javascript/contentAssist/indexFiles/amqpIndex',
		'javascript/contentAssist/contentAssist',
		'javascript/contentAssist/indexer',
		'javascript/validator',
		'javascript/occurrences',
		'javascript/outliner',
		'orion/plugin',
		'orion/editor/jsTemplateContentAssist',
		'orion/editor/stylers/application_javascript/syntax',
		'orion/editor/stylers/application_json/syntax',
		'orion/editor/stylers/application_schema_json/syntax',
		'orion/editor/stylers/application_x-ejs/syntax'
	], function(ASTManager, MongodbIndex, MysqlIndex, PostgresIndex, RedisIndex, ExpressIndex, AMQPIndex, ContentAssist, Indexer, EslintValidator, Occurrences, Outliner,
			PluginProvider, jsTemplateContentAssist, mJS, mJSON, mJSONSchema, mEJS) {

	/**
	 * Plug-in headers
	 */
	var headers = {
		name: "Orion JavaScript Tool Support", //$NON-NLS-0$
		version: "1.0", //$NON-NLS-0$
		description: "This plugin provides JavaScript tools support for Orion, like editing, search, navigation, validation, and code completion." //$NON-NLS-0$
	};
	var provider = new PluginProvider(headers);
	
	/**
	 * Register the JavaScript content types
	 */
	provider.registerService("orion.core.contenttype", {}, { //$NON-NLS-0$
		contentTypes: [
			{	id: "application/javascript", //$NON-NLS-0$
				"extends": "text/plain", //$NON-NLS-0$
				name: "JavaScript", //$NON-NLS-0$
				extension: ["js"], //$NON-NLS-0$
				imageClass: "file-sprite-javascript modelDecorationSprite" //$NON-NLS-0$
			}, {id: "application/json", //$NON-NLS-0$
				"extends": "text/plain", //$NON-NLS-0$
				name: "JSON", //$NON-NLS-0$
				extension: ["json"], //$NON-NLS-0$
				imageClass: "file-sprite-javascript modelDecorationSprite" //$NON-NLS-0$
			}, {id: "application/x-ejs", //$NON-NLS-0$
				"extends": "text/plain", //$NON-NLS-0$
				name: "Embedded Javascript", //$NON-NLS-0$
				extension: ["ejs"], //$NON-NLS-0$
				imageClass: "file-sprite-javascript modelDecorationSprite" //$NON-NLS-0$
			}
		]
	});

	/**
	 * Create the AST manager
	 */
	var astManager = new ASTManager.ASTManager();

	/**
	 * Register AST manager as Model Change listener
	 */
	provider.registerService("orion.edit.model", {  //$NON-NLS-0$
			onModelChanging: astManager.updated.bind(astManager)
		},
		{
			contentType: ["application/javascript"],  //$NON-NLS-0$
			types: ["ModelChanging"]  //$NON-NLS-0$
	});

	/**
	 * Register the jsdoc-based outline
	 */
	provider.registerService("orion.edit.outliner", new Outliner.JSOutliner(astManager),  //$NON-NLS-0$
		{ contentType: ["application/javascript"],  //$NON-NLS-0$
			nls: 'javascript/nls/messages',  //$NON-NLS-0$
		  	nameKey: 'sourceOutline',  //$NON-NLS-0$
		  	titleKey: 'sourceOutlineTitle',  //$NON-NLS-0$
		  	id: "orion.javascript.outliner.source"  //$NON-NLS-0$
	});

	/**
	 * Register the mark occurrences support
	 */
	provider.registerService("orion.edit.occurrences", new Occurrences.JavaScriptOccurrences(astManager),  //$NON-NLS-0$
		{
			contentType: ["application/javascript"]	//$NON-NLS-0$
	});
	
	/**
	 * Register the content assist support
	 */
	provider.registerService("orion.edit.contentassist",  //$NON-NLS-0$
		new jsTemplateContentAssist.JSTemplateContentAssistProvider(),
		{
			nls: 'javascript/nls/messages',  //$NON-NLS-0$
			name: 'contentAssist',  //$NON-NLS-0$
			contentType: ["application/javascript"]  //$NON-NLS-0$
		});
	provider.registerService("orion.edit.contentassist", new ContentAssist.JSContentAssist(astManager, new Indexer()),  //$NON-NLS-0$
		{
			contentType: ["application/javascript"],  //$NON-NLS-0$
			nls: 'javascript/nls/messages',  //$NON-NLS-0$
			name: 'contentAssist',  //$NON-NLS-0$
			id: "orion.edit.contentassist.javascript",  //$NON-NLS-0$
			charTriggers: "[.]",  //$NON-NLS-0$
			excludedStyles: "(comment.*|string.*)"  //$NON-NLS-0$
	});	

	/**
	 * Register the ESLint validator
	 */
	provider.registerService(["orion.edit.validator", "orion.cm.managedservice"], new EslintValidator(astManager),  //$NON-NLS-0$  //$NON-NLS-1$
		{
			contentType: ["application/javascript", "text/html"],  //$NON-NLS-0$
			pid: 'eslint.config'  //$NON-NLS-0$
		});

	/**
	 * ESLint settings
	 */
	provider.registerService("orion.core.setting",  //$NON-NLS-0$
		{},
		{	settings: [
				{	pid: "eslint.config",  //$NON-NLS-0$
					nls: 'javascript/nls/messages',  //$NON-NLS-0$
					nameKey: 'eslintValidator',  //$NON-NLS-0$
					tags: "validation javascript js eslint".split(" "),  //$NON-NLS-0$  //$NON-NLS-1$
					category: "validation",  //$NON-NLS-0$
					properties: [
						{	id: "validate_eqeqeq",  //$NON-NLS-0$
							nameKey: 'eqeqeq',  //$NON-NLS-0$
							type: "number",  //$NON-NLS-0$
							defaultValue: 1,
							options: [
								{labelKey: 'ignore', value:0},  //$NON-NLS-0$
								{labelKey: 'warning', value:1},  //$NON-NLS-0$
								{labelKey: 'error', value:2}  //$NON-NLS-0$
							]
						},
						{	id: "validate_debugger",  //$NON-NLS-0$
							nameKey: 'noDebugger',  //$NON-NLS-0$
							type: "number",  //$NON-NLS-0$
							defaultValue: 1,
							options: [
								{labelKey: 'ignore', value:0},  //$NON-NLS-0$
								{labelKey: 'warning', value:1},  //$NON-NLS-0$
								{labelKey: 'error', value:2}  //$NON-NLS-0$
							]
						},
						{	id: "validate_eval",  //$NON-NLS-0$
							nameKey: 'noEval',  //$NON-NLS-0$
							type: "number",  //$NON-NLS-0$
							defaultValue: 0,
							options: [
								{labelKey: 'ignore', value:0},  //$NON-NLS-0$
								{labelKey: 'warning', value:1},  //$NON-NLS-0$
								{labelKey: 'error', value:2}  //$NON-NLS-0$
							]
						},
						{	id: "validate_dupe_obj_keys",  //$NON-NLS-0$
							nameKey: 'noDupeKeys',  //$NON-NLS-0$
							type: "number",  //$NON-NLS-0$
							defaultValue: 2,
							options: [
								{labelKey: 'ignore', value:0},  //$NON-NLS-0$
								{labelKey: 'warning', value:1},  //$NON-NLS-0$
								{labelKey: 'error', value:2}  //$NON-NLS-0$
							]
						},
						{	id: "validate_use_isnan",  //$NON-NLS-0$
							nameKey: 'useIsNaN',  //$NON-NLS-0$
							type: "number",  //$NON-NLS-0$
							defaultValue: 2,
							options: [
							   {labelKey: 'ignore', value:0},  //$NON-NLS-0$
							    {labelKey: 'warning', value:1},  //$NON-NLS-0$
							    {labelKey: 'error', value:2}  //$NON-NLS-0$
							]
						},
						{	id: "validate_func_decl",  //$NON-NLS-0$
							nameKey: 'docFuncDecl',  //$NON-NLS-0$
							type: "number",  //$NON-NLS-0$
							defaultValue: 0,
							options: [
							   {labelKey: 'ignore', value:0},  //$NON-NLS-0$
							    {labelKey: 'warning', value:1},  //$NON-NLS-0$
							    {labelKey: 'error', value:2}  //$NON-NLS-0$
							]
						},
						{	id: "validate_func_expr",  //$NON-NLS-0$
							nameKey: 'docFuncExpr',  //$NON-NLS-0$
							type: "number",  //$NON-NLS-0$
							defaultValue: 0,
							options: [
							   {labelKey: 'ignore', value:0},  //$NON-NLS-0$
							    {labelKey: 'warning', value:1},  //$NON-NLS-0$
							    {labelKey: 'error', value:2}  //$NON-NLS-0$
							]
						},
						{	id: "validate_use_before_define",  //$NON-NLS-0$
							nameKey: 'useBeforeDefine',  //$NON-NLS-0$
							type: "number",  //$NON-NLS-0$
							defaultValue: 1,
							options: [
								{labelKey: 'ignore', value:0},  //$NON-NLS-0$
								{labelKey: 'warning', value:1},  //$NON-NLS-0$
								{labelKey: 'error', value:2}  //$NON-NLS-0$
							]
						},
						{	id: "validate_new_parens",  //$NON-NLS-0$
							nameKey: 'newParens',  //$NON-NLS-0$
							type: "number",  //$NON-NLS-0$
							defaultValue: 2,
							options: [
								{labelKey: 'ignore', value:0},  //$NON-NLS-0$
								{labelKey: 'warning', value:1},  //$NON-NLS-0$
								{labelKey: 'error', value:2}  //$NON-NLS-0$
							]
						},
						{	id: "validate_missing_semi",  //$NON-NLS-0$
							nameKey: 'missingSemi',  //$NON-NLS-0$
							type: "number",  //$NON-NLS-0$
							defaultValue: 1,
							options: [
								{labelKey: 'ignore', value:0},  //$NON-NLS-0$
								{labelKey: 'warning', value:1},  //$NON-NLS-0$
								{labelKey: 'error', value:2}  //$NON-NLS-0$
							]
						},
						{	id: "validate_curly",  //$NON-NLS-0$
							nameKey: 'curly',  //$NON-NLS-0$
							type: "number",  //$NON-NLS-0$
							defaultValue: 0,
							options: [
								{labelKey: 'ignore', value:0},  //$NON-NLS-0$
								{labelKey: 'warning', value:1},  //$NON-NLS-0$
								{labelKey: 'error', value:2}  //$NON-NLS-0$
							]
						},
						{	id: "validate_no_undef",  //$NON-NLS-0$
							nameKey: 'undefMember',  //$NON-NLS-0$
							type: "number",  //$NON-NLS-0$
							defaultValue: 2,
							options: [
								{labelKey: 'ignore', value:0},  //$NON-NLS-0$
								{labelKey: 'warning', value:1},  //$NON-NLS-0$
								{labelKey: 'error', value:2}  //$NON-NLS-0$
							]
						},
						{	id: "validate_unnecessary_semi",  //$NON-NLS-0$
							nameKey: 'unnecessarySemis',  //$NON-NLS-0$
							type: "number",  //$NON-NLS-0$
							defaultValue: 1,
							options: [
								{labelKey: 'ignore', value:0},  //$NON-NLS-0$
								{labelKey: 'warning', value:1},  //$NON-NLS-0$
								{labelKey: 'error', value:2}  //$NON-NLS-0$
							]
						},
						{	id: "validate_no_unused_vars",  //$NON-NLS-0$
							nameKey: 'unusedVars',  //$NON-NLS-0$
							type: "number",  //$NON-NLS-0$
							defaultValue: 1,
							options: [
								{labelKey: 'ignore', value:0},  //$NON-NLS-0$
								{labelKey: 'warning', value:1},  //$NON-NLS-0$
								{labelKey: 'error', value:2}  //$NON-NLS-0$
							]
						},
						{	id: "validate_no_redeclare",  //$NON-NLS-0$
							nameKey: 'varRedecl',  //$NON-NLS-0$
							type: "number",  //$NON-NLS-0$
							defaultValue: 1,
							options: [
								{labelKey: 'ignore', value:0},  //$NON-NLS-0$
								{labelKey: 'warning', value:1},  //$NON-NLS-0$
								{labelKey: 'error', value:2}  //$NON-NLS-0$
							]
						}
					]
				}
			]
		});

	/**
	 * Register syntax styling for js, json and json schema content
	 */
	var grammars = mJS.grammars.concat(mJSON.grammars).concat(mJSONSchema.grammars).concat(mEJS.grammars);
	grammars.forEach(function(current) {
		provider.registerService("orion.edit.highlighter", {}, current);
	}.bind(this));

	/**
	 * Register type definitions for known JS libraries
	 */
	provider.registerService("orion.core.typedef", {}, {  //$NON-NLS-0$
		id: "node.redis",  //$NON-NLS-0$
		type: "tern",  //$NON-NLS-0$
		defs: RedisIndex
	});
	provider.registerService("orion.core.typedef", {}, {  //$NON-NLS-0$
		id: "node.mysql",  //$NON-NLS-0$
		type: "tern",  //$NON-NLS-0$
		defs: MysqlIndex
	});
	provider.registerService("orion.core.typedef", {}, {  //$NON-NLS-0$
		id: "node.postgres",  //$NON-NLS-0$
		type: "tern",  //$NON-NLS-0$
		defs: PostgresIndex
	});
	provider.registerService("orion.core.typedef", {}, {  //$NON-NLS-0$
		id: "node.mongodb",  //$NON-NLS-0$
		type: "tern",  //$NON-NLS-0$
		defs: MongodbIndex
	});
	provider.registerService("orion.core.typedef", {}, {  //$NON-NLS-0$
		id: "node.express",  //$NON-NLS-0$
		type: "tern", //$NON-NLS-0$
		defs: ExpressIndex
	});
	provider.registerService("orion.core.typedef", {}, {  //$NON-NLS-0$
		id: "node.amqp",  //$NON-NLS-0$
		type: "tern",  //$NON-NLS-0$
		defs: AMQPIndex
	});

	provider.connect();
});