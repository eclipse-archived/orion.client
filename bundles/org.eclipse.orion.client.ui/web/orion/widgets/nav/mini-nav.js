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
		params.setFocus = false;
		FileExplorer.apply(this, arguments);
		this.commandRegistry = params.commandRegistry;
		this.inputManager = params.inputManager;
		this.progressService = params.progressService;
		this.toolbarNode = params.toolbarNode;
		this.actions = null;
		this.selectionActions = null;
		var _self = this;
		this.inputManager.addEventListener("InputChanged", function(event) { //$NON-NLS-0$
			_self.load(event.metadata);
		});
		this.selection = new Selection.Selection(this.registry, "miniNavFileSelection"); //$NON-NLS-0$
		this.selection.addEventListener("selectionChanged", function(event) { //$NON-NLS-0$
			_self.updateCommands(event.selections);
		});
		this.createToolbars();
		this.commandsRegistered = this.registerCommands();
	}
	MiniNavExplorer.prototype = Object.create(FileExplorer.prototype);
	objects.mixin(MiniNavExplorer.prototype, {
		createToolbars: function() {
			if (!this.actions) {
				var actions = this.actions = document.createElement("div"); //$NON-NLS-0$
				actions.id = this.toolbarNode.id + "Actions"; //$NON-NLS-0$
				this.toolbarNode.appendChild(actions);
			}
			if (!this.selectionActions) {
				var selectionActions = this.selectionActions = document.createElement("div"); //$NON-NLS-0$
				selectionActions.id = this.toolbarNode.id + "SelectionActions"; //$NON-NLS-0$
				this.toolbarNode.appendChild(selectionActions);
			}
		},
		destroyToolbars: function() {
			this.actions = this.selectionActions = null;
		},
		/**
		 * Override {@link orion.explorers.FileExplorer#load} to load the parent directory of the given file
		 */
		load: function(fileMetadata) {
			this.createToolbars();
			var parent = fileMetadata && fileMetadata.Parents && fileMetadata.Parents[0];
			var rootPromise;
			if (parent) {
				rootPromise = this.fileClient.read(parent.ChildrenLocation, true);
				var _self = this;
				this.commandsRegistered.then(function() {
					FileExplorer.prototype.load.call(_self, rootPromise);
				});
			} else {
				console.log("Could not get parent directory");
				console.log(fileMetadata);
			}
		},
		scopeUp: function() {
			var root = this.treeRoot, parents = root && root.Parents;
			if (parents){
				if (parents.length === 0) {
					// TODO goto top
				} else if (parents[0].ChildrenLocation) {
					// TODO load it
				}
			}
		},
		// Returns a deferred that completes once file command extensions have been processed
		registerCommands: function() {
			// Selection based command contributions in sidebar mini-nav
			var commandRegistry = this.commandRegistry, fileClient = this.fileClient, serviceRegistry = this.registry;
			var selectionActionsId = this.selectionActions.id;
			commandRegistry.addCommandGroup(selectionActionsId, "orion.miniNavSelectionGroup", 100, messages["Actions"]);

			var renameBinding = new KeyBinding(113);
			renameBinding.domScope = "sidebar"; //$NON-NLS-0$
			renameBinding.scopeName = "Navigator"; //$NON-NLS-0$
			var delBinding = new KeyBinding(46);
			delBinding.domScope = "sidebar"; //$NON-NLS-0$
			delBinding.scopeName = "Navigator"; //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsId, "orion.makeFavorite", 1, "orion.miniNavSelectionGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsId, "eclipse.renameResource", 2, "orion.miniNavSelectionGroup", false, renameBinding); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsId, "eclipse.copyFile", 3, "orion.miniNavSelectionGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsId, "eclipse.moveFile", 4, "orion.miniNavSelectionGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsId, "eclipse.deleteFile", 5, "orion.miniNavSelectionGroup", false, delBinding); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsId, "eclipse.compareWithEachOther", 6, "orion.miniNavSelectionGroup");  //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsId, "eclipse.compareWith", 7, "orion.miniNavSelectionGroup");  //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsId, "orion.importZipURL", 1, "orion.miniNavSelectionGroup/orion.importExportGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsId, "orion.import", 2, "orion.miniNavSelectionGroup/orion.importExportGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsId, "eclipse.downloadFile", 3, "orion.miniNavSelectionGroup/orion.importExportGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsId, "orion.importSFTP", 4, "orion.miniNavSelectionGroup/orion.importExportGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsId, "eclipse.exportSFTPCommand", 5, "orion.miniNavSelectionGroup/orion.importExportGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			FileCommands.createFileCommands(serviceRegistry, commandRegistry, this, fileClient);
			return ExtensionCommands.createAndPlaceFileCommandsExtension(serviceRegistry, commandRegistry, selectionActionsId, 0, "orion.miniNavSelectionGroup", true);
		},
		updateCommands: function(selections) {
			var actions = this.actions, selectionActions = this.selectionActions;
			var commandRegistry = this.commandRegistry;
			if (actions) {
				commandRegistry.destroy(actions);
			}
			if (selectionActions) {
				commandRegistry.destroy(selectionActions);
			}
			commandRegistry.renderCommands(selectionActions.id, selectionActions, selections, this, "button"); //$NON-NLS-0$
			commandRegistry.renderCommands(actions.id /*scope*/, this.toolbarNode /*parent*/, this.treeRoot /*items*/, this /*handler??*/, "button"); //$NON-NLS-0$
		}
	});

	function MiniNavRenderer() {
		NavigatorRenderer.apply(this, arguments);
	}
	MiniNavRenderer.prototype = Object.create(NavigatorRenderer.prototype);
	MiniNavRenderer.prototype.showFolderLinks = true;
//	MiniNavRenderer.prototype.folderLink = require.toUrl("navigate/table.html"); //$NON-NLS-0$
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
			if (this.explorer) {
				this.explorer.load(this.inputManager.getFileMetadata());
				return;
			}
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
			// on initial creation we wait for an InputChanged event from inputManager -- possible race condition between rendering of Explorer and the InputChanged
		},
		destroy: function() {
			lib.empty(this.parentNode);
			lib.empty(this.toolbarNode);
			if (this.explorer) {
				this.explorer.destroyToolbars();
			}
		}
	});

	return MiniNavViewMode;
});
