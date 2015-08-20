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
'orion/Deferred',
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
'javascript/cuProvider',
'orion/util',
'logger',
'javascript/commands/generateDocCommand',
'javascript/commands/openDeclaration',
'javascript/commands/openImplementation',
'javascript/commands/renameCommand',
'javascript/commands/refsCommand',
'orion/editor/stylers/application_javascript/syntax',
'orion/editor/stylers/application_json/syntax',
'orion/editor/stylers/application_schema_json/syntax',
'orion/editor/stylers/application_x-ejs/syntax',
'i18n!javascript/nls/messages',
'orion/URL-shim'
], function(PluginProvider, Bootstrap, Deferred, FileClient, Metrics, Esprima, Estraverse, ScriptResolver, ASTManager, QuickFixes, TernAssist,
			EslintValidator, Occurrences, Hover, Outliner,	CUProvider, Util, Logger, GenerateDocCommand, OpenDeclCommand, OpenImplCommand,
			RenameCommand, RefsCommand, mJS, mJSON, mJSONSchema, mEJS, javascriptMessages) {

    var provider = new PluginProvider({
		name: javascriptMessages['pluginName'], //$NON-NLS-1$
		version: "1.0", //$NON-NLS-1$
		description: javascriptMessages['pluginDescription'] //$NON-NLS-1$
	});

    Bootstrap.startup().then(function(core) {

    	/**
    	 * Register the JavaScript content types
    	 */
    	provider.registerService("orion.core.contenttype", {}, { //$NON-NLS-1$
    		contentTypes: [
    		               {	id: "application/javascript", //$NON-NLS-1$
    		            	   "extends": "text/plain", //$NON-NLS-1$ //$NON-NLS-1$
    		            	   name: "JavaScript", //$NON-NLS-1$
    		            	   extension: ["js"], //$NON-NLS-1$
    		            	   imageClass: "file-sprite-javascript modelDecorationSprite" //$NON-NLS-1$
    		               }, {id: "application/json", //$NON-NLS-1$
    		            	   "extends": "text/plain", //$NON-NLS-1$ //$NON-NLS-1$
    		            	   name: "JSON", //$NON-NLS-1$
    		            	   extension: ["json", "pref"], //$NON-NLS-1$ //$NON-NLS-2$
    		            	   imageClass: "file-sprite-javascript modelDecorationSprite" //$NON-NLS-1$
    		               }, {id: "application/x-ejs", //$NON-NLS-1$
    		            	   "extends": "text/plain", //$NON-NLS-1$ //$NON-NLS-1$
    		            	   name: "Embedded Javascript", //$NON-NLS-1$
    		            	   extension: ["ejs"], //$NON-NLS-1$
    		            	   imageClass: "file-sprite-javascript modelDecorationSprite" //$NON-NLS-1$
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
    			var wUrl = new URL(script, window.location.href);
    			wUrl.query.set("worker-language", navigator.language);
    			this.worker = new SharedWorker(wUrl.href);
    			this.worker.port.onmessage = onMessage;
    			this.worker.port.onerror = onError;
    			this.worker.port.start();
    			this.worker.port.postMessage('');
    		} else { */
 				var wUrl = new URL(script, window.location.href);
    			wUrl.query.set("worker-language", navigator.language);   			 //$NON-NLS-1$
    			this.worker = new Worker(wUrl.href);
    			this.worker.onmessage = onMessage;
    			this.worker.onerror = onError;
    			this.worker.postMessage('start_server'); //$NON-NLS-1$
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

    	var prefService = core.serviceRegistry.getService("orion.core.preference"); //$NON-NLS-1$
    	/**
    	 * Object of contributed environments
    	 *
    	 * TODO will need to listen to updated tern plugin settings once enabled to clear this cache
    	 */
    	var contributedEnvs;

    	// Start the worker
    	var ternWorker = new WrappedWorker("ternWorker.js",  //$NON-NLS-1$
		    	function(evnt) {
		    		if(typeof(evnt.data) === 'object') {
		    			var _d  = evnt.data;
		    			switch(_d.request) {
		    				case 'read': {
		    					if(typeof(_d.args.file) === 'object') {
		    						var _l = _d.args.file.logical;
		    						scriptresolver.getWorkspaceFile(_l).then(function(files) {
		    							if(files && files.length > 0) {
		    								var rel = scriptresolver.resolveRelativeFiles(_l, files, {location: _d.args.file.file, contentType: {name: 'JavaScript'}}); //$NON-NLS-1$
		    								if(rel && rel.length > 0) {
			    								return fileClient.read(rel[0].location).then(function(contents) {
			    									ternWorker.postMessage({request: 'read', args:{contents:contents, file:rel[0].location, logical:_l, path:rel[0].path}});	 //$NON-NLS-1$
			    								});
		    								} else {
		    									ternWorker.postMessage({request: 'read', args: {logical:_l, error: 'Failed to read file '+_l}}); //$NON-NLS-1$ //$NON-NLS-2$
		    								}
		    							} else {
		    								ternWorker.postMessage({request: 'read', args: {logical:_l, error: 'Failed to read file '+_l}}); //$NON-NLS-1$ //$NON-NLS-2$
		    							}
		    						},
		    						function(err) {
		    							ternWorker.postMessage({request: 'read', args: {logical: _l, message: err.toString(), error: 'Failed to read file '+_l}}); //$NON-NLS-1$ //$NON-NLS-2$
		    						});
		    					} else {
		    						var file = _d.args.file;
		    						try {
			    						return fileClient.read(file).then(function(contents) {
			    									ternWorker.postMessage({request: 'read', args:{contents:contents, file:file}});	 //$NON-NLS-1$
			    								},
			    								function(err) {
			    									ternWorker.postMessage({request: 'read', args: {file: file, message: err.toString(), error: 'Failed to read file '+file}}); //$NON-NLS-1$ //$NON-NLS-2$
			    								});
			    					}
		    						catch(err) {
		    							ternWorker.postMessage({request: 'read', args: {file: file, message: err.toString(), error: 'Failed to read file '+file}}); //$NON-NLS-1$ //$NON-NLS-2$
		    						}
		    					}
		    					break;
		    				}
		    				case 'installed_plugins': {
		    					var plugins = _d.plugins;
		    					return prefService ? prefService.getPreferences("/cm/configurations").then(function(prefs){ //$NON-NLS-1$
									var props = prefs.get("tern/plugins"); //$NON-NLS-1$
									if (!props) {
										props = Object.create(null);
									} else if(typeof(props) === 'string') {
										props = JSON.parse(props);
									}
									var keys = Object.keys(plugins);
									for(var i = 0; i < keys.length; i++) {
										var key = keys[i];
										props[key] = plugins[key];
									}
									prefs.put("tern/plugins", JSON.stringify(props)); //$NON-NLS-1$
									prefs.sync(true);
								}) : new Deferred().resolve();
		    				}
		    				case 'environments': {
		    					contributedEnvs = _d.envs;
		    					break;
		    				}
		    			}
		    		} else if(typeof(evnt.data) === 'string') {
			    		if(evnt.data === 'server_ready') {
			    			ternWorker.postMessage({request: 'installed_plugins'}); //$NON-NLS-1$
		    				ternWorker.postMessage({request: 'environments'}); //$NON-NLS-1$
			    		}
			    	}
		    	},
		    	function(err) {
		    		Logger.log(err);
		    	});

    	/**
	     * @description Queries the Tern server to return all contributed environment names from the installed plugins
	     * @returns {Object} The object of contributed environments or null
	     * @since 9.0
	     */
	    function getEnvironments() {
    		var envDeferred = new Deferred();
    		if(!contributedEnvs) {
	    		ternWorker.addEventListener('message', function(evnt) {
	    			var _d  = evnt.data;
	    			switch(_d.request) {
	    				case 'environments': {
	    					contributedEnvs = _d.envs;
	    					envDeferred.resolve(_d.envs);
	    					break;
	    				}
	    			}
	    		}, false);
    			ternWorker.postMessage({request: 'environments'}); //$NON-NLS-1$
    		} else {
    			return envDeferred.resolve(contributedEnvs);
    		}
    		return envDeferred;
    	}

    	provider.registerService("orion.edit.contentassist", new TernAssist.TernContentAssist(astManager, ternWorker, getEnvironments),  //$NON-NLS-1$
    			{
    				contentType: ["application/javascript", "text/html"],  //$NON-NLS-1$ //$NON-NLS-2$
    				nls: 'javascript/nls/messages',  //$NON-NLS-1$
    				name: 'ternContentAssist',  //$NON-NLS-1$
    				id: "orion.edit.contentassist.javascript.tern",  //$NON-NLS-1$
    				charTriggers: "[.]",  //$NON-NLS-1$
    				excludedStyles: "(string.*)"  //$NON-NLS-1$
    		});

    	/**
    	 * Register the jsdoc-based outline
    	 */
    	provider.registerService("orion.edit.outliner", new Outliner.JSOutliner(astManager),  //$NON-NLS-1$
    			{ contentType: ["application/javascript"],  //$NON-NLS-1$
    		name: javascriptMessages["sourceOutline"],  //$NON-NLS-1$
    		title: javascriptMessages['sourceOutlineTitle'],  //$NON-NLS-1$
    		id: "orion.javascript.outliner.source"  //$NON-NLS-1$
    			});

    	/**
    	 * Register the mark occurrences support
    	 */
    	provider.registerService("orion.edit.occurrences", new Occurrences.JavaScriptOccurrences(astManager, CUProvider), //$NON-NLS-1$
    			{
    		contentType: ["application/javascript", "text/html"]	//$NON-NLS-1$ //$NON-NLS-2$
    			});

    	/**
    	 * Register the hover support
    	 */
    	provider.registerService("orion.edit.hover", new Hover.JavaScriptHover(astManager, scriptresolver, ternWorker, CUProvider),  //$NON-NLS-1$
    			{
    		name: javascriptMessages['jsHover'],
    		contentType: ["application/javascript", "text/html"]	//$NON-NLS-1$ //$NON-NLS-2$
    			});

    	var validator = new EslintValidator(astManager, CUProvider);

    	/**
    	 * Register the ESLint validator
    	 */
    	provider.registerService("orion.edit.validator", validator,  //$NON-NLS-1$  //$NON-NLS-2$
    			{
    		contentType: ["application/javascript", "text/html"],  //$NON-NLS-1$ //$NON-NLS-2$
    		pid: 'eslint.config'  //$NON-NLS-1$
    			});

    	/**
    	 * Register AST manager as Model Change listener
    	 */
    	provider.registerService("orion.edit.model", {  //$NON-NLS-1$
    		onModelChanging: astManager.onModelChanging.bind(astManager),
    		onInputChanged: astManager.onInputChanged.bind(astManager)
    	},
    	{
    		contentType: ["application/javascript", "text/html"],  //$NON-NLS-1$ //$NON-NLS-2$
    		types: ["ModelChanging", 'onInputChanged']  //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$ //$NON-NLS-4$
    	});

    	/**
    	 * register the compilation unit provider as a listener
    	 */
    	provider.registerService("orion.edit.model", {  //$NON-NLS-1$
    		onModelChanging: CUProvider.onModelChanging.bind(CUProvider),
    		onInputChanged: CUProvider.onInputChanged.bind(CUProvider)
    	},
    	{
    		contentType: ["text/html"],  //$NON-NLS-1$ //$NON-NLS-2$
    		types: ["ModelChanging", 'onInputChanged']  //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$ //$NON-NLS-4$
    	});

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			new GenerateDocCommand.GenerateDocCommand(astManager),
    			{
    		name: javascriptMessages["generateDocName"],  //$NON-NLS-1$
    		tooltip : javascriptMessages['generateDocTooltip'],  //$NON-NLS-1$
    		id : "generate.js.doc.comment",  //$NON-NLS-1$
    		key : [ "j", false, true, !Util.isMac, Util.isMac],  //$NON-NLS-1$
    		contentType: ['application/javascript', 'text/html']  //$NON-NLS-1$ //$NON-NLS-2$
    			}
    	);

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			new OpenDeclCommand.OpenDeclarationCommand(astManager, scriptresolver, ternWorker, CUProvider, "replace"),  //$NON-NLS-1$
    			{
    		name: javascriptMessages["openDeclName"],  //$NON-NLS-1$
    		tooltip : javascriptMessages['openDeclTooltip'],  //$NON-NLS-1$
    		id : "open.js.decl",  //$NON-NLS-1$
    		key : [ 114, false, false, false, false],  //$NON-NLS-1$
    		contentType: ['application/javascript']  //$NON-NLS-1$
    			}
    	);

		provider.registerServiceProvider("orion.edit.command.category", {}, { //$NON-NLS-1$
			  id : "js.references", //$NON-NLS-1$
	          name: javascriptMessages['referencesMenuName'],
	          tooltip : javascriptMessages['referencesMenuTooltip']
		});
		//TODO
		if ("true" === localStorage.getItem("darklaunch")) {
			var refscommand = new RefsCommand(ternWorker, scriptresolver);

	    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
	    			{
						execute: function(editorContext, options) {
							options.kind ='workspace'; //$NON-NLS-1$
							refscommand.execute(editorContext, options);
						}
					},
	    			{
	    		name: javascriptMessages["workspaceRefsName"],  //$NON-NLS-1$
	    		tooltip : javascriptMessages['workspaceRefsTooltip'],  //$NON-NLS-1$
	    		parentPath: "js.references", //$NON-NLS-1$
	    		id : "workspace.js.refs",  //$NON-NLS-1$
	    		key : [ "g", true, true, false, false],  //$NON-NLS-1$
	    		contentType: ['application/javascript', 'text/html']  //$NON-NLS-1$ //$NON-NLS-2$
	    			}
	    	);
	    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
	    			{
						execute: function(editorContext, options) {
							options.kind ='project'; //$NON-NLS-1$
							refscommand.execute(editorContext, options);
						}
					},
	    			{
	    		name: javascriptMessages["projectRefsName"],  //$NON-NLS-1$
	    		tooltip : javascriptMessages['projectRefsTooltip'],  //$NON-NLS-1$
	    		parentPath: "js.references", //$NON-NLS-1$
	    		id : "project.js.refs",  //$NON-NLS-1$
	    		key : [ "k", true, true, false, false],  //$NON-NLS-1$
	    		contentType: ['application/javascript', 'text/html']  //$NON-NLS-1$ //$NON-NLS-2$
	    			}
	    	);
		}
		//TODO
		if ("true" === localStorage.getItem("darklaunch")) {
	    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
	    			new OpenImplCommand.OpenImplementationCommand(astManager, scriptresolver, ternWorker, CUProvider),  //$NON-NLS-1$
	    			{
	    		name: javascriptMessages["openImplName"],  //$NON-NLS-1$
	    		tooltip : javascriptMessages['openImplTooltip'],  //$NON-NLS-1$
	    		id : "open.js.impl",  //$NON-NLS-1$
	    		contentType: ['application/javascript']  //$NON-NLS-1$
	    			}
	    	);
		}
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			new RenameCommand.RenameCommand(astManager, ternWorker, scriptresolver),
    			{
    		name: javascriptMessages['renameElement'],  //$NON-NLS-1$
    		tooltip : javascriptMessages['renameElementTooltip'],  //$NON-NLS-1$
    		id : "rename.js.element",  //$NON-NLS-1$
    		key : [ 'R', false, true, !Util.isMac, Util.isMac],  //$NON-NLS-1$
    		contentType: ['application/javascript']  //$NON-NLS-1$
    			}
    	);

    	var quickFixComputer = new QuickFixes.JavaScriptQuickfixes(astManager);

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			quickFixComputer,
    			{
        			name: javascriptMessages["removeExtraSemiFixName"],  //$NON-NLS-1$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "rm.extra.semi.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-extra-semi)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			quickFixComputer,
    			{
        			name: javascriptMessages["addFallthroughCommentFixName"],  //$NON-NLS-1$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "add.fallthrough.comment.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-fallthrough)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			{
        			execute: function(editorContext, context) {
        				if(context.annotation.id === 'no-fallthrough') {
        				    context.annotation.fixid = 'no-fallthrough-break'; //$NON-NLS-1$
        				}
        				return quickFixComputer.execute(editorContext, context);
        			}
    		    },
    			{
        			name: javascriptMessages["addBBreakFixName"],  //$NON-NLS-1$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "add.fallthrough.break.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-fallthrough)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			quickFixComputer,
    			{
        			name: javascriptMessages["addEmptyCommentFixName"],  //$NON-NLS-1$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "add.empty.comment.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-empty-block)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			quickFixComputer,
    			{
        			name: javascriptMessages["addESLintEnvFixName"],  //$NON-NLS-1$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "add.eslint-env.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-undef-defined-inenv)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			quickFixComputer,
    			{
        			name: javascriptMessages["noReservedKeysFixName"],  //$NON-NLS-1$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "update.reserved.property.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-reserved-keys)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			quickFixComputer,
    			{
        			name: javascriptMessages["useIsNanFixName"],  //$NON-NLS-1$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "use.isnan.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:use-isnan)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			quickFixComputer,
    			{
        			name: javascriptMessages["addESLintGlobalFixName"],  //$NON-NLS-1$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "add.eslint-global.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-undef-defined)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
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
    				name: javascriptMessages["removeUnusedParamsFixName"],  //$NON-NLS-1$
    				scopeId: "orion.edit.quickfix", //$NON-NLS-1$
    				id : "remove.unused.param.fix",  //$NON-NLS-1$
    				contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
    				validationProperties: [
                        {source: "annotation:id", match: "^(?:no-unused-params|no-unused-params-expr)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			quickFixComputer,
    			{
        			name: javascriptMessages["commentCallbackFixName"],  //$NON-NLS-1$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "comment.callback.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-unused-params-expr)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			quickFixComputer,
    			{
        			name: javascriptMessages["eqeqeqFixName"],  //$NON-NLS-1$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "eqeqeq.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:eqeqeq)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			quickFixComputer,
    			{
        			name: javascriptMessages["unreachableFixName"],  //$NON-NLS-1$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "remove.unreachable.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-unreachable)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			quickFixComputer,
    			{
        			name: javascriptMessages["sparseArrayFixName"],  //$NON-NLS-1$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "sparse.array.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-sparse-arrays)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			quickFixComputer,
    			{
        			name: javascriptMessages["semiFixName"],  //$NON-NLS-1$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "semi.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:semi)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			quickFixComputer,
    			{
        			name: javascriptMessages["unusedVarsUnusedFixName"],  //$NON-NLS-1$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "unused.var.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-unused-vars-unused)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			quickFixComputer,
    			{
        			name: javascriptMessages["unusedFuncDeclFixName"],  //$NON-NLS-1$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "unused.func.decl.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-unused-vars-unused-funcdecl)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			quickFixComputer,
    			{
        			name: javascriptMessages["noCommaDangleFixName"],  //$NON-NLS-1$
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "no.comma.dangle.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-comma-dangle)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);

        provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
                quickFixComputer,
                {
                    name: javascriptMessages["noThrowLiteralFixName"],  //$NON-NLS-1$
                    scopeId: "orion.edit.quickfix", //$NON-NLS-1$
                    id : "no.throw.literal.fix",  //$NON-NLS-1$
                    contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
                    validationProperties: [
                        {source: "annotation:id", match: "^(?:no-throw-literal)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
                }
        );

        provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
                quickFixComputer,
                {
                    name: javascriptMessages["missingNlsFixName"],  //$NON-NLS-1$
                    scopeId: "orion.edit.quickfix", //$NON-NLS-1$
                    id : "missing.nls.fix",  //$NON-NLS-1$
                    contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-1$ //$NON-NLS-2$
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
    	                                                      {label: javascriptMessages.ignore,  value: ignore},  //$NON-NLS-1$
    	                                                      {label: javascriptMessages.warning, value: warning},  //$NON-NLS-1$
    	                                                      {label: javascriptMessages.error,   value: error}  //$NON-NLS-1$
    	                                                      ];
    	provider.registerService("orion.core.setting",  //$NON-NLS-1$
    			{},
    			{	settings: [
    			 	           {   pid: "eslint.config.potential",  //$NON-NLS-1$
    			 	           	   order: 1,
				 	        	   name: javascriptMessages['prefPotentialProblems'],
 				 	        	   tags: "validation javascript js eslint".split(" "),  //$NON-NLS-1$  //$NON-NLS-1$
 				 	        	   category: 'javascript', //$NON-NLS-1$
 				 	        	   categoryLabel: javascriptMessages['javascriptValidation'],
 				 	        	   properties: [{	id: "no-cond-assign",  //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noCondAssign"],
    			 	        	                	type: "number", //$NON-NLS-1$
    			 	        	                	defaultValue: error, //$NON-NLS-1$
    			 	        	                	options: severities //$NON-NLS-1$
    			 	        	                },
    			 	        	                {	id: "no-constant-condition",  //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noConstantCondition"], //$NON-NLS-1$
    			 	        	                	type: "number", //$NON-NLS-1$
    			 	        	                	defaultValue: error, //$NON-NLS-1$
    			 	        	                	options: severities //$NON-NLS-1$
    			 	        	                },
    			 	        	                {   id: "no-console",  //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noConsole"], //$NON-NLS-1$
    			 	        	                	type: "number", //$NON-NLS-1$
    			 	        	                	defaultValue: error, //$NON-NLS-1$
    			 	        	                	options: severities //$NON-NLS-1$
    			 	        	                },
     				 	        	            {	id: "no-debugger",  //$NON-NLS-1$
 				 	        	                	name: javascriptMessages["noDebugger"],  //$NON-NLS-1$
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "no-dupe-keys",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noDupeKeys"],  //$NON-NLS-1$
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "valid-typeof",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["validTypeof"],  //$NON-NLS-1$
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "no-regex-spaces",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noRegexSpaces"], //$NON-NLS-1$
				 	        	                	type: "number", //$NON-NLS-1$
				 	        	                	defaultValue: error, //$NON-NLS-1$
				 	        	                	options: severities //$NON-NLS-1$
				 	        	                },
				 	        	                {	id: "use-isnan",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["useIsNaN"],  //$NON-NLS-1$
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "no-reserved-keys", //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noReservedKeys"], //$NON-NLS-1$
				 	        	                	type: "number", //$NON-NLS-1$
				 	        	                	defaultValue: error, //$NON-NLS-1$
				 	        	                	options: severities //$NON-NLS-1$
				 	        	                },
				 	        	                {	id: "no-sparse-arrays", //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noSparseArrays"],  //$NON-NLS-1$
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "no-fallthrough",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noFallthrough"],  //$NON-NLS-1$
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "no-comma-dangle", //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noCommaDangle"], //$NON-NLS-1$
				 	        	                	type: "number", //$NON-NLS-1$
				 	        	                	defaultValue: ignore, //$NON-NLS-1$
				 	        	                	options: severities //$NON-NLS-1$
				 	        	                },
				 	        	                {	id: "no-empty-block",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noEmptyBlock"],  //$NON-NLS-1$
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: ignore,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "no-extra-semi",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["unnecessarySemis"],  //$NON-NLS-1$
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "no-unreachable",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noUnreachable"],  //$NON-NLS-1$
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
				 	        	                }]
				 	        	},
				 	        	{  pid: "eslint.config.practices",  //$NON-NLS-1$
				 	        	   order: 2,
				 	        	   name: javascriptMessages['prefBestPractices'],  //$NON-NLS-1$
				 	        	   tags: "validation javascript js eslint".split(" "),  //$NON-NLS-1$  //$NON-NLS-1$
				 	        	   category: 'javascript', //$NON-NLS-1$
 				 	        	   categoryLabel: javascriptMessages['javascriptValidation'],
				 	        	   properties: [
				 	        	   				{	id: "no-caller",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noCaller"], //$NON-NLS-1$
				 	        	                	type: "number", //$NON-NLS-1$
				 	        	                	defaultValue: warning, //$NON-NLS-1$
				 	        	                	options: severities //$NON-NLS-1$
				 	        	                },
				 	        	                {	id: "eqeqeq",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noEqeqeq"],  //$NON-NLS-1$
 				 	        	                	type: "number",  //$NON-NLS-1$
 				 	        	                	defaultValue: warning,
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "no-eval",  //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noEval"],  //$NON-NLS-1$
    			 	        	                	type: "number",  //$NON-NLS-1$
    			 	        	                	defaultValue: ignore,
    			 	        	                	options: severities
    			 	        	                },
    			 	        	                {	id: "no-implied-eval",  //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noImpliedEval"],  //$NON-NLS-1$
    			 	        	                	type: "number",  //$NON-NLS-1$
    			 	        	                	defaultValue: ignore,
    			 	        	                	options: severities
    			 	        	                },
    			 	        	                {	id: "no-iterator",  //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noIterator"], //$NON-NLS-1$
    			 	        	                	type: "number", //$NON-NLS-1$
    			 	        	                	defaultValue: error, //$NON-NLS-1$
    			 	        	                	options: severities //$NON-NLS-1$
    			 	        	                },
 				 	        	                {
    			 	        	                	id: "no-new-array", //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noNewArray"], //$NON-NLS-1$
    			 	        	                	type: "number", //$NON-NLS-1$
    			 	        	                	defaultValue: warning, //$NON-NLS-1$
    			 	        	                	options: severities //$NON-NLS-1$
    			 	        	                },
    			 	        	                {
    			 	        	                	id: "no-new-func", //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noNewFunc"], //$NON-NLS-1$
    			 	        	                	type: "number", //$NON-NLS-1$
    			 	        	                	defaultValue: warning, //$NON-NLS-1$
    			 	        	                	options: severities //$NON-NLS-1$
    			 	        	                },
    			 	        	                {
    			 	        	                	id: "no-new-object", //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noNewObject"], //$NON-NLS-1$
    			 	        	                	type: "number", //$NON-NLS-1$
    			 	        	                	defaultValue: warning, //$NON-NLS-1$
    			 	        	                	options: severities //$NON-NLS-1$
    			 	        	                },
    			 	        	                {	id: "no-proto",  //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noProto"], //$NON-NLS-1$
    			 	        	                	type: "number", //$NON-NLS-1$
    			 	        	                	defaultValue: error, //$NON-NLS-1$
    			 	        	                	options: severities //$NON-NLS-1$
    			 	        	                },
    			 	        	                {
    			 	        	                	id: "no-with", //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noWith"], //$NON-NLS-1$
    			 	        	                	type: "number", //$NON-NLS-1$
    			 	        	                	defaultValue: warning, //$NON-NLS-1$
    			 	        	                	options: severities //$NON-NLS-1$
    			 	        	                },
    			 	        	                {
    			 	        	                	id: "no-new-wrappers", //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noNewWrappers"], //$NON-NLS-1$
    			 	        	                	type: "number", //$NON-NLS-1$
    			 	        	                	defaultValue: warning, //$NON-NLS-1$
    			 	        	                	options: severities //$NON-NLS-1$
    			 	        	                },
    			 	        	                {	id: "no-undef-init",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noUndefInit"], //$NON-NLS-1$
				 	        	                	type: "number", //$NON-NLS-1$
				 	        	                	defaultValue: warning, //$NON-NLS-1$
				 	        	                	options: severities //$NON-NLS-1$
				 	        	                },
 				 	        	                {
 				 	        	                	id: "no-shadow-global", //$NON-NLS-1$
 				 	        	                	name: javascriptMessages["noShadowGlobals"], //$NON-NLS-1$
 				 	        	                	defaultValue: warning, //$NON-NLS-1$
 				 	        	                	type: "number",  //$NON-NLS-1$
 				 	        	                	options: severities //$NON-NLS-1$
 				 	        	                },
 				 	        	                {	id: "no-use-before-define",  //$NON-NLS-1$
 				 	        	                	name: javascriptMessages["useBeforeDefine"],  //$NON-NLS-1$
 				 	        	                	type: "number",  //$NON-NLS-1$
 				 	        	                	defaultValue: warning,
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "radix",  //$NON-NLS-1$
 				 	        	                    name: javascriptMessages['radix'],  //$NON-NLS-1$
 				 	        	                    type: 'number',  //$NON-NLS-1$
 				 	        	                	defaultValue: warning,
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "no-throw-literal",  //$NON-NLS-1$
 				 	        	                	name: javascriptMessages["noThrowLiteral"],  //$NON-NLS-1$
 				 	        	                	type: "number",  //$NON-NLS-1$
 				 	        	                	defaultValue: warning,
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "curly",  //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["missingCurly"],  //$NON-NLS-1$
    			 	        	                	type: "number",  //$NON-NLS-1$
    			 	        	                	defaultValue: ignore,
    			 	        	                	options: severities
    			 	        	                },
 				 	        	                {	id: "no-undef",  //$NON-NLS-1$
 				 	        	                	name: javascriptMessages["undefMember"],  //$NON-NLS-1$
 				 	        	                	type: "number",  //$NON-NLS-1$
 				 	        	                	defaultValue: error,
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "no-unused-params",  //$NON-NLS-1$
 				 	        	                	name: javascriptMessages["unusedParams"],  //$NON-NLS-1$
 				 	        	                	type: "number",  //$NON-NLS-1$
 				 	        	                	defaultValue: warning,
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "no-unused-vars",  //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["unusedVars"],  //$NON-NLS-1$
    			 	        	                	type: "number",  //$NON-NLS-1$
    			 	        	                	defaultValue: warning,
    			 	        	                	options: severities
    			 	        	                },
 				 	        	                {	id: "no-redeclare",  //$NON-NLS-1$
 				 	        	                    name: javascriptMessages['varRedecl'],
 				 	        	                    type: 'number',  //$NON-NLS-1$
 				 	        	                    defaultValue: warning,
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "no-shadow",  //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["varShadow"],  //$NON-NLS-1$
    			 	        	                	type: "number",  //$NON-NLS-1$
    			 	        	                	defaultValue: warning,
    			 	        	                	options: severities
    			 	        	                }]
				 	            },
				 	        	{  pid: "eslint.config.codestyle",  //$NON-NLS-1$
				 	        	   order: 3,
				 	        	   name: javascriptMessages['prefCodeStyle'],  //$NON-NLS-1$
				 	        	   tags: "validation javascript js eslint".split(" "),  //$NON-NLS-1$  //$NON-NLS-1$
				 	        	   category: 'javascript', //$NON-NLS-1$
 				 	        	   categoryLabel: javascriptMessages['javascriptValidation'],
				 	        	   properties: [{	id: "missing-doc", //$NON-NLS-1$
				 	        	                	name: javascriptMessages["missingDoc"],  //$NON-NLS-1$
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: ignore,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "new-parens",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["newParens"],  //$NON-NLS-1$
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "semi",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["missingSemi"],  //$NON-NLS-1$
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "missing-nls",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["missingNls"],  //$NON-NLS-1$
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: ignore,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "no-jslint",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["unsupportedJSLint"],  //$NON-NLS-1$
				 	        	                	type: "number",  //$NON-NLS-1$
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

