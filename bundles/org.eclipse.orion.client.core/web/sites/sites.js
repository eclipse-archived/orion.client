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
define(['require', 'dojo', 'orion/bootstrap', 'orion/status', 'orion/progress', 'orion/commands', 'orion/fileClient', 'orion/operationsClient',
		'orion/searchClient', 'orion/dialogs', 'orion/globalCommands', 'orion/siteService', 'orion/siteUtils', 'orion/siteCommands', 'orion/sitesTree',
		'orion/PageUtil', 'dojo/parser', 'dojo/hash', 'dojo/date/locale', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane'], 
		function(require, dojo, mBootstrap, mStatus, mProgress, mCommands, mFileClient, mOperationsClient, mSearchClient, mDialogs, mGlobalCommands, mSiteService,
			mSiteUtils, mSiteCommands, mSitesTree, PageUtil) {

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
			
			var treeWidget;
			function generateBanner(file) {
				document.title = file ? "View On Site" : "Site Configurations";
				mGlobalCommands.generateBanner("banner", serviceRegistry, commandService, preferences, searcher);
			}
			function createTree(file) {
				var tableId = "site-table-tree";
				var parent = dojo.byId("site-table");
				if (treeWidget) {
					dojo.empty(parent);
				}
				var options = {
					id: tableId,
					parent: parent,
					serviceRegistry: serviceRegistry
				};
				if (file) {
					options.file = file;
				}
				treeWidget = file ? new mSitesTree.ViewOnSiteTree(options) : new mSitesTree.SitesTree(options);
			}
			function createCommands(file) {
				var refresh = function() {
					treeWidget.refresh();
				};
				var errorHandler = dojo.hitch(statusService, statusService.setProgressResult);
				var goToUrl = function(url) {
					window.location = url;
				};
				mSiteCommands.createSiteCommands(serviceRegistry, {
					siteService: siteService,
					createCallback: goToUrl,
					startCallback: refresh,
					stopCallback: refresh,
					deleteCallback: refresh,
					addAndStartCallback: goToUrl,
					fileLocation: file
				});
			}
			function registerCommands(file) {
				if (!file) {
					commandService.registerCommandContribution("pageActions", "orion.site.create", 1, null, false, null, new mCommands.URLBinding("createSite", "name"));
				}
				commandService.registerCommandContribution("siteCommand", "orion.site.edit", 1);
				commandService.registerCommandContribution("siteCommand", "orion.site.start", 2);
				commandService.registerCommandContribution("siteCommand", "orion.site.stop", 3);
				commandService.registerCommandContribution("siteCommand", "orion.site.delete", 4);

				commandService.registerCommandContribution("viewOnSiteCommand", "orion.site.add-to", 5);
				commandService.registerCommandContribution("viewOnSiteCommand", "orion.site.view-on-link", 6);
				mGlobalCommands.generateDomCommandsInBanner(commandService, {});
			}

			dojo.subscribe("/dojo/hashchange", null, function() {
				var file = PageUtil.matchResourceParameters().viewOnSite;
				generateBanner(file);
				createTree(file);
			});
			var params = PageUtil.matchResourceParameters();
			generateBanner(params.viewOnSite);
			createTree(params.viewOnSite);
			createCommands(params.viewOnSite);
			registerCommands(params.viewOnSite);
		});
	});
});