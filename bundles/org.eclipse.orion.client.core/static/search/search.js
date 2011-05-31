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

define(['dojo', 'orion/serviceregistry', 'orion/preferences', 'orion/pluginregistry', 'orion/status','orion/dialogs',
        'orion/users', 'orion/commands', 'orion/favorites', 'orion/searchClient', 'orion/searchResults', 'orion/globalCommands',
        'dojo/parser', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/eWebBorderContainer'], 
		function(dojo, mServiceregistry, mPreferences, mPluginRegistry, mStatus, mDialogs, mUsers, mCommands, mFavorites, 
				mSearchClient, mSearchResults, mGlobalCommands) {

dojo.addOnLoad(function(){
	dojo.parser.parse();
	
	// initialize service registry and EAS services
	serviceRegistry = new mServiceregistry.ServiceRegistry();
	new mStatus.StatusReportingService(serviceRegistry, "statusPane", "notifications");
	new mDialogs.DialogService(serviceRegistry);
	new mUsers.UserService(serviceRegistry);
	var preferenceService = new mPreferences.PreferencesService(serviceRegistry, "/prefs/user");
	var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});

	// Favorites
	new mFavorites.FavoritesService({serviceRegistry: serviceRegistry});
	
	var treeRoot = {
		children:[]
	};
	var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry});
	var searchResultsGenerator = new mSearchResults.SearchResultsGenerator(serviceRegistry, searcher, "results", commandService, "pageActions");
	var favorites = new mFavorites.Favorites({parent: "favoriteProgress", serviceRegistry: serviceRegistry});
	mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, preferenceService, searcher, searcher);
	searchResultsGenerator.loadResults(dojo.hash());
	mGlobalCommands.generateDomCommandsInBanner(commandService, searcher, "pageActions");

	//every time the user manually changes the hash, we need to load the workspace with that name
	dojo.subscribe("/dojo/hashchange", searchResultsGenerator, function() {
	   searchResultsGenerator.loadResults(dojo.hash());
	});
});
});