/*******************************************************************************
 * @license
 * Copyright (c) 2013, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env amd */
/*
 * This module may be loaded in a web worker or a regular Window. Therefore it must NOT use the DOM or other
 * APIs not available in workers.
 */
define([
'orion/bootstrap',
'esprima',
'javascript/scriptResolver',
'javascript/astManager',
'javascript/quickFixes',
'javascript/contentAssist/indexFiles/mongodbIndex',
'javascript/contentAssist/indexFiles/mysqlIndex',
'javascript/contentAssist/indexFiles/postgresIndex',
'javascript/contentAssist/indexFiles/redisIndex',
'javascript/contentAssist/indexFiles/expressIndex',
'javascript/contentAssist/indexFiles/amqpIndex',
'javascript/contentAssist/contentAssist',
'javascript/validator',
'javascript/occurrences',
'javascript/hover',
'javascript/outliner',
'orion/util',
'javascript/commands/generateDocCommand',
'javascript/commands/openDeclaration',
'orion/editor/stylers/application_javascript/syntax',
'orion/editor/stylers/application_json/syntax',
'orion/editor/stylers/application_schema_json/syntax',
'orion/editor/stylers/application_x-ejs/syntax'
], function(Bootstrap, Esprima, ScriptResolver, ASTManager, QuickFixes, MongodbIndex, MysqlIndex, PostgresIndex, RedisIndex, ExpressIndex, AMQPIndex, ContentAssist, 
			EslintValidator, Occurrences, Hover, Outliner,	Util, GenerateDocCommand, OpenDeclCommand, mJS, mJSON, mJSONSchema, mEJS) {

	function Factory(provider) {
		/**
		 * Register the JavaScript content types
		 */
		provider.registerService("orion.core.contenttype", {}, { //$NON-NLS-0$
			contentTypes: [
			               {	id: "application/javascript", //$NON-NLS-0$
			            	   "extends": "text/plain", //$NON-NLS-0$ //$NON-NLS-1$
			            	   name: "JavaScript", //$NON-NLS-0$
			            	   extension: ["js"], //$NON-NLS-0$
			            	   imageClass: "file-sprite-javascript modelDecorationSprite" //$NON-NLS-0$
			               }, {id: "application/json", //$NON-NLS-0$
			            	   "extends": "text/plain", //$NON-NLS-0$ //$NON-NLS-1$
			            	   name: "JSON", //$NON-NLS-0$
			            	   extension: ["json", "pref"], //$NON-NLS-0$ //$NON-NLS-1$
			            	   imageClass: "file-sprite-javascript modelDecorationSprite" //$NON-NLS-0$
			               }, {id: "application/x-ejs", //$NON-NLS-0$
			            	   "extends": "text/plain", //$NON-NLS-0$ //$NON-NLS-1$
			            	   name: "Embedded Javascript", //$NON-NLS-0$
			            	   extension: ["ejs"], //$NON-NLS-0$
			            	   imageClass: "file-sprite-javascript modelDecorationSprite" //$NON-NLS-0$
			               }
			               ]
		});
		/**
		 * Create the script resolver
		 * @since 8.0
		 */
		var scriptresolver = new ScriptResolver.ScriptResolver(Bootstrap);
		/**
		 * Create the AST manager
		 */
		var astManager = new ASTManager.ASTManager(Esprima);
		
		/**
		 * Register AST manager as Model Change listener
		 */
		provider.registerService("orion.edit.model", {  //$NON-NLS-0$
			onModelChanging: astManager.onModelChanging.bind(astManager),
			onDestroy: astManager.onDestroy.bind(astManager),
			onSaving: astManager.onSaving.bind(astManager),
			onInputChanged: astManager.onInputChanged.bind(astManager)
		},
		{
			contentType: ["application/javascript"],  //$NON-NLS-0$
			types: ["ModelChanging", 'Destroy', 'onSaving', 'onInputChanged']  //$NON-NLS-0$  //$NON-NLS-1$
		});
		
		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
				new GenerateDocCommand.GenerateDocCommand(astManager), 
				{
			nameKey : 'generateDocName',  //$NON-NLS-0$
			tooltipKey : 'generateDocTooltip',  //$NON-NLS-0$
			id : "generate.js.doc.comment",  //$NON-NLS-0$
			nls: 'javascript/nls/messages',  //$NON-NLS-0$
			key : [ "j", false, true, !Util.isMac, Util.isMac],  //$NON-NLS-0$
			contentType: ['application/javascript']  //$NON-NLS-0$
				}
		);
		
		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
				new OpenDeclCommand.OpenDeclarationCommand(astManager, scriptresolver), 
				{
			nameKey : 'openDeclName',  //$NON-NLS-0$
			tooltipKey : 'openDeclTooltip',  //$NON-NLS-0$
			id : "open.js.decl",  //$NON-NLS-0$
			nls: 'javascript/nls/messages',  //$NON-NLS-0$
			key : [ 114, false, false, false, false],  //$NON-NLS-0$
			contentType: ['application/javascript']  //$NON-NLS-0$
				}
		);
		
		var quickFixComputer = new QuickFixes.JavaScriptQuickfixes(astManager);
		
		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
				quickFixComputer, 
				{
        			nameKey : 'removeExtraSemiFixName',  //$NON-NLS-0$
        			tooltipKey : 'removeExtraSemiFixTooltip',  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix",
        			id : "rm.extra.semi.fix",  //$NON-NLS-0$
        			nls: 'javascript/nls/messages',  //$NON-NLS-0$
        			key : [ "e", false, true, !Util.isMac, Util.isMac],  //$NON-NLS-0$
        			contentType: ['application/javascript'],  //$NON-NLS-0$
        			validationProperties: [
                        {source: "annotation:id", match: "no-extra-semi"} //$NON-NLS-1$ //$NON-NLS-0$
                    ]
				}
		);
		
		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
				quickFixComputer, 
				{
        			nameKey : 'addFallthroughCommentFixName',  //$NON-NLS-0$
        			tooltipKey : 'addFallthroughCommentFixTooltip',  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix",
        			id : "add.fallthrough.comment.fix",  //$NON-NLS-0$
        			nls: 'javascript/nls/messages',  //$NON-NLS-0$
        			key : [ "e", false, true, !Util.isMac, Util.isMac],  //$NON-NLS-0$
        			contentType: ['application/javascript'],  //$NON-NLS-0$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-fallthrough)$"} //$NON-NLS-1$ //$NON-NLS-0$
                    ]
				}
		);
		
		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
				quickFixComputer, 
				{
        			nameKey : 'addEmptyCommentFixName',  //$NON-NLS-0$
        			tooltipKey : 'addEmptyCommentFixTooltip',  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix",
        			id : "add.empty.comment.fix",  //$NON-NLS-0$
        			nls: 'javascript/nls/messages',  //$NON-NLS-0$
        			key : [ "e", false, true, !Util.isMac, Util.isMac],  //$NON-NLS-0$
        			contentType: ['application/javascript'],  //$NON-NLS-0$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-empty-block)$"} //$NON-NLS-1$ //$NON-NLS-0$
                    ]
				}
		);
		
		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
				quickFixComputer, 
				{
        			nameKey : 'addESLintEnvFixName',  //$NON-NLS-0$
        			tooltipKey : 'addESLintEnvFixTooltip',  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix",
        			id : "add.eslint-env.fix",  //$NON-NLS-0$
        			nls: 'javascript/nls/messages',  //$NON-NLS-0$
        			key : [ "e", false, true, !Util.isMac, Util.isMac],  //$NON-NLS-0$
        			contentType: ['application/javascript'],  //$NON-NLS-0$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-undef-defined-inenv)$"} //$NON-NLS-1$ //$NON-NLS-0$
                    ]
				}
		);
		
		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
				quickFixComputer, 
				{
        			nameKey : 'addESLintGlobalFixName',  //$NON-NLS-0$
        			tooltipKey : 'addESLintGlobalFixTooltip',  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix",
        			id : "add.eslint-global.fix",  //$NON-NLS-0$
        			nls: 'javascript/nls/messages',  //$NON-NLS-0$
        			key : [ "e", false, true, !Util.isMac, Util.isMac],  //$NON-NLS-0$
        			contentType: ['application/javascript'],  //$NON-NLS-0$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-undef-defined)$"} //$NON-NLS-1$ //$NON-NLS-0$
                    ]
				}
		);
		
		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
				{
			execute: function(editorContext, context) {
				if(context.annotation.id === 'no-unused-params-expr') {
					return quickFixComputer['no-unused-params'](editorContext, context.annotation, astManager);
				}
				return quickFixComputer.execute(editorContext, context);
			}
				}, 
				{
					nameKey : 'removeUnusedParamsFixName',  //$NON-NLS-0$
					tooltipKey : 'removeUnusedParamsFixTooltip',  //$NON-NLS-0$
					scopeId: "orion.edit.quickfix",
					id : "remove.unused.param.fix",  //$NON-NLS-0$
					nls: 'javascript/nls/messages',  //$NON-NLS-0$
					key : [ "e", false, true, !Util.isMac, Util.isMac],  //$NON-NLS-0$
					contentType: ['application/javascript'],  //$NON-NLS-0$
					validationProperties: [
                        {source: "annotation:id", match: "^(?:no-unused-params|no-unused-params-expr)$"} //$NON-NLS-1$ //$NON-NLS-0$
                    ]
				}
		);
		
		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
				quickFixComputer, 
				{
        			nameKey : 'commentCallbackFixName',  //$NON-NLS-0$
        			tooltipKey : 'commentCallbackFixTooltip',  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix",
        			id : "comment.callback.fix",  //$NON-NLS-0$
        			nls: 'javascript/nls/messages',  //$NON-NLS-0$
        			key : [ "e", false, true, !Util.isMac, Util.isMac],  //$NON-NLS-0$
        			contentType: ['application/javascript'],  //$NON-NLS-0$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-unused-params-expr)$"} //$NON-NLS-1$ //$NON-NLS-0$
                    ]
				}
		);
		
		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
				quickFixComputer, 
				{
        			nameKey : 'eqeqeqFixName',  //$NON-NLS-0$
        			tooltipKey : 'eqeqeqFixTooltip',  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix",
        			id : "eqeqeq.fix",  //$NON-NLS-0$
        			nls: 'javascript/nls/messages',  //$NON-NLS-0$
        			key : [ "e", false, true, !Util.isMac, Util.isMac],  //$NON-NLS-0$
        			contentType: ['application/javascript'],  //$NON-NLS-0$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:eqeqeq)$"} //$NON-NLS-1$ //$NON-NLS-0$
                    ]
				}
		);
		
		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
				quickFixComputer, 
				{
        			nameKey : 'unreachableFixName',  //$NON-NLS-0$
        			tooltipKey : 'unreachableFixTooltip',  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix",
        			id : "remove.unreachable.fix",  //$NON-NLS-0$
        			nls: 'javascript/nls/messages',  //$NON-NLS-0$
        			key : [ "e", false, true, !Util.isMac, Util.isMac],  //$NON-NLS-0$
        			contentType: ['application/javascript'],  //$NON-NLS-0$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-unreachable)$"} //$NON-NLS-1$ //$NON-NLS-0$
                    ]
				}
		);
		
		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
				quickFixComputer, 
				{
        			nameKey : 'sparseArrayFixName',  //$NON-NLS-0$
        			tooltipKey : 'sparseArrayFixTooltip',  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix",
        			id : "sparse.array.fix",  //$NON-NLS-0$
        			nls: 'javascript/nls/messages',  //$NON-NLS-0$
        			key : [ "e", false, true, !Util.isMac, Util.isMac],  //$NON-NLS-0$
        			contentType: ['application/javascript'],  //$NON-NLS-0$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-sparse-arrays)$"} //$NON-NLS-1$ //$NON-NLS-0$
                    ]
				}
		);
		
		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
				quickFixComputer, 
				{
        			nameKey : 'semiFixName',  //$NON-NLS-0$
        			tooltipKey : 'semiFixTooltip',  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix",
        			id : "semi.fix",  //$NON-NLS-0$
        			nls: 'javascript/nls/messages',  //$NON-NLS-0$
        			key : [ "e", false, true, !Util.isMac, Util.isMac],  //$NON-NLS-0$
        			contentType: ['application/javascript'],  //$NON-NLS-0$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:semi)$"} //$NON-NLS-1$ //$NON-NLS-0$
                    ]
				}
		);
		
		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
				quickFixComputer, 
				{
        			nameKey : 'unusedVarsUnusedFixName',  //$NON-NLS-0$
        			tooltipKey : 'unusedVarsUnusedFixTooltip',  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix",
        			id : "unused.var.fix",  //$NON-NLS-0$
        			nls: 'javascript/nls/messages',  //$NON-NLS-0$
        			key : [ "e", false, true, !Util.isMac, Util.isMac],  //$NON-NLS-0$
        			contentType: ['application/javascript'],  //$NON-NLS-0$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-unused-vars-unused)$"} //$NON-NLS-1$ //$NON-NLS-0$
                    ]
				}
		);
		
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
			contentType: ["application/javascript", "text/html"]	//$NON-NLS-0$ //$NON-NLS-1$
				});
		
		/**
		 * Register the hover support
		 */
		provider.registerService("orion.edit.hover", new Hover.JavaScriptHover(astManager, scriptresolver),  //$NON-NLS-0$
				{
			nls: 'javascript/nls/messages',  //$NON-NLS-0$
			name: 'jsHover',
			contentType: ["application/javascript", "text/html"]	//$NON-NLS-0$ //$NON-NLS-1$
				});
		
		provider.registerService("orion.edit.contentassist", new ContentAssist.JSContentAssist(astManager),  //$NON-NLS-0$
				{
			contentType: ["application/javascript"],  //$NON-NLS-0$
			nls: 'javascript/nls/messages',  //$NON-NLS-0$
			nameKey: 'contentAssist',  //$NON-NLS-0$
			id: "orion.edit.contentassist.javascript",  //$NON-NLS-0$
			charTriggers: "[.]",  //$NON-NLS-0$
			excludedStyles: "(string.*)"  //$NON-NLS-0$
				});
		
		/**
		 * Register the ESLint validator
		 */
		provider.registerService(["orion.edit.validator", "orion.cm.managedservice"], new EslintValidator(astManager, scriptresolver),  //$NON-NLS-0$  //$NON-NLS-1$
				{
			contentType: ["application/javascript", "text/html"],  //$NON-NLS-0$ //$NON-NLS-1$
			nls: 'javascript/nls/problems',  //$NON-NLS-0$
			pid: 'eslint.config'  //$NON-NLS-0$
				});
		
		/**
		 * ESLint settings
		 */
		var ignore = 0, warning = 1, error = 2, severities = [
		                                                      {labelKey: 'ignore',  value: ignore},  //$NON-NLS-0$
		                                                      {labelKey: 'warning', value: warning},  //$NON-NLS-0$
		                                                      {labelKey: 'error',   value: error}  //$NON-NLS-0$
		                                                      ];
		provider.registerService("orion.core.setting",  //$NON-NLS-0$
				{},
				{	settings: [
				 	           {	pid: "eslint.config",  //$NON-NLS-0$
				 	        	   nls: 'javascript/nls/messages',  //$NON-NLS-0$
				 	        	   nameKey: 'eslintValidator',  //$NON-NLS-0$
				 	        	   tags: "validation javascript js eslint".split(" "),  //$NON-NLS-0$  //$NON-NLS-1$
				 	        	   category: "javascript",  //$NON-NLS-0$
				 	        	   properties: [
				 	        	                {	id: "validate_no_caller", //$NON-NLS-0$
				 	        	                	nameKey: "noCaller", //$NON-NLS-0$
				 	        	                	type: "number", //$NON-NLS-0$
				 	        	                	defaultValue: warning, //$NON-NLS-0$
				 	        	                	options: severities //$NON-NLS-0$
				 	        	                },
				 	        	                {
				 	        	                	id: "no-new-array", //$NON-NLS-0$
				 	        	                	nameKey: "noNewArray", //$NON-NLS-0$
				 	        	                	type: "number", //$NON-NLS-0$
				 	        	                	defaultValue: warning, //$NON-NLS-0$
				 	        	                	options: severities //$NON-NLS-0$
				 	        	                },
				 	        	                {
				 	        	                	id: "no-new-func", //$NON-NLS-0$
				 	        	                	nameKey: "noNewFunc", //$NON-NLS-0$
				 	        	                	type: "number", //$NON-NLS-0$
				 	        	                	defaultValue: warning, //$NON-NLS-0$
				 	        	                	options: severities //$NON-NLS-0$
				 	        	                },
				 	        	                {
				 	        	                	id: "no-new-object", //$NON-NLS-0$
				 	        	                	nameKey: "noNewObject", //$NON-NLS-0$
				 	        	                	type: "number", //$NON-NLS-0$
				 	        	                	defaultValue: warning, //$NON-NLS-0$
				 	        	                	options: severities //$NON-NLS-0$
				 	        	                },
				 	        	                {
				 	        	                	id: "no-new-wrappers", //$NON-NLS-0$
				 	        	                	nameKey: "noNewWrappers", //$NON-NLS-0$
				 	        	                	type: "number", //$NON-NLS-0$
				 	        	                	defaultValue: warning, //$NON-NLS-0$
				 	        	                	options: severities //$NON-NLS-0$
				 	        	                },
				 	        	                {	id: "validate_eqeqeq",  //$NON-NLS-0$
				 	        	                	nameKey: 'noEqeqeq',  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "validate_debugger",  //$NON-NLS-0$
				 	        	                	nameKey: 'noDebugger',  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "validate_eval",  //$NON-NLS-0$
				 	        	                	nameKey: 'noEval',  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: ignore,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "validate_dupe_obj_keys",  //$NON-NLS-0$
				 	        	                	nameKey: 'noDupeKeys',  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "validate_typeof",  //$NON-NLS-0$
				 	        	                	nameKey: 'validTypeof',  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "validate_use_before_define",  //$NON-NLS-0$
				 	        	                	nameKey: 'useBeforeDefine',  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "validate_new_parens",  //$NON-NLS-0$
				 	        	                	nameKey: 'newParens',  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "validate_use_isnan",  //$NON-NLS-0$
				 	        	                	nameKey: 'useIsNaN',  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "validate_radix",  //$NON-NLS-0$
				 	        	                	nameKey: 'radix',  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "validate_missing_semi",  //$NON-NLS-0$
				 	        	                	nameKey: 'missingSemi',  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "validate_throw_error",  //$NON-NLS-0$
				 	        	                	nameKey: 'throwError',  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "validate_func_decl",  //$NON-NLS-0$
				 	        	                	nameKey: 'docFuncDecl',  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: ignore,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "validate_func_expr",  //$NON-NLS-0$
				 	        	                	nameKey: 'docFuncExpr',  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: ignore,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "validate_no_sparse_arrays",  //$NON-NLS-0$
				 	        	                	nameKey: 'noSparseArrays',  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "validate_curly",  //$NON-NLS-0$
				 	        	                	nameKey: 'missingCurly',  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: ignore,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "validate_no_fallthrough",  //$NON-NLS-0$
				 	        	                	nameKey: 'noFallthrough',  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "validate_no_undef",  //$NON-NLS-0$
				 	        	                	nameKey: 'undefMember',  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "validate_no_empty_block",  //$NON-NLS-0$
				 	        	                	nameKey: 'noEmptyBlock',  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: ignore,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "validate_unnecessary_semi",  //$NON-NLS-0$
				 	        	                	nameKey: 'unnecessarySemis',  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "validate_no_jslint",  //$NON-NLS-0$
				 	        	                	nameKey: 'unsupportedJSLint',  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "validate_unused_params",  //$NON-NLS-0$
				 	        	                	nameKey: 'unusedParams',  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "validate_no_unused_vars",  //$NON-NLS-0$
				 	        	                	nameKey: 'unusedVars',  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "validate_no_unreachable",  //$NON-NLS-0$
				 	        	                	nameKey: 'noUnreachable',  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "validate_no_redeclare",  //$NON-NLS-0$
				 	        	                	nameKey: 'varRedecl',  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },{	id: "validate_no_shadow",  //$NON-NLS-0$
				 	        	                	nameKey: "varShadow",  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                }
				 	        	                ]
				 	           }
				 	           ]
				});
		
		/**
		 * Register syntax styling for js, json and json schema content
		 */
		var newGrammars = {};
		mJS.grammars.forEach(function(current){
			newGrammars[current.id] = current;
		});
		mJSON.grammars.forEach(function(current){
			newGrammars[current.id] = current;
		});
		mJSONSchema.grammars.forEach(function(current){
			newGrammars[current.id] = current;
		});
		mEJS.grammars.forEach(function(current){
			newGrammars[current.id] = current;
		});
		for (var current in newGrammars) {
			if (newGrammars.hasOwnProperty(current)) {
				provider.registerService("orion.edit.highlighter", {}, newGrammars[current]);
			}
		}
		
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
	}

	return Factory;
});
