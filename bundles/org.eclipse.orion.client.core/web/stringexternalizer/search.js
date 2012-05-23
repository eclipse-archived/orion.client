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
        'orion/commands', 'orion/favorites', 'stringexternalizer/stringexternalizerconfig', 'orion/searchClient', 'orion/fileClient', 'orion/operationsClient', 'stringexternalizer/searchResults', 'orion/breadcrumbs', 'orion/globalCommands', 'orion/contentTypes',
        'dojo/parser', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/eWebBorderContainer'], 
		function(require, dojo, mBootstrap, mStatus, mProgress, mDialogs, mCommands, mFavorites, mStringExternalizerConfig, 
				mSearchClient, mFileClient, mOperationsClient, mSearchResults, mBreadcrumbs, mGlobalCommands, mContentTypes) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			window.document.body.style.visibility = "visible"; //$NON-NLS-0$
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
			
//			var navOutliner = new mNavOutliner.NavigationOutliner({parent: "favoriteProgress", toolbar: "outlinerToolbar", serviceRegistry: serviceRegistry});
			
			mGlobalCommands.generateBanner("banner", serviceRegistry, commandService, preferences, searcher, searcher); //$NON-NLS-0$
			
			var searchResultsGenerator = new mSearchResults.SearchResultsGenerator(serviceRegistry, "results", commandService, fileClient); //$NON-NLS-0$
			var configOutliner = new mStringExternalizerConfig.StringExternalizerConfig({parent: "favoriteProgress", serviceRegistry: serviceRegistry, fileClient: fileClient, commandService: commandService, setConfig: dojo.hitch(searchResultsGenerator, searchResultsGenerator.setConfig)}); //$NON-NLS-0$

			mGlobalCommands.generateDomCommandsInBanner(commandService, searchResultsGenerator);     

			initTitleBreadCrumb(fileClient, searcher, serviceRegistry, commandService, configOutliner);
			searchResultsGenerator.loadResults(dojo.hash());
			//every time the user manually changes the hash, we need to load the results with that name
			dojo.subscribe("/dojo/hashchange", searchResultsGenerator, function() { //$NON-NLS-0$
				initTitleBreadCrumb(fileClient, searcher, serviceRegistry, commandService, configOutliner);
				searchResultsGenerator.loadResults(dojo.hash());
				mGlobalCommands.generateDomCommandsInBanner(commandService, searchResultsGenerator);     
			});
		});
	});

	function extractQueryString(){
		//In fire fox, dojo.hash() transforms white space as "%20", where we can use it if the hash contains "replace=xx xx"
		var qStr = window.location.hash;
		var index = qStr.indexOf("#"); //$NON-NLS-0$
		if(index >= 0){
			qStr = qStr.substring(index+1);
		}
		return qStr;
	}

	function initTitleBreadCrumb(fileClient, searcher, serviceRegistry, commandService, configOutliner){
		
		fileClient.read(dojo.hash(), true).then(
				dojo.hitch(this, function(metadata) {
					if (serviceRegistry && commandService) {
						mGlobalCommands.setPageTarget(metadata, serviceRegistry, commandService);
					}
					var breadCrumbDomNode = dojo.byId("location"); //$NON-NLS-0$
					if (breadCrumbDomNode) {
						//If current location is not the root, set the search location in the searcher
						searcher.setLocationByMetaData(metadata);
						dojo.empty(breadCrumbDomNode);
						var breadcrumb = new mBreadcrumbs.BreadCrumbs({
							container: breadCrumbDomNode,
							resource: metadata ,
							firstSegmentName: fileClient.fileServiceName(metadata.Location),
							makeHref:function(seg,location){seg.href = require.toUrl("stringexternalizer/search.html") + "#" + location;} //$NON-NLS-1$ //$NON-NLS-0$
						});
					}
					configOutliner.render(metadata);
				}),
				dojo.hitch(this, function(error) {
					window.console.error("Error loading file metadata: " + error.message); //$NON-NLS-0$
				})
		);
	}
});
