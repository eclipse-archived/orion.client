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
/*global eclipse dojo dijit widgets window*/
/*jslint devel:true browser:true*/

/*
 * Glue code for site.html
 */
dojo.addOnLoad(function() {
	// Register services
	var serviceRegistry = new eclipse.ServiceRegistry();
	var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry);
	dojo.addOnWindowUnload(function() {
		pluginRegistry.shutdown();
	});
	var dialogService = new eclipse.DialogService(serviceRegistry);
	var statusService = new eclipse.StatusReportingService(serviceRegistry, "statusPane", "notifications");
	var commandService = new eclipse.CommandService({serviceRegistry: serviceRegistry});
	
	serviceRegistry.getService("IFileService").then(function(fileService) {
		var fileClient = new eclipse.FileClient(fileService);
		var siteService = new eclipse.sites.SiteService(serviceRegistry);
		var preferenceService = new eclipse.PreferencesService(serviceRegistry, "/prefs/user");
		var searcher = new eclipse.Searcher({serviceRegistry: serviceRegistry});
		
		eclipse.globalCommandUtils.generateBanner("toolbar", serviceRegistry, commandService, preferenceService, searcher);
		
		var updateTitle = function() {
			var editor = dijit.byId("site-editor");
			var site = editor && editor.getSiteConfiguration();
			if (editor && site) {
				var pageTitle = dojo.byId("pageTitle");
				dojo.empty(pageTitle);
				var back = dojo.create("span", {className: "breadcrumb"}, pageTitle, "last");
				dojo.create("a", {href: "sites.html", innerHTML: "Sites"}, back);
				var title = dojo.create("span", {className: "breadcrumb"}, pageTitle, "last");
				dojo.place(document.createTextNode(site.Name), title);
				dojo.place(back, "pageTitle");
				dojo.place(document.createTextNode(" | "), "pageTitle");
				dojo.place(title, "pageTitle");
				window.document.title = site.Name + " - Edit Site";
			}
		};
		
		var onHashChange = function() {
			var hash = dojo.hash();
			var state = eclipse.sites.util.parseStateFromHash(hash);
			var editor = dijit.byId("site-editor");
			if (state.site /* && site is not already loaded */) {
				editor.load(state.site).then(
					function() {
						updateTitle();
					});
			}
		};
		dojo.subscribe("/dojo/hashchange", null, onHashChange);
		
		// Initialize the widget
		var widget;
		(function() {
			widget = new widgets.SiteEditor({
				fileClient: fileClient,
				siteService: siteService,
				commandService: commandService,
				statusService: statusService,
				commandsContainer: dojo.byId("pageActions"),
				id: "site-editor"});
			dojo.place(widget.domNode, dojo.byId("site"), "only");
			widget.startup();
			
			dojo.connect(widget, "onSuccess", updateTitle);
			
			onHashChange();
		}());
		
		// Hook up commands stuff
		var refresher = dojo.hitch(widget, widget._setSiteConfiguration);
		var errorHandler = statusService;
		
		eclipse.sites.util.createSiteCommands(commandService, siteService, statusService, dialogService, 
				/*start*/ refresher, /*stop*/ refresher, /*delete*/ null, errorHandler);
		commandService.registerCommandContribution("eclipse.site.start", 1);
		commandService.registerCommandContribution("eclipse.site.stop", 2);
	});
});