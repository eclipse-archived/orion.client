/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global dojo dijit window eclipse serviceRegistry:true widgets alert*/
/*browser:true*/
dojo.addOnLoad(function(){
	
	// initialize service registry and EAS services
	serviceRegistry = new eclipse.ServiceRegistry();
	var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry);
	new eclipse.InputService(serviceRegistry);		
	new eclipse.StatusReportingService(serviceRegistry, "statusPane");
	new eclipse.LogService(serviceRegistry);
	new eclipse.DialogService(serviceRegistry);
	new eclipse.UserService(serviceRegistry);
	new eclipse.SelectionService(serviceRegistry);
	var preferenceService = new eclipse.Preferences(serviceRegistry, "/prefs/user");
	new eclipse.SaveableService(serviceRegistry);
	var commandService = new eclipse.CommandService({serviceRegistry: serviceRegistry});

	// File operations
	var filePlugin = pluginRegistry.getPlugin("/fileClientPlugin.html");
	if (filePlugin === null) {
		pluginRegistry.installPlugin("/fileClientPlugin.html");
	}
	
	// Favorites
	new eclipse.FavoritesService({serviceRegistry: serviceRegistry});
	
	// Git operations
	new eclipse.GitService(serviceRegistry);
	
	// this is temporary
	var unittestPlugin = pluginRegistry.getPlugin("/unittestPlugin.html");
	if (unittestPlugin === null) {
		pluginRegistry.installPlugin("/unittestPlugin.html");
	}
	
	var gitPlugin = pluginRegistry.getPlugin("/plugins/gitPlugin.html");
	if (gitPlugin === null) {
		pluginRegistry.installPlugin("/plugins/gitPlugin.html");
	}

	
	var treeRoot = {
		children:[]
	};
	var searcher = new eclipse.Searcher({serviceRegistry: serviceRegistry});
	
	var explorer = new eclipse.Explorer(serviceRegistry, treeRoot, searcher, "explorer-tree", "navToolBar", "selectionTools");
	
	var favorites = new eclipse.Favorites({parent: "favoriteProgress", serviceRegistry: serviceRegistry});

	// global commands
	eclipse.globalCommandUtils.generateBanner("toolbar", commandService, preferenceService, searcher, explorer);
	// commands shared by navigators
	eclipse.fileCommandUtils.createFileCommands(serviceRegistry, commandService, explorer, "navToolBar", "selectionTools");
	
	// define the command contributions - where things appear
	commandService.addCommandGroup("eclipse.fileGroup", 100, "More");
	commandService.addCommandGroup("eclipse.newResources", 100, null, "eclipse.fileGroup");
	commandService.addCommandGroup("eclipse.fileGroup.unlabeled", 100, null, null, "navToolBar");
	commandService.addCommandGroup("eclipse.gitGroup", 100, null, null, "navToolBar");
	commandService.addCommandGroup("eclipse.selectionGroup", 500, "More actions", null, "selectionTools");
	commandService.registerCommandContribution("eclipse.makeFavorite", 1);
	commandService.registerCommandContribution("eclipse.downloadFile", 2);
	commandService.registerCommandContribution("eclipse.openResource", 500, "navToolBar");
	commandService.registerCommandContribution("eclipse.deleteFile", 3, null, "eclipse.fileGroup");
	commandService.registerCommandContribution("eclipse.importCommand", 4, null, "eclipse.fileGroup");
	// new file and new folder in the object contribution uses the labeled group
	commandService.registerCommandContribution("eclipse.newFile", 1, null, "eclipse.fileGroup/eclipse.newResources");
	commandService.registerCommandContribution("eclipse.newFolder", 2, null, "eclipse.fileGroup/eclipse.newResources");
	//new file and new folder in the nav bar do not label the group (we don't want a menu)
	commandService.registerCommandContribution("eclipse.newFile", 1, "navToolBar", "eclipse.fileGroup.unlabeled");
	commandService.registerCommandContribution("eclipse.newFolder", 2, "navToolBar", "eclipse.fileGroup.unlabeled");
	commandService.registerCommandContribution("eclipse.newProject", 3, "navToolBar", "eclipse.fileGroup.unlabeled");
	commandService.registerCommandContribution("eclipse.linkProject", 4, "navToolBar", "eclipse.fileGroup.unlabeled");
	// selection based command contributions
	commandService.registerCommandContribution("eclipse.copyFile", 1, "selectionTools", "eclipse.selectionGroup");
	commandService.registerCommandContribution("eclipse.moveFile", 2, "selectionTools", "eclipse.selectionGroup");
	commandService.registerCommandContribution("eclipse.deleteFile", 3, "selectionTools", "eclipse.selectionGroup");
	// git contributions
	commandService.registerCommandContribution("eclipse.cloneGitRepository", 1, "navToolBar", "eclipse.gitGroup");

	eclipse.fileCommandUtils.createAndPlaceFileCommandsExtension(serviceRegistry, commandService, explorer, "navToolBar", "selectionTools", "eclipse.fileGroup");
	
	var treeViewCommand = new eclipse.Command({
		name : "Tree View",
		image : "images/hierarchicalLayout.gif",
		id: "eclipse.treeViewCommand",
		groupId: "eclipse.viewGroup",
		callback : function() {
			serviceRegistry.getService("IPreferencesService").then(function(service) {
				service.put("window/orientation", "navigate-tree.html");
			});
			window.location.replace("/navigate-tree.html#" + dojo.hash());
		}});
		
	commandService.addCommand(treeViewCommand, "dom");
	commandService.addCommandGroup("eclipse.viewGroup", 800);
	commandService.registerCommandContribution("eclipse.treeViewCommand", 1, "navToolBar", "eclipse.viewGroup");
		
	explorer.loadResourceList(dojo.hash());
	
	//every time the user manually changes the hash, we need to load the workspace with that name
	dojo.subscribe("/dojo/hashchange", explorer, function() {
	   explorer.loadResourceList(dojo.hash());
	});
});
