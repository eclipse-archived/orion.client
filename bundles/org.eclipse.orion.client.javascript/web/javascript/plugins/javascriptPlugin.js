/*******************************************************************************
 * @license
 * Copyright (c) 2013, 2016 IBM Corporation and others.
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
'javascript/scriptResolver',
'javascript/astManager',
'javascript/quickFixes',
'javascript/javascriptProject',
'javascript/contentAssist/ternAssist',
'javascript/contentAssist/ternProjectAssist',
'javascript/validator',
'javascript/ternProjectValidator',
'javascript/occurrences',
'javascript/hover',
'javascript/outliner',
'javascript/cuProvider',
'javascript/ternProjectManager',
'orion/util',
'javascript/logger',
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
], function(PluginProvider, mServiceRegistry, Deferred, ScriptResolver, ASTManager, QuickFixes, JavaScriptProject, TernAssist, TernProjectAssist,
			EslintValidator, TernProjectValidator, Occurrences, Hover, Outliner, CUProvider, TernProjectManager, Util, Logger, GenerateDocCommand, OpenDeclCommand, OpenImplCommand,
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
    		            	   extension: ["json", "pref", "tern-project", "eslintrc"], //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
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
    	 * Create the script resolver
    	 * @since 8.0
    	 */
    	var scriptresolver = new ScriptResolver.ScriptResolver(serviceRegistry);
    	
    	// Avoid using localStorage while running the plugin as a worker
    	//var TRACE = localStorage.js_message_trace === "true";
    	var TRACE = false;
    	
		var ternReady = false,
			workerReady = false,
			pendingStart,
			messageQueue = [], // for all other requests
			modifyQueue = []; // for add and removes only
		
		/**
		 * @description Make a new worker
		 */
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
	
	/**
	 * Use to reset the tern server when the .tern-project file is found and used.
	 */
	function setStarting() {
		ternReady = false;
	}

	/**
	 * @callback 
	 */
	WrappedWorker.prototype.postMessage = function(msg, f) {
		if(ternReady || msg.request === 'read') { //configuration reads can happen while the server is starting
			if(msg !== null && typeof msg === 'object') {
				if(typeof msg.messageID !== 'number' && typeof msg.ternID !== 'number') {
					//don't overwrite an id from a tern-side request
					msg.messageID = this.messageId++;
					this.callbacks[msg.messageID] = f;
				}
			}
			if(TRACE) {
				console.log("postMessage ("+this.messageId+") - SENT "+msg.request); //$NON-NLS-1$ //$NON-NLS-2$
			}
			this.worker.postMessage(msg);
		} else if(msg.request === "start_server") {
			if(!workerReady) {
				pendingStart = {msg: msg, f: f};
			} else {
				if(TRACE) {
					console.log("postMessage ("+this.messageId+") - START "+JSON.stringify(msg.args)); //$NON-NLS-1$ //$NON-NLS-2$
				}
				this.worker.postMessage(msg);
			}
		} else if (msg.request === "addFile" || msg.request === "delFile") {
			if(TRACE) {
				console.log("postMessage ("+this.messageId+") - MODIFY QUEUED: "+msg.request); //$NON-NLS-1$ //$NON-NLS-2$
			}
			modifyQueue.push({msg: msg, f: f});
		} else {
			if(TRACE) {
				console.log("postMessage ("+this.messageId+") - MESSAGE QUEUED: "+msg.request); //$NON-NLS-1$ //$NON-NLS-2$
			}
			messageQueue.push({msg: msg, f: f});
		}
	};

    	/**
    	 * Object of contributed environments
    	 *
    	 * TODO will need to listen to updated tern plugin settings once enabled to clear this cache
    	 */
    	var contributedEnvs,
			ternWorker;
			
		
		var handlers ={
			'read': doRead,
			/**
			 * @callback
			 */
			'worker_ready': function(response) {
				if(TRACE) {
					console.log("worker_ready ("+ternWorker.messageId+"): "+response.request); //$NON-NLS-1$ //$NON-NLS-2$
				}
				workerReady = true;
				if(pendingStart) {
					ternWorker.postMessage(pendingStart.msg, pendingStart.f);
					pendingStart = null;
				}
			},
			/**
			 * @callback
			 */
			'start_server': function(response) {
				if(TRACE) {
					console.log("server_ready ("+ternWorker.messageId+"): "+response.request); //$NON-NLS-1$ //$NON-NLS-2$
				}
				serverReady();
			}
		};

		// Start the worker
    	ternWorker = new WrappedWorker("ternWorker.js",  //$NON-NLS-1$
	    	function(evnt) {
	    		var _d = evnt.data;
	    		if(_d.__isError) {
	    			Logger.log(_d.message);
	    		} else if(typeof _d === 'object') {
					var id  = _d.messageID;
					var f = this.callbacks[id];
					if(typeof f === 'function') {
						f(_d, _d.error);
						delete this.callbacks[id];
					}
					var _handler = handlers[_d.request];
					if(typeof _handler === 'function') {
						_handler(_d);
					}
				}
	    	},
	    	function(err) {
	    		Logger.log(err);
	    });
	
	var ternProjectManager = new TernProjectManager.TernProjectManager(ternWorker, scriptresolver, serviceRegistry, setStarting);

	/**
	 * Create a new JavaScript project context
	 * @since 12.0
	 */
	var jsProject = new JavaScriptProject(serviceRegistry);
	provider.registerService("orion.edit.model", {  //$NON-NLS-1$
		onInputChanged: jsProject.onInputChanged.bind(jsProject)
	},
	{
		contentType: ["application/javascript", "text/html", "application/json"],  //$NON-NLS-1$ //$NON-NLS-2$
		types: ['onInputChanged']  //$NON-NLS-1$
	});
	
	jsProject.addHandler(ternProjectManager);

	/**
	 * Create the AST manager
	 */
	var astManager = new ASTManager.ASTManager(serviceRegistry, jsProject);

	/**
	 * @description Handler for Tern read requests
	 * @param {Object} request The request from Tern
	 * @since 10.0
	 */
	function doRead(request) {
		var response = {request: 'read', ternID: request.ternID, args: {}}; //$NON-NLS-1$
		var fileClient = serviceRegistry.getService("orion.core.file.client"); //$NON-NLS-1$
		if(typeof request.args.file === 'object') {
			var _l = request.args.file.logical;
			response.args.logical = _l;
			if(request.args.file.env === 'node') {
				if (!/^[\.]+/.test(_l)) {
					_nodeRead(response, _l, request.args.file.file, fileClient, null, 0, true);
				} else {
					_readRelative(request, response, _l, fileClient);
				}
			} else {
				if (!/^[\.]+/.test(_l)) {
					scriptresolver.getWorkspaceFile(_l).then(function(files) {
						if(files && files.length > 0) {
							return _normalRead(response, files[0].location, fileClient);
						}
						_failedRead(response, files[0].location, "File not found in workspace");
					},
					function(err) {
						_failedRead(response, _l, err);
					});
				} else {
					_readRelative(request, response, _l, fileClient);
				}
			}
		} else {
			_normalRead(response, request.args.file, fileClient);
		}
	}
	/**
	 * @since 12.0
	 */
	function _nodeRead(response, moduleName, filePath, fileclient, error, depth, subModules) {
		if (depth > 2) {
			if (TRACE) console.log("Don't read '" + moduleName + "': too deep");
			return _failedRead(response, moduleName, "Too deep");
		}
		var index = filePath.lastIndexOf('/', filePath.length - 2);
		if (index === -1) {
			return _failedRead(response, moduleName, error === null ? 'Could not read module ' + moduleName : error);
		}
		var parentFolder = filePath.substr(0, index + 1); // include the trailing / in the folder path
		if (parentFolder === filePath) {
			if (TRACE) console.log("Infinite loop reading '" + filePath);
			return _failedRead(response, moduleName, "Infinite loop");
		}
		var modulePath = parentFolder + "node_modules/" + moduleName;
		if (moduleName.indexOf('/') !== -1 && subModules) {
			// module name contains /
			var fileToLoad = modulePath;
			if (!/(\.js)$/.test(modulePath)) {
				fileToLoad += ".js";
			}
			if (!/(\.js)$/.test(modulePath)) {
				fileToLoad += ".js";
			}
			return fileclient.read(filePath).then(function(contents) {
				if (contents) {
					response.args.contents = contents;
					ternWorker.postMessage(response);
				} else {
					_nodeRead(response, moduleName, filePath, fileclient, "No contents", depth, false);
				}
			},
			function(err) {
				_nodeRead(response, moduleName, filePath, fileclient, err, depth, false);
			});
		}
		return fileclient.read(modulePath+"/package.json", false, false, {readIfExists: true}).then(function(json) {
			if(json) {
				var val = JSON.parse(json);
				var mainPath = null;
				var main = val.main;
				if (main) {
					if (!/(\.js)$/.test(main)) {
						main += ".js";
					}
				} else {
					main = "index.js";
				}
				mainPath = modulePath + "/" + main;
				return fileclient.read(mainPath).then(function(contents) {
					response.args.contents = contents;
					response.args.file = mainPath;
					response.args.path = main;
					if (TRACE) console.log(mainPath);
					ternWorker.postMessage(response);
				},
				function(err) {
					_failedRead(response, "node_modules", err);
				});
			}
			_nodeRead(response, moduleName, parentFolder, fileclient, "No contents", depth + 1, true);
		},
		function(err) {
			// if it fails, try to parent folder
			_nodeRead(response, moduleName, parentFolder, fileclient, err, depth + 1, true);
		});
	}
	/**
	 * @since 12.0
	 */
	function _normalRead(response, filePath, fileclient) {
		response.args.file = filePath;
		if(!/\.js|\.htm|\.htm$/ig.test(filePath)) {
			//no extension given, guess at js
			filePath += '.js'; //$NON-NLS-1$
		}
		return fileclient.read(filePath).then(function(contents) {
			response.args.contents = contents;
			ternWorker.postMessage(response);
		},
		function(err) {
			_failedRead(response, filePath, err);
		});
	}
	
	/**
	 * @since 12.0
	 */
	function _failedRead(response, fileName, err) {
		response.args.message = err.toString();
		response.args.error = i18nUtil.formatMessage(javascriptMessages['failedToReadFile'], fileName);
		ternWorker.postMessage(response);
	}
	/**
	 * @since 12.0
	 */
	function _readRelative(request, response, logical, fileclient) {
		scriptresolver.getWorkspaceFile(logical).then(function(files) {
			if(files && files.length > 0) {
				var rel = scriptresolver.resolveRelativeFiles(logical, files, {location: request.args.file.file, contentType: {name: 'JavaScript'}}); //$NON-NLS-1$
				if(rel && rel.length > 0) {
					return fileclient.read(rel[0].location).then(function(contents) {
						response.args.contents = contents;
						response.args.file = rel[0].location;
						response.args.path = rel[0].path;
						ternWorker.postMessage(response);
					});
				}
				response.args.error = i18nUtil.formatMessage(javascriptMessages['failedToReadFile'], logical);
				ternWorker.postMessage(response);
			} else {
				response.args.error = i18nUtil.formatMessage(javascriptMessages['failedToReadFile'], logical);
				ternWorker.postMessage(response);
			}
		},
		function(err) {
			_failedRead(response, logical, err);
		});
	}
		/**
		 * @description Handles the server being ready
		if (TRACE) console.log("Fail to read " + fileName + " - " + (err.error ? err.error : "<no error>"));
		 * @param {Object} request The request
		 * @since 10.0
		 */
		function serverReady() {
			ternReady = true;
			// process all add/remove first
			for(var i = 0, len = modifyQueue.length; i < len; i++) {
				var item = modifyQueue[i];
				if(TRACE) {
					console.log("clearing MODIFY queue: "+item.msg.request); //$NON-NLS-1$
				}
				ternWorker.postMessage(item.msg, item.f);
			}
			modifyQueue = [];
			// process remaining pending requests
			for(i = 0, len = messageQueue.length; i < len; i++) {
				item = messageQueue[i];
				if(TRACE) {
					console.log("clearing MESSAGE queue: "+item.msg.request); //$NON-NLS-1$
				}
				ternWorker.postMessage(item.msg, item.f);
			}
			messageQueue = [];
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

    	provider.registerService("orion.edit.contentassist", new TernAssist.TernContentAssist(astManager, ternWorker, getEnvironments, CUProvider, jsProject),  //$NON-NLS-1$
    			{
    				contentType: ["application/javascript", "text/html"],  //$NON-NLS-1$ //$NON-NLS-2$
    				nls: 'javascript/nls/messages',  //$NON-NLS-1$
    				name: 'ternContentAssist',  //$NON-NLS-1$
    				id: "orion.edit.contentassist.javascript.tern",  //$NON-NLS-1$
    				charTriggers: "[.]",  //$NON-NLS-1$
    				excludedStyles: "(string.*)"  //$NON-NLS-1$
    		});
		
		provider.registerService("orion.edit.contentassist",  //$NON-NLS-1$
				{
					/** @callback */
					computeContentAssist: function(editorContext, params) {
						return editorContext.getFileMetadata().then(function(meta) {
							if(meta.name === ".tern-project") {
								return editorContext.getText().then(function(text) {
									return TernProjectAssist.getProposals(text, params);
								});
							}
						});
					}
				}, 
    			{
    				contentType: ["application/json"],  //$NON-NLS-1$
    				nls: 'javascript/nls/messages',  //$NON-NLS-1$
    				name: 'ternProjectAssist',  //$NON-NLS-1$
    				id: "orion.edit.contentassist.javascript.tern.project"  //$NON-NLS-1$
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

    	provider.registerService("orion.edit.validator",  //$NON-NLS-1$
    		{
    			/**
    			 * @callback
    			 */
    			computeProblems: function(editorContext , context, config) {
    				return editorContext.getFileMetadata().then(function(meta) {
    					if(meta.name === '.tern-project') {
							return editorContext.getText().then(function(text) {
								return TernProjectValidator.validateAST(text);
							});
						}
						return null;
					});
    			}
    		},
    			{
    		contentType: ["application/json"]  //$NON-NLS-1$
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

    	var validator = new EslintValidator(ternWorker, jsProject, serviceRegistry);

    	/**
    	 * Register the ESLint validator
    	 */
    	provider.registerService("orion.edit.validator", validator,  //$NON-NLS-1$
    			{
    		contentType: ["application/javascript", "text/html"],  //$NON-NLS-1$ //$NON-NLS-2$
    		pid: 'eslint.config'  //$NON-NLS-1$
    			});
    			
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
    	
    	var generateDocCommand = new GenerateDocCommand.GenerateDocCommand(astManager, CUProvider);
    	
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			generateDocCommand,
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
    				/** @callback */
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
    				/** @callback */
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
    	var renameCommand = new RenameCommand.RenameCommand(ternWorker, scriptresolver);
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			renameCommand,
    			{
    		name: javascriptMessages['renameElement'],
    		tooltip : javascriptMessages['renameElementTooltip'],
    		id : "rename.js.element",  //$NON-NLS-1$
    		key : [ 'R', false, true, !Util.isMac, Util.isMac],  //$NON-NLS-1$
    		contentType: ['application/javascript', 'text/html']  //$NON-NLS-1$ //$NON-NLS-2$
    			}
    	);

    	var quickFixComputer = new QuickFixes.JavaScriptQuickfixes(astManager, renameCommand, generateDocCommand, jsProject, ternWorker);

		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			quickFixComputer,
    			{
        			name: javascriptMessages["curlyFixName"],
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "curly.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:curly)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);
    	
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			quickFixComputer,
    			{
        			name: javascriptMessages["removeExtraParensFixName"],
        			fixAllEnabled: true,
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "rm.extra.parens.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-extra-parens)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);

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
    				/** @callback */
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
        			name: javascriptMessages["addESLintEnvFixName"],
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "add.module.eslint-env.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:unknown-require-missing-env)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);
    	
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			quickFixComputer,
    			{
        			name: javascriptMessages["noReservedKeysFixName"],
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			fixAllEnabled: true,
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
        			fixAllEnabled: true,
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
    			quickFixComputer,
    			{
        			name: javascriptMessages["openDefinition"],
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "open.definition.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-undef-expression-defined-object)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			{
    				/** @callback */
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
    				fixAllEnabled: true,
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
        			name: javascriptMessages["unknownRequirePluginFixName"],
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "unknown.require.plugin.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:unknown-require-plugin)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);

		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			quickFixComputer,
    			{
        			name: javascriptMessages["noeqnullFixName"],
        			fixAllEnabled: true,
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "noeqnull.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-eq-null)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);

		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			quickFixComputer,
    			{
        			name: javascriptMessages["noundefinitFixName"],
        			fixAllEnabled: true,
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "no.undef.init.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-undef-init)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);
    	
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			quickFixComputer,
    			{
        			name: javascriptMessages["noselfassignFixName"],
        			fixAllEnabled: true,
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "no.self.assign.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-self-assign)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);
    	
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			{
    				/** @callback */
    				execute: function(editorContext, context) {
		    			if(context.annotation.id === 'no-self-assign') {
		    			    context.annotation.fixid = 'no-self-assign-rename'; //$NON-NLS-1$
		    			}
		    			return quickFixComputer.execute(editorContext, context);
		    		}
    			},
    			{
        			name: javascriptMessages["noselfassignRenameFixName"],
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "no.self.assign.rename.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-self-assign)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
    			}
    	);
		
		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			quickFixComputer,
    			{
        			name: javascriptMessages["newparensFixName"],
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "new.parens.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:new-parens)$"} //$NON-NLS-1$ //$NON-NLS-2$
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
        			fixAllEnabled: true,
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
        			name: javascriptMessages["unreadVarsFixName"],
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "unread.var.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
        			validationProperties: [
                        {source: "annotation:id", match: "^(?:no-unused-vars-unread)$"} //$NON-NLS-1$ //$NON-NLS-2$
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
        			fixAllEnabled: true,
        			scopeId: "orion.edit.quickfix", //$NON-NLS-1$
        			id : "no.comma.dangle.fix",  //$NON-NLS-1$
        			contentType: ['application/javascript', 'text/html', "application/json"],  //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
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
                    fixAllEnabled: true,
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
                    name: javascriptMessages["missingDocFixName"],
                    scopeId: "orion.edit.quickfix", //$NON-NLS-1$
                    id : "missing.doc.fix",  //$NON-NLS-1$
                    contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-1$ //$NON-NLS-2$
                    validationProperties: [
                        {source: "annotation:id", match: "^(?:missing-doc)$"} //$NON-NLS-1$ //$NON-NLS-2$
                    ]
                }
        );
        
        provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
                quickFixComputer,
                {
                    name: javascriptMessages["unnecessaryNlsFixName"],
                    fixAllEnabled: true,
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
				quickFixComputer,
				{
					name: javascriptMessages["noShadowFixName"],
					scopeId: "orion.edit.quickfix", //$NON-NLS-1$
					id : "no.shadow.fix",  //$NON-NLS-1$
					contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
					validationProperties: [
						{
							source: "annotation:id", //$NON-NLS-1$
							match: "^(?:no-shadow|no-shadow-global|no-shadow-global-param)$" //$NON-NLS-1$
						} 
					]
				}
		);
		
		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
				quickFixComputer,
				{
					name: javascriptMessages["noDebuggerFixName"],
					fixAllEnabled: true,
					scopeId: "orion.edit.quickfix", //$NON-NLS-1$
					id : "no.debugger.fix",  //$NON-NLS-1$
					contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
					validationProperties: [
						{
							source: "annotation:id", //$NON-NLS-1$
							match: "^(?:no-debugger)$" //$NON-NLS-1$
						} 
					]
				}
		);
		
		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
				quickFixComputer,
				{
					name: javascriptMessages["radixFixName"],
					fixAllEnabled: true,
					scopeId: "orion.edit.quickfix", //$NON-NLS-1$
					id : "radix.base.ten.fix",  //$NON-NLS-1$
					contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
					validationProperties: [
						{
							source: "annotation:id", //$NON-NLS-1$
							match: "^(?:radix)$" //$NON-NLS-1$
						} 
					]
				}
		);
		
		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
				quickFixComputer,
				{
					name: javascriptMessages["noNewWrappersFixName"],
					scopeId: "orion.edit.quickfix", //$NON-NLS-1$
					id : "no.new.wrappers.fix",  //$NON-NLS-1$
					contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
					validationProperties: [
						{
							source: "annotation:id", //$NON-NLS-1$
							match: "^(?:no-new-wrappers)$" //$NON-NLS-1$
						} 
					]
				}
		);
		
		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
				{
					/** @callback */
    				execute: function(editorContext, context) {
		    			if(context.annotation.id === 'no-new-wrappers') {
		    			    context.annotation.fixid = 'no-new-wrappers-literal'; //$NON-NLS-1$
		    			}
		    			return quickFixComputer.execute(editorContext, context);
		    		}
    			},
				{
					name: javascriptMessages["noNewWrappersLiteralFixName"],
					scopeId: "orion.edit.quickfix", //$NON-NLS-1$
					id : "no.new.wrappers.literal.fix",  //$NON-NLS-1$
					contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
					validationProperties: [
						{
							source: "annotation:id", //$NON-NLS-1$
							match: "^(?:no-new-wrappers)$" //$NON-NLS-1$
						} 
					]
				}
		);

		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
				quickFixComputer,
				{
					name: javascriptMessages["noDupeKeysFixName"],
					scopeId: "orion.edit.quickfix", //$NON-NLS-1$
					id : "no.dupe.keys.fix",  //$NON-NLS-1$
					contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
					validationProperties: [
						{
							source: "annotation:id", //$NON-NLS-1$
							match: "^(?:no-dupe-keys)$" //$NON-NLS-1$
						} 
					]
				}
		);

		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
				quickFixComputer,
				{
					name: javascriptMessages["noDuplicateCaseFixName"],
					scopeId: "orion.edit.quickfix", //$NON-NLS-1$
					id : "no.duplicate.case.fix",  //$NON-NLS-1$
					contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
					validationProperties: [
						{
							source: "annotation:id", //$NON-NLS-1$
							match: "^(?:no-duplicate-case)$" //$NON-NLS-1$
						} 
					]
				}
		);
		
		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
			quickFixComputer,
			{
				name: javascriptMessages["checkTernPluginFixName"],
				fixAllEnabled: false,
				scopeId: "orion.edit.quickfix", //$NON-NLS-1$
				id : "check.tern.plugin.fix",  //$NON-NLS-1$
				contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
				validationProperties: [
					{source: "annotation:id", match: "^(?:check-tern-plugin)$"} //$NON-NLS-1$ //$NON-NLS-2$
				]
			}
		);
		
		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
			quickFixComputer,
			{
				name: javascriptMessages["checkTernProjectFixName"],
				fixAllEnabled: false,
				scopeId: "orion.edit.quickfix", //$NON-NLS-1$
				id : "check.tern.project.fix",  //$NON-NLS-1$
				contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
				validationProperties: [
					{source: "annotation:id", match: "^(?:check-tern-project)$"} //$NON-NLS-1$ //$NON-NLS-2$
				]
			}
		);

		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
			quickFixComputer,
			{
				name: javascriptMessages["forbiddenExportImportFixName"],
				fixAllEnabled: false,
				scopeId: "orion.edit.quickfix", //$NON-NLS-1$
				id : "forbidden.export.import.fix",  //$NON-NLS-1$
				contentType: ['application/javascript', 'text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
				validationProperties: [
					{source: "annotation:id", match: "^(?:forbiddenExportImport)$"} //$NON-NLS-1$ //$NON-NLS-2$
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
    			 	        	                	id: "no-control-regex",  //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["no-control-regex"],
    			 	        	                	type: "number", //$NON-NLS-1$
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
			 	        	                		id: "no-obj-calls",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["no-obj-calls"],
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
     				 	        	            	id: "no-debugger",  //$NON-NLS-1$
 				 	        	                	name: javascriptMessages["noDebugger"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
												},		 	        	                	
			 	        	                	{
    			 	        	                	id: "no-console",  //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noConsole"],
    			 	        	                	type: "number", //$NON-NLS-1$
    			 	        	                	defaultValue: ignore,
    			 	        	                	options: severities
    			 	        	                },
												{
			 	        	                		id: "type-checked-consistent-return",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["type-checked-consistent-return"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: ignore,
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
				 	        	                	id: "no-dupe-keys",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noDupeKeys"],
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
			 	        	                		id: "no-invalid-regexp",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["no-invalid-regexp"],
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
				 	        	   				{
			 	        	                		id: "no-eq-null",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["no-eq-null"],
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
 			 	        	                	},
 			 	        	                	{
			 	        	                		id: "no-self-compare",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["no-self-compare"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
			 	        	                	},
				 	        	                {	id: "eqeqeq",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noEqeqeq"],
 				 	        	                	type: "number",  //$NON-NLS-1$
 				 	        	                	defaultValue: warning,
 				 	        	                	options: severities
 				 	        	                },
				 	        	   				{	id: "no-caller",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noCaller"],
				 	        	                	type: "number", //$NON-NLS-1$
				 	        	                	defaultValue: warning,
				 	        	                	options: severities
				 	        	                },
 				 	        	                {	id: "no-eval",  //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noEval"],
    			 	        	                	type: "number",  //$NON-NLS-1$
    			 	        	                	defaultValue: ignore,
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
    			 	        	                {
    			 	        	                	id: "no-with", //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noWith"],
    			 	        	                	type: "number", //$NON-NLS-1$
    			 	        	                	defaultValue: warning,
    			 	        	                	options: severities
    			 	        	                },
    			 	        	                {	id: "no-iterator",  //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noIterator"],
    			 	        	                	type: "number", //$NON-NLS-1$
    			 	        	                	defaultValue: error,
    			 	        	                	options: severities
    			 	        	                },
    			 	        	                {	id: "no-proto",  //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noProto"],
    			 	        	                	type: "number", //$NON-NLS-1$
    			 	        	                	defaultValue: error,
    			 	        	                	options: severities
    			 	        	                },
    			 	        	                {	id: "no-implied-eval",  //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["noImpliedEval"],
    			 	        	                	type: "number",  //$NON-NLS-1$
    			 	        	                	defaultValue: ignore,
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
													id: "check-tern-project",  //$NON-NLS-1$
													name: javascriptMessages["check-tern-project"],
													type: "number",  //$NON-NLS-1$
													defaultValue: ignore,
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
 				 	        	                	id: "no-shadow-global", //$NON-NLS-1$
 				 	        	                	name: javascriptMessages["noShadowGlobals"],
 				 	        	                	defaultValue: warning,
 				 	        	                	type: "number",  //$NON-NLS-1$
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "no-throw-literal",  //$NON-NLS-1$
 				 	        	                	name: javascriptMessages["noThrowLiteral"],
 				 	        	                	type: "number",  //$NON-NLS-1$
 				 	        	                	defaultValue: warning,
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "no-use-before-define",  //$NON-NLS-1$
 				 	        	                	name: javascriptMessages["useBeforeDefine"],
 				 	        	                	type: "number",  //$NON-NLS-1$
 				 	        	                	defaultValue: warning,
 				 	        	                	options: severities
 				 	        	                },
												{
													id: "check-tern-plugin",  //$NON-NLS-1$
													name: javascriptMessages["check-tern-plugin"],
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
 				 	        	                {
			 	        	                		id: "no-empty-label",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["no-empty-label"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: error,
				 	        	                	options: severities
			 	        	                	},
 				 	        	                {	id: "curly",  //$NON-NLS-1$
    			 	        	                	name: javascriptMessages["missingCurly"],
    			 	        	                	type: "number",  //$NON-NLS-1$
    			 	        	                	defaultValue: ignore,
    			 	        	                	options: severities
    			 	        	                },
 				 	        	                {	id: "no-undef-expression",  //$NON-NLS-1$
 				 	        	                	name: javascriptMessages["undefExpression"],
 				 	        	                	type: "number",  //$NON-NLS-1$
 				 	        	                	defaultValue: warning,
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "no-undef",  //$NON-NLS-1$
 				 	        	                	name: javascriptMessages["undefMember"],
 				 	        	                	type: "number",  //$NON-NLS-1$
 				 	        	                	defaultValue: error,
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "unknown-require",  //$NON-NLS-1$
 				 	        	                	name: javascriptMessages["unknownRequire"],
 				 	        	                	type: "number",  //$NON-NLS-1$
 				 	        	                	defaultValue: warning,
 				 	        	                	options: severities
 				 	        	                },
 				 	        	                {	id: "no-else-return",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["no-else-return"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: warning,
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
				 	        	                {	id: "no-mixed-spaces-and-tabs",  //$NON-NLS-1$
				 	        	                	name: javascriptMessages["noMixedSpacesAndTabs"],
				 	        	                	type: "number",  //$NON-NLS-1$
				 	        	                	defaultValue: ignore,
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
	    	var fc = serviceRegistry.getService("orion.core.file.client"); //$NON-NLS-1$
	    	fc.addEventListener("Changed", jsProject.onFileChanged.bind(jsProject));
	    	fc.addEventListener("Changed", astManager.onFileChanged.bind(astManager));
	    	fc.addEventListener("Changed", CUProvider.onFileChanged.bind(CUProvider));
	    	/*
	    	var prefs = serviceRegistry.getService("orion.core.preference"); //$NON-NLS-1$ //$NON-NLS-1$
			if(prefs) {
  				prefs.get("/js", null, {scope: 2}).then(function(prefs) { //$NON-NLS-1$
  					TRACE = prefs.message_trace === "true";
  				});
    		}*/	
    	});
});

