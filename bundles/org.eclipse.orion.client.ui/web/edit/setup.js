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
	'orion/editor/textModel',
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
	'orion/objects',
	'orion/webui/littlelib',
	'orion/Deferred',
	'orion/projectClient',
	'orion/webui/splitter',
	'orion/webui/SplitMenu'
], function(
	messages, Sidebar, mInputManager, mCommands, mGlobalCommands,
	mTextModel, mUndoStack,
	mFolderView, mEditorView, mPluginEditorView , mMarkdownView, mMarkdownEditor,
	mCommandRegistry, mContentTypes, mFileClient, mFileCommands, mEditorCommands, mSelection, mStatus, mProgress, mOperationsClient, mOutliner, mDialogs, mExtensionCommands, ProjectCommands, mSearchClient,
	EventTarget, URITemplate, i18nUtil, PageUtil, objects, lib, Deferred, mProjectClient, mSplitter, mSplitMenu
) {

var exports = {};

var enableSplitEditor = false;

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
		commandRegistry.addCommandGroup(viewActionsScope, "orion.menuBarViewGroup", 100, messages["View"], null, messages["noActions"], null, null, "dropdownSelection"); //$NON-NLS-1$ //$NON-NLS-0$	
		commandRegistry.addCommandGroup(toolsActionsScope, "orion.menuBarToolsGroup", 100, messages["Tools"], null, null, null, null, "dropdownSelection"); //$NON-NLS-1$ //$NON-NLS-0$
		
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
		var model = new mTextModel.TextModel();
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
	headerNode.id = "EditorViewerHeader";
	headerNode.className = "editorHeader"; //$NON-NLS-0$
	
	// Create a breadcrumb
	this.localBreadcrumbNode = document.createElement("div"); //$NON-NLS-0$
	this.localBreadcrumbNode.id = "Header Breadcrumb";
	this.localBreadcrumbNode.style.height = "20px";
	headerNode.appendChild(this.localBreadcrumbNode);
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
			sessionStorage.lastFile = metadata ? PageUtil.hash() : null;
			var view = this.getEditorView(evt.input, metadata);
			this.setEditor(view ? view.editor : null);
			evt.editor = this.editor;
			this.pool.metadata = metadata;
			var href = window.location.href;
			this.activateContext.setActiveEditorViewer(this);
			this.commandRegistry.processURL(href);
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
		this.selection.addEventListener("selectionChanged", function(event) { //$NON-NLS-0$
			inputManager.setInput(event.selection);
		});
	},

	defaultOptions: function() {
		return {
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
				metadata: metadata,
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
			if (this.pool.lastMetadata && this.pool.lastMetadata.Location !== metadata.Location) {
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
			}.bind(this));
		}
	},
	
	setInput: function(hash) {
		this.inputManager.setInput(hash);
	},
});

