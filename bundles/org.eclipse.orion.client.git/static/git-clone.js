/******************************************************************************* 
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
var eclipse;
/*global dojo dijit window eclipse serviceRegistry:true widgets alert*/
/*browser:true*/
define(['dojo', 'orion/serviceregistry', 'orion/preferences', 'orion/pluginregistry', 'orion/status', 'orion/log', 'orion/commands',
        'orion/auth', 'orion/dialogs', 'orion/users', 'orion/selection', 'orion/fileClient', 'orion/searchClient', 'orion/globalCommands', 'orion/gitClient',
        'orion/ssh/sshTools', 'orion/git-clones-explorer', 'orion/gitCommands',
	    'dojo/parser', 'dojo/hash', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane'], 
		function(dojo, mServiceregistry, mPreferences, mPluginRegistry, mStatus, mLog, mCommands, mAuth, mDialogs, mUsers, mSelection, mFileClient,
					mSearchClient, mGlobalCommands, mGitClient, mSshTools, mGitClonesExplorer, mGitCommands) {

dojo.addOnLoad(function() {
	
	dojo.parser.parse();
	
	// initialize service registry and EAS services
	serviceRegistry = new mServiceregistry.ServiceRegistry();
	var pluginRegistry = new mPluginRegistry.PluginRegistry(serviceRegistry);
	dojo.addOnUnload(function() {
		pluginRegistry.shutdown();
	});
	new mStatus.StatusReportingService(serviceRegistry, "statusPane", "notifications");
	new mLog.LogService(serviceRegistry);
	new mDialogs.DialogService(serviceRegistry);
	new mUsers.UserService(serviceRegistry);
	var selection = new mSelection.Selection(serviceRegistry);
	new mSshTools.SshService(serviceRegistry);
	var preferenceService = new mPreferences.PreferencesService(serviceRegistry, "/prefs/user");
	var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
	
	// Git operations
	new mGitClient.GitService(serviceRegistry);
	
	var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry});

	// define the command contributions - where things appear, first the groups
	commandService.addCommandGroup("eclipse.gitGroup", 100, null, null, "pageActions");
	// git contributions
	commandService.registerCommandContribution("eclipse.cloneGitRepository", 100, "pageActions", "eclipse.gitGroup");
	commandService.registerCommandContribution("eclipse.initGitRepository", 101, "pageActions", "eclipse.gitGroup");
	commandService.addCommandGroup("eclipse.selectionGroup", 500, "More actions", null, "selectionTools");
	commandService.registerCommandContribution("eclipse.git.deleteClone", 1);
	commandService.registerCommandContribution("eclipse.git.deleteClone", 1, "selectionTools", "eclipse.selectionGroup");
	commandService.registerCommandContribution("eclipse.checkoutBranch", 2);
	commandService.registerCommandContribution("eclipse.addBranch", 2);
	commandService.registerCommandContribution("eclipse.removeBranch", 2);
	commandService.registerCommandContribution("eclipse.addRemote", 2);
	commandService.registerCommandContribution("eclipse.removeRemote", 2);
	commandService.registerCommandContribution("eclipse.openGitLog", 2);
	commandService.registerCommandContribution("eclipse.orion.git.fetch", 2);
	commandService.registerCommandContribution("eclipse.orion.git.merge", 2);
	commandService.registerCommandContribution("eclipse.orion.git.push", 2);
	
	var explorer = new mGitClonesExplorer.GitClonesExplorer(serviceRegistry, selection, "clonesList", "pageActions", "selectionTools");
	mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, preferenceService, searcher, explorer);
	
	
	var fileServices = serviceRegistry.getServiceReferences("orion.core.file");
	
	function emptyArray() {
		var d = new dojo.Deferred();
		d.callback([]);
		return d;
	}
	function emptyObject() {
		var d = new dojo.Deferred();
		d.callback({});
		return d;
	}
	var topLevelFileService = {
		fetchChildren: emptyArray,
		createWorkspace: emptyObject,
		loadWorkspaces: emptyArray,
		loadWorkspace: function(location) {
			var d = new dojo.Deferred();
			d.callback({Children: topLevel});
			return d;
		},
		createProject: emptyObject,
		createFolder: emptyObject,
		createFile: emptyObject,
		deleteFile: emptyObject,
		moveFile: emptyObject,
		copyFile: emptyObject,
		read: emptyObject,
		write: emptyObject
	};

	var fileClient = new mFileClient.FileClient(topLevelFileService);
	
	var deferred;
	if (fileServices[0]) {
		deferred = serviceRegistry.getService(fileServices[0]);
	} else {
		deferred = { then: function(callback) { callback(topLevelFileService); } };
	}
	deferred.then(function(fileService) {
		fileClient.setFileService(fileService);
		fileClient.loadWorkspace().then(
				function(workspace){
					explorer.setDefaultPath(workspace.Location);
			
					// global commands
					mGitCommands.createFileCommands(serviceRegistry, commandService, explorer, "pageActions", "selectionTools");
					mGitCommands.createGitClonesCommands(serviceRegistry, commandService, explorer, "pageActions", "selectionTools");
			
					mGitCommands.updateNavTools(serviceRegistry, explorer, "pageActions", "selectionTools", {});
			
					explorer.displayClonesList(dojo.hash());
						
					//every time the user manually changes the hash, we need to load the workspace with that name
					dojo.subscribe("/dojo/hashchange", explorer, function() {
					   explorer.displayClonesList(dojo.hash());
					});

				}
			);
		
	});
	
	
});
});
