/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define window*/
/*jslint browser:true*/
define(['orion/bootstrap', 'orion/status', 'orion/progress', 'orion/commands', 'orion/fileClient', 'orion/operationsClient',
		'orion/searchClient', 'orion/selection', 'orion/dialogs', 'orion/globalCommands', 'orion/sites/siteUtils', 'orion/sites/siteCommands', 
		'orion/sites/sitesExplorer'], 
	function(mBootstrap, mStatus, mProgress, mCommands, mFileClient, mOperationsClient, mSearchClient, mSelection, mDialogs, mGlobalCommands, mSiteUtils, mSiteCommands, SitesExplorer) {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			// Register services
			var dialogService = new mDialogs.DialogService(serviceRegistry);
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var statusService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var progressService = new mProgress.ProgressService(serviceRegistry, operationsClient);
			
			var selection = new mSelection.Selection(serviceRegistry);
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});

			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});

			function createCommands() {
				var errorHandler = statusService.setProgressResult.bind(statusService);
				var goToUrl = function(url) {
					window.location = url;
				};
				mSiteCommands.createSiteServiceCommands(serviceRegistry, {
					createCallback: goToUrl,
					errorHandler: errorHandler
				});
				mSiteCommands.createSiteCommands(serviceRegistry);
			}
			
			mGlobalCommands.generateBanner("orion-sites", serviceRegistry, commandService, preferences, searcher); //$NON-NLS-0$
			mGlobalCommands.setPageTarget({task: "Sites"});
			
			var explorer = new SitesExplorer(serviceRegistry, selection, "table"); //$NON-NLS-0$
			createCommands();
			explorer.display();
	});
});