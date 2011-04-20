/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global window widgets eclipse:true serviceRegistry dojo */
/*browser:true*/

/**
 * @namespace The global container for eclipse APIs.
 */ 
var eclipse = eclipse || {};

/**
 * Utility methods
 * @namespace eclipse.gitCommandUtils generates commands
 */
 
eclipse.gitCommandUtils = eclipse.gitCommandUtils || {};

dojo.require("widgets.CloneGitRepositoryDialog");
dojo.require("widgets.GitCredentialsDialog");

//this function is just a closure for the global "doOnce" flag
(function() {
	var doOnce = false;

	eclipse.gitCommandUtils.updateNavTools = function(registry, explorer, toolbarId, selectionToolbarId, item) {
		var toolbar = dojo.byId(toolbarId);
		if (toolbar) {
			dojo.empty(toolbar);
		} else {
			throw "could not find toolbar " + toolbarId;
		}
		registry.getService("ICommandService").then(dojo.hitch(explorer, function(service) {
			service.renderCommands(toolbar, "dom", item, explorer, "image");
			if (selectionToolbarId) {
				var selectionTools = dojo.create("span", {id: selectionToolbarId}, toolbar, "last");
				service.renderCommands(selectionTools, "dom", null, explorer, "image");
			}
		}));
		
		// Stuff we do only the first time
		if (!doOnce) {
			doOnce = true;
			registry.getService("Selection").then(function(service) {
				service.addEventListener("selectionChanged", function(singleSelection, selections) {
					var selectionTools = dojo.byId(selectionToolbarId);
					if (selectionTools) {
						dojo.empty(selectionTools);
						registry.getService("ICommandService").then(function(commandService) {
							commandService.renderCommands(selectionTools, "dom", selections, explorer, "image");
						});
					}
				});
			});
		}
	};
	
	eclipse.gitCommandUtils.handleKnownHostsError = function(serviceRegistry, errorData, options, func){
		if(confirm("Would you like to add " + errorData.KeyType + " key for host " + errorData.Host
				+ " to continue operation? Key fingerpt is " + errorData.HostFingerprint + ".")){
			serviceRegistry.getService("ISshService").then(function(sshService){
				sshService.addKnownHosts(errorData.Host + " " + errorData.KeyType + " " + errorData.HostKey).then(function(){
					sshService.getKnownHosts().then(function(knownHosts){
						options.knownHosts = knownHosts;
						func(options);
					});
				});
			});
		}
	};
	
	eclipse.gitCommandUtils.handleProgressServiceResponse = function(jsonData, options, serviceRegistry, callback, callee){
		if(jsonData.Running==false){
			if(jsonData.Result && jsonData.Result.HttpCode==403){
				if(jsonData.Result.ErrorData && jsonData.Result.ErrorData.HostKey){
					dojo.hitch(this, eclipse.gitCommandUtils.handleKnownHostsError)(serviceRegistry, jsonData.Result.ErrorData, options, callee);
					return;
				}
			}
			
			if(jsonData.Result && jsonData.Result.HttpCode!=200){
				console.error("error " + jsonData.Result.HttpCode + " while running opperation: " + jsonData.Result.DetailedMessage);
				return;
			}
			
			if(callback){
				callback(jsonData);
			}
			
		}
	};
	
	eclipse.gitCommandUtils.createFileCommands = function(serviceRegistry, commandService, explorer, toolbarId, gitClient) {
		var cloneGitRepositoryCommand = new eclipse.Command({
			name : "Clone Git Repository",
			image : "images/git-clone.gif",
			id : "eclipse.cloneGitRepository",
			callback : function(item) {
				var dialog = new widgets.CloneGitRepositoryDialog({
					func :function(gitUrl){
						var credentialsDialog = new widgets.GitCredentialsDialog({
								title: "Clone Git Repository",
								url: gitUrl,
								serviceRegistry: serviceRegistry,
								func: function(options){
									var func = arguments.callee;
									serviceRegistry.getService("IGitService").then(function(gitService) {
										serviceRegistry.getService("IStatusReporter").then(function(progressService) {
											var deferred = gitService.cloneGitRepository(null, gitUrl, options.gitSshUsername, options.gitSshPassword, options.knownHosts);
											progressService.showWhile(deferred, "Cloning repository: " + gitUrl).then(
												function(jsonData, secondArg) {
													eclipse.gitCommandUtils.handleProgressServiceResponse(jsonData, options, serviceRegistry,
															function(jsonData){
																if(explorer.redisplayClonesList){
																	dojo.hitch(explorer, explorer.redisplayClonesList)();
																}
															}, func);
												});
										});
									});
								}
								
						});
						
						credentialsDialog.startup();
						credentialsDialog.show();	
					}
				});
						
				dialog.startup();
				dialog.show();
			},
			visibleWhen : function(item) {
				return true;
			}
		});
		
		commandService.addCommand(cloneGitRepositoryCommand, "dom");
		
		var linkRepoCommand = new eclipse.Command({
			name: "Link Repository",
			image: "images/link_obj.gif",
			id: "eclipse.linkRepository",
			callback: function(item) {
				var dialog = new widgets.NewItemDialog({
					title: "Link Repository",
					label: "Folder name:",
					func:  function(name, url, create){
						serviceRegistry.getService("IFileService").then(function(service){
							
							service.loadWorkspace("").then(function(loadedWorkspace){
								service.createProject(loadedWorkspace.Location, name, item.ContentLocation, false).then(
										function(jsonResp){
											alert("Repository was linked to " + jsonResp.Name);
											service.read(jsonResp.ContentLocation, true).then(function(jsonData){
												window.location.replace("navigate-table.html#"+jsonData.ChildrenLocation); //redirect to the workspace to see the linked resource
											});
										}
									);
							});
							
						});
					},
					advanced: false
				});
				dialog.startup();
				dialog.show();
			},
			visibleWhen: function(item) {
				if(item.ContentLocation){
					return true;
				}
				return false;
				}
			});
		commandService.addCommand(linkRepoCommand, "object");
	

		
		var compareGitCommits = new eclipse.Command({
			name : "Compare With Each Other",
			image : "images/git/compare-sbs.gif",
			id : "eclipse.compareGitCommits",
			hrefCallback : function(item) {
				var clientDeferred = new dojo.Deferred();
				serviceRegistry.getService("IGitService").then(
						function(service) {
							service.getDiff(item[0].DiffLocation, item[1].Name,
								function(jsonData, secondArg) {
									clientDeferred.callback("/compare-m.html?readonly#" + secondArg.xhr.getResponseHeader("Location"));
								});
						});
				return clientDeferred;
			},
			visibleWhen : function(item) {
				if (dojo.isArray(item) && item.length === 2) {
						return true;
				}
				return false;
			}
		});
	
		commandService.addCommand(compareGitCommits, "dom");
		
		var compareWithWorkingTree = new eclipse.Command({
			name : "Compare With Working Tree",
			image : "images/git/compare-sbs.gif",
			id : "eclipse.compareWithWorkingTree",
			hrefCallback : function(item) {
				return "/compare-m.html#" + item.DiffLocation;
			},
			visibleWhen : function(item) {
				return true;
			}
		});
	
		commandService.addCommand(compareWithWorkingTree, "object");
		
		var openGitCommit = new eclipse.Command({
			name : "Open",
			image : "images/find.gif",
			id : "eclipse.openGitCommit",
			hrefCallback: function(item) {
				return "/coding.html#" + item.ContentLocation;
			},
			visibleWhen : function(item) {
				return item.ContentLocation != null;
			}
		});
	
		commandService.addCommand(openGitCommit, "object");
		
		var fetchCommand = new eclipse.Command({
			name : "Fetch",
			image : "images/git-fetch.gif",
			id : "eclipse.orion.git.fetch",
			callback: function(item) {
				var path = dojo.hash();
				var credentialsDialog = new widgets.GitCredentialsDialog({
					title: "Clone Git Repository",
					serviceRegistry: serviceRegistry,
					func: function(options){
						serviceRegistry.getService("IGitService").then(function(gitService) {
							serviceRegistry.getService("IStatusReporter").then(function(progressService) {
								var deferred = gitService.doFetch(path, null, options.gitSshUsername, options.gitSshPassword, options.knownHosts);
								progressService.showWhile(deferred, "Fetching remote: " + path).then(
									function(jsonData, secondArg) {
										return dojo.xhrGet({
											url : path,
											headers : {
												"Orion-Version" : "1"
											},
											postData : dojo.toJson({
												"GitSshUsername" : options.gitSshUsername,
												"GitSshPassword" : options.gitSshPassword,
												"GitSshKnownHost" : options.knownHosts
											}),
											handleAs : "json",
											timeout : 5000,
											load : function(jsonData, secondArg) {
												return jsonData;
											},
											error : function(error, ioArgs) {
												//handleGetAuthenticationError(this, ioArgs);
												console.error("HTTP status code: ", ioArgs.xhr.status);
											}
										});
									}).then(function(remoteJsonData){
										gitService.getLog(remoteJsonData.HeadLocation, remoteJsonData.Id, function(scopedCommitsJsonData, secondArd) {
											explorer.renderer.setIncomingCommits(scopedCommitsJsonData);
											explorer.loadCommitsList(remoteJsonData.CommitLocation, remoteJsonData, true);			
										});
									});
							});
						});
					}
				});
			
				credentialsDialog.startup();
				credentialsDialog.show();	
			},
			visibleWhen : function(item) {
				return true;
			}
		});
	
		commandService.addCommand(fetchCommand, "dom");
		
		var mergeCommand = new eclipse.Command({
			name : "Merge",
			image : "images/git-merge.gif",
			id : "eclipse.orion.git.merge",
			callback: function(item) {
				serviceRegistry.getService("IGitService").then(function(gitService){
					gitService.doMerge(item.HeadLocation, item.Id, function() {
						dojo.query(".treeTableRow").forEach(function(node, i) {
							dojo.toggleClass(node, "incomingCommitsdRow", false);
						});
					});
				});
			},
			visibleWhen : function(item) {
				return true;
			}
		});
	
		commandService.addCommand(mergeCommand, "dom");
		
		var pushCommand = new eclipse.Command({
			name : "Push",
			image : "images/git-push.gif",
			id : "eclipse.orion.git.push",
			callback: function(item) {
				serviceRegistry.getService("IGitService").then(function(gitService){
					gitService.doPush(item.Location, "HEAD", function() {
						dojo.query(".treeTableRow").forEach(function(node, i) {
							dojo.toggleClass(node, "outgoingCommitsdRow", false);
						});
					});
				});
			},
			visibleWhen : function(item) {
				return true;
			}
		});
	
		commandService.addCommand(pushCommand, "dom");
	};
	
	eclipse.gitCommandUtils.createGitClonesCommands = function(serviceRegistry, commandService, explorer, toolbarId) {
		var deleteCommand = new eclipse.Command({
			name: "Delete Clone",
			image: "images/remove.gif",
			id: "eclipse.git.deleteClone",
			visibleWhen: function(item) {
				var items = dojo.isArray(item) ? item : [item];
				if (items.length === 0) {
					return false;
				}
				for (var i=0; i < items.length; i++) {
					if (!items[i].Location) {
						return false;
					}
				}
				//return true;
				return false //TODO enable this command when deleting clones is implemented
			},
			callback: function(item) {
				window.alert("Cannot delete " + item.name + ", deleting is not implented yet!");
			}});
		commandService.addCommand(deleteCommand, "object");
		commandService.addCommand(deleteCommand, "dom");
		
	};
}());
