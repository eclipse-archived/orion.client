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
/*jslint */
define(['require', 'orion/objects', 'orion/webui/littlelib', 'orion/explorers/explorer-table', 'orion/explorers/navigatorRenderer', 'orion/i18nUtil',
	'i18n!orion/nls/messages'],
	function(require, objects, lib, mExplorer, mNavigatorRenderer, i18nUtil, messages) {
	var FileExplorer = mExplorer.FileExplorer;
	var NavigatorRenderer = mNavigatorRenderer.NavigatorRenderer;

	function MiniNavExplorer(options) {
		options.setFocus = false;
		FileExplorer.apply(this, arguments);
		this.inputManager = options.inputManager;
		this.progressService = options.progressService;
		var _self = this;
		this.inputManager.addEventListener("InputChanged", function(event) {
			_self.load(event.metadata);
		});
	}
	MiniNavExplorer.prototype = Object.create(FileExplorer.prototype);
	objects.mixin(MiniNavExplorer.prototype, {
		/** Load the parent directory of the given file */
		load: function(fileMetadata) {
			var parent = fileMetadata && fileMetadata.Parents && fileMetadata.Parents[0];
			var rootPromise;
			if (parent) {
				// console.log('loading parent info for sidebar nav ' + JSON.stringify(parent));
				// TODO should use progressService here
				/*self.progressService.progress(___________, i18nUtil.formatMessage("Getting metadata of ${0}", metadata.Parents[0].Location));
				*/
				rootPromise = this.fileClient.read(parent.ChildrenLocation, true);
				FileExplorer.prototype.load.call(this, rootPromise);
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
		this.selection = params.selection;
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
				/*openWithCommands: openWithCommands*/
				fileClient: this.fileClient,
				inputManager: this.inputManager,
				parentId: this.parentNode,
				rendererFactory: function(explorer) {
					var renderer = new MiniNavRenderer({
						checkbox: false,
						cachePrefix: "MiniNav"}, explorer, _self.commandRegistry, _self.contentTypeRegistry); //$NON-NLS-0$
					return renderer;
				},
				selection: this.selection,
				serviceRegistry: this.serviceRegistry
			});
			// on initial creation we wait for an InputChanged event from inputManager -- possible race condition between rendering of Explorer and the InputChanged
		},
		destroy: function() {
			lib.empty(this.parentNode);
		}
	});

	return MiniNavViewMode;
});
