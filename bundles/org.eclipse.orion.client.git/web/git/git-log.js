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

/*global window define document dijit */
/*browser:true*/
define(['require', 'dojo', 'orion/bootstrap', 'orion/status', 'orion/commands',
        'orion/auth', 'orion/dialogs', 'orion/selection', 'orion/fileClient', 'orion/searchClient', 'orion/globalCommands', 'orion/git/gitClient',
        'orion/breadcrumbs', 'orion/ssh/sshTools', 'orion/git/git-commit-details', 'orion/git/git-commit-navigator', 'orion/git/gitCommands',
	    'orion/links', 'dojo/parser', 'dojo/hash', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/eWebBorderContainer'], 
		function(require, dojo, mBootstrap, mStatus, mCommands, mAuth, mDialogs, mSelection, mFileClient,
					mSearchClient, mGlobalCommands, mGitClient, mBreadcrumbs, mSshTools, mGitCommitDetails, mGitCommitNavigator, mGitCommands, mLinks) {

// TODO: This is naughty -- feel bad and then fix it please
var serviceRegistry;
	
	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			document.body.style.visibility = "visible";
			dojo.parser.parse();
			
		
			new mStatus.StatusReportingService(serviceRegistry, "statusPane", "notifications");
			new mDialogs.DialogService(serviceRegistry);
			var selection = new mSelection.Selection(serviceRegistry);
			new mSshTools.SshService(serviceRegistry);
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry, selection: selection});
			var linkService = new mLinks.TextLinkService({serviceRegistry: serviceRegistry});
			
			var branch;
		
			// Git operations
			var gitClient = new mGitClient.GitService(serviceRegistry);
			
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService});
			
			// Commit details
			var commitDetails = new mGitCommitDetails.CommitDetails({parent: "commitDetailsPane", commandService: commandService, linkService: linkService, detailsPane: dijit.byId("orion.innerNavigator")});
			// Commit navigator
			var navigator = new mGitCommitNavigator.GitCommitNavigator(serviceRegistry, selection, commitDetails, null, "explorer-tree", "pageTitle", "pageActions", "selectionTools");
			
			// global commands
			mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, preferences, searcher, navigator);
			
			//TODO this should be removed and contributed by a plug-in
			mGitCommands.createFileCommands(serviceRegistry, commandService, navigator, "pageActions", "selectionTools");
			
			// define the command contributions - where things appear, first the groups
			commandService.addCommandGroup("eclipse.gitGroup.nav", 200, "More");
			commandService.addCommandGroup("eclipse.gitGroup.page", 100, null, null, "pageActions");
			commandService.addCommandGroup("eclipse.selectionGroup", 500, "More actions", null, "selectionTools");
			
			// commands appearing directly in local actions column
			commandService.registerCommandContribution("eclipse.openGitCommit", 1);
			commandService.registerCommandContribution("eclipse.compareWithWorkingTree", 2);
		
			// selection based command contributions in nav toolbar
			commandService.registerCommandContribution("eclipse.compareGitCommits", 1, "selectionTools", "eclipse.selectionGroup");
			
			// git contributions
			commandService.registerCommandContribution("eclipse.orion.git.fetch", 100, "pageActions", "eclipse.gitGroup.page");
			commandService.registerCommandContribution("eclipse.orion.git.fetchForce", 100, "pageActions", "eclipse.gitGroup.page");
			commandService.registerCommandContribution("eclipse.orion.git.merge", 100, "pageActions", "eclipse.gitGroup.page");
			commandService.registerCommandContribution("eclipse.orion.git.switchToCurrentLocal", 100, "pageActions", "eclipse.gitGroup.page");	
			commandService.registerCommandContribution("eclipse.orion.git.push", 100, "pageActions", "eclipse.gitGroup.page");
			commandService.registerCommandContribution("eclipse.orion.git.pushForce", 100, "pageActions", "eclipse.gitGroup.page");
			commandService.registerCommandContribution("eclipse.orion.git.switchToRemote", 100, "pageActions", "eclipse.gitGroup.page");
			commandService.registerCommandContribution("eclipse.orion.git.previousLogPage", 200, "pageActions", "eclipse.gitGroup.page");
			commandService.registerCommandContribution("eclipse.orion.git.nextLogPage", 201, "pageActions", "eclipse.gitGroup.page");
			commandService.registerCommandContribution("eclipse.orion.git.addTag", 3);
			commandService.registerCommandContribution("eclipse.orion.git.cherryPick", 3);
			
			loadResource(navigator);
			
			makeRightPane(navigator);
		
			// every time the user manually changes the hash, we need to load the
			// workspace with that name
			dojo.subscribe("/dojo/hashchange", navigator, function() {
				loadResource(navigator);
			});
		});
	});

