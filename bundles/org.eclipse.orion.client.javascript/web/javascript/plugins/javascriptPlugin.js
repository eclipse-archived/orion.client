/*******************************************************************************
 * @license
 * Copyright (c) 2013, 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env amd, browser*/
/*
 * This module may be loaded in a web worker or a regular Window. Therefore it must NOT use the DOM or other
 * APIs not available in workers.
 */
define([
'orion/plugin',
'orion/bootstrap',
'orion/fileClient',
'orion/metrics',
'esprima',
'estraverse',
'javascript/scriptResolver',
'javascript/astManager',
'javascript/quickFixes',
'javascript/contentAssist/ternAssist',
'javascript/validator',
'javascript/occurrences',
'javascript/hover',
'javascript/outliner',
'orion/util',
'logger',
'javascript/commands/generateDocCommand',
'javascript/commands/openDeclaration',
'javascript/commands/renameCommand',
'orion/editor/stylers/application_javascript/syntax',
'orion/editor/stylers/application_json/syntax',
'orion/editor/stylers/application_schema_json/syntax',
'orion/editor/stylers/application_x-ejs/syntax',
'i18n!javascript/nls/messages'
], function(PluginProvider, Bootstrap, FileClient, Metrics, Esprima, Estraverse, ScriptResolver, ASTManager, QuickFixes, TernAssist, 
			EslintValidator, Occurrences, Hover, Outliner,	Util, Logger, GenerateDocCommand, OpenDeclCommand, RenameCommand, mJS, mJSON, mJSONSchema, mEJS, javascriptMessages) {

    var provider = new PluginProvider({
		name: javascriptMessages['pluginName'], //$NON-NLS-0$
		version: "1.0", //$NON-NLS-0$
		description: javascriptMessages['pluginDescription'] //$NON-NLS-0$
	});

    Bootstrap.startup().then(function(core) {
    	
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
    		            	   extension: ["json", "pref"], //$NON-NLS-1$ //$NON-NLS-2$
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
    	 * Re-init
    	 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=462878
    	 */
    	Metrics.initFromRegistry(core.serviceRegistry);
    	
    	/**
    	 * make sure the RecoveredNode is ignored
    	 * @since 9.0
    	 */
    	Estraverse.VisitorKeys.RecoveredNode = []; //do not visit
    	/**
    	 * Create the file client early
    	 */
    	var fileClient = new FileClient.FileClient(core.serviceRegistry);
    	
    	/**
    	 * Create the script resolver
    	 * @since 8.0
    	 */
    	var scriptresolver = new ScriptResolver.ScriptResolver(fileClient);
    	/**
    	 * Create the AST manager
    	 */
    	var astManager = new ASTManager.ASTManager(Esprima);
    	
    	function WrappedWorker(script, onMessage, onError) {
    		/*if(typeof(SharedWorker) === 'function') {
    			this.shared = true;
    			this.worker = new SharedWorker(new URL(script, window.location.href).href);
    			this.worker.port.onmessage = onMessage;
    			this.worker.port.onerror = onError;
    			this.worker.port.start();
    			this.worker.port.postMessage('');
    		} else { */
    			this.worker = new Worker(new URL(script, window.location.href).href);
    			this.worker.onmessage = onMessage;
    			this.worker.onerror = onError;
    			this.worker.postMessage('');
    	//	}
    	}
    	
    	WrappedWorker.prototype.postMessage = function(msg) {
    		if(this.shared) {
    			this.worker.port.postMessage(msg);
    		} else {
    			this.worker.postMessage(msg);
    		}
    	};
    	
    	WrappedWorker.prototype.addEventListener = function(msg, handler) {
    		this.worker.addEventListener(msg, handler);	
    	};
    	
    	// Start the worker
    	var ternWorker = new WrappedWorker("ternWorker.js", 
		    	function(evnt) {
		    		if(typeof(evnt.data) === 'object') {
		    			var _d  = evnt.data;
		    			switch(_d.request) {
		    				case 'read': {
		    					if(typeof(_d.args.file) === 'object') {
		    						var _l = _d.args.file.logical;
		    						scriptresolver.getWorkspaceFile(_l).then(function(files) {
		    							if(files && files.length > 0) {
		    								return fileClient.read(files[0].location).then(function(contents) {
		    									ternWorker.postMessage({request: 'read', args:{contents:contents, file:files[0].location, logical:_l, path:files[0].path}});	
		    								});
		    							} else {
		    								ternWorker.postMessage({request: 'read', args: {logical:_l, error: 'Failed to read file '+_l}});
		    							}
		    						},
		    						function(err) {
		    							ternWorker.postMessage({request: 'read', args: {logical: _l, message: err.toString(), error: 'Failed to read file '+_l}});
		    						});	
		    					} else {
		    						var file = _d.args.file;
		    						return fileClient.read(file).then(function(contents) {
		    									ternWorker.postMessage({request: 'read', args:{contents:contents, file:file}});	
		    								});
		    					}
		    					break;
		    				}
		    			}
		    		}
		    	}, 
		    	function(err) {
		    		Logger.log(err);	
		    	});
    	
    	provider.registerService("orion.edit.contentassist", new TernAssist.TernContentAssist(astManager, ternWorker),  //$NON-NLS-0$
    			{
    				contentType: ["application/javascript", "text/html"],  //$NON-NLS-0$ //$NON-NLS-2$
    				nls: 'javascript/nls/messages',  //$NON-NLS-0$
    				name: 'ternContentAssist',  //$NON-NLS-0$
    				id: "orion.edit.contentassist.javascript.tern",  //$NON-NLS-0$
    				charTriggers: "[.]",  //$NON-NLS-0$
    				excludedStyles: "(string.*)"  //$NON-NLS-0$
    		});
    	
    	/**
    	 * Register the jsdoc-based outline
    	 */
    	provider.registerService("orion.edit.outliner", new Outliner.JSOutliner(astManager),  //$NON-NLS-0$
    			{ contentType: ["application/javascript"],  //$NON-NLS-0$
    		name: javascriptMessages["sourceOutline"],  //$NON-NLS-0$
    		title: javascriptMessages['sourceOutlineTitle'],  //$NON-NLS-0$
    		id: "orion.javascript.outliner.source"  //$NON-NLS-0$
    			});
    	
    	/**
    	 * Register the mark occurrences support
    	 */
    	provider.registerService("orion.edit.occurrences", new Occurrences.JavaScriptOccurrences(astManager),  //$NON-NLS-0$
    			{
    		contentType: ["application/javascript", "text/html"]	//$NON-NLS-0$ //$NON-NLS-2$
    			});
    	
    	/**
    	 * Register the hover support
    	 */
    	provider.registerService("orion.edit.hover", new Hover.JavaScriptHover(astManager, scriptresolver, ternWorker),  //$NON-NLS-0$
    			{
    		name: javascriptMessages['jsHover'],
    		contentType: ["application/javascript", "text/html"]	//$NON-NLS-0$ //$NON-NLS-2$
    			});

    	var validator = new EslintValidator(astManager);
    	
    	/**
    	 * Register the ESLint validator
    	 */
    	provider.registerService("orion.edit.validator", validator,  //$NON-NLS-0$  //$NON-NLS-2$
    			{
    		contentType: ["application/javascript", "text/html"],  //$NON-NLS-0$ //$NON-NLS-2$
    		pid: 'eslint.config'  //$NON-NLS-0$
    			});
    			
    	/**
    	 * Register AST manager as Model Change listener
    	 */
    	provider.registerService("orion.edit.model", {  //$NON-NLS-0$
    		onModelChanging: astManager.onModelChanging.bind(astManager),
    		onInputChanged: astManager.onInputChanged.bind(astManager)
    	},
    	{
    		contentType: ["application/javascript", "text/html"],  //$NON-NLS-0$ //$NON-NLS-2$
    		types: ["ModelChanging", 'Destroy', 'onSaving', 'onInputChanged']  //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$ //$NON-NLS-4$
    	});
    	
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
    			new GenerateDocCommand.GenerateDocCommand(astManager), 
    			{
    		name: javascriptMessages["generateDocName"],  //$NON-NLS-0$
    		tooltip : javascriptMessages['generateDocTooltip'],  //$NON-NLS-0$
    		id : "generate.js.doc.comment",  //$NON-NLS-0$
    		key : [ "j", false, true, !Util.isMac, Util.isMac],  //$NON-NLS-0$
    		contentType: ['application/javascript', 'text/html']  //$NON-NLS-0$ //$NON-NLS-2$
    			}
    	);
    	
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
    			new OpenDeclCommand.OpenDeclarationCommand(astManager, scriptresolver, ternWorker), 
    			{
    		name: javascriptMessages["openDeclName"],  //$NON-NLS-0$
    		tooltip : javascriptMessages['openDeclTooltip'],  //$NON-NLS-0$
    		id : "open.js.decl",  //$NON-NLS-0$
    		key : [ 114, false, false, false, false],  //$NON-NLS-0$
    		contentType: ['application/javascript']  //$NON-NLS-0$
    			}
    	);

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
    			new RenameCommand.RenameCommand(astManager, ternWorker), 
    			{
    		name: javascriptMessages['renameElement'],  //$NON-NLS-0$
    		tooltip : javascriptMessages['renameElementTooltip'],  //$NON-NLS-0$
    		id : "rename.js.element",  //$NON-NLS-0$
    		key : [ 'R', false, true, !Util.isMac, Util.isMac],  //$NON-NLS-0$
    		contentType: ['application/javascript']  //$NON-NLS-0$
    			}
    	);

    	var quickFixComputer = new QuickFixes.JavaScriptQuickfixes(astManager);
    	
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
    			quickFixComputer, 
    			{
        			name: javascriptMessages["removeExtraSemiFixName"],  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "rm.extra.semi.fix",  //$NON-NLS-0$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-0$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-extra-semi)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);
    	
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
    			quickFixComputer, 
    			{
        			name: javascriptMessages["addFallthroughCommentFixName"],  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "add.fallthrough.comment.fix",  //$NON-NLS-0$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-0$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-fallthrough)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);
    	
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
    			{
        			execute: function(editorContext, context) {
        				if(context.annotation.id === 'no-fallthrough') {
        				    context.annotation.fixid = 'no-fallthrough-break'; //$NON-NLS-1$
        				}
        				return quickFixComputer.execute(editorContext, context);
        			} 
    		    },
    			{
        			name: javascriptMessages["addBBreakFixName"],  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "add.fallthrough.break.fix",  //$NON-NLS-0$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-0$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-fallthrough)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);
    	
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
    			quickFixComputer, 
    			{
        			name: javascriptMessages["addEmptyCommentFixName"],  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "add.empty.comment.fix",  //$NON-NLS-0$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-0$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-empty-block)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);
    	
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
    			quickFixComputer, 
    			{
        			name: javascriptMessages["addESLintEnvFixName"],  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "add.eslint-env.fix",  //$NON-NLS-0$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-0$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-undef-defined-inenv)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);
    	
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
    			quickFixComputer, 
    			{
        			name: javascriptMessages["addESLintGlobalFixName"],  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "add.eslint-global.fix",  //$NON-NLS-0$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-0$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-undef-defined)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);
    	
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
    			{
    		execute: function(editorContext, context) {
    			if(context.annotation.id === 'no-unused-params-expr') {
    			    context.annotation.fixid = 'no-unused-params'; //$NON-NLS-1$
                    //return quickFixComputer['no-unused-params'](editorContext, context.annotation, astManager);
    			}
    			return quickFixComputer.execute(editorContext, context);
    		}
    			}, 
    			{
    				name: javascriptMessages["removeUnusedParamsFixName"],  //$NON-NLS-0$
    				scopeId: "orion.edit.quickfix", //$NON-NLS-1$
    				id : "remove.unused.param.fix",  //$NON-NLS-0$
    				contentType: ['application/javascript', 'text/html'],  //$NON-NLS-0$ //$NON-NLS-2$
    				validationProperties: [
                        {source: "annotation:id", match: "^(?:no-unused-params|no-unused-params-expr)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);
    	
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
    			quickFixComputer, 
    			{
        			name: javascriptMessages["commentCallbackFixName"],  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "comment.callback.fix",  //$NON-NLS-0$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-0$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-unused-params-expr)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);
    	
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
    			quickFixComputer, 
    			{
        			name: javascriptMessages["eqeqeqFixName"],  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "eqeqeq.fix",  //$NON-NLS-0$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-0$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:eqeqeq)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);
    	
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
    			quickFixComputer, 
    			{
        			name: javascriptMessages["unreachableFixName"],  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "remove.unreachable.fix",  //$NON-NLS-0$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-0$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-unreachable)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);
    	
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
    			quickFixComputer, 
    			{
        			name: javascriptMessages["sparseArrayFixName"],  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "sparse.array.fix",  //$NON-NLS-0$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-0$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-sparse-arrays)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);
    	
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
    			quickFixComputer, 
    			{
        			name: javascriptMessages["semiFixName"],  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "semi.fix",  //$NON-NLS-0$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-0$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:semi)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);
    	
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
    			quickFixComputer, 
    			{
        			name: javascriptMessages["unusedVarsUnusedFixName"],  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "unused.var.fix",  //$NON-NLS-0$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-0$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-unused-vars-unused)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);
    	
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
    			quickFixComputer, 
    			{
        			name: javascriptMessages["unusedFuncDeclFixName"],  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "unused.func.decl.fix",  //$NON-NLS-0$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-0$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-unused-vars-unused-funcdecl)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);
    	
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
    			quickFixComputer, 
    			{
        			name: javascriptMessages["noCommaDangleFixName"],  //$NON-NLS-0$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "no.comma.dangle.fix",  //$NON-NLS-0$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-0$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-comma-dangle)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);

        provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
                quickFixComputer,
                {
                    name: javascriptMessages["noThrowLiteralFixName"],  //$NON-NLS-0$
                    scopeId: "orion.edit.quickfix", //$NON-NLS-1$
                    id : "no.throw.literal.fix",  //$NON-NLS-0$
                    contentType: ['application/javascript', 'text/html'],  //$NON-NLS-0$ //$NON-NLS-2$
                    validationProperties: [
                        {source: "annotation:id", match: "^(?:no-throw-literal)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
                }
        );
        
        provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-0$
                quickFixComputer,
                {
                    name: javascriptMessages["missingNlsFixName"],  //$NON-NLS-0$
                    scopeId: "orion.edit.quickfix", //$NON-NLS-0$
                    id : "missing.nls.fix",  //$NON-NLS-0$
                    contentType: ['application/javascript', 'text/html'],  //$NON-NLS-0$ //$NON-NLS-1$ //$NON-NLS-2$
                    validationProperties: [
                        {source: "annotation:id", match: "^(?:missing-nls)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
                }
        );

    	/**
    	 * legacy pref id
    	 */
    	provider.registerService("orion.cm.managedservice", validator, {pid: "eslint.config"}); //$NON-NLS-1$ //$NON-NLS-2$
    	/**
    	 * new sectioned pref block ids
    	 */
    	provider.registerService("orion.cm.managedservice", validator, {pid: "eslint.config.potential"}); //$NON-NLS-1$ //$NON-NLS-2$
    	provider.registerService("orion.cm.managedservice", validator, {pid: "eslint.config.practices"}); //$NON-NLS-1$ //$NON-NLS-2$
    	provider.registerService("orion.cm.managedservice", validator, {pid: "eslint.config.codestyle"}); //$NON-NLS-1$ //$NON-NLS-2$
    	
    	/**
    	 * ESLint settings
    	 */
    	var ignore = 0, warning = 1, error = 2, severities = [
    	                                                      {label: javascriptMessages.ignore,  value: ignore},  //$NON-NLS-0$
    	                                                      {label: javascriptMessages.warning, value: warning},  //$NON-NLS-0$
    	                                                      {label: javascriptMessages.error,   value: error}  //$NON-NLS-0$
    	                                                      ];
    	provider.registerService("orion.core.setting",  //$NON-NLS-0$
    			{},
    			{	settings: [
    			 	           {   pid: "eslint.config.potential",  //$NON-NLS-0$
    			 	           	   order: 1,
				 	        	   name: javascriptMessages['prefPotentialProblems'],  //$NON-NLS-0$
 				 	        	   tags: "validation javascript js eslint".split(" "),  //$NON-NLS-0$  //$NON-NLS-1$
 				 	        	   category: "javascript",  //$NON-NLS-0$
 				 	        	   properties: [{	id: "no-cond-assign",  //$NON-NLS-0$ 
    			 	        	                	name: javascriptMessages["noCondAssign"], //$NON-NLS-0$
    			 	        	                	type: "number", //$NON-NLS-0$
    			 	        	                	defaultValue: error, //$NON-NLS-0$
    			 	        	                	options: severities //$NON-NLS-0$
    			 	        	                },
    			 	        	                {	id: "no-constant-condition",  //$NON-NLS-0$
    			 	        	                	name: javascriptMessages["noConstantCondition"], //$NON-NLS-0$
    			 	        	                	type: "number", //$NON-NLS-0$
    			 	        	                	defaultValue: error, //$NON-NLS-0$
    			 	        	                	options: severities //$NON-NLS-0$
    			 	        	                },
    			 	        	                {   id: "no-console",  //$NON-NLS-0$
    			 	        	                	name: javascriptMessages["noConsole"], //$NON-NLS-0$
    			 	        	                	type: "number", //$NON-NLS-0$
    			 	        	                	defaultValue: error, //$NON-NLS-0$
    			 	        	                	options: severities //$NON-NLS-0$
    			 	        	                },
     				 	        	            {	id: "no-debugger",  //$NON-NLS-0$
 				 	        	                	name: javascriptMessages["noDebugger"],  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "no-dupe-keys",  //$NON-NLS-0$
				 	        	                	name: javascriptMessages["noDupeKeys"],  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "valid-typeof",  //$NON-NLS-0$
				 	        	                	name: javascriptMessages["validTypeof"],  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "no-regex-spaces",  //$NON-NLS-0$
				 	        	                	name: javascriptMessages["noRegexSpaces"], //$NON-NLS-0$
				 	        	                	type: "number", //$NON-NLS-0$
				 	        	                	defaultValue: error, //$NON-NLS-0$
				 	        	                	options: severities //$NON-NLS-0$
				 	        	                },
				 	        	                {	id: "use-isnan",  //$NON-NLS-0$
				 	        	                	name: javascriptMessages["useIsNaN"],  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "no-reserved-keys", //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noReservedKeys"], //$NON-NLS-0$
				 	        	                	type: "number", //$NON-NLS-0$
				 	        	                	defaultValue: error, //$NON-NLS-0$
				 	        	                	options: severities //$NON-NLS-0$
				 	        	                },
				 	        	                {	id: "no-sparse-arrays", //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noSparseArrays"],  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "no-fallthrough",  //$NON-NLS-0$
				 	        	                	name: javascriptMessages["noFallthrough"],  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "no-comma-dangle", //$NON-NLS-0$
				 	        	                	name: javascriptMessages["noCommaDangle"], //$NON-NLS-0$
				 	        	                	type: "number", //$NON-NLS-0$
				 	        	                	defaultValue: ignore, //$NON-NLS-0$
				 	        	                	options: severities //$NON-NLS-0$
				 	        	                },
				 	        	                {	id: "no-empty-block",  //$NON-NLS-0$
				 	        	                	name: javascriptMessages["noEmptyBlock"],  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: ignore,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "no-extra-semi",  //$NON-NLS-0$
				 	        	                	name: javascriptMessages["unnecessarySemis"],  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "no-unreachable",  //$NON-NLS-0$
				 	        	                	name: javascriptMessages["noUnreachable"],  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
				 	        	                }]
				 	        	},
				 	        	{  pid: "eslint.config.practices",  //$NON-NLS-0$
				 	        	   order: 2,
				 	        	   name: javascriptMessages['prefBestPractices'],  //$NON-NLS-0$
				 	        	   tags: "validation javascript js eslint".split(" "),  //$NON-NLS-0$  //$NON-NLS-1$
				 	        	   category: "javascript",  //$NON-NLS-0$
				 	        	   properties: [{	id: "no-caller",  //$NON-NLS-0$
				 	        	                	name: javascriptMessages["noCaller"], //$NON-NLS-0$
				 	        	                	type: "number", //$NON-NLS-0$
				 	        	                	defaultValue: warning, //$NON-NLS-0$
				 	        	                	options: severities //$NON-NLS-0$
				 	        	                },
				 	        	                {	id: "eqeqeq",  //$NON-NLS-0$
				 	        	                	name: javascriptMessages["noEqeqeq"],  //$NON-NLS-0$
 				 	        	                	type: "number",  //$NON-NLS-0$
 				 	        	                	defaultValue: warning,
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "no-eval",  //$NON-NLS-0$
    			 	        	                	name: javascriptMessages["noEval"],  //$NON-NLS-0$
    			 	        	                	type: "number",  //$NON-NLS-0$
    			 	        	                	defaultValue: ignore,
    			 	        	                	options: severities
    			 	        	                },
    			 	        	                {	id: "no-implied-eval",  //$NON-NLS-0$
    			 	        	                	name: javascriptMessages["noImpliedEval"],  //$NON-NLS-0$
    			 	        	                	type: "number",  //$NON-NLS-0$
    			 	        	                	defaultValue: ignore,
    			 	        	                	options: severities
    			 	        	                },
    			 	        	                {	id: "no-iterator",  //$NON-NLS-0$
    			 	        	                	name: javascriptMessages["noIterator"], //$NON-NLS-0$
    			 	        	                	type: "number", //$NON-NLS-0$
    			 	        	                	defaultValue: error, //$NON-NLS-0$
    			 	        	                	options: severities //$NON-NLS-0$
    			 	        	                },
 				 	        	                {
    			 	        	                	id: "no-new-array", //$NON-NLS-0$
    			 	        	                	name: javascriptMessages["noNewArray"], //$NON-NLS-0$
    			 	        	                	type: "number", //$NON-NLS-0$
    			 	        	                	defaultValue: warning, //$NON-NLS-0$
    			 	        	                	options: severities //$NON-NLS-0$
    			 	        	                },
    			 	        	                {
    			 	        	                	id: "no-new-func", //$NON-NLS-0$
    			 	        	                	name: javascriptMessages["noNewFunc"], //$NON-NLS-0$
    			 	        	                	type: "number", //$NON-NLS-0$
    			 	        	                	defaultValue: warning, //$NON-NLS-0$
    			 	        	                	options: severities //$NON-NLS-0$
    			 	        	                },
    			 	        	                {
    			 	        	                	id: "no-new-object", //$NON-NLS-0$
    			 	        	                	name: javascriptMessages["noNewObject"], //$NON-NLS-0$
    			 	        	                	type: "number", //$NON-NLS-0$
    			 	        	                	defaultValue: warning, //$NON-NLS-0$
    			 	        	                	options: severities //$NON-NLS-0$
    			 	        	                },
    			 	        	                {
    			 	        	                	id: "no-new-wrappers", //$NON-NLS-0$
    			 	        	                	name: javascriptMessages["noNewWrappers"], //$NON-NLS-0$
    			 	        	                	type: "number", //$NON-NLS-0$
    			 	        	                	defaultValue: warning, //$NON-NLS-0$
    			 	        	                	options: severities //$NON-NLS-0$
    			 	        	                },
 				 	        	                {
 				 	        	                	id: "no-shadow-global", //$NON-NLS-0$
 				 	        	                	name: javascriptMessages["noShadowGlobals"], //$NON-NLS-0$
 				 	        	                	defaultValue: warning, //$NON-NLS-0$
 				 	        	                	type: "number",  //$NON-NLS-0$
 				 	        	                	options: severities //$NON-NLS-0$
 				 	        	                },
 				 	        	                {	id: "no-use-before-define",  //$NON-NLS-0$
 				 	        	                	name: javascriptMessages["useBeforeDefine"],  //$NON-NLS-0$
 				 	        	                	type: "number",  //$NON-NLS-0$
 				 	        	                	defaultValue: warning,
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "radix",  //$NON-NLS-0$
 				 	        	                    name: javascriptMessages['radix'],  //$NON-NLS-0$
 				 	        	                    type: 'number',  //$NON-NLS-0$
 				 	        	                	defaultValue: warning,
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "no-throw-literal",  //$NON-NLS-0$
 				 	        	                	name: javascriptMessages["noThrowLiteral"],  //$NON-NLS-0$
 				 	        	                	type: "number",  //$NON-NLS-0$
 				 	        	                	defaultValue: warning,
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "curly",  //$NON-NLS-0$
    			 	        	                	name: javascriptMessages["missingCurly"],  //$NON-NLS-0$
    			 	        	                	type: "number",  //$NON-NLS-0$
    			 	        	                	defaultValue: ignore,
    			 	        	                	options: severities
    			 	        	                },
 				 	        	                {	id: "no-undef",  //$NON-NLS-0$
 				 	        	                	name: javascriptMessages["undefMember"],  //$NON-NLS-0$
 				 	        	                	type: "number",  //$NON-NLS-0$
 				 	        	                	defaultValue: error,
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "no-unused-params",  //$NON-NLS-0$
 				 	        	                	name: javascriptMessages["unusedParams"],  //$NON-NLS-0$
 				 	        	                	type: "number",  //$NON-NLS-0$
 				 	        	                	defaultValue: warning,
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "no-unused-vars",  //$NON-NLS-0$
    			 	        	                	name: javascriptMessages["unusedVars"],  //$NON-NLS-0$
    			 	        	                	type: "number",  //$NON-NLS-0$
    			 	        	                	defaultValue: warning,
    			 	        	                	options: severities
    			 	        	                },
 				 	        	                {	id: "no-redeclare",  //$NON-NLS-0$
 				 	        	                    name: javascriptMessages['varRedecl'],
 				 	        	                    type: 'number',  //$NON-NLS-0$
 				 	        	                    defaultValue: warning,
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "no-shadow",  //$NON-NLS-0$
    			 	        	                	name: javascriptMessages["varShadow"],  //$NON-NLS-0$
    			 	        	                	type: "number",  //$NON-NLS-0$
    			 	        	                	defaultValue: warning,
    			 	        	                	options: severities
    			 	        	                }]
				 	            },
				 	        	{  pid: "eslint.config.codestyle",  //$NON-NLS-0$
				 	        	   order: 3,
				 	        	   name: javascriptMessages['prefCodeStyle'],  //$NON-NLS-0$
				 	        	   tags: "validation javascript js eslint".split(" "),  //$NON-NLS-0$  //$NON-NLS-1$
				 	        	   category: "javascript",  //$NON-NLS-0$
				 	        	   properties: [{	id: "missing-doc", //$NON-NLS-1$
				 	        	                	name: javascriptMessages["missingDoc"],  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: ignore,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "new-parens",  //$NON-NLS-0$
				 	        	                	name: javascriptMessages["newParens"],  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "semi",  //$NON-NLS-0$
				 	        	                	name: javascriptMessages["missingSemi"],  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "missing-nls",  //$NON-NLS-0$
				 	        	                	name: javascriptMessages["missingNls"],  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: ignore,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "no-jslint",  //$NON-NLS-0$
				 	        	                	name: javascriptMessages["unsupportedJSLint"],  //$NON-NLS-0$
				 	        	                	type: "number",  //$NON-NLS-0$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                }]
				 	        	}]
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
    			provider.registerService("orion.edit.highlighter", {}, newGrammars[current]); //$NON-NLS-1$
    		}
    	}
    	provider.connect();
	});
});

