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
/*global dojo dijit window eclipse registry:true widgets alert*/
/*jslint browser:true*/
dojo.addOnLoad(function(){
	
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
	
	var explorer = new eclipse.Explorer(registry, treeRoot, "breadcrumbParent", searcher, "explorer-tree", "navToolBar");
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
	
	/* NOT USED YET...TBD after M4 
	var newFileCommand = new eclipse.Command({
		name: "New File",
		image: "images/silk/page_add-gray.png",
		hotImage: "images/silk/page_add.png",
		id: "eclipse.createFile",
		callback: function(item) {
			var dialog = new widgets.NewItemDialog({
				title: "Create File",
				label: "File name:",
				func:  dojo.hitch(explorer, function(name){explorer.createFile(item);})
			});
			dialog.startup();
			dialog.show();
		}});
	commandService.addCommand(newFileCommand, "dom", "navToolBar");
	var newFolderCommand = new eclipse.Command({
		name: "New Folder",
		image: "images/silk/folder_add-gray.png",
		hotImage: "images/silk/folder_add.png",
		id: "eclipse.createFolder",
		callback: function(item) {
			var dialog = new widgets.NewItemDialog({
				title: "Create Folder",
				label: "Folder name:",
				func:  dojo.hitch(explorer, function(name){explorer.createFolder(item);})
			});
			dialog.startup();
			dialog.show();
		}});
	commandService.addCommand(newFolderCommand, "dom", "navToolBar");
	var newProjectCommand = new eclipse.Command({
		name: "New Folder",
		image: "images/silk/folder_add-gray.png",
		hotImage: "images/silk/folder_add.png",
		id: "eclipse.createProject",
		callback: function(item) {
			var dialog = new widgets.NewItemDialog({
				title: "Create Project",
				label: "Project name:",
				func:  dojo.hitch(explorer, function(name){explorer.createProject(name);})
			});
			dialog.startup();
			dialog.show();
		}});
	commandService.addCommand(newProjectCommand, "dom", "navToolBar");
	var linkProjectCommand = new eclipse.Command({
		name: "Link Folder",
		image: "images/silk/link_add-gray.png",
		hotImage: "images/silk/link_add.png",
		callback: function(item) {
			var dialog = new widgets.NewItemDialog({
				title: "Link Folder",
				label: "Folder name:",
				func:  dojo.hitch(explorer, function(name,url,create){explorer.createProject(name,url,create);}),
				advanced: true
			});
			dialog.startup();
			dialog.show();
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
	*/
	
	explorer.loadResourceList(dojo.hash());
	
	//every time the user manually changes the hash, we need to load the workspace with that name
	dojo.subscribe("/dojo/hashchange", explorer, function() {
	   explorer.loadResourceList(dojo.hash());
	});
	
	var search = dojo.byId("search");
	if (search) {
		dojo.connect(search, "onkeypress", function(e){
			if (e.charOrCode === dojo.keys.ENTER) {
				// We expect ExplorerTree to fill in the SearchLocation on the treeRoot
				if (explorer.treeRoot.SearchLocation) {
					if (search.value.length > 0) {
						var query = explorer.treeRoot.SearchLocation + search.value;
						explorer.loadResourceList(query);
						dojo.stopEvent(e);
					}
				} else {
					alert("Can't search: SearchLocation not available");
				}
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