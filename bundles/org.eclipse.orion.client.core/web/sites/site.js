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
/*global define dojo dijit orion window*/
/*jslint browser:true*/

/*
 * Glue code for site.html
 */
define(['dojo', 'orion/bootstrap', 'orion/status', 'orion/commands', 
	        'orion/fileClient', 'orion/searchClient', 'orion/dialogs', 'orion/globalCommands', 'orion/siteService', 'orion/siteUtils', 'orion/siteTree', 'orion/treetable', 
	        'dojo/parser', 'dojo/hash', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/SiteEditor'], 
			function(dojo, mBootstrap, mStatus, mCommands, mFileClient, mSearchClient, mDialogs, mGlobalCommands, mSiteService, mSiteUtils, mSiteTree, mTreeTable) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			document.body.style.visibility = "visible";
			dojo.parser.parse();
			
			// Register services
			var dialogService = new mDialogs.DialogService(serviceRegistry);
			var statusService = new mStatus.StatusReportingService(serviceRegistry, "statusPane", "notifications");
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
		
			var fileClient = new mFileClient.FileClient(serviceRegistry, function(reference) {
				var pattern = reference.getProperty("pattern");
				return pattern && pattern.indexOf("/") === 0;
			});
			var siteService = new mSiteService.SiteService(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			
			mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, preferences, searcher);
			
			var updateTitle = function() {
				var editor = dijit.byId("site-editor");
				var site = editor && editor.getSiteConfiguration();
				if (editor && site) {
					var location = dojo.byId("location");
					dojo.place(document.createTextNode(site.Name), location, "only");
					document.title = site.Name + (editor.isDirty() ? "* " : "") + " - Edit Site";
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
					serviceRegistry: serviceRegistry,
					fileClient: fileClient,
					siteService: siteService,
					commandService: commandService,
					statusService: statusService,
					commandsContainer: dojo.byId("pageActions"),
					id: "site-editor"});
				dojo.place(widget.domNode, dojo.byId("site"), "only");
				widget.startup();
				
				dojo.connect(widget, "onSuccess", updateTitle);
				dojo.connect(widget, "setDirty", updateTitle);
				
				onHashChange();
			}());
			
			window.onbeforeunload = function() {
				if (widget.isDirty()) {
					return "There are unsaved changes.";
				}
			};
			
			// Hook up commands stuff
			var refresher = dojo.hitch(widget, widget._setSiteConfiguration);
			var errorHandler = dojo.hitch(statusService, statusService.setProgressResult);
			
			mSiteUtils.createSiteCommands(commandService, siteService, statusService, dialogService, 
					/*start*/ refresher, /*stop*/ refresher, /*delete*/ null, errorHandler);
			commandService.registerCommandContribution("eclipse.site.start", 1);
			commandService.registerCommandContribution("eclipse.site.stop", 2);
		});
	});
});