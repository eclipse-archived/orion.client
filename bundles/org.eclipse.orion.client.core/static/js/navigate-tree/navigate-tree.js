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
/*global dojo dijit window eclipse serviceRegistry:true widgets*/
dojo.addOnLoad(function(){
	
	// initialize service registry and EAS services
	serviceRegistry = new eclipse.ServiceRegistry();
	var inputService = new eclipse.InputService(serviceRegistry);		
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
	var searcher = new eclipse.Searcher({serviceRegistry: serviceRegistry});
	
	var contextMenu = dijit.byId("treeContextMenu");
	
	var explorer = new eclipse.ExplorerTree(serviceRegistry, treeRoot,
			searcher, "explorer-tree", "navToolBar", contextMenu);
			
	var favorites = new eclipse.Favorites({parent: "favoriteProgress", serviceRegistry: serviceRegistry});
	
	// global commands
	eclipse.globalCommandUtils.generateBanner("toolbar", commandService, preferenceService, searcher, explorer);
			
	// commands shared among navigators
	eclipse.fileCommandUtils.createFileCommands(serviceRegistry, commandService, explorer, "navToolBar");

	// define the command contributions - where things appear
	commandService.addCommandGroup("eclipse.fileGroup", 100);
	commandService.addCommandGroup("eclipse.newResources", 100, "New", "eclipse.fileGroup");
	commandService.registerCommandContribution("eclipse.makeFavorite", 1);
	commandService.registerCommandContribution("eclipse.downloadFile", 2);
	commandService.registerCommandContribution("eclipse.openResource", 500, "navToolBar");
	commandService.registerCommandContribution("eclipse.deleteFile", 2, null, "eclipse.fileGroup");
	commandService.registerCommandContribution("eclipse.importCommand", 3, null, "eclipse.fileGroup");
	commandService.registerCommandContribution("eclipse.newFile", 1, null, "eclipse.fileGroup/eclipse.newResources");
	commandService.registerCommandContribution("eclipse.newFolder", 2, null, "eclipse.fileGroup/eclipse.newResources");
	commandService.registerCommandContribution("eclipse.newProject", 1, "navToolBar", "eclipse.fileGroup");
	commandService.registerCommandContribution("eclipse.linkProject", 2, "navToolBar", "eclipse.fileGroup");

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
	
	// it's important to replace the implementation of setInput here, so that we get
	// the event at the time it happens as opposed to using a stored event. Firefox
	// would otherwise prevent opening a new tab ('window.open') - this is only
	// allowed within an event handler.
	inputService.setInput = function(uri, event) {
	    // if there is no editor present, then use page management
		// TODO: How could an editor ever be present? It's on a different page.
		// And regardless, editorContainer is not global anymore so this block always executes.
		if (true /*!window.editorContainer*/) {
	   		var target = "coding.html#" + uri;
	   		var isMac = window.navigator.platform.indexOf("Mac") !== -1;
	    	if (event) {
	    		if (isMac) {
	    		  	if (event.metaKey) {
						window.open(target);
						return;
					}
				} else if (event.ctrlKey) {
					window.open(target);
					return;
				}
	    	}
	    	window.location.href = target;
	    }
	};	
});