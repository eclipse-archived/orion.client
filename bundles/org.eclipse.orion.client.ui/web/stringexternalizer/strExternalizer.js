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
/*global window define document*/
/*browser:true*/

define(['require', 'orion/bootstrap', 'orion/status', 'orion/progress', 'orion/dialogs',
	'orion/commands', 'orion/favorites', 'stringexternalizer/stringexternalizerconfig', 'orion/searchClient',
	'orion/fileClient', 'orion/operationsClient', 'stringexternalizer/strExternalizerResults', 'orion/globalCommands',
	'orion/contentTypes'],

function(require, mBootstrap, mStatus, mProgress, mDialogs, mCommands, mFavorites, mStringExternalizerConfig,
mSearchClient, mFileClient, mOperationsClient, mSearchResults, mGlobalCommands, mContentTypes) {


	function locationHash() {
		var hash = window.location.hash;
		return hash ? hash.substring(1) : "";
	}

	function setPageInfo(fileClient, searcher, serviceRegistry, commandService, configOutliner, progress) {
		progress.progress(fileClient.read(locationHash(), true), "Getting file metadata " + locationHash()).then( function(metadata) {
			mGlobalCommands.setPageTarget({
				task: "Externalize Strings",
				target: metadata,
				makeBreadcrumbLink: function(seg, location) {
					seg.href = require.toUrl("stringexternalizer/strExternalizer.html") + "#" + location;
				}, //$NON-NLS-0$
				serviceRegistry: serviceRegistry,
				fileService: fileClient,
				searchService: searcher,
				commandService: commandService
			});
			configOutliner.render(metadata);
		}.bind(this), function(error) {
			window.console.error("Error loading file metadata: " + error.message); //$NON-NLS-0$
		});
	}

	mBootstrap.startup().then(function(core) {
		var serviceRegistry = core.serviceRegistry;
		var preferences = core.preferences;

		new mDialogs.DialogService(serviceRegistry); //yes we're bad
		var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
		new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var progress = new mProgress.ProgressService(serviceRegistry, operationsClient);
		var commandService = new mCommands.CommandService({
			serviceRegistry: serviceRegistry
		});
		// Favorites
		new mFavorites.FavoritesService({
			serviceRegistry: serviceRegistry
		});

		var fileClient = new mFileClient.FileClient(serviceRegistry);
		new mContentTypes.ContentTypeService(serviceRegistry); //yes we're bad
		var searcher = new mSearchClient.Searcher({
			serviceRegistry: serviceRegistry,
			commandService: commandService,
			fileService: fileClient
		});

		mGlobalCommands.generateBanner("orion-externalizeResults", serviceRegistry, commandService, preferences, searcher, searcher); //$NON-NLS-0$

		var searchResultsGenerator = new mSearchResults.SearchResultsGenerator(serviceRegistry, "results", commandService, fileClient); //$NON-NLS-0$
		var configOutliner = new mStringExternalizerConfig.StringExternalizerConfig({
			parent: document.getElementById("favoriteProgress"),
			serviceRegistry: serviceRegistry,
			fileClient: fileClient,
			commandService: commandService,
			setConfig: searchResultsGenerator.setConfig.bind(searchResultsGenerator)
		}); //$NON-NLS-0$
		setPageInfo(fileClient, searcher, serviceRegistry, commandService, configOutliner, progress);
		searchResultsGenerator.loadResults(locationHash());
		//every time the user manually changes the hash, we need to load the results with that name
		window.addEventListener("hashchange", function() { //$NON-NLS-0$
			setPageInfo(fileClient, searcher, serviceRegistry, commandService, configOutliner, progress);
			searchResultsGenerator.loadResults(locationHash());
		}, false);
	});
});