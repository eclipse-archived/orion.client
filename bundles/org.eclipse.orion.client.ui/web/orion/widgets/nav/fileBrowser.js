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
	'i18n!orion/edit/nls/messages',
	'orion/inputManager',
	'orion/globalCommands',
	'orion/editor/textModel',
	'orion/editor/undoStack',
	'orion/folderView',
	'orion/editorView',
	'orion/editorPluginView',
	'orion/markdownView',
	'orion/commandRegistry',
	'orion/contentTypes',
	'orion/fileClient',
	'orion/fileCommands',
	'orion/selection',
	'orion/progress',
	'orion/operationsClient',
	'orion/extensionCommands',
	'orion/searchClient',
	'orion/problems',
	'orion/Deferred',
	'orion/EventTarget',
	'orion/URITemplate',
	'orion/i18nUtil',
	'orion/PageUtil',
	'orion/objects',
	'orion/webui/littlelib'
], function(
	messages, mInputManager, mGlobalCommands,
	mTextModel, mUndoStack,
	mFolderView, mEditorView, mPluginEditorView , mMarkdownView,
	mCommandRegistry, mContentTypes, mFileClient, mFileCommands, mSelection, mProgress, mOperationsClient, mExtensionCommands, mSearchClient,
	mProblems,
	Deferred, EventTarget, URITemplate, i18nUtil, PageUtil, objects, lib
) {

var exports = {};

exports.setUpEditor = function(serviceRegistry, pluginRegistry, preferences, isReadOnly/*default: FALSE*/, showProjectView/*default: TRUE*/, showEditorInsection/*default: FALSE*/) {
	var selection;
	var commandRegistry;
	var problemService;
	var contentTypeRegistry;
	var progressService;
	var fileClient;
	var searcher;

	// Initialize the plugin registry
	(function() {
		selection = new mSelection.Selection(serviceRegistry);
		var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
		commandRegistry = new mCommandRegistry.CommandRegistry({selection: selection});
		progressService = new mProgress.ProgressService(serviceRegistry, operationsClient, commandRegistry);

		// Editor needs additional services
		problemService = new mProblems.ProblemService(serviceRegistry);
		contentTypeRegistry = new mContentTypes.ContentTypeRegistry(serviceRegistry);
		fileClient = new mFileClient.FileClient(serviceRegistry);
		searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandRegistry, fileService: fileClient});
	}());
	var	editorDomNode = lib.node("editor"); //$NON-NLS-0$

	var editor, editorDirtyListener, inputManager, editorView, lastRoot;
	function setEditor(newEditor) {
		if (editor === newEditor) { return; }
		if (editor) {
			editor.addEventListener("DirtyChanged", editorDirtyListener); //$NON-NLS-0$
		}
		editor = newEditor;
		if (editor) {
			editor.addEventListener("DirtyChanged", editorDirtyListener = function(evt) { //$NON-NLS-0$
				mGlobalCommands.setDirtyIndicator(editor.isDirty());
			});
		}
	}
	function renderToolbars(metadata) {
		var deferred;
		var toolbar = lib.node("pageActions"); //$NON-NLS-0$
		if (toolbar) {
			if (metadata) {
				// now add any "orion.navigate.command" commands that should be shown in non-nav pages.
				deferred = mExtensionCommands.createAndPlaceFileCommandsExtension(serviceRegistry, commandRegistry, toolbar.id, 500).then(function() {
					commandRegistry.destroy(toolbar);
					commandRegistry.renderCommands(toolbar.id, toolbar, metadata, editor, "button"); //$NON-NLS-0$
				});
			} else {
				commandRegistry.destroy(toolbar);
			}
		}
		var rightToolbar = lib.node("pageNavigationActions"); //$NON-NLS-0$
		if (rightToolbar) {
			commandRegistry.destroy(rightToolbar);
			if (metadata) {
				commandRegistry.renderCommands(rightToolbar.id, rightToolbar, metadata, editor, "button"); //$NON-NLS-0$
			}
		}
		var settingsToolbar = lib.node("settingsActions"); //$NON-NLS-0$
		if (settingsToolbar) {
			commandRegistry.destroy(settingsToolbar);
			if (metadata) {
				commandRegistry.renderCommands(settingsToolbar.id, settingsToolbar, metadata, editor, "button"); //$NON-NLS-0$
			}
		}
		return deferred;
	}
	
	function statusReporter(message, type, isAccessible) {
		if (type === "progress") { //$NON-NLS-0$
		} else if (type === "error") { //$NON-NLS-0$
		} else {
		}
	}

	var uriTemplate = new URITemplate("#{,resource,params*}"); //$NON-NLS-0$
	var makeBreadCrumbLink = function(/**HTMLAnchorElement*/ segment, folderLocation, folder) {
		var resource = folder ? folder.Location : fileClient.fileServiceRootURL(folderLocation);
		segment.href = uriTemplate.expand({resource: resource});
	};
	
	var currentEditorView, defaultOptions;
	// Shared text model and undo stack
	var model = new mTextModel.TextModel();
	var undoStack = new mUndoStack.UndoStack(model, 500);
	var contextImpl = {};
	[	
		"getText", //$NON-NLS-0$
		"setText" //$NON-NLS-0$
	].forEach(function(method) {
		contextImpl[method] = model[method].bind(model);
	});
	serviceRegistry.registerService("orion.edit.model.context", contextImpl, null); //$NON-NLS-0$
	function getEditorView(input, metadata) {
		var view = null;
		if (metadata && input) {
			var options = objects.mixin({
				input: input,
				readonly: isReadOnly,
				showProjectView: showProjectView,
				metadata: metadata,
			}, defaultOptions);
			//TODO better way of registering built-in editors
			if (metadata.Directory) {
				view = new mFolderView.FolderView(options);
			} else {
				var id = input.editor;
				if (!id || id === "orion.editor") { //$NON-NLS-0$
					if(showEditorInsection){
						options.editorView = editorView;
						view = new mFolderView.FolderView(options);
					} else {
						view = editorView;
					}
				} else if (id === "orion.markdownViewer") { //$NON-NLS-0$
					view = new mMarkdownView.MarkdownEditorView(options);
				} else {
					var editors = serviceRegistry.getServiceReferences("orion.edit.editor"); //$NON-NLS-0$
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
		if (currentEditorView !== view) {
			commandRegistry.closeParameterCollector();
			if (currentEditorView) {
				currentEditorView.destroy();
			}
			currentEditorView = view;
			if (currentEditorView) {
				currentEditorView.create();
			}
		}
		return currentEditorView;
	}
	
	var switchScope = "settingsActions"; //$NON-NLS-0$
	commandRegistry.addCommandGroup(switchScope, "orion.edit.switch", 1000, messages.switchEditor, null, null, "core-sprite-outline", null, "dropdownSelection"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	Deferred.when(contentTypeRegistry.getContentTypes(), function(contentTypes) {
		mExtensionCommands._getOpenWithNavCommandExtensions(serviceRegistry, contentTypes).forEach(function(command) {
			var id = command.properties.id;
			commandRegistry.registerCommandContribution(switchScope, id, 1, "orion.edit.switch/" + id); //$NON-NLS-0$
		});
	});

	inputManager = new mInputManager.InputManager({
		serviceRegistry: serviceRegistry,
		fileClient: fileClient,
		progressService: progressService,
		statusReporter: statusReporter,
		selection: selection,
		contentTypeRegistry: contentTypeRegistry
	});
	inputManager.addEventListener("InputChanged", function(evt) { //$NON-NLS-0$
		var metadata = evt.metadata;
		
		var view = getEditorView(evt.input, metadata);
		setEditor(view ? view.editor : null);
		evt.editor = editor;
	
		var deferred = renderToolbars(metadata);
		var name = evt.name, target = metadata;
		if (evt.input === null || evt.input === undefined) {
			name = lastRoot ? lastRoot.Name : "";
			target = lastRoot;
		}
		mGlobalCommands.setPageTarget({
			task: "Browse", //$NON-NLS-0$
			name: name,
			target: target,
			breadCrumbContainer: showEditorInsection ? "localBreadCrumb" : null,
			makeBreadcrumbLink: makeBreadCrumbLink,
			makeBreadcrumFinalLink: true,
			serviceRegistry: serviceRegistry,
			commandService: commandRegistry,
			searchService: searcher,
			fileService: fileClient
		});
		if (editor) {
			mGlobalCommands.setDirtyIndicator(editor.isDirty());
		}

		function processURL() {
			commandRegistry.processURL(window.location.href);
		}
		if (deferred) {
			deferred.then(processURL);
		} else {
			processURL();
		}
	});
	
	defaultOptions = {
		parent: editorDomNode,
		model: model,
		undoStack: undoStack,
		serviceRegistry: serviceRegistry,
		pluginRegistry: pluginRegistry,
		commandRegistry: commandRegistry,
		contentTypeRegistry: contentTypeRegistry,
		renderToolbars: renderToolbars,
		inputManager: inputManager,
		readonly: isReadOnly,
		preferences: preferences,
		searcher: searcher,
		selection: selection,
		fileService: fileClient,
		statusReporter: statusReporter,
		progressService: progressService
	};
	if(showEditorInsection) {
		var editorContainer = document.createElement("div"); //$NON-NLS-0$
		var sectionalEditorOptions = objects.clone(defaultOptions);
		sectionalEditorOptions.parent = editorContainer;
		editorView = new mEditorView.EditorView(sectionalEditorOptions);
	} else {
		editorView = new mEditorView.EditorView(defaultOptions);
	}


	selection.addEventListener("selectionChanged", function(event) { //$NON-NLS-0$
		inputManager.setInput(event.selection);
	});
	window.addEventListener("hashchange", function() { //$NON-NLS-0$
		inputManager.setInput(PageUtil.hash());
	});
	inputManager.setInput(PageUtil.hash());

	window.onbeforeunload = function() {
		if (editor && editor.isDirty()) {
			 return messages.unsavedChanges;
		}
	};
};


//////////////////////////////////////////////// File browser
	/** 
	 * Constructs a new file browser object.
	 * 
	 * @class 
	 * @name orion.FileBrowser
	 */
	/*
	function FileBrowser(options) {
		this._parent = options.parent;
		this._input = options.input;
		this._metadata = options.metadata;
		this.fileClient = options.fileService;
		this.progress = options.progressService;
		this.serviceRegistry = options.serviceRegistry;
		this.commandRegistry = options.commandRegistry;
		this.contentTypeRegistry = options.contentTypeRegistry;
		this.preferences = options.preferences;
		this.readonly = typeof options.readonly === 'undefined' ? false : options.readonly;
		this.showProjectView = typeof options.showProjectView === 'undefined' ? true : options.showProjectView;
		this.showFolderNav = true;
		this.editorView = options.editorView;
		this._init();
	}
	objects.mixin(FileBrowser.prototype, {
		_init: function(){
		},
		create: function() {
			if(this._metadata.Projects){ //this is a workspace root
				this.displayWorkspaceView();
			}
			if(this.editorView) {
				this.displayFolderView(this._metadata);
			} else if(this._metadata.Children){
				this.displayFolderView(this._metadata);
			} else if(this._metadata.ChildrenLocation){
				this.progress.progress(this.fileClient.fetchChildren(this._metadata.ChildrenLocation), "Fetching children of " + this._metadata.Name).then(function(children) {
					this._metadata.Children = children;
					this.displayFolderView(this._metadata);
				}.bind(this));
			}
		},
		destroy: function() {
			if(this.editorView) {
				this.editorView. editor.getTextView().getModel().removeEventListener("Changed", this._editorViewModelChangedListener); //$NON-NLS-0$
				this.editorView.destroy();
				this.editor = null;
			}
			var mainSplitter = mGlobalCommands.getMainSplitter();
			if(mainSplitter) {
				mainSplitter.splitter.removeEventListener("toggle", this._splitterToggleListener); //$NON-NLS-0$
			}
			if (this.folderNavExplorer) {
				this.folderNavExplorer.destroy();
			}
			this.folderNavExplorer = null;
			if (this._node && this._node.parentNode) {
				this._node.parentNode.removeChild(this._node);
			}
			if(this.projectView) {
				this.projectView.destroy();
			}
			if(this.projectEditor){
				this.projectEditor.destroy();
			}
			this._node = null;
		}
	});
	return {FileBrowser: FileBrowser};
	*/
return exports;
});
