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
	        'orion/operationsClient', 'orion/searchClient', 'orion/globalCommands', 'orion/status', 'orion/progress',
	        'dojo/parser', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane'], 
			function(dojo, mBootstrap, mCommands, mUsersClient, mProfile, mOperationsClient, mSearchClient, mGlobalCommands, mStatus, mProgress) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			var pluginRegistry = core.pluginRegistry;
			document.body.style.visibility = "visible";
			dojo.parser.parse();
	
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService});
			var usersClient = new mUsersClient.UsersClient(serviceRegistry, pluginRegistry);
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications");
			new mProgress.ProgressService(serviceRegistry, operationsClient);
			
			var profile = new mProfile.Profile({
				registry: serviceRegistry,
				pluginRegistry: pluginRegistry,
				profilePlaceholder: dojo.byId('profileContent'),
				commandService: commandService,
				pageActionsPlaceholder: dojo.byId('pageActions'),
				usersClient: usersClient
			});
			
			mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, preferences, searcher, profile);
			mGlobalCommands.generateDomCommandsInBanner(commandService, profile);
		});
	});
});
