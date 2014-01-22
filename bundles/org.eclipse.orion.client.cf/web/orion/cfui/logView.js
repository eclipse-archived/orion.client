/*******************************************************************************
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define document window URL console*/
define([
	'orion/editor/editor',
	'orion/editor/textModel',
	'orion/editorView',
	'orion/inputManager',
	'orion/objects',
	'orion/webui/littlelib',
	'orion/PageUtil',
	'orion/Deferred',
	'orion/globalCommands',
	'orion/URL-shim'
], function(mEditor, mTextModel, mEditorView, mInputManager, objects, lib, PageUtil, Deferred, mGlobalCommands) {

	function handleError(statusService, error) {
		if (!statusService) {
			window.console.log(error);
			return;
		}
		if (error.status === 0) {
			error = {
				Severity: "Error", //$NON-NLS-0$
				Message: "No response"
			};
		} else {
			var responseText = error.responseText;
			if (responseText) {
				try {
					error = JSON.parse(responseText);
				} catch(e) {
					error = {
						//HTML: true,
						Severity: "Error", //$NON-NLS-0$
						Message: responseText
					};
				}
			}
		}
		statusService.setProgressResult(error);
	}

	function LogInputManager(options){
		mInputManager.InputManager.apply(this, [options]);
		this.cFClient = options.cFClient;
		this.commandRegistry = options.commandRegistry;
	}

	LogInputManager.prototype = new mInputManager.InputManager({});
	
	objects.mixin(LogInputManager.prototype, {
		_read: function(location, readOptions){
			var deferred = new Deferred();
			var currentInstance = this.applicationInfo.instance || Object.keys(this.applicationInfo.logs)[0];
			this.cFClient.getLogs(this.applicationInfo.Target, this.applicationInfo.Application, location, this.applicationInfo.instance).then(function(logInfo){
				var log = logInfo[currentInstance];
				log.Instance = currentInstance;
				deferred.resolve(log);
				
				mGlobalCommands.setPageTarget({
						task: "Cloud Foundry Logs",
						target: log,
						breadcrumbTarget: log,
						serviceRegistry: this.serviceRegistry,
						commandService: this.commandRegistry});
			}.bind(this));
			return deferred;
		},
		setApplicationInfo: function(appInfo){
			this.applicationInfo = appInfo;
		},
		getApplicationInfo: function(){
			return this.applicationInfo;	
		},
		load: function(){
			var logName = this.getInput();
			if(!logName){
				this.lastLogLoaded = null;
				this.lastLogInstance = null;
				return;
			}
			var progressTimeout = window.setTimeout(function() {
					progressTimeout = null;
					this.reportStatus("Fetching " + logName);
				}.bind(this), 800);
			var clearTimeout = function() {
				this.reportStatus("");
				if (progressTimeout) {
					window.clearTimeout(progressTimeout);
				}
			}.bind(this);
			var errorHandler = function(error) {
				clearTimeout();
				var statusService = this.serviceRegistry.getService("orion.page.message"); //$NON-NLS-0$
				handleError(statusService, error);
				this._setNoInput();
			}.bind(this);
			this._acceptPatch = null;
			
			if((!this.lastLogLoaded || this.lastLogLoaded!==logName) || (this.applicationInfo.instance !== null && this.lastLogInstance !== this.applicationInfo.instance)){
				// Read the log
				this.progressService.showWhile(this._read(logName, true), "Loading " + logName).then(function(metadata) {
					this._setInputContents(this._parsedLocation, logName, metadata.Contents, metadata);
					this.lastLogLoaded = logName;
					this.lastLogInstance = metadata.Instance;
				}.bind(this), errorHandler);
			} else {
			progressTimeout = window.setTimeout(function() {
								progressTimeout = null;
								this.reportStatus("Fetching " + logName);
							}.bind(this), 800);
				var found = false;
				var currentInstance = this.applicationInfo.instance || Object.keys(this.applicationInfo.logs)[0];
				this.cFClient.getLogs(this.applicationInfo.Target, this.applicationInfo.Application).then(function(logs){
					this.applicationInfo.logs[currentInstance].forEach(function(log){
						if(log.Name === logName){
							logs[currentInstance].forEach(function(log2){
								if(log2.Name === logName){
									if(log.Size!==log2.Size){
										found = true;
										this._read(logName, true).then(function(metadata) {
											clearTimeout();
											this._setInputContents(this._parsedLocation, logName, metadata.Contents, metadata);
											this.lastLogLoaded = logName;
										}.bind(this), errorHandler);
									}
								}
							}.bind(this));
						}
					}.bind(this));
					if(!found){
						clearTimeout();
					}
					this.applicationInfo.logs = logs;
					
				}.bind(this), errorHandler);
			}
		},
		constructor: LogInputManager
	});

	function LogEditorView(options) {
		this.options = options;
		this._parent = options.parent;
		this.serviceRegistry = options.serviceRegistry;
		this.contentTypeRegistry = options.contentTypeRegistry;
		this.commandRegistry = options.commandRegistry;
		this.progress = options.progressService;
		this.undoStack = options.undoStack;
		this._createInputManager();
	}
	LogEditorView.prototype = {
		_createInputManager: function(){
			this.inputManager = new LogInputManager(this.options);
			var defaultOptions = {
				parent: this._parent,
				model: new mTextModel.TextModel(),
				undoStack: this.options.undoStack,
				serviceRegistry: this.options.serviceRegistry,
				pluginRegistry: this.options.pluginRegistry,
				commandRegistry: this.options.commandRegistry,
				contentTypeRegistry: this.options.contentTypeRegistry,
				inputManager: this.inputManager,
				readonly: true,
				preferences: this.options.preferences,
				searcher: this.options.searcher,
				selection: this.options.selection,
				fileService: this.options.fileClient,
				fileClient:this.options.fileClient,
				statusReporter: this.options.statusReporter,
				statusService: this.options.statusService,
				progressService: this.options.progressService
			};
			this.editorView = new mEditorView.EditorView(defaultOptions);
		},
		create: function() {
			if(!this.editorCreated){
				this.editorView.create();
				this.editorCreated = true;
				
				this.inputListener = function(evt) {
					evt.editor = this.editorView.editor;
				}.bind(this);
				
				this.inputManager.addEventListener("InputChanged", this.inputListener);
				this.inputManager.lastLogLoaded = null;
				this.inputManager.lastLogInstance = null;
			}

		},
		destroy: function() {
			if (this.editorCreated) {
				this.editorView.destroy();
				if(this.inputListener){
					this.inputManager.removeEventListener("InputChanged", this.inputListener);
				}
			}
			this.editorCreated = false;
		}
	};
	
	return {
		LogEditorView: LogEditorView
	};
});