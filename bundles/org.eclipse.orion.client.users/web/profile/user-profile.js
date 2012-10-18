/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit window eclipse:true*/

define(['dojo', 'orion/bootstrap', 'orion/commands', 'orion/profile/usersClient', 'orion/profile/profile',
	        'orion/operationsClient', 'orion/searchClient', 'orion/fileClient', 'orion/globalCommands', 'orion/status', 'orion/progress',
	        'orion/dialogs', 'orion/selection', 'orion/ssh/sshTools', 'orion/links'], 
			function(dojo, mBootstrap, mCommands, mUsersClient, mProfile, mOperationsClient, mSearchClient, mFileClient, mGlobalCommands, mStatus, mProgress,
					mDialogs, mSelection, mSshTools, mLinks) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			new mProgress.ProgressService(serviceRegistry, operationsClient);
			new mDialogs.DialogService(serviceRegistry);
			var selection = new mSelection.Selection(serviceRegistry);
			new mSshTools.SshService(serviceRegistry);
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry, selection: selection});
			var linkService = new mLinks.TextLinkService({serviceRegistry: serviceRegistry});
			var usersClient = new mUsersClient.UsersClient(serviceRegistry, pluginRegistry);
		
			// Git operations
			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, fileService: fileClient, commandService: commandService});
			
			var profile = new mProfile.Profile({
				registry: serviceRegistry,
				pluginRegistry: pluginRegistry,
				profilePlaceholder: dojo.byId('table'), //$NON-NLS-0$
				commandService: commandService,
				pageActionsPlaceholder: dojo.byId('pageActions'), //$NON-NLS-0$
				usersClient: usersClient
			});
			
			mGlobalCommands.setPageCommandExclusions([]); //$NON-NLS-1$ //$NON-NLS-0$
			mGlobalCommands.generateBanner("orion-profile", serviceRegistry, commandService, preferences, searcher, profile); //$NON-NLS-0$

			var toolbar = dojo.byId("pageActions"); //$NON-NLS-0$
			if (toolbar) {	
				commandService.destroy(toolbar);
				commandService.renderCommands(toolbar.id, toolbar, profile, profile, "button"); //$NON-NLS-0$
			}
			toolbar = dojo.byId("pageNavigationActions"); //$NON-NLS-0$
			if (toolbar) {	
				commandService.destroy(toolbar);
				commandService.renderCommands(toolbar.id, toolbar, profile, profile, "button");  // use true when we want to force toolbar items to text //$NON-NLS-0$
			}
		});
	});
});
