/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*jslint browser:true devel:true*/
/*global define*/

define(['require', 'dojo', 'orion/bootstrap', 'orion/commands', 'orion/fileClient', 'orion/operationsClient', 'orion/searchClient', 'orion/status', 'orion/progress', 'orion/globalCommands',
        'dojo/parser', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane'/*, 'dojox/widget/Portlet', 'dojox/widget/FeedPortlet'*/], 
		function(require, dojo, mBootstrap, mCommands, mFileClient, mOperationsClient, mSearchClient, mStatus, mProgress, mGlobalCommands) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			// This should be the minimal list of services needed to login.  
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var statusService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea");
			var progressService = new mProgress.ProgressService(serviceRegistry, operationsClient);
				
			// global commands
			mGlobalCommands.generateBanner("banner", serviceRegistry, commandService, preferences, searcher);
			document.body.style.visibility = "visible";
			dojo.parser.parse();
		});
	});
});
