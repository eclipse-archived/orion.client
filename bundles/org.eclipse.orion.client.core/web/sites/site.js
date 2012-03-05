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
/*global confirm define dojo dijit orion window*/
/*jslint browser:true*/

/*
 * Glue code for site.html
 */
define(['dojo', 'orion/bootstrap', 'orion/status', 'orion/progress', 'orion/commands', 
	'orion/fileClient', 'orion/operationsClient', 'orion/searchClient', 'orion/dialogs', 'orion/globalCommands', 'orion/util', 'orion/siteService', 'orion/siteUtils', 'orion/siteTree', 'orion/treetable', 'orion/PageUtil',
	'dojo/parser', 'dojo/hash', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/SiteEditor'], 
	function(dojo, mBootstrap, mStatus, mProgress, mCommands, mFileClient, mOperationsClient, mSearchClient, mDialogs, mGlobalCommands, mUtil, mSiteService, mSiteUtils, mSiteTree, mTreeTable, PageUtil) {

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
		
			var fileClient = new mFileClient.FileClient(serviceRegistry, function(reference) {
				var pattern = reference.getProperty("pattern");
				return pattern && pattern.indexOf("/") === 0;
			});
			var siteService = new mSiteService.SiteService(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			
			mGlobalCommands.generateBanner("banner", serviceRegistry, commandService, preferences, searcher);
			
			var updateTitle = function() {
				var editor = dijit.byId("site-editor");
				var site = editor && editor.getSiteConfiguration();
				if (editor && site) {
					var location = dojo.byId("location");
					dojo.place(document.createTextNode(site.Name), location, "only");
					document.title = site.Name + (editor.isDirty() ? "* " : "") + " - Edit Site";
					mUtil.forceLayout(location);
				}
			};
			
			var onHashChange = function() {
				var params = PageUtil.matchResourceParameters();
				var resource = params.resource;
				var editor = dijit.byId("site-editor");
				if (resource && resource !== editor.getResource()) {
					var doit = !editor.isDirty() || confirm("There are unsaved changes. Do you still want to navigate away?");
					if (doit) {
						editor.load(resource).then(
							function() {
								updateTitle();
							});
					}
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
					progressService: progressService,
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
			
			mSiteUtils.createSiteCommands(commandService, siteService, progressService, dialogService, 
					/*start*/ refresher, /*stop*/ refresher, /*delete*/ null, errorHandler);
			commandService.registerCommandContribution("pageActions", "eclipse.site.start", 1);
			commandService.registerCommandContribution("pageActions", "eclipse.site.stop", 2);
			commandService.registerCommandContribution("pageActions", "eclipse.site.convert", 3);
			commandService.registerCommandContribution("pageActions", "eclipse.site.save", 4);
		});
	});
});