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
/*global dojo dijit window eclipse orion serviceRegistry:true widgets alert*/
/*browser:true*/
dojo.addOnLoad(function(){
	
	// initialize service registry and EAS services
	serviceRegistry = new eclipse.ServiceRegistry();
	var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry);
	dojo.addOnUnload(function() {
		pluginRegistry.shutdown();
	});
	var selection = new orion.Selection(serviceRegistry);		
	new eclipse.StatusReportingService(serviceRegistry, "statusPane");
	new eclipse.LogService(serviceRegistry);
	new eclipse.DialogService(serviceRegistry);
	new eclipse.UserService(serviceRegistry);
	new eclipse.SshService(serviceRegistry);
	var preferenceService = new eclipse.PreferencesService(serviceRegistry, "/prefs/user");
	var commandService = new eclipse.CommandService({serviceRegistry: serviceRegistry, selection: selection});

	
	// Favorites
	new eclipse.FavoritesService({serviceRegistry: serviceRegistry});
	
	// Git operations
	new eclipse.GitService(serviceRegistry);
	
	// this is temporary
//	var unittestPlugin = pluginRegistry.getPlugin("/plugins/unittestPlugin.html");
//	if (unittestPlugin === null) {
//		pluginRegistry.installPlugin("/plugins/unittestPlugin.html");
//	}
//	
//	var gitPlugin = pluginRegistry.getPlugin("/plugins/gitPlugin.html");
//	if (gitPlugin === null) {
//		pluginRegistry.installPlugin("/plugins/gitPlugin.html");
//	}

	
	var treeRoot = {
		children:[]
	};
	var searcher = new eclipse.Searcher({serviceRegistry: serviceRegistry});
	
	var fileClient = new eclipse.FileClient(serviceRegistry, pluginRegistry);
	
	var explorer = new eclipse.FileExplorer(serviceRegistry, treeRoot, selection, searcher, fileClient, "explorer-tree", "pageTitle", "pageActions", "selectionTools");
	
	var favorites = new eclipse.Favorites({parent: "favoriteProgress", serviceRegistry: serviceRegistry});
	
	// set up the splitter bar and its key binding
	var topContainer = dijit.byId("eclipse.navigate-table");
			
	// Ctrl+o handler for toggling outline 
	window.document.onkeydown = function (evt){
		evt = evt || window.event;
		if(evt.ctrlKey && evt.keyCode  === 79){
			topContainer.toggle();
			if(window.document.all){ 
				evt.keyCode = 0;
			}else{ 
				evt.preventDefault();
				evt.stopPropagation();
			}					
		} 
	};

	// global commands
	eclipse.globalCommandUtils.generateBanner("toolbar", commandService, preferenceService, searcher, explorer);
	// commands shared by navigators
	eclipse.fileCommandUtils.createFileCommands(serviceRegistry, commandService, explorer, fileClient, "pageActions", "selectionTools");
	
	//TODO this should be removed and contributed by a plug-in
	eclipse.gitCommandUtils.createFileCommands(serviceRegistry, commandService, explorer, "pageActions", "selectionTools");
	
	// define the command contributions - where things appear, first the groups
	commandService.addCommandGroup("eclipse.fileGroup", 100, "More");
	commandService.addCommandGroup("eclipse.newResources", 100, null, "eclipse.fileGroup");
	commandService.addCommandGroup("eclipse.fileGroup.unlabeled", 100, null, null, "pageActions");
	commandService.addCommandGroup("eclipse.gitGroup", 100, null, null, "pageActions");
	commandService.addCommandGroup("eclipse.selectionGroup", 500, "More actions", null, "selectionTools");
	
	// commands appearing directly in local actions column
	commandService.registerCommandContribution("eclipse.makeFavorite", 1);
	commandService.registerCommandContribution("eclipse.renameResource", 2);
	commandService.registerCommandContribution("eclipse.downloadFile", 3);
	// commands appearing in nav tool bar
	commandService.registerCommandContribution("eclipse.openResource", 500, "pageActions");
	// commands appearing in local actions "More"
	commandService.registerCommandContribution("eclipse.copyFile", 1, null, "eclipse.fileGroup");
	commandService.registerCommandContribution("eclipse.moveFile", 2, null, "eclipse.fileGroup");
	commandService.registerCommandContribution("eclipse.deleteFile", 3, null, "eclipse.fileGroup");
	commandService.registerCommandContribution("eclipse.importCommand", 4, null, "eclipse.fileGroup");
	commandService.registerCommandContribution("eclipse.importSFTPCommand", 5, null, "eclipse.fileGroup");
	commandService.registerCommandContribution("eclipse.exportSFTPCommand", 6, null, "eclipse.fileGroup");
	// new file and new folder in the actions column uses the labeled group
	commandService.registerCommandContribution("eclipse.newFile", 1, null, "eclipse.fileGroup/eclipse.newResources");
	commandService.registerCommandContribution("eclipse.newFolder", 2, null, "eclipse.fileGroup/eclipse.newResources");
	//new file and new folder in the nav bar do not label the group (we don't want a menu)
	commandService.registerCommandContribution("eclipse.newFile", 1, "pageActions", "eclipse.fileGroup.unlabeled");
	commandService.registerCommandContribution("eclipse.newFolder", 2, "pageActions", "eclipse.fileGroup.unlabeled");
	commandService.registerCommandContribution("eclipse.newProject", 3, "pageActions", "eclipse.fileGroup.unlabeled");
	commandService.registerCommandContribution("eclipse.linkProject", 4, "pageActions", "eclipse.fileGroup.unlabeled");
	// selection based command contributions in nav toolbar
	commandService.registerCommandContribution("eclipse.copyFile", 1, "selectionTools", "eclipse.selectionGroup");
	commandService.registerCommandContribution("eclipse.moveFile", 2, "selectionTools", "eclipse.selectionGroup");
	commandService.registerCommandContribution("eclipse.deleteFile", 3, "selectionTools", "eclipse.selectionGroup");
	// git contributions
	commandService.registerCommandContribution("eclipse.cloneGitRepository", 100, "pageActions", "eclipse.gitGroup");

	eclipse.fileCommandUtils.createAndPlaceFileCommandsExtension(serviceRegistry, commandService, explorer, "pageActions", "selectionTools", "eclipse.fileGroup", "eclipse.selectionGroup");
	
	/*  For now I'm hiding the concept of switchable views. See https://bugs.eclipse.org/bugs/show_bug.cgi?id=338608
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
	*/
	explorer.loadResourceList(dojo.hash());
	
	//every time the user manually changes the hash, we need to load the workspace with that name
	dojo.subscribe("/dojo/hashchange", explorer, function() {
	   explorer.loadResourceList(dojo.hash());
	});
	
});
