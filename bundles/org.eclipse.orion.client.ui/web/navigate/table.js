/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define document window eclipse orion serviceRegistry:true widgets alert URL*/
/*browser:true*/

define(['require', 'i18n!orion/navigate/nls/messages', 'orion/bootstrap', 'orion/Deferred', 'orion/i18nUtil', 'orion/webui/littlelib', 'orion/selection', 'orion/status', 'orion/progress', 'orion/dialogs',
        'orion/ssh/sshTools', 'orion/commands', 'orion/favorites', 'orion/tasks', 'orion/navoutliner', 'orion/searchClient', 'orion/fileClient', 'orion/operationsClient', 'orion/globalCommands',
        'orion/fileCommands', 'orion/explorers/explorer-table', 'orion/explorers/navigatorRenderer', 'orion/fileUtils', 'orion/PageUtil', 'orion/URITemplate', 'orion/contentTypes', 'orion/URL-shim'], 
		function(require, messages, mBootstrap, Deferred, i18nUtil, lib, mSelection, mStatus, mProgress, mDialogs, mSsh, mCommands, mFavorites, mTasks, mNavOutliner,
				mSearchClient, mFileClient, mOperationsClient, mGlobalCommands, mFileCommands, mExplorerTable, mNavigatorRenderer, mFileUtils, PageUtil, URITemplate, mContentTypes) {

	mBootstrap.startup().then(function(core) {
		var serviceRegistry = core.serviceRegistry;
		var preferences = core.preferences;
		var selection = new mSelection.Selection(serviceRegistry);
		var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
		new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var progress = new mProgress.ProgressService(serviceRegistry, operationsClient);
		new mDialogs.DialogService(serviceRegistry);
		new mSsh.SshService(serviceRegistry);
		new mFavorites.FavoritesService({serviceRegistry: serviceRegistry});
		var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry, selection: selection});
		var fileClient = new mFileClient.FileClient(serviceRegistry);
		var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});

		// global commands
		mGlobalCommands.setPageCommandExclusions(["eclipse.openWith", "orion.navigateFromMetadata"]); //$NON-NLS-1$ //$NON-NLS-0$
		mGlobalCommands.generateBanner("orion-navigate", serviceRegistry, commandService, preferences, searcher); //$NON-NLS-0$
		
		var treeRoot = {
			children:[]
		};
				
	
		var contentTypeService = new mContentTypes.ContentTypeService(serviceRegistry);
		
		var explorer = new mExplorerTable.FileExplorer({
				serviceRegistry: serviceRegistry, 
				treeRoot: treeRoot, 
				selection: selection, 
				fileClient: fileClient, 
				parentId: "explorer-tree", //$NON-NLS-0$
				dragAndDrop: mFileCommands.uploadFile,
				rendererFactory: function(explorer) {
					return new mNavigatorRenderer.NavigatorRenderer({
						checkbox: false, 
						cachePrefix: "Navigator"}, explorer, commandService, contentTypeService);  //$NON-NLS-0$
				}}); 

		function refresh() {
			var pageParams = PageUtil.matchResourceParameters();
			// TODO working around https://bugs.eclipse.org/bugs/show_bug.cgi?id=373450
			var nonHash = window.location.href.split('#')[0]; //$NON-NLS-0$
			var orionHome = new URL(require.toUrl("."), window.location).href.slice(0,-1);

			explorer.loadResourceList(pageParams.resource, false, function() {
				mGlobalCommands.setPageTarget({task: "Navigator", target: explorer.treeRoot, 
					serviceRegistry: serviceRegistry, searchService: searcher, fileService: fileClient, commandService: commandService});
				mFileCommands.updateNavTools(serviceRegistry, explorer, "pageActions", "selectionTools", explorer.treeRoot);
				var isAtRoot = mFileUtils.isAtRoot(explorer.treeRoot.Location);
				var gettingStartedNode = lib.node("gettingStartedTasks"); //$NON-NLS-0$
				if (isAtRoot && !gettingStartedNode) { 
					// create a command that represents each "orion.core.content" extension point
					var newContentContributions = serviceRegistry.getServiceReferences("orion.core.content"); //$NON-NLS-0$
					var deferreds = [];
					newContentContributions.forEach(function(contribution) {
						var d = new Deferred();
						deferreds.push(d);
						var href, hrefContent, uriTemplate = null;
						var id = contribution.getProperty("id"); //$NON-NLS-0$
						var template = contribution.getProperty("uriTemplate"); //$NON-NLS-0$
						if (template) {
							uriTemplate = new URITemplate(template);
							href = window.decodeURIComponent(uriTemplate.expand({OrionHome: orionHome}));
						}
						template = contribution.getProperty("contentURITemplate"); //$NON-NLS-0$
						if (template) {
							uriTemplate = new URITemplate(template);
							hrefContent = window.decodeURIComponent(uriTemplate.expand({OrionHome: orionHome}));
						}
						if(contribution.getProperty("nls")) {//$NON-NLS-0$
							i18nUtil.getMessageBundle(contribution.getProperty("nls")).then(function(commandMessages){ //$NON-NLS-0$
								var name = contribution.getProperty("nameKey") ? commandMessages[contribution.getProperty("nameKey")] : contribution.getProperty("name"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
								var description = contribution.getProperty("descriptionKey") ? commandMessages[contribution.getProperty("descriptionKey")] : contribution.getProperty("description"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
								var wrappingCommand = mFileCommands.createNewContentCommand(id, name, href, hrefContent, explorer, fileClient, progress); //$NON-NLS-0$
								wrappingCommand.contentDescription = description; //$NON-NLS-0$
								commandService.addCommand(wrappingCommand);
								d.resolve(wrappingCommand);
							});
						} else {
							var wrappingCommand = mFileCommands.createNewContentCommand(id, contribution.getProperty("name"), href, hrefContent, explorer, fileClient, progress); //$NON-NLS-0$
							wrappingCommand.contentDescription = contribution.getProperty("description"); //$NON-NLS-0$
							commandService.addCommand(wrappingCommand);
							d.resolve(wrappingCommand);
						}
					});
					Deferred.all(deferreds,  function(error) { return {error: error}; }).then(function(commandsOrErrors) {
						var tasks = [];
						commandsOrErrors.forEach(function(commandOrError) {
							if (commandOrError.error) {
							} else {
								tasks.push({commandId: commandOrError.id});
							}
						});
						// Add the getting started task list.  Keep it collapsed unless there is no workspace content.
						// We want project creation commands to always be valid from the task list (even if the explorer root is not the workspace.)
						// So the item we pass into the task list for validating commands is a fake object that pretends to be the workspace.
						new mTasks.TaskList({parent: "gettingStarted", id: "gettingStartedTasks", title: messages["Create new content"],  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							description: messages["Click one of the tasks below to create an Orion folder.  You can upload, import, or generate files."],
							tasks: tasks, serviceRegistry: serviceRegistry, commandService: commandService, item: {Location: "/workspace"}, handler: explorer, collapsed: false, //$NON-NLS-0$
							descriptionProperty: "contentDescription"}); //$NON-NLS-0$
					});
				} else if (gettingStartedNode) {
					lib.empty(gettingStartedNode.parentNode); 
				}
			});
		}
		refresh();
							
		// commands shared by navigators
		mFileCommands.createFileCommands(serviceRegistry, commandService, explorer, fileClient); 
		
		// define the command contributions - where things appear, first the groups
		commandService.addCommandGroup("pageActions", "orion.new", 1000, messages["New"]); //$NON-NLS-1$ //$NON-NLS-0$
		commandService.addCommandGroup("pageActions", "orion.gitGroup", 200); //$NON-NLS-1$ //$NON-NLS-0$
		commandService.addCommandGroup("selectionTools", "orion.selectionGroup", 500, messages["Actions"], null, messages["Click on an item to make a selection, then use this menu to see what actions are available."]); //$NON-NLS-1$ //$NON-NLS-0$
		commandService.addCommandGroup("selectionTools", "orion.importExportGroup", 100, null, "orion.selectionGroup");		 //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		commandService.addCommandGroup("selectionTools", "orion.newResources", 101, null, "orion.selectionGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		// commands that don't appear but have keybindings
		commandService.registerCommandContribution("pageActions", "eclipse.copySelections", 1, null, true, new mCommands.CommandKeyBinding('c', true)); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		commandService.registerCommandContribution("pageActions", "eclipse.pasteSelections", 1, null, true, new mCommands.CommandKeyBinding('v', true)); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		
		// commands appearing in nav tool bar
		commandService.registerCommandContribution("pageActions", "eclipse.openResource", 500); //$NON-NLS-1$ //$NON-NLS-0$
		
		//new file and new folder in the nav bar do not label the group (we don't want a menu)
		commandService.registerCommandContribution("pageActions", "eclipse.newFile", 1); //$NON-NLS-1$ //$NON-NLS-0$
		commandService.registerCommandContribution("pageActions", "eclipse.newFolder", 2, null, false, null, new mCommands.URLBinding("newFolder", "name")); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		commandService.registerCommandContribution("pageActions", "eclipse.upFolder", 3, null, true, new mCommands.CommandKeyBinding(38, false, false, true)); //$NON-NLS-1$ //$NON-NLS-0$
		// new project creation in the toolbar (in a group)
		commandService.registerCommandContribution("pageActions", "orion.new.project", 1, "orion.new"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		commandService.registerCommandContribution("pageActions", "orion.new.linkProject", 2, "orion.new"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	
		// selection based command contributions in nav toolbar
		commandService.registerCommandContribution("selectionTools", "orion.makeFavorite", 1, "orion.selectionGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		commandService.registerCommandContribution("selectionTools", "eclipse.renameResource", 2, "orion.selectionGroup", false, new mCommands.CommandKeyBinding(113, false, false, false, false, "explorer-tree", "Navigator")); //$NON-NLS-4$  //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		commandService.registerCommandContribution("selectionTools", "eclipse.copyFile", 3, "orion.selectionGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		commandService.registerCommandContribution("selectionTools", "eclipse.moveFile", 4, "orion.selectionGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		commandService.registerCommandContribution("selectionTools", "eclipse.deleteFile", 5, "orion.selectionGroup", false, new mCommands.CommandKeyBinding(46, false, false, false, false, "explorer-tree", "Navigator")); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		commandService.registerCommandContribution("selectionTools", "eclipse.compareWithEachOther", 6, "orion.selectionGroup");  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		commandService.registerCommandContribution("selectionTools", "eclipse.compareWith", 7, "orion.selectionGroup");  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		commandService.registerCommandContribution("selectionTools", "orion.importZipURL", 1, "orion.selectionGroup/orion.importExportGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		commandService.registerCommandContribution("selectionTools", "orion.import", 2, "orion.selectionGroup/orion.importExportGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		commandService.registerCommandContribution("selectionTools", "eclipse.downloadFile", 3, "orion.selectionGroup/orion.importExportGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		commandService.registerCommandContribution("selectionTools", "orion.importSFTP", 4, "orion.selectionGroup/orion.importExportGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		commandService.registerCommandContribution("selectionTools", "eclipse.exportSFTPCommand", 5, "orion.selectionGroup/orion.importExportGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
		mFileCommands.createAndPlaceFileCommandsExtension(serviceRegistry, commandService, explorer, "pageActions", "selectionTools", "orion.selectionGroup").then(function() {   //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			// Must happen after the above call, so that all the open with commands are registered when we create our navigation links.
			new mNavOutliner.NavigationOutliner({parent: "favorites", commandService: commandService, serviceRegistry: serviceRegistry}); //$NON-NLS-0$
		});

		window.addEventListener("hashchange", function() {refresh();}, false); //$NON-NLS-0$
	});
});
