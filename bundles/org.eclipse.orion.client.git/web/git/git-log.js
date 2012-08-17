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
define(['i18n!git/nls/gitmessages', 'require', 'dojo', 'orion/bootstrap', 'orion/status', 'orion/progress', 'orion/commands',
        'orion/auth', 'orion/dialogs', 'orion/selection', 'orion/fileClient', 'orion/operationsClient', 'orion/searchClient', 'orion/globalCommands', 'orion/git/gitClient',
        'orion/ssh/sshTools', 'orion/git/git-commit-navigator', 'orion/git/gitCommands',
	    'orion/links', 'dojo/hash'], 
		function(messages, require, dojo, mBootstrap, mStatus, mProgress, mCommands, mAuth, mDialogs, mSelection, mFileClient, mOperationsClient,
					mSearchClient, mGlobalCommands, mGitClient, mSshTools, mGitCommitNavigator, mGitCommands, mLinks) {

// TODO: This is naughty -- feel bad and then fix it please
var serviceRegistry;
	
	dojo.addOnLoad(function() {
		function getCloneFileUri(){
			var fileURI;
			var path = dojo.hash().split("gitapi/commit/"); //$NON-NLS-0$
			if(path.length === 2){
				path = path[1].split("/"); //$NON-NLS-0$
				if(path.length > 1){
					fileURI = "";
					for(var i = 0; i < path.length - 1; i++){
						fileURI += "/" + path[i]; //$NON-NLS-0$
					}
					fileURI += "/" + path[path.length - 1].split("?")[0]; //$NON-NLS-1$ //$NON-NLS-0$
				}
			}
			return fileURI;
		}
		
		function getHeadFileUri(){
			var fileURI;
			var path = dojo.hash().split("gitapi/commit/"); //$NON-NLS-0$
			if(path.length === 2){
				path = path[1].split("/"); //$NON-NLS-0$
				if(path.length > 1){
					fileURI="";
					for(var i=1; i<path.length-1; i++){
						//first segment is a branch name
						fileURI+= "/" + path[i]; //$NON-NLS-0$
					}
					fileURI+="/" + path[path.length-1].split("?")[0]; //$NON-NLS-1$ //$NON-NLS-0$
				}
			}
			return fileURI;
		}
		
	
		function makeHref(fileClient, seg, location, isRemote) {
			if (!location) {
				return;
			}
			
			fileClient.read(location, true).then(dojo.hitch(this, function(metadata) {
				if (isRemote) {
					var gitService = serviceRegistry.getService("orion.git.provider"); //$NON-NLS-0$
					if (metadata.Git) {
						gitService.getDefaultRemoteBranch(metadata.Git.RemoteLocation).then(function(defaultRemoteBranchJsonData, secondArg) {
							seg.href = require.toUrl("git/git-log.html") + "#" + defaultRemoteBranchJsonData.Location + "?page=1"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						});
					}
				} else {
					if (metadata.Git) {
						seg.href = require.toUrl("git/git-log.html") + "#" + metadata.Git.CommitLocation + "?page=1"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					}
				}
			}), dojo.hitch(this, function(error) {
				window.console.error("Error loading file metadata: " + error.message); //$NON-NLS-0$
			}));
		}
		
		function setPageInfo(fileClient, navigator, item, searcher, commandService) {
			var deferred = new dojo.Deferred();
			var isRemote = (item.toRef && item.toRef.Type === "RemoteTrackingBranch"); //$NON-NLS-0$
			var isBranch = (item.toRef && item.toRef.Type === "Branch"); //$NON-NLS-0$
			//TODO we are calculating file path from the URL, it should be returned by git API
			var fileURI, branchName;
			if (isRemote || isBranch) {
				fileURI = getHeadFileUri();
				branchName = item.toRef.Name;
			} else {
				fileURI = getCloneFileUri();
			}	
			if(fileURI){		
				fileClient.read(fileURI, true).then(dojo.hitch(this, function(metadata) {
					var title = branchName ? branchName + " on " + metadata.Name + " - Git Log" : metadata.Name + " - " + "Git Log";
					var breadcrumbRootName;
					var branchIdentifier = branchName ? " (" + branchName + ") " : "";
					// adjust top name of breadcrumb segment
					if (metadata.Parents && metadata.Parents.length > 0) {
						var rootParent = metadata.Parents[metadata.Parents.length - 1];
						breadcrumbRootName = "Log" + branchIdentifier + rootParent.Name;
					} else {
						breadcrumbRootName = "Log" + branchIdentifier + metadata.Name;
					}
					mGlobalCommands.setPageTarget({task: "Git Log", title: title, target: item, breadcrumbTarget: metadata, breadcrumbRootName: breadcrumbRootName,
						makeBreadcrumbLink: function(seg, location) {
							makeHref(fileClient, seg, location, isRemote);
						},
						serviceRegistry: serviceRegistry, commandService: commandService, searchService: searcher}); 
					mGitCommands.updateNavTools(serviceRegistry, navigator, "pageActions", "selectionTools", navigator._lastTreeRoot); //$NON-NLS-1$ //$NON-NLS-0$
					navigator.updateCommands();	
					deferred.callback();
				}), dojo.hitch(this, function(error) { deferred.errback(error);}));
			} else {
				deferred.callback();
			}
			return deferred;
		}
		
		
		function loadResource(navigator, searcher, commandService){
			var path = dojo.hash();
			dojo.place(document.createTextNode(messages["Loading git log..."]), "explorer-tree", "only"); //$NON-NLS-2$ //$NON-NLS-1$
			
			var gitService = serviceRegistry.getService("orion.git.provider"); //$NON-NLS-0$
			gitService.doGitLog(path).then(
				function(resp) {
					var resource = resp;
					gitService.getGitClone(resource.CloneLocation).then(
						function(resp){
							var clone = resp.Children[0];
							
							resource.Clone = clone;
							resource.ContentLocation = clone.ContentLocation;
							

							gitService.getGitBranch(clone.BranchLocation).then(
								function(branches){
									dojo.forEach(branches.Children, function(branch, i) {
										if (branch.Current === true){
											resource.Clone.ActiveBranch = branch.CommitLocation;
										}
									});
							 
									//TODO if this were in the scope of the onload above, we would have the right file client instance.  Shouldn't need to
									// create one each time.
									var fileClient = new mFileClient.FileClient(serviceRegistry);
									setPageInfo(fileClient, navigator, resource, searcher, commandService).then(
										function(){
											var processRemoteTrackingBranch = function(resource) {
												dojo.place(document.createTextNode("Getting git incoming changes..."), "explorer-tree", "only"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
												var newRefEncoded = encodeURIComponent(resource.FullName);
												gitService.getLog(resource.HeadLocation, newRefEncoded).then(function(scopedCommitsJsonData) {
													navigator.renderer.setIncomingCommits(scopedCommitsJsonData.Children);
													navigator.renderer.setOutgoingCommits([]);
													gitService.doGitLog(resource.CommitLocation + "?" + new dojo._Url(path).query).then(function(jsonData) { //$NON-NLS-0$
														resource.Children = jsonData.Children;
														if(jsonData.NextLocation){
															resource.NextLocation = resource.Location + "?" + new dojo._Url(jsonData.NextLocation).query; //$NON-NLS-0$
														}
														if(jsonData.PreviousLocation ){
															resource.PreviousLocation  = resource.Location + "?" + new dojo._Url(jsonData.PreviousLocation).query; //$NON-NLS-0$
														}
														navigator.loadCommitsList(resource.CommitLocation + "?" + new dojo._Url(path).query, resource);															 //$NON-NLS-0$
													});
												});
											};
											if (resource.Type === "RemoteTrackingBranch"){ //$NON-NLS-0$
												processRemoteTrackingBranch(resource);
											} else if (resource.Type === "Commit" && resource.toRef.Type === "RemoteTrackingBranch"){ //$NON-NLS-1$ //$NON-NLS-0$
												processRemoteTrackingBranch(resource.toRef);
											} else if (resource.toRef){
												if (resource.toRef.RemoteLocation && resource.toRef.RemoteLocation.length===1 && resource.toRef.RemoteLocation[0].Children && resource.toRef.RemoteLocation[0].Children.length===1){
													gitService.getGitRemote(resource.toRef.RemoteLocation[0].Children[0].Location).then(
														function(remoteJsonData, secondArg) {
															dojo.place(document.createTextNode("Getting git incoming changes..."), "explorer-tree", "only"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
															gitService.getLog(remoteJsonData.CommitLocation, "HEAD").then(function(scopedCommitsJsonData) { //$NON-NLS-0$
																navigator.renderer.setIncomingCommits([]);
																navigator.renderer.setOutgoingCommits(scopedCommitsJsonData.Children);
																navigator.loadCommitsList(dojo.hash(), resource);
															});
														},
														function(error, ioArgs){
															navigator.loadCommitsList(dojo.hash(), resource);
														});
												} else {
													navigator.loadCommitsList(dojo.hash(), resource);
												}
											} else {
												navigator.loadCommitsList(dojo.hash(), resource);
											}
										}
									);
							
							
							
							
								}
							);
						}
					);
				},
				function(error, ioArgs) {
					navigator.loadCommitsList(dojo.hash(), error);	
				});
		}

		mBootstrap.startup().then(function(core) {
			serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
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
			var navigator = new mGitCommitNavigator.GitCommitNavigator(serviceRegistry, selection, null, "explorer-tree", "pageTitle", "pageActions", "selectionTools", "pageNavigationActions", "itemLevelCommands"); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			mGlobalCommands.setPageCommandExclusions(["eclipse.git.remote", "eclipse.git.log"]); //$NON-NLS-1$ //$NON-NLS-0$
			// global commands
			mGlobalCommands.generateBanner("orion-gitlog", serviceRegistry, commandService, preferences, searcher, navigator); //$NON-NLS-0$
			
			//TODO this should be removed and contributed by a plug-in
			mGitCommands.createFileCommands(serviceRegistry, commandService, navigator, "pageActions", "selectionTools"); //$NON-NLS-1$ //$NON-NLS-0$
			
			// define the command contributions - where things appear, first the groups
			commandService.addCommandGroup("itemLevelCommands", "eclipse.gitGroup.nav", 200, messages["More"]); //$NON-NLS-1$ //$NON-NLS-0$
			commandService.addCommandGroup("pageActions", "eclipse.gitGroup.page", 100); //$NON-NLS-1$ //$NON-NLS-0$
			commandService.addCommandGroup("selectionTools", "eclipse.selectionGroup", 500, "More"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			// commands appearing directly in local actions column
			commandService.registerCommandContribution("itemLevelCommands", "eclipse.openGitCommit", 1); //$NON-NLS-1$ //$NON-NLS-0$
			commandService.registerCommandContribution("itemLevelCommands", "eclipse.compareWithWorkingTree", 2); //$NON-NLS-1$ //$NON-NLS-0$
		
			// selection based command contributions in nav toolbar
			commandService.registerCommandContribution("selectionTools", "eclipse.compareGitCommits", 1, "eclipse.selectionGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			// git contributions
			commandService.registerCommandContribution("pageActions", "eclipse.orion.git.fetch", 100, "eclipse.gitGroup.page"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			commandService.registerCommandContribution("pageActions", "eclipse.orion.git.fetchForce", 100, "eclipse.gitGroup.page"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			commandService.registerCommandContribution("pageActions", "eclipse.orion.git.merge", 100, "eclipse.gitGroup.page"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			commandService.registerCommandContribution("pageActions", "eclipse.orion.git.push", 100, "eclipse.gitGroup.page"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			commandService.registerCommandContribution("pageActions", "eclipse.orion.git.pushForce", 100, "eclipse.gitGroup.page"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			commandService.registerCommandContribution("itemLevelCommands", "eclipse.orion.git.addTag", 3); //$NON-NLS-1$ //$NON-NLS-0$
			commandService.registerCommandContribution("itemLevelCommands", "eclipse.orion.git.cherryPick", 3); //$NON-NLS-1$ //$NON-NLS-0$
			// page navigation actions
			commandService.registerCommandContribution("pageNavigationActions", "eclipse.orion.git.previousLogPage", 1); //$NON-NLS-1$ //$NON-NLS-0$
			commandService.registerCommandContribution("pageNavigationActions", "eclipse.orion.git.nextLogPage", 2); //$NON-NLS-1$ //$NON-NLS-0$

			loadResource(navigator, searcher, commandService);
		
			// every time the user manually changes the hash, we need to load the
			// workspace with that name
			dojo.subscribe("/dojo/hashchange", navigator, function() { //$NON-NLS-0$
				loadResource(navigator, searcher, commandService);
			});
		});
	});
});
