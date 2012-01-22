/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define document dojo dijit window eclipse orion serviceRegistry:true widgets alert*/
/*browser:true*/

define(['dojo', 'dijit', 'orion/bootstrap', 'orion/selection', 'orion/status', 'orion/progress', 'orion/dialogs',
        'orion/ssh/sshTools', 'orion/commands', 'orion/favorites', 'orion/navoutliner', 'orion/searchClient', 'orion/fileClient', 'orion/operationsClient', 'orion/globalCommands',
        'orion/fileCommands', 'orion/explorer-table', 'orion/util', 'orion/contentTypes',
        'dojo/parser', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/eWebBorderContainer'], 
		function(dojo, dijit, mBootstrap, mSelection, mStatus, mProgress, mDialogs, mSsh, mCommands, mFavorites, mNavOutliner,
				mSearchClient, mFileClient, mOperationsClient, mGlobalCommands, mFileCommands, mExplorerTable, mUtil, mContentTypes) {

dojo.addOnLoad(function(){
	mBootstrap.startup().then(function(core) {
		var serviceRegistry = core.serviceRegistry;
		var preferences = core.preferences;
		var selection = new mSelection.Selection(serviceRegistry);
		var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
		new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications");
		new mProgress.ProgressService(serviceRegistry, operationsClient);
		new mDialogs.DialogService(serviceRegistry);
		new mSsh.SshService(serviceRegistry);
		new mFavorites.FavoritesService({serviceRegistry: serviceRegistry});
		var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry, selection: selection});
		
		// Git operations
		//new eclipse.GitService(serviceRegistry);
		
		var treeRoot = {
			children:[]
		};
		var fileClient = new mFileClient.FileClient(serviceRegistry);
		var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
					
//		var fileServices = serviceRegistry.getServiceReferences("orion.core.file");

		var contentTypeService = new mContentTypes.ContentTypeService(serviceRegistry);
		var explorer = new mExplorerTable.FileExplorer({serviceRegistry: serviceRegistry, treeRoot: treeRoot, selection: selection, searcher: searcher, 
				fileClient: fileClient, commandService: commandService, contentTypeService: contentTypeService,
				parentId: "explorer-tree", breadcrumbId: "location", toolbarId: "pageActions", selectionToolsId: "selectionTools"});
		
		function refresh() {
//			if (dojo.hash().length === 0 && fileServices.length === 1) {
//				dojo.hash(fileServices[0].getProperty("top"));
//				return;
//			}
			explorer.loadResourceList(dojo.hash());
		}
	
		var navOutliner = new mNavOutliner.NavigationOutliner({parent: "favoriteProgress", toolbar: "outlinerToolbar", serviceRegistry: serviceRegistry});
							
		// global commands
		mGlobalCommands.generateBanner("banner", serviceRegistry, commandService, preferences, searcher, explorer);
		// commands shared by navigators
		mFileCommands.createFileCommands(serviceRegistry, commandService, explorer, fileClient, "pageActions", "selectionTools");
		
		// navigator-specific commands
		var toggleOutlineCommand = new mCommands.Command({
			name: "Toggle Left Pane",
			tooltip: "Open or close the left pane",
			id: "eclipse.toggleSplitter",
			callback: function() {
				var splitArea = dijit.byId("orion.innerNavigator");
				splitArea.toggle();}
		});
		commandService.addCommand(toggleOutlineCommand, "dom");
				
		// define the command contributions - where things appear, first the groups
		commandService.addCommandGroup("eclipse.fileGroup", 100, "*");  // TODO: '*' is a total undocumented hack
		commandService.addCommandGroup("eclipse.importExportGroup", 100, null, "eclipse.fileGroup");		
		commandService.addCommandGroup("eclipse.newResources", 101, null, "eclipse.fileGroup");
		commandService.addCommandGroup("eclipse.fileGroup.unlabeled", 100, null, null, "pageActions");
		commandService.addCommandGroup("eclipse.fileGroup.openWith", 100, "Open With", "eclipse.fileGroup");
		commandService.addCommandGroup("eclipse.gitGroup", 200, null, null, "pageActions");
		commandService.addCommandGroup("eclipse.selectionGroup", 500, "More", null, "selectionTools");
		// commands that don't appear but have keybindings
		commandService.registerCommandContribution("eclipse.toggleSplitter", 1, "pageActions", null, true, new mCommands.CommandKeyBinding('o', true));
		commandService.registerCommandContribution("eclipse.copySelections", 1, "pageActions", null, true, new mCommands.CommandKeyBinding('c', true));
		commandService.registerCommandContribution("eclipse.pasteSelections", 1, "pageActions", null, true, new mCommands.CommandKeyBinding('v', true));
		
		// commands appearing directly in local actions column.  Currently we are putting everything in the menu.
		// commandService.registerCommandContribution("eclipse.makeFavorite", 1);

		// commands appearing in nav tool bar
		commandService.registerCommandContribution("eclipse.openResource", 500, "pageActions");
		// commands appearing in local actions menu
		commandService.registerCommandContribution("eclipse.makeFavorite", 1, null, "eclipse.fileGroup");
		commandService.registerCommandContribution("eclipse.renameResource", 2, null, "eclipse.fileGroup");
		commandService.registerCommandContribution("eclipse.copyFile", 3, null, "eclipse.fileGroup");
		commandService.registerCommandContribution("eclipse.moveFile", 4, null, "eclipse.fileGroup");
		commandService.registerCommandContribution("eclipse.deleteFile", 5, null, "eclipse.fileGroup");
		commandService.registerCommandContribution("eclipse.importCommand", 1, null, "eclipse.fileGroup/eclipse.importExportGroup");
		commandService.registerCommandContribution("eclipse.downloadFile", 2, null, "eclipse.fileGroup/eclipse.importExportGroup");
		commandService.registerCommandContribution("eclipse.importSFTPCommand", 3, null, "eclipse.fileGroup/eclipse.importExportGroup");
		commandService.registerCommandContribution("eclipse.exportSFTPCommand", 4, null, "eclipse.fileGroup/eclipse.importExportGroup");
		// new file and new folder in the actions column uses the labeled group
		commandService.registerCommandContribution("eclipse.newFile", 1, null, "eclipse.fileGroup/eclipse.newResources");
		commandService.registerCommandContribution("eclipse.newFolder", 2, null, "eclipse.fileGroup/eclipse.newResources");
		//new file and new folder in the nav bar do not label the group (we don't want a menu)
		commandService.registerCommandContribution("eclipse.newFile", 1, "pageActions", "eclipse.fileGroup.unlabeled");
		commandService.registerCommandContribution("eclipse.newFolder", 2, "pageActions", "eclipse.fileGroup.unlabeled", false, null, new mCommands.URLBinding("newFolder", "name"));
		commandService.registerCommandContribution("eclipse.upFolder", 3, "pageActions", "eclipse.fileGroup.unlabeled", false, new mCommands.CommandKeyBinding(38, false, false, true));
		commandService.registerCommandContribution("eclipse.newProject", 3, "pageActions", "eclipse.fileGroup.unlabeled");
		commandService.registerCommandContribution("eclipse.linkProject", 4, "pageActions", "eclipse.fileGroup.unlabeled");
		// selection based command contributions in nav toolbar
		commandService.registerCommandContribution("eclipse.copyFile", 1, "selectionTools", "eclipse.selectionGroup");
		commandService.registerCommandContribution("eclipse.moveFile", 2, "selectionTools", "eclipse.selectionGroup");
		commandService.registerCommandContribution("eclipse.deleteFile", 3, "selectionTools", "eclipse.selectionGroup");
		// git contributions
		// commandService.registerCommandContribution("eclipse.cloneGitRepository", 100, "pageActions", "eclipse.gitGroup");
			
		mFileCommands.createAndPlaceFileCommandsExtension(serviceRegistry, commandService, explorer, "pageActions", "selectionTools", "eclipse.fileGroup", "eclipse.selectionGroup");

		// when new item is fetched, display it in the page title
		dojo.connect(explorer, "onchange", function(item) {
			var title = "Navigator";
			if (item) {
				var name = mUtil.isAtRoot(item.Location) ? fileClient.fileServiceName(item.Location) : item.Name;
				if (name) {
					title = "/" + name + " - " + title;
				}
			}
			document.title = title;
		});

		//every time the user manually changes the hash, we need to load the workspace with that name
		dojo.subscribe("/dojo/hashchange", explorer, function() {
			refresh();
		});
		refresh();
		document.body.style.visibility = "visible";
		dojo.parser.parse();
	});
});

});
