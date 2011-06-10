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
define(['dojo', 'orion/serviceregistry', 'orion/preferences', 'orion/pluginregistry', 'orion/status', 'orion/commands', 
	        'orion/fileClient', 'orion/searchClient', 'orion/dialogs', 'orion/globalCommands', 'siteService', 'orion/siteUtils', 'siteTree', 'orion/treetable', 
	        'dojo/parser', 'dojo/hash', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/SiteEditor'], 
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
		
		var updateTitle = function() {
			var editor = dijit.byId("site-editor");
			var site = editor && editor.getSiteConfiguration();
			if (editor && site) {
				var location = dojo.byId("location");
				dojo.place(document.createTextNode(site.Name), location, "only");
				window.document.title = site.Name + " - Edit Site";
			}
		};
		
		var onHashChange = function() {
			var hash = dojo.hash();
			var state = mSiteUtils.parseStateFromHash(hash);
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
			widget = new orion.widgets.SiteEditor({
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
		
		mSiteUtils.createSiteCommands(commandService, siteService, statusService, dialogService, 
				/*start*/ refresher, /*stop*/ refresher, /*delete*/ null, errorHandler);
		commandService.registerCommandContribution("eclipse.site.start", 1);
		commandService.registerCommandContribution("eclipse.site.stop", 2);
	});
});

});