function loadResource(navigator){
	var path = dojo.hash();
	dojo.xhrGet({
		url : path,
		headers : {
			"Orion-Version" : "1"
		},
		handleAs : "json",
		timeout : 5000,
		load : function(resource, secondArg) {
			
			var loadResource = function(resource){
				var fileClient = new mFileClient.FileClient(serviceRegistry);
				initTitleBar(fileClient, navigator, resource);
				if (resource.Type === "RemoteTrackingBranch"){
					serviceRegistry.getService("orion.git.provider").then(function(gitService){
						gitService.getLog(resource.HeadLocation, resource.Id, function(scopedCommitsJsonData, secondArg) {
							
							function loadScopedCommitsList(scopedCommitsJsonData){
								navigator.renderer.setIncomingCommits(scopedCommitsJsonData.Children);
								navigator.renderer.setOutgoingCommits([]);
								navigator.loadCommitsList(resource.CommitLocation + "?" + new dojo._Url(path).query, resource);									
							}
							
							if(secondArg.xhr.status===200){
								loadScopedCommitsList(scopedCommitsJsonData);
							} else if(secondArg.xhr.status===202){
								var deferred = new dojo.Deferred();
								deferred.callback(scopedCommitsJsonData);
								serviceRegistry.getService("orion.page.message").then(function(progressService) {
									progressService.showWhile(deferred, "Getting git incoming changes").then(function(resourceData){
										loadScopedCommitsList(resourceData.Result.JsonData);
									});
								});
							}
							
						});
					});
				} else if (resource.toRef){
					if (resource.toRef.RemoteLocation && resource.toRef.RemoteLocation.length===1 && resource.toRef.RemoteLocation[0].Children && resource.toRef.RemoteLocation[0].Children.length===1)
						dojo.xhrGet({
							url : resource.toRef.RemoteLocation[0].Children[0].Location,
							headers : {
								"Orion-Version" : "1"
							},
							handleAs : "json",
							timeout : 5000,
							load : function(remoteJsonData, secondArg) {
								serviceRegistry.getService("orion.git.provider").then(function(gitService){
									gitService.getLog(remoteJsonData.CommitLocation, "HEAD", function(scopedCommitsJsonData, secondArg) {
										function loadScopedCommitsList(scopedCommitsJsonData){
											navigator.renderer.setIncomingCommits([]);
											navigator.renderer.setOutgoingCommits(scopedCommitsJsonData.Children);
											navigator.loadCommitsList(dojo.hash(), resource);
										}
										
										if(secondArg.xhr.status===200){
											loadScopedCommitsList(scopedCommitsJsonData);
										} else if(secondArg.xhr.status===202){
											var deferred = new dojo.Deferred();
											deferred.callback(scopedCommitsJsonData);
											serviceRegistry.getService("orion.page.message").then(function(progressService) {
												progressService.showWhile(deferred, "Getting git outgoing changes").then(function(resourceData){
													loadScopedCommitsList(resourceData.Result.JsonData);
												});
											});
										}
										
									});
								});
							},
							error : function(error, ioArgs){
								navigator.loadCommitsList(dojo.hash(), resource);
							}
						});
					else
						navigator.loadCommitsList(dojo.hash(), resource);
				} else {
					navigator.loadCommitsList(dojo.hash(), resource);
				}
			};
			
			if(secondArg.xhr.status===200){
				loadResource(resource);
			} else if(secondArg.xhr.status===202){
				var deferred = new dojo.Deferred();
				deferred.callback(resource);
				serviceRegistry.getService("orion.page.message").then(function(progressService) {
					progressService.showWhile(deferred, "Getting git log").then(function(resourceData){
						loadResource(resourceData.Result.JsonData);
					});
				});
			}
			
		},
		error : function(error, ioArgs) {
			if(ioArgs.xhr.status == 401 || ioArgs.xhr.status == 403){ 
				var currentXHR = this;
				mAuth.handleAuthenticationError(ioArgs.xhr, function(){
					dojo.xhrGet(currentXHR); // retry GET							
				});
			}else{
				navigator.loadCommitsList(dojo.hash(), error);	
			}
		}
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

function initTitleBar(fileClient, navigator, item){
	
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
					var branchName;
					if (isRemote)
						branchName = item.Name;
					else if (isBranch)
						branchName = item.toRef.Name;
					else
						branchName = null;

					if(item && item.CloneLocation){
						var cloneURI = item.CloneLocation;
						
						serviceRegistry.getService("orion.git.provider").then(function(gitService){
							gitService.getGitClone(cloneURI).then(function(jsonData){
							if(jsonData.Children && jsonData.Children.length>0)
								setPageTitle(branchName, jsonData.Children[0].Name, jsonData.Children[0].ContentLocation, isRemote, isBranch);
							else
								setPageTitle(branchName, jsonData.Name, jsonData.ContentLocation, isRemote, isBranch);
							});
						});
					}else{
						setPageTitle(branchName);
					}
					var location = dojo.byId("location");
					if (location) {
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
					if(metadata.Directory){
						//remove links to commit
						dojo.query(".navlinkonpage").forEach(function(node, i) {
							node.removeAttribute("href");
						});
					}
				}),
				dojo.hitch(this, function(error) {
					console.error("Error loading file metadata: " + error.message);
				})
		);
	}
	
};

