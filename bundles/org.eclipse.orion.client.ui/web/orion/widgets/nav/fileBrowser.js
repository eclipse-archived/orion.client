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
	'orion/markdownView',
	'orion/commandRegistry',
	'orion/Deferred',
	'orion/URITemplate',
	'orion/objects',
	'orion/webui/littlelib'
], function(
	mInputManager, mBreadcrumbs, mTextModel, mFolderView, mEditorView, mMarkdownView,
	mCommandRegistry, Deferred, URITemplate, objects, lib
) {
	/** 
	 * Constructs a new file browser object.
	 * 
	 * @class 
	 * @name orion.FileBrowser
	 */
	function FileBrowser(options) {
		this._parent = options.parent;
		this._serviceRegistry = options.serviceRegistry;
		this._preferences = options.preferences;
		this._contentTypeService = options.contentTypeService;
		this._fileClient = options.fileClient;
		this._commandRegistry = new mCommandRegistry.CommandRegistry({});
		this._init();
	}
	objects.mixin(FileBrowser.prototype, {
		_init: function(){
			this._inputManager = new mInputManager.InputManager({
				fileClient: this._fileClient,
				statusReporter: this._statusReport,
				contentTypeRegistry: this._contentTypeService
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
				commandRegistry: this._commandRegistry,
				contentTypeRegistry: this._contentTypeService,
				inputManager: this._inputManager,
				readonly: true,
				preferences: this._preferences,
				fileService: this._fileClient,
				statusReporter: this.statusReport
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
				fileClient: this._fileClient,
				maxLength: maxLength
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
			var fileClient = options.fileClient;
			if (options.target) { // we have metadata
				if (fileClient && !options.breadcrumbTarget) {
					fileSystemRootName = breadcrumbRootName ? breadcrumbRootName + " " : ""; //$NON-NLS-1$ //$NON-NLS-0$
					fileSystemRootName = fileSystemRootName + fileClient.fileServiceName(options.target.Location);
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
					options.serviceRegistry = null;
					options.breadCrumbMaker = function(bcContainer, maxLength) {this._breadCrumbMaker(bcContainer, maxLength);}.bind(this);
					view = new mFolderView.FolderView(options);
				} else {
					var id = input.editor;
					if (!id || id === "orion.editor") { //$NON-NLS-0$
						options.editorView = this._editorView;
						options.serviceRegistry = null;
						options.breadCrumbMaker = function(bcContainer, maxLength) {this._breadCrumbMaker(bcContainer, maxLength);}.bind(this);
						view = new mFolderView.FolderView(options);
					} else if (id === "orion.markdownViewer") { //$NON-NLS-0$
						// TODO : not sure about this yetview = new mMarkdownView.MarkdownEditorView(options);
					} else {
						//TODO: handle other file types. E.g. image files
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
