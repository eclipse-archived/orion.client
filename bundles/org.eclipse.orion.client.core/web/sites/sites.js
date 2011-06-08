/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global eclipse dojo dijit window widgets*/
/*jslint devel:true*/

/*
 * Glue code for sites.html
 */

define(['dojo', 'orion/serviceregistry', 'orion/preferences', 'orion/pluginregistry', 'orion/status', 'orion/commands', 
	        'orion/fileClient', 'orion/searchClient', 'orion/dialogs', 'orion/globalCommands', 'siteService', 'orion/siteUtils', 'siteTree', 'orion/treetable', 
	        'dojo/parser', 'dojo/hash', 'dojo/date/locale', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/NewSiteDialog'], 
			function(dojo, mServiceregistry, mPreferences, mPluginRegistry, mStatus, mCommands, mFileClient, mSearchClient, mDialogs, mGlobalCommands, mSiteService, mSiteUtils, mSiteTree, mTreeTable) {

dojo.addOnLoad(function() {
	document.body.style.visibility = "visible";
	dojo.parser.parse();

	// Register services
	var serviceRegistry = new mServiceregistry.ServiceRegistry();
	var pluginRegistry = new mPluginRegistry.PluginRegistry(serviceRegistry);
	dojo.addOnWindowUnload(function() {
		pluginRegistry.shutdown();
	});
	var dialogService = new mDialogs.DialogService(serviceRegistry);
	var statusService = new mStatus.StatusReportingService(serviceRegistry, "statusPane", "notifications");
	var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
	serviceRegistry.getService("orion.core.file").then(function(fileService) {
		var fileClient = new mFileClient.FileClient(fileService);

		var siteService = new mSiteService.SiteService(serviceRegistry);
		var preferenceService = new mPreferences.PreferencesService(serviceRegistry, "/prefs/user");
		var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry});
		
		mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, preferenceService, searcher);
		
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
			var errorHandler = function(error) {
				statusService.setErrorMessage(error);
			};
			
			var createCommand = new mCommands.Command({
				name : "Create Site Configuration",
				image : "/images/add_obj.gif",
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
			commandService.addCommand(createCommand, "dom");
			
			// Add commands that deal with individual site configuration (edit, start, stop..)
			mSiteUtils.createSiteCommands(commandService, siteService, statusService,
					dialogService, /*start*/ refresher, /*stop*/ refresher, /*delete*/ refresher, errorHandler);
			
			// Register command contributions
			commandService.registerCommandContribution("eclipse.sites.create", 1, "pageActions");
			commandService.registerCommandContribution("eclipse.site.edit", 1);
			commandService.registerCommandContribution("eclipse.site.start", 2);
			commandService.registerCommandContribution("eclipse.site.stop", 3);
			commandService.registerCommandContribution("eclipse.site.delete", 4);
			
			mGlobalCommands.generateDomCommandsInBanner(commandService, {});
		}());
	});
});

});