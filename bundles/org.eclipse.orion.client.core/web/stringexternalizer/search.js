/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
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
        'orion/commands', 'orion/favorites', 'stringexternalizer/stringexternalizerconfig', 'orion/searchClient', 
        'orion/fileClient', 'orion/operationsClient', 'stringexternalizer/searchResults', 'orion/globalCommands', 
        'orion/contentTypes', 'dojo/hash', 'dojo/parser', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane'], 
		function(require, dojo, mBootstrap, mStatus, mProgress, mDialogs, mCommands, mFavorites, mStringExternalizerConfig, 
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
	
		function setPageInfo(fileClient, searcher, serviceRegistry, commandService, configOutliner){		
			fileClient.read(dojo.hash(), true).then(
					dojo.hitch(this, function(metadata) {
						mGlobalCommands.setPageTarget({task: "Externalize Strings", target: metadata, 
							makeBreadcrumbLink: function(seg,location){seg.href = require.toUrl("stringexternalizer/search.html") + "#" + location;}, //$NON-NLS-0$
							serviceRegistry: serviceRegistry, fileService: fileClient, searchService: searcher,
							commandService: commandService});
						configOutliner.render(metadata);
					}),
					dojo.hitch(this, function(error) {
						window.console.error("Error loading file metadata: " + error.message); //$NON-NLS-0$
					})
			);
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
			// Favorites
			new mFavorites.FavoritesService({serviceRegistry: serviceRegistry});

			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var contentTypeService = new mContentTypes.ContentTypeService(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			
			mGlobalCommands.generateBanner("orion-externalizeResults", serviceRegistry, commandService, preferences, searcher, searcher); //$NON-NLS-0$
			
			var searchResultsGenerator = new mSearchResults.SearchResultsGenerator(serviceRegistry, "results", commandService, fileClient); //$NON-NLS-0$
			var configOutliner = new mStringExternalizerConfig.StringExternalizerConfig({parent: "favoriteProgress", serviceRegistry: serviceRegistry, fileClient: fileClient, commandService: commandService, setConfig: dojo.hitch(searchResultsGenerator, searchResultsGenerator.setConfig)}); //$NON-NLS-0$
			function updateToolbar() {
				var toolbar = dojo.byId("pageActions"); //$NON-NLS-0$
				if (toolbar) {	
					commandService.destroy(toolbar);
					commandService.renderCommands(toolbar.id, toolbar, searchResultsGenerator, searchResultsGenerator, "button"); //$NON-NLS-0$
				}
				toolbar = dojo.byId("pageNavigationActions"); //$NON-NLS-0$
				if (toolbar) {	
					commandService.destroy(toolbar);
					commandService.renderCommands(toolbar.id, toolbar, searchResultsGenerator, searchResultsGenerator, "button");  // use true when we want to force toolbar items to text //$NON-NLS-0$
				}
			}
			updateToolbar();
			setPageInfo(fileClient, searcher, serviceRegistry, commandService, configOutliner);
			searchResultsGenerator.loadResults(dojo.hash());
			//every time the user manually changes the hash, we need to load the results with that name
			dojo.subscribe("/dojo/hashchange", searchResultsGenerator, function() { //$NON-NLS-0$
				setPageInfo(fileClient, searcher, serviceRegistry, commandService, configOutliner);
				searchResultsGenerator.loadResults(dojo.hash());
				updateToolbar();   
			});
		});
	});
});
