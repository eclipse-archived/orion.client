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
	'orion/sidebar',
	'orion/inputManager',
	'orion/globalCommands',
	'orion/folderView',
	'orion/editorView',
	'orion/commandRegistry',
	'orion/contentTypes',
	'orion/fileClient',
	'orion/selection',
	'orion/status',
	'orion/progress',
	'orion/operationsClient',
	'orion/outliner',
	'orion/dialogs',
	'orion/extensionCommands',
	'orion/searchClient',
	'orion/problems',
	'orion/blameAnnotations',
	'orion/EventTarget',
	'orion/URITemplate',
	'orion/i18nUtil',
	'orion/PageUtil',
	'orion/webui/littlelib'
], function(
	messages, Sidebar, mInputManager, mGlobalCommands,
	mFolderView, mEditorView,
	mCommandRegistry, mContentTypes, mFileClient, mSelection, mStatus, mProgress, mOperationsClient, mOutliner, mDialogs, mExtensionCommands, mSearchClient,
	mProblems, mBlameAnnotation,
	EventTarget, URITemplate, i18nUtil, PageUtil, lib
) {

var exports = {};

exports.setUpEditor = function(serviceRegistry, preferences, isReadOnly) {
	var selection;
	var commandRegistry;
	var statusReportingService;
	var problemService;
	var blameService;
	var outlineService;
	var contentTypeRegistry;
	var progressService;
	var dialogService;
	var fileClient;
	var searcher;

	// Initialize the plugin registry
	(function() {
		selection = new mSelection.Selection(serviceRegistry);
		var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
		statusReportingService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		dialogService = new mDialogs.DialogService(serviceRegistry);
		commandRegistry = new mCommandRegistry.CommandRegistry({selection: selection});
		progressService = new mProgress.ProgressService(serviceRegistry, operationsClient, commandRegistry);

		// Editor needs additional services
		problemService = new mProblems.ProblemService(serviceRegistry);
		outlineService = new mOutliner.OutlineService({serviceRegistry: serviceRegistry, preferences: preferences});
		contentTypeRegistry = new mContentTypes.ContentTypeService(serviceRegistry);
		fileClient = new mFileClient.FileClient(serviceRegistry);
		searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandRegistry, fileService: fileClient});
		blameService = new mBlameAnnotation.BlameService(serviceRegistry);
	}());

	var sidebarDomNode = lib.node("sidebar"), //$NON-NLS-0$
		sidebarToolbar = lib.node("sidebarToolbar"), //$NON-NLS-0$
		editorDomNode = lib.node("editor"); //$NON-NLS-0$

	var editor, inputManager, folderView, editorView;
	function renderToolbars(metadata) {
		var toolbar = lib.node("pageActions"); //$NON-NLS-0$
		if (toolbar) {
			if (metadata) {
				// now add any "orion.navigate.command" commands that should be shown in non-nav pages.
				mExtensionCommands.createAndPlaceFileCommandsExtension(serviceRegistry, commandRegistry, toolbar.id, 500).then(function() {
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
	}

	var sidebarNavBreadcrumb = function(/**HTMLAnchorElement*/ segment, folderLocation, folder) {
		// Link to this page (edit page)
		segment.href = new URITemplate("#{,resource,params*}").expand({ //$NON-NLS-0$
			resource: inputManager.getInput() || "", //$NON-NLS-0$
			params: {
				navigate: folder ? folder.ChildrenLocation : fileClient.fileServiceRootURL(folderLocation || "")  //$NON-NLS-0$
			}
		});
	};

	inputManager = new mInputManager.InputManager({
		serviceRegistry: serviceRegistry,
		fileClient: fileClient,
		progressService: progressService,
		selection: selection,
		contentTypeRegistry: contentTypeRegistry
	});
	editorView = new mEditorView.EditorView({
		parent: editorDomNode,
		renderToolbars: renderToolbars,
		fileService: fileClient,
		progressService: progressService,
		serviceRegistry: serviceRegistry,
		statusService: statusReportingService,
		inputManager: inputManager,
		preferences: preferences,
		readonly: isReadOnly,
		searcher: searcher,
		commandRegistry: commandRegistry,
		contentTypeRegistry: contentTypeRegistry
	});
	editor = editorView.editor;
	inputManager.editor = editor;

	inputManager.addEventListener("InputChanged", function(evt) { //$NON-NLS-0$
		if (folderView) {
			commandRegistry.closeParameterCollector();
			folderView.destroy();
			folderView = null;
		}
		var metadata = evt.metadata;
		renderToolbars(metadata);
		if (evt.input === null || evt.input === undefined) {
			return;
		}
		mGlobalCommands.setPageTarget({
			task: "Coding", //$NON-NLS-0$
			name: evt.name,
			target: metadata,
			makeAlternate: function() {
				if (metadata && metadata.Parents && metadata.Parents.length > 0) {
					// The mini-nav in sidebar wants to do the same work, can we share it?
					return progressService.progress(fileClient.read(metadata.Parents[0].Location, true), i18nUtil.formatMessage(messages["Reading metedata of"], metadata.Parents[0].Location));
				}
			},
			makeBreadcrumbLink: sidebarNavBreadcrumb,
			serviceRegistry: serviceRegistry,
			commandService: commandRegistry,
			searchService: searcher,
			fileService: fileClient
		});

		commandRegistry.processURL(window.location.href);

		if (metadata && metadata.Directory) {
			commandRegistry.closeParameterCollector();
			folderView = new mFolderView.FolderView({
				parent: editorDomNode,
				input: evt.input,
				metadata: evt.metadata,
				contents: JSON.parse(evt.contents),
				serviceRegistry: serviceRegistry,
				commandService: commandRegistry,
				fileService: fileClient,
				progress: progressService
			});
			folderView.create();
		}
	});

	// Sidebar
	function SidebarNavInputManager() {
		EventTarget.attach(this);
	}
	SidebarNavInputManager.prototype.processHash = function() {
		var newParams = PageUtil.matchResourceParameters(location.hash), navigate = newParams.navigate;
		if (typeof navigate === "string" || !newParams.resource) { //$NON-NLS-0$
			var input = navigate || "";
			this.dispatchEvent({type: "InputChanged", input: input}); //$NON-NLS-0$
		}
	};
	var sidebarNavInputManager = new SidebarNavInputManager();
	var sidebar = new Sidebar({
		commandRegistry: commandRegistry,
		contentTypeRegistry: contentTypeRegistry,
		editorInputManager: inputManager,
		fileClient: fileClient,
		outlineService: outlineService,
		parent: sidebarDomNode,
		progressService: progressService,
		selection: selection,
		serviceRegistry: serviceRegistry,
		sidebarNavInputManager: sidebarNavInputManager,
		toolbar: sidebarToolbar
	});
	sidebar.show();
	sidebarNavInputManager.addEventListener("rootChanged", function(evt) { //$NON-NLS-0$
		var root = evt.root;
		// update the navigate param, if it's present, or if this was a user action
		var pageParams = PageUtil.matchResourceParameters(location.hash);
		if (evt.force || Object.prototype.hasOwnProperty.call(pageParams, "navigate")) {//$NON-NLS-0$
			var params = {};
			params.resource = pageParams.resource || ""; //$NON-NLS-0$
			params.params = { navigate: root.Path };
			window.location = new URITemplate("#{,resource,params*}").expand(params); //$NON-NLS-0$
		}
		if (!pageParams.resource) {
			// No primary resource (editor file), so target the folder being navigated in the sidebar.
			mGlobalCommands.setPageTarget({
				task: "Coding", //$NON-NLS-0$
				name: root.Name,
				target: root,
				makeBreadcrumbLink: sidebarNavBreadcrumb,
				serviceRegistry: serviceRegistry,
				commandService: commandRegistry,
				searchService: searcher,
				fileService: fileClient
			});
		}
	});
	sidebarNavInputManager.addEventListener("editorInputMoved", function(evt) { //$NON-NLS-0$
		var newInput = evt.newInput, parent = evt.parent;
		var params = {};
		// If we don't know where the file went, go to "no editor"
		params.resource = newInput || "";
		params.params = {
			navigate: parent
		};
		window.location = new URITemplate("#{,resource,params*}").expand(params); //$NON-NLS-0$
	});

	editor.addEventListener("DirtyChanged", function(evt) { //$NON-NLS-0$
		mGlobalCommands.setDirtyIndicator(editor.isDirty());
	});

	selection.addEventListener("selectionChanged", function(event) { //$NON-NLS-0$
		inputManager.setInput(event.selection);
	});
	window.addEventListener("hashchange", function() { //$NON-NLS-0$
		inputManager.setInput(window.location.hash);
		// inform the sidebar
		sidebarNavInputManager.processHash(window.location.hash);
	});
	inputManager.setInput(window.location.hash);
	sidebarNavInputManager.processHash(window.location.hash);

	//mGlobalCommands.setPageCommandExclusions(["orion.editFromMetadata"]); //$NON-NLS-0$
	mGlobalCommands.generateBanner("orion-editor", serviceRegistry, commandRegistry, preferences, searcher, editor, editor, window.location.hash !== ""); //$NON-NLS-0$

	window.onbeforeunload = function() {
		if (editor.isDirty()) {
			 return messages["There are unsaved changes."];
		}
	};
};
return exports;
});
