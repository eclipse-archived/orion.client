/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

var eclipse;
/*global define document dojo dijit serviceRegistry:true */
/*browser:true*/
define(['i18n!git/nls/gitmessages', 'require', 'dojo', 'orion/bootstrap', 'orion/status', 'orion/progress', 'orion/commands', 'orion/dialogs', 'orion/selection',
	'orion/fileClient', 'orion/operationsClient', 'orion/searchClient', 'orion/globalCommands',
	'orion/git/gitStatusExplorer', 'orion/git/gitCommands', 'orion/git/gitClient', 'orion/ssh/sshTools', 'orion/links', 'orion/contentTypes',
	'dojo/parser', 'dojo/hash', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/eWebBorderContainer'],
	function(messages, require, dojo, mBootstrap, mStatus, mProgress, mCommands, mDialogs, mSelection,
		mFileClient, mOperationsClient, mSearchClient, mGlobalCommands,
		mGitStatusExplorer, mGitCommands, mGitClient, mSshTools, mLinks, mContentTypes) {

	mBootstrap.startup().then(function(core) {
		var serviceRegistry = core.serviceRegistry;
		var preferences = core.preferences;
		document.body.style.visibility = "visible";
		dojo.parser.parse();

		new mDialogs.DialogService(serviceRegistry);
		var selection = new mSelection.Selection(serviceRegistry);
		new mSshTools.SshService(serviceRegistry);
		var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
		var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
		new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea");
		new mProgress.ProgressService(serviceRegistry, operationsClient);

		// ...
		var linkService = new mLinks.TextLinkService({serviceRegistry: serviceRegistry});
		var gitClient = new mGitClient.GitService(serviceRegistry);
		var fileClient = new mFileClient.FileClient(serviceRegistry);
		var contentTypeService = new mContentTypes.ContentTypeService(serviceRegistry);
		var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});

		var explorer = new mGitStatusExplorer.GitStatusExplorer(serviceRegistry, commandService, linkService, /* selection */ null, "artifacts", "pageActions", null, "itemLevelCommands");
		mGlobalCommands.generateBanner("banner", serviceRegistry, commandService, preferences, searcher, explorer);

		// define commands
		mGitCommands.createFileCommands(serviceRegistry, commandService, explorer, "pageActions", "selectionTools");
		mGitCommands.createGitClonesCommands(serviceRegistry, commandService, explorer, "pageActions", "selectionTools", fileClient);
		mGitCommands.createGitStatusCommands(serviceRegistry, commandService, explorer, "pageActions", "selectionTools", fileClient);

		// define the command contributions - where things appear, first the groups
		commandService.addCommandGroup("pageActions", "eclipse.gitGroup", 100);
		commandService.registerCommandContribution("pageActions", "eclipse.orion.git.showContent", 300, null,true,new mCommands.CommandKeyBinding('e', true, true));

		// object contributions
		commandService.registerCommandContribution("pageActions", "eclipse.orion.git.resetCommand", 100, "eclipse.gitGroup");
		
		// add commands specific for the page	
		var viewAllCommand = new mCommands.Command({
			name : "View All",
			id : "eclipse.orion.git.repositories.viewAllCommand",
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

		explorer.display(dojo.hash());

		//every time the user manually changes the hash, we need to load the commit with that name
		dojo.subscribe("/dojo/hashchange", explorer, function() {
			explorer.display(dojo.hash());
		});
	});
}); //end of define
