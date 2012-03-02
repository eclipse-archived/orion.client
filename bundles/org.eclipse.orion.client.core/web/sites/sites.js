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
	        'orion/searchClient', 'orion/dialogs', 'orion/globalCommands', 'orion/siteService', 'orion/siteUtils', 'orion/siteTree', 'orion/treetable', 
	        'dojo/parser', 'dojo/hash', 'dojo/date/locale', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/NewSiteDialog'], 
			function(require, dojo, mBootstrap, mStatus, mProgress, mCommands, mFileClient, mOperationsClient, mSearchClient, mDialogs, mGlobalCommands, mSiteService, mSiteUtils, mSiteTree, mTreeTable) {

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
			var model;
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
				var refresher = function() {
					siteService.getSiteConfigurations().then(function(siteConfigs) {
						statusService.setMessage("");
						treeWidget.refreshAndExpand("site-table-tree", siteConfigs);
					});
				};
				var errorHandler = dojo.hitch(statusService, statusService.setProgressResult);
				
				var createCommand = new mCommands.Command({
					name : "Create Site",
					tooltip: "Create a new site configuration",
					image : require.toUrl("images/add.gif"),
					id: "eclipse.sites.create",
					groupId: "eclipse.sitesGroup",
					callback : function() {
						var dialog = new orion.widgets.NewSiteDialog({
							title: "Create Site Configuration",
							serviceRegistry: serviceRegistry,
							func: function(name, workspace) {
								siteService.createSiteConfiguration(name, workspace).then(function(site) {
									window.location = mSiteUtils.generateEditSiteHref(site);
								}, errorHandler);
							}});
						dialog.startup();
						dialog.show();
					}});
				commandService.addCommand(createCommand);
				
				// Add commands that deal with individual site configuration (edit, start, stop..)
				mSiteUtils.createSiteCommands(commandService, siteService, progressService, dialogService,
						/*start*/ refresher, /*stop*/ refresher, /*delete*/ refresher, errorHandler);
				
				// Register command contributions
				commandService.registerCommandContribution("pageActions", "eclipse.sites.create", 1);
				commandService.registerCommandContribution("siteCommand", "eclipse.site.edit", 1);
				commandService.registerCommandContribution("siteCommand", "eclipse.site.start", 2);
				commandService.registerCommandContribution("siteCommand", "eclipse.site.stop", 3);
				commandService.registerCommandContribution("siteCommand", "eclipse.site.delete", 4);
				
				mGlobalCommands.generateDomCommandsInBanner(commandService, {});
			}());
		});
	});
});