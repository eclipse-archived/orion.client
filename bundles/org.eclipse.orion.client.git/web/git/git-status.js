/******************************************************************************* 
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

define(['dojo', 'orion/bootstrap', 'orion/status', 'orion/progress',  'orion/commands',
	        'orion/searchClient', 'orion/fileClient', 'orion/operationsClient', 'orion/globalCommands', 'orion/git/gitClient', 'orion/git/git-status-table', 'orion/breadcrumbs','orion/dialogs','orion/ssh/sshTools', 'orion/contentTypes',
	        'dojo/parser', 'dojo/hash', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/eWebBorderContainer'], 
			function(dojo, mBootstrap, mStatus, mProgress, mCommands, mSearchClient, mFileClient, mOperationsClient, mGlobalCommands, mGitClient, mGitStatusTable, mBreadcrumbs,mDialogs,mSshTools, mContentTypes) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			document.body.style.visibility = "visible";
			dojo.parser.parse();
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var contentTypeService = new mContentTypes.ContentTypeService(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			// Git operations
			new mGitClient.GitService(serviceRegistry);
			new mSshTools.SshService(serviceRegistry);
			// File operations
		
			new mDialogs.DialogService(serviceRegistry);
			
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var statusService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea");
			new mProgress.ProgressService(serviceRegistry, operationsClient);
		
			mGlobalCommands.generateBanner("banner", serviceRegistry, commandService, preferences, searcher);
			mGlobalCommands.setPageCommandExclusions(["eclipse.git.status"]);
			var controller = new mGitStatusTable.GitStatusController({renderLog :true},serviceRegistry , commandService , statusService,"unstagedZone" , "stagedZone");
			controller.getGitStatus(dojo.hash(),true);
		
			//every time the user manually changes the hash, we need to load the git status
			dojo.subscribe("/dojo/hashchange", controller, function() {
				controller.getGitStatus(dojo.hash(),true);
			});
			
		});
	});
});


