/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2011 IBM Corporation and others.
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
	        'dojo/parser', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane'], 
			function(dojo, mBootstrap, mCommands, mUsersClient, mProfile, mOperationsClient, mSearchClient, mFileClient, mGlobalCommands, mStatus, mProgress) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			var pluginRegistry = core.pluginRegistry;
			document.body.style.visibility = "visible"; //$NON-NLS-0$
			dojo.parser.parse();
	
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			var usersClient = new mUsersClient.UsersClient(serviceRegistry, pluginRegistry);
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			new mProgress.ProgressService(serviceRegistry, operationsClient);
			
			var profile = new mProfile.Profile({
				registry: serviceRegistry,
				pluginRegistry: pluginRegistry,
				profilePlaceholder: dojo.byId('table'), //$NON-NLS-0$
				commandService: commandService,
				pageActionsPlaceholder: dojo.byId('pageActions'), //$NON-NLS-0$
				usersClient: usersClient
			});
			
			mGlobalCommands.generateBanner("banner", serviceRegistry, commandService, preferences, searcher, profile); //$NON-NLS-0$
			mGlobalCommands.generateDomCommandsInBanner(commandService, profile);
		});
	});
});
