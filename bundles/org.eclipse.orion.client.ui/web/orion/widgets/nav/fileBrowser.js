/*******************************************************************************
 *
 * @license
 * Copyright (c) 2010, 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*jslint browser:true devel:true sub:true*/
/*global define eclipse:true orion:true window*/

define([
	'orion/inputManager',
	'orion/breadcrumbs',
	'orion/editor/textModel',
	'orion/folderView',
	'orion/editorView',
	'orion/editorPluginView',
	'orion/markdownView',
	'orion/commandRegistry',
	'orion/contentTypes',
	'orion/fileClient',
	'orion/fileCommands',
	'orion/progress',
	'orion/operationsClient',
	'orion/extensionCommands',
	'orion/searchClient',
	//'orion/problems',
	'orion/Deferred',
	'orion/EventTarget',
	'orion/URITemplate',
	'orion/i18nUtil',
	'orion/PageUtil',
	'orion/objects',
	'orion/webui/littlelib'
], function(
	mInputManager, mBreadcrumbs, mTextModel, mFolderView, mEditorView, mPluginEditorView , mMarkdownView,
	mCommandRegistry, mContentTypes, mFileClient, mFileCommands, 
	mProgress, mOperationsClient, mExtensionCommands, mSearchClient,
	//mProblems,
	Deferred, EventTarget, URITemplate, i18nUtil, PageUtil, objects, lib
) {
	/** 
	 * Constructs a new file browser object.
	 * 
	 * @class 
	 * @name orion.FileBrowser
	 */
	
	function FileBrowser(parent, serviceRegistry, preferences) {
		this._parent = parent;
		this._serviceRegistry = serviceRegistry;
		this._preferences = preferences;
		var operationsClient = new mOperationsClient.OperationsClient(this._serviceRegistry);
		this._commandRegistry = new mCommandRegistry.CommandRegistry({});
		this._progressService = new mProgress.ProgressService(this._serviceRegistry, operationsClient, this._commandRegistry);

		//this._problemService = new mProblems.ProblemService(this._serviceRegistry);
		this._contentTypeRegistry = new mContentTypes.ContentTypeRegistry(this._serviceRegistry);
		this._fileClient = new mFileClient.FileClient(this._serviceRegistry);
		this._searcher = new mSearchClient.Searcher({serviceRegistry: this._serviceRegistry, commandService: this._commandRegistry, fileService: this._fileClient});
		this._init();
	}
	objects.mixin(FileBrowser.prototype, {
		_init: function(){
			this._inputManager = new mInputManager.InputManager({
				serviceRegistry: this._serviceRegistry,
				fileClient: this._fileClient,
				progressService: this._progressService,
				statusReporter: this._statusReport,
				contentTypeRegistry: this._contentTypeRegistry
			});
			this._uriTemplate = new URITemplate("#{,resource,params*}"); //$NON-NLS-0$
			var	fBrowserDomNode = lib.node(this._parent);
			
			this._inputManager.addEventListener("InputChanged", function(evt) { //$NON-NLS-0$
				var metadata = evt.metadata;
				this._breadCrumbName = evt.name;
				this._breadCrumbTarget = metadata;
				if (evt.input === null || evt.input === undefined) {
					this._breadCrumbName = this._lastRoot ? this._lastRoot.Name : "";
					this._breadCrumbTarget = this._lastRoot;
				}
				//this._breadCrumbMaker("localBreadCrumb");
				var view = this._getEditorView(evt.input, metadata);
				this._setEditor(view ? view.editor : null);
				evt.editor = this._editor;
				var deferred = null;//renderToolbars(metadata);
				function processURL() {
					this._commandRegistry.processURL(window.location.href);
				}
				if (deferred) {
					deferred.then(processURL);
				} else {
					processURL();
				}
			}.bind(this));
			var model = new mTextModel.TextModel();
			this._defaultOptions = {
				parent: fBrowserDomNode,
				model: model,
				serviceRegistry: this._serviceRegistry,
				//pluginRegistry: pluginRegistry,
				commandRegistry: this._commandRegistry,
				contentTypeRegistry: this._contentTypeRegistry,
				inputManager: this._inputManager,
				readonly: true,
				preferences: this._preferences,
				searcher: this._searcher,
				fileService: this._fileClient,
				statusReporter: this.statusReport,
				progressService: this._progressService
			};
			var editorContainer = document.createElement("div"); //$NON-NLS-0$
			var sectionalEditorOptions = objects.clone(this._defaultOptions);
			sectionalEditorOptions.parent = editorContainer;
			this._editorView = new mEditorView.EditorView(sectionalEditorOptions);
		},
		_breadCrumbMaker: function(bcContainer, maxLength){
			this._renderBreadCrumb({
				task: "Browse", //$NON-NLS-0$
				name: this._breadCrumbName,
				target: this._breadCrumbTarget,
				breadCrumbContainer: bcContainer,
				makeBreadcrumbLink: function(segment, folderLocation, folder) {this._makeBreadCrumbLink(segment, folderLocation, folder);}.bind(this),
				makeBreadcrumFinalLink: true,
				serviceRegistry: this._serviceRegistry,
				commandService: this._commandRegistry,
				searchService: this._searcher,
				maxLength: maxLength,
				fileService: this._fileClient
			});
		},
		
		_setEditor: function(newEditor) {
			if (this._editor === newEditor) { return; }
			this._editor = newEditor;
		},
		_statusReport: function(message, type, isAccessible) {
			if (type === "progress") { //$NON-NLS-0$
				//TODO: Render message in the section header?
			} else if (type === "error") { //$NON-NLS-0$
				//TODO: Render message in the section header?
			} else {
				//TODO: Render message in the section header?
			}
		},
		_makeBreadCrumbLink: function(segment, folderLocation, folder) {
			var resource = folder ? folder.Location : this._fileClient.fileServiceRootURL(folderLocation);
			segment.href = this._uriTemplate.expand({resource: resource});
		},
		_renderBreadCrumb: function(options) {
			var fileSystemRootName;
			var breadcrumbRootName = options.breadcrumbRootName;
			var serviceRegistry = options.serviceRegistry;
			if (options.target) { // we have metadata
				if (options.searchService) {
					options.searchService.setLocationByMetaData(options.target);
				}
				if (options.fileService && !options.breadcrumbTarget) {
					fileSystemRootName = breadcrumbRootName ? breadcrumbRootName + " " : ""; //$NON-NLS-1$ //$NON-NLS-0$
					fileSystemRootName = fileSystemRootName + options.fileService.fileServiceName(options.target.Location);
					breadcrumbRootName = null;
				}
			} else {
				if (!options.breadcrumbTarget) {
					breadcrumbRootName = breadcrumbRootName || options.task || options.name;
				}
			}
			var locationNode = lib.node(options.breadCrumbContainer);
			if (locationNode) {
				lib.empty(locationNode);
				var fileClient = serviceRegistry && new mFileClient.FileClient(serviceRegistry);
				var resource = options.breadcrumbTarget || options.target;
				var workspaceRootURL = (fileClient && resource && resource.Location) ? fileClient.fileServiceRootURL(resource.Location) : null;
				new mBreadcrumbs.BreadCrumbs({
					container: locationNode,
					maxLength: options.maxLength,
					resource: resource,
					rootSegmentName: breadcrumbRootName,
					workspaceRootSegmentName: fileSystemRootName,
					workspaceRootURL: workspaceRootURL,
					makeFinalHref: options.makeBreadcrumFinalLink,
					makeHref: options.makeBreadcrumbLink
				});
			}
		},
		_getEditorView: function(input, metadata) {
			var view = null;
			if (metadata && input) {
				var options = objects.mixin({
					input: input,
					readonly: true,
					showProjectView: false,
					metadata: metadata,
				}, this._defaultOptions);
				//TODO better way of registering built-in editors
				if (metadata.Directory) {
					options.breadCrumbMaker = function(bcContainer, maxLength) {this._breadCrumbMaker(bcContainer, maxLength);}.bind(this);
					view = new mFolderView.FolderView(options);
				} else {
					var id = input.editor;
					if (!id || id === "orion.editor") { //$NON-NLS-0$
						options.editorView = this._editorView;
						options.breadCrumbMaker = function(bcContainer, maxLength) {this._breadCrumbMaker(bcContainer, maxLength);}.bind(this);
						view = new mFolderView.FolderView(options);
					} else if (id === "orion.markdownViewer") { //$NON-NLS-0$
						view = new mMarkdownView.MarkdownEditorView(options);
					} else {
						var editors = this._serviceRegistry.getServiceReferences("orion.edit.editor"); //$NON-NLS-0$
						for (var i=0; i<editors.length; i++) {
							if (editors[i].getProperty("id") === id) { //$NON-NLS-0$
								options.editorService = editors[i];
								view = new mPluginEditorView.PluginEditorView(options);
								break;
							}
						}
					}
				}
			}
			if (this._currentEditorView !== view) {
				this._commandRegistry.closeParameterCollector();
				if (this._currentEditorView) {
					this._currentEditorView.destroy();
				}
				this._currentEditorView = view;
				if (this._currentEditorView) {
					this._currentEditorView.create();
				}
			}
			return this._currentEditorView;
		},
		refresh: function(fileURI) {
			this._inputManager.setInput(fileURI);
		},
		create: function() {
		},
		destroy: function() {
		}
	});
	return {FileBrowser: FileBrowser};
});
