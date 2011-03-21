/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global eclipse dojo dijit window widgets*/
/*jslint devel:true*/

/*
 * Glue code for sites.html
 */
dojo.addOnLoad(function() {
	// Register services
	var serviceRegistry = new eclipse.ServiceRegistry();
	var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry);
	dojo.addOnUnload(function() {
		pluginRegistry.shutdown();
	});
	var dialogService = new eclipse.DialogService(serviceRegistry);
	var statusService = new eclipse.StatusReportingService(serviceRegistry, "statusPane");
	var commandService = new eclipse.CommandService({serviceRegistry: serviceRegistry});
	var fileClient = new eclipse.FileClient(serviceRegistry, pluginRegistry);
	var siteService = new eclipse.sites.SiteService(serviceRegistry);
	var preferenceService = new eclipse.PreferencesService(serviceRegistry, "/prefs/user");
	var searcher = new eclipse.Searcher({serviceRegistry: serviceRegistry});
	
	// File operations
//	var filePlugin = pluginRegistry.getPlugin("/plugins/fileClientPlugin.html");
//	if (filePlugin === null) {
//		pluginRegistry.installPlugin("/plugins/fileClientPlugin.html");
//	}
	
	eclipse.globalCommandUtils.generateBanner("toolbar", commandService, preferenceService, searcher);
	
	// Create the visuals
	var model;
	var treeWidget;
	(function() {
		statusService.setMessage("Loading...");
		var renderer = new eclipse.sites.SiteRenderer(commandService);
		dojo.connect(renderer, "rowsChanged", null, function() {
			statusService.setMessage("");
		});
		treeWidget = new eclipse.TableTree({
			id: "site-table-tree",
			parent: dojo.byId("site-table"),
			model: new eclipse.sites.SiteTreeModel(siteService, "site-table-tree"),
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
		
		var createCommand = new eclipse.Command({
			name : "Create Site Configuration",
			image : "/images/add_obj.gif",
			id: "eclipse.sites.create",
			groupId: "eclipse.sitesGroup",
			callback : function() {
				var dialog = new widgets.NewSiteDialog({
					title: "Create Site Configuration",
					serviceRegistry: serviceRegistry,
					func: function(name, workspace) {
						siteService.createSiteConfiguration(name, workspace).then(refresher);
					}});
				dialog.startup();
				dialog.show();
			}});
		commandService.addCommand(createCommand, "dom");
		
		// Add commands that deal with individual site configuration (edit, start, stop..)
		eclipse.sites.util.createSiteConfigurationCommands(commandService, siteService, statusService,
				dialogService, /*start*/ refresher, /*stop*/ refresher, /*delete*/ refresher, errorHandler);
		
		// Register command contributions
		commandService.registerCommandContribution("eclipse.sites.create", 1, "pageActions");
		commandService.registerCommandContribution("eclipse.site.edit", 1);
		commandService.registerCommandContribution("eclipse.site.start", 2);
		commandService.registerCommandContribution("eclipse.site.stop", 3);
		commandService.registerCommandContribution("eclipse.site.delete", 4);
		
		eclipse.globalCommandUtils.generateDomCommandsInBanner(commandService, {});
	}());
	
});