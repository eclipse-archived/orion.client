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

var eclipse;
/*global define document dojo dijit serviceRegistry:true */
/*browser:true*/
define(['require', 'dojo', 'orion/bootstrap', 'orion/status', 'orion/progress', 'orion/commands', 'orion/dialogs', 'orion/selection',
	'orion/fileClient', 'orion/operationsClient', 'orion/searchClient', 'orion/globalCommands',
	'orion/git/gitCommitExplorer', 'orion/git/gitCommands', 'orion/git/gitClient', 'orion/links', 'orion/contentTypes',
	'dojo/parser', 'dojo/hash', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/eWebBorderContainer'],
	function(require, dojo, mBootstrap, mStatus, mProgress, mCommands, mDialogs, mSelection,
		mFileClient, mOperationsClient, mSearchClient, mGlobalCommands,
		mGitCommitExplorer, mGitCommands, mGitClient, mLinks, mContentTypes) {

	mBootstrap.startup().then(function(core) {
		var serviceRegistry = core.serviceRegistry;
		var preferences = core.preferences;
		document.body.style.visibility = "visible";
		dojo.parser.parse();

		new mDialogs.DialogService(serviceRegistry);
		var selection = new mSelection.Selection(serviceRegistry);
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

		var explorer = new mGitCommitExplorer.GitCommitExplorer(serviceRegistry, commandService, linkService, /* selection */ null, "artifacts", "pageActions", null, "itemLevelCommands");
		mGlobalCommands.generateBanner("banner", serviceRegistry, commandService, preferences, searcher, explorer);

		// define commands
		mGitCommands.createFileCommands(serviceRegistry, commandService, explorer, "pageActions", "selectionTools");
		mGitCommands.createGitClonesCommands(serviceRegistry, commandService, explorer, "pageActions", "selectionTools", fileClient);

		// define the command contributions - where things appear, first the groups
		commandService.addCommandGroup("pageActions", "eclipse.gitGroup", 100);
		commandService.registerCommandContribution("pageActions", "eclipse.orion.git.cherryPick", 100, "eclipse.gitGroup");
		commandService.registerCommandContribution("pageActions", "eclipse.orion.git.openCommitCommand", 102, "eclipse.gitGroup", true, new mCommands.CommandKeyBinding('h', true, true));

		// object contributions
		commandService.registerCommandContribution("itemLevelCommands", "eclipse.removeTag", 1000);
		
		var showDiffCommand = new mCommands.Command({
			name: "Compare",
			tooltip: "View the side-by-side compare",
			imageClass: "git-sprite-open_compare",
			spriteClass: "gitCommandSprite",
			id: "eclipse.orion.git.diff.showFullCompare",
			hrefCallback: function(data) {
				return require.toUrl("compare/compare.html") +"?readonly#" + data.items.DiffLocation;
			},
			visibleWhen: function(item) {
				return item.Type === "Diff";
			}
		});		

		commandService.addCommand(showDiffCommand);
		commandService.registerCommandContribution("itemLevelCommands", "eclipse.orion.git.diff.showFullCompare", 1000);
		
		showDiffCommand = new mCommands.Command({
			name: "Working Directory Version",
			tooltip: "View the working directory version of the file",
			imageClass: "git-sprite-open_compare",
			spriteClass: "gitCommandSprite",
			id: "eclipse.orion.git.diff.showCurrent",
			hrefCallback: function(data) {
				return require.toUrl("edit/edit.html") +"#" + data.items.ContentLocation;
			},
			visibleWhen: function(item) {
				return item.Type === "Diff";
			}
		});		

		commandService.addCommand(showDiffCommand);
		commandService.registerCommandContribution("itemLevelCommands", "eclipse.orion.git.diff.showCurrent", 2000);	

		explorer.display(dojo.hash());

		//every time the user manually changes the hash, we need to load the commit with that name
		dojo.subscribe("/dojo/hashchange", explorer, function() {
			explorer.display(dojo.hash());
		});
	});
}); //end of define
