/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
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
define(['i18n!orion/sites/nls/messages', 'dojo', 'orion/bootstrap', 'orion/status', 'orion/progress', 'orion/commands', 
	'orion/fileClient', 'orion/operationsClient', 'orion/searchClient', 'orion/dialogs', 'orion/globalCommands', 'orion/sites/siteClient', 'orion/sites/siteCommands', 'orion/PageUtil',
	'dojo/hash','orion/widgets/SiteEditor'], 
	function(messages, dojo, mBootstrap, mStatus, mProgress, mCommands, mFileClient, mOperationsClient, mSearchClient, mDialogs, mGlobalCommands, mSiteClient, mSiteCommands, PageUtil) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			
			var dialogService = new mDialogs.DialogService(serviceRegistry);
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var statusService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var progressService = new mProgress.ProgressService(serviceRegistry, operationsClient);
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
		
			var siteLocation = PageUtil.matchResourceParameters().resource;
			var siteClient = mSiteClient.forLocation(serviceRegistry, siteLocation);
			var fileClient = siteClient._getFileClient();
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			mGlobalCommands.generateBanner("orion-site", serviceRegistry, commandService, preferences, searcher); //$NON-NLS-0$

			var updateTitle = function() {
				var editor = dijit.byId("site-editor"); //$NON-NLS-0$
				var site = editor && editor.getSiteConfiguration();
				if (editor && site) {
					var item = 	{};
					item.Parents = [];
					item.Name = site.Name;
					item.Parents[0] = {};
					item.Parents[0].Name = "Sites";
					item.Parents[0].Location = "";
					mGlobalCommands.setPageTarget({task: "Edit Site", target: site, breadcrumbTarget: item,
						makeBreadcrumbLink: function(seg, location){
							seg.href = "/sites/sites.html"; //$NON-NLS-0$
						},
						serviceRegistry: serviceRegistry, searchService: searcher, fileService: fileClient, commandService: commandService
					});
					mGlobalCommands.setDirtyIndicator(editor.isDirty());
				}
			};
			
			var onHashChange = function() {
				var params = PageUtil.matchResourceParameters();
				var resource = params.resource;
				var editor = dijit.byId("site-editor"); //$NON-NLS-0$
				if (resource && resource !== editor.getResource()) {
					var doit = !editor.isDirty() || confirm(messages['There are unsaved changes. Do you still want to navigate away?']);
					if (doit) {
						editor.load(resource).then(
							function() {
								updateTitle();
							});
					}
				}
			};
			dojo.subscribe("/dojo/hashchange", null, onHashChange); //$NON-NLS-0$
			
			// Initialize the widget
			var widget;
			(function() {
				widget = new orion.widgets.SiteEditor({
					serviceRegistry: serviceRegistry,
					fileClient: fileClient,
					siteClient: siteClient,
					commandService: commandService,
					statusService: statusService,
					progressService: progressService,
					commandsContainer: dojo.byId("pageActions"), //$NON-NLS-0$
					id: "site-editor"}); //$NON-NLS-0$
				dojo.place(widget.domNode, dojo.byId("site"), "only"); //$NON-NLS-1$ //$NON-NLS-0$
				widget.startup();
				
				dojo.connect(widget, "onSuccess", updateTitle); //$NON-NLS-0$
				dojo.connect(widget, "setDirty", updateTitle); //$NON-NLS-0$
				
				onHashChange();
			}());
			
			window.onbeforeunload = function() {
				if (widget.isDirty()) {
					return messages['There are unsaved changes.'];
				}
			};

			mSiteCommands.createSiteCommands(serviceRegistry);
			commandService.registerCommandContribution("pageActions", "orion.site.start", 1); //$NON-NLS-1$ //$NON-NLS-0$
			commandService.registerCommandContribution("pageActions", "orion.site.stop", 2); //$NON-NLS-1$ //$NON-NLS-0$
			commandService.registerCommandContribution("pageActions", "orion.site.convert", 3); //$NON-NLS-1$ //$NON-NLS-0$
		});
	});
});