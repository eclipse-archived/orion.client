/*******************************************************************************
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
/*eslint-env browser, amd*/

define([
	'i18n!orion/edit/nls/messages',
	'orion/sidebar',
	'orion/inputManager',
	'orion/commands',
	'orion/globalCommands',
	'orion/editor/textModelFactory',
	'orion/editor/undoStack',
	'orion/folderView',
	'orion/editorView',
	'orion/editorPluginView',
	'orion/markdownView',
	'orion/markdownEditor',
	'orion/commandRegistry',
	'orion/contentTypes',
	'orion/fileClient',
	'orion/fileCommands',
	'orion/editorCommands',
	'orion/selection',
	'orion/status',
	'orion/progress',
	'orion/operationsClient',
	'orion/outliner',
	'orion/dialogs',
	'orion/extensionCommands',
	'orion/projectCommands',
	'orion/searchClient',
	'orion/EventTarget',
	'orion/URITemplate',
	'orion/i18nUtil',
	'orion/PageUtil',
	'orion/util',
	'orion/objects',
	'orion/webui/littlelib',
	'orion/Deferred',
	'orion/projectClient',
	'orion/webui/splitter',
	'orion/webui/tooltip',
	'orion/bidiUtils',
	'orion/customGlobalCommands'
], function(
	messages, Sidebar, mInputManager, mCommands, mGlobalCommands,
	mTextModelFactory, mUndoStack,
	mFolderView, mEditorView, mPluginEditorView , mMarkdownView, mMarkdownEditor,
	mCommandRegistry, mContentTypes, mFileClient, mFileCommands, mEditorCommands, mSelection, mStatus, mProgress, mOperationsClient, mOutliner, mDialogs, mExtensionCommands, ProjectCommands, mSearchClient,
	EventTarget, URITemplate, i18nUtil, PageUtil, util, objects, lib, Deferred, mProjectClient, mSplitter, mTooltip, bidiUtils, mCustomGlobalCommands
) {

var exports = {};

var enableSplitEditor = true;

var MODE_SINGLE = 0;
var MODE_VERTICAL = 1;
var MODE_HORIZONTAL = 2;
var MODE_PIP = 3;

var uriTemplate = new URITemplate("#{,resource,params*}"); //$NON-NLS-0$

function MenuBar(options) {
	this.parentNode = options.parentNode;
	this.commandRegistry = options.commandRegistry;
	this.serviceRegistry = options.serviceRegistry;
	this.fileClient = options.fileClient;
	this.editorCommands = options.editorCommands;
	this.parentNode = options.parentNode;
	this.fileActionsScope = "fileActions"; //$NON-NLS-0$
	this.editActionsScope = "editActions"; //$NON-NLS-0$
	this.viewActionsScope = "viewActions"; //$NON-NLS-0$
	this.toolsActionsScope = "toolsActions"; //$NON-NLS-0$
	this.additionalActionsScope = "extraActions"; //$NON-NLS-0$
	this.createActionSections();
	
	this.runBarNode = lib.$(".runBar", this.parentNode); //$NON-NLS-0$
}
MenuBar.prototype = {};
objects.mixin(MenuBar.prototype, {
	createActionSections: function() {
		var _self = this;
		[this.fileActionsScope, this.editActionsScope, this.viewActionsScope, this.toolsActionsScope, this.additionalActionsScope].reverse().forEach(function(id) {
			if (!_self[id]) {
				var elem = document.createElement("ul"); //$NON-NLS-0$
				elem.id = id;
				elem.classList.add("commandList"); //$NON-NLS-0$
				elem.classList.add("layoutLeft"); //$NON-NLS-0$
				elem.classList.add("pageActions"); //$NON-NLS-0$
				if (id === _self.additionalActionsScope) {
					elem.classList.add("extraActions"); //$NON-NLS-0$
				}
				_self.parentNode.insertBefore(elem, _self.parentNode.firstChild);
				_self[id] = elem;
			}
		});

		var commandRegistry = this.commandRegistry;
		var fileActionsScope = this.fileActionsScope;
		var editActionsScope = this.editActionsScope;
		var viewActionsScope = this.viewActionsScope;
		var toolsActionsScope = this.toolsActionsScope;
		
		commandRegistry.addCommandGroup(fileActionsScope, "orion.menuBarFileGroup", 1000, messages["File"], null, messages["noActions"], null, null, "dropdownSelection"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		commandRegistry.addCommandGroup(editActionsScope, "orion.menuBarEditGroup", 100, messages["Edit"], null, messages["noActions"], null, null, "dropdownSelection"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		commandRegistry.addCommandGroup(viewActionsScope, "orion.menuBarViewGroup", 100, messages["View"], null, messages["noActions"], null, null, "dropdownSelection"); //$NON-NLS-1$ //$NON-NLS-2$	
		commandRegistry.addCommandGroup(toolsActionsScope, "orion.menuBarToolsGroup", 100, messages["Tools"], null, null, null, null, "dropdownSelection"); //$NON-NLS-1$ //$NON-NLS-2$
		
		commandRegistry.addCommandGroup(fileActionsScope, "orion.newContentGroup", 0, messages["New"], "orion.menuBarFileGroup", null, null, null, "dropdownSelection"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		commandRegistry.addCommandGroup(fileActionsScope, "orion.importGroup", 100, messages["Import"], "orion.menuBarFileGroup", null, null, null, "dropdownSelection"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		commandRegistry.addCommandGroup(fileActionsScope, "orion.exportGroup", 1001, messages["Export"], "orion.menuBarFileGroup", null, null, null, "dropdownSelection"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	},
	createCommands: function() {
		var serviceRegistry = this.serviceRegistry;
		var commandRegistry = this.commandRegistry;
		var fileClient = this.fileClient;
		var editorCommands = this.editorCommands;
		return editorCommands.createCommands().then(function() {
			editorCommands.registerCommands();
			editorCommands.registerContextMenuCommands();
			return mFileCommands.createFileCommands(serviceRegistry, commandRegistry, fileClient).then(function() {
				return mExtensionCommands.createFileCommands(serviceRegistry, null, "all", true, commandRegistry).then(function() { //$NON-NLS-0$
					var projectClient = serviceRegistry.getService("orion.project.client"); //$NON-NLS-0$
					return projectClient.getProjectHandlerTypes().then(function(dependencyTypes){
						return projectClient.getProjectDeployTypes().then(function(deployTypes){
							return ProjectCommands.createProjectCommands(serviceRegistry, commandRegistry, fileClient, projectClient, dependencyTypes, deployTypes);
						}, function(){
							return ProjectCommands.createProjectCommands(serviceRegistry, commandRegistry, fileClient, projectClient, dependencyTypes);
						});
					});
				});
			});
		});
	},
	setActiveExplorer: function(explorer) {
		this.explorer = explorer;
	},
	setActiveEditorViewer: function(editorViewer) {
		this.editorViewer = editorViewer;
	},
	updateCommands: function() {
		var explorer = this.explorer;
		var visible, selection, treeRoot, metadata;
		if (explorer) {
			visible = explorer.isCommandsVisible();
			selection = explorer.selection;
			treeRoot = explorer.getTreeRoot();
		}
		var editorViewer = this.editorViewer;
		if (editorViewer) {
			metadata = editorViewer.inputManager.getFileMetadata();
			this.editorCommands.updateCommands(editorViewer.getCurrentEditorView());
		}
		var commandRegistry = this.commandRegistry, serviceRegistry = this.serviceRegistry;
		commandRegistry.registerSelectionService(this.fileActionsScope, visible ? selection : null);
		commandRegistry.registerSelectionService(this.editActionsScope, visible ? selection : null);
		commandRegistry.registerSelectionService(this.viewActionsScope, visible ? selection : null);
		mFileCommands.setExplorer(explorer);
		ProjectCommands.setExplorer(explorer);
		mFileCommands.updateNavTools(serviceRegistry, commandRegistry, explorer, null, [this.fileActionsScope, this.editActionsScope, this.viewActionsScope], treeRoot, true);
		commandRegistry.destroy(this.toolsActionsScope);
		commandRegistry.renderCommands(this.toolsActionsScope, this.toolsActionsScope, metadata, explorer, "tool"); //$NON-NLS-0$
		commandRegistry.destroy(this.additionalActionsScope);
		commandRegistry.renderCommands(this.additionalActionsScope, this.additionalActionsScope, treeRoot, explorer, "button"); //$NON-NLS-0$
	}
});

function TextModelPool(options) {
	this.serviceRegistry = options.serviceRegistry;
	this.all = [];
}
TextModelPool.prototype = {};
objects.mixin(TextModelPool.prototype, {
	create: function(serviceID) {
		var model = new mTextModelFactory.TextModelFactory().createTextModel({serviceRegistry: this.serviceRegistry});
		var undoStack = new mUndoStack.UndoStack(model, 500);
		var contextImpl = {};
		[	
			"getText", //$NON-NLS-0$
			"setText" //$NON-NLS-0$
		].forEach(function(method) {
			contextImpl[method] = model[method].bind(model);
		});
		this.serviceRegistry.registerService(serviceID, contextImpl, null);
		var result = {
			useCount: 1,
			model: model,
			undoStack: undoStack,
			serviceID: serviceID
		};
		this.all.push(result);
		return result;
	},
	search: function(resource) {
		for (var i = 0; i<this.all.length; i++) {
			var p = this.all[i];
			if (p.useCount > 0 && p.metadata && p.metadata.Location === resource) return p;
		}
		return null;
	},
	release: function(p) {
		p.useCount--;
		return p;
	},
	retain: function(p) {
		p.useCount++;
		return p;
	},
	get: function() {
		for (var i = 0; i<this.all.length; i++) {
			var p = this.all[i];
			if (p.useCount === 0) return this.retain(p);
		}
		return null;
	}
});

function EditorViewer(options) {
	objects.mixin(this, options);
	this.id = this.id || ""; //$NON-NLS-0$
	this.selection = this.id ? new mSelection.Selection(this.serviceRegistry, "orion.page.selection" + this.id) : this.selection; //$NON-NLS-0$
	this.problemsServiceID = "orion.core.marker" + this.id; //$NON-NLS-0$
	this.editContextServiceID = "orion.edit.context" + this.id; //$NON-NLS-0$
	this.editModelContextServiceID = "orion.edit.model.context" + this.id; //$NON-NLS-0$
	
	var domNode = this.domNode = document.createElement("div"); //$NON-NLS-0$
	domNode.className = "editorViewerFrame"; //$NON-NLS-0$
	this.parent.appendChild(domNode);
	
	// Create the header 
	var headerNode = this.headerNode = document.createElement("div"); //$NON-NLS-0$
	headerNode.className = "editorViewerHeader"; //$NON-NLS-0$

	this.curFileNode = document.createElement("span"); //$NON-NLS-0$
	this.curFileNode.className = "editorViewerHeaderTitle"; //$NON-NLS-0$
//	this.curFileNode.style.left = "25px";
//	this.curFileNode.style.position = "absolute";
	headerNode.appendChild(this.curFileNode);
	this.fileNodeTooltip = new mTooltip.Tooltip({
		node: this.curFileNode,
//		text: "Test Tooltip",
		position: ["below", "above", "right", "left"] //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-4$
	});

	// Create search and filefields
//	this.headerSearchButton = document.createElement("button"); //$NON-NLS-0$
//	this.headerSearchButton.id = "Header Search";
//	this.headerSearchButton.classList.add("core-sprite-search");
//	this.headerSearchButton.style.width = "20px";
//	
//	this.headerSearchButton.addEventListener("click", function() { //$NON-NLS-0$
//		this.curFileNode.style.visibility = "hidden";
//		this.searchField.style.visibility = "visible";
//		this.searchField.focus();
//	}.bind(this));
//	
//	headerNode.appendChild(this.headerSearchButton);//	this.searchField = document.createElement("input"); //$NON-NLS-0$
//	this.searchField.id = "fileSearchField";
//	this.searchField.style.display = "inline-block";
//	this.searchField.style.position = "absolute";
//	this.searchField.style.left = "25px";
//	this.searchField.style.width = "75%";
//	this.searchField.style.visibility = "hidden";
//	this.searchField.addEventListener("keyup", function(e) { //$NON-NLS-0$
//		if(e.defaultPrevented){// If the key event was handled by other listeners and preventDefault was set on(e.g. input completion handled ENTER), we do not handle it here
//			return;
//		}
//		var keyCode= e.charCode || e.keyCode;
//		if (keyCode === lib.KEY.ENTER) {
//			this.curFileNode.style.visibility = "visible";
//			this.searchField.style.visibility = "hidden";
//		} else if (keyCode === lib.KEY.ESCAPE) {
//			this.curFileNode.style.visibility = "visible";
//			this.searchField.style.visibility = "hidden";
//		} else {
//			var searchParams = {
//				keyword: this.searchField.value,
//				nameSearch: true,
//				resource: "/file",
//				rows: 100,
//				sort: "NameLower asc",
//				start: 0
//			};
//			this.searcher.search(searchParams, null, function() {
//				var result = arguments;
//			}.bind(this));
//		}
//	}.bind(this));
//	headerNode.appendChild(this.searchField);

	// Create a breadcrumb
	this.localBreadcrumbNode = document.createElement("div"); //$NON-NLS-0$
	var tipContainer = this.fileNodeTooltip.contentContainer();
	tipContainer.appendChild(this.localBreadcrumbNode);
	
	domNode.appendChild(headerNode);
	
	// Create the editor content area
	var contentNode = this.contentNode = document.createElement("div"); //$NON-NLS-0$
	contentNode.className = "editorViewerContent"; //$NON-NLS-0$
	domNode.appendChild(contentNode);
	
	if (!enableSplitEditor) {
		headerNode.style.display = "none"; //$NON-NLS-0$
		contentNode.style.top = "0"; //$NON-NLS-0$
	}
	
	domNode.addEventListener("mousedown", function() { //$NON-NLS-0$
		this.activateContext.setActiveEditorViewer(this);
	}.bind(this), true);
	domNode.addEventListener("keyup", function() { //$NON-NLS-0$
		this.activateContext.setActiveEditorViewer(this);
	}.bind(this), true);
}
EditorViewer.prototype = {};
objects.mixin(EditorViewer.prototype, {
	
	create: function() {
		this.createTextModel();
		this.createInputManager();
		this.createEditorView();
	},
	
	createTextModel: function() {
		this.pool = this.modelPool.create(this.editModelContextServiceID);
	},
	
	createEditorView: function() {
		this.editorView = new mEditorView.EditorView(this.defaultOptions());
	},
	
	createInputManager: function() {
		var inputManager = this.inputManager = new mInputManager.InputManager({
			serviceRegistry: this.serviceRegistry,
			fileClient: this.fileClient,
			progressService: this.progressService,
			statusReporter: this.statusReporter.bind(this),
			selection: this.selection,
			contentTypeRegistry: this.contentTypeRegistry
		});
		inputManager.addEventListener("InputChanged", function(evt) { //$NON-NLS-0$
			var metadata = evt.metadata;
			if (metadata) {
				sessionStorage.lastFile = PageUtil.hash();
			} else {
				delete sessionStorage.lastFile;
			}
			var view = this.getEditorView(evt.input, metadata);
			this.setEditor(view ? view.editor : null);
			evt.editor = this.editor;
			this.pool.metadata = metadata;
			var href = window.location.href;
			this.activateContext.setActiveEditorViewer(this);
			this.commandRegistry.processURL(href);
			if (this.curFileNode) {
				var curFileNodeName = evt.name || "";
				if (bidiUtils.isBidiEnabled()) {
					curFileNodeName = bidiUtils.enforceTextDirWithUcc(curFileNodeName);
				}
				this.curFileNode.textContent = curFileNodeName;				
			}
		}.bind(this));
		inputManager.addEventListener("InputChanging", function(e) { //$NON-NLS-0$
			var previousPool = this.pool;
			var modelPool = this.modelPool;
			var p = modelPool.search(e.input.resource);
			if (p) {
				modelPool.release(this.pool);
				this.pool = modelPool.retain(p);
			} else if (this.pool.useCount > 1) {
				modelPool.release(this.pool);
				this.pool = modelPool.get();
			}
			// If shared, ask input manager to reuse metadata and buffer
			if (this.pool.useCount > 1) {
				e.metadata = p.metadata;
			}
			if (previousPool !== this.pool) {
				// This is necessary because the editor view is reused
				var editorView = this.editorView;
				editorView.model = this.pool.model;
				editorView.undoStack = this.pool.undoStack;
				editorView.editModelContextServiceID = this.pool.serviceID;
				var editor = editorView.editor;
				if (editor.installed) {
					this._recreate = true;
				}
			}
		}.bind(this));
		this.selection.addEventListener("selectionChanged", function(evt) { //$NON-NLS-0$
			inputManager.setInput(evt.selection);
		});
	},

	defaultOptions: function() {
		//Don't forward the complete activate context, only specify the things we want to see
		var context = Object.create(null);
		context.openEditor = this.activateContext.openEditor.bind(this.activateContext);
		return {
			activateContext: context,
			parent: this.contentNode,
			model: this.pool.model,
			undoStack: this.pool.undoStack,
			editModelContextServiceID: this.pool.serviceID,
			menuBar: this.menuBar,
			serviceRegistry: this.serviceRegistry,
			pluginRegistry: this.pluginRegistry,
			commandRegistry: this.commandRegistry,
			contentTypeRegistry: this.contentTypeRegistry,
			editorCommands: this.editorCommands,
			renderToolbars: this.renderToolbars,
			inputManager: this.inputManager,
			readonly: this.readonly,
			preferences: this.preferences,
			searcher: this.searcher,
			selection: this.selection,
			problemsServiceID: this.problemsServiceID,
			editContextServiceID: this.editContextServiceID,
			fileService: this.fileClient,
			statusReporter: this.statusReporter.bind(this),
			statusService: this.statusService,
			progressService: this.progressService
		};
	},
	
	statusReporter: function(message, type, isAccessible) {
		var statusService = this.statusService;
		if (type === "progress") { //$NON-NLS-0$
			statusService.setProgressMessage(message);
		} else if (type === "error") { //$NON-NLS-0$
			statusService.setErrorMessage({Message: message, Severity: "Error"}); //$NON-NLS-0$
		} else {
			statusService.setMessage(message, null, isAccessible);
		}
	},
	
	getCurrentEditorView: function() {
		if (this.currentEditorView) {
			if (this.currentEditorView.editorID === "orion.editor.markdown") { //$NON-NLS-0$
				return this.editorView;
			}
		}
		return this.currentEditorView;
	},
	
	getEditorView: function (input, metadata) {
		var view = null;
		if (metadata && input) {
			var options = objects.mixin({
				input: input,
				metadata: metadata
			}, this.defaultOptions());
			//TODO better way of registering built-in editors
			if (metadata.Directory) {
				view = new mFolderView.FolderView(options);
			} else {
				var id = input.editor;
				this.editorView.setParent(this.contentNode);
				if (!id || id === "orion.editor") { //$NON-NLS-0$
					view = this.editorView;
				} else if (id === "orion.viewer.markdown") { //$NON-NLS-0$
					view = new mMarkdownView.MarkdownEditorView(options);
				} else if (id === "orion.editor.markdown") { //$NON-NLS-0$
					options.editorView = this.editorView;
					options.anchor = input.anchor;
					view = new mMarkdownEditor.MarkdownEditorView(options);
				} else {
					var editors = this.serviceRegistry.getServiceReferences("orion.edit.editor"); //$NON-NLS-0$
					for (var i=0; i<editors.length; i++) {
						if (editors[i].getProperty("id") === id) { //$NON-NLS-0$
							options.editorService = editors[i];
							view = new mPluginEditorView.PluginEditorView(options);
							break;
						}
					}
				}
			}
			view.editorID = id;
		}
		if (this.currentEditorView !== view || this._recreate) {
			this._recreate = false;
			this.commandRegistry.closeParameterCollector();
			if (this.currentEditorView) {
				this.currentEditorView.destroy();
			}
			if (this.pool.lastMetadata && metadata && this.pool.lastMetadata.Location !== metadata.Location) {
				this.pool.model.setText("");
			}
			this.currentEditorView = view;
			if (this.currentEditorView) {
				this.currentEditorView.create();
			}
		}
		this.pool.lastMetadata = metadata;
		return this.currentEditorView;
	},
	
	setEditor: function(newEditor) {
		if (this.editor === newEditor) { return; }
		if (this.editor) {
			this.editor.removeEventListener("DirtyChanged", this.editorDirtyListener); //$NON-NLS-0$
		}
		this.editor = newEditor;
		if (this.editor) {
			this.editor.addEventListener("DirtyChanged", this.editorDirtyListener = function() { //$NON-NLS-0$
				mGlobalCommands.setDirtyIndicator(this.editor.isDirty());
				
				// Update the viewer's header
				if (this.curFileNode) {
					if (!this.dirtyIndicator) {
						this.dirtyIndicator = document.createElement("span");
						this.dirtyIndicator.classList.add("editorViewerHeaderDirtyIndicator");
						this.dirtyIndicator.textContent = "*";
						this.curFileNode.parentNode.insertBefore(this.dirtyIndicator, this.curFileNode);
					}
					this.dirtyIndicator.style.display = this.editor.isDirty() ? "block" : "none";
				}
			}.bind(this));
		}
	},
	
	setInput: function(hash) {
		this.inputManager.setInput(hash);
	}
});

function EditorSetup(serviceRegistry, pluginRegistry, preferences, readonly) {
	this.serviceRegistry = serviceRegistry;
	this.pluginRegistry = pluginRegistry;
	this.preferences = preferences;
	this.readonly = readonly;
	this.initializeServices();
	
	this.modelPool = new TextModelPool({serviceRegistry: this.serviceRegistry});

	this.editorDomNode = lib.node("editor"); //$NON-NLS-0$
	this.sidebarDomNode = lib.node("pageSidebar"); //$NON-NLS-0$
	this.sidebarToolbar = lib.node("sidebarToolbar"); //$NON-NLS-0$
	this.pageToolbar = lib.node("pageToolbar"); //$NON-NLS-0$

	this.editorViewers = [];
}
EditorSetup.prototype = {};
objects.mixin(EditorSetup.prototype, {
	
	initializeServices: function() {
		var serviceRegistry = this.serviceRegistry;
		this.selection = new mSelection.Selection(serviceRegistry);
		this.operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
		this.statusService = new mStatus.StatusReportingService(serviceRegistry, this.operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$ //$NON-NLS-3$
		this.dialogService = new mDialogs.DialogService(serviceRegistry);
		this.commandRegistry = new mCommandRegistry.CommandRegistry({selection: this.selection});
		this.progressService = new mProgress.ProgressService(serviceRegistry, this.operationsClient, this.commandRegistry);
		
		// Editor needs additional services
		this.outlineService = new mOutliner.OutlineService({serviceRegistry: serviceRegistry, preferences: this.preferences});
		this.contentTypeRegistry = new mContentTypes.ContentTypeRegistry(serviceRegistry);
		this.fileClient = new mFileClient.FileClient(serviceRegistry);
		this.projectClient = new mProjectClient.ProjectClient(serviceRegistry, this.fileClient);
		this.searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: this.commandRegistry, fileService: this.fileClient});
		this.editorCommands = new mEditorCommands.EditorCommandFactory({
			serviceRegistry: serviceRegistry,
			commandRegistry: this.commandRegistry,
			fileClient: this.fileClient,
			preferences: this.preferences,
			renderToolbars: this.renderToolbars.bind(this),
			searcher: this.searcher,
			readonly: this.readonly,
			toolbarId: "toolsActions", //$NON-NLS-0$
			saveToolbarId: "fileActions", //$NON-NLS-0$
			editToolbarId: "editActions", //$NON-NLS-0$
			navToolbarId: "pageNavigationActions", //$NON-NLS-0$
			editorContextMenuId: "editorContextMenuActions", //$NON-NLS-0$
		});
	},
	
	createBanner: function() {
			// Do not collapse sidebar, https://bugs.eclipse.org/bugs/show_bug.cgi?id=418558
		var collapseSidebar = false; //PageUtil.hash() !== ""
		return mGlobalCommands.generateBanner("orion-editor", this.serviceRegistry, this.commandRegistry, this.preferences, this.searcher, null, null, collapseSidebar, this.fileClient); //$NON-NLS-0$
	},
	
	createMenuBar: function() {
		var menuBar = this.menuBar = new MenuBar({
			parentNode: this.pageToolbar,
			fileClient: this.fileClient,
			editorCommands: this.editorCommands,
			commandRegistry: this.commandRegistry,
			serviceRegistry: this.serviceRegistry
		});
		return menuBar.createCommands();
	},
	
	createRunBar: function () {
		var menuBar = this.menuBar;
		var runBarParent = menuBar.runBarNode;
		return mCustomGlobalCommands.createRunBar({
			parentNode: runBarParent,
			serviceRegistry: this.serviceRegistry,
			commandRegistry: this.commandRegistry,
			fileClient: this.fileClient,
			projectCommands: ProjectCommands,
			projectClient: this.serviceRegistry.getService("orion.project.client"),
			progressService: this.progressService,
			preferences: this.preferences,
			editorInputManager: this.editorInputManager
		}).then(function(runBar){
			if (runBar) {
				this.preferences.get('/runBar').then(function(prefs){ //$NON-NLS-1$
					this.runBar = runBar;
					var displayRunBar = prefs.display === undefined  || prefs.display;
					if (util.isElectron || !displayRunBar) {
						lib.node("runBarWrapper").style.display = "none";
					}
				});
			}
		}.bind(this));
	},
	
	createSideBar: function() {
		// Create input manager wrapper to handle multiple editors
		function EditorInputManager() {
			EventTarget.attach(this);
		}
		objects.mixin(EditorInputManager.prototype, {
			getFileMetadata: function() {
				return this.inputManager.getFileMetadata();
			},
			getContentType: function() {
				return this.inputManager.getContentType();
			},
			getEditor: function() {
				return this.inputManager.getEditor();
			},
			getInput: function() {
				return this.inputManager.getInput();
			},
			getTitle: function() {
				return this.inputManager.getTitle();
			},
			getReadOnly: function() {
				return this.inputManager.getReadOnly();
			},
			setInputManager: function(inputManager) {
				this.inputManager = inputManager;
				this.selection = inputManager.selection;
				this.editor = inputManager.editor;
			}
		});
		this.editorInputManager = new EditorInputManager();
		function SidebarNavInputManager() {
			EventTarget.attach(this);
		}
		this.sidebarNavInputManager = new SidebarNavInputManager();
		var sidebar = this.sidebar = new Sidebar({
			commandRegistry: this.commandRegistry,
			contentTypeRegistry: this.contentTypeRegistry,
			editorInputManager: this.editorInputManager,
			preferences: this.preferences,
			fileClient: this.fileClient,
			outlineService: this.outlineService,
			parent: this.sidebarDomNode,
			progressService: this.progressService,
			searcher: this.searcher,
			selection: this.selection,
			serviceRegistry: this.serviceRegistry,
			sidebarNavInputManager: this.sidebarNavInputManager,
			switcherScope: "viewActions", //$NON-NLS-0$
			editScope: "editActions", //$NON-NLS-0$
			toolsScope: "toolsActions", //$NON-NLS-0$
			menuBar: this.menuBar,
			toolbar: this.sidebarToolbar
		});
		SidebarNavInputManager.prototype.processHash = function() {
			var navigate = PageUtil.matchResourceParameters().navigate;
			if (typeof navigate === "string" && this.setInput && sidebar.getActiveViewModeId() === "nav") { //$NON-NLS-1$ //$NON-NLS-0$
				this.setInput(navigate);
			}
		};
		sidebar.create();
		this.editorCommands.setSideBar(sidebar);
		this.sidebarNavInputManager.addEventListener("rootChanged", function(evt) { //$NON-NLS-0$
			this.lastRoot = evt.root;
		}.bind(this));
		var gotoInput = function(evt) {
			var newInput = evt.newInput || evt.parent || "";
			window.location = uriTemplate.expand({resource: newInput.resource || newInput, params: newInput.params || []});
		};
		this.sidebarNavInputManager.addEventListener("filesystemChanged", gotoInput); //$NON-NLS-0$
		this.sidebarNavInputManager.addEventListener("editorInputMoved", gotoInput); //$NON-NLS-0$
		this.sidebarNavInputManager.addEventListener("create", function(evt) { //$NON-NLS-0$
			if (evt.newValue && !evt.ignoreRedirect) {
				window.location = this.computeNavigationHref(evt.newValue);
			}
		}.bind(this));
	},

	/**
	 * @description Creates a URL ref from the give location and options to be opened by the browser
	 * @function
	 * @param {Object} item The file metadata object which has at least a <code>Location</code> property
	 * @param {Object} options The map of options
	 * @returns {String} The computed URL to navigate to
	 * @since 9.0
	 */
	computeNavigationHref: function(item, options) {
		var openWithCommand = mExtensionCommands.getOpenWithCommand(this.commandRegistry, item);
		if (openWithCommand && typeof openWithCommand.hrefCallback === 'function') {
			return openWithCommand.hrefCallback({items: objects.mixin({}, item, {params: options})});
		}
		if(options) {
			return uriTemplate.expand({resource: item.Location, params: options});
		}
		return uriTemplate.expand({resource: item.Location});
	},

	/**
	 * @description Opens the given location
	 * @function
	 * @param {String} fileurl The URL to open
	 * @param {Object} options The map of options. 
	 * 
	 * Current set of understood options include:
	 *   start - (number) The start range to select when opening an editor
	 *   end - (number) The end range to select when opening an editor
	 *   mode - (string) Determines where the new file should open:
	 * 			'replace': replaces the current editor's content
	 * 			    'tab': opens the file in a new tab
	 * 			  'split': Splits the editor (if needed) and shows the new content in the non-active editor
	 * splitHint - (string) If the mode is 'split' and the editor has not yet been split this determines the
	 *             initial splitter mode. Can be one of 'horizontal', 'vertical' or 'picInPic'.
	 * 
	 * @since 9.0
	 */
	openEditor: function(loc, options) {
		var href = this.computeNavigationHref({Location: loc}, {start: options.start, end: options.end});
		if (!href)
			return;
			
		var mode = typeof(options.mode) === 'string' ? options.mode : 'replace'; //$NON-NLS-1$
		switch (mode) {
			case 'replace':
				var editorView = this.activeEditorViewer.getCurrentEditorView();
				if (editorView && editorView.editor) {
					var sel = editorView.editor.getSelection();
					var currentHref = this.computeNavigationHref({Location: this.activeEditorViewer.inputManager.getInput()}, {start: sel.start, end: sel.end});
					history.pushState({}, "", currentHref);
					this.lastHash = PageUtil.hash(); // Pushing to the history stack changes the hash
				}
				var hash = href.split('#')[1];
				if (hash === window.location.hash.substring(1)) {
					this.activeEditorViewer.inputManager.setInput(hash);
				} else {
					window.location = href;
				}
				break;
			case 'tab':
				window.open(href);
				break;
			case 'split':
				var locWithParams = href.split('#')[1];
				if (!this.splitterMode || this.splitterMode === MODE_SINGLE) {
					var splitHint = typeof(options.splitHint) === 'string' ? options.splitHint : 'vertical'; //$NON-NLS-1$
					if (splitHint === 'horizontal') 
						this.setSplitterMode(MODE_HORIZONTAL, locWithParams);
					else if (splitHint === 'vertical') 
						this.setSplitterMode(MODE_VERTICAL, locWithParams);
					else if (splitHint === 'picInPic') 
						this.setSplitterMode(MODE_PIP, locWithParams);
				} else {
					this.editorViewers[1].inputManager.setInput(locWithParams);
				}				
				break;
		}
	},
	
	createEditorViewer: function(id) {
		var editorViewer = new EditorViewer({
			id: id,
			parent: this.editorDomNode,
			activateContext: this,
			modelPool: this.modelPool,
			menuBar: this.menuBar,
			serviceRegistry: this.serviceRegistry,
			pluginRegistry: this.pluginRegistry,
			commandRegistry: this.commandRegistry,
			contentTypeRegistry: this.contentTypeRegistry,
			editorCommands: this.editorCommands,
			renderToolbars: this.renderToolbars.bind(this),
			readonly: this.readonly,
			preferences: this.preferences,
			searcher: this.searcher,
			selection: this.selection,
			fileClient: this.fileClient,
			statusService: this.statusService,
			progressService: this.progressService
		});
		editorViewer.create();
		return editorViewer;
	},
	
	createSplitters: function(mode) {
		//TODO create as many splitters as necessary given the number of editors viewers.
		// Note that depending on the number of viewers it may be necessary to create intermediate parents
		if (this.editorSplitter) return;
		if (mode === MODE_SINGLE) return;
		
		var splitterDiv = document.createElement("div"); //$NON-NLS-0$
		splitterDiv.id = "editorSplitter"; //$NON-NLS-0$
		this.editorDomNode.appendChild(splitterDiv);
		
		var splitter = this.editorSplitter = new mSplitter.Splitter({
			node: splitterDiv,
			sidePanel: this.editorViewers[0].domNode,
			mainPanel: this.editorViewers[1].domNode,
			toggle: false,
			proportional: true,
			vertical: true,
			closeByDefault: false
		});
		splitter.addEventListener("resize", function (evt) { //$NON-NLS-0$
			this.editorViewers.forEach(function(viewer) {
				if (viewer.domNode === evt.node) {
					viewer.editorView.editor.resize();
				}
			});
		}.bind(this));
	},
	
	setInput: function(hash) {
		if (this.lastHash === hash) return;
		this.lastHash = hash;
		this.activeEditorViewer.setInput(hash);
		this.sidebarNavInputManager.processHash(hash);
	},
	
	load: function() {
		var lastEditedFile = sessionStorage.lastFile;
		var currentHash = PageUtil.hash();
		// lastEditedFile exists in session storage and if the project didn't change.
		if (lastEditedFile && lastEditedFile.lastIndexOf(currentHash, 0) === 0 && lastEditedFile !== currentHash) {
			window.location.hash = currentHash = lastEditedFile;
		}

		this.setInput(currentHash);
		window.addEventListener("hashchange", function() { //$NON-NLS-0$
			this.setInput(PageUtil.hash());
		}.bind(this));
		window.onbeforeunload = function() {
			var dirty, autoSave;
			this.editorViewers.forEach(function(viewer) {
				var editor = viewer.editor;
				if (editor && editor.isDirty()) {
					dirty = true;
					if (viewer.inputManager.getAutoSaveEnabled()) {
						viewer.inputManager.save();
						autoSave = true;
					}
				}
			});
			var unsavedMessage = dirty ? (autoSave ? messages.unsavedAutoSaveChanges : messages.unsavedChanges) : undefined;
			if(util.isElectron && dirty){
				window.__electron.remote.dialog.showMessageBox(
					window.__electron.remote.getCurrentWindow(),
					{
						type: 'warning',
						buttons: [messages["OK"]],
						title: messages["Orion"],
						message: unsavedMessage
					});
			}
			return unsavedMessage;
		}.bind(this);
	},

	renderToolbars: function(metadata) {
		metadata = metadata || this.activeEditorViewer.inputManager.getFileMetadata();
		var menuBar = this.menuBar;
		var commandRegistry = this.commandRegistry;
		var editor = this.activeEditorViewer.editor;
		menuBar.updateCommands();
		["pageActions", "pageNavigationActions", "settingsActions"].forEach(function(id) { //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$ //$NON-NLS-3$
			var toolbar = lib.node(id);
			if (toolbar) {
				commandRegistry.destroy(toolbar);
				if (metadata) {
					commandRegistry.renderCommands(toolbar.id, toolbar, metadata, editor, "button"); //$NON-NLS-0$
				}
			}
		});
	},
	
	setActiveEditorViewer: function(editorViewer) {
		var oldEditorViewer = this.activeEditorViewer;
		
		this.activeEditorViewer = editorViewer;
		
		this.menuBar.setActiveEditorViewer(editorViewer);
		
		var metadata = editorViewer.inputManager.getFileMetadata();
		
		if (oldEditorViewer !== editorViewer || this.lastTarget !== metadata) {
			this.renderToolbars(metadata);
		}
		
		this.setPageTarget(metadata);
	},
	
	setPageTarget: function (metadata) {
		if (this.lastTarget && metadata && this.lastTarget.Location === metadata.Location) return;
		this.lastTarget = metadata;
		
		var editorViewer = this.activeEditorViewer;
		var target = metadata, targetName;
		if (!target) { //evt.input === null || evt.input === undefined) {
			targetName = this.lastRoot ? this.lastRoot.Name : "";
			target = this.lastRoot;
		} else if (!util.isElectron && target && !target.Parents) {//If the target is file system root then we use the file service name
			targetName = this.fileClient.fileServiceName(target.Location);
		} else {
			targetName = target.Name;
		}
		// Exclude the "Show current folder" command: it's useless on editor page with built-in nav.
		// TODO the command exclusions should be an API and specified by individual pages (page links)?
		mGlobalCommands.setPageCommandExclusions(["orion.editFromMetadata"]); //$NON-NLS-0$
		mGlobalCommands.setPageTarget({
			viewer: enableSplitEditor ? editorViewer : null,
			task: messages["Editor"],
			name: targetName,
			target: target,
			makeAlternate: function() {
				if (metadata && metadata.parent) {
					return metadata.parent;
				} else if (metadata && metadata.Parents && metadata.Parents.length > 0) {
					if (metadata.Parents[0].Children) {
						return metadata.Parents[0];
					}
					// The mini-nav in sidebar wants to do the same work, can we share it?
					return this.progressService.progress(this.fileClient.read(metadata.Parents[0].Location, true), i18nUtil.formatMessage(messages.ReadingMetadata, metadata.Parents[0].Location));
				}
			}.bind(this),
			makeBreadcrumbLink: function(/**HTMLAnchorElement*/ segment, folderLocation, folder) {
				var resource = folder ? folder.Location : this.fileClient.fileServiceRootURL(folderLocation);
				segment.href = uriTemplate.expand({resource: resource});
				if (folder) {
					var fileMetadata = this.activeEditorViewer.inputManager.getFileMetadata();
					if (fileMetadata && fileMetadata.Location === folder.Location) {
						segment.addEventListener("click", function() { //$NON-NLS-0$
							this.sidebarNavInputManager.reveal(folder);
						}.bind(this));
					}
				}
			}.bind(this),
			makeBreadcrumFinalLink: true,
			serviceRegistry: this.serviceRegistry,
			commandService: this.commandRegistry,
			searchService: this.searcher,
			fileService: this.fileClient
		});
		var editor = editorViewer.editor;
		if (editor) {
			mGlobalCommands.setDirtyIndicator(editor.isDirty());
		}
		if (metadata) {
			var params = PageUtil.matchResourceParameters(editorViewer.inputManager.getLocation());
			delete params.resource;
			window.location = uriTemplate.expand({resource: target.Location, params: params});
			this.lastHash = PageUtil.hash();

			this.editorInputManager.setInputManager(editorViewer.inputManager);
			this.editorInputManager.dispatchEvent({
				type: "InputChanged", //$NON-NLS-0$
				contentType: this.editorInputManager.getContentType(),
				metadata: metadata,
				editor: editor,
				location: window.location
			});
		}
	},

	setSplitterMode: function(mode, href) {
		var oldSplitterMode = this.splitterMode;
		if (this.splitterMode === mode) return;
		this.splitterMode = mode;
		
		if (mode !== MODE_SINGLE && this.editorViewers.length < 2) {
			this.editorViewers.push(this.createEditorViewer(this.editorViewers.length + "")); //$NON-NLS-0$
		}
		this.createSplitters(mode);
		
		var mainEditorViewerNode = this.editorViewers[0].domNode;
		mainEditorViewerNode.style.width = mainEditorViewerNode.style.height = "100%"; //$NON-NLS-0$

		var splitEditorViewerNode, splitterNode;
		if (this.editorViewers. length > 1) {
			splitEditorViewerNode = this.editorViewers[1].domNode;
			splitterNode = this.editorSplitter.$splitter;
			splitEditorViewerNode.classList.remove("editorViewerPicInPic"); //$NON-NLS-0$
			splitEditorViewerNode.style.display = "block"; //$NON-NLS-0$
			splitEditorViewerNode.style.width = splitEditorViewerNode.style.height = "100%"; //$NON-NLS-0$
			["top", "left", "right", "bottom", "width", "height"].forEach(function(p) { //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-6$
				splitEditorViewerNode.style[p] = ""; //$NON-NLS-0$
			});
			splitterNode.style.display = "block"; //$NON-NLS-0$
		}
		
		switch(mode){
			
			case MODE_PIP:
				splitterNode.style.display = "none"; //$NON-NLS-0$
				splitEditorViewerNode.classList.add("editorViewerPicInPic"); //$NON-NLS-0$
				break;
				
			case MODE_SINGLE:
				if (splitterNode) {
					splitterNode.style.display = "none"; //$NON-NLS-0$
				}
				if (splitEditorViewerNode) {
					splitEditorViewerNode.style.display = "none"; //$NON-NLS-0$
				}
				this.setActiveEditorViewer(this.editorViewers[0]);
				break;
				
			case MODE_HORIZONTAL:
				this.editorSplitter.setOrientation(mSplitter.ORIENTATION_VERTICAL, true);
				break;
			
			case MODE_VERTICAL:
				this.editorSplitter.setOrientation(mSplitter.ORIENTATION_HORIZONTAL, true);
				break;
		}
		
		this.editorViewers.forEach(function(viewer) {
			viewer.editorView.editor.resize();
		});
		
		if (oldSplitterMode === MODE_SINGLE && mode !== MODE_SINGLE) {
			this.lastTarget = null;
			if (href) {
				this.editorViewers[1].inputManager.setInput(href);
			} else {
				this.editorViewers[1].inputManager.setInput(PageUtil.hash());
			}
		}
	},
	createSplitMenu: function() {
		var that = this;
		var currentChoice;
		var toolbar = "settingsActions"; //$NON-NLS-1$
		var changeSplitModeCommand;
		function callback() {
			this.checked = true;
			currentChoice.checked = false;
			currentChoice = this;
			changeSplitModeCommand.imageClass = this.imageClass;
			changeSplitModeCommand.name = this.name;
			that.setSplitterMode(this.mode);
			that.commandRegistry.destroy(toolbar);
			that.commandRegistry.renderCommands(toolbar, toolbar, that, that, "button"); //$NON-NLS-0$
		}
		var choices = [
			{name: messages["SplitSinglePage"], mode: MODE_SINGLE, imageClass: "core-sprite-page", checked: true, callback: callback}, //$NON-NLS-0$
			{name: messages["SplitVertical"], mode: MODE_VERTICAL, imageClass: "core-sprite-vertical", callback: callback}, //$NON-NLS-0$
			{name: messages["SplitHorizontal"], mode: MODE_HORIZONTAL, imageClass: "core-sprite-horizontal", callback: callback}, //$NON-NLS-0$
			{name: messages["SplitPipInPip"], mode: MODE_PIP, imageClass: "core-sprite-pip", callback: callback}, //$NON-NLS-0$
		];
		currentChoice = choices[0];
		changeSplitModeCommand = new mCommands.Command({
			imageClass: currentChoice.imageClass,
			selectionClass: "dropdownSelection", //$NON-NLS-0$
			name: currentChoice.name,
			tooltip: messages["SplitModeTooltip"],
			id: "orion.edit.splitmode", //$NON-NLS-0$
			visibleWhen: function() {
				return true;
			},
			choiceCallback: function() {
				return choices;
			}
		});
		this.commandRegistry.addCommand(changeSplitModeCommand);
		this.commandRegistry.registerCommandContribution(toolbar, "orion.edit.splitmode", 0); //$NON-NLS-1$ //$NON-NLS-0$
	}
});

var setup;
exports.getEditorViewers = function() {
	if (!setup) return [];
	return setup.editorViewers;
};

exports.setUpEditor = function(serviceRegistry, pluginRegistry, preferences, readonly) {
	enableSplitEditor = localStorage.enableSplitEditor !== "false"; //$NON-NLS-0$
	
	setup = new EditorSetup(serviceRegistry, pluginRegistry, preferences, readonly);
	Deferred.when(setup.createBanner(), function(result) {
		if (result && result.navSelection) {
			//TODO find a better way to give the selection to the navigator
			sessionStorage.navSelection = JSON.stringify(result.navSelection);
		}
		setup.createMenuBar().then(function() {
			setup.createSideBar();
			setup.createRunBar().then(function() {
				setup.editorViewers.push(setup.createEditorViewer());
				setup.setActiveEditorViewer(setup.editorViewers[0]);
				if (enableSplitEditor) {
					setup.createSplitMenu();
					setup.setSplitterMode(MODE_SINGLE);
				}
				setup.load();
			});
		});
	});
};
return exports;
});
