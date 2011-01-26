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
	
	var contextMenu = dijit.byId("treeContextMenu"),
		newFileFolderMenu = dijit.byId("NewFileFolderMenu");
	var makeFavoriteDomNode = dojo.byId("makeFavorite"),
		deleteFilesDomNode = dojo.byId("deleteFiles"),
		newFolderDomNode = dojo.byId("newFolder"),
		newFileDomNode = dojo.byId("newFile");
	
	var explorer = new eclipse.ExplorerTree(serviceRegistry, treeRoot,
			searcher, "explorer-tree", contextMenu, newFileFolderMenu,
			makeFavoriteDomNode, deleteFilesDomNode, newFolderDomNode, newFileDomNode);
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

	// Attach event handlers
	var searchField = dojo.byId("search");
	dojo.byId("switchView").onclick = function(evt) {
		preferenceService.put("window/orientation", "navigate-table.html");
		window.location.replace("/navigate-table.html#" + dojo.hash());
	};
	dojo.byId("newProjectButton").onclick = function(evt) {
		var dialog = new widgets.NewItemDialog({
			title: "New Project",
			label: "Project name:",
			func:  function(name){ explorer.createProject(name); }
		});
		dialog.startup();
		dialog.show();
	};
	dojo.byId("linkProjectButton").onclick = function(evt) {
		var dialog = new widgets.NewItemDialog({
			title: "Link Project",
			label: "Project name:",
			func:  function(name, url, create){ explorer.createProject(name,url,create); },
			advanced: true
		});
		dialog.startup();
		dialog.show();
	};
	dojo.byId("searchTextButton").onclick = function(evt) {
		if (searchField.value.length > 0) {
			var query = explorer.treeRoot.SearchLocation + searchField.value;
			explorer.loadResourceList(query);
		}
	};
	dojo.byId("searchNamesButton").onclick = function(evt) {
		if (searchField.value.length > 0) {
			var query = explorer.treeRoot.SearchLocation + "Name:" + searchField.value;
			explorer.loadResourceList(query);
		}
	};
	
});