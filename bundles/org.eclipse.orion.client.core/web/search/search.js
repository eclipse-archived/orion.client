/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2012 IBM Corporation and others.
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
        'orion/commands', 'orion/favorites', 'orion/searchOutliner', 'orion/searchClient', 'orion/fileClient', 'orion/operationsClient', 'orion/searchResults', 'orion/globalCommands', 'orion/contentTypes',
        'dojo/hash', 'dojo/parser', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane'], 
		function(require, dojo, mBootstrap, mStatus, mProgress, mDialogs, mCommands, mFavorites, mSearchOutliner, 
				mSearchClient, mFileClient, mOperationsClient, mSearchResults, mGlobalCommands, mContentTypes) {

	dojo.addOnLoad(function() {
		function extractQueryString(){
			//In fire fox, dojo.hash() transforms white space as "%20", where we can use it if the hash contains "replace=xx xx"
			var qStr = window.location.hash;
			var index = qStr.indexOf("#"); //$NON-NLS-0$
			if(index >= 0){
				qStr = qStr.substring(index+1);
			}
			return qStr;
		}
		
		function parseHash(fileClient){
			var hash = dojo.hash();
			var hasLocation = (hash.indexOf("+Location:") > -1); //$NON-NLS-0$
			var searchLocation = null;
			var searchStr = hash;
			if(hasLocation){
				var splitHash = hash.split("+Location:"); //$NON-NLS-0$
				if(splitHash.length === 2){
					searchLocation = splitHash[1].split("*")[0]; //$NON-NLS-0$
					searchStr = splitHash[0];
				}
			} else {
				searchLocation = fileClient.fileServiceRootURL("");//$NON-NLS-0$
			}
			return {searchStr: searchStr, searchLocation: searchLocation};
		}
		
		function makeHref(fileClient, seg, location, searchStr, searcher){
			var searchLocation = (!location || location === "" || location === "root") ? searcher.getSearchRootLocation() : location;
			seg.href = require.toUrl("search/search.html") + "#" + searchStr + "+Location:" + searchLocation + "*"; //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		}
	
		function setPageInfo(serviceRegistry, fileClient, commandService, searcher, searchResultsGenerator, query){
			var searchLoc = parseHash(fileClient);
			if(searchLoc.searchLocation){
				if(searchLoc.searchLocation === fileClient.fileServiceRootURL(searchLoc.searchLocation)){
					searcher.setRootLocationbyURL(searchLoc.searchLocation);
					searcher.setLocationbyURL(searchLoc.searchLocation);
					mGlobalCommands.setPageTarget({task: "Search", serviceRegistry: serviceRegistry, 
						commandService: commandService, searchService: searcher, fileService: fileClient, breadcrumbRootName: fileClient.fileServiceName(searchLoc.searchLocation),
						makeBreadcrumbLink: function(seg,location){makeHref(fileClient, seg, location, searchLoc.searchStr, searcher);}});
						searcher.setChildrenLocationbyURL(searchLoc.searchLocation);
						searchResultsGenerator.loadResults(query);
				} else {
					fileClient.read(searchLoc.searchLocation, true).then(
						dojo.hitch(this, function(metadata) {
							mGlobalCommands.setPageTarget({task: "Search", target: metadata, serviceRegistry: serviceRegistry, 
								fileService: fileClient, commandService: commandService, searchService: searcher, breadcrumbRootName: "Search",
								makeBreadcrumbLink: function(seg,location){makeHref(fileClient, seg, location, searchLoc.searchStr, searcher);}});
								searchResultsGenerator.loadResults(query);
						}),
						dojo.hitch(this, function(error) {
							window.console.error("Error loading file metadata: " + error.message); //$NON-NLS-0$
						})
					);
				}
			} else {
				mGlobalCommands.setPageTarget({task: "Search", serviceRegistry: serviceRegistry, 
					commandService: commandService, searchService: searcher, fileService: fileClient, breadcrumbRootName: "Search",
					makeBreadcrumbLink: function(seg,location){makeHref(fileClient, seg, location, searchLoc.searchStr, searcher);}});
			}
		}
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			
			// we use internal border containers so we need dojo to parse.
			dojo.parser.parse();

			var dialogService = new mDialogs.DialogService(serviceRegistry);
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			new mProgress.ProgressService(serviceRegistry, operationsClient);
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
			// favorites and saved searches
			new mFavorites.FavoritesService({serviceRegistry: serviceRegistry});
			new mSearchOutliner.SavedSearches({serviceRegistry: serviceRegistry});

			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var contentTypeService = new mContentTypes.ContentTypeService(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			
			var searchOutliner = new mSearchOutliner.SearchOutliner({parent: "searchProgress", serviceRegistry: serviceRegistry}); //$NON-NLS-0$
			mGlobalCommands.generateBanner("orion-searchResults", serviceRegistry, commandService, preferences, searcher, searcher, null, null); //$NON-NLS-0$
			
			var queryString =extractQueryString();
			var toolbar = dojo.byId("pageActions"); //$NON-NLS-0$
			if (toolbar) {	
				commandService.destroy(toolbar);
				commandService.renderCommands(toolbar.id, toolbar, queryString, searcher, "button"); //$NON-NLS-0$
			}
			var searchResultsGenerator = new mSearchResults.SearchResultsGenerator(serviceRegistry, "results", commandService, fileClient, searcher, false/*crawling*/); //$NON-NLS-0$
			setPageInfo(serviceRegistry, fileClient, commandService, searcher, searchResultsGenerator, queryString);
			//searchResultsGenerator.loadResults(queryString);
			//every time the user manually changes the hash, we need to load the results with that name
			dojo.subscribe("/dojo/hashchange", searchResultsGenerator, function() { //$NON-NLS-0$
				var query = extractQueryString();
				setPageInfo(serviceRegistry, fileClient, commandService, searcher, searchResultsGenerator, query);
				//searchResultsGenerator.loadResults(query);
				var toolbar = dojo.byId("pageActions"); //$NON-NLS-0$
				if (toolbar) {	
					commandService.destroy(toolbar);
					commandService.renderCommands(toolbar.id, toolbar, query, searcher, "button"); //$NON-NLS-0$
				}
			});
		});
	});
});
