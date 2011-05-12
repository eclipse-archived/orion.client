/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global dojo dijit window eclipse serviceRegistry:true widgets*/
dojo.addOnLoad(function(){
	
	// initialize service registry and EAS services
	serviceRegistry = new eclipse.ServiceRegistry();
	var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry);
	dojo.addOnWindowUnload(function() {
		pluginRegistry.shutdown();
	});
	new eclipse.StatusReportingService(serviceRegistry, "statusPane", "notifications");
	new eclipse.LogService(serviceRegistry);
	new eclipse.DialogService(serviceRegistry);
	new eclipse.UserService(serviceRegistry);
	new eclipse.SelectionService(serviceRegistry);
	new eclipse.SshService(serviceRegistry);
	var preferenceService = new eclipse.PreferencesService(serviceRegistry, "/prefs/user");
	var commandService = new eclipse.CommandService({serviceRegistry: serviceRegistry});
	
	// Favorites
	new eclipse.FavoritesService({serviceRegistry: serviceRegistry});

	var treeRoot = {
		children:[]
	};
	var searcher = new eclipse.Searcher({serviceRegistry: serviceRegistry});
	
	var fileClient = new eclipse.FileClient(serviceRegistry, pluginRegistry);
	
	var contextMenu = dijit.byId("treeContextMenu");
	
	var explorer = new eclipse.ExplorerTree(serviceRegistry, treeRoot,
			searcher, fileClient, "explorer-tree", "navToolBar", contextMenu);
			
	var favorites = new eclipse.Favorites({parent: "favoriteProgress", serviceRegistry: serviceRegistry});
	
	// global commands
	eclipse.globalCommandUtils.generateBanner("toolbar", serviceRegistry, commandService, preferenceService, searcher, explorer);
			
	// commands shared among navigators
	eclipse.fileCommandUtils.createFileCommands(serviceRegistry, commandService, explorer, "navToolBar");

	// define the command contributions - where things appear
	commandService.addCommandGroup("eclipse.fileGroup", 100);
	commandService.addCommandGroup("eclipse.newResources", 100, "New", "eclipse.fileGroup");
	commandService.registerCommandContribution("eclipse.makeFavorite", 1);
	commandService.registerCommandContribution("eclipse.downloadFile", 2);
	commandService.registerCommandContribution("eclipse.openResource", 500, "navToolBar");
	commandService.registerCommandContribution("eclipse.deleteFile", 1, null, "eclipse.fileGroup");
	commandService.registerCommandContribution("eclipse.copyFile", 2, null, "eclipse.fileGroup");
	commandService.registerCommandContribution("eclipse.moveFile", 3, null, "eclipse.fileGroup");
	commandService.registerCommandContribution("eclipse.importCommand", 4, null, "eclipse.fileGroup");
	commandService.registerCommandContribution("eclipse.importSFTPCommand", 5, null, "eclipse.fileGroup");
	commandService.registerCommandContribution("eclipse.exportSFTPCommand", 6, null, "eclipse.fileGroup");
	commandService.registerCommandContribution("eclipse.newFile", 1, null, "eclipse.fileGroup/eclipse.newResources");
	commandService.registerCommandContribution("eclipse.newFolder", 2, null, "eclipse.fileGroup/eclipse.newResources");
	commandService.registerCommandContribution("eclipse.newProject", 1, "navToolBar", "eclipse.fileGroup");
	commandService.registerCommandContribution("eclipse.linkProject", 2, "navToolBar", "eclipse.fileGroup");

	eclipse.fileCommandUtils.createAndPlaceFileCommandsExtension(serviceRegistry, commandService, explorer, "navToolBar", null, "eclipse.fileGroup");
	
	// commands specific to this page
	var tableViewCommand = new eclipse.Command({
		name : "Table View",
		image : "images/flatLayout.gif",
		id: "eclipse.tableViewCommand",
		callback : function() {
			serviceRegistry.getService("IPreferencesService").then(function(service) {
				service.put("window/orientation", "navigate-table.html");
			});
			window.location.replace("/navigate-table.html#" + dojo.hash());
		}});
	commandService.addCommand(tableViewCommand, "dom");
	commandService.addCommandGroup("eclipse.viewGroup", 800);
	commandService.registerCommandContribution("eclipse.tableViewCommand", 1, "navToolBar", "eclipse.viewGroup");

	explorer.loadResourceList(dojo.hash());
	

	//every time the user manually changes the hash, we need to load the workspace with that name
	dojo.subscribe("/dojo/hashchange", explorer, function() {
		explorer.loadResourceList(dojo.hash());
	});
});