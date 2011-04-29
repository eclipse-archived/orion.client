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
 * Glue code for edit-site.html
 */
dojo.addOnLoad(function() {
	// Register services
	var serviceRegistry = new eclipse.ServiceRegistry();
	var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry);
	dojo.addOnWindowUnload(function() {
		pluginRegistry.shutdown();
	});
	var dialogService = new eclipse.DialogService(serviceRegistry);
	var statusService = new eclipse.StatusReportingService(serviceRegistry, "statusPane", "pageActionsLeft");
	var commandService = new eclipse.CommandService({serviceRegistry: serviceRegistry});
	
	serviceRegistry.getService("IFileService").then(function(fileService) {
		var fileClient = new eclipse.FileClient(fileService);
		var siteService = new eclipse.sites.SiteService(serviceRegistry);
		var preferenceService = new eclipse.PreferencesService(serviceRegistry, "/prefs/user");
		var searcher = new eclipse.Searcher({serviceRegistry: serviceRegistry});
		
		eclipse.globalCommandUtils.generateBanner("toolbar", commandService, preferenceService, searcher);
		
		/**
		 * TODO move into SiteEditor
		 * Does something after the site has been loaded into the editor, for example adds a new mapping entry.
		 * @return {dojo.Deferred}
		 */
		var performPostLoadAction = function(action) {
			// After doing the action, we should rewrite the hash so it just has #site=
			//var newHash = eclipse.sites.util.stateToHash()
		};
		
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
						performPostLoadAction(state.action);
						updateTitle();
					});
			} else {
				performPostLoadAction(state.action, state.actionDetails);
			}
		};
		
		dojo.subscribe("/dojo/hashchange", null, onHashChange);
		
		// Initialize the widget
		(function() {
			var widget = new widgets.SiteEditor({
				fileClient: fileClient,
				siteService: siteService,
				commandService: commandService,
				id: "site-editor"});
			dojo.place(widget.domNode, dojo.byId("site"), "only");
			widget.startup();
			
			dojo.connect(widget, "onError", function(error) {
				statusService.setMessage(JSON.stringify(error));
			});
			dojo.connect(widget, "onMessage", function(message) {
				statusService.setMessage(message, 3000);
				updateTitle();
			});
			
			onHashChange();
		}());
	});
});