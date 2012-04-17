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

/*global window define document dijit */
/*browser:true*/
define(['require', 'dojo', 'orion/bootstrap', 'orion/status', 'orion/progress', 'orion/commands',
        'orion/auth', 'orion/dialogs', 'orion/selection', 'orion/fileClient', 'orion/operationsClient', 'orion/searchClient', 'orion/globalCommands', 'orion/git/gitClient',
        'orion/breadcrumbs', 'orion/ssh/sshTools', 'orion/git/git-commit-navigator', 'orion/git/gitCommands',
	    'orion/links', 'dojo/parser', 'dojo/hash', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/eWebBorderContainer'], 
		function(require, dojo, mBootstrap, mStatus, mProgress, mCommands, mAuth, mDialogs, mSelection, mFileClient, mOperationsClient,
					mSearchClient, mGlobalCommands, mGitClient, mBreadcrumbs, mSshTools, mGitCommitNavigator, mGitCommands, mLinks) {

// TODO: This is naughty -- feel bad and then fix it please
var serviceRegistry;
	
	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			document.body.style.visibility = "visible";
			dojo.parser.parse();
			
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea");
			new mProgress.ProgressService(serviceRegistry, operationsClient);
			new mDialogs.DialogService(serviceRegistry);
			var selection = new mSelection.Selection(serviceRegistry);
			new mSshTools.SshService(serviceRegistry);
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry, selection: selection});
			var linkService = new mLinks.TextLinkService({serviceRegistry: serviceRegistry});
		
			// Git operations
			var gitClient = new mGitClient.GitService(serviceRegistry);
			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, fileService: fileClient, commandService: commandService});

			// Commit navigator
			var navigator = new mGitCommitNavigator.GitCommitNavigator(serviceRegistry, selection, null, "explorer-tree", "pageTitle", "pageActions", "selectionTools", "pageNavigationActions", "itemLevelCommands");
			
			mGlobalCommands.setPageCommandExclusions(["eclipse.git.remote", "eclipse.git.log"]);
			// global commands
			mGlobalCommands.generateBanner("banner", serviceRegistry, commandService, preferences, searcher, navigator);
			
			//TODO this should be removed and contributed by a plug-in
			mGitCommands.createFileCommands(serviceRegistry, commandService, navigator, "pageActions", "selectionTools");
			
			// define the command contributions - where things appear, first the groups
			commandService.addCommandGroup("itemLevelCommands", "eclipse.gitGroup.nav", 200, "More");
			commandService.addCommandGroup("pageActions", "eclipse.gitGroup.page", 100);
			commandService.addCommandGroup("selectionTools", "eclipse.selectionGroup", 500, "More");
			
			// commands appearing directly in local actions column
			commandService.registerCommandContribution("itemLevelCommands", "eclipse.openGitCommit", 1);
			commandService.registerCommandContribution("itemLevelCommands", "eclipse.compareWithWorkingTree", 2);
		
			// selection based command contributions in nav toolbar
			commandService.registerCommandContribution("selectionTools", "eclipse.compareGitCommits", 1, "eclipse.selectionGroup");
			
			// git contributions
			commandService.registerCommandContribution("pageActions", "eclipse.orion.git.fetch", 100, "eclipse.gitGroup.page");
			commandService.registerCommandContribution("pageActions", "eclipse.orion.git.fetchForce", 100, "eclipse.gitGroup.page");
			commandService.registerCommandContribution("pageActions", "eclipse.orion.git.merge", 100, "eclipse.gitGroup.page");
			commandService.registerCommandContribution("pageActions", "eclipse.orion.git.switchToCurrentLocal", 100, "eclipse.gitGroup.page");	
			commandService.registerCommandContribution("pageActions", "eclipse.orion.git.push", 100, "eclipse.gitGroup.page");
			commandService.registerCommandContribution("pageActions", "eclipse.orion.git.pushForce", 100, "eclipse.gitGroup.page");
			commandService.registerCommandContribution("pageActions", "eclipse.orion.git.switchToRemote", 100, "eclipse.gitGroup.page");
			commandService.registerCommandContribution("itemLevelCommands", "eclipse.orion.git.addTag", 3);
			commandService.registerCommandContribution("itemLevelCommands", "eclipse.orion.git.cherryPick", 3);
			// page navigation actions
			commandService.registerCommandContribution("pageNavigationActions", "eclipse.orion.git.previousLogPage", 1);
			commandService.registerCommandContribution("pageNavigationActions", "eclipse.orion.git.nextLogPage", 2);

			loadResource(navigator, searcher, commandService);
		
			// every time the user manually changes the hash, we need to load the
			// workspace with that name
			dojo.subscribe("/dojo/hashchange", navigator, function() {
				loadResource(navigator, searcher, commandService);
			});
		});
	});

