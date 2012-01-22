/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 (http://www.eclipse.org/legal/epl-v10.html),
 * and the Eclipse Distribution License v1.0
 * (http://www.eclipse.org/org/documents/edl-v10.html).
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define document */

define(['dojo', 'orion/bootstrap', 'orion/status', 'orion/progress', 'orion/operationsClient', 'orion/commands', 'orion/fileClient', 'orion/searchClient', 'orion/globalCommands',
		'orion/compare/compare-features', 'orion/compare/compare-container', 'dojo/parser', 'dojo/hash', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane'],
		function(dojo, mBootstrap, mStatus, mProgress, mOperationsClient, mCommands, mFileClient, mSearchClient, mGlobalCommands, mCompareFeatures, mCompareContainer) {

		dojo.addOnLoad(function(){
			mBootstrap.startup().then(function(core) {
				var serviceRegistry = core.serviceRegistry;
				var preferences = core.preferences;
				
				document.body.style.visibility = "visible";
				dojo.parser.parse();
				// initialize service registry and EAS services

				var commandService = new mCommands.CommandService({
					serviceRegistry: serviceRegistry
				});
				// File operations
				var fileClient = new mFileClient.FileClient(serviceRegistry);
				var searcher = new mSearchClient.Searcher({
					serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient
				});
				var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
				var statusService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications");
				var progressService = new mProgress.ProgressService(serviceRegistry, operationsClient);

				mGlobalCommands.generateBanner("banner", serviceRegistry, commandService, preferences, searcher);
				var uiFactory = new mCompareFeatures.TwoWayCompareUIFactory({
					parentDivID: "compareContainer",
					showTitle: true,
					showLineStatus: true
				});
				uiFactory.buildUI();

				// Diff operations
				var readOnly = isReadOnly();
				var conflciting = isConflciting();

				var diffProvider = new mCompareContainer.DefaultDiffProvider(serviceRegistry);
				var options = {
					readonly: readOnly,
					hasConflicts: conflciting,
					diffProvider: diffProvider,
					complexURL: dojo.hash()
				};
				
				var twoWayCompareContainer = new mCompareContainer.TwoWayCompareContainer(serviceRegistry, uiFactory, options);
				twoWayCompareContainer.startup();

				// every time the user manually changes the hash, we need to load the diff.
				dojo.subscribe("/dojo/hashchange", twoWayCompareContainer, function() {
					options.compoundURL = dojo.hash();
					twoWayCompareContainer = new mCompareContainer.TwoWayCompareContainer(serviceRegistry, uiFactory, options);
					twoWayCompareContainer.startup();
				});
			});

			function isReadOnly() {
				var queryParams = dojo.queryToObject(window.location.search.slice(1));
				return queryParams["readonly"] != null;
			}

			function isConflciting() {
				var queryParams = dojo.queryToObject(window.location.search.slice(1));
				return queryParams["conflict"] != null;
			}

		});
});
