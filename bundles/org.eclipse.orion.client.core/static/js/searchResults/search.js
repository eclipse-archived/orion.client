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
/*global dojo dijit window eclipse serviceRegistry:true widgets alert*/
/*browser:true*/
dojo.addOnLoad(function(){
	
	// initialize service registry and EAS services
	serviceRegistry = new eclipse.ServiceRegistry();
	new eclipse.StatusReportingService(serviceRegistry, "statusPane", "pageActionsLeft");
	new eclipse.LogService(serviceRegistry);
	new eclipse.DialogService(serviceRegistry);
	new eclipse.UserService(serviceRegistry);
	var preferenceService = new eclipse.PreferencesService(serviceRegistry, "/prefs/user");
	var commandService = new eclipse.CommandService({serviceRegistry: serviceRegistry});

	// Favorites
	new eclipse.FavoritesService({serviceRegistry: serviceRegistry});
	
	var treeRoot = {
		children:[]
	};
	var searcher = new eclipse.Searcher({serviceRegistry: serviceRegistry});
	var searchResultsGenerator = new eclipse.SearchResultsGenerator(serviceRegistry, searcher, "results", commandService, "pageActions");
	var favorites = new eclipse.Favorites({parent: "favoriteProgress", serviceRegistry: serviceRegistry});
	eclipse.globalCommandUtils.generateBanner("toolbar", commandService, preferenceService, searcher, searcher);
	searchResultsGenerator.loadResults(dojo.hash());
	eclipse.globalCommandUtils.generateDomCommandsInBanner(commandService, searcher, "pageActions");

	//every time the user manually changes the hash, we need to load the workspace with that name
	dojo.subscribe("/dojo/hashchange", searchResultsGenerator, function() {
	   searchResultsGenerator.loadResults(dojo.hash());
	});
});