function loadResource(navigator, searcher, commandService){
	var path = dojo.hash();
	dojo.place(document.createTextNode("Loading git log..."), "explorer-tree", "only");
	
	var gitService = serviceRegistry.getService("orion.git.provider");
	gitService.doGitLog(path).then(
		 function(resource, secondArg) {
				//TODO if this were in the scope of the onload above, we would have the right file client instance.  Shouldn't need to
				// create one each time.
				var fileClient = new mFileClient.FileClient(serviceRegistry);
				initTitleBar(fileClient, navigator, resource, searcher, commandService).then(
					function(){
						if (resource.Type === "RemoteTrackingBranch"){
							dojo.place(document.createTextNode("Getting git incoming changes..."), "explorer-tree", "only");
							gitService.getLog(resource.HeadLocation, resource.Id).then(function(scopedCommitsJsonData) {
									navigator.renderer.setIncomingCommits(scopedCommitsJsonData.Children);
									navigator.renderer.setOutgoingCommits([]);
									gitService.doGitLog(resource.CommitLocation + "?" + new dojo._Url(path).query).then(function(jsonData) {
										resource.Children = jsonData.Children;
										if(jsonData.NextLocation){
											resource.NextLocation = resource.Location + "?" + new dojo._Url(jsonData.NextLocation).query;
										}
										if(jsonData.PreviousLocation ){
											resource.PreviousLocation  = resource.Location + "?" + new dojo._Url(jsonData.PreviousLocation).query;
										}
										navigator.loadCommitsList(resource.CommitLocation + "?" + new dojo._Url(path).query, resource);															
									});
							});
						} else if (resource.toRef){
							if (resource.toRef.RemoteLocation && resource.toRef.RemoteLocation.length===1 && resource.toRef.RemoteLocation[0].Children && resource.toRef.RemoteLocation[0].Children.length===1){
								gitService.getGitRemote(resource.toRef.RemoteLocation[0].Children[0].Location).then(
									function(remoteJsonData, secondArg) {
										dojo.place(document.createTextNode("Getting git incoming changes..."), "explorer-tree", "only");
										gitService.getLog(remoteJsonData.CommitLocation, "HEAD").then(function(scopedCommitsJsonData) {
												navigator.renderer.setIncomingCommits([]);
												navigator.renderer.setOutgoingCommits(scopedCommitsJsonData.Children);
												navigator.loadCommitsList(dojo.hash(), resource);
										});
									},
									function(error, ioArgs){
										navigator.loadCommitsList(dojo.hash(), resource);
									});
								}
							else
								navigator.loadCommitsList(dojo.hash(), resource);
						} else {
							navigator.loadCommitsList(dojo.hash(), resource);
						}
					}
				);
		},
		function(error, ioArgs) {
				navigator.loadCommitsList(dojo.hash(), error);	
		});
}

function getCloneFileUri(){
	var path = dojo.hash().split("gitapi/commit/");
	if(path.length === 2){
		path = path[1].split("/");
		if(path.length > 1){
			fileURI="";
			for(var i=0; i<path.length-1; i++){
				fileURI+= "/" + path[i];
			}
			fileURI+="/" + path[path.length-1].split("?")[0];
		}
	}
	return fileURI;
}

function getHeadFileUri(){
	var path = dojo.hash().split("gitapi/commit/");
	if(path.length === 2){
		path = path[1].split("/");
		if(path.length > 1){
			branch = path[0];
			fileURI="";
			for(var i=1; i<path.length-1; i++){
				//first segment is a branch name
				fileURI+= "/" + path[i];
			}
			fileURI+="/" + path[path.length-1].split("?")[0];
		}
	}
	return fileURI;
}

