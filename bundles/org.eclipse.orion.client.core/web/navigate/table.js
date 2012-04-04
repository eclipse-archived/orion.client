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
        'orion/fileCommands', 'orion/explorer-table', 'orion/util', 'orion/PageUtil','orion/contentTypes', 'orion/siteService', 'orion/siteCommands',
        'dojo/parser', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/eWebBorderContainer'], 
		function(dojo, dijit, mBootstrap, mSelection, mStatus, mProgress, mDialogs, mSsh, mCommands, mFavorites, mNavOutliner,
				mSearchClient, mFileClient, mOperationsClient, mGlobalCommands, mFileCommands, mExplorerTable, mUtil, PageUtil, mContentTypes, mSiteService, mSiteCommands) {

dojo.addOnLoad(function(){
	mBootstrap.startup().then(function(core) {
		var serviceRegistry = core.serviceRegistry;
		var preferences = core.preferences;
		var selection = new mSelection.Selection(serviceRegistry);
		var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
		new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea");
		new mProgress.ProgressService(serviceRegistry, operationsClient);
		new mDialogs.DialogService(serviceRegistry);
		new mSsh.SshService(serviceRegistry);
		new mFavorites.FavoritesService({serviceRegistry: serviceRegistry});
		var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry, selection: selection});
		new mSiteService.SiteService(serviceRegistry);
		
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
				parentId: "explorer-tree", breadcrumbId: "location", toolbarId: "pageActions", selectionToolsId: "selectionTools", preferences: preferences});
		
		function refresh() {
			var pageParams = PageUtil.matchResourceParameters();
			explorer.loadResourceList(pageParams.resource, false, function() {
				mGlobalCommands.setPageTarget(explorer.treeRoot, serviceRegistry, commandService, null, /* favorites target */explorer.treeRoot);
			});
		}
	
		var navOutliner = new mNavOutliner.NavigationOutliner({parent: "favoriteProgress", toolbar: "outlinerToolbar", serviceRegistry: serviceRegistry});
							
		// global commands
		mGlobalCommands.setPageCommandExclusions(["eclipse.openWith", "orion.navigateFromFileMetadata"]);
		mGlobalCommands.generateBanner("banner", serviceRegistry, commandService, preferences, searcher, explorer);
		// commands shared by navigators
		mFileCommands.createFileCommands(serviceRegistry, commandService, explorer, fileClient, "pageActions", "selectionTools");
		
		// navigator-specific commands
		var toggleOutlineCommand = new mCommands.Command({
			name: "Toggle Left Pane",
			tooltip: "Open or close the left pane",
			id: "eclipse.toggleSplitter",
			callback: function() {
				var splitArea = dijit.byId("eclipse.navigate-table");
				splitArea.toggle();}
		});
		commandService.addCommand(toggleOutlineCommand);
				
		// define the command contributions - where things appear, first the groups
		commandService.addCommandGroup("fileFolderCommands", "eclipse.fileGroup", 100, "*");  // TODO: '*' is a total undocumented hack
		commandService.addCommandGroup("fileFolderCommands", "eclipse.importExportGroup", 100, null, "eclipse.fileGroup");		
		commandService.addCommandGroup("fileFolderCommands", "eclipse.newResources", 101, null, "eclipse.fileGroup");
		commandService.addCommandGroup("pageActions", "eclipse.fileGroup.unlabeled", 100);
		commandService.addCommandGroup("pageActions", "eclipse.gitGroup", 200);
		commandService.addCommandGroup("selectionTools", "eclipse.selectionGroup", 500, "More");
		// commands that don't appear but have keybindings
		commandService.registerCommandContribution("pageActions", "eclipse.toggleSplitter", 1, null, true, new mCommands.CommandKeyBinding('o', true));
		commandService.registerCommandContribution("pageActions", "eclipse.copySelections", 1, null, true, new mCommands.CommandKeyBinding('c', true));
		commandService.registerCommandContribution("pageActions", "eclipse.pasteSelections", 1, null, true, new mCommands.CommandKeyBinding('v', true));
		
		// commands appearing in nav tool bar
		commandService.registerCommandContribution("pageActions", "eclipse.openResource", 500);
		
		// favorites has been defined at the global level and we need to contribute it here
		commandService.registerCommandContribution("fileFolderCommands", "orion.makeFavorite", 1, "eclipse.fileGroup");
		commandService.registerCommandContribution("fileFolderCommands", "eclipse.renameResource", 2, "eclipse.fileGroup");
		commandService.registerCommandContribution("fileFolderCommands", "eclipse.copyFile", 3, "eclipse.fileGroup");
		commandService.registerCommandContribution("fileFolderCommands", "eclipse.moveFile", 4, "eclipse.fileGroup");
		commandService.registerCommandContribution("fileFolderCommands", "eclipse.deleteFile", 5, "eclipse.fileGroup");
		commandService.registerCommandContribution("fileFolderCommands", "eclipse.importCommand", 1, "eclipse.fileGroup/eclipse.importExportGroup");
		commandService.registerCommandContribution("fileFolderCommands", "eclipse.downloadFile", 2, "eclipse.fileGroup/eclipse.importExportGroup");
		commandService.registerCommandContribution("fileFolderCommands", "eclipse.importSFTPCommand", 3, "eclipse.fileGroup/eclipse.importExportGroup");
		commandService.registerCommandContribution("fileFolderCommands", "eclipse.exportSFTPCommand", 4, "eclipse.fileGroup/eclipse.importExportGroup");
		commandService.registerCommandContribution("fileFolderCommands", "orion.site.viewon", 5, "eclipse.fileGroup");
		// new file and new folder in the actions column uses the labeled group
		commandService.registerCommandContribution("fileFolderCommands", "eclipse.newFile", 1, "eclipse.fileGroup/eclipse.newResources");
		commandService.registerCommandContribution("fileFolderCommands", "eclipse.newFolder", 2, "eclipse.fileGroup/eclipse.newResources");
		//new file and new folder in the nav bar do not label the group (we don't want a menu)
		commandService.registerCommandContribution("pageActions", "eclipse.newFile", 1, "eclipse.fileGroup.unlabeled");
		commandService.registerCommandContribution("pageActions", "eclipse.newFolder", 2, "eclipse.fileGroup.unlabeled", false, null, new mCommands.URLBinding("newFolder", "name"));
		commandService.registerCommandContribution("pageActions", "eclipse.upFolder", 3, "eclipse.fileGroup.unlabeled", false, new mCommands.CommandKeyBinding(38, false, false, true));
		commandService.registerCommandContribution("pageActions", "eclipse.newProject", 3, "eclipse.fileGroup.unlabeled");
		commandService.registerCommandContribution("pageActions", "eclipse.linkProject", 4, "eclipse.fileGroup.unlabeled");
		// selection based command contributions in nav toolbar
		commandService.registerCommandContribution("selectionTools", "eclipse.copyFile", 1, "eclipse.selectionGroup");
		commandService.registerCommandContribution("selectionTools", "eclipse.moveFile", 2, "eclipse.selectionGroup");
		commandService.registerCommandContribution("selectionTools", "eclipse.deleteFile", 3, "eclipse.selectionGroup");
			
		mFileCommands.createAndPlaceFileCommandsExtension(serviceRegistry, commandService, explorer, "pageActions", "selectionTools", "eclipse.fileGroup", "eclipse.selectionGroup");
		mSiteCommands.createSiteCommands(serviceRegistry);

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
