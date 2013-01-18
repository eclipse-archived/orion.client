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

define(['orion/bootstrap', 'orion/status', 'orion/progress', 'orion/operationsClient', 'orion/commands', 'orion/fileClient', 'orion/searchClient', 'orion/globalCommands',
		'orion/compare/compare-features', 'orion/compare/compare-container', 'orion/compare/compareUtils', 'orion/contentTypes', 'orion/PageUtil'],
		function(mBootstrap, mStatus, mProgress, mOperationsClient, mCommands, mFileClient, mSearchClient, mGlobalCommands, mCompareFeatures, mCompareContainer, mCompareUtils, mContentTypes, PageUtil) {
	mBootstrap.startup().then(function(core) {
		var serviceRegistry = core.serviceRegistry;
		var preferences = core.preferences;
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
		var diffProvider = new mCompareContainer.DefaultDiffProvider(serviceRegistry);
		
		var startWidget = function(){
			var compareParams = PageUtil.matchResourceParameters();
			var options = {
				readonly: compareParams.readonly === "true", //$NON-NLS-0$
				onPage: true,
				generateLink: true,
				commandSpanId: "pageNavigationActions", //$NON-NLS-0$
				hasConflicts: compareParams.conflict === "true", //$NON-NLS-0$
				diffProvider: diffProvider,
				resource: compareParams.resource,
				compareTo: compareParams.compareTo,
				blockNumber: compareParams.block,
				changeNumber: compareParams.change
			};
			var twoWayCompareContainer = new mCompareContainer.TwoWayCompareContainer(serviceRegistry, "compareContainer", uiFactory, options); //$NON-NLS-0$
			twoWayCompareContainer.startup();
		};
		startWidget();
		// every time the user manually changes the hash, we need to reastart the compare widget.
		window.addEventListener("hashchange", function() { //$NON-NLS-0$
			startWidget();
		}, false);		
	});
});