function EditorSetup(serviceRegistry, pluginRegistry, preferences, readonly) {
	this.serviceRegistry = serviceRegistry;
	this.pluginRegistry = pluginRegistry;
	this.preferences = preferences;
	this.readonly = readonly;
	this.initializeServices();
	
	this.modelPool = new TextModelPool({serviceRegistry: this.serviceRegistry});

	this.editorDomNode = lib.node("editor"); //$NON-NLS-0$
	this.sidebarDomNode = lib.node("sidebar"); //$NON-NLS-0$
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
		this.statusService = new mStatus.StatusReportingService(serviceRegistry, this.operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
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
			searcher: this.searcher,
			readonly: this.readonly,
			toolbarId: "toolsActions", //$NON-NLS-0$
			saveToolbarId: "fileActions", //$NON-NLS-0$
			editToolbarId: "editActions", //$NON-NLS-0$
			navToolbarId: "pageNavigationActions", //$NON-NLS-0$
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
	
	createSideBar: function() {
		var commandRegistry = this.commandRegistry;
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
			selection: this.selection,
			serviceRegistry: this.serviceRegistry,
			sidebarNavInputManager: this.sidebarNavInputManager,
			switcherScope: "viewActions", //$NON-NLS-0$
			editScope: "editActions", //$NON-NLS-0$
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
		this.sidebarNavInputManager.addEventListener("rootChanged", function(evt) { //$NON-NLS-0$
			this.lastRoot = evt.root;
		}.bind(this));
		var gotoInput = function(evt) { //$NON-NLS-0$
			var newInput = evt.newInput || evt.parent || ""; //$NON-NLS-0$
			window.location = uriTemplate.expand({resource: newInput}); //$NON-NLS-0$
		};
		this.sidebarNavInputManager.addEventListener("filesystemChanged", gotoInput); //$NON-NLS-0$
		this.sidebarNavInputManager.addEventListener("editorInputMoved", gotoInput); //$NON-NLS-0$
		this.sidebarNavInputManager.addEventListener("create", function(evt) { //$NON-NLS-0$
			if (evt.newValue && !evt.ignoreRedirect) {
				var item = evt.newValue;
				var openWithCommand = mExtensionCommands.getOpenWithCommand(commandRegistry, evt.newValue);
				if (openWithCommand) {
					var href = openWithCommand.hrefCallback({items: item});
				} else {
					href = uriTemplate.expand({resource: evt.newValue.Location});
				}
				window.location = href;
			}
		});
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
		if (mode === this.splitMenu.MODE_SINGLE) return;
		
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
			return dirty ? (autoSave ? messages.unsavedAutoSaveChanges : messages.unsavedChanges) : null;
		}.bind(this);
	},

	renderToolbars: function(metadata) {
		var menuBar = this.menuBar;
		var commandRegistry = this.commandRegistry;
		var editor = this.activeEditorViewer.editor;
		menuBar.updateCommands();
		["pageActions", "pageNavigationActions", "settingsActions"].forEach(function(id) { //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
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
		} else if (target && !target.Parents) {//If the target is file system root then we use the file service name
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
			var params = PageUtil.matchResourceParameters();
			delete params.resource;
			window.location = uriTemplate.expand({resource: target.Location, params: params});
			this.lastHash = PageUtil.hash();

			this.editorInputManager.setInputManager(editorViewer.inputManager);
			this.editorInputManager.dispatchEvent({
				type: "InputChanged", //$NON-NLS-0$
				contentType: this.editorInputManager.getContentType(),
				metadata: metadata,
				editor: editor,
				location: window.location,
			});
		}
	},

	setSplitterMode: function(mode) {
		var oldSplitterMode = this.splitterMode;
		if (this.splitterMode === mode) return;
		this.splitterMode = mode;
		
		if (mode !== this.splitMenu.MODE_SINGLE && this.editorViewers.length < 2) {
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
			["top", "left", "right", "bottom", "width", "height"].forEach(function(p) { //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				splitEditorViewerNode.style[p] = ""; //$NON-NLS-0$
			});
			splitterNode.style.display = "block"; //$NON-NLS-0$
		}
		
		switch(mode){
			
			case this.splitMenu.MODE_PIP:
				splitterNode.style.display = "none"; //$NON-NLS-0$
				splitEditorViewerNode.classList.add("editorViewerPicInPic"); //$NON-NLS-0$
				break;
				
			case this.splitMenu.MODE_SINGLE:
				if (splitterNode) {
					splitterNode.style.display = "none"; //$NON-NLS-0$
				}
				if (splitEditorViewerNode) {
					splitEditorViewerNode.style.display = "none"; //$NON-NLS-0$
				}
				this.setActiveEditorViewer(this.editorViewers[0]);
				break;
				
			case this.splitMenu.MODE_HORIZONTAL:
				this.editorSplitter.setOrientation(mSplitter.ORIENTATION_VERTICAL, true);
				break;
			
			case this.splitMenu.MODE_VERTICAL:
				this.editorSplitter.setOrientation(mSplitter.ORIENTATION_HORIZONTAL, true);
				break;
		}
		
		this.editorViewers.forEach(function(viewer) {
			viewer.editorView.editor.resize();
		});
		
		if (oldSplitterMode === this.splitMenu.MODE_SINGLE && mode !== this.splitMenu.MODE_SINGLE) {
			this.lastTarget = null;
			this.editorViewers[1].inputManager.setInput(PageUtil.hash());
		}
	},
	_createSplitCommand: function(label){
		var id = "orion.edit.showPip" + label; //$NON-NLS-0$
		var splitCommand = new mCommands.Command({
			name: label,
			tooltip: label,
			id: id, //$NON-NLS-0$
			visibleWhen: function() {
				return true;
			},
			callback: function(data) {
				var mode = data.command.tooltip;
				this.setSplitterMode(mode);
			}.bind(this)
		});
			
		this.commandRegistry.addCommand(splitCommand);	
		return splitCommand;
	},
	createSplitMenu: function(){
		
		var splitMenu = this.splitMenu = new mSplitMenu( 'SplitMenu' ); //$NON-NLS-0$
		
		var modes = splitMenu.modes;
		
		for( var mode in modes ){
			var command = this._createSplitCommand( modes[mode].mode );		
			splitMenu.addMenuItem( command );
		}
	},
});

exports.setUpEditor = function(serviceRegistry, pluginRegistry, preferences, readonly) {
	enableSplitEditor = localStorage.enableSplitEditor === "true"; //$NON-NLS-0$
	
	var setup = new EditorSetup(serviceRegistry, pluginRegistry, preferences, readonly);
	Deferred.when(setup.createBanner(), function() {
		setup.createMenuBar().then(function() {
			setup.createSideBar();
			setup.editorViewers.push(setup.createEditorViewer());
			setup.setActiveEditorViewer(setup.editorViewers[0]);
			if (enableSplitEditor) {
				setup.createSplitMenu();
				setup.setSplitterMode(setup.splitMenu.MODE_SINGLE);
			}
			setup.load();
		});
	});
};
return exports;
});
