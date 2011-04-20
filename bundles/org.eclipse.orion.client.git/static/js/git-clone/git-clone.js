/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
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
	new eclipse.StatusReportingService(serviceRegistry, "statusPane", "pageActionsLeft");
	new eclipse.LogService(serviceRegistry);
	new eclipse.DialogService(serviceRegistry);
	new eclipse.UserService(serviceRegistry);
	var selection = new orion.Selection(serviceRegistry);
	new eclipse.SshService(serviceRegistry);
	new eclipse.FileClient(serviceRegistry, pluginRegistry);
	var preferenceService = new eclipse.PreferencesService(serviceRegistry, "/prefs/user");
	var commandService = new eclipse.CommandService({serviceRegistry: serviceRegistry});
	
	// Git operations
	new eclipse.GitService(serviceRegistry);
	
	var searcher = new eclipse.Searcher({serviceRegistry: serviceRegistry});
	var explorer = new eclipse.git.GitClonesExplorer(serviceRegistry, selection, "/git/clone/", "clonesList", "pageActions", "selectionTools");
	
	// global commands
	eclipse.globalCommandUtils.generateBanner("toolbar", commandService, preferenceService, searcher, explorer);
	eclipse.gitCommandUtils.createFileCommands(serviceRegistry, commandService, explorer, "pageActions", "selectionTools");
	eclipse.gitCommandUtils.createGitClonesCommands(serviceRegistry, commandService, explorer, "pageActions", "selectionTools");

	// define the command contributions - where things appear, first the groups
	commandService.addCommandGroup("eclipse.gitGroup", 100, null, null, "pageActions");
	// git contributions
	commandService.registerCommandContribution("eclipse.cloneGitRepository", 100, "pageActions", "eclipse.gitGroup");
	commandService.addCommandGroup("eclipse.selectionGroup", 500, "More actions", null, "selectionTools");
	commandService.registerCommandContribution("eclipse.git.deleteClone", 1);
	commandService.registerCommandContribution("eclipse.git.deleteClone", 1, "selectionTools", "eclipse.selectionGroup");
	commandService.registerCommandContribution("eclipse.linkRepository", 2);


	

	eclipse.gitCommandUtils.updateNavTools(serviceRegistry, explorer, "pageActions", "selectionTools", {});
	
	explorer.displayClonesList(dojo.hash());
	
	//every time the user manually changes the hash, we need to load the workspace with that name
	dojo.subscribe("/dojo/hashchange", explorer, function() {
	   explorer.displayClonesList(dojo.hash());
	});
	
});
