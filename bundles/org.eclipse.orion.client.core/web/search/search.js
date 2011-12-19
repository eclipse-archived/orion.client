/*******************************************************************************
 * @license
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

define(['require', 'dojo', 'orion/bootstrap', 'orion/status', 'orion/progress','orion/dialogs',
        'orion/commands', 'orion/favorites', 'orion/searchClient', 'orion/fileClient', 'orion/taskClient', 'orion/searchResults', 'orion/breadcrumbs', 'orion/globalCommands',
        'dojo/parser', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/eWebBorderContainer'], 
		function(require, dojo, mBootstrap, mStatus, mProgress, mDialogs, mCommands, mFavorites, 
				mSearchClient, mFileClient, mTaskClient, mSearchResults, mBreadcrumbs, mGlobalCommands) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			window.document.body.style.visibility = "visible";
			dojo.parser.parse();

			var dialogService = new mDialogs.DialogService(serviceRegistry);
			var taskClient = new mTaskClient.TaskClient(serviceRegistry)
			new mStatus.StatusReportingService(serviceRegistry, taskClient, "statusPane", "notifications");
			new mProgress.ProgressService(serviceRegistry, taskClient);
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
			// Favorites
			new mFavorites.FavoritesService({serviceRegistry: serviceRegistry});

			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			var searchResultsGenerator = new mSearchResults.SearchResultsGenerator(serviceRegistry, searcher, "results", commandService, "pageActions");
			var favorites = new mFavorites.Favorites({parent: "favoriteProgress", serviceRegistry: serviceRegistry});
			mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, preferences, searcher, searcher);
			
			// page actions for search
			
			var saveresultsCommand = new mCommands.Command({
				name: "Save Search",
				tooltip: "Save query to search favorites",
				id: "orion.saveSearchResults",
				callback: function(data) {
					searchResultsGenerator.saveSearch(data.items);
				}
			});
		
			commandService.addCommand(saveresultsCommand, "dom");
			commandService.addCommandGroup("orion.searchActions.unlabeled", 200, null, null, "pageActions");
			commandService.registerCommandContribution("orion.saveSearchResults", 1, "pageActions", "orion.searchActions.unlabeled");
						
			var item = dojo.hash();
			searchResultsGenerator.loadResults(item);
			mGlobalCommands.generateDomCommandsInBanner(commandService, searcher, item, null, null,  /* no images */ false, /* client handle page nav area */ true);     

			initTitleBreadCrumb(fileClient, searcher);
			//every time the user manually changes the hash, we need to load the results with that name
			dojo.subscribe("/dojo/hashchange", searchResultsGenerator, function() {
				initTitleBreadCrumb(fileClient, searcher);
				var query = dojo.hash();
				searchResultsGenerator.loadResults(query);
				mGlobalCommands.generateDomCommandsInBanner(commandService, searcher, query, null, null,  /* no images */ false, /* client handle page nav area */ true);     
			});
		});
	});

	function parseHash(){
		var hash = dojo.hash();
		var hasLocation = (hash.indexOf("+Location:") > -1);
		var searchLocation = null;
		var searchStr = hash;
		if(hasLocation){
			var splitHash = hash.split("+Location:");
			if(splitHash.length === 2){
				searchLocation = splitHash[1].split("*")[0];
				searchStr = splitHash[0];
			}
		}
		return {searchStr: searchStr, searchLocation: searchLocation};
	}
	
	function makeHref(fileClient, seg, location, searchStr){
		if(!location || location === "" || location === "root"){
			seg.href = require.toUrl("search/search.html") + "#" + searchStr;
			return;
		}
		fileClient.read(location, true).then(
			dojo.hitch(this, function(metadata) {
				if(metadata.Location){
					seg.href = require.toUrl("search/search.html") + "#" + searchStr + "+Location:" + metadata.Location + "*";
				}
			}),
			dojo.hitch(this, function(error) {
				window.console.error("Error loading file metadata: " + error.message);
			})
		);
	}

	function initTitleBreadCrumb(fileClient, searcher){
		var searchLoc = parseHash();
		
		if(searchLoc.searchLocation){
			fileClient.read(searchLoc.searchLocation, true).then(
					dojo.hitch(this, function(metadata) {
						var breadCrumbDomNode = dojo.byId("location");
						if (breadCrumbDomNode) {
							//If current location is not the root, set the search location in the searcher
							searcher.setLocationByMetaData(metadata);
							dojo.empty(breadCrumbDomNode);
							var breadcrumb = new mBreadcrumbs.BreadCrumbs({
								container: breadCrumbDomNode,
								resource: metadata ,
								firstSegmentName: "root",
								makeHref:function(seg,location){makeHref(fileClient, seg, location, searchLoc.searchStr);
								}
							});
						}
					}),
					dojo.hitch(this, function(error) {
						window.console.error("Error loading file metadata: " + error.message);
					})
			);
		} else {
			var breadCrumbDomNode = dojo.byId("location");
			if (breadCrumbDomNode) {
				dojo.empty(breadCrumbDomNode);
				var breadcrumb = new mBreadcrumbs.BreadCrumbs({
					container: breadCrumbDomNode,
					resource: {} ,
					firstSegmentName: "root",
					makeHref:function(seg,location){makeHref(fileClient, seg, location, searchLoc.searchStr);
					}
				});
			}
		}
	}
});
