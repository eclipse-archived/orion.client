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
/*global define document dojo dijit orion window widgets*/
/*jslint */
define(['require', 'dojo', 'orion/bootstrap', 'orion/status', 'orion/progress', 'orion/commands', 'orion/fileClient', 'orion/operationsClient',
		'orion/searchClient', 'orion/globalCommands', 'orion/sites/siteUtils', 'orion/sites/siteCommands', 
		'orion/sites/viewOnSiteTree', 'orion/PageUtil','dojo/hash', 'dojo/date/locale'], 
		function(require, dojo, mBootstrap, mStatus, mProgress, mCommands, mFileClient, mOperationsClient, mSearchClient, mGlobalCommands,
			mSiteUtils, mSiteCommands, ViewOnSiteTree, PageUtil) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;

			// Register services
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var statusService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, 'statusPane', 'notifications', 'notificationArea'); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var progressService = new mProgress.ProgressService(serviceRegistry, operationsClient);
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});

			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});

			var treeWidget;
			function createTree(file) {
				var parentId = 'table'; //$NON-NLS-0$
				var labelId = 'viewOnSiteCaption'; //$NON-NLS-0$
				if (treeWidget) {
					dojo.empty(parentId);
				}
				treeWidget = new ViewOnSiteTree({
					id: 'view-on-site-table', //$NON-NLS-0$
					parent: parentId,
					label: labelId,
					serviceRegistry: serviceRegistry,
					fileLocation: file
				});
			}
			function processParameters() {
				var params = PageUtil.matchResourceParameters();
				var file = params.file;
				if (file) {
					createTree(file);
					mSiteCommands.createViewOnSiteCommands(serviceRegistry);
				}
			}
			dojo.subscribe("/dojo/hashchange", null, function() { //$NON-NLS-0$
				processParameters();
			});

			processParameters();
			mGlobalCommands.generateBanner('orion-viewSites', serviceRegistry, commandService, preferences, searcher); //$NON-NLS-0$
		});
	});
});