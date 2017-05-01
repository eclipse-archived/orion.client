/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *     Casey Flynn - Google Inc.
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
	'orion/customGlobalCommands',
	'orion/generalPreferences',
	'orion/breadcrumbs',
	'orion/keyBinding'
], function(
	messages, Sidebar, mInputManager, mCommands, mGlobalCommands,
	mTextModelFactory, mUndoStack,
	mFolderView, mEditorView, mPluginEditorView , mMarkdownView, mMarkdownEditor,
	mCommandRegistry, mContentTypes, mFileClient, mFileCommands, mEditorCommands, mSelection, mStatus, mProgress, mOperationsClient, mOutliner, mDialogs, mExtensionCommands, ProjectCommands, mSearchClient,
	EventTarget, URITemplate, i18nUtil, PageUtil, util, objects, lib, Deferred, mProjectClient, mSplitter, mTooltip, bidiUtils, mCustomGlobalCommands, mGeneralPrefs, mBreadcrumbs, mKeyBinding
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
	this.generalPreferences = options.generalPreferences;
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
		var generalPreferences = this.generalPreferences;
		return editorCommands.createCommands().then(function() {
			editorCommands.registerCommands();
			editorCommands.registerContextMenuCommands();
			return mFileCommands.createFileCommands(serviceRegistry, commandRegistry, fileClient, generalPreferences).then(function() {
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
	this.contextID = 0;
}
TextModelPool.prototype = {};
objects.mixin(TextModelPool.prototype, {
	create: function(serviceID) {
		var model = new mTextModelFactory.TextModelFactory().createTextModel({serviceRegistry: this.serviceRegistry});
		var undoStack = new mUndoStack.UndoStack(model, 500);
		serviceID += this.contextID++;
		var contextImpl = {};
		[
			"getText", //$NON-NLS-0$
			"setText" //$NON-NLS-0$
		].forEach(function(method) {
			contextImpl[method] = model[method].bind(model);
		});
		this.serviceRegistry.registerService(serviceID, contextImpl, null);
		var result = {
			model: model,
			undoStack: undoStack,
			serviceID: serviceID,
			registeredViewers: {}
		};
		this.all.push(result);
		return result;
	},
	search: function(resource) {
		for (var i = 0; i<this.all.length; i++) {
			var p = this.all[i];
			if (p.metadata && p.metadata.Location === resource) {
				return p;
			}
		}
		return null;
	},
	registerViewer: function(pool, viewerId) {
		if (!pool.registeredViewers.hasOwnProperty(viewerId)) {
			pool.registeredViewers[viewerId] = true;
		}
	},
	release: function(resource, viewerId) {
		for (var i = 0; i<this.all.length; i++) {
			var p = this.all[i];
			if (p.metadata && p.metadata.Location === resource) {
				if (p.registeredViewers.hasOwnProperty(viewerId)) {
					delete p.registeredViewers[viewerId];
				}
				if (Object.keys(p.registeredViewers).length === 0) {
					p.model.destroy();
					p.undoStack.destroy();
					this.all.splice(i, 1);
				}
			}
		}
	}
});

function TabWidget(options) {
	EventTarget.attach(this);
	objects.mixin(this, options);
	this.selectedFile = null;
	this.commandRegistry = options.commandRegistry;
	
	this.fileList = [];
	this.editorTabs = {};
	this.breadcrumbUniquifier = "_editor_" + this.id;
	var generalPrefs = this.generalPreferences || {};
	this.enableEditorTabs = generalPrefs.hasOwnProperty("enableEditorTabs") ? generalPrefs.enableEditorTabs : false;
	this.maximumEditorTabs = generalPrefs.hasOwnProperty("maximumEditorTabs") ? generalPrefs.maximumEditorTabs : 0;
	this.beingDragged = null;
	
	if (!this.enableEditorTabs) {
		this.maximumEditorTabs = 1;
	}

	// Used to hide horizontal scroll bar.
	var editorTabScrollHider = document.createElement("div");
	editorTabScrollHider.className = "editorTabContainerOuter";
	editorTabScrollHider.setAttribute("role", "tablist");
	this.parent.appendChild(editorTabScrollHider);
	
	var editorTabContainer = this.editorTabContainer = document.createElement("div");
	editorTabContainer.className = "editorTabContainer";
	editorTabContainer.id = "editorTabContainer" + this.id;
	editorTabScrollHider.appendChild(editorTabContainer);

	editorTabContainer.addEventListener("dragenter", this.dragenterListener_.bind(this));

	var tabWidgetDropdownNode = this.tabWidgetDropdownNode = document.createElement("div");
	tabWidgetDropdownNode.id = "tabWidgetDropdownNode" + this.id;
	tabWidgetDropdownNode.className = "editorViewerTabDropdown";
	tabWidgetDropdownNode.style.display = "none";
	tabWidgetDropdownNode.setAttribute("aria-haspopup", "true");

	this.parent.appendChild(tabWidgetDropdownNode);
	this.restoreTabsFromStorage();

	if (this.enableEditorTabs) {
		this.createDropdown_();
	}
}

TabWidget.prototype = {};
objects.mixin(TabWidget.prototype, {
	createDropdown_ : function() {
		var fileList = this.fileList;
		var that = this;
		this.widgetClick = function cb() {
			that.setWindowLocation(this.href);
		};

		var tabCommand = new mCommands.Command({
			selectionClass: "dropdownSelection",
			name: messages["AllTabsDropDown"],
			imageClass: "core-sprite-list",
			id: "orion.edit.selectEditor",
			visableWhen: function() {
				return true;
			},
			choiceCallback: function() {
				return fileList;
			}
		});
		this.commandRegistry.addCommand(tabCommand);
		this.commandRegistry.registerCommandContribution(this.tabWidgetDropdownNode.id, "orion.edit.selectEditor", 0);
		this.commandRegistry.renderCommands(this.tabWidgetDropdownNode.id, this.tabWidgetDropdownNode.id, this, this, "button");
		this.registerAdditionalCommands();
	},
	getMetadataByLocation_: function(location) {
		var metadata = null
		for (var i = this.fileList.length; i--;) {
			if (this.fileList[i].metadata.Location === location) {
				metadata = this.fileList[i].metadata;
				break;
			}
		}
		return metadata;
	},
	closeTab: function(metadata, isDirty) {
		if (!this.editorTabs.hasOwnProperty(metadata.Location)) {
			return;
		}
		var editorTab = this.editorTabs[metadata.Location];
		var editorTabNode = editorTab.editorTabNode;
		var href = editorTab.href;

		var tabClose = function() {
			this.removeTab(metadata);
			var evt = {
				type: "TabClosed",
				resource: metadata.Location
			};
			this.dispatchEvent(evt);
		}.bind(this);

		if (isDirty) {
			if (this.selectedFile.href !== href) {
				this.setWindowLocation(href);
			}
		}

		var closingEvent = {
			type: "TabClosing",
			isDirty: isDirty,
			editorTab: editorTabNode,
			callback: tabClose
		};
		this.dispatchEvent(closingEvent);
	},
	setWindowLocation: function(href) {
		window.location = href;
	},
	dragenterListener_: function(e) {
		e.preventDefault();
		var target = e.target;
		var draggedNode = this.beingDragged ? this.beingDragged.node : null;
		var insertBeforeNode = target.nextSibling;

		// Drag event from outside of this widget to the tab container.
		if (target.classList.contains("editorTabContainer") && draggedNode === null) {
			target = target.lastChild;
			insertBeforeNode = null;
		}
		var targetContainer = target.parentNode;
		if (target.classList.contains("editorTab")) {
			// Support for dragging between editors.
			if (!target.parentNode.contains(draggedNode)) {
				var evt = {type: "EditorTabTransfer", target: target, raisingId: this.id};
				this.dispatchEvent(evt);

				// Not a tab being dragged. Do nothing.
				if (!evt.beingDragged) {
					return;
				}

				var newTab = this.addTab(evt.beingDragged.metadata, evt.beingDragged.href);
				evt.beingDragged.parent.removeTab(evt.beingDragged.metadata);

				// add the hidden property to the newly created node.
				draggedNode = newTab.editorTabNode;
				draggedNode.classList.add('hideOnDrag');

				targetContainer = draggedNode.parentNode;

				// Update the being dragged in this class.
				this.beingDragged = {node: draggedNode, metadata: evt.beingDragged.metadata, href: evt.beingDragged.href, parent: this};

				// cleanup method after drag and drop.
				var afterDragActions =  {
					dragCleanup: function() {
						draggedNode.classList.remove('hideOnDrag');
						this.activateEditorViewer();
						draggedNode.click();
						this.beingDragged = null;
					}.bind(this)
				};

				this.afterDragActions = afterDragActions;
				evt.beingDragged.parent.afterDragActions = afterDragActions;

				// Clear the dragged object from the other tabWidget
				evt.beingDragged.parent.beingDragged = null;

				// If this is the only tab, do not remove it, and do not hide it.
				if (this.fileList.length > 1) {
					draggedNode.parentNode.removeChild(draggedNode);
				} else {
					draggedNode.classList.remove('hideOnDrag');
				}
			} else {
				if (target.nextSibling === draggedNode) {
					insertBeforeNode = target;
				}
				target.parentNode.removeChild(draggedNode);
			}

			if (insertBeforeNode) {
				targetContainer.insertBefore(draggedNode, insertBeforeNode);
			} else {
				targetContainer.appendChild(draggedNode);
			}
		}
	},
	setTabStorage: function() {
		var mappedFiles = this.fileList.map(function(f) {
			if (!f.metadata.Directory) {
				return {metadata: f.metadata, href: f.href};
			}
		});
		sessionStorage["editorTabs_" + this.id] = JSON.stringify(mappedFiles);
	},
	restoreTabsFromStorage: function() {
		if (sessionStorage.hasOwnProperty("editorTabs_" + this.id)) {
			try {
				var cachedTabs = JSON.parse(sessionStorage["editorTabs_" + this.id]);
				cachedTabs.reverse().forEach(function(cachedTab) {
					if (cachedTab) {
						this.addTab(cachedTab.metadata, cachedTab.href);
					}
				}.bind(this));
			} catch (e) {
				delete sessionStorage["editorTabs_" + this.id];
			}
		}
	},
	registerAdditionalCommands: function() {
		var nextTab = new mCommands.Command({
			name: messages["selectNextTab"],
			id: "orion.edit.selectNextTab",
			visibleWhen: function() {
				return true;
			},
			callback: this.selectNextTab.bind(this)
		});
		this.commandRegistry.addCommand(nextTab);

		var previousTab = new mCommands.Command({
			name: messages["selectPreviousTab"],
			id: "orion.edit.selectPreviousTab",
			visibleWhen: function() {
				return true;
			},
			callback: this.selectPreviousTab.bind(this)
		});
		this.commandRegistry.addCommand(previousTab);

		var showTabDropdown = new mCommands.Command({
			name: messages["showTabDropdown"],
			id: "orion.edit.showTabDropdown",
			visibleWhen: function() {
				return true;
			},
			callback: function() {
				this.tabWidgetDropdownNode.firstChild.click();
			}.bind(this)
		});
		this.commandRegistry.addCommand(showTabDropdown);

		this.commandRegistry.registerCommandContribution(this.editorTabContainer.id , "orion.edit.selectNextTab", 0, null, true, new mKeyBinding.KeyBinding(117, true), null, this);
		this.commandRegistry.registerCommandContribution(this.editorTabContainer.id , "orion.edit.selectPreviousTab", 0, null, true, new mKeyBinding.KeyBinding(117, true, true), null, this);
		this.commandRegistry.registerCommandContribution(this.editorTabContainer.id , "orion.edit.showTabDropdown", 0, null, true, new mKeyBinding.KeyBinding('e', true, true), null, this);

		this.commandRegistry.renderCommands(this.editorTabContainer.id, this.editorTabContainer.id, this, this, "button");
	},
	selectPreviousTab: function() {
		var selectedTab = this.getCurrentEditorTabNode();
		if (selectedTab.previousSibling !== null) {
			selectedTab.previousSibling.click();
		} else {
			selectedTab.parentNode.lastChild.click();
		}
	},
	selectNextTab: function() {
		var selectedTab = this.getCurrentEditorTabNode();
		if (selectedTab.nextSibling !== null) {
			selectedTab.nextSibling.click();
		} else {
			selectedTab.parentNode.firstChild.click();
		}
	},
	createTab_ : function(metadata, href) {
		var editorTab = document.createElement("div");
		editorTab.className = "editorTab";
		if (!this.enableEditorTabs) {
			editorTab.classList.add("editorTabsDisabled");
		}
		editorTab.setAttribute("draggable", true);
		editorTab.setAttribute("role", "tab");
		editorTab.setAttribute("aria-controls", "editorViewerContent_Panel" + this.id);

		
		this.editorTabContainer.appendChild(editorTab);
		
		var dirtyIndicator = document.createElement("span");
		dirtyIndicator.classList.add("editorViewerHeaderDirtyIndicator");
		dirtyIndicator.textContent = "*";
		dirtyIndicator.style.display = "none";
		editorTab.appendChild(dirtyIndicator);
		
		var curFileNode = document.createElement("span");
		curFileNode.className = "editorViewerHeaderTitle";
		editorTab.appendChild(curFileNode);
		var curFileNodeName = metadata.Name || "";
		if (bidiUtils.isBidiEnabled()) {
			curFileNodeName = bidiUtils.enforceTextDirWithUcc(curFileNodeName);
		}
		curFileNode.textContent = curFileNodeName;

		var closeButton = document.createElement("div");
		closeButton.className = "editorTabCloseButton";
		// Unicode multiplication sign
		closeButton.textContent = "\u2715";
		closeButton.addEventListener("click", function(e) {
			e.stopPropagation();
			var isDirty = dirtyIndicator.style.display !== "none";
			this.closeTab(metadata, isDirty);
		}.bind(this));

		editorTab.appendChild(closeButton);
		
		var fileNodeTooltip = new mTooltip.Tooltip({
			node: curFileNode,
			position: ["below", "above", "right", "left"]
		});
	
		// Create breadcrumb for tooltip.
		var localBreadcrumbNode = document.createElement("div");
		var tipContainer = fileNodeTooltip.contentContainer();
		tipContainer.appendChild(localBreadcrumbNode);
		
		var makeHref = function(segment, folderLocation, folder) {
			var resource = folder ? folder.Location : folderLocation;
			segment.href = uriTemplate.expand({resource: resource});
			if (folder) {
				if (metadata && metadata.Location === folder.Location) {
					segment.addEventListener("click", function() { //$NON-NLS-0$
						if (this.sidebarNavInputManager){
							this.sidebarNavInputManager.reveal(folder);
						}
					}.bind(this));
				}
			}
		}.bind(this);
		
		var breadcrumbOptions = {
			container: localBreadcrumbNode,
			resource: metadata,
			workspaceRootSegmentName: this.fileClient.fileServiceName(metadata.Location),
			workspaceRootURL: metadata.WorkspaceLocation || this.fileClient.fileServiceRootURL(metadata.Location),
			makeFinalHref: true,
			makeHref: makeHref,
			// This id should be unique regardless of editor views open.
			id: "breadcrumb" + metadata.Location + this.breadcrumbUniquifier
		};
		
		var breadcrumb = new mBreadcrumbs.BreadCrumbs(breadcrumbOptions);
		
		editorTab.addEventListener("click", function() {
			this.setWindowLocation(href);
		}.bind(this));

		editorTab.addEventListener("mouseup", function(e) {
			var button = e.which;
			if (button === 2) {
				e.preventDefault();
				var isDirty = dirtyIndicator.style.display !== "none";
				this.closeTab(metadata, isDirty);
			}
		}.bind(this));

		editorTab.addEventListener("dragstart", function(e) {
			if (this.fileList.length === 1) {
				e.preventDefault();
				return false;
			}
			this.beingDragged = {node: e.target, metadata: metadata, href: href, parent: this};
			setTimeout(function() {
				tipContainer.parentNode.classList.add('hideOnDrag');
				e.target.classList.add('hideOnDrag');
			});
		}.bind(this));
		
		editorTab.addEventListener("dragend", function(e) {
			if (this.afterDragActions) {
				setTimeout(function() {
					this.afterDragActions.dragCleanup();
					this.afterDragActions = null;
				}.bind(this));
			}
			this.beingDragged = null;
			tipContainer.parentNode.classList.remove('hideOnDrag');
			e.target.classList.remove('hideOnDrag');
		}.bind(this));

		return {
			editorTabNode: editorTab,
			dirtyIndicatorNode: dirtyIndicator,
			fileNameNode: curFileNode,
			breadcrumb: breadcrumb,
			closeButtonNode: closeButton,
			fileNodeToolTip: fileNodeTooltip,
			href: href
		};
	},
	getDraggedNode: function() {
		return this.beingDragged;
	},
	addTab: function(metadata, href) {
		var fileList = this.fileList;
		var fileToAdd = null;
		var curEditorTabNode = null;
		var editorTab;
		var lastCloseButton = this.getCurrentEditorCloseButtonNode();
		
		// Remove checkmark next to selected file, remove selected tab style.
		if (this.selectedFile) {
			this.selectedFile.checked = false;
			curEditorTabNode = this.getCurrentEditorTabNode();
			curEditorTabNode.classList.remove("focusedEditorTab");
			curEditorTabNode.setAttribute("aria-selected", "false");
		}

		// If the editor tab exists, reuse it.
		if (this.editorTabs.hasOwnProperty(metadata.Location)) {
			// Remove the item from the file list if it is present.
			for (var i = this.fileList.length; i--;) {
				if (this.fileList[i].metadata.Location === metadata.Location) {
					fileToAdd = this.fileList.splice(i, 1)[0];
					fileToAdd.checked = true;
					editorTab = this.editorTabs[metadata.Location];
					break;
				}
			}
		} else {
			// Store file information
			fileToAdd = {
				callback: this.widgetClick,
				checked:true, 
				href: href,
				metadata: metadata,
				name: metadata.Name,
			};
			// Create and store a new editorTab
			editorTab = this.editorTabs[metadata.Location] = this.createTab_(metadata, href);
		}

		// Add the file to our dropdown menu
		this.fileList.unshift(fileToAdd);
		
		// Style the editor tab
		editorTab.editorTabNode.classList.add("focusedEditorTab");
		editorTab.editorTabNode.setAttribute("aria-selected", "true");

		// Update the selected file
		this.selectedFile = this.fileList[0];

		// Enforce maximum editor tabs
		if (this.maximumEditorTabs > 0 && fileList.length > this.maximumEditorTabs) {
			var resourceClosing = fileList[fileList.length-1].metadata;
			this.removeTab(resourceClosing);
			this.dispatchEvent({type: "TabClosed", resource: resourceClosing.Location});
		}
		
		// Ensure it is visible
		this.scrollToTab(editorTab.editorTabNode);
		
		// If we have more than one open file, display the dropdown and close button on tabs
		if (this.fileList.length > 1) {
			lastCloseButton.style.display = "block";
			this.tabWidgetDropdownNode.style.display = "block";
		} else {
			editorTab.closeButtonNode.style.display = "none";
		}
		this.setTabStorage();
		return editorTab;
	},
	removeTab: function(metadata) {
		// Currently there is no support for an editor to be opened that does not have
		// an associated file.
		if (this.fileList.length === 1) {
			return;
		}

		var lastHref = this.selectedFile ? this.selectedFile.href : null;
		
		// If the tab being removed is selected, select the next file in the list
		if (this.selectedFile && this.selectedFile.metadata.Location === metadata.Location
			&& this.fileList.length > 1) {
			this.selectedFile = this.fileList[1];
		}
		for (var i = this.fileList.length; i--;) {
			if (this.fileList[i].metadata.Location === metadata.Location) {
				this.fileList.splice(i, 1);
			}
		}
		
		var tab = this.editorTabs[metadata.Location];
		if (tab) {
			tab.breadcrumb.destroy();
			tab.fileNodeToolTip.destroy();
		}
		
		this.editorTabContainer.removeChild(tab.editorTabNode);
		delete this.editorTabs[metadata.Location];
		
		if (this.fileList.length < 2) {
			this.tabWidgetDropdownNode.style.display = "none";
			var closeButton = this.getCurrentEditorCloseButtonNode();
			closeButton.style.display = "none";
		}

		if (lastHref !== this.selectedFile.href) {
			this.activateEditorViewer();
			this.setWindowLocation(this.selectedFile.href)
		}
		this.setTabStorage();
	},
	scrollToTab: function(tab) {
		var sib = tab.previousSibling;
		var offset = 30;
		if (sib) {
			offset = Math.floor(sib.offsetWidth / 2);
		}
		
		this.editorTabContainer.scrollLeft = tab.offsetLeft - offset;
	},
	getCurrentTabProperty: function(propertyName) {
		var fileMetadata = this.selectedFile && this.selectedFile.metadata ? this.selectedFile.metadata.Location : null;
		if (this.editorTabs.hasOwnProperty(fileMetadata)) {
			if (this.editorTabs[fileMetadata].hasOwnProperty(propertyName)) {
				return this.editorTabs[fileMetadata][propertyName];
			}
		}
		return null;
	},
	getCurrentTabDirtyIndicator: function() {
		return this.getCurrentTabProperty("dirtyIndicatorNode");
	},
	getCurrentEditorTabNode: function() {
		return this.getCurrentTabProperty("editorTabNode");
	},
	getCurrentEditorCloseButtonNode: function() {
		return this.getCurrentTabProperty("closeButtonNode");
	},
	updateDirtyIndicator: function(location, isDirty) {
		if (this.editorTabs.hasOwnProperty(location)) {
			var dirtyIndicator = this.editorTabs[location].dirtyIndicatorNode;
			if (dirtyIndicator) {
				dirtyIndicator.style.display = isDirty ? "block" : "none";
			}
		}
	}
});

function EditorViewer(options) {
	objects.mixin(this, options);
	this.id = this.id || ""; //$NON-NLS-0$
	this.selection = this.id ? new mSelection.Selection(this.serviceRegistry, "orion.page.selection" + this.id) : this.selection; //$NON-NLS-0$
	this.problemsServiceID = "orion.core.marker" + this.id; //$NON-NLS-0$
	this.editContextServiceID = "orion.edit.context" + this.id; //$NON-NLS-0$
	this.editModelContextServiceID = "orion.edit.model.context" + this.id; //$NON-NLS-0$
	this.shown = true;

	var domNode = this.domNode = document.createElement("div"); //$NON-NLS-0$
	domNode.className = "editorViewerFrame"; //$NON-NLS-0$
	this.parent.appendChild(domNode);
	
	// Create the header 
	var headerNode = this.headerNode = document.createElement("div"); //$NON-NLS-0$
	headerNode.className = "editorViewerHeader"; //$NON-NLS-0$
	domNode.appendChild(headerNode);

	// Create the editor content area
	var contentNode = this.contentNode = document.createElement("div"); //$NON-NLS-0$
	contentNode.className = "editorViewerContent"; //$NON-NLS-0$
	contentNode.id = "editorViewerContent_Panel" + this.id;
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
		this.createTabWidget();
		this.createEditorView();
	},
	
	createTextModel: function() {
		this.pool = this.modelPool.create(this.editModelContextServiceID);
	},
	
	createEditorView: function() {
		this.editorView = new mEditorView.EditorView(this.defaultOptions());
	},
	
	createTabWidget: function() {
		this.tabWidget = new TabWidget({
			parent: this.headerNode,
			commandRegistry: this.commandRegistry,
			id: this.id,
			fileClient: this.fileClient,
			generalPreferences: this.generalPreferences,
			inputManager: this.inputManager,
			activateEditorViewer: function() {
				this.activateContext.setActiveEditorViewer(this);
			}.bind(this)
		});

		this.tabWidget.addEventListener("TabClosing", function(evt) {
			var isDirty = evt.isDirty;
			if (isDirty) {
				if (this.inputManager._autoSaveEnabled) {
					this.inputManager.save();
					evt.callback();
				} else if (this.getOpenEditorCount(this.inputManager.getFileMetadata()) === 1) {
					var cancelCallback = function() { return; };
					this.inputManager.confirmUnsavedChanges(evt.callback, cancelCallback, evt.editorTab);
				} else {
					evt.callback();
				}
			} else {
				evt.callback();
			}
		}.bind(this));

		this.tabWidget.addEventListener("TabClosed", function(evt) {
			this.modelPool.release(evt.resource, this.id);
		}.bind(this));

		this.tabWidget.addEventListener("EditorTabTransfer", function(evt) {
			this.activateContext.editorViewers.forEach(function(viewer) {
				if (viewer.tabWidget.getDraggedNode() !== null) {
					evt.beingDragged = viewer.tabWidget.getDraggedNode();
				}
			});
		}.bind(this));
	},

	createInputManager: function() {
		var inputManager = this.inputManager = new mInputManager.InputManager({
			serviceRegistry: this.serviceRegistry,
			fileClient: this.fileClient,
			progressService: this.progressService,
			statusReporter: this.statusReporter.bind(this),
			selection: this.selection,
			contentTypeRegistry: this.contentTypeRegistry,
			generalPreferences: this.generalPreferences,
			confirm: function(message, buttonCallbackList, targetNode){
				targetNode = targetNode || this.tabWidget.getCurrentEditorTabNode();
				this.commandRegistry.confirmWithButtons(targetNode, message, buttonCallbackList);
			}.bind(this),
			reveal: function(model) {
				this.sidebar.sidebarNavInputManager.reveal(model);
			}.bind(this),
			isUnsavedWarningNeeed:function(){
				return this.getOpenEditorCount(this.inputManager.getFileMetadata()) === 1;
			}.bind(this)
		});
		inputManager.addEventListener("InputChanged", function(evt) { //$NON-NLS-0$
			var metadata = evt.metadata;
			if (metadata) {
				var tabHref = evt.location.href;
				var lastFile = PageUtil.hash();
				if (sessionStorage.lastFile === lastFile || lastFile.length === 0) {
					tabHref = uriTemplate.expand({resource: metadata.Location});
					lastFile = tabHref;
				}
				sessionStorage.lastFile = lastFile;
				this.tabWidget.addTab(metadata, tabHref);
			} else {
				delete sessionStorage.lastFile;
			}
			var view = this.getEditorView(evt.input, metadata);
			this.setEditor(view ? view.editor : null);
			this.updateDirtyIndicator();
			evt.editor = this.editor;
			this.pool.metadata = metadata;
			if (this.shown) {
				var href = window.location.href;
				this.activateContext.setActiveEditorViewer(this);
				this.commandRegistry.processURL(href);
			}
		}.bind(this));
		inputManager.addEventListener("InputChanging", function(e) { //$NON-NLS-0$
			var previousPool = this.pool;
			var modelPool = this.modelPool;
			var p = modelPool.search(e.input.resource);
			if (p) {
				this.pool = p;
			} else {
				p = this.pool = modelPool.create(this.editModelContextServiceID);
			}

			modelPool.registerViewer(this.pool, this.id);

			// If the pool has been initialized and the input has changed
			// set the event metadata so InputManager will update.
			if (this.pool.metadata && previousPool !== this.pool) {
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
		var fileClient = this.fileClient;

		this.fileClient.addEventListener("Changed", function(evt) {
			var that = this;
			var selectedMetadata = inputManager.getFileMetadata();
			if (evt.deleted) {
				evt.deleted.forEach(function(item) {
					var deleteLocation = item.deleteLocation;
					if (selectedMetadata.Location.indexOf(deleteLocation) === 0 || that.tabWidget.editorTabs.hasOwnProperty(deleteLocation)) {
						var metadata = that.tabWidget.getMetadataByLocation_(deleteLocation) || selectedMetadata;
						if (that.tabWidget.fileList.length < 2) {
							var newLocation;
							if (metadata.Parents) {
								metadata.Parents.some(function(p) {
									if (p.Location.indexOf(item.deleteLocation) !== 0) {
										newLocation = p.Location;
										return true;
									}
								});
							}
							inputManager.addEventListener("InputChanged", this.loadComplete = function() {
								inputManager.removeEventListener("InputChanged", this.loadComplete);
								that.tabWidget.closeTab(metadata, false);
							}.bind(this));
							inputManager.setInput(newLocation || metadata.WorkspaceLocation || fileClient.fileServiceRootURL(metadata.Location));
						} else {
							that.tabWidget.closeTab(metadata, false);
						}
					}
				});
			} else if (evt.hasOwnProperty("moved")) {
				evt.moved.forEach(function(item) {
					var sourceLocation = item.source;
					var metadata = that.tabWidget.getMetadataByLocation_(sourceLocation) || selectedMetadata;
					if (selectedMetadata.Location.indexOf(sourceLocation) === 0) {
						inputManager.addEventListener("InputChanged", this.loadComplete = function() {
							inputManager.removeEventListener("InputChanged", this.loadComplete);
							that.tabWidget.closeTab(metadata, false);
						}.bind(this));
						inputManager.setInput(item.result && item.result.Location || metadata.WorkspaceLocation || fileClient.fileServiceRootURL(selectedMetadata.Location));
					} else if (that.tabWidget.editorTabs.hasOwnProperty(sourceLocation)) {
						that.tabWidget.closeTab(metadata, false);
					}
				});
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
				this.activateContext.editorViewers.forEach(function(editorViewer){
					editorViewer.updateDirtyIndicator();
				});
			}.bind(this));
		}
	},
	
	updateDirtyIndicator: function(){
		if (this.editor && this.editor.isDirty) {
			var loc = this.inputManager.getFileMetadata().Location;
			var dirty = this.editor.isDirty();
			mGlobalCommands.setDirtyIndicator(dirty);
			// Update all dirty indicator for each tab associated with this file.
			this.activateContext.editorViewers.forEach(function(editorViewer) {
				editorViewer.tabWidget.updateDirtyIndicator(loc, dirty);
			});
		}
	},
	
	getOpenEditorCount: function(fileMetadata){
		var count = 0;
		this.activateContext.editorViewers.forEach(function(editorViewer){
			editorViewer.tabWidget.fileList.forEach(function(file) {
				if (file.metadata.Location === fileMetadata.Location) {
					count++;
				}
			});
		});
		return count;
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
	
	getGeneralPreferences: function() {
		return new mGeneralPrefs.GeneralPreferences(this.preferences).getPrefs().then(function(prefs) {
			this.generalPreferences = prefs;
		}.bind(this));
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
			serviceRegistry: this.serviceRegistry,
			generalPreferences: this.generalPreferences
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
				}.bind(this));
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
		this.sidebarNavInputManager.addEventListener("filesystemChanged", function(evt) { //$NON-NLS-0$
			this.fileClient.loadWorkspaces(evt.newInput).then(function(workspaces) {
				var resource = PageUtil.matchResourceParameters().resource;
				this.fileClient.getWorkspace(resource).then(function(workspace) {
					if (!workspaces.some(function(w) {
						if (w.Id === workspace.Id) {
							window.location = uriTemplate.expand({resource: w.Location});
							return true;
						}
					})) {
						window.location = uriTemplate.expand({resource: evt.newInput});
					}
				});
			}.bind(this));
		}.bind(this));
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
			generalPreferences: this.generalPreferences,
			searcher: this.searcher,
			selection: this.selection,
			fileClient: this.fileClient,
			statusService: this.statusService,
			progressService: this.progressService,
			sidebar:this.sidebar
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

		// If loading split panes, check to see if the second pane is loading window hash
		// and set input accordingly.
		if (this.editorViewers.length > 1) {
			var openFile = this.editorViewers[1].tabWidget.selectedFile.metadata.Location;
			if (openFile && currentHash === "" || currentHash.lastIndexOf(openFile, 1 ) === 1) {
				var editorHref = this.editorViewers[0].tabWidget.selectedFile.href;
				currentHash = "#" + editorHref.split("#")[1];
				lastEditedFile = null;
			}
		}
		if (lastEditedFile && lastEditedFile.lastIndexOf(currentHash, 0) === 0 && lastEditedFile !== currentHash) {
			// If the project didn't change, preserve resource parameters
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
			this.editorViewers[1].shown = true;
			if (this.editorViewers[1].tabWidget.fileList.length > 0) {
				var selectedFile = this.editorViewers[1].tabWidget.selectedFile;
				if (selectedFile) {
					var params = PageUtil.matchResourceParameters(selectedFile.href);
					delete params.resource;
					href = uriTemplate.expand({resource: selectedFile.metadata.Location, params: params});
				}
			}
			if (href) {
				this.editorViewers[1].inputManager.setInput(href);
			} else {
				this.editorViewers[1].inputManager.setInput(PageUtil.hash());
			}
		} else if (oldSplitterMode !== undefined && oldSplitterMode !== MODE_SINGLE && mode === MODE_SINGLE) {
			var metadata = this.editorViewers[1].inputManager.getFileMetadata();
			var rootLocation = metadata.WorkspaceLocation || this.fileClient.fileServiceRootURL(metadata.Location);
			this.editorViewers[1].shown = false;
			var editorTabsEnabled = this.generalPreferences && this.generalPreferences.enableEditorTabs;
			if (!editorTabsEnabled) {
				this.editorViewers[1].inputManager.setInput(rootLocation);
			}
		}
		sessionStorage.splitterSelection = mode;
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
		var choices = this.splitMenuChoices = [
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
		setup.getGeneralPreferences().then(function() {
			setup.createMenuBar().then(function() {
				setup.createSideBar();
				setup.createRunBar().then(function() {
					setup.editorViewers.push(setup.createEditorViewer());
					setup.setActiveEditorViewer(setup.editorViewers[0]);
					if (enableSplitEditor) {
						var mode = Number(sessionStorage.splitterSelection) || MODE_SINGLE;
						setup.createSplitMenu();
						setup.splitterMode = MODE_SINGLE;
						setup.splitMenuChoices[mode].callback();
					}
					setup.load();
				});
			});
		});
	});
};
return exports;
});
