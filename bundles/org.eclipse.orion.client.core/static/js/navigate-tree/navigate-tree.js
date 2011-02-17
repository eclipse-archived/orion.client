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
	var favorites = new eclipse.Favorites({parent: "favoriteProgress", serviceRegistry: serviceRegistry});
	
	var contextMenu = dijit.byId("treeContextMenu");
	
	var explorer = new eclipse.ExplorerTree(serviceRegistry, treeRoot,
			searcher, "explorer-tree", "navToolBar", contextMenu);
			
	// declare commands
	eclipse.fileCommandUtils.createFileCommands(serviceRegistry, commandService, explorer, "navToolBar");
	
	var tableViewCommand = new eclipse.Command({
		name : "Table View",
		image : "images/flatLayout.gif",
		id: "eclipse.tableViewCommand",
		groupId: "eclipse.viewGroup",
		callback : function() {
			serviceRegistry.getService("IPreferencesService").then(function(service) {
				service.put("window/orientation", "navigate-table.html");
			});
			window.location.replace("/navigate-table.html#" + dojo.hash());
		}});
	commandService.addCommand(tableViewCommand, "dom", "navToolBar");
	commandService.addCommandGroup("eclipse.viewGroup", 700);
	explorer.loadResourceList(dojo.hash());
	

	//every time the user manually changes the hash, we need to load the workspace with that name
	dojo.subscribe("/dojo/hashchange", explorer, function() {
		explorer.loadResourceList(dojo.hash());
	});
	
	eclipse.fileCommandUtils.hookUpSearch("search", explorer);

	
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