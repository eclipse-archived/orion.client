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

/*global window widgets eclipse:true serviceRegistry define */
/*browser:true*/
define(['require', 'dojo', 'orion/commands', 'orion/util', 'orion/git/widgets/CloneGitRepositoryDialog', 
        'orion/git/widgets/AddRemoteDialog', 'orion/git/widgets/GitCredentialsDialog', 'orion/widgets/NewItemDialog', 
        'orion/git/widgets/RemotePrompterDialog', 'orion/git/widgets/ApplyPatchDialog', 'orion/git/widgets/OpenCommitDialog'], 
        function(require, dojo, mCommands, mUtil) {

/**
 * @namespace The global container for eclipse APIs.
 */ 
var exports = {};
//this function is just a closure for the global "doOnce" flag
(function() {
	var doOnce = false;

	exports.updateNavTools = function(registry, explorer, toolbarId, selectionToolbarId, item, pageNavId) {
		// we should be using orion.globalCommands#generateDomCommandsInBanner rather than managing these toolbars ourself
		var toolbar = dojo.byId(toolbarId);
		if (toolbar) {
			dojo.empty(toolbar);
		} else {
			throw "could not find toolbar " + toolbarId;
		}
		var commandService = registry.getService("orion.page.command");
		commandService.renderCommands(toolbar, "dom", item, explorer, "button"); 
		
		if (pageNavId) {
			var pageNav = dojo.byId(pageNavId);
			if (pageNav) {
				dojo.empty(pageNav);
				commandService.renderCommands(pageNav, "dom", item, explorer, "button", true);  
			}
		}
		
		if (selectionToolbarId) {
			var selectionTools = dojo.byId(selectionToolbarId);
			if (selectionTools) {
				dojo.empty(selectionToolbarId);
				commandService.renderCommands(selectionToolbarId, "dom", null, explorer, "button"); 
			}
		}

		// Stuff we do only the first time
		if (!doOnce) {
			doOnce = true;
			registry.getService("orion.page.selection").addEventListener("selectionChanged", function(singleSelection, selections) {
				var selectionTools = dojo.byId(selectionToolbarId);
				if (selectionTools) {
					dojo.empty(selectionTools);
					commandService.renderCommands(selectionTools, "dom", selections, explorer, "button");
				}
			});
		}
	};

	exports.getNewItemName = function(item, explorer, onRoot, domId, defaultName, onDone, column_no, isDefaultValid) {
		var refNode, name, tempNode;
		if (onRoot) {
			refNode = dojo.byId(domId);
		} else {
			if (explorer.makeNewItemPlaceHolder != null) {
				var nodes = explorer.makeNewItemPlaceHolder(item, domId, column_no);
				if (nodes) {
					refNode = nodes.refNode;
					tempNode = nodes.tempNode;
				} else {
					refNode = dojo.byId(domId);
				}
			}
		}
		if (refNode) {
			mUtil.getUserText(domId+"EditBox", refNode, false, defaultName, 
				dojo.hitch(this, function(name) {
					if (name) {
						if (tempNode) {
							tempNode.parentNode.removeChild(tempNode);
						}
						onDone(name);
					}
				}), undefined, undefined, undefined, isDefaultValid); 
		} else {
			name = window.prompt(defaultName);
			if (name) {
				onDone(name);
			}
		}
	}

	exports.handleKnownHostsError = function(serviceRegistry, errorData, options, func){
		if(confirm("Would you like to add " + errorData.KeyType + " key for host " + errorData.Host
				+ " to continue operation? Key fingerpt is " + errorData.HostFingerprint + ".")){
			var sshService = serviceRegistry.getService("orion.net.ssh");
			sshService.addKnownHosts(errorData.Host + " " + errorData.KeyType + " " + errorData.HostKey).then(function(){
				sshService.getKnownHosts().then(function(knownHosts){
					options.knownHosts = knownHosts;
					func(options);
				});
				if(options.failedOperation){
					var progressService = serviceRegistry.getService("orion.page.progress");
					dojo.hitch(progressService, progressService.removeOperation)(options.failedOperation.Location, options.failedOperation.Id);
				}
			});
		}
	};

	exports.handleSshAuthenticationError = function(serviceRegistry, errorData, options, func, title){
		var credentialsDialog = new orion.git.widgets.GitCredentialsDialog({
			title: title,
			serviceRegistry: serviceRegistry,
			func: func,
			errordata: options.errordata,
			failedOperation: options.failedOperation
		});
		
		credentialsDialog.startup();
		credentialsDialog.show();
		if(options.failedOperation){
			var progressService = serviceRegistry.getService("orion.page.progress");
			dojo.hitch(progressService, progressService.removeOperation)(options.failedOperation.Location, options.failedOperation.Id);
		}
	};

	exports.getDefaultSshOptions = function(serviceRegistry, authParameters){
		var def = new dojo.Deferred();
		var sshService = serviceRegistry.getService("orion.net.ssh");
		var sshUser =  authParameters && !authParameters.optionsRequested ? authParameters.valueFor("sshuser") : "";
		var sshPassword = authParameters && !authParameters.optionsRequested ? authParameters.valueFor("sshpassword") : "";
		sshService.getKnownHosts().then(function(knownHosts){
			def.callback({
						knownHosts: knownHosts,
						gitSshUsername: sshUser,
						gitSshPassword: sshPassword,
						gitPrivateKey: "",
						gitPassphrase: ""
			});
		});
		return def;
	};
	
	function translateResponseToStatus(response){
		var json;
		try{
			json = JSON.parse(response.responseText);
		}catch (e) {
			json = {Result: response.responseText};
		}
		json.HttpCode = response.status;
		return json;
	};

	exports.handleProgressServiceResponse = function(jsonData, options, serviceRegistry, callback, callee, title){
		if(jsonData && jsonData.status){
			jsonData = translateResponseToStatus(jsonData);
		}
		if(!jsonData || !jsonData.HttpCode){
			if(callback){
				callback(jsonData);
			}
			return;
		}
		switch (jsonData.HttpCode) {
		case 200:
		case 201:
		case 202:
			if(callback){
				callback(jsonData.Result);
			}
			return;
		case 401:
			if(jsonData.JsonData){
				options.errordata = jsonData.JsonData;
			}
			if(jsonData.failedOperation){
				options.failedOperation = jsonData.failedOperation;
			}
			dojo.hitch(this, exports.handleSshAuthenticationError)(serviceRegistry, jsonData.JsonData, options, callee, title);
			return;
		case 400:
			if(jsonData.JsonData && jsonData.JsonData.HostKey){
				if(jsonData.failedOperation){
					options.failedOperation = jsonData.failedOperation;
				}
				dojo.hitch(this, exports.handleKnownHostsError)(serviceRegistry, jsonData.JsonData, options, callee);
				return;
			}
		default:
			var display = [];
			display.Severity = "Error";
			display.HTML = false;
			
			try {
				display.Message = jsonData.DetailedMessage ? jsonData.DetailedMessage : jsonData.Message;
			} catch (Exception) {
				display.Message = error.message;
			}
			
			serviceRegistry.getService("orion.page.message").setProgressResult(display);
			break;
		}
			
	};
		
	exports.gatherSshCredentials = function(serviceRegistry, data, errorData, title){
		var def = new dojo.Deferred();

		var triggerCallback = function(sshObject){
			serviceRegistry.getService("orion.net.ssh").getKnownHosts().then(function(knownHosts){
				def.callback({
					knownHosts: knownHosts,
					gitSshUsername: sshObject.gitSshUsername,
					gitSshPassword: sshObject.gitSshPassword,
					gitPrivateKey: sshObject.gitPrivateKey,
					gitPassphrase: sshObject.gitPassphrase
				});
			});
		};

		// if this is a known hosts error, show a prompt always
		if (errorData && errorData.HostKey) {
			if(confirm("Would you like to add " + errorData.KeyType + " key for host " + errorData.Host
					+ " to continue operation? Key fingerpt is " + errorData.HostFingerprint + ".")){
				var sshService = serviceRegistry.getService("orion.net.ssh");
				sshService.addKnownHosts(errorData.Host + " " + errorData.KeyType + " " + errorData.HostKey).then(
					function(){
						triggerCallback({ gitSshUsername: "", gitSshPassword: "", gitPrivateKey: "", gitPassphrase: ""});
					}
				);					
			}
			return def;
		}

		// try to gather creds from the slideout first
		if (data) {
			var sshUser =  data.parameters ? data.parameters.valueFor("sshuser") : "";
			var sshPassword = data.parameters ? data.parameters.valueFor("sshpassword") : "";	
			triggerCallback({ gitSshUsername: sshUser, gitSshPassword: sshPassword, gitPrivateKey: "", gitPassphrase: ""});
			return def;
		}
		
		// use the old creds dialog
		var credentialsDialog = new orion.git.widgets.GitCredentialsDialog({
			title: title,
			serviceRegistry: serviceRegistry,
			func: triggerCallback,
			errordata: errorData
		});
		
		credentialsDialog.startup();
		credentialsDialog.show();

		return def;
	};
	
	exports.handleProgressServiceResponse2 = function(jsonData, serviceRegistry, callback, sshCallback){
		if(jsonData && jsonData.status){
			jsonData = translateResponseToStatus(jsonData);
		}
		if(!jsonData || !jsonData.HttpCode){
			if(callback){
				callback(jsonData);
			}
			return;
		}
		switch (jsonData.HttpCode) {
		case 200:
		case 201:
		case 202:
			if(callback){
				callback(jsonData.Result);
			}
			return;
		case 401:
			if (jsonData.failedOperation){
				var progressService = serviceRegistry.getService("orion.page.progress");
				dojo.hitch(progressService, progressService.removeOperation)(jsonData.failedOperation.Location, jsonData.failedOperation.Id);
			}
			sshCallback(jsonData);
			return;
		case 400:
			if(jsonData.JsonData && jsonData.JsonData.HostKey){
				if (jsonData.failedOperation){
					var progressService = serviceRegistry.getService("orion.page.progress");
					dojo.hitch(progressService, progressService.removeOperation)(jsonData.failedOperation.Location, jsonData.failedOperation.Id);
				}
				sshCallback(jsonData);	
				return;
			}
		default:
			var display = [];
			display.Severity = "Error";
			display.HTML = false;
			
			try {
				display.Message = jsonData.DetailedMessage ? jsonData.DetailedMessage : jsonData.Message;
			} catch (Exception) {
				display.Message = error.message;
			}
			
			serviceRegistry.getService("orion.page.message").setProgressResult(display);
			break;
		}
			
	};


	exports.createFileCommands = function(serviceRegistry, commandService, explorer, toolbarId) {
		
		function displayErrorOnStatus(error) {
			
			if (error.status === 401 || error.status === 403)
				return;
			
			var display = [];
			
			display.Severity = "Error";
			display.HTML = false;
			
			try {
				var resp = JSON.parse(error.responseText);
				display.Message = resp.DetailedMessage ? resp.DetailedMessage : resp.Message;
			} catch (Exception) {
				display.Message = error.message;
			}
			
			serviceRegistry.getService("orion.page.message").setProgressResult(display);
		}
		
		// TODO: not used by the git clone navigator, could be removed
		var linkRepoCommand = new mCommands.Command({
			name: "Link Repository",
			imageClass: "core-sprite-link",
			id: "eclipse.linkRepository",
			callback: function(data) {
				var dialog = new orion.widgets.NewItemDialog({
					title: "Link Repository",
					label: "Folder name:",
					func:  function(name, url, create){
						var service = serviceRegistry.getService("orion.core.file");							
						service.loadWorkspace("").then(function(loadedWorkspace){
							service.createProject(loadedWorkspace.Location, name, data.items.ContentLocation, false).then(
									function(jsonResp){
										alert("Repository was linked to " + jsonResp.Name);
										service.read(jsonResp.ContentLocation, true).then(function(jsonData){
											window.location.replace(require.toUrl("navigate/table.html")+"#"+jsonData.ChildrenLocation); //redirect to the workspace to see the linked resource
										});
									}
								);
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

		var checkoutTagCommand = new mCommands.Command({
			name: "Checkout",
			tooltip: "Checkout the current tag, creating a local branch based on its contents.",
			imageClass: "git-sprite-checkout",
			spriteClass: "gitCommandSprite",
			id: "eclipse.checkoutTag",
			callback: function(data) {
				var item = data.items;
				function getBranchItem(){
					if (item.Repository)
						return item.Repository.BranchLocation;
					
					for(var child_no in item.parent.parent.children){
						if(item.parent.parent.children[child_no].Name==="Branches"){
							return item.parent.parent.children[child_no];
						}
					}
					return item.parent.parent;
				}

				exports.getNewItemName(item, explorer, false, data.domNode.id, "tag_"+item.Name, function(name){
					if(!name && name==""){
						return;
					}
								
					var repositoryLocation;
					if (item.Repository != null) {
						repositoryLocation = item.Repository.Location;
					} else {
						repositoryLocation = item.parent.parent.Location
					}
					
					serviceRegistry.getService("orion.git.provider").checkoutTag(repositoryLocation, item.Name, name).then(function() {
						dojo.hitch(explorer, explorer.changedItem)(getBranchItem());
					}, displayErrorOnStatus);
				}, undefined, true);
				
			},
			visibleWhen: function(item){
				return item.Type === "Tag";
			}
		});
		commandService.addCommand(checkoutTagCommand, "object");

		var checkoutBranchCommand = new mCommands.Command({
			name: "Checkout",
			tooltip: "Checkout the branch or corresponding local branch and make it active. If the remote tracking branch does not have a corresponding local branch, the local branch will be created first.",
			imageClass: "git-sprite-checkout",
			spriteClass: "gitCommandSprite",
			id: "eclipse.checkoutBranch",
			callback: function(data) {
				var item = data.items;
				var service = serviceRegistry.getService("orion.git.provider");
				var progressService = serviceRegistry.getService("orion.page.message");
				
				progressService.setProgressMessage("Checking out branch...");
				if (item.Type === "Branch") {
					service.checkoutBranch(item.CloneLocation, item.Name).then(
						function(){
							dojo.hitch(explorer, explorer.changedItem)(item.parent);
							progressService.setProgressResult("Ok");
						},
						 displayErrorOnStatus
					);
				} else {
					var branchLocation;
					if (item.Repository != null) {
						branchLocation = item.Repository.BranchLocation;
					} else {
						branchLocation = item.parent.parent.BranchLocation;
					}
					
					service.addBranch(branchLocation, null, item.Name).then(
						function(branch){
							service.checkoutBranch(branch.CloneLocation, branch.Name).then(
								function(){
									dojo.hitch(explorer, explorer.changedItem)(item.Repository ? item.Repository.BranchLocation : item.parent.parent.parent);
									progressService.setProgressResult("Ok");
								},
								displayErrorOnStatus
							);
						},
					displayErrorOnStatus
					);
				}
			},
			visibleWhen: function(item) {
				return item.Type === "Branch" || item.Type === "RemoteTrackingBranch";
			}
		});
		commandService.addCommand(checkoutBranchCommand, "object");

		var branchNameParameters = new mCommands.ParametersDescription([new mCommands.CommandParameter('name', 'text', 'Name:')], false);

		var addBranchCommand = new mCommands.Command({
			name: "New Branch",
			tooltip: "Add a new local branch to the repository",
			imageClass: "core-sprite-add",
			id: "eclipse.addBranch",
			parameters: branchNameParameters,
			callback: function(data) {
				var item = data.items;
				
				var createBranchFunction = function(branchLocation, name) {
					serviceRegistry.getService("orion.git.provider").addBranch(branchLocation, name).then(function() {
						dojo.hitch(explorer, explorer.changedItem)(item);
					}, displayErrorOnStatus);
				};
				
				var branchLocation;
				if (item.Type === "Clone") {
					branchLocation = item.BranchLocation;
				} else {
					branchLocation = item.Location;
				}
				
				if (data.parameters.valueFor("name") && !data.parameters.optionsRequested) {
					createBranchFunction(branchLocation, data.parameters.valueFor("name"));
				} else {
					exports.getNewItemName(item, explorer, false, data.domNode.id, "Branch name", function(name) {
						if (!name && name == "") {
							return;
						}		
						createBranchFunction(branchLocation, name);
					});
				}
			},
			visibleWhen: function(item) {
				return (item.GroupNode && item.Name === "Branches") || (item.Type === "Clone" && explorer.parentId === "artifacts");
			}
		});
		commandService.addCommand(addBranchCommand, "object");
		commandService.addCommand(addBranchCommand, "dom");

		var removeBranchCommand = new mCommands.Command({
			name: "Delete", // "Delete Branch"
			tooltip: "Delete the local branch from the repository",
			imageClass: "core-sprite-delete",
			id: "eclipse.removeBranch",
			callback: function(data) {
				var item = data.items;
				if (confirm("Are you sure you want to delete branch " + item.Name + "?")) {
					serviceRegistry.getService("orion.git.provider").removeBranch(item.Location).then(function() {
						if (explorer.changedItem)
							dojo.hitch(explorer, explorer.changedItem)(item.parent);
						else if (explorer.displayBranches)
							dojo.hitch(explorer, explorer.displayBranches)(item.ParentLocation, null);
					}, displayErrorOnStatus);
				}
			},
			visibleWhen: function(item) {
				return item.Type === "Branch" && !item.Current;
			}
		});
		commandService.addCommand(removeBranchCommand, "object");

		var removeRemoteBranchCommand = new mCommands.Command({
			name: "Delete", // "Delete Remote Branch",
			tooltip: "Delete the remote tracking branch from the repository",
			imageClass: "core-sprite-delete",
			id: "eclipse.removeRemoteBranch",
			callback: function(data) {
				var item = data.items;
				if(confirm("You're going to delete remote branch " + item.Name+" and push the change.\n\nAre you sure?"))
				exports.getDefaultSshOptions(serviceRegistry).then(function(options){
					var func = arguments.callee;
					var gitService = serviceRegistry.getService("orion.git.provider");
					gitService.doPush(item.Location, "", false, false, null,
							"Removing remote branch: " + item.Name,
							options.gitSshUsername, options.gitSshPassword, options.knownHosts, options.gitPrivateKey,
							options.gitPassphrase).then(function(remoteJsonData) {
						exports.handleProgressServiceResponse(remoteJsonData, options, serviceRegistry, function(jsonData) {
							if (jsonData.Result.Severity == "Ok")
								dojo.hitch(explorer, explorer.changedItem)(item.parent);
						}, func, "Delete Remote Branch");
					}, function(jsonData, secondArg) {
						exports.handleProgressServiceResponse(jsonData, options, serviceRegistry, function() {}, func, "Removing remote branch: " + item.Name);
					});
				});
			},
			visibleWhen: function(item) {
				return item.Type === "RemoteTrackingBranch";
			}
		});
		commandService.addCommand(removeRemoteBranchCommand, "object");

		var addRemoteParameters = new mCommands.ParametersDescription([new mCommands.CommandParameter('name', 'text', 'Name:'), 
		                                                               new mCommands.CommandParameter('url', 'url', 'Url:')], false);
		
		var addRemoteCommand = new mCommands.Command({
			name: "New Remote",
			tooltip: "Add a new remote to the repository",
			imageClass: "core-sprite-add",
			id: "eclipse.addRemote",
			parameters: addRemoteParameters,
			callback : function(data) {
				var item = data.items;
				
				var createRemoteFunction = function(remoteLocation, name, url) {
					serviceRegistry.getService("orion.git.provider").addRemote(remoteLocation, name, url).then(function() {
						dojo.hitch(explorer, explorer.changedItem)(item);
					}, displayErrorOnStatus);
				};
				
				var remoteLocation;
				if (item.Type === "Clone") {
					remoteLocation = item.RemoteLocation;
				} else {
					remoteLocation = item.Location;
				}
				
				if (data.parameters.valueFor("name") && data.parameters.valueFor("url") && !data.parameters.optionsRequested) {
					createRemoteFunction(remoteLocation, data.parameters.valueFor("name"), data.parameters.valueFor("url"));
				} else {
					var dialog = new orion.git.widgets.AddRemoteDialog({
						func : function(remote, remoteURI){
							createRemoteFunction(remoteLocation, remote, remoteURI);
						}
					});
					dialog.startup();
					dialog.show();
					
				}	
			},
			visibleWhen: function(item) {
				return (item.GroupNode && item.Name === "Remotes") ||  (item.Type === "Clone" && explorer.parentId === "artifacts");
			}
		});
		commandService.addCommand(addRemoteCommand, "object");
		commandService.addCommand(addRemoteCommand, "dom");

		var removeRemoteCommand = new mCommands.Command({
			name: "Delete", // "Delete Remote",
			tooltip: "Delete the remote from the repository",
			imageClass: "core-sprite-delete",
			id: "eclipse.removeRemote",
			callback: function(data) {
				var item = data.items;
				if (confirm("Are you sure you want to delete remote " + item.Name + "?")) {
					serviceRegistry.getService("orion.git.provider").removeRemote(item.Location).then(function() {
						dojo.hitch(explorer, explorer.changedItem)(item.parent);
					}, displayErrorOnStatus);
				}
			},
			visibleWhen: function(item) {
				return item.Type === "Remote";
			}
		});
		commandService.addCommand(removeRemoteCommand, "object");

		var pullCommand = new mCommands.Command({
			name : "Pull",
			tooltip: "Pull from the repository",
			imageClass: "git-sprite-pull",
			spriteClass: "gitCommandSprite",
			id : "eclipse.orion.git.pull",
			callback: function(data) {
				var item = data.items;
				var path = item.Location;
				exports.getDefaultSshOptions(serviceRegistry).then(function(options) {
					var func = arguments.callee;
					var gitService = serviceRegistry.getService("orion.git.provider");
					gitService.doPull(path, false, null,
							options.gitSshUsername,
							options.gitSshPassword,
							options.knownHosts,
							options.gitPrivateKey,
							options.gitPassphrase).then(function(jsonData) {
						exports.handleProgressServiceResponse(jsonData, options, serviceRegistry, function(jsonData) {
							dojo.xhrGet({
								url: path,
								headers: { "Orion-Version": "1"	},
								postData: dojo.toJson({
									"GitSshUsername": options.gitSshUsername,
									"GitSshPassword": options.gitSshPassword,
									"GitSshPrivateKey": options.gitPrivateKey,
									"GitSshPassphrase": options.gitPassphrase,
									"GitSshKnownHost": options.knownHosts
								}),
								handleAs: "json",
								timeout: 5000,
								load: function(jsonData, secondArg) {
									return jsonData;
								},
								error: function(error, ioArgs) {
									console.error("HTTP status code: ", ioArgs.xhr.status);
									return error;
								}
							}).then(function(remoteJsonData) {
								if (item.Type === "Clone") {
									dojo.hitch(explorer, explorer.changedItem)(item);
								}
							}, displayErrorOnStatus);
						}, func, "Pull Git Repository");
					}, function(jsonData, secondArg) {
						exports.handleProgressServiceResponse(jsonData, options, serviceRegistry, function() {}, func, "Pull Git Repository");
					});
				});
			},
			visibleWhen : function(item) {
				return item.Type === "Clone";
			}
		});
		commandService.addCommand(pullCommand, "object");

		var openGitLog = new mCommands.Command({
			name : "Git Log",
			tooltip: "Open the log for the branch",
			id : "eclipse.openGitLog",
			imageClass: "git-sprite-log",
			spriteClass: "gitCommandSprite",
			hrefCallback : function(data) {
				var item = data.items;
				if (item.Type === "RemoteTrackingBranch")
					return require.toUrl("git/git-log.html")+"#" + item.Location + "?page=1";
				return require.toUrl("git/git-log.html")+"#" + item.CommitLocation + "?page=1";
			},
			visibleWhen : function(item) {
				return item.Type === "Branch" || item.Type === "RemoteTrackingBranch";
			}
		});
		commandService.addCommand(openGitLog, "object");

		var openGitLogAll = new mCommands.Command({
			name : "Git Log",
			tooltip: "Open the log for the repository",
			id : "eclipse.openGitLogAll",
			imageClass: "git-sprite-log",
			spriteClass: "gitCommandSprite",
			hrefCallback : function(data) {
				return require.toUrl("git/git-log.html")+"#" + data.items.CommitLocation + "?page=1";
			},
			visibleWhen : function(item) {
				// show only for a repo
				if (!item.CommitLocation || !item.StatusLocation)
					return false;
				return true;
			}
		});
		commandService.addCommand(openGitLogAll, "object");

		var openGitStatus = new mCommands.Command({
			name : "Git Status",
			tooltip: "Open the status for the repository",
			id : "eclipse.openGitStatus",
			imageClass: "git-sprite-status",
			spriteClass: "gitCommandSprite",
			hrefCallback : function(data) {
				return require.toUrl("git/git-status.html")+"#" + data.items.StatusLocation;
			},
			visibleWhen : function(item) {
				if (!item.StatusLocation)
					return false;
				return true;
			}
		});
		commandService.addCommand(openGitStatus, "object");

		var openCloneContent = new mCommands.Command({
			name : "Show in Navigator",
			tooltip: "Show the repository folder in the file navigator",
			id : "eclipse.openCloneContent",
			hrefCallback : function(data) {
				return require.toUrl("navigate/table.html")+"#" + data.items.ContentLocation+"?depth=1";
			},
			visibleWhen : function(item) {
				if (!item.ContentLocation)
					return false;
				return true;
			}
		});
		commandService.addCommand(openCloneContent, "object");

		var compareGitCommits = new mCommands.Command({
			name : "Compare With Each Other",
			imageClass: "git-sprite-open_compare",
			spriteClass: "gitCommandSprite",
			id : "eclipse.compareGitCommits",
			hrefCallback : function(data) {
				var item = data.items;
				var clientDeferred = new dojo.Deferred();
				serviceRegistry.getService("orion.git.provider").getDiff(item[1].DiffLocation, item[0].Name, function(jsonData, secondArg) {
					clientDeferred.callback(require.toUrl("compare/compare.html") + "?readonly#" + secondArg.xhr.getResponseHeader("Location"));
				});
				return clientDeferred;
			},
			visibleWhen : function(item) {
				if(explorer.isDirectory) return false;
				if (dojo.isArray(item) && item.length === 2 && item[0].Type === "Commit" && item[1].Type === "Commit") {
						return true;
				}
				return false;
			}
		});
		commandService.addCommand(compareGitCommits, "dom");

		var compareWithWorkingTree = new mCommands.Command({
			name : "Compare With Working Tree",
			imageClass: "git-sprite-open_compare",
			spriteClass: "gitCommandSprite",
			id : "eclipse.compareWithWorkingTree",
			hrefCallback : function(data) {
				return require.toUrl("compare/compare.html")+"#" + data.items.DiffLocation;
			},
			visibleWhen : function(item) {
				return item.Type === "Commit" && !explorer.isDirectory;
			}
		});
		commandService.addCommand(compareWithWorkingTree, "object");

		var openGitCommit = new mCommands.Command({
			name : "Open",
			id : "eclipse.openGitCommit",
			hrefCallback: function(data) {
				return require.toUrl("edit/edit.html")+"#" + data.items.ContentLocation;
			},
			visibleWhen : function(item) {
				return item.Type === "Commit" && item.ContentLocation != null && !explorer.isDirectory;
			}
		});
		commandService.addCommand(openGitCommit, "object");

		var fetchCommand = new mCommands.Command({
			name: "Fetch",
			tooltip: "Fetch from the remote",
			imageClass: "git-sprite-fetch",
			spriteClass: "gitCommandSprite",
			id: "eclipse.orion.git.fetch",
			callback: function(data) {
				var item = data.items;
				var path = item.Location;
				
				var handleResponse = function(jsonData, commandInvocation){
					if (jsonData.JsonData.HostKey){
						doOperation(commandInvocation, jsonData.JsonData);
					} else if (commandInvocation){
						if (jsonData.JsonData.User)
							commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshpassword", "password", "SSH Password:")], true);
						else
							commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshuser", "text", "SSH User Name:"), new mCommands.CommandParameter("sshpassword", "password", "SSH Password:")], true);
						
						commandInvocation.parameters.errorData = jsonData.JsonData;
						commandService._collectParameters(commandInvocation);
					} else {
						doOperation(null, jsonData.JsonData);
					}
				};

				var doOperation = function(commandInvocation, errorData){
					exports.gatherSshCredentials(serviceRegistry, commandInvocation, errorData).then(
						function(options) {
							var gitService = serviceRegistry.getService("orion.git.provider");
							gitService.doFetch(path, false, null,
									options.gitSshUsername,
									options.gitSshPassword,
									options.knownHosts,
									options.gitPrivateKey,
									options.gitPassphrase).then(
								function(jsonData, secondArg) {
									exports.handleProgressServiceResponse2(jsonData, serviceRegistry, 
										function() {
											gitService.getGitRemote(path).then(
												function(jsonData){
													var remoteJsonData = jsonData;
													if (explorer.parentId === "explorer-tree") {
														gitService.getLog(remoteJsonData.HeadLocation, remoteJsonData.Id, "Getting git incoming changes", function(loadScopedCommitsList) {
															explorer.renderer.setIncomingCommits(loadScopedCommitsList.Children);
															explorer.loadCommitsList(remoteJsonData.CommitLocation + "?page=1", remoteJsonData, true);
														});
													}
													dojo.hitch(explorer, explorer.changedItem)(item);
												}, displayErrorOnStatus
											);
										}, function (jsonData) {
											handleResponse(jsonData, commandInvocation);
										}
									);
								}, function(jsonData, secondArg) {
									exports.handleProgressServiceResponse2(jsonData, serviceRegistry, 
										function() {
										
										}, function (jsonData) {
											handleResponse(jsonData, commandInvocation);
										}
									);
								}
							);
						}
					);
				};
				
				if (data.parameters && data.parameters.optionsRequested){
					doOperation(null, data.parameters.errorData);
					data.parameters.optionsRequested = false;
					data.parameters.errorData = null;
				} else {
					doOperation(data);
				}
			},
			visibleWhen: function(item) {
				return item.Type === "RemoteTrackingBranch" || item.Type === "Remote";
			}
		});
		commandService.addCommand(fetchCommand, "dom");
		commandService.addCommand(fetchCommand, "object");

		var fetchForceCommand = new mCommands.Command({
			name : "Force Fetch",
			tooltip: "Fetch from the remote branch into your remote tracking branch overriding its current content",
			id : "eclipse.orion.git.fetchForce",
			callback: function(data) {			
				if(!confirm("You're going to override content of the remote tracking branch. This can cause the branch to lose commits.\n\nAre you sure?"))
					return;
				
				var item = data.items;
				var path = item.Location;
				
				var handleResponse = function(jsonData, commandInvocation){
					if (jsonData.JsonData.HostKey){
						doOperation(commandInvocation, jsonData.JsonData);
					} else if (commandInvocation){
						if (jsonData.JsonData.User)
							commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshpassword", "password", "SSH Password:")], true);
						else
							commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshuser", "text", "SSH User Name:"), new mCommands.CommandParameter("sshpassword", "password", "SSH Password:")], true);
						
						commandInvocation.parameters.errorData = jsonData.JsonData;
						commandService._collectParameters(commandInvocation);
					} else {
						doOperation(null, jsonData.JsonData);
					}
				};

				var doOperation = function(commandInvocation, errorData){
					exports.gatherSshCredentials(serviceRegistry, commandInvocation, errorData).then(
						function(options) {
							var gitService = serviceRegistry.getService("orion.git.provider");
							gitService.doFetch(path, true, null,
									options.gitSshUsername,
									options.gitSshPassword,
									options.knownHosts,
									options.gitPrivateKey,
									options.gitPassphrase).then(
								function(jsonData, secondArg) {
									exports.handleProgressServiceResponse2(jsonData, serviceRegistry, 
										function() {
											gitService.getGitRemote(path).then(
												function(jsonData){
													var remoteJsonData = jsonData;
													if (explorer.parentId === "explorer-tree") {
														gitService.getLog(remoteJsonData.HeadLocation, remoteJsonData.Id, "Getting git incoming changes", function(loadScopedCommitsList) {
															explorer.renderer.setIncomingCommits(loadScopedCommitsList.Children);
															explorer.loadCommitsList(remoteJsonData.CommitLocation + "?page=1", remoteJsonData, true);
														});
													}
													dojo.hitch(explorer, explorer.changedItem)(item);
												}, displayErrorOnStatus
											);
										}, function (jsonData) {
											handleResponse(jsonData, commandInvocation);
										}
									);
								}, function(jsonData, secondArg) {
									exports.handleProgressServiceResponse2(jsonData, serviceRegistry, 
										function() {
										
										}, function (jsonData) {
											handleResponse(jsonData, commandInvocation);
										}
									);
								}
							);
						}
					);
				};
				
				if (data.parameters && data.parameters.optionsRequested){
					doOperation(null, data.parameters.errorData);
					data.parameters.optionsRequested = false;
					data.parameters.errorData = null;
				} else {
					doOperation(data);
				}
			},
			visibleWhen : function(item) {
				return item.Type === "RemoteTrackingBranch" || item.Type === "Remote";
			}
		});
		commandService.addCommand(fetchForceCommand, "dom");
		commandService.addCommand(fetchForceCommand, "object");

		var mergeCommand = new mCommands.Command({
			name : "Merge",
			tooltip: "Merge the content from the branch to your active branch",
			imageClass: "git-sprite-merge",
			spriteClass: "gitCommandSprite",
			id : "eclipse.orion.git.merge",
			callback: function(data) {
				var item = data.items;
				var gitService = serviceRegistry.getService("orion.git.provider");
				var progressService = serviceRegistry.getService("orion.page.message");
				gitService.doMerge(item.HeadLocation, item.Name).then(function(result){
					var display = [];

					if (result.jsonData && (result.jsonData.Result == "FAST_FORWARD" || result.jsonData.Result == "ALREADY_UP_TO_DATE")){
						dojo.query(".treeTableRow").forEach(function(node, i) {
							dojo.toggleClass(node, "incomingCommitsdRow", false);
						});
						display.Severity = "Ok";
						display.HTML = false;
						display.Message = result.jsonData.Result;
						
						dojo.hitch(explorer, explorer.changedItem)(item);
					} else if(result.jsonData){
						var statusLocation = item.HeadLocation.replace("commit/HEAD", "status");

						display.Severity = "Warning";
						display.HTML = true;
						display.Message = "<span>" + result.jsonData.Result
							+ ". Go to <a href=\"" + require.toUrl("git/git-status.html") + "#" 
							+ statusLocation +"\">Git Status page</a>.<span>";
					} else if(result.error) {
						var statusLocation = item.HeadLocation.replace("commit/HEAD", "status");
						display.Severity = "Error";
						if(result.error.responseText && JSON.parse(result.error.responseText)){
							var resp = JSON.parse(result.error.responseText);
							display.Message = resp.DetailedMessage ? resp.DetailedMessage : resp.Message;
						}else{
							display.Message = result.error.message;
						}
						display.HTML = true;
						display.Message ="<span>" + display.Message + " Go to <a href=\"" + require.toUrl("git/git-status.html") + "#" 
							+ statusLocation + "\">Git Status page</a>.<span>";
					}

					progressService.setProgressResult(display);
				}, function (error, ioArgs) {
						var display = [];

						var statusLocation = item.HeadLocation.replace("commit/HEAD", "status");

						display.Severity = "Error";
						display.HTML = true;
						display.Message = "<span>" + dojo.fromJson(ioArgs.xhr.responseText).DetailedMessage
						+ ". Go to <a href=\"" + require.toUrl("git/git-status.html") + "#" 
						+ statusLocation +"\">Git Status page</a>.<span>";

						serviceRegistry.getService("orion.page.message").setProgressResult(display);
				});
			},
			visibleWhen : function(item) {
				return item.Type === "RemoteTrackingBranch" || (item.Type === "Branch" && !item.Current);
			}
		});
		commandService.addCommand(mergeCommand, "dom");
		commandService.addCommand(mergeCommand, "object");

		var rebaseCommand = new mCommands.Command({
			name : "Rebase",
			tooltip: "Rebase your commits by removing them from the active branch, starting the active branch again based on the latest state of the selected branch " +
					"and applying each commit again to the updated active branch.",
			id : "eclipse.orion.git.rebase",
			imageClass: "git-sprite-rebase",
			spriteClass: "gitCommandSprite",
			callback: function(data) {
				var item = data.items;
				serviceRegistry.getService("orion.git.provider").doRebase(item.HeadLocation, item.Name, "BEGIN", function(jsonData){
					var display = [];
					var statusLocation = item.HeadLocation.replace("commit/HEAD", "status");

					if (jsonData.Result == "OK" || jsonData.Result == "FAST_FORWARD" || jsonData.Result == "UP_TO_DATE" ) {
						// operation succeeded
						display.Severity = "Ok";
						display.HTML = false;
						display.Message = jsonData.Result;
						
						dojo.hitch(explorer, explorer.changedItem)(item);
					}
					// handle special cases
					else if (jsonData.Result == "STOPPED") {
						display.Severity = "Warning";
						display.HTML = true;
						display.Message = "<span>" + jsonData.Result
							+ ". Some conflicts occurred. Please resolve them and continue, skip patch or abort rebasing."
							+ " Go to <a href=\"" + require.toUrl("git/git-status.html") + "#" 
							+ statusLocation +"\">Git Status page</a>.<span>";
					}
					else if (jsonData.Result == "FAILED_WRONG_REPOSITORY_STATE") {
						display.Severity = "Error";
						display.HTML = true;
						display.Message = "<span>" + jsonData.Result
							+ ". Repository state is invalid (i.e. already during rebasing)."
							+ " Go to <a href=\"" + require.toUrl("git/git-status.html") + "#"
							+ statusLocation +"\">Git Status page</a>.<span>";
					}
					else if (jsonData.Result == "FAILED_UNMERGED_PATHS") {
						display.Severity = "Error";
						display.HTML = true;
						display.Message = "<span>" + jsonData.Result
							+ ". Repository contains unmerged paths."
							+ " Go to <a href=\"" + require.toUrl("git/git-status.html") + "#"
							+ statusLocation +"\">Git Status page</a>.<span>";
					}
					else if (jsonData.Result == "FAILED_PENDING_CHANGES") {
						display.Severity = "Error";
						display.HTML = true;
						display.Message = "<span>" + jsonData.Result
							+ ". Repository contains pending changes. Please commit or stash them."
							+ " Go to <a href=\"" + require.toUrl("git/git-status.html") + "#" 
							+ statusLocation +"\">Git Status page</a>.<span>";
					}
					// handle other cases
					else {
						display.Severity = "Warning";
						display.HTML = true;
						display.Message = "<span>" + jsonData.Result
							+ ". Go to <a href=\"" + require.toUrl("git/git-status.html") + "#"
							+ statusLocation +"\">Git Status page</a>.<span>";
					} 

					serviceRegistry.getService("orion.page.message").setProgressResult(display);
					}, 
					displayErrorOnStatus
				);
			},
			visibleWhen : function(item) {
				this.tooltip = "Rebase your commits by removing them from the active branch, " +
					"starting the active branch again based on the latest state of '" + item.Name + "' " + 
					"and applying each commit again to the updated active branch.";

				return item.Type === "RemoteTrackingBranch" || (item.Type === "Branch" && !item.Current);
			}
		});
		commandService.addCommand(rebaseCommand, "dom");
		commandService.addCommand(rebaseCommand, "object");

		var pushCommand = new mCommands.Command({
			name : "Push All",
			tooltip: "Push commits and tags from your local branch into the remote branch",
			imageClass: "git-sprite-push",
			spriteClass: "gitCommandSprite",
			id : "eclipse.orion.git.push",
			callback: function(data) {
				
				var item = data.items;
				var path = dojo.hash();
				if (item.toRef) {
					item = item.toRef;
				}
				
				var handleResponse = function(jsonData, commandInvocation){
					if (jsonData.JsonData.HostKey){
						doOperation(commandInvocation, jsonData.JsonData);
					} else if (commandInvocation){
						if (jsonData.JsonData.User)
							commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshpassword", "password", "SSH Password:")], true);
						else
							commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshuser", "text", "SSH User Name:"), new mCommands.CommandParameter("sshpassword", "password", "SSH Password:")], true);
						
						commandInvocation.parameters.errorData = jsonData.JsonData;
						commandService._collectParameters(commandInvocation);
					} else {
						doOperation(null, jsonData.JsonData);
					}
				};

				var doOperation = function(commandInvocation, errorData){
					exports.gatherSshCredentials(serviceRegistry, commandInvocation, errorData).then(
						function(options) {
							
							var gitService = serviceRegistry.getService("orion.git.provider");
							if (item.RemoteLocation.length == 1 && item.RemoteLocation[0].Children.length == 1) {
								gitService.doPush(item.RemoteLocation[0].Children[0].Location, "HEAD", true, false, null,
										"Pushing remote: " + path,
										options.gitSshUsername, options.gitSshPassword,
										options.knownHosts, options.gitPrivateKey, options.gitPassphrase).then(
									function(jsonData){
										exports.handleProgressServiceResponse2(jsonData, serviceRegistry, 
											function() {
												if (explorer.parentId === "explorer-tree") {
													if (!jsonData || !jsonData.HttpCode)
														dojo.query(".treeTableRow").forEach(function(node, i) {
														dojo.toggleClass(node, "outgoingCommitsdRow", false);
													});
												} else {
													dojo.hitch(explorer, explorer.changedItem)();
												}
											}, function (jsonData) {
												handleResponse(jsonData, commandInvocation);
											}
										);
									}, function(jsonData, secondArg) {
										exports.handleProgressServiceResponse2(jsonData, serviceRegistry, 
											function() {
											
											}, function (jsonData) {
												handleResponse(jsonData, commandInvocation);
											}
										);
									}	
								);			
							} else {
								var remotes = item.RemoteLocation;
								
								var dialog = new orion.git.widgets.RemotePrompterDialog({
									title: "Choose Branch",
									serviceRegistry: serviceRegistry,
									gitClient: gitService,
									treeRoot: {
										Children: remotes
									},
									hideNewBranch: true,
									func: dojo.hitch(this, 
										function(targetBranch, remote) {
											gitService.doPush(targetBranch.Location, "HEAD", true, true, null,
													"Pushing remote: " + remote.Name,
													options.gitSshUsername, options.gitSshPassword, options.knownHosts,
													options.gitPrivateKey, options.gitPassphrase).then(
												function(jsonData){
													exports.handleProgressServiceResponse2(jsonData, serviceRegistry, 
														function() {
															if (explorer.parentId === "explorer-tree") {
																if (!jsonData || !jsonData.HttpCode)
																	dojo.query(".treeTableRow").forEach(function(node, i) {
																	dojo.toggleClass(node, "outgoingCommitsdRow", false);
																});
															} else {
																dojo.hitch(explorer, explorer.changedItem)();
															}
														}, function (jsonData) {
															handleResponse(jsonData, commandInvocation);
														}
													);
												}, function(jsonData, secondArg) {
													exports.handleProgressServiceResponse2(jsonData, serviceRegistry, 
														function() {
														
														}, function (jsonData) {
															handleResponse(jsonData, commandInvocation);
														}
													);
												}
											);
										}
									)
								});
								dialog.startup();
								dialog.show();	
							}
						}
					);
				};
				
				if (data.parameters && data.parameters.optionsRequested){
					doOperation(null, data.parameters.errorData);
					data.parameters.optionsRequested = false;
					data.parameters.errorData = null;
				} else {
					doOperation(data);
				}
			},
			visibleWhen : function(item) {
				if (item.toRef)
					// for action in the git log
					return item.RepositoryPath === "" && item.toRef.Type === "Branch" && item.toRef.Current && item.toRef.RemoteLocation;
				else
					// for action in the repo view
					return item.Type === "Branch" && item.Current && item.RemoteLocation;
			}
		});
		commandService.addCommand(pushCommand, "dom");
		commandService.addCommand(pushCommand, "object");

		var pushForceCommand = new mCommands.Command({
			name : "Force Push All",
			tooltip: "Push commits and tags from your local branch into the remote branch overriding its current content",
			imageClass: "git-sprite-push",
			spriteClass: "gitCommandSprite",
			id : "eclipse.orion.git.pushForce",
			callback: function(data) {
				if(!confirm("You're going to override content of the remote branch. This can cause the remote repository to lose commits.\n\nAre you sure?"))
					return;
				
				var item = data.items;
				var path = dojo.hash();
				if (item.toRef) {
					item = item.toRef;
				}
				
				var handleResponse = function(jsonData, commandInvocation){
					if (jsonData.JsonData.HostKey){
						doOperation(commandInvocation, jsonData.JsonData);
					} else if (commandInvocation){
						if (jsonData.JsonData.User)
							commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshpassword", "password", "SSH Password:")], true);
						else
							commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshuser", "text", "SSH User Name:"), new mCommands.CommandParameter("sshpassword", "password", "SSH Password:")], true);
						
						commandInvocation.parameters.errorData = jsonData.JsonData;
						commandService._collectParameters(commandInvocation);
					} else {
						doOperation(null, jsonData.JsonData);
					}
				};

				var doOperation = function(commandInvocation, errorData){
					exports.gatherSshCredentials(serviceRegistry, commandInvocation, errorData).then(
						function(options) {
							
							var gitService = serviceRegistry.getService("orion.git.provider");
							if (item.RemoteLocation.length == 1 && item.RemoteLocation[0].Children.length == 1) {
								gitService.doPush(item.RemoteLocation[0].Children[0].Location, "HEAD", true, true, null,
										"Pushing remote: " + path,
										options.gitSshUsername, options.gitSshPassword,
										options.knownHosts, options.gitPrivateKey, options.gitPassphrase).then(
									function(jsonData){
										exports.handleProgressServiceResponse2(jsonData, serviceRegistry, 
											function() {
												if (explorer.parentId === "explorer-tree") {
													if (!jsonData || !jsonData.HttpCode)
														dojo.query(".treeTableRow").forEach(function(node, i) {
														dojo.toggleClass(node, "outgoingCommitsdRow", false);
													});
												} else {
													dojo.hitch(explorer, explorer.changedItem)();
												}
											}, function (jsonData) {
												handleResponse(jsonData, commandInvocation);
											}
										);
									}, function(jsonData, secondArg) {
										exports.handleProgressServiceResponse2(jsonData, serviceRegistry, 
											function() {
											
											}, function (jsonData) {
												handleResponse(jsonData, commandInvocation);
											}
										);
									}	
								);			
							} else {
								var remotes = item.RemoteLocation;
								
								var dialog = new orion.git.widgets.RemotePrompterDialog({
									title: "Choose Branch",
									serviceRegistry: serviceRegistry,
									gitClient: gitService,
									treeRoot: {
										Children: remotes
									},
									hideNewBranch: true,
									func: dojo.hitch(this, 
										function(targetBranch, remote) {
											gitService.doPush(targetBranch.Location, "HEAD", true, true, null,
													"Pushing remote: " + remote.Name,
													options.gitSshUsername, options.gitSshPassword, options.knownHosts,
													options.gitPrivateKey, options.gitPassphrase).then(
												function(jsonData){
													exports.handleProgressServiceResponse2(jsonData, serviceRegistry, 
														function() {
															if (explorer.parentId === "explorer-tree") {
																if (!jsonData || !jsonData.HttpCode)
																	dojo.query(".treeTableRow").forEach(function(node, i) {
																	dojo.toggleClass(node, "outgoingCommitsdRow", false);
																});
															} else {
																dojo.hitch(explorer, explorer.changedItem)();
															}
														}, function (jsonData) {
															handleResponse(jsonData, commandInvocation);
														}
													);
												}, function(jsonData, secondArg) {
													exports.handleProgressServiceResponse2(jsonData, serviceRegistry, 
														function() {
														
														}, function (jsonData) {
															handleResponse(jsonData, commandInvocation);
														}
													);
												}
											);
										}
									)
								});
								dialog.startup();
								dialog.show();	
							}
						}
					);
				};
				
				if (data.parameters && data.parameters.optionsRequested){
					doOperation(null, data.parameters.errorData);
					data.parameters.optionsRequested = false;
					data.parameters.errorData = null;
				} else {
					doOperation(data);
				}
			},
			visibleWhen : function(item) {
				if (item.toRef)
					// for action in the git log
					return item.RepositoryPath === "" && item.toRef.Type === "Branch" && item.toRef.Current && item.toRef.RemoteLocation;
			}
		});
		commandService.addCommand(pushForceCommand, "dom");
		commandService.addCommand(pushForceCommand, "object");

		var switchToRemote = new mCommands.Command({
			name : "Switch to Remote",
			tooltip: "Show the log for the corresponding remote tracking branch",
			id : "eclipse.orion.git.switchToRemote",
			hrefCallback : function(data) {
				return require.toUrl("git/git-log.html")+"#" + data.items.toRef.RemoteLocation[0].Children[0].Location + "?page=1";
			},
			visibleWhen : function(item) {
				return item.toRef != null && item.toRef.Type === "Branch" && item.toRef.Current && item.toRef.RemoteLocation && item.toRef.RemoteLocation.length===1 && item.toRef.RemoteLocation[0].Children.length===1;
			}
		});
		commandService.addCommand(switchToRemote, "dom");

		var previousLogPage = new mCommands.Command({
			name : "< Previous Page",
			tooltip: "Show previous page of git log",
			id : "eclipse.orion.git.previousLogPage",
			hrefCallback : function(data) {
				return require.toUrl("git/git-log.html") + "#" + data.items.PreviousLocation;
			},
			visibleWhen : function(item) {
				if(item.Type === "RemoteTrackingBranch" || (item.toRef != null && item.toRef.Type === "Branch") || item.RepositoryPath != null){
					return item.PreviousLocation !== undefined;
				}
				return false;
			}
		});
		commandService.addCommand(previousLogPage, "dom");

		var nextLogPage = new mCommands.Command({
			name : "Next Page >",
			tooltip: "Show next page of git log",
			id : "eclipse.orion.git.nextLogPage",
			hrefCallback : function(data) {
				return require.toUrl("git/git-log.html") + "#" + data.items.NextLocation;
			},
			visibleWhen : function(item) {
				if(item.Type === "RemoteTrackingBranch" ||(item.toRef != null && item.toRef.Type === "Branch") || item.RepositoryPath != null){
					return item.NextLocation !== undefined;
				}
				return false;
			}
		});
		commandService.addCommand(nextLogPage, "dom");

		var switchToCurrentLocal = new mCommands.Command({
			name : "Switch to Active Local",
			tooltip: "Show the log for the active local branch",
			id : "eclipse.orion.git.switchToCurrentLocal",
			hrefCallback : function(data) {
				var item = data.items;
				var clientDeferred = new dojo.Deferred();

				var cloneLocation = item.CloneLocation;
				if (cloneLocation == null){
					var obj = JSON.parse(item.responseText);
					cloneLocation = obj.JsonData.CloneLocation;
				}
				var gitService = serviceRegistry.getService("orion.git.provider");
				dojo.xhrGet({
					url : cloneLocation,
					headers : {
						"Orion-Version" : "1"
					},
					handleAs : "json",
					timeout : 5000,
					load : function(clone, secondArg) {
						gitService.getGitClone(clone.Children[0].BranchLocation, function(branches){
							dojo.forEach(branches.Children, function(branch, i) {
								if (branch.Current == true){
									clientDeferred.callback(require.toUrl("git/git-log.html") + "#" + branch.CommitLocation + "?page=1");
									return;
								}
							});
						});
					}
				});
				return clientDeferred;
			},
			visibleWhen : function(item) {
				if (item.Type === "RemoteTrackingBranch")
					return true;
				
				try {
					var obj = JSON.parse(item.responseText);
					if (obj.JsonData)
						return true;
				} catch(error) {
					//it is not JSON, just continue;
				}
				
				return false;
			}
		});
		commandService.addCommand(switchToCurrentLocal, "dom");

		var pushToCommand = new mCommands.Command({
			name : "Push to...",
			tooltip: "Push from your local branch into the selected remote branch",
			imageClass: "git-sprite-push",
			spriteClass: "gitCommandSprite",
			id : "eclipse.orion.git.pushto",
			callback: function(data) {
				var item = data.items;
				var remotes = {};
				for(var child_no in item.parent.parent.children){
					if(item.parent.parent.children[child_no].Name === "Remote"){
						remotes = item.parent.parent.children[child_no];
					}
				}

				var gitService = serviceRegistry.getService("orion.git.provider");
				var dialog = new orion.git.widgets.RemotePrompterDialog({
					title: "Choose Branch",
					serviceRegistry: serviceRegistry,
					gitClient: gitService,
					treeRoot: remotes,
					//hideNewBranch: true,
					func: dojo.hitch(this, function(targetBranch, remote, newBranch) {
						//TODO perform push here
						console.info("Branch " + targetBranch + " remote " + remote + " new branch " + newBranch);
					})
				});
				dialog.startup();
				dialog.show();
			},
			visibleWhen : function(item) {
				return false && item.Type === "Branch" && item.Current; //TODO when committing to anothe branch is ready remofe "false &&"
			}
		});
		commandService.addCommand(pushToCommand, "dom");
		commandService.addCommand(pushToCommand, "object");

		var resetIndexCommand = new mCommands.Command({
			name : "Reset",
			tooltip: "Reset your active branch to the state of the selected branch. Discard all staged and unstaged changes.",
			id : "eclipse.orion.git.resetIndex",
			imageClass: "git-sprite-reset",
			spriteClass: "gitCommandSprite",
			callback: function(data) {
				var item = data.items;
				if(confirm("The content of your active branch will be replaced with " + item.Name + ". " +
						"All unstaged and staged changes will be discarded and cannot be recovered. Are you sure?")){
					var service = serviceRegistry.getService("orion.git.provider");
					var progressService = serviceRegistry.getService("orion.page.message");
					progressService.setProgressMessage("Resetting index...");
					service.resetIndex(item.IndexLocation, item.Name).then(
						function(result){
							var display = {};
							display.Severity = "Info";
							display.HTML = false;
							display.Message = "Ok";
							dojo.hitch(explorer, explorer.changedItem)(item);
							progressService.setProgressResult(display);
						}, function (error){
							var display = {};
							display.Severity = "Error";
							display.HTML = false;
							display.Message = error.message;
							progressService.setProgressResult(display);
						}
					);
				}
			},
			visibleWhen : function(item) {
				return item.Type === "RemoteTrackingBranch";
			}
		});
		commandService.addCommand(resetIndexCommand, "object");

		var tagNameParameters = new mCommands.ParametersDescription([new mCommands.CommandParameter('name', 'text', 'Name:')], false);

		var addTagCommand = new mCommands.Command({
			name : "Tag",
			tooltip: "Create a tag for the commit",
			imageClass: "git-sprite-tag",
			spriteClass: "gitCommandSprite",
			id : "eclipse.orion.git.addTag",
			parameters: tagNameParameters,
			callback: function(data) {
				var item = data.items;
				
				var createTagFunction = function(commitLocation, tagName) {						
					serviceRegistry.getService("orion.git.provider").doAddTag(commitLocation, tagName).then(function() {
						dojo.hitch(explorer, explorer.changedItem)(item);
					}, displayErrorOnStatus);
				};
				
				var commitLocation = item.Location;
				
				if (data.parameters.valueFor("name") && !data.parameters.optionsRequested) {
					createTagFunction(commitLocation, data.parameters.valueFor("name"));
				} else {
					exports.getNewItemName(item, explorer, false, data.domNode.id, "Tag name", function(name) {
						if (!name && name == "") {
							return;
						}		
						createTagFunction(commitLocation, name);
					});
				}
			},
			visibleWhen : function(item) {
				return item.Type === "Commit";
			}
		});
		commandService.addCommand(addTagCommand, "object");
		commandService.addCommand(addTagCommand, "dom");

		var removeTagCommand = new mCommands.Command({
			name: "Delete",
			tooltip: "Delete the tag from the repository",
			imageClass: "core-sprite-delete",
			id: "eclipse.removeTag",
			callback: function(data) {
				var item = data.items;
				if (confirm("Are you sure you want to delete tag " + item.Name + "?")) {
					serviceRegistry.getService("orion.git.provider").doRemoveTag(item.Location).then(function() {
						dojo.hitch(explorer, explorer.changedItem)(item.parent);
					}, displayErrorOnStatus);
				}
			},
			visibleWhen: function(item) {
				return item.Type === "Tag";
			}
		});
		commandService.addCommand(removeTagCommand, "object");

		var cherryPickCommand = new mCommands.Command({
			name : "Cherry-Pick",
			tooltip: "Apply the change introduced by the commit to your active branch",
			id : "eclipse.orion.git.cherryPick",
			imageClass: "git-sprite-cherry_pick",
			spriteClass: "gitCommandSprite",
			callback: function(data) {
				var item = data.items;
				var path = dojo.hash();
				var service = serviceRegistry.getService("orion.git.provider");
				var headLocation = item.Location.replace(item.Name, "HEAD");
				service.doCherryPick(headLocation, item.Name, function(jsonData) {
					var display = [];

					// TODO we should not craft locations in the
					// code
					var statusLocation = item.Location.replace("commit/" + item.Name, "status");

					if (jsonData.Result == "OK") {
						// operation succeeded
						display.Severity = "Ok";
						if (jsonData.HeadUpdated) {
							display.HTML = false;
							display.Message = jsonData.Result;

							if (explorer.parentId === "explorer-tree") {
								// refresh commit list
								dojo.xhrGet({
									url: path,
									headers: {
										"Orion-Version": "1"
									},
									handleAs: "json",
									timeout: 5000,
									load: function(jsonData, secondArg) {
										return jsonData;
									},
									error: function(error, ioArgs) {
										console.error("HTTP status code: ", ioArgs.xhr.status);
									}
								}).then(function(jsonData) {
									if (jsonData.HeadLocation) {
										// log view for remote
										service.getLog(jsonData.HeadLocation, jsonData.Id, "Getting git incoming changes", function(scopedCommitsJsonData, secondArg) {
												explorer.renderer.setIncomingCommits(scopedCommitsJsonData.Children);
												explorer.loadCommitsList(jsonData.CommitLocation + "?page=1", jsonData, true);
										});
									} else {
										// log view for branch /
										// all branches
										service.getLog(path, "HEAD", "Getting git outgoing changes", function(scopedCommitsJsonData, secondArg) {
												explorer.renderer.setOutgoingCommits(scopedCommitsJsonData.Children);
												explorer.loadCommitsList(path, jsonData, true);
										});
									}
								});
							}
						} else {
							display.HTML = true;
							display.Message = "<span>Nothing changed.</span>";
						}
					}
					// handle special cases
					else if (jsonData.Result == "CONFLICTING") {
						display.Severity = "Warning";
						display.HTML = true;
						display.Message = "<span>" + jsonData.Result + ". Some conflicts occurred. Go to <a href=\"" + require.toUrl("git/git-status.html") + "#" + statusLocation
								+ "\">Git Status page</a>.<span>";
					} else if (jsonData.Result == "FAILED") {
						display.Severity = "Error";
						display.HTML = true;
						display.Message = "<span>" + jsonData.Result + ". Go to <a href=\"" + require.toUrl("git/git-status.html") + "#" + statusLocation
								+ "\">Git Status page</a>.<span>";
					}
					// handle other cases
					else {
						display.Severity = "Warning";
						display.HTML = false;
						display.Message = jsonData.Result;
					}
					serviceRegistry.getService("orion.page.message").setProgressResult(display);
				}, displayErrorOnStatus);

			},
			visibleWhen : function(item) {
				return item.Type === "Commit";
			}
		});
		commandService.addCommand(cherryPickCommand, "object");
		commandService.addCommand(cherryPickCommand, "dom");
	};

	exports.createStatusCommands = function(serviceRegistry, commandService, refreshStatusCallBack, cmdBaseNumber, navigator) {
		
		function displayErrorOnStatus(error) {
			
			if (error.status === 401 || error.status === 403)
				return;
			
			var display = [];
			
			display.Severity = "Error";
			display.HTML = false;
			
			try {
				var resp = JSON.parse(error.responseText);
				display.Message = resp.DetailedMessage ? resp.DetailedMessage : resp.Message;
			} catch (Exception) {
				display.Message = error.message;
			}
			
			serviceRegistry.getService("orion.page.message").setProgressResult(display);
		}
		
		var fetchCommand = new mCommands.Command({
			name : "Fetch",
			tooltip : "Fetch from the remote branch into your remote tracking branch",
			imageClass: "git-sprite-fetch",
			spriteClass: "gitCommandSprite",
			id : "eclipse.orion.git.fetch",
			callback: function(data) {
				var item = data.items;
				var path = item.Location;
				var gitService = serviceRegistry.getService("orion.git.provider");
				exports.getDefaultSshOptions(serviceRegistry).then(function(options) {
					var func = arguments.callee;
					gitService.doFetch(path, false, null,
							options.gitSshUsername,
							options.gitSshPassword,
							options.knownHosts,
							options.gitPrivateKey,
							options.gitPassphrase).then(function(jsonData, secondArg) {
						exports.handleProgressServiceResponse(jsonData, options, serviceRegistry, function(jsonData) {
							dojo.xhrGet({
								url: path,
								headers: {
									"Orion-Version": "1"
								},
								postData: dojo.toJson({
									"GitSshUsername": options.gitSshUsername,
									"GitSshPassword": options.gitSshPassword,
									"GitSshPrivateKey": options.gitPrivateKey,
									"GitSshPassphrase": options.gitPassphrase,
									"GitSshKnownHost": options.knownHosts
								}),
								handleAs: "json",
								timeout: 5000,
								load: function(jsonData, secondArg) {
									return jsonData;
								},
								error: function(error, ioArgs) {
									console.error("HTTP status code: ", ioArgs.xhr.status);
								}
							}).then(function(remoteJsonData) {
								if (true/*
										 * explorer.parentId ===
										 * "explorer-tree"
										 */)
									gitService.getLog(remoteJsonData.HeadLocation, remoteJsonData.Id, "Getting git incoming changes", function(scopedCommitsJsonData) {
											navigator._gitCommitNavigatorRem.renderer.setIncomingCommits(scopedCommitsJsonData.Children);
											navigator._gitCommitNavigatorRem.loadCommitsList(remoteJsonData.CommitLocation + "?page=1&pageSize=5", remoteJsonData, true);
									});
							});
						}, func, "Fetch Git Repository");
					}, function(jsonData, secondArg) {
						exports.handleProgressServiceResponse(jsonData, options, serviceRegistry, function() {}, func, "Fetch Git Repository");
					});
				});
			},
			visibleWhen : function(item) {
				return item.Type === "RemoteTrackingBranch";
			}
		});
		commandService.addCommand(fetchCommand, "object");
		commandService.addCommand(fetchCommand, "dom");
		commandService.registerCommandContribution("eclipse.orion.git.fetch", cmdBaseNumber+1);	

		var mergeCommand = new mCommands.Command({
			name : "Merge",
			tooltip: "Merge the content from the branch to your active branch",
			imageClass: "git-sprite-merge",
			spriteClass: "gitCommandSprite",
			id : "eclipse.orion.git.merge",
			callback: function(data) {
				var item = data.items;
				var gitService = serviceRegistry.getService("orion.git.provider");
				var progressService = serviceRegistry.getService("orion.page.message");
				gitService.doMerge(item.HeadLocation, item.Name).then(function(result){
						var display = [];
						
						if (result.jsonData && (result.jsonData.Result == "FAST_FORWARD" || result.jsonData.Result == "ALREADY_UP_TO_DATE")){
							dojo.query(".treeTableRow").forEach(function(node, i) {
								dojo.toggleClass(node, "incomingCommitsdRow", false);
							});
							display.Severity = "Ok";
							display.HTML = false;
							display.Message = result.jsonData.Result;

							refreshStatusCallBack();
							progressService.setProgressResult(display);
						} else if (result.jsonData){
							display.Severity = "Warning";
							display.HTML = true;
							display.Message = "<span>" + result.jsonData.Result+"<span>";

							progressService.setProgressResult(display);
						} else if (result.error) {
							display.Severity = "Error";
							if(result.error.responseText && JSON.parse(result.error.responseText)){
								var resp = JSON.parse(result.error.responseText);
								display.Message = resp.DetailedMessage ? resp.DetailedMessage : resp.Message;
							}else{
								display.Message = result.error.message;
							}
							display.HTML = true;
							display.Message ="<span>" + display.Message + "<span>";
							
							progressService.setProgressResult(display);
						}
					}, function (error, ioArgs) {
						var display = [];
						
						display.Severity = "Error";
						display.HTML = true;
						display.Message = "<span>" + dojo.fromJson(ioArgs.xhr.responseText).DetailedMessage +"</span>";
						
						progressService.setProgressResult(display);
					});
			},
			visibleWhen : function(item) {
				return item.Type === "RemoteTrackingBranch" || (item.Type === "Branch" && !item.Current);
			}
		});
		commandService.addCommand(mergeCommand, "object");
		commandService.addCommand(mergeCommand, "dom");
		commandService.registerCommandContribution("eclipse.orion.git.merge", cmdBaseNumber+2);	

		var pushCommand = new mCommands.Command({
			name : "Push",
			tooltip: "Push from your local branch into the remote branch",
			imageClass: "git-sprite-push",
			spriteClass: "gitCommandSprite",
			id : "eclipse.orion.git.push",
			callback: function(data) {
				var item = data.items;
				var path = dojo.hash();
				var gitService = serviceRegistry.getService("orion.git.provider");
				if(item.RemoteLocation.length==1 && item.RemoteLocation[0].Children.length==1){
					exports.getDefaultSshOptions(serviceRegistry).then(function(options){
						var func = arguments.callee;

						gitService.doPush(item.RemoteLocation[0].Children[0].Location, "HEAD", true, false, null,
								"Pushing remote: " + path,
								options.gitSshUsername, options.gitSshPassword, options.knownHosts,
								options.gitPrivateKey, options.gitPassphrase).then(function(remoteJsonData){
							exports.handleProgressServiceResponse(remoteJsonData, options, serviceRegistry,
								function(jsonData){
									if (!jsonData || !jsonData.HttpCode){
										dojo.query(".treeTableRow").forEach(function(node, i) {
											dojo.toggleClass(node, "outgoingCommitsdRow", false);
										});
										refreshStatusCallBack();
									}
								}, func, "Push Git Repository");
						}, function(jsonData, secondArg) {
							exports.handleProgressServiceResponse(jsonData, options, serviceRegistry, function() {}, func, "Push Git Repository");
						});
					});
				} else {
					var remotes = item.RemoteLocation;
					var dialog = new orion.git.widgets.RemotePrompterDialog({
						title: "Choose Branch",
						serviceRegistry: serviceRegistry,
						gitClient: gitService,
						treeRoot: {Children: remotes},
						hideNewBranch: true,
						func: dojo.hitch(this, function(targetBranch, remote) {
							exports.getDefaultSshOptions(serviceRegistry).then(function(options){
								var func = arguments.callee;
								gitService.doPush(targetBranch.Location, "HEAD", true, false, null,
										"Pushing remote: " + remote,
										options.gitSshUsername, options.gitSshPassword, options.knownHosts,
										options.gitPrivateKey, options.gitPassphrase).then(function(remoteJsonData){
								exports.handleProgressServiceResponse(remoteJsonData, options, serviceRegistry,
									function(jsonData){
										if (!jsonData || !jsonData.HttpCode){
											dojo.query(".treeTableRow").forEach(function(node, i) {
												dojo.toggleClass(node, "outgoingCommitsdRow", false);
											});
											refreshStatusCallBack();
										}
									}, func, "Push Git Repository");
								});
							}, function(jsonData, secondArg) {
								exports.handleProgressServiceResponse(jsonData, options, serviceRegistry, function() {}, func, "Pushing remote: " + remote);
							});
						})
					});
					dialog.startup();
					dialog.show();
				}
			},
			visibleWhen : function(item) {
				return item.Type === "LocalBranch" ;
			}
		});
		commandService.addCommand(pushCommand, "object");
		commandService.addCommand(pushCommand, "dom");
		commandService.registerCommandContribution("eclipse.orion.git.push", cmdBaseNumber+3);
	};

	exports.createGitClonesCommands = function(serviceRegistry, commandService, explorer, toolbarId, selectionTools, fileClient) {
		
		function displayErrorOnStatus(error) {
			
			if (error.status === 401 || error.status === 403)
				return;
			
			var display = [];
			
			display.Severity = "Error";
			display.HTML = false;
			
			try {
				var resp = JSON.parse(error.responseText);
				display.Message = resp.DetailedMessage ? resp.DetailedMessage : resp.Message;
			} catch (Exception) {
				display.Message = error.message;
			}
			
			serviceRegistry.getService("orion.page.message").setProgressResult(display);
		}
		
		// Git repository configuration
		
		var addConfigParameters = new mCommands.ParametersDescription([new mCommands.CommandParameter('key', 'text', 'Key:'), 
		                                                               new mCommands.CommandParameter('value', 'text', 'Value:')], false);
		
		var addConfigEntryCommand = new mCommands.Command({
			name: "New Configuration Entry",
			tooltip: "Add a new entry to the repository configuration",
			imageClass: "core-sprite-add",
			id: "eclipse.orion.git.addConfigEntryCommand",
			parameters: addConfigParameters,
			callback: function(data) {
				var item = data.items;
				var gitService = serviceRegistry.getService("orion.git.provider");
				if (data.parameters.valueFor("key") && data.parameters.valueFor("value")){
					gitService.addCloneConfigurationProperty(item.ConfigLocation, data.parameters.valueFor("key"), data.parameters.valueFor("value")).then(
						function(jsonData){
							dojo.hitch(explorer, explorer.changedItem)(item);
						}, displayErrorOnStatus
					);
				}
			}
		});
		commandService.addCommand(addConfigEntryCommand, "dom");
		
		var editConfigParameters = new mCommands.ParametersDescription([new mCommands.CommandParameter('value', 'text', 'Value:')], false);
		
		var editConfigEntryCommand = new mCommands.Command({
			name: "Edit",
			tooltip: "Edit the configuration entry",
			imageClass: "core-sprite-edit",
			id: "eclipse.orion.git.editConfigEntryCommand",
			parameters: editConfigParameters,
			callback: function(data) {
				var item = data.items;
				var gitService = serviceRegistry.getService("orion.git.provider");
				if (data.parameters.valueFor("value")){
					gitService.editCloneConfigurationProperty(item.Location, data.parameters.valueFor("value")).then(
						function(jsonData){
							dojo.hitch(explorer, explorer.changedItem)(item);
						}, displayErrorOnStatus
					);
				}
			},
			visibleWhen: function(item) {
				return (item.Key && item.Value && item.Location);
			}
		});
		commandService.addCommand(editConfigEntryCommand, "object");
		
		var deleteConfigEntryCommand = new mCommands.Command({
			name: "Delete",
			tooltip: "Delete the configuration entry",
			imageClass: "core-sprite-delete",
			id: "eclipse.orion.git.deleteConfigEntryCommand",
			callback: dojo.hitch(this, function(data) {
				var item = data.items;
				var gitService = serviceRegistry.getService("orion.git.provider");
				if (confirm("Are you sure you want to delete " + item.Key + "?")) {
					gitService.deleteCloneConfigurationProperty(item.Location).then(
						function(jsonData) {
							dojo.hitch(explorer, explorer.changedItem)(item);
						}, displayErrorOnStatus
					);
				}
			}),
			visibleWhen: function(item) {
				return (item.Key && item.Value && item.Location);
			}
		});
		commandService.addCommand(deleteConfigEntryCommand, "object");
		
		//
		
		var cloneParameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("url", "url", "Repository URL:")], true);

		function forceSingleItem(item) {
			if (dojo.isArray(item)) {
				if (item.length > 1) {
					item = {};
				} else {
					item = item[0];
				}
			}
			return item;
		}

		var cloneGitRepositoryCommand = new mCommands.Command({
			name : "Clone Repository",
			tooltip : "Clone an existing Git repository to a folder",
			id : "eclipse.cloneGitRepository",
			parameters: cloneParameters,
			callback : function(data) {
				var gitService = serviceRegistry.getService("orion.git.provider");
				var cloneFunction = function(gitUrl, path, name) {
					exports.getDefaultSshOptions(serviceRegistry).then(function(options) {
						var func = arguments.callee;
						gitService.cloneGitRepository(name, gitUrl, path, explorer.defaultPath, options.gitSshUsername, options.gitSshPassword, options.knownHosts,
								options.gitPrivateKey, options.gitPassphrase).then(function(jsonData, secondArg) {
							exports.handleProgressServiceResponse(jsonData, options, serviceRegistry, function(jsonData) {
								if (explorer.redisplayClonesList) {
									dojo.hitch(explorer, explorer.redisplayClonesList)();
								}
							}, func, "Clone Git Repository");
						}, function(jsonData, secondArg) {
							exports.handleProgressServiceResponse(jsonData, options, serviceRegistry, function() {}, func, "Clone Git Repository");
						});
					});
				};
				if (data.parameters.valueFor("url") && !data.parameters.optionsRequested) {
					cloneFunction(data.parameters.valueFor("url"));
				} else {
					var dialog = new orion.git.widgets.CloneGitRepositoryDialog({
						serviceRegistry: serviceRegistry,
						fileClient: fileClient,
						url: data.parameters.valueFor("url"),
						alwaysShowAdvanced: data.parameters.optionsRequested,
						func: cloneFunction
					});
							
					dialog.startup();
					dialog.show();
				}
			},
			visibleWhen : function(item) {
				return true;
			}
		});
		commandService.addCommand(cloneGitRepositoryCommand, "dom");

		var initRepositoryParameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("folderName", "text", "New folder:")], true);
		
		var initGitRepositoryCommand = new mCommands.Command({
			name : "Init Repository",
			tooltip : "Create a new Git repository in a new folder",
			id : "eclipse.initGitRepository",
			parameters: initRepositoryParameters,
			callback : function(data) {
				var gitService = serviceRegistry.getService("orion.git.provider");
				var initRepositoryFunction = function(gitUrl, path, name) {
					exports.getDefaultSshOptions(serviceRegistry).then(function(options){
						var func = arguments.callee;
						gitService.cloneGitRepository(name, gitUrl, path, explorer.defaultPath).then(function(jsonData, secondArg){
							exports.handleProgressServiceResponse(jsonData, options, serviceRegistry, function(jsonData){
								if(explorer.redisplayClonesList)
									dojo.hitch(explorer, explorer.redisplayClonesList)();
							}, func, "Init Git Repository");
						}, function(jsonData, secondArg) {
							exports.handleProgressServiceResponse(jsonData, options, serviceRegistry, function() {}, func, "Init Git Repository");
						});
					});
				};
				
				if (data.parameters.valueFor("folderName") && !data.parameters.optionsRequested) {
					initRepositoryFunction(null, null, data.parameters.valueFor("folderName"));
				} else {
					var dialog = new orion.git.widgets.CloneGitRepositoryDialog({
						serviceRegistry: serviceRegistry,
						title: "Init Git Repository",
						fileClient: fileClient,
						advancedOnly: true,
						func: initRepositoryFunction
					});
							
					dialog.startup();
					dialog.show();
				}
			},
			visibleWhen : function(item) {
				return true;
			}
		});
		commandService.addCommand(initGitRepositoryCommand, "dom");

		var deleteCommand = new mCommands.Command({
			name: "Delete", // "Delete Repository"
			tooltip: "Delete the repository",
			imageClass: "core-sprite-delete",
			id: "eclipse.git.deleteClone",
			visibleWhen: function(item) {
				var items = dojo.isArray(item) ? item : [item];
				if (items.length === 0) {
					return false;
				}
				for (var i=0; i < items.length; i++) {
					if (!items[i].ContentLocation) {
						return false;
					}
				}
				return true;
			},
			callback: function(data) {
				var item = data.items;
				var gitService = serviceRegistry.getService("orion.git.provider");
				if(dojo.isArray(item)){
					if(confirm("Are you sure you want do delete " + item.length + " repositories?")){
						var alreadyDeleted = 0;
						for(var i=0; i<item.length; i++){
							gitService.removeGitRepository(item[i].Location).then(
									function(jsonData){
										alreadyDeleted++;
										if(alreadyDeleted >= item.length && explorer.redisplayClonesList){
											dojo.hitch(explorer, explorer.redisplayClonesList)();
										}
									}, displayErrorOnStatus);
						}
					}
				} else {
					if(confirm("Are you sure you want to delete " + item.Name + "?"))
						gitService.removeGitRepository(item.Location).then(
							function(jsonData){
								if(explorer.redisplayClonesList){
									dojo.hitch(explorer, explorer.redisplayClonesList)();
								}
							},
							this.displayErrorOnStatus);
				}
				
			}
		});
		commandService.addCommand(deleteCommand, "object");
		commandService.addCommand(deleteCommand, "dom");

		var applyPatchCommand = new mCommands.Command({
			name : "Apply Patch",
			tooltip: "Apply a patch on the selected repository",
			id : "eclipse.orion.git.applyPatch",
			imageClass: "git-sprite-apply_patch",
			spriteClass: "gitCommandSprite",
			callback: function(data) {
				var item = forceSingleItem(data.items);
				var dialog = new orion.git.widgets.ApplyPatchDialog({
					title: "Apply Patch",
					diffLocation: item.DiffLocation
				});
				dialog.startup();
				dialog.show();
			},
			visibleWhen : function(item) {
				return item.Type === "Clone" ;
			}
		});
		commandService.addCommand(applyPatchCommand, "object");
		
		var openCommitParameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("commitName", "text", "Commit name:")], true);
		
		var openCommitCommand = new mCommands.Command({
			name : "Open Commit",
			tooltip: "Open the commit with the given name",
			id : "eclipse.orion.git.openCommitCommand",
			imageClass: "git-sprite-apply_patch",
			spriteClass: "gitCommandSprite",
			parameters: openCommitParameters,
			callback: function(data) {
				var findCommitLocation = function (repositories, commitName, deferred) {
					if (deferred == null)
						deferred = new dojo.Deferred();
					
					if (repositories.length > 0) {
						serviceRegistry.getService("orion.git.provider").doGitLog(
							"/gitapi/commit/" + data.parameters.valueFor("commitName") + repositories[0].ContentLocation + "?page=1&pageSize=1", null, null, "Looking for the commit").then(
							function(resp){
								deferred.callback(resp.Children[0].Location);
							},
							function(error) {
								findCommitLocation(repositories.slice(1), commitName, deferred);
							}
						);
					} else {
						deferred.errback();
					}
					
					return deferred;
				};
				
				var openCommit = function(repositories) {
					if (data.parameters.optionsRequested) {
						new orion.git.widgets.OpenCommitDialog(
							{repositories: repositories, serviceRegistry: serviceRegistry, commitName: data.parameters.valueFor("commitName")}
						).show();
					} else {
						serviceRegistry.getService("orion.page.message").setProgressMessage("Looking for the commit");
						findCommitLocation(repositories, data.parameters.valueFor("commitName")).then(
							function(commitLocation){
								if(commitLocation !== null){
									var commitPageURL = "/git/git-commit.html#" + commitLocation + "?page=1&pageSize=1";
									window.open(commitPageURL);
								}
							}, function () {
								var display = [];
								display.Severity = "warning";
								display.HTML = false;
								display.Message = "No commits found";
								serviceRegistry.getService("orion.page.message").setProgressResult(display);
							}
						);
					}	
				};

				if (data.items.Type === "Clone") {
					var repositories = [data.items];
					openCommit(repositories);
				} else if (data.items.CloneLocation){
					serviceRegistry.getService("orion.git.provider").getGitClone(data.items.CloneLocation).then(
						function(jsonData){
							var repositories = jsonData.Children;
							openCommit(repositories);
						}
					);
				} else {
					var repositories = data.items;
					openCommit(repositories);
				}
			},
			visibleWhen : function(item) {
				return item.Type === "Clone" || item.CloneLocation || (item.length > 1 && item[0].Type === "Clone") ;
			}
		});
		commandService.addCommand(openCommitCommand, "dom");

		var mapToGithubCommand = new mCommands.Command({
			name : "Show in GitHub",
			tooltip: "Show this repository at GitHub",
			id : "orion.git.gotoGithub",
			hrefCallback : function(data) {
				//url format should include github.com/username/reponame.git or github.com:username/reponame.git
				var url = /github\.com.*\.git/.exec(data.items.GitUrl)[0];
				//convert : to / if needed
				url = url.replace(':', '/');
				return "https://" + url.substring(0, url.length-4);
			},
			visibleWhen : function(item) {
				//url format should include github.com/username/reponame.git or github.com:username/reponame.git
				return item.GitUrl && /github\.com.*\.git/.exec(item.GitUrl);
			}
		});
		commandService.addCommand(mapToGithubCommand, "dom");

		var mapToEclipseOrgCommand = new mCommands.Command({
			name : "Show in eclipse.org",
			tooltip: "Show this repository at eclipse.org",
			id : "orion.git.gotoEclipseGit",
			hrefCallback : function(data) {
				var item = data.items;
				var token = "git.eclipse.org/gitroot";
				var found = item.GitUrl.indexOf(token);
				if (found > -1) {
					return "http://git.eclipse.org/c" + item.GitUrl.substr(found+token.length, item.GitUrl.length);
				}
			},
			visibleWhen : function(item) {
				return item.GitUrl && item.GitUrl.indexOf("git.eclipse.org/gitroot") > -1;
			}
		});
		commandService.addCommand(mapToEclipseOrgCommand, "dom");
	};
}());
return exports;	
});
