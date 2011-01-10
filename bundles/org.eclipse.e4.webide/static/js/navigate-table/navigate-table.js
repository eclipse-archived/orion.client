/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global dojo dijit window eclipse registry widgets*/
dojo.addOnLoad(function(){
	// Things that services need...
	var itemAdvancedInfo = dojo.byId("itemAdvancedInfo"),
		itemName = dojo.byId("itemName"),
		itemNameLabel = dojo.byId("itemNameLabel"),
		itemURL = dojo.byId("itemURL"),
		newItemDialog = dijit.byId("newItemDialog"),
		protocol = dijit.byId("protocol"),
		module = dojo.byId("module");
	
	// FIXME until we sort out where service registration happens, and how dependencies on
	// services are expressed, just copy this code around...
	registry = new eclipse.Registry();
	registry.start();
	
	var jslintPlugin = registry.getPlugin("/jslintPlugin.html");
	if (jslintPlugin === null) {
		registry.loadPlugin("/jslintPlugin.html", function(plugin) {
			registry.installPlugin(plugin.pluginURL, plugin.pluginData);
		});
	}
	
	// Register EAS
	registry.registerLocalService("IStatusReporter", "EASStatusReporter", new eclipse.StatusReportingService(registry, "statusPane"));
	registry.registerLocalService("ILogService", "EASLog", new eclipse.LogService(registry));
	registry.registerLocalService("IDialogService", "EASDialogs", new eclipse.DialogService(registry));
	registry.registerLocalService("ISaveable", "EASSaveable", new eclipse.SaveableService(registry));
	registry.registerLocalService("IInputProvider", "EASInputProvider", new eclipse.InputService(registry));
	registry.registerLocalService("IUsers", "EASUsers", new eclipse.UserService(registry));
	registry.registerLocalService("ISelectionService", "EASSelection", new eclipse.SelectionService(registry));
	var preferenceService = new eclipse.Preferences(registry, "/prefs/user");
	registry.registerLocalService("IPreferenceService", "EASPreferences", preferenceService);
	var commandService = new eclipse.CommandService(registry);
	registry.registerLocalService("ICommandService", "CommandService", commandService);

	// File operations
	registry.registerLocalService("IFileService", "FileService", new eclipse.FileService());
	
	// Favorites
	registry.registerLocalService("IFavorites", "FavoritesService", new eclipse.FavoritesService({serviceRegistry: registry}));
	
	var treeRoot = {
		children:[]
	};
	var favorites = new eclipse.Favorites({parent: "favoriteProgress", serviceRegistry: registry});
	var searcher = new eclipse.Searcher({serviceRegistry: registry});
	var newItemDialogProvider = new eclipse.NewItemDialogProvider(itemAdvancedInfo, itemName, itemNameLabel,
				itemURL, newItemDialog, protocol, module);
	
	var explorer = new eclipse.Explorer(newItemDialogProvider, registry, treeRoot, "breadcrumbParent", 
						searcher, "explorer-tree", "navToolBar");
	// declare commands
	
	var favoriteCommand = new eclipse.Command({
		name: "Make Favorite",
		image: "images/silk/star-gray.png",
		hotImage: "images/silk/star.png",
		id: "eclipse.makeFavorite",
		callback: function(id) {
			explorer.makeFavorite(id);
		}});
	commandService.addCommand(favoriteCommand, "object");
	var deleteCommand = new eclipse.Command({
		name: "Delete",
		image: "images/silk/cross-gray.png",
		hotImage: "images/silk/cross.png",
		id: "eclipse.deleteFile",
		callback: function(id) {
			explorer.deleteFile(id);
		}});
	commandService.addCommand(deleteCommand, "object");
	var newFileCommand = new eclipse.Command({
		name: "New File",
		image: "images/silk/page_add-gray.png",
		hotImage: "images/silk/page_add.png",
		id: "eclipse.createFile",
		callback: function(item) {
			newItemDialogProvider.showNewItemDialog('Create File', 'File name:',
				dojo.hitch(explorer, function(name){explorer.createFile(item);}));
		}});
	commandService.addCommand(newFileCommand, "dom", "navToolBar");
	var newFolderCommand = new eclipse.Command({
		name: "New Folder",
		image: "images/silk/folder_add-gray.png",
		hotImage: "images/silk/folder_add.png",
		id: "eclipse.createFolder",
		callback: function(item) {
			newItemDialogProvider.showNewItemDialog('Create Folder', 'Folder name:',
				dojo.hitch(explorer, function(name){explorer.createFolder(item);}));
		}});
	commandService.addCommand(newFolderCommand, "dom", "navToolBar");
	var newProjectCommand = new eclipse.Command({
		name: "New Folder",
		image: "images/silk/folder_add-gray.png",
		hotImage: "images/silk/folder_add.png",
		id: "eclipse.createProject",
		callback: function(item) {
			newItemDialogProvider.showNewItemDialog('Create Folder', 'Folder name:',
				dojo.hitch(explorer, function(name){explorer.createProject(name);}));
		}});
	commandService.addCommand(newProjectCommand, "dom", "navToolBar");
	var linkProjectCommand = new eclipse.Command({
		name: "Link Folder",
		image: "images/silk/link_add-gray.png",
		hotImage: "images/silk/link_add.png",
		callback: function(item) {
			newItemDialogProvider.showNewItemDialog('Link Folder', 'Folder name:',
				dojo.hitch(explorer, function(name,url){explorer.createProject(name,url);}),
								true);
		}});
	commandService.addCommand(linkProjectCommand, "dom", "navToolBar");
	var openResourceCommand = new eclipse.Command({
		name: "Open Resource",
		image: "images/silk/find-gray.png",
		hotImage: "images/silk/find.png",
		id: "eclipse.openResource",
		callback: function() {
			var that = this;
			setTimeout(function() {
				new widgets.OpenResourceDialog({
					SearchLocation: treeRoot.SearchLocation,
					searcher: searcher
				}).show();
			}, 0);
		}});
	commandService.addCommand(openResourceCommand, "global");
	
	explorer.loadResourceList(dojo.hash());
	
	//every time the user manually changes the hash, we need to load the workspace with that name
	dojo.subscribe("/dojo/hashchange", explorer, function() {
	   explorer.loadResourceList(dojo.hash());
	});
	
	var search = dojo.byId("search");
	if (search) {
		dojo.connect(search, "onkeypress", function(e){
			switch(e.charOrCode){
			case dojo.keys.ENTER:
				var query = treeRoot.SearchLocation + search.value;
				explorer.loadResourceList(query);
				dojo.stopEvent(e);
				break;
			}
		});
	}
	
	dojo.byId("switchView").onclick = function(evt) {
		preferenceService.put("window/orientation", "navigate-tree.html");
		window.location.replace("/navigate-tree.html#" + dojo.hash());
	};
});

dojo.addOnUnload(function(){
	registry.stop();
});