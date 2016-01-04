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
'orion/serviceregistry',
'orion/Deferred',
'orion/metrics',
'esprima/esprima',
'estraverse/estraverse',
'javascript/scriptResolver',
'javascript/astManager',
'javascript/quickFixes',
'javascript/contentAssist/ternAssist',
'javascript/validator',
'javascript/occurrences',
'javascript/hover',
'javascript/outliner',
'javascript/cuProvider',
'javascript/ternProjectManager',
'orion/util',
'javascript/logger',
'javascript/commands/addToTernCommand',
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
'orion/i18nUtil',
'orion/URL-shim'
], function(PluginProvider, mServiceRegistry, Deferred, Metrics, Esprima, Estraverse, ScriptResolver, ASTManager, QuickFixes, TernAssist,
			EslintValidator, Occurrences, Hover, Outliner, CUProvider, TernProjectManager, Util, Logger, AddToTernCommand, GenerateDocCommand, OpenDeclCommand, OpenImplCommand,
			RenameCommand, RefsCommand, mJS, mJSON, mJSONSchema, mEJS, javascriptMessages, i18nUtil) {

	var serviceRegistry = new mServiceRegistry.ServiceRegistry();
    var provider = new PluginProvider({
		name: javascriptMessages['pluginName'],
		version: "1.0", //$NON-NLS-1$
		description: javascriptMessages['pluginDescription']
	}, serviceRegistry);

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
    		            	   extension: ["json", "pref", "tern-project"], //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
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
    	 * make sure the RecoveredNode is ignored
    	 * @since 9.0
    	 */
    	Estraverse.VisitorKeys.RecoveredNode = []; //do not visit
    	
    	/**
    	 * Create the script resolver
    	 * @since 8.0
    	 */
    	var scriptresolver = new ScriptResolver.ScriptResolver(serviceRegistry);
    	/**
    	 * Create the AST manager
    	 */
    	var astManager = new ASTManager.ASTManager(Esprima);

		var ternReady = false;
		var workerReady = false;
		var pendingStart = Object.create(null);
		var messageQueue = [];

    	function WrappedWorker(script, onMessage, onError) {
 			var wUrl = new URL(script, window.location.href);
    		wUrl.query.set("worker-language", navigator.language); //$NON-NLS-1$
    		this.worker = new Worker(wUrl.href);
    		this.worker.onmessage = onMessage.bind(this);
    		this.worker.onerror = onError.bind(this);
    		this.worker.postMessage({request: "start_worker"}); //$NON-NLS-1$
    		this.messageId = 0;
    		this.callbacks = Object.create(null);
    	}
    	
    	WrappedWorker.prototype.postMessage = function(msg, f) {
    		var starting = msg.request === "start_server";
    		if(starting) {
    			if(!workerReady) {
	    			pendingStart.msg = msg;
	    			pendingStart.f = f;
	    			return; //don't queue start_server requests
				}
    			ternReady = false;
    		}
    		if(ternReady || starting || msg.request === 'read') { //configuration reads can happen while the server is starting
				if(msg !== null && typeof(msg) === 'object') {
					if(typeof(msg.messageID) !== 'number' && typeof(msg.ternID) !== 'number') {
						//don't overwrite an id from a tern-side request
						msg.messageID = this.messageId++;
						this.callbacks[msg.messageID] = f;
					}
				}
	    		this.worker.postMessage(msg);
			} else {
				messageQueue.push({msg: msg, f: f});
			}
    	};

    	/**
    	 * Object of contributed environments
    	 *
    	 * TODO will need to listen to updated tern plugin settings once enabled to clear this cache
    	 */
    	var contributedEnvs;
		var ternWorker;
		
		var handlers ={
			'read': doRead,
			/**
			 * @callback
			 */
			'worker_ready': function(response) {
				workerReady = true;
				if (!pendingStart.msg || !pendingStart.msg.request){
					pendingStart.msg = {request: "start_server", args: {}}; //$NON-NLS-1$
				}
				ternWorker.postMessage(pendingStart.msg, pendingStart.f);
			},
			/**
			 * @callback
			 */
			'start_server': function(response) {
				serverReady();
			}
		};

		// Start the worker
    	ternWorker = new WrappedWorker("ternWorker.js",  //$NON-NLS-1$
	    	function(evnt) {
	    		var _d = evnt.data;
	    		if(_d.__isError) {
	    			//TODO log using the new platform hooks when available
	    			Logger.log(_d.message);
	    		} else if(typeof(_d) === 'object') {
					var id  = _d.messageID;
					var f = this.callbacks[id];
					if(typeof(f) === 'function') {
						f(_d, _d.error);
						delete this.callbacks[id];
					}
					var _handler = handlers[_d.request];
					if(typeof(_handler) === 'function') {
						_handler(_d);
					}
				}
	    	},
	    	function(err) {
	    		Logger.log(err);
	    });

		/**
		 * @description Handler for Tern read requests
		 * @param {Object} request Therequest from Tern
		 * @since 10.0
		 */
		function doRead(request) {
			var response = {request: 'read', ternID: request.ternID, args: {}}; //$NON-NLS-1$
			var fileClient = serviceRegistry.getService("orion.core.file.client"); //$NON-NLS-1$
			if(typeof(request.args.file) === 'object') {
				var _l = request.args.file.logical;
				response.args.logical = _l;
				scriptresolver.getWorkspaceFile(_l).then(function(files) {
					if(files && files.length > 0) {
						var rel = scriptresolver.resolveRelativeFiles(_l, files, {location: request.args.file.file, contentType: {name: 'JavaScript'}}); //$NON-NLS-1$
						if(rel && rel.length > 0) {
							return fileClient.read(rel[0].location).then(function(contents) {
								response.args.contents = contents;
								response.args.file = rel[0].location;
								response.args.path = rel[0].path;
								ternWorker.postMessage(response);
							});
						} else {
							response.args.error = i18nUtil.formatMessage(javascriptMessages['failedToReadFile'], _l);
							ternWorker.postMessage(response);
						}
					} else {
						response.args.error = i18nUtil.formatMessage(javascriptMessages['failedToReadFile'], _l);
						ternWorker.postMessage(response);
					}
				},
				function(err) {
					response.args.error = i18nUtil.formatMessage(javascriptMessages['failedToReadFile'], _l);
					response.args.message = err.toString();
					ternWorker.postMessage(response);
				});
			} else {
				var file = request.args.file;
				response.args.file = file;
				if(!/\.js|\.htm|\.htm$/ig.test(file)) {
					//no extension given, guess at js
					file += '.js'; //$NON-NLS-1$
				}
				try {
					return fileClient.read(file).then(function(contents) {
								response.args.contents = contents;
								ternWorker.postMessage(response);
							},
							function(err) {
								response.args.message = err.toString();
								response.args.error = i18nUtil.formatMessage(javascriptMessages['failedToReadFile'], file);
								ternWorker.postMessage(response);
							});
				}
				catch(err) {
					response.args.message = err.toString();
					response.args.error = i18nUtil.formatMessage(javascriptMessages['failedToReadFile'], file);
					ternWorker.postMessage(response);
				}
			}
		}
		
		/**
		 * @description Handles the server being ready
		 * @param {Object} request The request
		 * @since 10.0
		 */
		function serverReady() {
			ternReady = true;
			for(var i = 0, len = messageQueue.length; i < len; i++) {
				var item = messageQueue[i];
				ternWorker.postMessage(item.msg, item.f);
			}
			messageQueue = [];
			function cleanPrefs(prefs) {
				var all = Object.keys(prefs);
				for(i = 0, len = all.length; i < len; i++) {
					var id = all[i];
					if(/^tern.$/.test(id)) {
						delete prefs[id];
					}
				}
			}
			ternWorker.postMessage({request: 'installed_plugins'}, function(response) { //$NON-NLS-1$
				var plugins = response.plugins;
				var preferences = serviceRegistry.getService("orion.core.preference"); //$NON-NLS-1$
 				return preferences ? preferences.get("/cm/configurations").then(function(prefs){ // //$NON-NLS-1$
					var props = prefs["tern"];
					cleanPrefs(prefs);
					if (!props) {
						props = Object.create(null);
					} else if(typeof(props) === 'string') {
						props = JSON.parse(props);
					}
					var keys = Object.keys(plugins);
					var plugs = props.plugins ? props.plugins : Object.create(null);
					for(i = 0; i < keys.length; i++) {
						var key = keys[i];
						if(/^orion/.test(key)) {
							delete plugs[key]; //make sure only the latest of Orion builtins are shown
						}
						plugs[key] = plugins[key];
					}
					props.plugins = plugs;
					prefs["tern"] = JSON.stringify(props);
					return preferences.put("/cm/configurations", prefs, {clear: true}); //$NON-NLS-1$
				}) : new Deferred().resolve();
			});
		}

    	/**
	     * @description Queries the Tern server to return all contributed environment names from the installed plugins
	     * @returns {Object} The object of contributed environments or null
	     * @since 9.0
	     */
	    function getEnvironments() {
    		var envDeferred = new Deferred();
    		if(!contributedEnvs) {
    			ternWorker.postMessage({request: 'environments'}, function(response) { //$NON-NLS-1$
					contributedEnvs = response.envs;
	    			envDeferred.resolve(response.envs);
    			});
    		} else {
    			return envDeferred.resolve(contributedEnvs);
    		}
    		return envDeferred;
    	}

    	provider.registerService("orion.edit.contentassist", new TernAssist.TernContentAssist(astManager, ternWorker, getEnvironments, CUProvider),  //$NON-NLS-1$
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
    	provider.registerService("orion.edit.outliner", new Outliner.JSOutliner(ternWorker),  //$NON-NLS-1$
    			{ contentType: ["application/javascript"],  //$NON-NLS-1$
    		name: javascriptMessages["sourceOutline"],
    		title: javascriptMessages['sourceOutlineTitle'],
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

    	var validator = new EslintValidator(ternWorker);

    	/**
    	 * Register the ESLint validator
    	 */
    	provider.registerService("orion.edit.validator", validator,  //$NON-NLS-1$
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
    		types: ["ModelChanging", 'onInputChanged']  //$NON-NLS-1$ //$NON-NLS-2$
    	});
    	
    	var ternProjectManager = new TernProjectManager.TernProjectManager(ternWorker, scriptresolver);
    	/**
    	 * Register Tern project manager as input changed listener
    	 */
    	provider.registerService("orion.edit.model", {  //$NON-NLS-1$
    		onInputChanged: ternProjectManager.onInputChanged.bind(ternProjectManager)
    	},
    	{
    		contentType: ["application/javascript", "application/json", "text/html"],  //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
    		types: ['onInputChanged']  //$NON-NLS-1$
    	});
	    
	    if ("true" === localStorage.getItem("darklaunch")) {
	    	provider.registerServiceProvider("orion.navigate.command",  //$NON-NLS-1$
	    			new AddToTernCommand.AddToTernCommand(ternProjectManager),
	    			{
			    		name: javascriptMessages["addToTernCommand"],
			    		tooltip : javascriptMessages['addToTernCommandTooltip'],
			    		contentType: ["application/javascript", "text/html"],  //$NON-NLS-1$ //$NON-NLS-2$
			    		id : "add.js.tern"  //$NON-NLS-1$
	    			}
	    	);
    	}

    	/**
    	 * register the compilation unit provider as a listener
    	 */
    	provider.registerService("orion.edit.model", {  //$NON-NLS-1$
    		onModelChanging: CUProvider.onModelChanging.bind(CUProvider),
    		onInputChanged: CUProvider.onInputChanged.bind(CUProvider)
    	},
    	{
    		contentType: ["text/html"],  //$NON-NLS-1$
    		types: ["ModelChanging", 'onInputChanged']  //$NON-NLS-1$ //$NON-NLS-2$
    	});
    	
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			new GenerateDocCommand.GenerateDocCommand(astManager, CUProvider),
    			{
    		name: javascriptMessages["generateDocName"],
    		tooltip : javascriptMessages['generateDocTooltip'],
    		id : "generate.js.doc.comment",  //$NON-NLS-1$
    		key : [ "j", false, true, !Util.isMac, Util.isMac],  //$NON-NLS-1$
    		contentType: ['application/javascript', 'text/html']  //$NON-NLS-1$ //$NON-NLS-2$
    			}
    	);

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			new OpenDeclCommand.OpenDeclarationCommand(ternWorker, "replace"),  //$NON-NLS-1$
    			{
    		name: javascriptMessages["openDeclName"],
    		tooltip : javascriptMessages['openDeclTooltip'],
    		id : "open.js.decl",  //$NON-NLS-1$
    		key : [ 114, false, false, false, false],
    		contentType: ['application/javascript', 'text/html']  //$NON-NLS-1$ //$NON-NLS-2$
    			}
    	);
    	
		provider.registerServiceProvider("orion.edit.command.category", {}, { //$NON-NLS-1$
			  id : "js.references", //$NON-NLS-1$
	          name: javascriptMessages['referencesMenuName'],
	          tooltip : javascriptMessages['referencesMenuTooltip']
		});
		var refscommand = new RefsCommand(ternWorker, 
						astManager,
						scriptresolver,
						CUProvider,
						serviceRegistry);
		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			{
					execute: function(editorContext, options) {
						options.kind ='project'; //$NON-NLS-1$
						return refscommand.execute(editorContext, options);
					}
				},
    			{
    		name: javascriptMessages["projectRefsName"],
    		tooltip : javascriptMessages['projectRefsTooltip'],
    		parentPath: "js.references", //$NON-NLS-1$
    		id : "project.js.refs",  //$NON-NLS-1$
    		key : [ "y", true, true, false, false],  //$NON-NLS-1$
    		contentType: ['application/javascript', 'text/html']  //$NON-NLS-1$ //$NON-NLS-2$
    			}
    	);
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			{
					execute: function(editorContext, options) {
						options.kind ='workspace'; //$NON-NLS-1$
						return refscommand.execute(editorContext, options);
					}
				},
    			{
    		name: javascriptMessages["workspaceRefsName"],
    		tooltip : javascriptMessages['workspaceRefsTooltip'],
    		parentPath: "js.references", //$NON-NLS-1$
    		id : "workspace.js.refs",  //$NON-NLS-1$
    		//key : [ "g", true, true, false, false],
    		contentType: ['application/javascript', 'text/html']  //$NON-NLS-1$ //$NON-NLS-2$
    			}
    	);

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			new OpenImplCommand.OpenImplementationCommand(ternWorker),
    			{
    		name: javascriptMessages["openImplName"],
    		tooltip : javascriptMessages['openImplTooltip'],
    		id : "open.js.impl",  //$NON-NLS-1$
    		contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
			key : [ 114, true, false, false, false]
    			}
    	);
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			new RenameCommand.RenameCommand(ternWorker, scriptresolver),
    			{
    		name: javascriptMessages['renameElement'],
    		tooltip : javascriptMessages['renameElementTooltip'],
    		id : "rename.js.element",  //$NON-NLS-1$
    		key : [ 'R', false, true, !Util.isMac, Util.isMac],  //$NON-NLS-1$
    		contentType: ['application/javascript', 'text/html']  //$NON-NLS-1$ //$NON-NLS-2$
    			}
    	);

    	var quickFixComputer = new QuickFixes.JavaScriptQuickfixes(astManager);

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			quickFixComputer,
    			{
        			name: javascriptMessages["removeExtraSemiFixName"],
        			fixAllEnabled: true,
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
        			name: javascriptMessages["addFallthroughCommentFixName"],
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
        			name: javascriptMessages["addBBreakFixName"],
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
        			name: javascriptMessages["addEmptyCommentFixName"],
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
        			name: javascriptMessages["addESLintEnvFixName"],
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
        			name: javascriptMessages["noReservedKeysFixName"],
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
        			name: javascriptMessages["useIsNanFixName"],
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
        			name: javascriptMessages["addESLintGlobalFixName"],
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
    				name: javascriptMessages["removeUnusedParamsFixName"],
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
        			name: javascriptMessages["commentCallbackFixName"],
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
        			name: javascriptMessages["eqeqeqFixName"],
        			fixAllEnabled: true,
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
        			name: javascriptMessages["unreachableFixName"],
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
        			name: javascriptMessages["sparseArrayFixName"],
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
        			name: javascriptMessages["semiFixName"],
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
        			name: javascriptMessages["unusedVarsUnusedFixName"],
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
        			name: javascriptMessages["unusedFuncDeclFixName"],
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
        			name: javascriptMessages["noCommaDangleFixName"],
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
                    name: javascriptMessages["noThrowLiteralFixName"],
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
                    name: javascriptMessages["missingNlsFixName"],
                    scopeId: "orion.edit.quickfix", //$NON-NLS-1$
                    id : "missing.nls.fix",  //$NON-NLS-1$
                    contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-1$ //$NON-NLS-2$
                    validationProperties: [
                        {source: "annotation:id", match: "^(?:missing-nls)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
                }
        );
        
        provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
                quickFixComputer,
                {
                    name: javascriptMessages["unnecessaryNlsFixName"],
                    scopeId: "orion.edit.quickfix", //$NON-NLS-1$
                    id : "unnecessary.nls.fix",  //$NON-NLS-1$
                    contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-1$ //$NON-NLS-2$
                    validationProperties: [
                        {source: "annotation:id", match: "^(?:unnecessary-nls)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
                }
        );

		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			quickFixComputer,
    			{
        			name: javascriptMessages["noNewArrayFixName"],
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "no.new.array.literal.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-new-array)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
   			}
    		);

		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
			new RenameCommand.RenameCommand(ternWorker, scriptresolver),
			{
				name: javascriptMessages["noShadowFixName"],
				scopeId: "orion.edit.quickfix", //$NON-NLS-1$
				id : "no.shadow.fix",  //$NON-NLS-1$
				contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
				validationProperties: [
					{
						source: "annotation:id", //$NON-NLS-1$
						match: "^(?:no-shadow)$|^(?:no-shadow-global)$" //$NON-NLS-1$
					} 
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
    	                                                      {label: javascriptMessages.ignore,  value: ignore},
    	                                                      {label: javascriptMessages.warning, value: warning},
    	                                                      {label: javascriptMessages.error,   value: error}
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
 				 	        	   properties: [{
	 				 	        	   			id: "no-cond-assign",  //$NON-NLS-1$
	    			 	        	                	name: javascriptMessages["noCondAssign"],
	    			 	        	                	type: "number", //$NON-NLS-1$
	    			 	        	                	defaultValue: error,
	    			 	        	                	options: severities
    			 	        	                },
    			 	        	                {
	    			 	        	                	id: "no-constant-condition",  //$NON-NLS-1$
	    			 	        	                	name: javascriptMessages["noConstantCondition"],
	    			 	        	                	type: "number", //$NON-NLS-1$
	    			 	        	                	defaultValue: error,
	    			 	        	                	options: severities
    			 	        	                },
    			 	        	                {
	    			 	        	                	id: "no-console",  //$NON-NLS-1$
	    			 	        	                	name: javascriptMessages["noConsole"],
	    			 	        	                	type: "number", //$NON-NLS-1$
	    			 	        	                	defaultValue: error,
	    			 	        	                	options: severities
    			 	        	                },
    			 	        	                {
	    			 	        	                	id: "no-control-regex",  //$NON-NLS-1$
	    			 	        	                	name: javascriptMessages["no-control-regex"],
	    			 	        	                	type: "number", //$NON-NLS-1$
	    			 	        	                	defaultValue: error,
	    			 	        	                	options: severities
    			 	        	                },
										{
     				 	        	            	id: "no-debugger",  //$NON-NLS-1$
 				 	        	                	name: javascriptMessages["noDebugger"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
										},
				 	        	            {
				 	        	                	id: "no-dupe-keys",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noDupeKeys"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
				 	        	            },
				 	        	            {
				 	        	                	id: "no-duplicate-case",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["no-duplicate-case"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
				 	        	            },
				 	        	            {
				 	        	            		id: "valid-typeof",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["validTypeof"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
				 	        	            },
				 	        	            {
				 	        	            		id: "no-regex-spaces",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noRegexSpaces"],
				 	        	                	type: "number", //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
			 	        	                },
			 	        	                {
			 	        	                		id: "use-isnan",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["useIsNaN"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
			 	        	                },
			 	        	                {
			 	        	                		id: "no-reserved-keys", //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noReservedKeys"],
				 	        	                	type: "number", //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
			 	        	                },
			 	        	                {
			 	        	                		id: "no-sparse-arrays", //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noSparseArrays"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
			 	        	                },
			 	        	                {
			 	        	                		id: "no-fallthrough",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noFallthrough"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
			 	        	                },
			 	        	                {
			 	        	                		id: "no-comma-dangle", //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noCommaDangle"],
				 	        	                	type: "number", //$NON-NLS-1$
				 	        	                	defaultValue: ignore,
				 	        	                	options: severities
			 	        	                },
			 	        	                {
			 	        	                		id: "no-empty-block",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noEmptyBlock"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: ignore,
				 	        	                	options: severities
			 	        	                },
			 	        	                {
			 	        	                		id: "no-extra-semi",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["unnecessarySemis"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
			 	        	                },
			 	        	                {
			 	        	                		id: "no-unreachable",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noUnreachable"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
			 	        	                },
			 	        	                {
			 	        	                		id: "no-empty-character-class",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["no-empty-character-class"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
			 	        	                },
			 	        	                {
			 	        	                		id: "no-extra-boolean-cast",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["no-extra-boolean-cast"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
			 	        	                },
			 	        	                {
			 	        	                		id: "no-extra-parens",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["no-extra-parens"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
			 	        	                },
			 	        	                {
			 	        	                		id: "no-invalid-regexp",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["no-invalid-regexp"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
			 	        	                },
			 	        	                {
			 	        	                		id: "no-negated-in-lhs",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["no-negated-in-lhs"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
			 	        	                },
			 	        	                {
			 	        	                		id: "no-obj-calls",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["no-obj-calls"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
			 	        	                },
			 	        	                {
			 	        	                		id: "no-irregular-whitespace",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["no-irregular-whitespace"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: ignore,
				 	        	                	options: severities
			 	        	                }
			 	        	                ]
				 	        	},
				 	        	{  pid: "eslint.config.practices",  //$NON-NLS-1$
				 	        	   order: 2,
				 	        	   name: javascriptMessages['prefBestPractices'],
				 	        	   tags: "validation javascript js eslint".split(" "),  //$NON-NLS-1$  //$NON-NLS-1$
				 	        	   category: 'javascript', //$NON-NLS-1$
 				 	        	   categoryLabel: javascriptMessages['javascriptValidation'],
				 	        	   properties: [
				 	        	   				{	id: "no-caller",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noCaller"],
				 	        	                	type: "number", //$NON-NLS-1$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "eqeqeq",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noEqeqeq"],
 				 	        	                	type: "number",  //$NON-NLS-1$
 				 	        	                	defaultValue: warning,
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "no-eval",  //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noEval"],
    			 	        	                	type: "number",  //$NON-NLS-1$
    			 	        	                	defaultValue: ignore,
    			 	        	                	options: severities
    			 	        	                },
    			 	        	                {	id: "no-implied-eval",  //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noImpliedEval"],
    			 	        	                	type: "number",  //$NON-NLS-1$
    			 	        	                	defaultValue: ignore,
    			 	        	                	options: severities
    			 	        	                },
    			 	        	                {	id: "no-iterator",  //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noIterator"],
    			 	        	                	type: "number", //$NON-NLS-1$
    			 	        	                	defaultValue: error,
    			 	        	                	options: severities
    			 	        	                },
 				 	        	                {
    			 	        	                	id: "no-new-array", //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noNewArray"],
    			 	        	                	type: "number", //$NON-NLS-1$
    			 	        	                	defaultValue: warning,
    			 	        	                	options: severities
    			 	        	                },
    			 	        	                {
    			 	        	                	id: "no-new-func", //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noNewFunc"],
    			 	        	                	type: "number", //$NON-NLS-1$
    			 	        	                	defaultValue: warning,
    			 	        	                	options: severities
    			 	        	                },
    			 	        	                {
    			 	        	                	id: "no-new-object", //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noNewObject"],
    			 	        	                	type: "number", //$NON-NLS-1$
    			 	        	                	defaultValue: warning,
    			 	        	                	options: severities
    			 	        	                },
    			 	        	                {	id: "no-proto",  //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noProto"],
    			 	        	                	type: "number", //$NON-NLS-1$
    			 	        	                	defaultValue: error,
    			 	        	                	options: severities
    			 	        	                },
    			 	        	                {
    			 	        	                	id: "no-with", //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noWith"],
    			 	        	                	type: "number", //$NON-NLS-1$
    			 	        	                	defaultValue: warning,
    			 	        	                	options: severities
    			 	        	                },
    			 	        	                {
    			 	        	                	id: "no-new-wrappers", //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noNewWrappers"],
    			 	        	                	type: "number", //$NON-NLS-1$
    			 	        	                	defaultValue: warning,
    			 	        	                	options: severities
    			 	        	                },
    			 	        	                {	id: "no-undef-init",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noUndefInit"],
				 	        	                	type: "number", //$NON-NLS-1$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },
 				 	        	                {
 				 	        	                	id: "no-shadow-global", //$NON-NLS-1$
 				 	        	                	name: javascriptMessages["noShadowGlobals"],
 				 	        	                	defaultValue: warning,
 				 	        	                	type: "number",  //$NON-NLS-1$
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "no-use-before-define",  //$NON-NLS-1$
 				 	        	                	name: javascriptMessages["useBeforeDefine"],
 				 	        	                	type: "number",  //$NON-NLS-1$
 				 	        	                	defaultValue: warning,
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "radix",  //$NON-NLS-1$
 				 	        	                    name: javascriptMessages['radix'],
 				 	        	                    type: 'number',  //$NON-NLS-1$
 				 	        	                	defaultValue: warning,
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "no-throw-literal",  //$NON-NLS-1$
 				 	        	                	name: javascriptMessages["noThrowLiteral"],
 				 	        	                	type: "number",  //$NON-NLS-1$
 				 	        	                	defaultValue: warning,
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "curly",  //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["missingCurly"],
    			 	        	                	type: "number",  //$NON-NLS-1$
    			 	        	                	defaultValue: ignore,
    			 	        	                	options: severities
    			 	        	                },
 				 	        	                {	id: "no-undef",  //$NON-NLS-1$
 				 	        	                	name: javascriptMessages["undefMember"],
 				 	        	                	type: "number",  //$NON-NLS-1$
 				 	        	                	defaultValue: error,
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "no-unused-params",  //$NON-NLS-1$
 				 	        	                	name: javascriptMessages["unusedParams"],
 				 	        	                	type: "number",  //$NON-NLS-1$
 				 	        	                	defaultValue: warning,
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "no-unused-vars",  //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["unusedVars"],
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
 				 	        	            {
	 				 	        	            	id: "no-shadow",  //$NON-NLS-1$
	    			 	        	                	name: javascriptMessages["varShadow"],
	    			 	        	                	type: "number",  //$NON-NLS-1$
	    			 	        	                	defaultValue: warning,
	    			 	        	                	options: severities
    			 	        	                },
    			 	        	                {
    			 	        	                		id: "accessor-pairs",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["accessor-pairs"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
 				 	        	            },
			 	        	                {
			 	        	                		id: "no-eq-null",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["no-eq-null"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
			 	        	                },
			 	        	                {
			 	        	                		id: "no-else-return",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["no-else-return"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
			 	        	                },
			 	        	                {
			 	        	                		id: "no-empty-label",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["no-empty-label"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
			 	        	                },
			 	        	                {
			 	        	                		id: "no-self-compare",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["no-self-compare"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
			 	        	                },
			 	        	                {
			 	        	                		id: "no-self-assign",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["no-self-assign"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
 			 	        	                }
 				 	        	            ]
				 	            },
				 	        	{  pid: "eslint.config.codestyle",  //$NON-NLS-1$
				 	        	   order: 3,
				 	        	   name: javascriptMessages['prefCodeStyle'],
				 	        	   tags: "validation javascript js eslint".split(" "),  //$NON-NLS-1$  //$NON-NLS-1$
				 	        	   category: 'javascript', //$NON-NLS-1$
 				 	        	   categoryLabel: javascriptMessages['javascriptValidation'],
				 	        	   properties: [{	id: "missing-doc", //$NON-NLS-1$
				 	        	                	name: javascriptMessages["missingDoc"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: ignore,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "new-parens",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["newParens"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "semi",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["missingSemi"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "missing-nls",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["missingNls"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: ignore,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "unnecessary-nls",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["unnecessaryNls"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: ignore,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "no-jslint",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["unsupportedJSLint"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },
				 	        	                {	id: "no-mixed-spaces-and-tabs",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noMixedSpacesAndTabs"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: ignore,
				 	        	                	options: severities
 				 	        	                }
]
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
    	provider.connect(function() {
    		/**
	    	 * Re-init
	    	 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=462878
	    	 */
	    	Metrics.initFromRegistry(serviceRegistry);
    	});
});