function getRemoteFileURI(){
	var path = dojo.hash().split("gitapi/remote/");
	if(path.length === 2){
		path = path[1].split("/");
		if(path.length > 2){
			branch = path[0]+"/"+path[1];
			fileURI="";
			for(var i=2; i<path.length-1; i++){
				//first two segments are a branch name
				fileURI+= "/" + path[i];
			}
			fileURI+="/" + path[path.length-1].split("?")[0];
		}
	}
	return fileURI;
}

function initTitleBar(fileClient, navigator, item, searcher, commandService){
	
	var deferred = new dojo.Deferred();
	
	var isRemote = (item.Type === "RemoteTrackingBranch");
	var isBranch = (item.toRef && item.toRef.Type === "Branch");
	
	//TODO we are calculating file path from the URL, it should be returned by git API
	var fileURI;
	if (isRemote)
		fileURI = getRemoteFileURI();
	else if (isBranch)
		fileURI = getHeadFileUri();
	else
		fileURI = getCloneFileUri();
	
	if(fileURI){
		fileClient.read(fileURI, true).then(
			dojo.hitch(this, function(metadata) {
				mGlobalCommands.setPageTarget(metadata, serviceRegistry, commandService); 
				var branchName;
				if (isRemote)
					branchName = item.Name;
				else if (isBranch)
					branchName = item.toRef.Name;
				else
					branchName = null;

				if(item && item.CloneLocation){
					var cloneURI = item.CloneLocation;
					
					serviceRegistry.getService("orion.git.provider").getGitClone(cloneURI).then(function(jsonData){
						if(jsonData.Children && jsonData.Children.length>0) {
							setPageTitle(branchName, jsonData.Children[0].Name, jsonData.Children[0].Location, isRemote, isBranch);
						} else {
							setPageTitle(branchName, jsonData.Name, jsonData.Location, isRemote, isBranch);
						}
					});
				}else{
					setPageTitle(branchName);
				}
				var location = dojo.byId("location");
				if (location) {
					//If current location is not the root, set the search location in the searcher
					searcher.setLocationByMetaData(metadata);
					dojo.empty(location);
					var breadcrumb = new mBreadcrumbs.BreadCrumbs({
						container: "location",
						resource: metadata ,
						makeHref:function(seg,location){makeHref(fileClient, seg,location, isRemote);
						}
					});
				}
				navigator.isDirectory = metadata.Directory;
				mGitCommands.updateNavTools(serviceRegistry, navigator, "pageActions", "selectionTools", navigator._lastTreeRoot);
				navigator.updateCommands();
				
				deferred.callback();
			}),
			dojo.hitch(this, function(error) {
				deferred.errback(error);
			})
		);
	} else {
		deferred.callback();
	}
	
	return deferred;
};

function makeHref(fileClient, seg, location, isRemote) {
	if (!location) {
		return;
	}
	
	fileClient.read(location, true).then(dojo.hitch(this, function(metadata) {
		if (isRemote) {
			var gitService = serviceRegistry.getService("orion.git.provider");
			if (metadata.Git) {
				gitService.getDefaultRemoteBranch(metadata.Git.RemoteLocation).then(function(defaultRemoteBranchJsonData, secondArg) {
					seg.href = require.toUrl("git/git-log.html") + "#" + defaultRemoteBranchJsonData.Location + "?page=1";
				});
			}
		} else {
			if (metadata.Git)
				seg.href = require.toUrl("git/git-log.html") + "#" + metadata.Git.CommitLocation + "?page=1";
		}
	}), dojo.hitch(this, function(error) {
		console.error("Error loading file metadata: " + error.message);
	}));
}

function setPageTitle(branchName, cloneName, cloneLocation, isRemote, isBranch){
	var pageTitle = dojo.byId("pageTitle");
	
	var title = "Git Log ";
	if (isRemote)
		title += "for remote branch <b>" + branchName + "</b>";
	else if (isBranch)
		title += "for local branch <b>" + branchName + "</b>";
	
	if(cloneLocation){
		title = title + " on <a href='" + require.toUrl("git/git-repository.html") + "#" + cloneLocation + "'>" + cloneName + "</a>";
	}
	pageTitle.innerHTML = title;
	
	if(branchName){
		document.title = cloneName ? "Log for " + branchName + " on "+ cloneName + " - Git" : "Log for branch " + branchName + " - Git";
	}
}

});
