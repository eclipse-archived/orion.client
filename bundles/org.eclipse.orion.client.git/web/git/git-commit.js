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

var eclipse;
/*global define document dojo dijit serviceRegistry:true */
/*browser:true*/
define(['dojo', 'orion/bootstrap', 'orion/status', 'orion/progress', 'orion/commands', 'orion/dialogs', 'orion/selection',
	'orion/fileClient', 'orion/operationsClient', 'orion/searchClient', 'orion/globalCommands',
	'orion/git/gitCommitExplorer', 'orion/git/gitCommands', 'orion/git/gitClient', 'orion/links',
	'dojo/parser', 'dojo/hash', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/eWebBorderContainer'],
	function(dojo, mBootstrap, mStatus, mProgress, mCommands, mDialogs, mSelection,
		mFileClient, mOperationsClient, mSearchClient, mGlobalCommands,
		mGitCommitExplorer, mGitCommands, mGitClient, mLinks) {

	mBootstrap.startup().then(function(core) {
		var serviceRegistry = core.serviceRegistry;
		var preferences = core.preferences;
		document.body.style.visibility = "visible";
		dojo.parser.parse();

		new mStatus.StatusReportingService(serviceRegistry, "statusPane", "notifications");
		new mDialogs.DialogService(serviceRegistry);
		var selection = new mSelection.Selection(serviceRegistry);
		var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
		var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
		new mProgress.ProgressService(serviceRegistry, operationsClient);

		// ...
		var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry});
		var linkService = new mLinks.TextLinkService({serviceRegistry: serviceRegistry});
		var gitClient = new mGitClient.GitService(serviceRegistry);
		var fileClient = new mFileClient.FileClient(serviceRegistry);

		var explorer = new mGitCommitExplorer.GitCommitExplorer(serviceRegistry, linkService, /* selection */ null, "artifacts", "pageActions"/*, "selectionTools"*/);
		mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, preferences, searcher, explorer);

		// define commands
		mGitCommands.createFileCommands(serviceRegistry, commandService, explorer, "pageActions", "selectionTools");
		mGitCommands.createGitClonesCommands(serviceRegistry, commandService, explorer, "pageActions", "selectionTools", fileClient);

		// define the command contributions - where things appear, first the groups

		// object contributions
		commandService.registerCommandContribution("eclipse.openCloneContent", 100);

		commandService.registerCommandContribution("eclipse.removeTag", 1000);

		explorer.displayCommit(dojo.hash());

		//every time the user manually changes the hash, we need to load the commit with that name
		dojo.subscribe("/dojo/hashchange", explorer, function() {
			explorer.displayCommit(dojo.hash());
		});
	});
}); //end of define
