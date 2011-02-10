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
	
	// declare commands
	eclipse.fileCommandUtils.createFileCommands(serviceRegistry, commandService, explorer, "navToolBar");
	
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
	commandService.addCommand(treeViewCommand, "dom", "navToolBar");
	
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
});