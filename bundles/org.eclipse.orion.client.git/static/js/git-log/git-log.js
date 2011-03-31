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
	new eclipse.InputService(serviceRegistry);		
	new eclipse.StatusReportingService(serviceRegistry, "statusPane");
	new eclipse.LogService(serviceRegistry);
	new eclipse.DialogService(serviceRegistry);
	new eclipse.SelectionService(serviceRegistry);
	var preferenceService = new eclipse.PreferencesService(serviceRegistry, "/prefs/user");
	var commandService = new eclipse.CommandService({serviceRegistry: serviceRegistry});
	
	// Git operations
	var gitClient = new eclipse.GitService(serviceRegistry);
	
	var treeRoot = {
		children:[]
	};
	var searcher = new eclipse.Searcher({serviceRegistry: serviceRegistry});
	
	var fileClient = new eclipse.FileClient(serviceRegistry, pluginRegistry);
	
	var navigator = new eclipse.GitCommitNavigator(serviceRegistry, treeRoot, searcher, gitClient, "explorer-tree", "pageTitle", "pageActions", "selectionTools");

	// global commands
	eclipse.globalCommandUtils.generateBanner("toolbar", commandService, preferenceService, searcher, navigator);
	
	//TODO this should be removed and contributed by a plug-in
	eclipse.gitCommandUtils.createFileCommands(serviceRegistry, commandService, navigator, "pageActions", "selectionTools");
	
	// define the command contributions - where things appear, first the groups
	commandService.addCommandGroup("eclipse.gitGroup.nav", 100, "More");
	commandService.addCommandGroup("eclipse.gitGroup.page", 100, null, null, "pageActions");
	commandService.addCommandGroup("eclipse.selectionGroup", 500, "More actions", null, "selectionTools");
	
	// commands appearing directly in local actions column
	commandService.registerCommandContribution("eclipse.openGitCommit", 1);
	commandService.registerCommandContribution("eclipse.compareWithWorkingTree", 2);

	// selection based command contributions in nav toolbar
	commandService.registerCommandContribution("eclipse.compareGitCommits", 1, "selectionTools", "eclipse.selectionGroup");
	
	// git contributions
	// commandService.registerCommandContribution("eclipse.cloneGitRepository", 100, "pageActions", "eclipse.gitGroup.page");

	commandService.renderCommands(dojo.byId("pageActions"), "dom", {}, {}, "image");
	
	navigator.loadCommitsList(dojo.hash());
	
	//every time the user manually changes the hash, we need to load the workspace with that name
	dojo.subscribe("/dojo/hashchange", navigator, function() {
		navigator.loadCommitsList(dojo.hash());
	});
});
