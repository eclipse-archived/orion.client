/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define dojo dijit orion window widgets*/
/*jslint browser:true*/

/*
 * Glue code for sites.html
 */

define(['require', 'dojo', 'orion/bootstrap', 'orion/status', 'orion/progress', 'orion/commands', 'orion/fileClient', 'orion/operationsClient',
	        'orion/searchClient', 'orion/dialogs', 'orion/globalCommands', 'orion/siteService', 'orion/siteUtils', 'orion/siteCommands', 'orion/siteTree', 'orion/treetable', 
	        'dojo/parser', 'dojo/hash', 'dojo/date/locale', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane'], 
			function(require, dojo, mBootstrap, mStatus, mProgress, mCommands, mFileClient, mOperationsClient, mSearchClient, mDialogs, mGlobalCommands, mSiteService, mSiteUtils, mSiteCommands, mSiteTree, mTreeTable) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			document.body.style.visibility = "visible";
			dojo.parser.parse();
		
			// Register services
			var dialogService = new mDialogs.DialogService(serviceRegistry);
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var statusService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea");
			var progressService = new mProgress.ProgressService(serviceRegistry, operationsClient);
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
	
			var siteService = new mSiteService.SiteService(serviceRegistry);
			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			
			mGlobalCommands.generateBanner("banner", serviceRegistry, commandService, preferences, searcher);
			
			// Create the visuals
			var treeWidget;
			(function() {
				statusService.setMessage("Loading...");
				var renderer = new mSiteTree.SiteRenderer(commandService);
				dojo.connect(renderer, "rowsChanged", null, function() {
					statusService.setMessage("");
				});
				treeWidget = new mTreeTable.TableTree({
					id: "site-table-tree",
					parent: dojo.byId("site-table"),
					model: new mSiteTree.SiteTreeModel(siteService, "site-table-tree"),
					showRoot: false,
					renderer: renderer
				});
			}());
			
			(function() {
				// Reloads the table view after doing a command
				var refresh = function() {
					siteService.getSiteConfigurations().then(function(siteConfigs) {
						statusService.setMessage("");
						treeWidget.refresh("site-table-tree", siteConfigs, true);
					});
				};
				var errorHandler = dojo.hitch(statusService, statusService.setProgressResult);
				var goToUrl = function(url) {
					window.location = url;
				};
				mSiteCommands.createSiteCommands(serviceRegistry, {
					createCallback: goToUrl,
					startCallback: refresh,
					stopCallback: refresh,
					deleteCallback: refresh,
					errorCallback: errorHandler
				});

				// Register command contributions
				commandService.registerCommandContribution("pageActions", "orion.site.create", 1, null, false, null, new mCommands.URLBinding("createSite", "name"));
				commandService.registerCommandContribution("siteCommand", "orion.site.edit", 1);
				commandService.registerCommandContribution("siteCommand", "orion.site.start", 2);
				commandService.registerCommandContribution("siteCommand", "orion.site.stop", 3);
				commandService.registerCommandContribution("siteCommand", "orion.site.delete", 4);
				
				mGlobalCommands.generateDomCommandsInBanner(commandService, {});
			}());
		});
	});
});