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

define(['dojo', 'orion/bootstrap', 'orion/selection', 'orion/status', 'orion/dialogs',
        'orion/ssh/sshTools', 'orion/commands', 'orion/favorites', 'orion/searchClient', 'orion/fileClient', 'orion/globalCommands',
        'orion/fileCommands', 'orion/explorer-table', 'orion/util',
        'dojo/parser', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/eWebBorderContainer'], 
		function(dojo, mBootstrap, mSelection, mStatus, mDialogs, mSsh, mCommands, mFavorites, 
				mSearchClient, mFileClient, mGlobalCommands, mFileCommands, mExplorerTable, mUtil) {

dojo.addOnLoad(function(){
	mBootstrap.startup().then(function(core) {
		var serviceRegistry = core.serviceRegistry;
		var preferences = core.preferences;
		var selection = new mSelection.Selection(serviceRegistry);		
		new mStatus.StatusReportingService(serviceRegistry, "statusPane", "notifications");
		new mDialogs.DialogService(serviceRegistry);
		new mSsh.SshService(serviceRegistry);
		
		var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry, selection: selection});
	
		
		// Favorites
		new mFavorites.FavoritesService({serviceRegistry: serviceRegistry});
		
		// Git operations
		//new eclipse.GitService(serviceRegistry);
		
		var treeRoot = {
			children:[]
		};
		var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService});
					
//		var fileServices = serviceRegistry.getServiceReferences("orion.core.file");

		var fileClient = new mFileClient.FileClient(serviceRegistry);
		
		var explorer = new mExplorerTable.FileExplorer(serviceRegistry, treeRoot, selection, searcher, fileClient, commandService, "explorer-tree", "location", "pageActions", "selectionTools");
		
		function refresh() {
//			if (dojo.hash().length === 0 && fileServices.length === 1) {
//				dojo.hash(fileServices[0].getProperty("top"));
//				return;
//			}
			explorer.loadResourceList(dojo.hash());
		}
	
		var favorites = new mFavorites.Favorites({parent: "favoriteProgress", serviceRegistry: serviceRegistry});
			
		// set up the splitter bar and its key binding
		var splitArea = dijit.byId("orion.innerNavigator");
				
		// global commands
		mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, preferences, searcher, explorer);
		// commands shared by navigators
		mFileCommands.createFileCommands(serviceRegistry, commandService, explorer, fileClient, "pageActions", "selectionTools");
		
		//TODO this should be removed and contributed by a plug-in
		//eclipse.gitCommandUtils.createFileCommands(serviceRegistry, commandService, explorer, "pageActions", "selectionTools");
		
		// navigator-specific commands
		var toggleOutlineCommand = new mCommands.Command({
			name: "Toggle Left Pane",
			tooltip: "Open or close the left pane",
			id: "eclipse.toggleSplitter",
			callback: function() {splitArea.toggle();}
		});
		commandService.addCommand(toggleOutlineCommand, "dom");
				
		// define the command contributions - where things appear, first the groups
		commandService.addCommandGroup("eclipse.fileGroup", 100, "More");
		commandService.addCommandGroup("eclipse.newResources", 100, null, "eclipse.fileGroup");
		commandService.addCommandGroup("eclipse.fileGroup.unlabeled", 100, null, null, "pageActions");
		commandService.addCommandGroup("eclipse.fileGroup.openWith", 100, "Open With", "eclipse.fileGroup");
		commandService.addCommandGroup("eclipse.gitGroup", 100, null, null, "pageActions");
		commandService.addCommandGroup("eclipse.selectionGroup", 500, "More", null, "selectionTools");
		// commands that don't appear but have keybindings
		commandService.registerCommandContribution("eclipse.toggleSplitter", 1, "eclipse.navigate-table", null, new mCommands.CommandKeyBinding('o', true),  true);
		commandService.registerCommandContribution("eclipse.copySelections", 1, "eclipse.navigate-table", null, new mCommands.CommandKeyBinding('c', true),  true);
		commandService.registerCommandContribution("eclipse.pasteSelections", 1, "eclipse.navigate-table", null, new mCommands.CommandKeyBinding('v', true),  true);
		
		// commands appearing directly in local actions column
		commandService.registerCommandContribution("eclipse.makeFavorite", 1);
		commandService.registerCommandContribution("eclipse.renameResource", 2);
		// commands appearing in nav tool bar
		commandService.registerCommandContribution("eclipse.openResource", 500, "pageActions");
		// commands appearing in local actions "More"
		commandService.registerCommandContribution("eclipse.copyFile", 1, null, "eclipse.fileGroup");
		commandService.registerCommandContribution("eclipse.moveFile", 2, null, "eclipse.fileGroup");
		commandService.registerCommandContribution("eclipse.deleteFile", 3, null, "eclipse.fileGroup");
		commandService.registerCommandContribution("eclipse.importCommand", 4, null, "eclipse.fileGroup");
		commandService.registerCommandContribution("eclipse.downloadFile", 5, null, "eclipse.fileGroup");
		commandService.registerCommandContribution("eclipse.importSFTPCommand", 6, null, "eclipse.fileGroup");
		commandService.registerCommandContribution("eclipse.exportSFTPCommand", 7, null, "eclipse.fileGroup");
		// new file and new folder in the actions column uses the labeled group
		commandService.registerCommandContribution("eclipse.newFile", 1, null, "eclipse.fileGroup/eclipse.newResources");
		commandService.registerCommandContribution("eclipse.newFolder", 2, null, "eclipse.fileGroup/eclipse.newResources");
		//new file and new folder in the nav bar do not label the group (we don't want a menu)
		commandService.registerCommandContribution("eclipse.newFile", 1, "pageActions", "eclipse.fileGroup.unlabeled");
		commandService.registerCommandContribution("eclipse.newFolder", 2, "pageActions", "eclipse.fileGroup.unlabeled");
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
				var name = mUtil.isAtRoot(item.Location) ? mUtil.getUserName() : item.Name;
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