function makeRightPane(explorer){
		// set up the splitter bar and its key binding
		var splitArea = dijit.byId("orion.innerNavigator");
		
		//by default the pane should be closed
		if(splitArea.isRightPaneOpen()){
			splitArea.toggle();
		}
				
		var bufferedSelection = [];
		
		window.document.onkeydown = function (evt){
			evt = evt || window.event;
			var handled = false;
			if(evt.ctrlKey && evt.keyCode  === 79){ // Ctrl+o handler for toggling outline 
				splitArea.toggle();
				handled = true;			
			} 
			if (handled) {
				if (window.document.all) { 
					evt.keyCode = 0;
				} else { 
					evt.preventDefault();
					evt.stopPropagation();
				}		
			}
		};
}

function makeHref(fileClient, seg, location, isRemote){
	if(!location){
		return;
	}
	fileClient.read(location, true).then(
			dojo.hitch(this, function(metadata) {
				if (isRemote) {
					serviceRegistry.getService("orion.git.provider").then(function(gitService){
						if(metadata.Git)
						gitService.getDefaultRemoteBranch(
								metadata.Git.RemoteLocation, function(
										defaultRemoteBranchJsonData, secondArg) {
									seg.href = require.toUrl("git/git-log.html") + "#"
											+ defaultRemoteBranchJsonData.Location
											+ "?page=1";
								});
					});

				} else {
					if(metadata.Git)
					seg.href = require.toUrl("git/git-log.html") + "#" + metadata.Git.CommitLocation
							+ "?page=1";
				}
			}),
			dojo.hitch(this, function(error) {
				console.error("Error loading file metadata: " + error.message);
			})
	);
};

function setPageTitle(branchName, cloneName, cloneLocation, isRemote, isBranch){
	var pageTitle = dojo.byId("pageTitle");
	
	var title = "Git Log ";
	if (isRemote)
		title += "for remote branch <b>" + branchName + "</b>";
	else if (isBranch)
		title += "for local branch <b>" + branchName + "</b>";
	
	if(cloneLocation){
		title = title + " on <a href='" + require.toUrl("git/git-clone.html") + "#" + cloneLocation + "'>" + cloneName + "</a>";
	}
	pageTitle.innerHTML = title;
	if(branchName){
		document.title = cloneName ? (branchName + " on " + cloneName) : branchName;
	}
}

});
