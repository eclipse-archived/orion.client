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
/*global window define */
/*browser:true*/

define(['dojo', 'orion/bootstrap', 'orion/status','orion/dialogs',
        'orion/commands', 'orion/favorites', 'orion/searchClient', 'orion/fileClient', 'orion/searchResults', 'orion/globalCommands',
        'dojo/parser', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/eWebBorderContainer'], 
		function(dojo, mBootstrap, mStatus, mDialogs, mCommands, mFavorites, 
				mSearchClient, mFileClient, mSearchResults, mGlobalCommands) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			window.document.body.style.visibility = "visible";
			dojo.parser.parse();

			var dialogService = new mDialogs.DialogService(serviceRegistry);
			new mStatus.StatusReportingService(serviceRegistry, "statusPane", "notifications");
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
	
			// Favorites
			new mFavorites.FavoritesService({serviceRegistry: serviceRegistry});

			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			var searchResultsGenerator = new mSearchResults.SearchResultsGenerator(serviceRegistry, searcher, "results", commandService, "pageActions");
			var favorites = new mFavorites.Favorites({parent: "favoriteProgress", serviceRegistry: serviceRegistry});
			mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, preferences, searcher, searcher);
			searchResultsGenerator.loadResults(dojo.hash());
			mGlobalCommands.generateDomCommandsInBanner(commandService, searcher, "pageActions");
		
			//every time the user manually changes the hash, we need to load the results with that name
			dojo.subscribe("/dojo/hashchange", searchResultsGenerator, function() {
			   searchResultsGenerator.loadResults(dojo.hash());
				mGlobalCommands.generateDomCommandsInBanner(commandService, searcher, "pageActions");   
			});
		});
	});
});