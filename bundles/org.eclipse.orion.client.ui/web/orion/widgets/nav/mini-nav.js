/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others. 
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define*/
/*jslint browser:true devel:true sub:true*/
define(['require', 'i18n!orion/edit/nls/messages', 'orion/objects', 'orion/webui/littlelib', 'orion/explorers/explorer-table',
	'orion/explorers/navigatorRenderer', 'orion/i18nUtil', 'orion/keyBinding', 'orion/fileCommands', 'orion/extensionCommands', 'orion/selection'
	],
	function(require, messages, objects, lib, mExplorer, mNavigatorRenderer, i18nUtil, mKeyBinding, FileCommands, ExtensionCommands, Selection) {
	var FileExplorer = mExplorer.FileExplorer;
	var KeyBinding = mKeyBinding.KeyBinding;
	var NavigatorRenderer = mNavigatorRenderer.NavigatorRenderer;

	function MiniNavExplorer(params) {
		params.setFocus = false;   // do not steal focus on load
		params.cachePrefix = null; // do not persist table state
		FileExplorer.apply(this, arguments);
		this.commandRegistry = params.commandRegistry;
		this.inputManager = params.inputManager;
		this.progressService = params.progressService;
		this.toolbarNode = params.toolbarNode;
		this.actions = null;
		this.selectionActions = null;
		this.treeRoot = { }; // Needed by FileExplorer.prototype.loadResourceList
		var _self = this;
		this.inputManager.addEventListener("InputChanged", function(event) { //$NON-NLS-0$
			_self.loadParentOf(event.metadata);
		});
		this.selection = new Selection.Selection(this.registry, "miniNavFileSelection"); //$NON-NLS-0$
		this.selection.addEventListener("selectionChanged", function(event) { //$NON-NLS-0$
			_self.updateCommands(event.selections);
		});
		this.commandsRegistered = this.registerCommands();
	}
	MiniNavExplorer.prototype = Object.create(FileExplorer.prototype);
	objects.mixin(MiniNavExplorer.prototype, {
		createActionSections: function() {
			var _self = this;
			// Create some elements that we can hang actions on. Ideally we'd have just 1, but the
			// CommandRegistry seems to require dropdowns to have their own element.
			["actions1", "actions2", "actions3"].forEach(function(name) {
				if (!_self[name]) {
					var elem = _self[name] = document.createElement("ul"); //$NON-NLS-0$
					elem.classList.add("commandList"); //$NON-NLS-0$
					elem.classList.add("layoutLeft"); //$NON-NLS-0$
					elem.classList.add("pageActions"); //$NON-NLS-0$
					_self.toolbarNode.appendChild(elem);
				}
			});
		},
		destroy: function() {
			this.actions1 = this.actions2 = null;
		},
		/**
		 * Loads the parent directory of the given file, then reveals it.
		 * @param {Object} fileMetadata The file whose parent directory we want to load.
		 */
		loadParentOf: function(fileMetadata) {
			var parent = fileMetadata && fileMetadata.Parents && fileMetadata.Parents[0];
			if (parent) {
				if (this.treeRoot && this.treeRoot.ChildrenLocation === parent.ChildrenLocation) {
					this.reveal(fileMetadata);
					return;
				}
				var _self = this;

				return this.commandsRegistered.then(function() {
					return FileExplorer.prototype.loadResourceList.call(_self, parent.ChildrenLocation).then(_self.reveal.bind(_self, fileMetadata));
				});
			}
		},
		reveal: function(fileMetadata) {
			var navHandler = this.getNavHandler();
			if (navHandler) {
				navHandler.cursorOn(fileMetadata, true, false, false);
				navHandler.setSelection(fileMetadata);
			}
		},
		scopeUp: function() {
			var root = this.treeRoot, parents = root && root.Parents;
			if (parents) {
				if (parents.length === 0) {
					// Show the top level
					this.loadResourceList("").then(this.reveal.bind(this, this.treeRoot)); //$NON-NLS-0$
				} else {
					this.loadParentOf(this.treeRoot);
				}
			}
		},
		// Returns a deferred that completes once file command extensions have been processed
		registerCommands: function() {
			// Selection based command contributions in sidebar mini-nav
			var commandRegistry = this.commandRegistry, fileClient = this.fileClient, serviceRegistry = this.registry;
			var newActionsScope = this.newActionsScope = this.toolbarNode.id + "New"; //$NON-NLS-0$
			var selectionActionsScope = this.selectionActionsScope = this.toolbarNode.id + "Selection"; //$NON-NLS-0$
			var folderNavActionsScope = this.folderNavActionsScope = this.toolbarNode.id + "Folder";
			commandRegistry.addCommandGroup(newActionsScope, "orion.miniNavNewGroup", 1000, messages["New"]); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.addCommandGroup(selectionActionsScope, "orion.miniNavSelectionGroup", 100, messages["Actions"]);

			// New file and new folder (in a group)
			commandRegistry.registerCommandContribution(newActionsScope, "eclipse.newFile", 1, "orion.miniNavNewGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(newActionsScope, "eclipse.newFolder", 2, "orion.miniNavNewGroup", false, null/*, new mCommandRegistry.URLBinding("newFolder", "name")*/); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			// New project creation in the toolbar (in a group)
			commandRegistry.registerCommandContribution(newActionsScope, "orion.new.project", 1, "orion.miniNavNewGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(newActionsScope, "orion.new.linkProject", 2, "orion.miniNavNewGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			// Folder nav actions
			commandRegistry.registerCommandContribution(folderNavActionsScope, "eclipse.upFolder", 1, null, true, new KeyBinding(38, false, false, true)); //$NON-NLS-1$ //$NON-NLS-0$

			var renameBinding = new KeyBinding(113);
			renameBinding.domScope = "sidebar"; //$NON-NLS-0$
			renameBinding.scopeName = messages["Navigator"]; //$NON-NLS-0$
			var delBinding = new KeyBinding(46);
			delBinding.domScope = "sidebar"; //$NON-NLS-0$
			delBinding.scopeName = messages["Navigator"];
//			commandRegistry.registerCommandContribution(selectionActionsScope, "orion.makeFavorite", 1, "orion.miniNavSelectionGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsScope, "eclipse.renameResource", 2, "orion.miniNavSelectionGroup", false, renameBinding); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsScope, "eclipse.copyFile", 3, "orion.miniNavSelectionGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsScope, "eclipse.moveFile", 4, "orion.miniNavSelectionGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsScope, "eclipse.deleteFile", 5, "orion.miniNavSelectionGroup", false, delBinding); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsScope, "eclipse.compareWithEachOther", 6, "orion.miniNavSelectionGroup");  //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsScope, "eclipse.compareWith", 7, "orion.miniNavSelectionGroup");  //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsScope, "orion.importZipURL", 1, "orion.miniNavSelectionGroup/orion.importExportGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsScope, "orion.import", 2, "orion.miniNavSelectionGroup/orion.importExportGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsScope, "eclipse.downloadFile", 3, "orion.miniNavSelectionGroup/orion.importExportGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsScope, "orion.importSFTP", 4, "orion.miniNavSelectionGroup/orion.importExportGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsScope, "eclipse.exportSFTPCommand", 5, "orion.miniNavSelectionGroup/orion.importExportGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			FileCommands.createFileCommands(serviceRegistry, commandRegistry, this, fileClient);
			return ExtensionCommands.createAndPlaceFileCommandsExtension(serviceRegistry, commandRegistry, selectionActionsScope, 0, "orion.miniNavSelectionGroup", true);
		},
		updateCommands: function(selections) {
			this.createActionSections();
			var commandRegistry = this.commandRegistry;
			commandRegistry.destroy(this.actions1);
			commandRegistry.destroy(this.actions2);
			commandRegistry.destroy(this.actions3);
			commandRegistry.renderCommands(this.newActionsScope /*scope*/, this.actions1 /*parent*/, this.treeRoot /*items*/, this /*handler??*/, "button"); //$NON-NLS-0$
			commandRegistry.renderCommands(this.selectionActionsScope, this.actions2, selections, this, "button"); //$NON-NLS-0$
			commandRegistry.renderCommands(this.folderNavActionsScope, this.actions3, this.treeRoot, this, "button"); //$NON-NLS-0$
		}
	});

	function MiniNavRenderer() {
		NavigatorRenderer.apply(this, arguments);
	}
	MiniNavRenderer.prototype = Object.create(NavigatorRenderer.prototype);
	MiniNavRenderer.prototype.createFolderNode = function(folder) {
		var node = NavigatorRenderer.prototype.createFolderNode.call(this, folder);
		node.classList.add("nav_expandinplace"); //$NON-NLS-0$;
		// TODO wasteful, should not need listener per node. should get model item from nav handler
		node.addEventListener("click", this.onFolderClick.bind(this, folder)); //$NON-NLS-0$
		return node;
	};
	MiniNavRenderer.prototype.onFolderClick = function(folder, evt) {
		var navHandler = this.explorer.getNavHandler();
		if (navHandler) {
			navHandler.cursorOn(folder);
			navHandler.setSelection(folder, false);
			// now toggle its expand/collapse state
			var curModel = navHandler._modelIterator.cursor();
			if (navHandler.isExpandable(curModel)){
				if(!navHandler.isExpanded(curModel)){
					this.explorer.myTree.expand(curModel);
				} else {
					this.explorer.myTree.collapse(curModel);
				}
				evt.preventDefault();
				return false;
			}
		}
	};
	MiniNavRenderer.prototype.showFolderLinks = false;
	MiniNavRenderer.prototype.oneColumn = true;

	/**
	 * @name orion.sidebar.MiniNavViewMode
	 * @class
	 */
	function MiniNavViewMode(params) {
		this.commandRegistry = params.commandRegistry;
		this.contentTypeRegistry = params.contentTypeRegistry;
		this.fileClient = params.fileClient;
		this.inputManager = params.inputManager;
		this.parentNode = params.parentNode;
		this.toolbarNode = params.toolbarNode;
//		this.selection = params.selection;
		this.serviceRegistry = params.serviceRegistry;
		this.explorer = null;
	}
	objects.mixin(MiniNavViewMode.prototype, {
		label: messages["Navigator"],
		create: function() {
			var _self = this;
			this.explorer = new MiniNavExplorer({
				commandRegistry: this.commandRegistry,
				fileClient: this.fileClient,
				inputManager: this.inputManager,
				parentId: this.parentNode,
				rendererFactory: function(explorer) {
					var renderer = new MiniNavRenderer({
						checkbox: false,
						cachePrefix: "MiniNav"}, explorer, _self.commandRegistry, _self.contentTypeRegistry); //$NON-NLS-0$
					return renderer;
				},
//				selection: this.selection,
				serviceRegistry: this.serviceRegistry,
				toolbarNode: this.toolbarNode
			});
			// On initial page load, metadata may not be loaded yet, but that's ok -- InputChanged will inform us later
			this.explorer.loadParentOf(this.inputManager.getFileMetadata());
		},
		destroy: function() {
			if (this.explorer) {
				this.explorer.destroy();
			}
			this.explorer = null;
		}
	});

	return MiniNavViewMode;
});
