/*******************************************************************************
 * @license Copyright (c) 2011, 2012 IBM Corporation and others. All rights
 *          reserved. This program and the accompanying materials are made
 *          available under the terms of the Eclipse Public License v1.0
 *          (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse
 *          Distribution License v1.0
 *          (http://www.eclipse.org/org/documents/edl-v10.html).
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

var eclipse;

define([ 'i18n!git/nls/gitmessages', 'require', 'orion/bootstrap', 'orion/status', 'orion/progress', 'orion/commands', 'orion/dialogs', 'orion/selection',
		'orion/fileClient', 'orion/operationsClient', 'orion/searchClient', 'orion/globalCommands', 'orion/git/gitCommitExplorer', 'orion/git/gitCommands',
		'orion/git/gitClient', 'orion/links', 'orion/contentTypes', 'orion/PageUtil' ], function(messages, require, mBootstrap, mStatus, mProgress, mCommands,
		mDialogs, mSelection, mFileClient, mOperationsClient, mSearchClient, mGlobalCommands, mGitCommitExplorer, mGitCommands, mGitClient, mLinks,
		mContentTypes, PageUtil) {

	mBootstrap.startup().then(
			function(core) {
				var serviceRegistry = core.serviceRegistry;
				var preferences = core.preferences;

				new mDialogs.DialogService(serviceRegistry);
				var selection = new mSelection.Selection(serviceRegistry);
				var commandService = new mCommands.CommandService({ serviceRegistry : serviceRegistry
				});
				var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
				new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				new mProgress.ProgressService(serviceRegistry, operationsClient);

				// ...
				var linkService = new mLinks.TextLinkService({ serviceRegistry : serviceRegistry
				});
				var gitClient = new mGitClient.GitService(serviceRegistry);
				var fileClient = new mFileClient.FileClient(serviceRegistry);
				var contentTypeService = new mContentTypes.ContentTypeService(serviceRegistry);
				var searcher = new mSearchClient.Searcher({ serviceRegistry : serviceRegistry,
				commandService : commandService,
				fileService : fileClient
				});

				var explorer = new mGitCommitExplorer.GitCommitExplorer(serviceRegistry, commandService, linkService, /* selection */null,
						"artifacts", "pageActions", null, "itemLevelCommands"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				mGlobalCommands.generateBanner("orion-git-commit", serviceRegistry, commandService, preferences, searcher, explorer); //$NON-NLS-0$

				// define commands
				mGitCommands.createFileCommands(serviceRegistry, commandService, explorer, "pageActions", "selectionTools"); //$NON-NLS-1$ //$NON-NLS-0$
				mGitCommands.createGitClonesCommands(serviceRegistry, commandService, explorer, "pageActions", "selectionTools", fileClient); //$NON-NLS-1$ //$NON-NLS-0$

				// define the command contributions - where things appear, first
				// the groups
				commandService.addCommandGroup("pageActions", "eclipse.gitGroup", 100); //$NON-NLS-1$ //$NON-NLS-0$
				commandService.registerCommandContribution("pageActions", "eclipse.orion.git.cherryPick", 100, "eclipse.gitGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				commandService.registerCommandContribution("pageActions", "eclipse.orion.git.askForReviewCommand", 101, "eclipse.gitGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				commandService.registerCommandContribution(
						"pageActions", "eclipse.orion.git.openCommitCommand", 102, "eclipse.gitGroup", true, new mCommands.CommandKeyBinding('h', true, true)); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

				// object contributions
				commandService.registerCommandContribution("itemLevelCommands", "eclipse.removeTag", 1000); //$NON-NLS-1$ //$NON-NLS-0$

				var showDiffCommand = new mCommands.Command({ name : messages["Working Directory Version"],
				tooltip : messages["View the working directory version of the file"],
				imageClass : "git-sprite-open_compare", //$NON-NLS-0$
				spriteClass : "gitCommandSprite", //$NON-NLS-0$
				id : "eclipse.orion.git.diff.showCurrent", //$NON-NLS-0$
				hrefCallback : function(data) {
					return require.toUrl("edit/edit.html") + "#" + data.items.ContentLocation; //$NON-NLS-1$ //$NON-NLS-0$
				},
				visibleWhen : function(item) {
					return item.Type === "Diff"; //$NON-NLS-0$
				}
				});

				commandService.addCommand(showDiffCommand);
				commandService.registerCommandContribution("itemLevelCommands", "eclipse.orion.git.diff.showCurrent", 2000); //$NON-NLS-1$ //$NON-NLS-0$

				var pageParams = PageUtil.matchResourceParameters();
				explorer.display(pageParams.resource);

				window.addEventListener("hashchange", function() {
					var pageParams = PageUtil.matchResourceParameters();
					explorer.display(pageParams.resource);
				}, false);
			});
}); // end of define
