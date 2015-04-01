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
	'orion/webui/splitter'
], function(
	messages, Sidebar, mInputManager, mCommands, mGlobalCommands,
	mTextModel, mUndoStack,
	mFolderView, mEditorView, mPluginEditorView , mMarkdownView, mMarkdownEditor,
	mCommandRegistry, mContentTypes, mFileClient, mFileCommands, mEditorCommands, mSelection, mStatus, mProgress, mOperationsClient, mOutliner, mDialogs, mExtensionCommands, ProjectCommands, mSearchClient,
	EventTarget, URITemplate, i18nUtil, PageUtil, objects, lib, Deferred, mProjectClient, mSplitter
) {

var exports = {};

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
		if (this.editorViewer) {
			metadata = this.editorViewer.inputManager.getFileMetadata();
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

function EditorViewer(options) {
	objects.mixin(this, options);
	this.id = this.id || ""; //$NON-NLS-0$
	this.selection = this.id ? new mSelection.Selection(this.serviceRegistry, "orion.page.selection" + this.id) : this.selection; //$NON-NLS-0$
	var domNode = this.domNode = document.createElement("div"); //$NON-NLS-0$
	domNode.className = "editorViewerFrame"; //$NON-NLS-0$
	this.parent.appendChild(domNode);
	//TODO add header 
	var contentNode = this.contentNode = document.createElement("div"); //$NON-NLS-0$
	contentNode.className = "editorViewerContent"; //$NON-NLS-0$
	domNode.appendChild(contentNode);
	
	domNode.addEventListener("mousedown", function() { //$NON-NLS-0$
		this.activateContext.setActiveEditorViewer(this);
	}.bind(this));
}
EditorViewer.prototype = {};
objects.mixin(EditorViewer.prototype, {
	
	create: function() {
		this.createTextModel();
		this.createInputManager();
		this.createEditorView();
	},
	
	createTextModel: function() {
		var model = this.model = new mTextModel.TextModel();
		this.undoStack = new mUndoStack.UndoStack(this.model, 500);
		var contextImpl = {};
		[	
			"getText", //$NON-NLS-0$
			"setText" //$NON-NLS-0$
		].forEach(function(method) {
			contextImpl[method] = model[method].bind(model);
		});
		this.serviceRegistry.registerService("orion.edit.model.context" + this.id, contextImpl, null); //$NON-NLS-0$
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
			
			var href = window.location.href;
			this.activateContext.setActiveEditorViewer(this);
			this.commandRegistry.processURL(href);
			
		}.bind(this));
		this.selection.addEventListener("selectionChanged", function(event) { //$NON-NLS-0$
			inputManager.setInput(event.selection);
		});
	},

	defaultOptions: function() {
		return {
			parent: this.contentNode,
			model: this.model,
			menuBar: this.menuBar,
			undoStack: this.undoStack,
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
			problemsServiceID: "orion.core.marker" + this.id, //$NON-NLS-0$
			editContextServiceID: "orion.edit.context" + this.id, //$NON-NLS-0$
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
		}
		if (this.currentEditorView !== view) {
			
			var mainSplitter = mGlobalCommands.getMainSplitter();
			if (mainSplitter) {
				var classList = mainSplitter.splitter.$splitter.classList;
				if (view && view.editor && view.editor.getTextView) {
					classList.add("ruler"); //$NON-NLS-0$
				} else {
					classList.remove("ruler"); //$NON-NLS-0$
				}
			}
			
			this.commandRegistry.closeParameterCollector();
			if (this.currentEditorView) {
				this.currentEditorView.destroy();
			}
			if (this.lastMetadata && this.lastMetadata.Location !== metadata.Location) {
				this.model.setText("");
			}
			this.currentEditorView = view;
			if (this.currentEditorView) {
				this.currentEditorView.create();
			}
		}
		this.lastMetadata = metadata;
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
});

function EditorSetup(serviceRegistry, pluginRegistry, preferences, readonly) {
	this.serviceRegistry = serviceRegistry;
	this.pluginRegistry = pluginRegistry;
	this.preferences = preferences;
	this.readonly = readonly;
	this.initializeServices();
	
	this.editorDomNode = lib.node("editor"); //$NON-NLS-0$
	this.sidebarDomNode = lib.node("sidebar"); //$NON-NLS-0$
	this.sidebarToolbar = lib.node("sidebarToolbar"); //$NON-NLS-0$
	this.pageToolbar = lib.node("pageToolbar"); //$NON-NLS-0$
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
		function SidebarNavInputManager() {
			EventTarget.attach(this);
		}
		this.sidebarNavInputManager = new SidebarNavInputManager();
		var sidebar = this.sidebar = new Sidebar({
			commandRegistry: this.commandRegistry,
			contentTypeRegistry: this.contentTypeRegistry,
			editorInputManager: this.editorViewers[0].inputManager,
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
			model: this.model,
			menuBar: this.menuBar,
			undoStack: this.undoStack,
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
	
	createSplitters: function(vertical) {
		//TODO create as many splitters as necessary given the number of editors viewers. 
		// Note that depending on the number of viewers it may be necessary to create intermediate parents
		var splitterDiv = document.createElement("div"); //$NON-NLS-0$
		splitterDiv.id = "editorSplitter"; //$NON-NLS-0$
		splitterDiv.style.zIndex = "100"; //$NON-NLS-0$
		this.editorDomNode.appendChild(splitterDiv);
		
		var splitter = this.editorSplitter = new mSplitter.Splitter({
			node: splitterDiv,
			sidePanel: this.editorViewers[0].domNode,
			mainPanel: this.editorViewers[1].domNode,
			toggle: false,
			proportional: true,
			vertical: vertical,
			closeByDefault: false
		});
		splitter.addEventListener("resize", function (evt) { //$NON-NLS-0$
			this.editorViewers.forEach(function(viewer) {
				if (viewer.domNode === evt.node) {
					viewer.editorView.editor.resize();
				}
			});
		}.bind(this));
		
		this._setSplitterMode("X"); //$NON-NLS-0$
	},

	load: function() {
		var lastEditedFile = sessionStorage.lastFile;
		var currentHash = PageUtil.hash();
		// lastEditedFile exists in session storage and if the project didn't change.
		if (lastEditedFile && lastEditedFile.lastIndexOf(currentHash, 0) === 0 && lastEditedFile !== currentHash) {
			window.location.hash = currentHash = lastEditedFile;
		}
		
		var setInput = function(hash) {
			this.activeEditorViewer.inputManager.setInput(hash);
			this.sidebarNavInputManager.processHash(PageUtil.hash());
		}.bind(this);
		setInput(currentHash);

		window.addEventListener("hashchange", function() { setInput(PageUtil.hash()); }); //$NON-NLS-0$
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
		this.activeEditorViewer = editorViewer;
		
		this.menuBar.setActiveEditorViewer(editorViewer);
		
		var metadata = editorViewer.inputManager.getFileMetadata();
		if (this.lastTarget && metadata && this.lastTarget.Location === metadata.Location) return;
		this.lastTarget = metadata;
		
		this.renderToolbars(metadata);
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
		if (target) {
			var params = PageUtil.matchResourceParameters();
			delete params.resource;
			window.location = uriTemplate.expand({resource: target.Location, params: params});
		}
	},

	_setSplitterMode: function(mode) {
		var mainEditorViewerNode = this.editorViewers[0].domNode;
		mainEditorViewerNode.style.width = mainEditorViewerNode.style.height = "100%"; //$NON-NLS-0$
		var splitEditorViewerNode = this.editorViewers[1].domNode;
		var splitterNode = this.editorSplitter.$splitter;
		splitEditorViewerNode.classList.remove("editorViewerPicInPic"); //$NON-NLS-0$
		splitEditorViewerNode.style.display = "block"; //$NON-NLS-0$
		splitEditorViewerNode.style.width = splitEditorViewerNode.style.height = "100%"; //$NON-NLS-0$
		["top", "left", "right", "bottom", "width", "height"].forEach(function(p) { //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			splitEditorViewerNode.style[p] = ""; //$NON-NLS-0$
		});
		splitterNode.style.display = "block"; //$NON-NLS-0$
		if (mode === "P") { //$NON-NLS-0$
			splitterNode.style.display = "none"; //$NON-NLS-0$
			splitEditorViewerNode.classList.add("editorViewerPicInPic"); //$NON-NLS-0$
		} else if (mode === "X") { //$NON-NLS-0$
			splitterNode.style.display = "none"; //$NON-NLS-0$
			splitEditorViewerNode.style.display = "none"; //$NON-NLS-0$
			
			this.setActiveEditorViewer(this.editorViewers[0]);
			
		} else if (mode === "H") { //$NON-NLS-0$
			this.editorSplitter.setOrientation(mSplitter.ORIENTATION_HORIZONTAL);
		} else if (mode === "V") { //$NON-NLS-0$
			this.editorSplitter.setOrientation(mSplitter.ORIENTATION_VERTICAL);
		}
		this.editorViewers.forEach(function(viewer) {
			viewer.editorView.editor.resize();
		});
		
		if (!this.editorViewers[1].inputManager.getFileMetadata()) {
			this.editorViewers[1].inputManager.setInput(PageUtil.hash());
		}
	},
	_addPipCommand: function(label) {
		var id = "orion.edit.showPip" + label; //$NON-NLS-0$
		var showPipCommand = new mCommands.Command({
			name: label,
			tooltip: label,
			id: id,
			visibleWhen: function() {
				return true;
			},
			callback: function(data) {
				var mode = data.command.tooltip;
				this._setSplitterMode(mode);
			}.bind(this)
		});
		this.commandRegistry.addCommand(showPipCommand);
		this.commandRegistry.registerCommandContribution("pageActions" , id, 1); //$NON-NLS-0$
	},
	_generateShowPip: function(){
		this._addPipCommand("H");
		this._addPipCommand("V");
		this._addPipCommand("P");
		this._addPipCommand("X");
	},
});

exports.setUpEditor = function(serviceRegistry, pluginRegistry, preferences, readonly) {
	var setup = new EditorSetup(serviceRegistry, pluginRegistry, preferences, readonly);
	Deferred.when(setup.createBanner(), function() {
		setup._generateShowPip();
		setup.createMenuBar().then(function() {
			setup.editorViewers = [];
			for (var i=0; i<2; i++) {
				setup.editorViewers.push(setup.createEditorViewer(i === 0 ? "" : "" + i)); //$NON-NLS-1$ //$NON-NLS-0$
			}
			setup.createSplitters();
			setup.createSideBar();
			setup.load();
		});
	});
};
return exports;
});
