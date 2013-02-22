/******************************************************************************* 
 * @license
 * Copyright (c) 2011, 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

var eclipse;

define(['i18n!git/nls/gitmessages', 'require', 'orion/bootstrap', 'orion/status', 'orion/progress', 'orion/PageUtil', 'orion/commands', 'orion/dialogs', 'orion/selection', 
        'orion/fileClient', 'orion/operationsClient', 'orion/searchClient', 'orion/globalCommands',
        'orion/git/gitRepositoryExplorer', 'orion/git/gitCommands', 'orion/git/gitClient', 'orion/ssh/sshTools', 'orion/links'], 
		function(messages, require, mBootstrap, mStatus, mProgress, PageUtil, mCommands, mDialogs, mSelection, 
				mFileClient, mOperationsClient, mSearchClient, mGlobalCommands, 
				mGitRepositoryExplorer, mGitCommands, mGitClient, mSshTools, mLinks) {

mBootstrap.startup().then(function(core) {
	var serviceRegistry = core.serviceRegistry;
	var preferences = core.preferences;
	
	new mDialogs.DialogService(serviceRegistry);
	var selection = new mSelection.Selection(serviceRegistry);
	new mSshTools.SshService(serviceRegistry);
	var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
	var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
	var progress = new mProgress.ProgressService(serviceRegistry, operationsClient);
	new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	
	// ...
	var linkService = new mLinks.TextLinkService({serviceRegistry: serviceRegistry});
	var gitClient = new mGitClient.GitService(serviceRegistry);
	var fileClient = new mFileClient.FileClient(serviceRegistry);
	var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
	
	var explorer = new mGitRepositoryExplorer.GitRepositoryExplorer(serviceRegistry, commandService, linkService, /* selection */ null, "artifacts", "pageNavigationActions", "itemLevelCommands"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	mGlobalCommands.generateBanner("orion-repository", serviceRegistry, commandService, preferences, searcher, explorer); //$NON-NLS-0$
	
	// define commands
	mGitCommands.createFileCommands(serviceRegistry, commandService, explorer, "pageActions", "selectionTools"); //$NON-NLS-1$ //$NON-NLS-0$
	mGitCommands.createGitClonesCommands(serviceRegistry, commandService, explorer, "pageActions", "selectionTools", fileClient); //$NON-NLS-1$ //$NON-NLS-0$

	// define the command contributions - where things appear, first the groups
	commandService.addCommandGroup("pageActions", "eclipse.gitGroup", 100); //$NON-NLS-1$ //$NON-NLS-0$
	commandService.addCommandGroup("pageActions", "eclipse.gitGroup", 200); //$NON-NLS-1$ //$NON-NLS-0$
	
	commandService.registerCommandContribution("reposPageActions", "eclipse.cloneGitRepository", 100, "eclipse.gitGroup", false, null, new mCommands.URLBinding("cloneGitRepository", "url")); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	commandService.registerCommandContribution("reposPageActions", "eclipse.initGitRepository", 200, "eclipse.gitGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	
	commandService.registerCommandContribution("repoPageActions", "eclipse.orion.git.pull", 100, "eclipse.gitGroup"); //$NON-NLS-1$ //$NON-NLS-0$
	commandService.registerCommandContribution("repoPageActions", "eclipse.orion.git.applyPatch", 200, "eclipse.gitGroup"); //$NON-NLS-1$ //$NON-NLS-0$
	commandService.registerCommandContribution("repoPageActions", "eclipse.git.deleteClone", 300, "eclipse.gitGroup"); //$NON-NLS-1$ //$NON-NLS-0$
	
	commandService.registerCommandContribution("reposPageActions", "eclipse.orion.git.openCommitCommand", 1000, "eclipse.gitGroup", true,  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			new mCommands.CommandKeyBinding('h', true, true), new mCommands.URLBinding("openGitCommit", "commitName")); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

	commandService.registerCommandContribution("repoPageActions", "eclipse.orion.git.openCommitCommand", 1000, "eclipse.gitGroup", true,  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		new mCommands.CommandKeyBinding('h', true, true), new mCommands.URLBinding("openGitCommit", "commitName")); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	
	// object contributions
	commandService.registerCommandContribution("itemLevelCommands", "eclipse.openCloneContent", 100); //$NON-NLS-1$ //$NON-NLS-0$
	commandService.registerCommandContribution("itemLevelCommands", "eclipse.openGitStatus", 100); //$NON-NLS-1$ //$NON-NLS-0$
	commandService.registerCommandContribution("itemLevelCommands", "eclipse.openGitLog", 100); //$NON-NLS-1$ //$NON-NLS-0$
	commandService.registerCommandContribution("itemLevelCommands", "eclipse.orion.git.pull", 200); //$NON-NLS-1$ //$NON-NLS-0$
	commandService.registerCommandContribution("itemLevelCommands", "eclipse.removeBranch", 1000); //$NON-NLS-1$ //$NON-NLS-0$
	commandService.registerCommandContribution("itemLevelCommands", "eclipse.checkoutTag", 200); //$NON-NLS-1$ //$NON-NLS-0$
	commandService.registerCommandContribution("itemLevelCommands", "eclipse.removeTag", 1000); //$NON-NLS-1$ //$NON-NLS-0$
	commandService.registerCommandContribution("itemLevelCommands", "eclipse.checkoutBranch", 200); //$NON-NLS-1$ //$NON-NLS-0$
	commandService.registerCommandContribution("itemLevelCommands", "eclipse.orion.git.applyPatch", 300); //$NON-NLS-1$ //$NON-NLS-0$
	commandService.registerCommandContribution("itemLevelCommands", "eclipse.git.deleteClone", 1000); //$NON-NLS-1$ //$NON-NLS-0$
	commandService.registerCommandContribution("itemLevelCommands", "eclipse.orion.git.fetch", 500); //$NON-NLS-1$ //$NON-NLS-0$
	commandService.registerCommandContribution("itemLevelCommands", "eclipse.orion.git.merge", 600); //$NON-NLS-1$ //$NON-NLS-0$
	commandService.registerCommandContribution("itemLevelCommands", "eclipse.orion.git.mergeSquash", 700); //$NON-NLS-1$ //$NON-NLS-0$
	commandService.registerCommandContribution("itemLevelCommands", "eclipse.orion.git.rebase", 700); //$NON-NLS-1$ //$NON-NLS-0$
	commandService.registerCommandContribution("itemLevelCommands", "eclipse.orion.git.resetIndex", 800); //$NON-NLS-1$ //$NON-NLS-0$
	commandService.registerCommandContribution("itemLevelCommands", "eclipse.removeRemote", 1000); //$NON-NLS-1$ //$NON-NLS-0$
	commandService.registerCommandContribution("itemLevelCommands", "eclipse.orion.git.deleteConfigEntryCommand", 1000); //$NON-NLS-1$ //$NON-NLS-0$
	commandService.registerCommandContribution("itemLevelCommands", "eclipse.orion.git.editConfigEntryCommand", 200); //$NON-NLS-1$ //$NON-NLS-0$
	
	// page navigation contributions
	commandService.registerCommandContribution("pageNavigationActions", "eclipse.orion.git.previousTagPage", 1);
	commandService.registerCommandContribution("pageNavigationActions", "eclipse.orion.git.nextTagPage", 2);
	
	// add commands specific for the page	
	var viewAllCommand = new mCommands.Command({
		name : messages["View All"],
		id : "eclipse.orion.git.repositories.viewAllCommand", //$NON-NLS-0$
		hrefCallback : function(data) {
			return require.toUrl(data.items.ViewAllLink);
		},
		visibleWhen : function(item) {
		
			this.name = item.ViewAllLabel;
			this.tooltip = item.ViewAllTooltip;
			return item.ViewAllLabel && item.ViewAllTooltip && item.ViewAllLink;
		}
	});
	commandService.addCommand(viewAllCommand);
		
	// process the URL to find our bindings, since we can't be sure these bindings were defined when the URL was first processed.
	commandService.processURL(window.location.href);
	
	progress.progress(fileClient.loadWorkspace(), "Loading default workspace").then(
		function(workspace){
			explorer.setDefaultPath(workspace.Location);
			explorer.redisplay();
		}	
	);	
	
	// previously saved resource value
	var previousResourceValue = "";
	
	window.addEventListener("hashchange", function() {
		// make sure to close all parameter collectors
		commandService.closeParameterCollector();
		
		var resource = PageUtil.matchResourceParameters().resource;
		
		// do not redisplay if not necessary
		if(previousResourceValue !== resource){
			previousResourceValue = resource;
		
			progress.progress(fileClient.loadWorkspace(), "Loading default workspace").then(
				function(workspace){
					explorer.setDefaultPath(workspace.Location);
					explorer.redisplay();
				}	
			);	
		}
	}, false);
		
});

//end of define
});
