/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 (http://www.eclipse.org/legal/epl-v10.html),
 * and the Eclipse Distribution License v1.0
 * (http://www.eclipse.org/org/documents/edl-v10.html).
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define document */

define(['dojo', 'orion/bootstrap', 'orion/status', 'orion/progress', 'orion/operationsClient', 'orion/commands', 'orion/fileClient', 'orion/searchClient', 'orion/globalCommands',
		'orion/compare/compare-features', 'orion/compare/compare-container', 'orion/compare/compareUtils', 'orion/contentTypes', 'dojo/parser', 'dojo/hash', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane'],
		function(dojo, mBootstrap, mStatus, mProgress, mOperationsClient, mCommands, mFileClient, mSearchClient, mGlobalCommands, mCompareFeatures, mCompareContainer, mCompareUtils, mContentTypes) {

		dojo.addOnLoad(function(){
			mBootstrap.startup().then(function(core) {
				var serviceRegistry = core.serviceRegistry;
				var preferences = core.preferences;
				// we use internal border containers so we need dojo to parse.
				dojo.parser.parse();
				var commandService = new mCommands.CommandService({
					serviceRegistry: serviceRegistry
				});
				// File operations
				var fileClient = new mFileClient.FileClient(serviceRegistry);
				var contentTypeService = new mContentTypes.ContentTypeService(serviceRegistry);
				var searcher = new mSearchClient.Searcher({
					serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient
				});
				var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
				var statusService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				var progressService = new mProgress.ProgressService(serviceRegistry, operationsClient);

				mGlobalCommands.generateBanner("orion-compare", serviceRegistry, commandService, preferences, searcher); //$NON-NLS-0$
				var uiFactory = new mCompareFeatures.TwoWayCompareUIFactory({
					parentDivID: "compareContainer", //$NON-NLS-0$
					showTitle: true,
					showLineStatus: true
				});
				uiFactory.buildUI();

				// Diff operations
				var readOnly = isReadOnly();
				var conflciting = isConflciting();

				var diffParams = mCompareUtils.parseCompareHash(dojo.hash());
				var diffProvider = new mCompareContainer.DefaultDiffProvider(serviceRegistry);
				var options = {
					readonly: readOnly,
					onPage: true,
					generateLink: true,
					commandSpanId: "pageNavigationActions", //$NON-NLS-0$
					hasConflicts: conflciting,
					diffProvider: diffProvider,
					complexURL: diffParams.complexURL,
					blockNumber: diffParams.block,
					changeNumber: diffParams.change
				};
				
				var twoWayCompareContainer = new mCompareContainer.TwoWayCompareContainer(serviceRegistry, "compareContainer", uiFactory, options); //$NON-NLS-0$
				twoWayCompareContainer.startup();

				// every time the user manually changes the hash, we need to load the diff.
				dojo.subscribe("/dojo/hashchange", twoWayCompareContainer, function() { //$NON-NLS-0$
					diffParams = mCompareUtils.parseCompareHash(dojo.hash());
					options.complexURL = diffParams.complexURL;
					options.block = diffParams.block;
					options.change = diffParams.change;
					twoWayCompareContainer = new mCompareContainer.TwoWayCompareContainer(serviceRegistry, "compareContainer", uiFactory, options); //$NON-NLS-0$
					twoWayCompareContainer.startup();
				});
			});

			function isReadOnly() {
				var queryParams = dojo.queryToObject(window.location.search.slice(1));
				return queryParams["readonly"] != null; //$NON-NLS-0$
			}

			function isConflciting() {
				var queryParams = dojo.queryToObject(window.location.search.slice(1));
				return queryParams["conflict"] != null; //$NON-NLS-0$
			}

		});
});
