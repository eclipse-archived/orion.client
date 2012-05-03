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
		'orion/sites/sitesExplorer', 'orion/PageUtil',
		'dojo/parser', 'dojo/hash', 'dojo/date/locale', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane'], 
		function(require, dojo, mBootstrap, mStatus, mProgress, mCommands, mFileClient, mOperationsClient, mSearchClient, mGlobalCommands,
			mSiteUtils, mSiteCommands, mSitesExplorer, PageUtil) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			document.body.style.visibility = 'visible';
			dojo.parser.parse();

			// Register services
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var statusService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, 'statusPane', 'notifications', 'notificationArea');
			var progressService = new mProgress.ProgressService(serviceRegistry, operationsClient);
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});

			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});

			var treeWidget;
			function createTree(file) {
				var parentId = 'table';
				if (treeWidget) {
					dojo.empty(parentId);
				}
				treeWidget = new mSitesExplorer.ViewOnSiteTree({
					id: 'view-on-site-table',
					parent: parentId,
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
			dojo.subscribe("/dojo/hashchange", null, function() {
				processParameters();
			});

			processParameters();
			mGlobalCommands.generateBanner('banner', serviceRegistry, commandService, preferences, searcher);
		});
	});
});