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
/*global eclipse dojo dijit sites window*/
/*jslint devel:true browser:true*/

/*
 * Glue code for edit-site.html
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
	
	/**
	 * TODO move into SiteEditor
	 * Does something after the site has been loaded into the editor, for example adds a new mapping entry.
	 * @return {dojo.Deferred}
	 */
	var performPostLoadAction = function(action) {
		// After doing the action, we should rewrite the hash so it just has #site=
		//var newHash = eclipse.sites.util.stateToHash()
	};
	
	var onHashChange = function() {
		var hash = dojo.hash();
		var state = eclipse.sites.util.parseStateFromHash(hash);
		var editor = dijit.byId("site-editor");
		if (state.site /* && site is not already loaded */) {
			editor.load(state.site).then(
				function() {
					performPostLoadAction(state.action);
					//window.document.title = "Edit Site Configuration - " + editor.getSiteConfiguration().Name;
				});
		} else {
			performPostLoadAction(state.action, state.actionDetails);
		}
	};
	
	dojo.subscribe("/dojo/hashchange", null, onHashChange);
	
	// Initialize the widget
	(function() {
		var widget = new sites.widgets.SiteEditor({serviceRegistry: serviceRegistry, id: "site-editor"});
		dojo.place(widget.domNode, dojo.byId("site"), "only");
		widget.startup();
		
		var errorHandler = function(error) {
			dojo.place(document.createTextNode(JSON.stringify(error)), dojo.byId("site"), "only");
		};
		
		onHashChange(); // kick hash
	}());
});