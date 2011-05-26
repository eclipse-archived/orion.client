/******************************************************************************* 
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global dojo dijit window eclipse serviceRegistry:true widgets alert*/
/*browser:true*/
dojo.addOnLoad(function(){
	
	// initialize service registry and EAS services
	serviceRegistry = new eclipse.ServiceRegistry();
	var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry);
	dojo.addOnUnload(function() {
		pluginRegistry.shutdown();
	});
	new eclipse.StatusReportingService(serviceRegistry, "statusPane", "notifications");
	new eclipse.LogService(serviceRegistry);
	new eclipse.DialogService(serviceRegistry);
	new eclipse.UserService(serviceRegistry);
	var selection = new orion.Selection(serviceRegistry);
	new eclipse.SshService(serviceRegistry);
	var preferenceService = new eclipse.PreferencesService(serviceRegistry, "/prefs/user");
	var commandService = new eclipse.CommandService({serviceRegistry: serviceRegistry});
	
	// Git operations
	new eclipse.GitService(serviceRegistry);
	
	var searcher = new eclipse.Searcher({serviceRegistry: serviceRegistry});

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
	
	var explorer = new eclipse.git.GitClonesExplorer(serviceRegistry, selection, "clonesList", "pageActions", "selectionTools");
	eclipse.globalCommandUtils.generateBanner("toolbar", serviceRegistry, commandService, preferenceService, searcher, explorer);
	
	
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

	var fileClient = new eclipse.FileClient(topLevelFileService);
	
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
					eclipse.gitCommandUtils.createFileCommands(serviceRegistry, commandService, explorer, "pageActions", "selectionTools");
					eclipse.gitCommandUtils.createGitClonesCommands(serviceRegistry, commandService, explorer, "pageActions", "selectionTools");
			
					eclipse.gitCommandUtils.updateNavTools(serviceRegistry, explorer, "pageActions", "selectionTools", {});
			
					explorer.displayClonesList(dojo.hash());
						
					//every time the user manually changes the hash, we need to load the workspace with that name
					dojo.subscribe("/dojo/hashchange", explorer, function() {
					   explorer.displayClonesList(dojo.hash());
					});

				}
			);
		
	});
	
	
});
