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
/*global dojo dijit window eclipse serviceRegistry:true widgets alert*/
/*browser:true*/
dojo.addOnLoad(function(){
	
	// initialize service registry and EAS services
	serviceRegistry = new eclipse.ServiceRegistry();
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
	new eclipse.FileService(serviceRegistry);
	
	// Favorites
	new eclipse.FavoritesService({serviceRegistry: serviceRegistry});
	
	var treeRoot = {
		children:[]
	};
	var favorites = new eclipse.Favorites({parent: "favoriteProgress", serviceRegistry: serviceRegistry});
	var searcher = new eclipse.Searcher({serviceRegistry: serviceRegistry});
	
	var explorer = new eclipse.Explorer(serviceRegistry, treeRoot, searcher, "explorer-tree", "navToolBar");
	
	// TODO search location needs to be gotten from somewhere
	eclipse.globalCommandUtils.generateBanner("toolbar", commandService, preferenceService, searcher, "/search?q=", explorer);

	// commands shared by navigators
	eclipse.fileCommandUtils.createFileCommands(serviceRegistry, commandService, explorer, "navToolBar");
	
	// define the command contributions - where things appear
	commandService.addCommandGroup("eclipse.fileGroup", 100, "More");
	commandService.addCommandGroup("eclipse.newResources", 100, null, "eclipse.fileGroup");
	commandService.addCommandGroup("eclipse.fileGroup.unlabeled", 100, null, null, "navToolBar");
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
	
	eclipse.fileCommandUtils.hookUpSearch("search", explorer);

});