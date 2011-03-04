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
/*global eclipse dojo dijit window*/
/*jslint devel:true*/

/*
 * Glue code for sites.html
 */
dojo.addOnLoad(function() {
	// Register services
	var serviceRegistry = new eclipse.ServiceRegistry();
	var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry);
	var dialogService = new eclipse.DialogService(serviceRegistry);
	var statusService = new eclipse.StatusReportingService(serviceRegistry, "statusPane");
	var commandService = new eclipse.CommandService({serviceRegistry: serviceRegistry});
	var fileClient = new eclipse.FileClient(serviceRegistry, pluginRegistry);
	var siteService = new eclipse.sites.SiteService();
	serviceRegistry.registerService(eclipse.sites.SITE_SERVICE_NAME, siteService);
	
	// File operations
	var filePlugin = pluginRegistry.getPlugin("/plugins/fileClientPlugin.html");
	if (filePlugin === null) {
		pluginRegistry.installPlugin("/plugins/fileClientPlugin.html");
	}
	
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
	
	var refreshFunction = function() {
		statusService.setMessage("Loading...");
		siteService.getSiteConfigurations().then(function(siteConfigs) {
			treeWidget.refreshAndExpand("site-table-tree", siteConfigs);
			statusService.setMessage("");
		});
	};
	
	(function() {
		// Page-level commands
		var createCommand = new eclipse.Command({
			name : "Create Site Configuration",
			image : "/images/add_obj.gif",
			id: "eclipse.sites.create",
			groupId: "eclipse.sitesGroup",
			callback : function() {
				var dialog = new sites.widgets.NewSiteDialog({
					title: "Create Site Configuration",
					serviceRegistry: serviceRegistry,
					func: function(name, workspace) {
						siteService.createSiteConfiguration(name, workspace).then(refreshFunction);
					}});
				dialog.startup();
				dialog.show();
			}});
		commandService.addCommand(createCommand, "dom");
		
		// Commands for the Actions toolbar
		var editCommand = new eclipse.Command({
			name: "Edit",
			image: "images/editing_16.gif",
			id: "eclipse.sites.edit",
			visibleWhen: function(item) {
				return item.HostingStatus && item.HostingStatus.Status === "stopped";
			},
			hrefCallback: eclipse.sites.util.generateEditSiteHref});
		commandService.addCommand(editCommand, "object");
		
		var startCommand = new eclipse.Command({
			name: "Start",
			image: "images/lrun_obj.gif",
			id: "eclipse.sites.start",
			visibleWhen: function(item) {
				return item.HostingStatus && item.HostingStatus.Status === "stopped";
			},
			callback: function(item) {
				statusService.setMessage("Starting " + item.Name + "...");
				siteService.startStopSiteConfiguration(item.Id, "start").then(function() {
					siteService.getSiteConfigurations().then(function(siteConfigs) {
						treeWidget.refreshAndExpand("site-table-tree", siteConfigs);
					});
				});
			}});
		commandService.addCommand(startCommand, "object");
		
		var stopCommand = new eclipse.Command({
			name: "Stop",
			image: "images/stop.gif",
			id: "eclipse.sites.stop",
			visibleWhen: function(item) {
				return item.HostingStatus && item.HostingStatus.Status === "started";
			},
			callback: function(item) {
				statusService.setMessage("Stopping " + item.Name + "...");
				siteService.startStopSiteConfiguration(item.Id, "stop").then(function() {
					siteService.getSiteConfigurations().then(function(siteConfigs) {
						treeWidget.refreshAndExpand("site-table-tree", siteConfigs);
					});
				});
			}});
		commandService.addCommand(stopCommand, "object");
		
		var deleteCommand = new eclipse.Command({
			name: "Delete",
			image: "images/remove.gif",
			id: "eclipse.sites.delete",
			visibleWhen: function(item) {
				return item.HostingStatus && item.HostingStatus.Status === "stopped";
			},
			callback: function(item) {
				var msg = "Are you sure you want to delete the site configuration '" + item.Name + "'?";
				dialogService.confirm(msg, function(confirmed) {
						if (confirmed) {
							siteService.deleteSiteConfiguration(item.Id).then(function() {
								siteService.getSiteConfigurations().then(function(siteConfigs) {
									treeWidget.refreshAndExpand("site-table-tree", siteConfigs);
								});
							});
						}
					});
			}});
		commandService.addCommand(deleteCommand, "object");
		
		// Register command contributions
		commandService.addCommandGroup("eclipse.sitesGroup", 100);
		commandService.registerCommandContribution("eclipse.sites.create", 1, "site-toolbar", "eclipse.sitesGroup");
		
		commandService.registerCommandContribution("eclipse.sites.edit", 1);
		commandService.registerCommandContribution("eclipse.sites.start", 2);
		commandService.registerCommandContribution("eclipse.sites.stop", 3);
		commandService.registerCommandContribution("eclipse.sites.delete", 4);
		 
		// Render page-level commands
		var toolbar = dojo.byId("site-toolbar");
		commandService.renderCommands(toolbar, "dom", {}, {}, "image");
	}());
	
});