/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global dojo dijit window eclipse serviceRegistry:true widgets alert*/
/*browser:true*/
dojo.addOnLoad(function(){
	
	// initialize service registry and EAS services
	serviceRegistry = new eclipse.ServiceRegistry();
	var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry);
	dojo.addOnUnload(function() {
		pluginRegistry.shutdown();
	});
	new eclipse.StatusReportingService(serviceRegistry, "statusPane");
	new eclipse.LogService(serviceRegistry);
	new eclipse.DialogService(serviceRegistry);
	var selection = new orion.Selection(serviceRegistry);
	new eclipse.SshService(serviceRegistry);
	var preferenceService = new eclipse.PreferencesService(serviceRegistry, "/prefs/user");
	var commandService = new eclipse.CommandService({serviceRegistry: serviceRegistry, selection: selection});
	
	// Git operations
	var gitClient = new eclipse.GitService(serviceRegistry);
	
	var searcher = new eclipse.Searcher({serviceRegistry: serviceRegistry});
	
	var navigator = new eclipse.GitCommitNavigator(serviceRegistry, selection, searcher, gitClient, "explorer-tree", "pageTitle", "pageActions", "selectionTools");

	// global commands
	eclipse.globalCommandUtils.generateBanner("toolbar", commandService, preferenceService, searcher, navigator);
	
	//TODO this should be removed and contributed by a plug-in
	eclipse.gitCommandUtils.createFileCommands(serviceRegistry, commandService, navigator, "pageActions", gitClient, "selectionTools");
	
	// define the command contributions - where things appear, first the groups
	commandService.addCommandGroup("eclipse.gitGroup.nav", 200, "More");
	commandService.addCommandGroup("eclipse.gitGroup.page", 100, null, null, "pageActions");
	commandService.addCommandGroup("eclipse.selectionGroup", 500, "More actions", null, "selectionTools");
	
	// commands appearing directly in local actions column
	commandService.registerCommandContribution("eclipse.openGitCommit", 1);
	commandService.registerCommandContribution("eclipse.compareWithWorkingTree", 2);

	// selection based command contributions in nav toolbar
	commandService.registerCommandContribution("eclipse.compareGitCommits", 1, "selectionTools", "eclipse.selectionGroup");
	
	// git contributions
	// commandService.registerCommandContribution("eclipse.cloneGitRepository", 100, "pageActions", "eclipse.gitGroup.page");
	
	if (isRemote()){
		commandService.registerCommandContribution("eclipse.orion.git.fetch", 100, "pageActions", "eclipse.gitGroup.page");
		commandService.registerCommandContribution("eclipse.orion.git.merge", 100, "pageActions", "eclipse.gitGroup.page");
	} else {
		commandService.registerCommandContribution("eclipse.orion.git.push", 100, "pageActions", "eclipse.gitGroup.page");
	};
	
	if (isRemote()) {
		// refresh the commit list for the remote
		var path = dojo.hash();
		dojo.xhrGet({
			url : path,
			headers : {
				"Orion-Version" : "1"
			},
			handleAs : "json",
			timeout : 5000,
			load : function(jsonData, secondArg) {
				serviceRegistry.getService("IGitService").then(function(gitService){
					gitService.getLog(jsonData.HeadLocation, jsonData.Id, function(scopedCommitsJsonData, secondArd) {
						navigator.renderer.setIncomingCommits(scopedCommitsJsonData);
						navigator.loadCommitsList(jsonData.CommitLocation, jsonData);
					});
				});
			},
			error : function(error, ioArgs) {
				handleGetAuthenticationError(this, ioArgs);
				console.error("HTTP status code: ", ioArgs.xhr.status);
			}
		});
	} else {
		var path = dojo.hash();
		dojo.xhrGet({
			url : path,
			headers : {
				"Orion-Version" : "1"
			},
			handleAs : "json",
			timeout : 5000,
			load : function(jsonData, secondArg) {
				return jsonData.RemoteLocation;
			},
			error : function(error, ioArgs) {
				handleGetAuthenticationError(this, ioArgs);
				console.error("HTTP status code: ", ioArgs.xhr.status);
			}
		}).then(function(remoteLocation){
			return dojo.xhrGet({
				url : remoteLocation,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, secondArg) {
					serviceRegistry.getService("IGitService").then(function(gitService){
						gitService.getLog(jsonData.CommitLocation, "HEAD", function(scopedCommitsJsonData, secondArd) {
							navigator.renderer.setOutgoingCommits(scopedCommitsJsonData);
							navigator.loadCommitsList(dojo.hash(), jsonData);
						});
					});
				},
				error : function(error, ioArgs) {
					handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
				}
			});
		});
//		.then(function(blah){
//			serviceRegistry.getService("IGitService").then(function(gitService){
//				gitService.getLog(blah.CommitLocation, "HEAD", function(scopedCommitsJsonData, secondArd) {
//					navigator.renderer.setOutgoingCommits(scopedCommitsJsonData);
//					navigator.loadCommitsList(dojo.hash(), {});
//				});
//			});
//		});
	
		
		
		//navigator.loadCommitsList(dojo.hash(), {});
	}
	
	

	// every time the user manually changes the hash, we need to load the
	// workspace with that name
	dojo.subscribe("/dojo/hashchange", navigator, function() {
		if (isRemote()) {
			var path = dojo.hash();
			dojo.xhrGet({
				url : path,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, secondArg) {
					serviceRegistry.getService("IGitService").then(function(gitService){
						gitService.getLog(jsonData.HeadLocation, jsonData.Id, function(scopedCommitsJsonData, secondArd) {
							navigator.renderer.setIncomingCommits(scopedCommitsJsonData);
							navigator.loadCommitsList(jsonData.CommitLocation, jsonData);			
						});
					});
				},
				error : function(error, ioArgs) {
					handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
				}
			});
		} else {
			navigator.loadCommitsList(dojo.hash(), {});
		}
	});
});

function isRemote(){
	var queryParams = dojo.queryToObject(window.location.search.slice(1));
	return queryParams["remote"] != null;
};
