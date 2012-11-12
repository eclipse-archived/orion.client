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

/*global alert confirm orion window widgets eclipse:true serviceRegistry define */
/*jslint browser:true eqeqeq:false laxbreak:true */
define(['i18n!git/nls/gitmessages', 'require', 'dojo', 'orion/commands', 'orion/uiUtils', 'orion/git/util', 'orion/compare/compareUtils', 'orion/git/gitPreferenceStorage', 'orion/git/widgets/CloneGitRepositoryDialog', 
        'orion/git/widgets/AddRemoteDialog', 'orion/git/widgets/GitCredentialsDialog', 'orion/widgets/NewItemDialog', 
        'orion/git/widgets/RemotePrompterDialog', 'orion/git/widgets/ApplyPatchDialog', 'orion/git/widgets/OpenCommitDialog', 'orion/git/widgets/ConfirmPushDialog', 'orion/git/widgets/ReviewRequestDialog', 
        'orion/git/widgets/ContentDialog', 'orion/git/widgets/CommitDialog'], 
        function(messages, require, dojo, mCommands, mUIUtils, mGitUtil, mCompareUtils, GitPreferenceStorage) {

/**
 * @namespace The global container for eclipse APIs.
 */
var exports = {};
//this function is just a closure for the global "doOnce" flag
(function() {
	var doOnce = false;

	exports.updateNavTools = function(registry, explorer, toolbarId, selectionToolbarId, item, pageNavId) {
		var toolbar = dojo.byId(toolbarId);
		var commandService = registry.getService("orion.page.command"); //$NON-NLS-0$
		if (toolbar) {
			commandService.destroy(toolbar);
		} else {
			throw "could not find toolbar " + toolbarId; //$NON-NLS-0$
		}
		commandService.renderCommands(toolbarId, toolbar, item, explorer, "button");  //$NON-NLS-0$
		
		if (pageNavId) {
			var pageNav = dojo.byId(pageNavId);
			if (pageNav) {
				commandService.destroy(pageNav);
				commandService.renderCommands(pageNavId, pageNav, item, explorer, "button");   //$NON-NLS-0$
			}
		}
		
		if (selectionToolbarId) {
			var selectionTools = dojo.byId(selectionToolbarId);
			if (selectionTools) {
				commandService.destroy(selectionToolbarId);
				commandService.renderCommands(selectionToolbarId, selectionTools, null, explorer, "button");  //$NON-NLS-0$
			}
		}

		// Stuff we do only the first time
		if (!doOnce) {
			doOnce = true;
			registry.getService("orion.page.selection").addEventListener("selectionChanged", function(event) { //$NON-NLS-1$ //$NON-NLS-0$
				var selectionTools = dojo.byId(selectionToolbarId);
				if (selectionTools) {
					commandService.destroy(selectionTools);
					commandService.renderCommands(selectionToolbarId, selectionTools, event.selections, explorer, "button"); //$NON-NLS-0$
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
			mUIUtils.getUserText(domId+"EditBox", refNode, false, defaultName,  //$NON-NLS-0$
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
	};

	exports.handleKnownHostsError = function(serviceRegistry, errorData, options, func){
		if(confirm(dojo.string.substitute(messages["Would you like to add ${0} key for host ${1} to continue operation? Key fingerpt is ${2}."],
				[errorData.KeyType, errorData.Host, errorData.HostFingerprint]))){
			var sshService = serviceRegistry.getService("orion.net.ssh"); //$NON-NLS-0$
			sshService.addKnownHosts(errorData.Host + " " + errorData.KeyType + " " + errorData.HostKey).then(function(){ //$NON-NLS-1$ //$NON-NLS-0$
				sshService.getKnownHosts().then(function(knownHosts){
					options.knownHosts = knownHosts;
					func(options);
				});
				if(options.failedOperation){
					var progressService = serviceRegistry.getService("orion.page.progress"); //$NON-NLS-0$
					dojo.hitch(progressService, progressService.removeOperation)(options.failedOperation.Location, options.failedOperation.Id);
				}
			});
		}
	};

	exports.handleSshAuthenticationError = function(serviceRegistry, errorData, options, func, title){
		var repository = errorData.Url;
		
		var failure = function(){
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
				var progressService = serviceRegistry.getService("orion.page.progress"); //$NON-NLS-0$
				dojo.hitch(progressService, progressService.removeOperation)(options.failedOperation.Location, options.failedOperation.Id);
			}
		};
		
		if((options.gitSshUsername && options.gitSshUsername!=="") ||
			(options.gitSshPassword && options.gitSshPassword!=="") ||
			(options.gitPrivateKey && options.gitPrivateKey!=="")){
			failure();
		} else {
			var gitPreferenceStorage = new GitPreferenceStorage(serviceRegistry);
			gitPreferenceStorage.get(repository).then(
				function(credentials){
					if(credentials.gitPrivateKey !== "" || credentials.gitSshUsername !== "" || credentials.gitSshPassword !== ""){
						if(options.failedOperation){
							var progressService = serviceRegistry.getService("orion.page.progress"); //$NON-NLS-0$
							dojo.hitch(progressService, progressService.removeOperation)(options.failedOperation.Location, options.failedOperation.Id);
						}
					
						func({ knownHosts: options.knownHosts, gitSshUsername: credentials.gitSshUsername, gitSshPassword: credentials.gitSshPassword, gitPrivateKey: credentials.gitPrivateKey, gitPassphrase: credentials.gitPassphrase}); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						return;
					}
					
					failure();
				}, failure
			);
		}
	};

	exports.getDefaultSshOptions = function(serviceRegistry, authParameters){
		var def = new dojo.Deferred();
		var sshService = serviceRegistry.getService("orion.net.ssh"); //$NON-NLS-0$
		var sshUser =  authParameters && !authParameters.optionsRequested ? authParameters.valueFor("sshuser") : ""; //$NON-NLS-0$
		var sshPassword = authParameters && !authParameters.optionsRequested ? authParameters.valueFor("sshpassword") : ""; //$NON-NLS-0$
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
			display.Severity = "Error"; //$NON-NLS-0$
			display.HTML = false;
			
			try {
				display.Message = jsonData.DetailedMessage ? jsonData.DetailedMessage : jsonData.Message;
			} catch (e) {
				display.Message = e.message;
			}
			
			serviceRegistry.getService("orion.page.message").setProgressResult(display); //$NON-NLS-0$
			break;
		}
			
	};

	exports.gatherSshCredentials = function(serviceRegistry, data, title){
		var def = new dojo.Deferred();
		var repository;
		
		//TODO This should be somehow unified
		if(data.items.RemoteLocation !== undefined){ repository = data.items.RemoteLocation[0].GitUrl; }
		else if(data.items.GitUrl !== undefined) { repository = data.items.GitUrl; }
		else if(data.items.errorData !== undefined) { repository = data.items.errorData.Url; }
		else if(data.items.toRef !== undefined) { repository = data.items.toRef.RemoteLocation[0].GitUrl; }

		var triggerCallback = function(sshObject){
			serviceRegistry.getService("orion.net.ssh").getKnownHosts().then(function(knownHosts){ //$NON-NLS-0$
				data.sshObject = sshObject;
				def.callback({
					knownHosts: knownHosts,
					gitSshUsername: sshObject.gitSshUsername,
					gitSshPassword: sshObject.gitSshPassword,
					gitPrivateKey: sshObject.gitPrivateKey,
					gitPassphrase: sshObject.gitPassphrase
				});
			});
		};
		
		var errorData = data.errorData;
		// if this is a known hosts error, show a prompt always
		if (errorData && errorData.HostKey) {
			if(confirm(dojo.string.substitute(messages['Would you like to add ${0} key for host ${1} to continue operation? Key fingerpt is ${2}.'],
					[errorData.KeyType, errorData.Host, errorData.HostFingerprint]))){
				var sshService = serviceRegistry.getService("orion.net.ssh"); //$NON-NLS-0$
				sshService.addKnownHosts(errorData.Host + " " + errorData.KeyType + " " + errorData.HostKey).then( //$NON-NLS-1$ //$NON-NLS-0$
					function(){
						if(data.sshObject && (data.sshObject.gitSshUsername!=="" || data.sshObject.gitSshPassword!=="" || data.sshObject.gitPrivateKey!=="")){
							triggerCallback({
								gitSshUsername: "",
								gitSshPassword: "",
								gitPrivateKey: "",
								gitPassphrase: ""
							});
						} else {
							var gitPreferenceStorage = new GitPreferenceStorage(serviceRegistry);
							gitPreferenceStorage.get(repository).then(
								function(credentials){
									triggerCallback(credentials);
								},
								function(){
									triggerCallback({
										gitSshUsername: "",
										gitSshPassword: "",
										gitPrivateKey: "",
										gitPassphrase: ""
									});
								}
							);
						}
					}
				);
			}
			return def;
		}
		
		var failure = function(){
			if (!data.parameters && !data.optionsRequested){
				triggerCallback({gitSshUsername: "", gitSshPassword: "", gitPrivateKey: "", gitPassphrase: ""}); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				return;
			}
		
			// try to gather creds from the slideout first
			if (data.parameters && !data.optionsRequested) {
				var sshUser =  data.parameters ? data.parameters.valueFor("sshuser") : ""; //$NON-NLS-0$
				var sshPassword = data.parameters ? data.parameters.valueFor("sshpassword") : "";	 //$NON-NLS-0$
				var saveCredentials = (data.parameters && data.parameters.valueFor("saveCredentials")) ? data.parameters.valueFor("saveCredentials") : false;
				
				var gitPreferenceStorage = new GitPreferenceStorage(serviceRegistry);
				if(saveCredentials){
					gitPreferenceStorage.put(repository, {
						gitSshUsername : sshUser,
						gitSshPassword : sshPassword
					}).then(
						function(){
							triggerCallback({ gitSshUsername: sshUser, gitSshPassword: sshPassword, gitPrivateKey: "", gitPassphrase: ""}); //$NON-NLS-0$
						}
					);
					return;
				} else {
					triggerCallback({ gitSshUsername: sshUser, gitSshPassword: sshPassword, gitPrivateKey: "", gitPassphrase: ""}); //$NON-NLS-0$
					return;
				}
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
			return;
		};

		if(data.sshObject && (data.sshObject.gitSshUsername!=="" || data.sshObject.gitSshPassword!=="" || data.sshObject.gitPrivateKey!=="")){
			failure();
		} else {
			var gitPreferenceStorage = new GitPreferenceStorage(serviceRegistry);
			gitPreferenceStorage.get(repository).then(
				function(credentials){
					if(credentials.gitPrivateKey !== "" || credentials.gitSshUsername !== "" || credentials.gitSshPassword !== ""){
						triggerCallback(credentials);
						return;
					}
					
					failure();
				}, failure
			);
		}
		
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
				var progressService = serviceRegistry.getService("orion.page.progress"); //$NON-NLS-0$
				dojo.hitch(progressService, progressService.removeOperation)(jsonData.failedOperation.Location, jsonData.failedOperation.Id);
			}
			sshCallback(jsonData);
			return;
		case 400:
			if(jsonData.JsonData && jsonData.JsonData.HostKey){
				if (jsonData.failedOperation){
					var progressService = serviceRegistry.getService("orion.page.progress"); //$NON-NLS-0$
					dojo.hitch(progressService, progressService.removeOperation)(jsonData.failedOperation.Location, jsonData.failedOperation.Id);
				}
				sshCallback(jsonData);
				return;
			}
		default:
			var display = [];
			display.Severity = "Error"; //$NON-NLS-0$
			display.HTML = false;
			
			try {
				display.Message = jsonData.DetailedMessage ? jsonData.DetailedMessage : jsonData.Message;
			} catch (e) {
				display.Message = e.message;
			}
			
			serviceRegistry.getService("orion.page.message").setProgressResult(display); //$NON-NLS-0$
			break;
		}
			
	};

	exports.createFileCommands = function(serviceRegistry, commandService, explorer, toolbarId) {
		
		function displayErrorOnStatus(error) {
			
			if (error.status === 401 || error.status === 403)
				return;
			
			var display = [];
			
			display.Severity = "Error"; //$NON-NLS-0$
			display.HTML = false;
			
			try {
				var resp = JSON.parse(error.responseText);
				display.Message = resp.DetailedMessage ? resp.DetailedMessage : resp.Message;
			} catch (Exception) {
				display.Message = error.message;
			}
			
			serviceRegistry.getService("orion.page.message").setProgressResult(display); //$NON-NLS-0$
		}
		
		// TODO: not used by the git clone navigator, could be removed
		var linkRepoCommand = new mCommands.Command({
			name: messages["Link Repository"],
			imageClass: "core-sprite-link", //$NON-NLS-0$
			id: "eclipse.linkRepository", //$NON-NLS-0$
			callback: function(data) {
				var dialog = new orion.widgets.NewItemDialog({
					title: messages['Link Repository'],
					label: messages["Folder name:"],
					func:  function(name, url, create){
						var service = serviceRegistry.getService("orion.core.file");							 //$NON-NLS-0$
						service.loadWorkspace("").then(function(loadedWorkspace){
							service.createProject(loadedWorkspace.Location, name, data.items.ContentLocation, false).then(
									function(jsonResp){
										alert(messages["Repository was linked to "] + jsonResp.Name);
										service.read(jsonResp.ContentLocation, true).then(function(jsonData){
											window.location.replace(require.toUrl("navigate/table.html")+"#"+jsonData.ChildrenLocation); //redirect to the workspace to see the linked resource //$NON-NLS-1$ //$NON-NLS-0$
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
		commandService.addCommand(linkRepoCommand);

		var checkoutTagNameParameters = new mCommands.ParametersDescription([new mCommands.CommandParameter('name', 'text', messages["Local Branch Name:"])]); //$NON-NLS-1$ //$NON-NLS-0$
		var checkoutTagCommand = new mCommands.Command({
			name: messages['Checkout'],
			tooltip: messages["Checkout the current tag, creating a local branch based on its contents."],
			imageClass: "git-sprite-checkout", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			id: "eclipse.checkoutTag", //$NON-NLS-0$
			parameters: checkoutTagNameParameters,
			callback: function(data) {
				var item = data.items;
				function getBranchItem(){
					if (item.Repository)
						return item.Repository.BranchLocation;
					
					for(var child_no in item.parent.parent.children){
						if(item.parent.parent.children[child_no].Name==="Branches"){ //$NON-NLS-0$
							return item.parent.parent.children[child_no];
						}
					}
					return item.parent.parent;
				}
				
				var checkoutTagFunction = function(repositoryLocation, itemName, name){
					var deferred = serviceRegistry.getService("orion.git.provider").checkoutTag(repositoryLocation, itemName, name); //$NON-NLS-0$
					serviceRegistry.getService("orion.page.message").createProgressMonitor(deferred,
							dojo.string.substitute(messages["Checking out tag ${0}"], [name]));
					deferred.then(function() {
						dojo.hitch(explorer, explorer.changedItem)(getBranchItem());
					}, displayErrorOnStatus);
				};
				
				var repositoryLocation = (item.Repository != null) ? item.Repository.Location : item.parent.parent.Location;
				if (data.parameters.valueFor("name") && !data.parameters.optionsRequested) { //$NON-NLS-0$
					checkoutTagFunction(repositoryLocation, item.Name, data.parameters.valueFor("name")); //$NON-NLS-0$
				} else {
					//TODO Here should go some input validations, see bug: https://bugs.eclipse.org/bugs/show_bug.cgi?id=381735
					if(!data.parameters.valueFor("name")){
						return;
					} else {
						exports.getNewItemName(item, explorer, false, data.domNode.id, messages["Local Branch Name:"], function(name){
							if (!name && name == "") {
								return;
							}		
							checkoutTagFunction(repositoryLocation, item.Name, name);
						});
					}
				}
			},
			visibleWhen: function(item){
				return item.Type === "Tag"; //$NON-NLS-0$
			}
		});
		commandService.addCommand(checkoutTagCommand);

		var checkoutBranchCommand = new mCommands.Command({
			name: messages['Checkout'],
			tooltip: messages["Checkout the branch or corresponding local branch and make it active. If the remote tracking branch does not have a corresponding local branch, the local branch will be created first."],
			imageClass: "git-sprite-checkout", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			id: "eclipse.checkoutBranch", //$NON-NLS-0$
			callback: function(data) {
				var item = data.items;
				var service = serviceRegistry.getService("orion.git.provider"); //$NON-NLS-0$
				var progressService = serviceRegistry.getService("orion.page.message"); //$NON-NLS-0$
				
				var checkingOutDeferred = new dojo.Deferred();
				progressService.createProgressMonitor(checkingOutDeferred,
					item.Name ? dojo.string.substitute(messages["Checking out branch ${0}..."], [item.Name]) : messages["Checking out branch..."]);
				if (item.Type === "Branch") { //$NON-NLS-0$
					service.checkoutBranch(item.CloneLocation, item.Name).then(
						function(){
							dojo.hitch(explorer, explorer.changedItem)(item.parent);
							checkingOutDeferred.callback();
							progressService.setProgressResult(messages["Branch checked out."]);
						},
						 function(error){
							checkingOutDeferred.callback(); 
							displayErrorOnStatus(error);
						 }
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
									progressService.setProgressResult(messages['Branch checked out.']);
								},
								function(error){
									checkingOutDeferred.callback(); 
									displayErrorOnStatus(error);
								}
							);
						},
						function(error){
							checkingOutDeferred.callback(); 
							displayErrorOnStatus(error);
						 }
					);
				}
			},
			visibleWhen: function(item) {
				return item.Type === "Branch" || item.Type === "RemoteTrackingBranch"; //$NON-NLS-1$ //$NON-NLS-0$
			}
		});
		commandService.addCommand(checkoutBranchCommand);

		var branchNameParameters = new mCommands.ParametersDescription([new mCommands.CommandParameter('name', 'text', 'Name:')]); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

		var addBranchCommand = new mCommands.Command({
			name: messages["New Branch"],
			tooltip: messages["Add a new local branch to the repository"],
			imageClass: "core-sprite-add", //$NON-NLS-0$
			id: "eclipse.addBranch", //$NON-NLS-0$
			parameters: branchNameParameters,
			callback: function(data) {
				var item = data.items;
				
				var createBranchFunction = function(branchLocation, name) {
					serviceRegistry.getService("orion.git.provider").addBranch(branchLocation, name).then(function() { //$NON-NLS-0$
						dojo.hitch(explorer, explorer.changedItem)(item);
					}, displayErrorOnStatus);
				};
				
				var branchLocation;
				if (item.Type === "Clone") { //$NON-NLS-0$
					branchLocation = item.BranchLocation;
				} else {
					branchLocation = item.Location;
				}
				
				if (data.parameters.valueFor("name") && !data.parameters.optionsRequested) { //$NON-NLS-0$
					createBranchFunction(branchLocation, data.parameters.valueFor("name")); //$NON-NLS-0$
				} else {
					exports.getNewItemName(item, explorer, false, data.domNode.id, messages["Branch name"], function(name) {
						if (!name && name == "") {
							return;
						}		
						createBranchFunction(branchLocation, name);
					});
				}
			},
			visibleWhen: function(item) {
				return (item.GroupNode && item.Name === "Branches") || (item.Type === "Clone" && explorer.parentId === "artifacts"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			}
		});
		commandService.addCommand(addBranchCommand);

		var removeBranchCommand = new mCommands.Command({
			name: messages["Delete"], // "Delete Branch"
			tooltip: messages["Delete the local branch from the repository"],
			imageClass: "core-sprite-delete", //$NON-NLS-0$
			id: "eclipse.removeBranch", //$NON-NLS-0$
			callback: function(data) {
				var item = data.items;
				if (confirm(dojo.string.substitute(messages["Are you sure you want to delete branch ${0}?"], [item.Name]))) {
					serviceRegistry.getService("orion.git.provider").removeBranch(item.Location).then(function() { //$NON-NLS-0$
						if (explorer.changedItem)
							dojo.hitch(explorer, explorer.changedItem)(item.parent);
						else if (explorer.displayBranches)
							dojo.hitch(explorer, explorer.displayBranches)(item.ParentLocation, null);
					}, displayErrorOnStatus);
				}
			},
			visibleWhen: function(item) {
				return item.Type === "Branch" && !item.Current; //$NON-NLS-0$
			}
		});
		commandService.addCommand(removeBranchCommand);

		var removeRemoteBranchCommand = new mCommands.Command({
			name: messages['Delete'], // "Delete Remote Branch",
			tooltip: messages["Delete the remote tracking branch from the repository"],
			imageClass: "core-sprite-delete", //$NON-NLS-0$
			id: "eclipse.removeRemoteBranch", //$NON-NLS-0$
			callback: function(data) {
				var item = data.items;
				if(confirm(dojo.string.substitute(messages["You're going to delete remote branch ${0} and push the change."], [item.Name])+"\n\n"+messages["Are you sure?"])) //$NON-NLS-1$
				exports.getDefaultSshOptions(serviceRegistry).then(function(options){
					var func = arguments.callee;
					var gitService = serviceRegistry.getService("orion.git.provider"); //$NON-NLS-0$
					var progressService = serviceRegistry.getService("orion.page.message"); //$NON-NLS-0$
					var deferred = gitService.doPush(item.Location, "", false, false,
							options.gitSshUsername, options.gitSshPassword, options.knownHosts, options.gitPrivateKey,
							options.gitPassphrase);
					progressService.createProgressMonitor(deferred, messages["Removing remote branch: "] + item.Name);
					deferred.then(function(remoteJsonData) {
						exports.handleProgressServiceResponse(remoteJsonData, options, serviceRegistry, function(jsonData) {
							if (jsonData.Result.Severity == "Ok") //$NON-NLS-0$
								dojo.hitch(explorer, explorer.changedItem)(item.parent);
						}, func, messages["Delete Remote Branch"]);
					}, function(jsonData, secondArg) {
						exports.handleProgressServiceResponse(jsonData, options, serviceRegistry, function() {}, func, messages['Removing remote branch: '] + item.Name);
					});
				});
			},
			visibleWhen: function(item) {
				return item.Type === "RemoteTrackingBranch"; //$NON-NLS-0$
			}
		});
		commandService.addCommand(removeRemoteBranchCommand);

		var addRemoteParameters = new mCommands.ParametersDescription([new mCommands.CommandParameter('name', 'text', 'Name:'),  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		                                                               new mCommands.CommandParameter('url', 'url', 'Url:')]); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		
		var addRemoteCommand = new mCommands.Command({
			name: messages["New Remote"],
			tooltip: messages["Add a new remote to the repository"],
			imageClass: "core-sprite-add", //$NON-NLS-0$
			id: "eclipse.addRemote", //$NON-NLS-0$
			parameters: addRemoteParameters,
			callback : function(data) {
				var item = data.items;
				
				var createRemoteFunction = function(remoteLocation, name, url) {
					serviceRegistry.getService("orion.git.provider").addRemote(remoteLocation, name, url).then(function() { //$NON-NLS-0$
						dojo.hitch(explorer, explorer.changedItem)(item);
					}, displayErrorOnStatus);
				};
				
				var remoteLocation;
				if (item.Type === "Clone") { //$NON-NLS-0$
					remoteLocation = item.RemoteLocation;
				} else {
					remoteLocation = item.Location;
				}
				
				if (data.parameters.valueFor("name") && data.parameters.valueFor("url") && !data.parameters.optionsRequested) { //$NON-NLS-1$ //$NON-NLS-0$
					createRemoteFunction(remoteLocation, data.parameters.valueFor("name"), data.parameters.valueFor("url")); //$NON-NLS-1$ //$NON-NLS-0$
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
				return (item.GroupNode && item.Name === "Remotes") ||  (item.Type === "Clone" && explorer.parentId === "artifacts"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			}
		});
		commandService.addCommand(addRemoteCommand);

		var removeRemoteCommand = new mCommands.Command({
			name: messages['Delete'], // "Delete Remote",
			tooltip: messages["Delete the remote from the repository"],
			imageClass: "core-sprite-delete", //$NON-NLS-0$
			id: "eclipse.removeRemote", //$NON-NLS-0$
			callback: function(data) {
				var item = data.items;
				if (confirm(dojo.string.substitute(messages["Are you sure you want to delete remote ${0}?"], [item.Name]))) {
					serviceRegistry.getService("orion.git.provider").removeRemote(item.Location).then(function() { //$NON-NLS-0$
						dojo.hitch(explorer, explorer.changedItem)(item.parent);
					}, displayErrorOnStatus);
				}
			},
			visibleWhen: function(item) {
				return item.Type === "Remote"; //$NON-NLS-0$
			}
		});
		commandService.addCommand(removeRemoteCommand);

		var pullCommand = new mCommands.Command({
			name : messages["Pull"],
			tooltip: messages["Pull from the repository"],
			imageClass: "git-sprite-pull", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			id : "eclipse.orion.git.pull", //$NON-NLS-0$
			callback: function(data) {
				var item = data.items;
				var path = item.Location;
				exports.getDefaultSshOptions(serviceRegistry).then(function(options) {
					var func = arguments.callee;
					var gitService = serviceRegistry.getService("orion.git.provider"); //$NON-NLS-0$
					var statusService = serviceRegistry.getService("orion.page.message"); //$NON-NLS-0$
					var pullDeferred = gitService.doPull(path, false,
							options.gitSshUsername,
							options.gitSshPassword,
							options.knownHosts,
							options.gitPrivateKey,
							options.gitPassphrase);
 
					statusService.createProgressMonitor(pullDeferred, messages["Pulling : "] + path);
					pullDeferred.then(function(jsonData) {
						exports.handleProgressServiceResponse(jsonData, options, serviceRegistry, function(jsonData) {
							if (item.Type === "Clone") { //$NON-NLS-0$
								dojo.hitch(explorer, explorer.changedItem)(item);
							}
						}, func, "Pull Git Repository"); //$NON-NLS-0$
					}, function(jsonData, secondArg) {
						exports.handleProgressServiceResponse(jsonData, options, serviceRegistry, function() {}, func, messages["Pull Git Repository"]);
					});
				});
			},
			visibleWhen : function(item) {
				return item.Type === "Clone"; //$NON-NLS-0$
			}
		});
		commandService.addCommand(pullCommand);

		var openGitLog = new mCommands.Command({
			name : messages["Git Log"],
			tooltip: messages["Open the log for the branch"],
			id : "eclipse.openGitLog", //$NON-NLS-0$
			imageClass: "git-sprite-log", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			hrefCallback : function(data) {
				var item = data.items;
				return require.toUrl("git/git-log.html")+"#" + item.CommitLocation + "?page=1"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			},
			visibleWhen : function(item) {
				return item.Type === "Branch" || item.Type === "RemoteTrackingBranch"; //$NON-NLS-1$ //$NON-NLS-0$
			}
		});
		commandService.addCommand(openGitLog);

		var openGitLogAll = new mCommands.Command({
			name : messages['Git Log'],
			tooltip: messages["Open the log for the repository"],
			id : "eclipse.openGitLogAll", //$NON-NLS-0$
			imageClass: "git-sprite-log", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			hrefCallback : function(data) {
				return require.toUrl("git/git-log.html")+"#" + data.items.CommitLocation + "?page=1"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			},
			visibleWhen : function(item) {
				// show only for a repo
				if (!item.CommitLocation || !item.StatusLocation)
					return false;
				return true;
			}
		});
		commandService.addCommand(openGitLogAll);

		var openGitStatus = new mCommands.Command({
			name : messages['Git Status'],
			tooltip: messages["Open the status for the repository"],
			id : "eclipse.openGitStatus", //$NON-NLS-0$
			imageClass: "git-sprite-status", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			hrefCallback : function(data) {
				return require.toUrl(mGitUtil.statusUILocation) + "#" + data.items.StatusLocation; //$NON-NLS-0$
			},
			visibleWhen : function(item) {
				if (!item.StatusLocation)
					return false;
				return true;
			}
		});
		commandService.addCommand(openGitStatus);

		var openCloneContent = new mCommands.Command({
			name : messages["Show in Navigator"],
			tooltip: messages["Show the repository folder in the file navigator"],
			id : "eclipse.openCloneContent", //$NON-NLS-0$
			hrefCallback : function(data) {
				return require.toUrl("navigate/table.html")+"#" + data.items.ContentLocation+"?depth=1"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			},
			visibleWhen : function(item) {
				if (!item.ContentLocation)
					return false;
				return true;
			}
		});
		commandService.addCommand(openCloneContent);

		var compareGitCommits = new mCommands.Command({
			name : messages["Compare With Each Other"],
			imageClass: "git-sprite-open_compare", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			id : "eclipse.compareGitCommits", //$NON-NLS-0$
			hrefCallback : function(data) {
				var item = data.items;
				return serviceRegistry.getService("orion.git.provider").getDiff(item[1].DiffLocation, item[0].Name).then(function(diffLocation) {
					return mCompareUtils.generateCompareHref(diffLocation, {readonly: true});
				});
			},
			visibleWhen : function(item) {
				if(explorer.isDirectory) return false;
				if (dojo.isArray(item) && item.length === 2 && item[0].Type === "Commit" && item[1].Type === "Commit") { //$NON-NLS-1$ //$NON-NLS-0$
						return true;
				}
				return false;
			}
		});
		commandService.addCommand(compareGitCommits);

		var compareWithWorkingTree = new mCommands.Command({
			name : messages["Compare With Working Tree"],
			imageClass: "git-sprite-open_compare", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			id : "eclipse.compareWithWorkingTree", //$NON-NLS-0$
			hrefCallback : function(data) {
				return mCompareUtils.generateCompareHref(data.items.DiffLocation, {});
			},
			visibleWhen : function(item) {
				return item.Type === "Commit" && item.ContentLocation != null && !explorer.isDirectory; //$NON-NLS-0$
			}
		});
		commandService.addCommand(compareWithWorkingTree);

		var openGitCommit = new mCommands.Command({
			name : messages["Open"],
			id : "eclipse.openGitCommit", //$NON-NLS-0$
			hrefCallback: function(data) {
				return require.toUrl("edit/edit.html")+"#" + data.items.ContentLocation; //$NON-NLS-1$ //$NON-NLS-0$
			},
			visibleWhen : function(item) {
				return item.Type === "Commit" && item.ContentLocation != null && !explorer.isDirectory; //$NON-NLS-0$
			}
		});
		commandService.addCommand(openGitCommit);

		var fetchCommand = new mCommands.Command({
			name: messages["Fetch"],
			tooltip: messages["Fetch from the remote"],
			imageClass: "git-sprite-fetch", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			id: "eclipse.orion.git.fetch", //$NON-NLS-0$
			callback: function(data) {
				var item = data.items;
				var path = item.Location;
				var commandInvocation = data;
				
				var handleResponse = function(jsonData, commandInvocation){
					if (jsonData.JsonData.HostKey){
						commandInvocation.parameters = null;
						commandInvocation.errorData = jsonData.JsonData;
						commandService.collectParameters(commandInvocation);
					} else if (!commandInvocation.optionsRequested){
						var gitPreferenceStorage = new GitPreferenceStorage(serviceRegistry);
						gitPreferenceStorage.isEnabled().then(
							function(isEnabled){
								if(isEnabled){
									if (jsonData.JsonData.User)
										commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshpassword", "password", messages["SSH Password:"]), new mCommands.CommandParameter("saveCredentials", "boolean", messages["Don't prompt me again:"])], {hasOptionalParameters: true}); //$NON-NLS-1$ //$NON-NLS-0$
									else
										commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshuser", "text", messages["SSH User Name:"]), new mCommands.CommandParameter("sshpassword", "password", messages['SSH Password:']), new mCommands.CommandParameter("saveCredentials", "boolean", messages["Don't prompt me again:"])], {hasOptionalParameters: true}); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
								} else {
									if (jsonData.JsonData.User)
										commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshpassword", "password", messages["SSH Password:"])], {hasOptionalParameters: true}); //$NON-NLS-1$ //$NON-NLS-0$
									else
										commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshuser", "text", messages["SSH User Name:"]), new mCommands.CommandParameter("sshpassword", "password", messages['SSH Password:'])], {hasOptionalParameters: true}); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
								}
								
								commandInvocation.errorData = jsonData.JsonData;
								commandService.collectParameters(commandInvocation);
							}
						);
					} else {
						commandInvocation.errorData = jsonData.JsonData;
						commandService.collectParameters(commandInvocation);
					}
				};
				
				// HACK wrap logic into function
				var fetchLogic = function(){
					if (commandInvocation.parameters && commandInvocation.parameters.optionsRequested){
						commandInvocation.parameters = null;
						commandInvocation.optionsRequested = true;
						commandService.collectParameters(commandInvocation);
						return;
					}
					
					exports.gatherSshCredentials(serviceRegistry, commandInvocation).then(
						function(options) {
							var gitService = serviceRegistry.getService("orion.git.provider"); //$NON-NLS-0$
							var statusService = serviceRegistry.getService("orion.page.message"); //$NON-NLS-0$
							var deferred = gitService.doFetch(path, false,
									options.gitSshUsername,
									options.gitSshPassword,
									options.knownHosts,
									options.gitPrivateKey,
									options.gitPassphrase);
							statusService.createProgressMonitor(deferred, messages["Fetching remote: "] + path);
							deferred.then(
								function(jsonData, secondArg) {
									exports.handleProgressServiceResponse2(jsonData, serviceRegistry, 
										function() {
											gitService.getGitRemote(path).then(
												function(jsonData){
													var remoteJsonData = jsonData;
													if (explorer.parentId === "explorer-tree") { //$NON-NLS-0$
														dojo.place(document.createTextNode(messages['Getting git incoming changes...']), "explorer-tree", "only"); //$NON-NLS-2$ //$NON-NLS-1$
														gitService.getLog(remoteJsonData.HeadLocation, remoteJsonData.Id).then(function(loadScopedCommitsList) {
															explorer.renderer.setIncomingCommits(loadScopedCommitsList.Children);
															explorer.loadCommitsList(remoteJsonData.CommitLocation + "?page=1", remoteJsonData, true); //$NON-NLS-0$
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
				
				//TODO HACK remoteTrackingBranch does not provide git url - we have to collect manually
				if(!commandInvocation.items.GitUrl){
					// have to determine manually
					var gitService = serviceRegistry.getService("orion.git.provider");
					gitService.getGitRemote(path).then(
						function(resp){
							gitService.getGitClone(resp.CloneLocation).then(
								function(resp){
									commandInvocation.items.GitUrl = resp.Children[0].GitUrl;
									fetchLogic();
								}
							);
						}
					);
				} else { fetchLogic(); }
			},
			visibleWhen: function(item) {
				if (item.Type === "RemoteTrackingBranch") //$NON-NLS-0$
					return true;
				if (item.Type === "Remote") //$NON-NLS-0$
					return true;
				if (item.Type === "Commit" && item.toRef && item.toRef.Type === "RemoteTrackingBranch") //$NON-NLS-1$ //$NON-NLS-0$
					return true;
				return false;
			}
		});
		commandService.addCommand(fetchCommand);

		var fetchForceCommand = new mCommands.Command({
			name : messages["Force Fetch"],
			imageClass: "git-sprite-fetch",
			spriteClass: "gitCommandSprite",
			tooltip: messages["Fetch from the remote branch into your remote tracking branch overriding its current content"],
			id : "eclipse.orion.git.fetchForce", //$NON-NLS-0$
			callback: function(data) {			
				if(!confirm(messages["You're going to override content of the remote tracking branch. This can cause the branch to lose commits."]+"\n\n"+messages['Are you sure?'])) //$NON-NLS-1$
					return;
				
				var item = data.items;
				var path = item.Location;
				var commandInvocation = data;
				
				var handleResponse = function(jsonData, commandInvocation){
					if (jsonData.JsonData.HostKey){
						commandInvocation.parameters = null;
						commandInvocation.errorData = jsonData.JsonData;
						commandService.collectParameters(commandInvocation);
					} else if (!commandInvocation.optionsRequested){
						var gitPreferenceStorage = new GitPreferenceStorage(serviceRegistry);
						gitPreferenceStorage.isEnabled().then(
							function(isEnabled){
								if(isEnabled){
									if (jsonData.JsonData.User)
										commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshpassword", "password", messages["SSH Password:"]), new mCommands.CommandParameter("saveCredentials", "boolean", messages["Don't prompt me again:"])], {hasOptionalParameters: true}); //$NON-NLS-1$ //$NON-NLS-0$
									else
										commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshuser", "text", messages["SSH User Name:"]), new mCommands.CommandParameter("sshpassword", "password", messages['SSH Password:']), new mCommands.CommandParameter("saveCredentials", "boolean", messages["Don't prompt me again:"])], {hasOptionalParameters: true}); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
								} else {
									if (jsonData.JsonData.User)
										commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshpassword", "password", messages["SSH Password:"])], {hasOptionalParameters: true}); //$NON-NLS-1$ //$NON-NLS-0$
									else
										commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshuser", "text", messages["SSH User Name:"]), new mCommands.CommandParameter("sshpassword", "password", messages['SSH Password:'])], {hasOptionalParameters: true}); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
								}
								
								commandInvocation.errorData = jsonData.JsonData;
								commandService.collectParameters(commandInvocation);
							}
						);
					} else {
						commandInvocation.errorData = jsonData.JsonData;
						commandService.collectParameters(commandInvocation);
					}
				};
				
				var fetchForceLogic = function(){
					if (commandInvocation.parameters && commandInvocation.parameters.optionsRequested){
						commandInvocation.parameters = null;
						commandInvocation.optionsRequested = true;
						commandService.collectParameters(commandInvocation);
						return;
					}
	
					exports.gatherSshCredentials(serviceRegistry, commandInvocation).then(
						function(options) {
							var gitService = serviceRegistry.getService("orion.git.provider"); //$NON-NLS-0$
							var statusService = serviceRegistry.getService("orion.page.message"); //$NON-NLS-0$
							var deferred = gitService.doFetch(path, true,
									options.gitSshUsername,
									options.gitSshPassword,
									options.knownHosts,
									options.gitPrivateKey,
									options.gitPassphrase);
							statusService.createProgressMonitor(deferred, messages['Fetching remote: '] + path);
							deferred.then(
								function(jsonData, secondArg) {
									exports.handleProgressServiceResponse2(jsonData, serviceRegistry, 
										function() {
											gitService.getGitRemote(path).then(
												function(jsonData){
													var remoteJsonData = jsonData;
													if (explorer.parentId === "explorer-tree") { //$NON-NLS-0$
														dojo.place(document.createTextNode(messages['Getting git incoming changes...']), "explorer-tree", "only"); //$NON-NLS-2$ //$NON-NLS-1$
														gitService.getLog(remoteJsonData.HeadLocation, remoteJsonData.Id).then(function(loadScopedCommitsList) {
															explorer.renderer.setIncomingCommits(loadScopedCommitsList.Children);
															explorer.loadCommitsList(remoteJsonData.CommitLocation + "?page=1", remoteJsonData, true); //$NON-NLS-0$
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
				
				//TODO HACK remoteTrackingBranch does not provide git url - we have to collect manually
				if(!commandInvocation.items.GitUrl){
					// have to determine manually
					var gitService = serviceRegistry.getService("orion.git.provider");
					gitService.getGitRemote(path).then(
						function(resp){
							gitService.getGitClone(resp.CloneLocation).then(
								function(resp){
									commandInvocation.items.GitUrl = resp.Children[0].GitUrl;
									fetchForceLogic();
								}
							);
						}
					);
				} else { fetchForceLogic(); }
			},
			visibleWhen : function(item) {
				if (item.Type === "RemoteTrackingBranch") //$NON-NLS-0$
					return true;
				if (item.Type === "Remote") //$NON-NLS-0$
					return true;
				if (item.Type === "Commit" && item.toRef && item.toRef.Type === "RemoteTrackingBranch") //$NON-NLS-1$ //$NON-NLS-0$
					return true;
				return false;
			}
		});
		commandService.addCommand(fetchForceCommand);

		var mergeCommand = new mCommands.Command({
			name : messages["Merge"],
			tooltip: messages["Merge the content from the branch to your active branch"],
			imageClass: "git-sprite-merge", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			id : "eclipse.orion.git.merge", //$NON-NLS-0$
			callback: function(data) {
				var item = data.items;
				var gitService = serviceRegistry.getService("orion.git.provider"); //$NON-NLS-0$
				var progressService = serviceRegistry.getService("orion.page.message"); //$NON-NLS-0$
				gitService.doMerge(item.HeadLocation, item.Name, false).then(function(result){
					var display = [];

					if (result.jsonData && (result.jsonData.Result == "FAST_FORWARD" || result.jsonData.Result == "ALREADY_UP_TO_DATE")){ //$NON-NLS-1$ //$NON-NLS-0$
						dojo.query(".treeTableRow").forEach(function(node, i) { //$NON-NLS-0$
							dojo.toggleClass(node, "incomingCommitsdRow", false); //$NON-NLS-0$
						});
						display.Severity = "Ok"; //$NON-NLS-0$
						display.HTML = false;
						display.Message = result.jsonData.Result;
						
						dojo.hitch(explorer, explorer.changedItem)(item);
					} else if(result.jsonData){
						var statusLocation = item.HeadLocation.replace("commit/HEAD", "status"); //$NON-NLS-1$ //$NON-NLS-0$

						display.Severity = "Warning"; //$NON-NLS-0$
						display.HTML = true;
						display.Message = "<span>" + result.jsonData.Result; //$NON-NLS-0$
						if(result.jsonData.FailingPaths){
							var paths = "";
							var isFirstPath = true;
							for(var path in result.jsonData.FailingPaths){
								if(!isFirstPath){
									paths+=", ";
								}
								isFirstPath = false;
								paths+=path;
							}
							if(!isFirstPath){
								display.Message+= ". " + dojo.string.substitute(messages['Failing paths: ${0}'], [paths]);
							}
						}
						display.Message += dojo.string.substitute(messages[". Go to ${0}."], ["<a href=\"" + require.toUrl(mGitUtil.statusUILocation) + "#"  //$NON-NLS-2$ //$NON-NLS-1$
							+ statusLocation +"\">"+messages["Git Status page"]+"</a>"])+"</span>"; //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-0$
					} else if(result.error) {
						var statusLocation = item.HeadLocation.replace("commit/HEAD", "status"); //$NON-NLS-1$ //$NON-NLS-0$
						display.Severity = "Error"; //$NON-NLS-0$
						if(result.error.responseText && JSON.parse(result.error.responseText)){
							var resp = JSON.parse(result.error.responseText);
							display.Message = resp.DetailedMessage ? resp.DetailedMessage : resp.Message;
						}else{
							display.Message = result.error.message;
						}
						display.HTML = true;
						display.Message ="<span>" + display.Message + dojo.string.substitute(messages['. Go to ${0}.'], ["<a href=\"" + require.toUrl(mGitUtil.statusUILocation) + "#"  //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-0$
							+ statusLocation + "\">"+messages['Git Status page']+"</a>"])+"</span>"; //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-0$
					}

					progressService.setProgressResult(display);
				}, function (error, ioArgs) {
						var display = [];

						var statusLocation = item.HeadLocation.replace("commit/HEAD", "status"); //$NON-NLS-1$ //$NON-NLS-0$

						display.Severity = "Error"; //$NON-NLS-0$
						display.HTML = true;
						display.Message = "<span>" + dojo.fromJson(ioArgs.xhr.responseText).DetailedMessage //$NON-NLS-0$
						+ dojo.string.substitute(messages['. Go to ${0}.'], ["<a href=\"" + require.toUrl(mGitUtil.statusUILocation) + "#"  //$NON-NLS-2$ //$NON-NLS-1$
						+ statusLocation +"\">"+messages['Git Status page']+"</a>"])+".</span>"; //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-0$
						serviceRegistry.getService("orion.page.message").setProgressResult(display); //$NON-NLS-0$
				});
			},
			visibleWhen : function(item) {
				if (item.Type === "RemoteTrackingBranch") //$NON-NLS-0$
					return true;
				if (item.Type === "Branch" && !item.Current) //$NON-NLS-0$
					return true;
				if (item.Type === "Commit" && item.toRef && item.toRef.Type === "RemoteTrackingBranch") //$NON-NLS-1$ //$NON-NLS-0$
					return true;
				return false;
			}
		});
		commandService.addCommand(mergeCommand);
		
		var mergeSquashCommand = new mCommands.Command({
			name : messages["Merge Squash"],
			tooltip: messages["Squash the content of the branch to the index"],
			imageClass: "git-sprite-merge_squash", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			id : "eclipse.orion.git.mergeSquash", //$NON-NLS-0$
			callback: function(data) {
				var item = data.items;
				var gitService = serviceRegistry.getService("orion.git.provider"); //$NON-NLS-0$
				var progressService = serviceRegistry.getService("orion.page.message"); //$NON-NLS-0$
				gitService.doMerge(item.HeadLocation, item.Name, true).then(function(result){
					var display = [];

					if (result.jsonData && (result.jsonData.Result == "FAST_FORWARD_SQUASHED" || result.jsonData.Result == "ALREADY_UP_TO_DATE")){ //$NON-NLS-1$ //$NON-NLS-0$
						dojo.query(".treeTableRow").forEach(function(node, i) { //$NON-NLS-0$
							dojo.toggleClass(node, "incomingCommitsdRow", false); //$NON-NLS-0$
						});
						display.Severity = "Ok"; //$NON-NLS-0$
						display.HTML = false;
						display.Message = result.jsonData.Result;
						
						dojo.hitch(explorer, explorer.changedItem)(item);
					} else if(result.jsonData){
						var statusLocation = item.HeadLocation.replace("commit/HEAD", "status"); //$NON-NLS-1$ //$NON-NLS-0$

						display.Severity = "Warning"; //$NON-NLS-0$
						display.HTML = true;
						display.Message = "<span>" + result.jsonData.Result //$NON-NLS-0$
							+ dojo.string.substitute(messages[". Go to ${0}."], ["<a href=\"" + require.toUrl(mGitUtil.statusUILocation) + "#"  //$NON-NLS-2$ //$NON-NLS-1$
							+ statusLocation +"\">"+messages["Git Status page"]+"</a>"])+"</span>"; //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-0$
					} else if(result.error) {
						var statusLocation = item.HeadLocation.replace("commit/HEAD", "status"); //$NON-NLS-1$ //$NON-NLS-0$
						display.Severity = "Error"; //$NON-NLS-0$
						if(result.error.responseText && JSON.parse(result.error.responseText)){
							var resp = JSON.parse(result.error.responseText);
							display.Message = resp.DetailedMessage ? resp.DetailedMessage : resp.Message;
						}else{
							display.Message = result.error.message;
						}
						display.HTML = true;
						display.Message ="<span>" + display.Message + dojo.string.substitute(messages['. Go to ${0}.'], ["<a href=\"" + require.toUrl(mGitUtil.statusUILocation) + "#"  //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-0$
							+ statusLocation + "\">"+messages['Git Status page']+"</a>"])+"</span>"; //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-0$
					}

					progressService.setProgressResult(display);
				}, function (error, ioArgs) {
						var display = [];

						var statusLocation = item.HeadLocation.replace("commit/HEAD", "status"); //$NON-NLS-1$ //$NON-NLS-0$

						display.Severity = "Error"; //$NON-NLS-0$
						display.HTML = true;
						display.Message = "<span>" + dojo.fromJson(ioArgs.xhr.responseText).DetailedMessage //$NON-NLS-0$
						+ dojo.string.substitute(messages['. Go to ${0}.'], ["<a href=\"" + require.toUrl(mGitUtil.statusUILocation) + "#"  //$NON-NLS-2$ //$NON-NLS-1$
						+ statusLocation +"\">"+messages['Git Status page']+"</a>"])+".</span>"; //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-0$
						serviceRegistry.getService("orion.page.message").setProgressResult(display); //$NON-NLS-0$
				});
			},
			visibleWhen : function(item) {
				if (item.Type === "RemoteTrackingBranch") //$NON-NLS-0$
					return true;
				if (item.Type === "Branch" && !item.Current) //$NON-NLS-0$
					return true;
				if (item.Type === "Commit" && item.toRef && item.toRef.Type === "RemoteTrackingBranch") //$NON-NLS-1$ //$NON-NLS-0$
					return true;
				return false;
			}
		});
		commandService.addCommand(mergeSquashCommand);

		var rebaseCommand = new mCommands.Command({
			name : messages["Rebase"],
			tooltip: messages["Rebase your commits by removing them from the active branch, starting the active branch again based on the latest state of the selected branch "] +
					"and applying each commit again to the updated active branch.", //$NON-NLS-0$
			id : "eclipse.orion.git.rebase", //$NON-NLS-0$
			imageClass: "git-sprite-rebase", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			callback: function(data) {
				var item = data.items;
				var progressService = serviceRegistry.getService("orion.page.message"); //$NON-NLS-0$
				var deferred = serviceRegistry.getService("orion.git.provider").doRebase(item.HeadLocation, item.Name, "BEGIN"); //$NON-NLS-1$ //$NON-NLS-0$
				progressService.createProgressMonitor(deferred, 
				item.Name ? messages["Rebase on top of "] + item.Name: messages['Rebase']);
				deferred.then(function(jsonData){
					var display = [];
					var statusLocation = item.HeadLocation.replace("commit/HEAD", "status"); //$NON-NLS-1$ //$NON-NLS-0$

					if (jsonData.Result == "OK" || jsonData.Result == "FAST_FORWARD" || jsonData.Result == "UP_TO_DATE" ) { //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						// operation succeeded
						display.Severity = "Ok"; //$NON-NLS-0$
						display.HTML = false;
						display.Message = jsonData.Result;
						
						dojo.hitch(explorer, explorer.changedItem)(item);
					}
					// handle special cases
					else if (jsonData.Result == "STOPPED") { //$NON-NLS-0$
						display.Severity = "Warning"; //$NON-NLS-0$
						display.HTML = true;
						display.Message = "<span>" + jsonData.Result //$NON-NLS-0$
							+ messages[". Some conflicts occurred. Please resolve them and continue, skip patch or abort rebasing"]
							+ dojo.string.substitute(messages['. Go to ${0}.'], ["<a href=\"" + require.toUrl(mGitUtil.statusUILocation) + "#"  //$NON-NLS-2$ //$NON-NLS-1$
							+ statusLocation +"\">"+messages['Git Status page']+"</a>"])+".</span>"; //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-0$
					}
					else if (jsonData.Result == "FAILED_WRONG_REPOSITORY_STATE") { //$NON-NLS-0$
						display.Severity = "Error"; //$NON-NLS-0$
						display.HTML = true;
						display.Message = "<span>" + jsonData.Result //$NON-NLS-0$
							+ messages[". Repository state is invalid (i.e. already during rebasing)"]
							+ dojo.string.substitute(". Go to ${0}.", ["<a href=\"" + require.toUrl(mGitUtil.statusUILocation) + "#"  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							+ statusLocation +"\">"+messages['Git Status page']+"</a>"])+".</span>"; //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-0$
					}
					else if (jsonData.Result == "FAILED_UNMERGED_PATHS") { //$NON-NLS-0$
						display.Severity = "Error"; //$NON-NLS-0$
						display.HTML = true;
						display.Message = "<span>" + jsonData.Result //$NON-NLS-0$
							+ messages[". Repository contains unmerged paths"]
							+ dojo.string.substitute(messages['. Go to ${0}.'], ["<a href=\"" + require.toUrl(mGitUtil.statusUILocation) + "#"  //$NON-NLS-2$ //$NON-NLS-1$
   							+ statusLocation +"\">"+messages['Git Status page']+"</a>"])+".</span>"; //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-0$
					}
					else if (jsonData.Result == "FAILED_PENDING_CHANGES") { //$NON-NLS-0$
						display.Severity = "Error"; //$NON-NLS-0$
						display.HTML = true;
						display.Message = "<span>" + jsonData.Result //$NON-NLS-0$
							+ messages[". Repository contains pending changes. Please commit or stash them"]
							+ dojo.string.substitute(messages['. Go to ${0}.'], ["<a href=\"" + require.toUrl(mGitUtil.statusUILocation) + "#"  //$NON-NLS-2$ //$NON-NLS-1$
							+ statusLocation +"\">"+"Git Status page"+"</a>"])+".</span>"; //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					}
					// handle other cases
					else {
						display.Severity = "Warning"; //$NON-NLS-0$
						display.HTML = true;
						display.Message = "<span>" + jsonData.Result //$NON-NLS-0$
						+ dojo.string.substitute(messages['. Go to ${0}.'], ["<a href=\"" + require.toUrl(mGitUtil.statusUILocation) + "#"  //$NON-NLS-2$ //$NON-NLS-1$
						+ statusLocation +"\">"+messages['Git Status page']+"</a>"])+".</span>"; //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-0$
					} 

					serviceRegistry.getService("orion.page.message").setProgressResult(display); //$NON-NLS-0$
					}, 
					displayErrorOnStatus
				);
			},
			visibleWhen : function(item) {
				this.tooltip = messages["Rebase your commits by removing them from the active branch, "] +
					messages["starting the active branch again based on the latest state of '"] + item.Name + "' " +  //$NON-NLS-1$
					messages["and applying each commit again to the updated active branch."];

				return item.Type === "RemoteTrackingBranch" || (item.Type === "Branch" && !item.Current); //$NON-NLS-1$ //$NON-NLS-0$
			}
		});
		commandService.addCommand(rebaseCommand);
		
		var pushCommand = new mCommands.Command({
			name : messages["Push All"],
			tooltip: messages["Push commits and tags from your local branch into the remote branch"],
			imageClass: "git-sprite-push", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			id : "eclipse.orion.git.push", //$NON-NLS-0$
			callback: function(data) {
				//previously saved target branch
				var itemTargetBranch = data.targetBranch;
			
				var target;
				var item = data.items;
				var path = dojo.hash();
				if (item.toRef) {
					item = item.toRef;
				}
				var commandInvocation = data;
				
				var parts = item.CloneLocation.split("/");
				
				var handleResponse = function(jsonData, commandInvocation){
					if (jsonData.JsonData.HostKey){
						commandInvocation.parameters = null;
						commandInvocation.errorData = jsonData.JsonData;
						commandService.collectParameters(commandInvocation);
					} else if (!commandInvocation.optionsRequested){
						var gitPreferenceStorage = new GitPreferenceStorage(serviceRegistry);
						gitPreferenceStorage.isEnabled().then(
							function(isEnabled){
								if(isEnabled){
									if (jsonData.JsonData.User)
										commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshpassword", "password", messages["SSH Password:"]), new mCommands.CommandParameter("saveCredentials", "boolean", messages["Don't prompt me again:"])], {hasOptionalParameters: true}); //$NON-NLS-1$ //$NON-NLS-0$
									else
										commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshuser", "text", messages["SSH User Name:"]), new mCommands.CommandParameter("sshpassword", "password", messages['SSH Password:']), new mCommands.CommandParameter("saveCredentials", "boolean", messages["Don't prompt me again:"])], {hasOptionalParameters: true}); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
								} else {
									if (jsonData.JsonData.User)
										commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshpassword", "password", messages["SSH Password:"])], {hasOptionalParameters: true}); //$NON-NLS-1$ //$NON-NLS-0$
									else
										commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshuser", "text", messages["SSH User Name:"]), new mCommands.CommandParameter("sshpassword", "password", messages['SSH Password:'])], {hasOptionalParameters: true}); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
								}
								
								commandInvocation.errorData = jsonData.JsonData;
								commandService.collectParameters(commandInvocation);
							}
						);
					} else {
						commandInvocation.errorData = jsonData.JsonData;
						commandService.collectParameters(commandInvocation);
					}
				};
				
				if (commandInvocation.parameters && commandInvocation.parameters.optionsRequested){
					commandInvocation.parameters = null;
					commandInvocation.optionsRequested = true;
					commandService.collectParameters(commandInvocation);
					return;
				}
				var gitService = serviceRegistry.getService("orion.git.provider");
				
				var handlePush = function(options, location, ref, name, force){
					var progressService = serviceRegistry.getService("orion.page.message"); //$NON-NLS-0$
					var deferred = gitService.doPush(location, ref, true, force, //$NON-NLS-0$
							options.gitSshUsername, options.gitSshPassword, options.knownHosts,
							options.gitPrivateKey, options.gitPassphrase);
					progressService.createProgressMonitor(deferred, messages['Pushing remote: '] + name);
					deferred.then(
						function(jsonData){
							exports.handleProgressServiceResponse2(jsonData, serviceRegistry, 
								function() {
									if (explorer.parentId === "explorer-tree") { //$NON-NLS-0$
										if (!jsonData || !jsonData.HttpCode)
											dojo.query(".treeTableRow").forEach(function(node, i) { //$NON-NLS-0$
											dojo.toggleClass(node, "outgoingCommitsdRow", false); //$NON-NLS-0$
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
				};

				gitService.getGitClone(item.CloneLocation).then(
					function(clone){
						var remoteLocation = clone.Children[0].RemoteLocation;
						var locationToChange = clone.Children[0].ConfigLocation;
						
						exports.gatherSshCredentials(serviceRegistry, commandInvocation).then(
							function(options) {
								var result = new dojo.Deferred();
								
								if (item.RemoteLocation.length === 1 && item.RemoteLocation[0].Children.length === 1) { //when we push next time - chance to switch saved remote
									result = gitService.getGitRemote(remoteLocation);
								} else {
									var remotes = {};
									remotes.Children = item.RemoteLocation;
									result.resolve(remotes);
									
								}
						
								result.then(
									function(remotes){
										if(itemTargetBranch){
											handlePush(options, itemTargetBranch.Location, "HEAD", itemTargetBranch.Name, false);
											return;
										}
									
										var dialog = new orion.git.widgets.RemotePrompterDialog({
											title: messages["Choose Branch"],
											serviceRegistry: serviceRegistry,
											gitClient: gitService,
											treeRoot: {
												Children: remotes.Children
											},
											hideNewBranch: false,
											func: dojo.hitch(this, 
												function(targetBranch, remote, optional) {
													if(targetBranch === null){
														target = optional;
													}
													else{
														target = targetBranch;
													}
													var locationToUpdate = "/gitapi/config/" + "branch." + item.Name + ".remote"  + "/clone/file/" + parts[4];
													gitService.addCloneConfigurationProperty(locationToChange,"branch." + item.Name + ".remote" ,target.parent.Name).then(
														function(){
															commandInvocation.targetBranch = target;
															handlePush(options, target.Location, "HEAD",target.Name, false);
														}, function(err){
															if(err.status == 409){ //when confing entry is already defined we have to edit it
																gitService.editCloneConfigurationProperty(locationToUpdate,target.parent.Name).then(
																	function(){
																		commandInvocation.targetBranch = target;
																		handlePush(options, target.Location, "HEAD",target.Name, false);
																	}
																);
															}
														}
													);
												}
											)
										});
										
										if (item.RemoteLocation.length === 1 && item.RemoteLocation[0].Children.length === 1) { //when we push next time - chance to switch saved remote
											var dialog2 = dialog;
											
											dialog = new orion.git.widgets.ConfirmPushDialog({
												title: messages["Choose Branch"],
												serviceRegistry: serviceRegistry,
												gitClient: gitService,
												dialog: dialog2,
												location: item.RemoteLocation[0].Children[0].Name,
												func: dojo.hitch(this, function(){
													commandInvocation.targetBranch = item.RemoteLocation[0].Children[0];
													handlePush(options,item.RemoteLocation[0].Children[0].Location, "HEAD", path, false);
												})
											});
										}
										
										dialog.startup();
										dialog.show();
									}
								);
						
							}
						);
					}
				);
			},
			visibleWhen : function(item) {
				if (item.toRef)
					// for action in the git log
					return item.RepositoryPath === "" && item.toRef.Type === "Branch" && item.toRef.Current && item.toRef.RemoteLocation; //$NON-NLS-0$
				else
					// for action in the repo view
					return item.Type === "Branch" && item.Current && item.RemoteLocation; //$NON-NLS-0$
				
			}
		});
		commandService.addCommand(pushCommand);

		var pushForceCommand = new mCommands.Command({
			name : messages["Force Push All"],
			tooltip: messages["Push commits and tags from your local branch into the remote branch overriding its current content"],
			imageClass: "git-sprite-push", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			id : "eclipse.orion.git.pushForce", //$NON-NLS-0$
			callback: function(data) {
				// previously confirmed warnings
				var confirmedWarnings = data.confirmedWarnings;
				
				// previously target branch
				var itemTargetBranch = data.targetBranch;
				
				if(!confirmedWarnings){
					if(!confirm(messages["You're going to override content of the remote branch. This can cause the remote repository to lose commits."]+"\n\n"+messages['Are you sure?'])){ //$NON-NLS-1$
						return;	
					} else {
						data.confirmedWarnings = true;
						confirmedWarnings = true;
					}
				}
				
				var target;
				var item = data.items;
				var path = dojo.hash();
				if (item.toRef) {
					item = item.toRef;
				}
				var commandInvocation = data;
				
				var parts = item.CloneLocation.split("/");
				
				var handleResponse = function(jsonData, commandInvocation){
					if (jsonData.JsonData.HostKey){
						commandInvocation.parameters = null;
						commandInvocation.errorData = jsonData.JsonData;
						commandService.collectParameters(commandInvocation);
					} else if (!commandInvocation.optionsRequested){
						var gitPreferenceStorage = new GitPreferenceStorage(serviceRegistry);
						gitPreferenceStorage.isEnabled().then(
							function(isEnabled){
								if(isEnabled){
									if (jsonData.JsonData.User)
										commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshpassword", "password", messages["SSH Password:"]), new mCommands.CommandParameter("saveCredentials", "boolean", messages["Don't prompt me again:"])], {hasOptionalParameters: true}); //$NON-NLS-1$ //$NON-NLS-0$
									else
										commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshuser", "text", messages["SSH User Name:"]), new mCommands.CommandParameter("sshpassword", "password", messages['SSH Password:']), new mCommands.CommandParameter("saveCredentials", "boolean", messages["Don't prompt me again:"])], {hasOptionalParameters: true}); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
								} else {
									if (jsonData.JsonData.User)
										commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshpassword", "password", messages["SSH Password:"])], {hasOptionalParameters: true}); //$NON-NLS-1$ //$NON-NLS-0$
									else
										commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshuser", "text", messages["SSH User Name:"]), new mCommands.CommandParameter("sshpassword", "password", messages['SSH Password:'])], {hasOptionalParameters: true}); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
								}
								
								commandInvocation.errorData = jsonData.JsonData;
								commandService.collectParameters(commandInvocation);
							}
						);
					} else {
						commandInvocation.errorData = jsonData.JsonData;
						commandService.collectParameters(commandInvocation);
					}
				};
				
				if (commandInvocation.parameters && commandInvocation.parameters.optionsRequested){
					commandInvocation.parameters = null;
					commandInvocation.optionsRequested = true;
					commandService.collectParameters(commandInvocation);
					return;
				}
				var gitService = serviceRegistry.getService("orion.git.provider");
				
				var handlePush = function(options, location, ref, name, force){
					var progressService = serviceRegistry.getService("orion.page.message"); //$NON-NLS-0$
					var deferred = gitService.doPush(location, ref, true, force, //$NON-NLS-0$
							options.gitSshUsername, options.gitSshPassword, options.knownHosts,
							options.gitPrivateKey, options.gitPassphrase);
					progressService.createProgressMonitor(deferred, messages['Pushing remote: '] + name);
					deferred.then(
						function(jsonData){
							exports.handleProgressServiceResponse2(jsonData, serviceRegistry, 
								function() {
									if (explorer.parentId === "explorer-tree") { //$NON-NLS-0$
										if (!jsonData || !jsonData.HttpCode)
											dojo.query(".treeTableRow").forEach(function(node, i) { //$NON-NLS-0$
											dojo.toggleClass(node, "outgoingCommitsdRow", false); //$NON-NLS-0$
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
				};
										
				gitService.getGitClone(item.CloneLocation).then(
					function(clone){
						var remoteLocation = clone.Children[0].RemoteLocation;
						var locationToChange = clone.Children[0].ConfigLocation;
						
						exports.gatherSshCredentials(serviceRegistry, commandInvocation).then(
							function(options) {
								var result = new dojo.Deferred();
								
								if (item.RemoteLocation.length === 1 && item.RemoteLocation[0].Children.length === 1) { //when we push next time - chance to switch saved remote
									result = gitService.getGitRemote(remoteLocation);
								} else {
									var remotes = {};
									remotes.Children = item.RemoteLocation;
									result.resolve(remotes);
									
								}
						
								result.then(
									function(remotes){
										if(itemTargetBranch){
											handlePush(options, itemTargetBranch.Location, "HEAD", itemTargetBranch.Name, true);
											return;
										}
									
										var dialog = new orion.git.widgets.RemotePrompterDialog({
											title: messages["Choose Branch"],
											serviceRegistry: serviceRegistry,
											gitClient: gitService,
											treeRoot: {
												Children: remotes.Children
											},
											hideNewBranch: false,
											func: dojo.hitch(this, 
												function(targetBranch, remote, optional) {
													if(targetBranch === null){
														target = optional;
													}
													else{
														target = targetBranch;
													}
													
													var locationToUpdate = "/gitapi/config/" + "branch." + item.Name + ".remote"  + "/clone/file/" + parts[4];
													gitService.addCloneConfigurationProperty(locationToChange,"branch." + item.Name + ".remote" ,target.parent.Name).then(
														function(){
															commandInvocation.targetBranch = target;
															handlePush(options, target.Location, "HEAD",target.Name, true);
														}, function(err){
															if(err.status == 409){ //when confing entry is already defined we have to edit it
																gitService.editCloneConfigurationProperty(locationToUpdate,target.parent.Name).then(
																	function(){
																		commandInvocation.targetBranch = target;
																		handlePush(options, target.Location, "HEAD",target.Name, true);
																	}
																);
															}
														}
													);
												}
											)
										});
										
										if (item.RemoteLocation.length === 1 && item.RemoteLocation[0].Children.length === 1) { //when we push next time - chance to switch saved remote
											var dialog2 = dialog;
											
											dialog = new orion.git.widgets.ConfirmPushDialog({
												title: messages["Choose Branch"],
												serviceRegistry: serviceRegistry,
												gitClient: gitService,
												dialog: dialog2,
												location: item.RemoteLocation[0].Children[0].Name,
												func: dojo.hitch(this, function(){
													commandInvocation.targetBranch = item.RemoteLocation[0].Children[0];
													handlePush(options,item.RemoteLocation[0].Children[0].Location, "HEAD", path, true);
												})
											});
										}
										
										dialog.startup();
										dialog.show();
									}
								);
						
							}
						);
					}
				);			
			},
			visibleWhen : function(item) {
				if (item.toRef)
					// for action in the git log
					return item.RepositoryPath === "" && item.toRef.Type === "Branch" && item.toRef.Current && item.toRef.RemoteLocation; //$NON-NLS-0$		
			}
		});
		commandService.addCommand(pushForceCommand);

		var previousLogPage = new mCommands.Command({
			name : messages["< Previous Page"],
			tooltip: messages["Show previous page of git log"],
			id : "eclipse.orion.git.previousLogPage", //$NON-NLS-0$
			hrefCallback : function(data) {
				return require.toUrl("git/git-log.html") + "#" + data.items.PreviousLocation; //$NON-NLS-1$ //$NON-NLS-0$
			},
			visibleWhen : function(item) {
				if(item.Type === "RemoteTrackingBranch" || (item.toRef != null && item.toRef.Type === "Branch") || item.RepositoryPath != null){ //$NON-NLS-1$ //$NON-NLS-0$
					return item.PreviousLocation !== undefined;
				}
				return false;
			}
		});
		commandService.addCommand(previousLogPage);

		var nextLogPage = new mCommands.Command({
			name : messages["Next Page >"],
			tooltip: messages["Show next page of git log"],
			id : "eclipse.orion.git.nextLogPage", //$NON-NLS-0$
			hrefCallback : function(data) {
				return require.toUrl("git/git-log.html") + "#" + data.items.NextLocation; //$NON-NLS-1$ //$NON-NLS-0$
			},
			visibleWhen : function(item) {
				if(item.Type === "RemoteTrackingBranch" ||(item.toRef != null && item.toRef.Type === "Branch") || item.RepositoryPath != null){ //$NON-NLS-1$ //$NON-NLS-0$
					return item.NextLocation !== undefined;
				}
				return false;
			}
		});
		commandService.addCommand(nextLogPage);
		
		var previousTagPage = new mCommands.Command({
			name : messages["< Previous Page"],
			tooltip : messages["Show previous page of git tags"],
			id : "eclipse.orion.git.previousTagPage",
			hrefCallback : function(data) {
				return require.toUrl("git/git-repository.html") + "#" + data.items.PreviousLocation;
			},
			visibleWhen : function(item){
				if(item.Type === "Tag"){
					return item.PreviousLocation !== undefined;
				}
				return false;
			}
		});
		commandService.addCommand(previousTagPage);
		
		var nextTagPage = new mCommands.Command({
			name : messages["Next Page >"],
			tooltip : messages["Show next page of git tags"],
			id : "eclipse.orion.git.nextTagPage",
			hrefCallback : function(data){
				return require.toUrl("git/git-repository.html") + "#" + data.items.NextLocation;
			},
			visibleWhen : function(item){
				if(item.Type == "Tag"){
					return item.NextLocation !== undefined;
				}
				return false;
			}
		});
		commandService.addCommand(nextTagPage);

		var resetIndexCommand = new mCommands.Command({
			name : messages['Reset'],
			tooltip: messages["Reset your active branch to the state of the selected branch. Discard all staged and unstaged changes."],
			id : "eclipse.orion.git.resetIndex", //$NON-NLS-0$
			imageClass: "git-sprite-reset", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			callback: function(data) {
				var item = data.items;
				if(confirm(messages["The content of your active branch will be replaced with "] + item.Name + ". " + //$NON-NLS-1$
						messages["All unstaged and staged changes will be discarded and cannot be recovered. Are you sure?"])){
					var service = serviceRegistry.getService("orion.git.provider"); //$NON-NLS-0$
					var progressService = serviceRegistry.getService("orion.page.message"); //$NON-NLS-0$
					var deferred = service.resetIndex(item.IndexLocation, item.Name);
					progressService.createProgressMonitor(deferred, messages["Resetting index..."]);
					deferred.then(
						function(result){
							var display = {};
							display.Severity = "Info"; //$NON-NLS-0$
							display.HTML = false;
							display.Message = "Ok"; //$NON-NLS-0$
							dojo.hitch(explorer, explorer.changedItem)(item);
							progressService.setProgressResult(display);
						}, function (error){
							var display = {};
							display.Severity = "Error"; //$NON-NLS-0$
							display.HTML = false;
							display.Message = error.message;
							progressService.setProgressResult(display);
						}
					);
				}
			},
			visibleWhen : function(item) {
				return item.Type === "RemoteTrackingBranch"; //$NON-NLS-0$
			}
		});
		commandService.addCommand(resetIndexCommand);

		var tagNameParameters = new mCommands.ParametersDescription([new mCommands.CommandParameter('name', 'text', messages['Name:'])]); //$NON-NLS-1$ //$NON-NLS-0$

		var addTagCommand = new mCommands.Command({
			name : messages["Tag"],
			tooltip: messages["Create a tag for the commit"],
			imageClass: "git-sprite-tag", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			id : "eclipse.orion.git.addTag", //$NON-NLS-0$
			parameters: tagNameParameters,
			callback: function(data) {
				var item = data.items;
				
				var createTagFunction = function(commitLocation, tagName) {						
					serviceRegistry.getService("orion.git.provider").doAddTag(commitLocation, tagName).then(function() { //$NON-NLS-0$
						dojo.hitch(explorer, explorer.changedItem)(item);
					}, displayErrorOnStatus);
				};
				
				var commitLocation = item.Location;
				
				if (data.parameters.valueFor("name") && !data.parameters.optionsRequested) { //$NON-NLS-0$
					createTagFunction(commitLocation, data.parameters.valueFor("name")); //$NON-NLS-0$
				} else {
					exports.getNewItemName(item, explorer, false, data.domNode.id, messages["Tag name"], function(name) {
						if (!name && name == "") {
							return;
						}		
						createTagFunction(commitLocation, name);
					});
				}
			},
			visibleWhen : function(item) {
				return item.Type === "Commit"; //$NON-NLS-0$
			}
		});
		commandService.addCommand(addTagCommand);

		var removeTagCommand = new mCommands.Command({
			name: messages['Delete'],
			tooltip: messages["Delete the tag from the repository"],
			imageClass: "core-sprite-delete", //$NON-NLS-0$
			id: "eclipse.removeTag", //$NON-NLS-0$
			callback: function(data) {
				var item = data.items;
				if (confirm(dojo.string.substitute(messages["Are you sure you want to delete tag ${0}?"], [item.Name]))) {
					serviceRegistry.getService("orion.git.provider").doRemoveTag(item.Location).then(function() { //$NON-NLS-0$
						dojo.hitch(explorer, explorer.changedItem)(item.parent);
					}, displayErrorOnStatus);
				}
			},
			visibleWhen: function(item) {
				return item.Type === "Tag"; //$NON-NLS-0$
			}
		});
		commandService.addCommand(removeTagCommand);
		
		var notificationParameters = new mCommands.ParametersDescription([new mCommands.CommandParameter('reviewer', 'text', messages["Reviewer name"])], {hasOptionalParameters: true}); //$NON-NLS-1$ //$NON-NLS-0$
		
		var askForReviewCommand = new mCommands.Command({
			name: messages["Ask for review"],
			tooltip: messages["Ask for review tooltip"],
			imageClass: "core-sprite-tag", //$NON-NLS-0$
			id: "eclipse.orion.git.askForReviewCommand", //$NON-NLS-0$
			parameters: notificationParameters,
			callback: function(data) {
				var sshCheck = function(gitUrl){
					var url = gitUrl;
					var scheme = new dojo._Url(url).scheme;
					if(scheme === "ssh"){
						var indexOfAt = url.indexOf("@");
						if(indexOfAt !== -1){
							var urlNoUser = "ssh://" + url.substr(indexOfAt + 1);
							url = urlNoUser;
						}
					}
					return url;
				};
				var sendNotificationFunction = function(reviewerName){
					var item = data.items;
					var headLocation = item.Location.replace(item.Name, "HEAD"); 
					var authorName = item.AuthorName;
					var commitName = item.Name;
					var commitMessage = item.Message;
					serviceRegistry.getService("orion.git.provider").getGitClone(item.CloneLocation).then(
						function(clone){
							var nonHash = window.location.href.split('#')[0]; //$NON-NLS-0$
							var orionHome = nonHash.substring(0, nonHash.length - window.location.pathname.length);
							var url = sshCheck(clone.Children[0].GitUrl);
							var reviewRequestUrl = orionHome + "/git/reviewRequest.html#" + url + "_" + item.Name;
							serviceRegistry.getService("orion.git.provider").sendCommitReviewRequest(commitName, headLocation, reviewerName, reviewRequestUrl, authorName, commitMessage).then(
								function(result) {
									var display = {};
									display.Severity = "Ok"; //$NON-NLS-0$
									display.HTML = false;
									display.Message = result.Result;
									serviceRegistry.getService("orion.page.message").setProgressResult(display);
								}, displayErrorOnStatus
							);
						}
					);
				};
			if (data.parameters.valueFor("reviewer") && !data.parameters.optionsRequested) { //$NON-NLS-0$
				sendNotificationFunction(data.parameters.valueFor("reviewer")); //$NON-NLS-0$
			} else {
				var item = data.items;
				serviceRegistry.getService("orion.git.provider").getGitClone(item.CloneLocation).then(
					function(clone){
					var nonHash = window.location.href.split('#')[0]; //$NON-NLS-0$
						var orionHome = nonHash.substring(0, nonHash.length - window.location.pathname.length);
						var url = sshCheck(clone.Children[0].GitUrl);
						var reviewRequestUrl = orionHome + "/git/reviewRequest.html#" + url + "_" + item.Name;
						var dialog = new orion.git.widgets.ReviewRequestDialog({
							title: messages["Contribution Review Request"],
							url: reviewRequestUrl,
							func: sendNotificationFunction
							});
							dialog.startup();
							dialog.show();
					},displayErrorOnStatus);
			}
			},
			visibleWhen: function(item) {
				return item.Type === "Commit"; //$NON-NLS-0$
			}
		});
		commandService.addCommand(askForReviewCommand);

		var cherryPickCommand = new mCommands.Command({
			name : messages["Cherry-Pick"],
			tooltip: messages["Apply the change introduced by the commit to your active branch"],
			id : "eclipse.orion.git.cherryPick", //$NON-NLS-0$
			imageClass: "git-sprite-cherry_pick", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			callback: function(data) {
				var item = data.items;
				var path = dojo.hash();
				var service = serviceRegistry.getService("orion.git.provider"); //$NON-NLS-0$
				var headLocation = item.Location.replace(item.Name, "HEAD"); //$NON-NLS-0$
				service.doCherryPick(headLocation, item.Name).then(function(jsonData) {
					var display = [];

					// TODO we should not craft locations in the
					// code
					var statusLocation = item.Location.replace("commit/" + item.Name, "status"); //$NON-NLS-1$ //$NON-NLS-0$

					if (jsonData.Result == "OK") { //$NON-NLS-0$
						// operation succeeded
						display.Severity = "Ok"; //$NON-NLS-0$
						if (jsonData.HeadUpdated) {
							display.HTML = false;
							display.Message = jsonData.Result;

							if (explorer.parentId === "explorer-tree") { //$NON-NLS-0$
								// refresh commit list
								service.doGitLog(path).then(function(jsonData) {
									if (jsonData.HeadLocation) {
										// log view for remote
										dojo.place(document.createTextNode(messages['Getting git incoming changes...']), "explorer-tree", "only"); //$NON-NLS-2$ //$NON-NLS-1$
										service.getLog(jsonData.HeadLocation, jsonData.Id).then(function(scopedCommitsJsonData, secondArg) {
												explorer.renderer.setIncomingCommits(scopedCommitsJsonData.Children);
												explorer.loadCommitsList(jsonData.CommitLocation + "?page=1", jsonData, true); //$NON-NLS-0$
										});
									} else {
										// log view for branch /
										// all branches
										dojo.place(document.createTextNode(messages['Getting git incoming changes...']), "explorer-tree", "only"); //$NON-NLS-2$ //$NON-NLS-1$
										service.getLog(path, "HEAD").then(function(scopedCommitsJsonData, secondArg) { //$NON-NLS-0$
												explorer.renderer.setOutgoingCommits(scopedCommitsJsonData.Children);
												explorer.loadCommitsList(path, jsonData, true);
										});
									}
								});
							}
						} else {
							display.HTML = true;
							display.Message = "<span>"+messages["Nothing changed."]+"</span>"; //$NON-NLS-2$ //$NON-NLS-0$
						}
					}
					// handle special cases
					else if (jsonData.Result == "CONFLICTING") { //$NON-NLS-0$
						display.Severity = "Warning"; //$NON-NLS-0$
						display.HTML = true;
						display.Message = "<span>" + jsonData.Result + messages[". Some conflicts occurred"] + //$NON-NLS-0$
						+ dojo.string.substitute(messages['. Go to ${0}.'], ["<a href=\"" + require.toUrl(mGitUtil.statusUILocation) + "#"  //$NON-NLS-2$ //$NON-NLS-1$
						+ statusLocation +"\">"+messages['Git Status page']+"</a>"])+".</span>"; //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-0$
					} else if (jsonData.Result == "FAILED") { //$NON-NLS-0$
						display.Severity = "Error"; //$NON-NLS-0$
						display.HTML = true;
						display.Message = "<span>" + jsonData.Result;  //$NON-NLS-0$
						if(jsonData.FailingPaths){
							var paths = "";
							var isFirstPath = true;
							for(var path in jsonData.FailingPaths){
								if(!isFirstPath){
									paths+=", ";
								}
								isFirstPath = false;
								paths +=path;
							}
							if(!isFirstPath){
								display.Message+= ". " + dojo.string.substitute(messages['Failing paths: ${0}'], [paths]);
								}
						}
						display.Message += dojo.string.substitute(messages['. Go to ${0}.'], ["<a href=\"" + require.toUrl(mGitUtil.statusUILocation) + "#"  //$NON-NLS-2$ //$NON-NLS-1$
						+ statusLocation +"\">"+messages['Git Status page']+"</a>"])+".</span>";					} //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-0$
					// handle other cases
					else {
						display.Severity = "Warning"; //$NON-NLS-0$
						display.HTML = false;
						display.Message = jsonData.Result;
					}
					serviceRegistry.getService("orion.page.message").setProgressResult(display); //$NON-NLS-0$
				}, displayErrorOnStatus);

			},
			visibleWhen : function(item) {
				return item.Type === "Commit"; //$NON-NLS-0$
			}
		});
		commandService.addCommand(cherryPickCommand);
	};
	

	exports.createGitClonesCommands = function(serviceRegistry, commandService, explorer, toolbarId, selectionTools, fileClient) {
		
		function displayErrorOnStatus(error) {
		
		if(error){
		}
			
			if (error.status === 401 || error.status === 403)
				return;
			
			var display = [];
			
			display.Severity = "Error"; //$NON-NLS-0$
			display.HTML = false;
			
			try {
				var resp = JSON.parse(error.responseText);
				display.Message = resp.DetailedMessage ? resp.DetailedMessage : resp.Message;
			} catch (Exception) {
				display.Message = error.message;
			}
			
			serviceRegistry.getService("orion.page.message").setProgressResult(display); //$NON-NLS-0$
		}
		
		// Git repository configuration
		
		var addConfigParameters = new mCommands.ParametersDescription([new mCommands.CommandParameter('key', 'text', messages['Key:']),  //$NON-NLS-1$ //$NON-NLS-0$
		                                                               new mCommands.CommandParameter('value', 'text', messages['Value:'])]); //$NON-NLS-1$ //$NON-NLS-0$
		
		var addConfigEntryCommand = new mCommands.Command({
			name: messages["New Configuration Entry"],
			tooltip: "Add a new entry to the repository configuration", //$NON-NLS-0$
			imageClass: "core-sprite-add", //$NON-NLS-0$
			id: "eclipse.orion.git.addConfigEntryCommand", //$NON-NLS-0$
			parameters: addConfigParameters,
			callback: function(data) {
				var item = data.items;
				var gitService = serviceRegistry.getService("orion.git.provider"); //$NON-NLS-0$
				if (data.parameters.valueFor("key") && data.parameters.valueFor("value")){ //$NON-NLS-1$ //$NON-NLS-0$
					gitService.addCloneConfigurationProperty(item.ConfigLocation, data.parameters.valueFor("key"), data.parameters.valueFor("value")).then( //$NON-NLS-1$ //$NON-NLS-0$
						function(jsonData){
							dojo.hitch(explorer, explorer.changedItem)(item);
						}, displayErrorOnStatus
					);
				}
			}
		});
		commandService.addCommand(addConfigEntryCommand);
		
		var editConfigParameters = new mCommands.ParametersDescription([new mCommands.CommandParameter('value', 'text', messages['Value:'])]); //$NON-NLS-1$ //$NON-NLS-0$
		
		var editConfigEntryCommand = new mCommands.Command({
			name: messages["Edit"],
			tooltip: messages["Edit the configuration entry"],
			imageClass: "core-sprite-edit", //$NON-NLS-0$
			id: "eclipse.orion.git.editConfigEntryCommand", //$NON-NLS-0$
			parameters: editConfigParameters,
			callback: function(data) {
				var item = data.items;
				var gitService = serviceRegistry.getService("orion.git.provider"); //$NON-NLS-0$
				if (data.parameters.valueFor("value")){ //$NON-NLS-0$
					gitService.editCloneConfigurationProperty(item.Location, data.parameters.valueFor("value")).then( //$NON-NLS-0$
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
		commandService.addCommand(editConfigEntryCommand);
		
		var deleteConfigEntryCommand = new mCommands.Command({
			name: messages['Delete'],
			tooltip: messages["Delete the configuration entry"],
			imageClass: "core-sprite-delete", //$NON-NLS-0$
			id: "eclipse.orion.git.deleteConfigEntryCommand", //$NON-NLS-0$
			callback: dojo.hitch(this, function(data) {
				var item = data.items;
				var gitService = serviceRegistry.getService("orion.git.provider"); //$NON-NLS-0$
				if (confirm(dojo.string.substitute(messages["Are you sure you want to delete ${0}?"], [item.Key]))) {
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
		commandService.addCommand(deleteConfigEntryCommand);
		
		//
		
		var cloneParameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("url", "url", messages['Repository URL:'])], {hasOptionalParameters: true}); //$NON-NLS-1$ //$NON-NLS-0$

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
			name : messages["Clone Repository"],
			tooltip : messages["Clone an existing Git repository to a folder"],
			id : "eclipse.cloneGitRepository", //$NON-NLS-0$
			parameters: cloneParameters,
			callback : function(data) {
				var gitService = serviceRegistry.getService("orion.git.provider"); //$NON-NLS-0$
				var cloneFunction = function(gitUrl, path, name) {
					exports.getDefaultSshOptions(serviceRegistry).then(function(options) {
						var func = arguments.callee;
						var deferred = gitService.cloneGitRepository(name, gitUrl, path, explorer.defaultPath, options.gitSshUsername, options.gitSshPassword, options.knownHosts, //$NON-NLS-0$
								options.gitPrivateKey, options.gitPassphrase);
						serviceRegistry.getService("orion.page.message").createProgressMonitor(deferred,
								messages["Cloning repository: "] + gitUrl);
						deferred.then(function(jsonData, secondArg) {
							exports.handleProgressServiceResponse(jsonData, options, serviceRegistry, function(jsonData) {
								if (explorer.changedItem) {
									dojo.hitch(explorer, explorer.changedItem)();
								}
							}, func, messages['Clone Git Repository']);
						}, function(jsonData, secondArg) {
							exports.handleProgressServiceResponse(jsonData, options, serviceRegistry, function() {}, func, messages['Clone Git Repository']);
						});
					});
				};
				if (data.parameters.valueFor("url") && !data.parameters.optionsRequested) { //$NON-NLS-0$
					cloneFunction(data.parameters.valueFor("url")); //$NON-NLS-0$
				} else {
					var dialog = new orion.git.widgets.CloneGitRepositoryDialog({
						serviceRegistry: serviceRegistry,
						fileClient: fileClient,
						url: data.parameters.valueFor("url"), //$NON-NLS-0$
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
		commandService.addCommand(cloneGitRepositoryCommand);
		
		var cloneGitRepositoryCommandReviewReq = new mCommands.Command({
			name : messages["Clone Repository"],
			tooltip : messages["Clone an existing Git repository to a folder"],
			id : "eclipse.cloneGitRepositoryReviewReq", //$NON-NLS-0$
			//parameters: cloneParameters,
			callback : function(data) {
				var gitService = serviceRegistry.getService("orion.git.provider"); //$NON-NLS-0$
				var cloneFunction = function(gitUrl, path, name) {
					exports.getDefaultSshOptions(serviceRegistry).then(function(options) {
						var func = arguments.callee;
						var deferred = gitService.cloneGitRepository(name, gitUrl, path, explorer.defaultPath, options.gitSshUsername, options.gitSshPassword, options.knownHosts, //$NON-NLS-0$
								options.gitPrivateKey, options.gitPassphrase);
						serviceRegistry.getService("orion.page.message").createProgressMonitor(deferred,
								messages["Cloning repository: "] + gitUrl);
						deferred.then(function(jsonData, secondArg) {
							exports.handleProgressServiceResponse(jsonData, options, serviceRegistry, function(jsonData) {
								if (explorer.changedItem) {
									dojo.hitch(explorer, explorer.changedItem)();
								}
							}, func, messages['Clone Git Repository']);
						}, function(jsonData, secondArg) {
							exports.handleProgressServiceResponse(jsonData, options, serviceRegistry, function() {}, func, messages['Clone Git Repository']);
						});
					});
				};
				var dialog = new orion.git.widgets.CloneGitRepositoryDialog({
					serviceRegistry: serviceRegistry,
					fileClient: fileClient,
					url: data.userData,
					alwaysShowAdvanced: false,
					func: cloneFunction
				});
						
				dialog.startup();
				dialog.show();

			},
			visibleWhen : function(item) {
				return true;
			}
		});
		commandService.addCommand(cloneGitRepositoryCommandReviewReq);

		var addRemoteReviewRequestCommand = new mCommands.Command({
			name : messages["Add Remote"],
			tooltip : messages["Add a new remote to the repository"],
			id : "eclipse.addRemoteReviewRequestCommand", //$NON-NLS-0$
			imageClass: "git-sprite-fetch", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			callback : function(data) {
				// check if we know the remote name
				if(data.parameters && data.parameters.valueFor("remoteName")){
					data.remoteName = data.parameters.valueFor("remoteName");
				}
			
				var commandInvocation = data;
				var handleResponse = function(jsonData, commandInvocation){
					if (jsonData.JsonData.HostKey){
						commandInvocation.parameters = null;
						commandInvocation.errorData = jsonData.JsonData;
						commandService.collectParameters(commandInvocation);
					} else if (!commandInvocation.optionsRequested){
						var gitPreferenceStorage = new GitPreferenceStorage(serviceRegistry);
						gitPreferenceStorage.isEnabled().then(
							function(isEnabled){
								if(isEnabled){
									if (jsonData.JsonData.User)
										commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshpassword", "password", messages["SSH Password:"]), new mCommands.CommandParameter("saveCredentials", "boolean", messages["Don't prompt me again:"])], {hasOptionalParameters: true}); //$NON-NLS-1$ //$NON-NLS-0$
									else
										commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshuser", "text", messages["SSH User Name:"]), new mCommands.CommandParameter("sshpassword", "password", messages['SSH Password:']), new mCommands.CommandParameter("saveCredentials", "boolean", messages["Don't prompt me again:"])], {hasOptionalParameters: true}); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
								} else {
									if (jsonData.JsonData.User)
										commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshpassword", "password", messages["SSH Password:"])], {hasOptionalParameters: true}); //$NON-NLS-1$ //$NON-NLS-0$
									else
										commandInvocation.parameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("sshuser", "text", messages["SSH User Name:"]), new mCommands.CommandParameter("sshpassword", "password", messages['SSH Password:'])], {hasOptionalParameters: true}); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
								}
								
								commandInvocation.errorData = jsonData.JsonData;
								commandService.collectParameters(commandInvocation);
							}
						);
					} else {
						commandInvocation.errorData = jsonData.JsonData;
						commandService.collectParameters(commandInvocation);
					}
				};

				if (commandInvocation.parameters && commandInvocation.parameters.optionsRequested){
					commandInvocation.parameters = null;
					commandInvocation.optionsRequested = true;
					commandService.collectParameters(commandInvocation);
					return;
				}
				var createRemoteFunction = function(remoteLocation, name, selectedRepository) {				
					serviceRegistry.getService("orion.git.provider").addRemote(remoteLocation, name, data.userData).then(function() { //$NON-NLS-0$
						exports.gatherSshCredentials(serviceRegistry, data).then(
							function(options) {
								serviceRegistry.getService("orion.git.provider").getGitRemote(selectedRepository.RemoteLocation).then(
								function(remotes){
									var remoteToFetch;
									for(var i=0;i<remotes.Children.length;i++){
										if(remotes.Children[i].Name === name){
											remoteToFetch = remotes.Children[i];
										}
									}
									var item = selectedRepository;
									var gitService = serviceRegistry.getService("orion.git.provider"); //$NON-NLS-0$
									var statusService = serviceRegistry.getService("orion.page.message"); //$NON-NLS-0$
									var deferred = gitService.doFetch(remoteToFetch.Location, false,
										options.gitSshUsername,
										options.gitSshPassword,
										options.knownHosts,
										options.gitPrivateKey,
										options.gitPassphrase);
									statusService.createProgressMonitor(deferred, messages["Fetching remote: "] + remoteToFetch.Location);
									deferred.then(
												function(jsonData, secondArg) {
												exports.handleProgressServiceResponse2(jsonData, serviceRegistry, 
													function() {
														gitService.getGitRemote(remoteToFetch.Location).then(
															function(jsonData){
																var remoteJsonData = jsonData;
																if (explorer.parentId === "explorer-tree") { //$NON-NLS-0$
																	dojo.place(document.createTextNode(messages['Getting git incoming changes...']), "explorer-tree", "only"); //$NON-NLS-2$ //$NON-NLS-1$
																	gitService.getLog(remoteJsonData.HeadLocation, remoteJsonData.Id).then(function(loadScopedCommitsList) {
																		explorer.renderer.setIncomingCommits(loadScopedCommitsList.Children);
																		explorer.loadCommitsList(remoteJsonData.CommitLocation + "?page=1", remoteJsonData, true); //$NON-NLS-0$
																	});
																}
																dojo.hitch(explorer, explorer.changedItem)(item);
															}, displayErrorOnStatus
														);
													}, function (jsonData) {
														handleResponse(jsonData, data);
													}
												);
											},function(jsonData, secondArg) {
												exports.handleProgressServiceResponse2(jsonData, serviceRegistry, 
													function() {
													}, function (jsonData) {
														handleResponse(jsonData, commandInvocation);
													}
												);
										}
											);
						});
						});
					}, displayErrorOnStatus);
				};
					
				if(commandInvocation.remoteName){
					// known remote name, execute without prompting
					createRemoteFunction(commandInvocation.items.RemoteLocation,
										commandInvocation.remoteName,
										commandInvocation.items);
				} else {
					commandInvocation.parameters = new mCommands.ParametersDescription([
						new mCommands.CommandParameter("remoteName", "text", messages["Remote Name:"])
					], {hasOptionalParameters : false});
					
					commandService.collectParameters(commandInvocation);
				}

			},
			visibleWhen : function(item) {
				return true;
			}
		});
		commandService.addCommand(addRemoteReviewRequestCommand);

		var initRepositoryParameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("folderName", "text", messages['New folder:'])], {hasOptionalParameters: true}); //$NON-NLS-1$ //$NON-NLS-0$
		
		var initGitRepositoryCommand = new mCommands.Command({
			name : messages["Init Repository"],
			tooltip : messages["Create a new Git repository in a new folder"],
			id : "eclipse.initGitRepository", //$NON-NLS-0$
			parameters: initRepositoryParameters,
			callback : function(data) {
				var gitService = serviceRegistry.getService("orion.git.provider"); //$NON-NLS-0$
				var initRepositoryFunction = function(gitUrl, path, name) {
					exports.getDefaultSshOptions(serviceRegistry).then(function(options){
						var func = arguments.callee;
						var deferred = gitService.cloneGitRepository(name, gitUrl, path, explorer.defaultPath); //$NON-NLS-0$
						serviceRegistry.getService("orion.page.message").createProgressMonitor(deferred,
								messages["Initializing repository: "] + name);
						deferred.then(function(jsonData, secondArg){
							exports.handleProgressServiceResponse(jsonData, options, serviceRegistry, function(jsonData){
								if(explorer.changedItem)
									dojo.hitch(explorer, explorer.changedItem)();
							}, func, messages["Init Git Repository"]);
						}, function(jsonData, secondArg) {
							exports.handleProgressServiceResponse(jsonData, options, serviceRegistry, function() {}, func, messages['Init Git Repository']);
						});
					});
				};
				
				if (data.parameters.valueFor("folderName") && !data.parameters.optionsRequested) { //$NON-NLS-0$
					initRepositoryFunction(null, null, data.parameters.valueFor("folderName")); //$NON-NLS-0$
				} else {
					var dialog = new orion.git.widgets.CloneGitRepositoryDialog({
						serviceRegistry: serviceRegistry,
						title: messages['Init Git Repository'],
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
		commandService.addCommand(initGitRepositoryCommand);

		var deleteCommand = new mCommands.Command({
			name: messages['Delete'], // "Delete Repository"
			tooltip: messages["Delete the repository"],
			imageClass: "core-sprite-delete", //$NON-NLS-0$
			id: "eclipse.git.deleteClone", //$NON-NLS-0$
			visibleWhen: function(item) {
				return item.Type === "Clone";
				
//				var items = dojo.isArray(item) ? item : [item];
//				if (items.length === 0) {
//					return false;
//				}
//				for (var i=0; i < items.length; i++) {
//					if (items[i].Type !== "Clone") { //$NON-NLS-0$
//						return false;
//					}
//				}
//				return true;
			},
			callback: function(data) {
				var item = data.items;
				var gitService = serviceRegistry.getService("orion.git.provider"); //$NON-NLS-0$
				if(dojo.isArray(item)){
					if(confirm(dojo.string.substitute(messages["Are you sure you want do delete ${0} repositories?"], [item.length]))){
						var alreadyDeleted = 0;
						for(var i=0; i<item.length; i++){
							gitService.removeGitRepository(item[i].Location).then(
									function(jsonData){
										alreadyDeleted++;
										if(alreadyDeleted >= item.length && explorer.changedItem){
											dojo.hitch(explorer, explorer.changedItem)();
										}
									}, displayErrorOnStatus);
						}
					}
				} else {
					if(confirm(dojo.string.substitute(messages['Are you sure you want to delete ${0}?'], [item.Name])))
						gitService.removeGitRepository(item.Location).then(
							function(jsonData){
								if(explorer.changedItem){
									dojo.hitch(explorer, explorer.changedItem)();
								}
							},
							displayErrorOnStatus);
				}
				
			}
		});
		commandService.addCommand(deleteCommand);

		var applyPatchCommand = new mCommands.Command({
			name : messages['Apply Patch'],
			tooltip: messages["Apply a patch on the selected repository"],
			id : "eclipse.orion.git.applyPatch", //$NON-NLS-0$
			imageClass: "git-sprite-apply_patch", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			callback: function(data) {
				var item = forceSingleItem(data.items);
				var dialog = new orion.git.widgets.ApplyPatchDialog({
					title: messages['Apply Patch'],
					diffLocation: item.DiffLocation
				});
				dialog.startup();
				dialog.show();
			},
			visibleWhen : function(item) {
				return item.Type === "Clone" ; //$NON-NLS-0$
			}
		});
		commandService.addCommand(applyPatchCommand);
		
		var showContentCommand = new mCommands.Command({
			name : messages["Show content"],
			tooltip: messages['Apply a patch on the selected repository'],
			id : "eclipse.orion.git.showContent", //$NON-NLS-0$
			imageClass: "git-sprite-apply_patch", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			callback: function(data) {
				var item = forceSingleItem(data.items);
				var dialog = new orion.git.widgets.ContentDialog({
					title: messages['Content'],
					diffLocation: item.DiffLocation
				});
						dialog.startup();
						dialog.show();
	
			}
			//visibleWhen : function(item) {
				//return item.Type === "Clone" ;
			//}
		});
		commandService.addCommand(showContentCommand);
		
		var openCommitParameters = new mCommands.ParametersDescription([new mCommands.CommandParameter("commitName", "text", messages["Commit name:"])], {hasOptionalParameters: true}); //$NON-NLS-1$ //$NON-NLS-0$
		
		var openCommitCommand = new mCommands.Command({
			name : messages["Open Commit"],
			tooltip: messages["Open the commit with the given name"],
			id : "eclipse.orion.git.openCommitCommand", //$NON-NLS-0$
			imageClass: "git-sprite-apply_patch", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			parameters: openCommitParameters,
			callback: function(data) {
				var findCommitLocation = function (repositories, commitName, deferred) {
					if (deferred == null)
						deferred = new dojo.Deferred();
					
					if (repositories.length > 0) {
						serviceRegistry.getService("orion.git.provider").doGitLog( //$NON-NLS-0$
							"/gitapi/commit/" + data.parameters.valueFor("commitName") + repositories[0].ContentLocation + "?page=1&pageSize=1", null, null, messages['Looking for the commit']).then( //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
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
							{repositories: repositories, serviceRegistry: serviceRegistry, commitName: data.parameters.valueFor("commitName")} //$NON-NLS-0$
						).show();
					} else {
						serviceRegistry.getService("orion.page.message").setProgressMessage(messages['Looking for the commit']); //$NON-NLS-0$
						findCommitLocation(repositories, data.parameters.valueFor("commitName")).then( //$NON-NLS-0$
							function(commitLocation){
								if(commitLocation !== null){
									var commitPageURL = "/git/git-commit.html#" + commitLocation + "?page=1&pageSize=1"; //$NON-NLS-1$ //$NON-NLS-0$
									window.open(commitPageURL);
								}
							}, function () {
								var display = [];
								display.Severity = "warning"; //$NON-NLS-0$
								display.HTML = false;
								display.Message = messages["No commits found"];
								serviceRegistry.getService("orion.page.message").setProgressResult(display); //$NON-NLS-0$
							}
						);
					}	
				};

				if (data.items.Type === "Clone") { //$NON-NLS-0$
					var repositories = [data.items];
					openCommit(repositories);
				} else if (data.items.CloneLocation){
					serviceRegistry.getService("orion.git.provider").getGitClone(data.items.CloneLocation).then( //$NON-NLS-0$
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
				return item.Type === "Clone" || item.CloneLocation || (item.length > 1 && item[0].Type === "Clone") ; //$NON-NLS-1$ //$NON-NLS-0$
			}
		});
		commandService.addCommand(openCommitCommand);
	};

	exports.createGitStatusCommands = function(serviceRegistry, commandService, explorer) {
		
		function displayErrorOnStatus(error) {
			if (error.status === 401 || error.status === 403)
				return;
			
			var display = [];
			
			display.Severity = "Error"; //$NON-NLS-0$
			display.HTML = false;
			
			try {
				var resp = JSON.parse(error.responseText);
				display.Message = resp.DetailedMessage ? resp.DetailedMessage : resp.Message;
			} catch (Exception) {
				display.Message = error.message;
			}
			
			serviceRegistry.getService("orion.page.message").setProgressResult(display); //$NON-NLS-0$
		}
		
		function forceArray(item) {
			if (!dojo.isArray(item)) {
				item = [item];
			}
			return item;
		}
		
		var stageCommand = new mCommands.Command({
			name: messages['Stage'],
			tooltip: messages['Stage the change'],
			imageClass: "git-sprite-stage", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			id: "eclipse.orion.git.stageCommand", //$NON-NLS-0$
			callback: function(data) {
				var items = forceArray(data.items);
				
				var progressService = serviceRegistry.getService("orion.page.message"); //$NON-NLS-0$
				
				if (items.length === 1){
					var deferred = serviceRegistry.getService("orion.git.provider").stage(items[0].indexURI); //$NON-NLS-0$ 
					progressService.createProgressMonitor(
						deferred,
						messages["Staging changes"]);
					deferred.then(
						function(jsonData){
							dojo.hitch(explorer, explorer.changedItem)(items);
						}, displayErrorOnStatus
					);
				} else {
					var paths = [];
					for ( var i = 0; i < items.length; i++) {
						paths[i] = items[i].name;
					}
					
					var deferred = serviceRegistry.getService("orion.git.provider").stageMultipleFiles(data.userData.Clone.IndexLocation, paths);
					progressService.createProgressMonitor(
						deferred, //$NON-NLS-0$
						"Staging changes");
					deferred.then( //$NON-NLS-0$
						function(jsonData){
							dojo.hitch(explorer, explorer.changedItem)(items);
						}, displayErrorOnStatus
					);
				}			
			},
			visibleWhen: function(item) {
				var items = forceArray(item);
				if (items.length === 0)
					return false;

				for (var i = 0; i < items.length; i++) {
					if (!mGitUtil.isChange(items[i]) || mGitUtil.isStaged(items[i]))
						return false; 
				}
				return true;
			}
		});	
		
		commandService.addCommand(stageCommand);
		
		var unstageCommand = new mCommands.Command({
			name: messages['Unstage'],
			tooltip: messages['Unstage the change'],
			imageClass: "git-sprite-unstage", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			id: "eclipse.orion.git.unstageCommand", //$NON-NLS-0$
			callback: function(data) {
				var items = forceArray(data.items);
				
				var progressService = serviceRegistry.getService("orion.page.message"); //$NON-NLS-0$

				if (items.length === 1){				
					var deferred = serviceRegistry.getService("orion.git.provider").unstage(items[0].indexURI, items[0].name);
					progressService.createProgressMonitor(
						deferred, //$NON-NLS-0$
						messages['Staging changes']);
					deferred.then(
						function(jsonData){
							dojo.hitch(explorer, explorer.changedItem)(items);
						}, displayErrorOnStatus
					);
				} else {
					var paths = [];
					for ( var i = 0; i < items.length; i++) {
						paths[i] = items[i].name;
					}
					
					var deferred = serviceRegistry.getService("orion.git.provider").unstage(data.userData.Clone.IndexLocation, paths); //$NON-NLS-0$
					progressService.createProgressMonitor(
						deferred,
						messages['Staging changes']);
					deferred.then(
						function(jsonData){
							dojo.hitch(explorer, explorer.changedItem)(items);
						}, displayErrorOnStatus
					);
				}
			},
			visibleWhen: function(item) {
				var items = forceArray(item);
				if (items.length === 0)
					return false;

				for (var i = 0; i < items.length; i++) {
					if (!mGitUtil.isChange(items[i]) || !mGitUtil.isStaged(items[i]))
						return false; 
				}
				return true;
			}
		});	
		
		commandService.addCommand(unstageCommand);
		
		var commitMessageParameters = new mCommands.ParametersDescription(
			[new mCommands.CommandParameter('name', 'text', messages['Commit message:'], "", 4), new mCommands.CommandParameter('amend', 'boolean', messages['Amend:'], false)], //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
			 {hasOptionalParameters: true});
		
		var commitCommand = new mCommands.Command({
			name: "Commit", //$NON-NLS-0$
			tooltip: "Commit", //$NON-NLS-0$
			id: "eclipse.orion.git.commitCommand", //$NON-NLS-0$
			parameters: commitMessageParameters,
			callback: function(data) {
				var item = data.items.status;
				
				var commitFunction = function(body){		
					var progressService = serviceRegistry.getService("orion.page.message"); //$NON-NLS-0$
					var deferred =serviceRegistry.getService("orion.git.provider").commitAll(item.Clone.HeadLocation, null, dojo.toJson(body)); //$NON-NLS-0$ 
					progressService.createProgressMonitor(
						deferred,
						messages["Committing changes"]);
					deferred.then(
						function(jsonData){
							dojo.hitch(explorer, explorer.changedItem)(item);
						}, displayErrorOnStatus
					);
				};
				
				var body = {};
				body.Message = data.parameters.valueFor("name"); //$NON-NLS-0$
				body.Amend = data.parameters.valueFor("amend"); //$NON-NLS-0$
				
				var config = item.Clone.Config;
				for (var i=0; i < config.length; i++){
					if (config[i].Key === "user.name"){ //$NON-NLS-0$
						body.CommitterName = config[i].Value;
						body.AuthorName = config[i].Value;
					} else if (config[i].Key === "user.email"){ //$NON-NLS-0$
						body.CommitterEmail = config[i].Value;
						body.AuthorEmail = config[i].Value;
					}					
				}
				

				if (body.Message && body.CommitterName && body.CommitterEmail && !data.parameters.optionsRequested) {
					commitFunction(body);
				} else {
					var dialog = new orion.git.widgets.CommitDialog({
						body: body,
						func: commitFunction
					});
							
					dialog.startup();
					dialog.show();
				}
			},
			visibleWhen: function(item) {
				return true;
			}
		});	

		commandService.addCommand(commitCommand);

		var resetCommand = new mCommands.Command({
			name: messages['Reset'],
			tooltip: messages['Reset the branch, discarding all staged and unstaged changes'],
			imageClass: "core-sprite-refresh", //$NON-NLS-0$
			id: "eclipse.orion.git.resetCommand", //$NON-NLS-0$
			callback: function(data) {
				var item = data.items;
				
				var dialog = serviceRegistry.getService("orion.page.dialog"); //$NON-NLS-0$
				dialog.confirm(messages['All unstaged and staged changes in the working directory and index will be discarded and cannot be recovered.']+"\n" + //$NON-NLS-1$
					messages['Are you sure you want to continue?'],
					function(doit) {
						if (!doit) {
							return;
						}
						var progressService = serviceRegistry.getService("orion.page.message"); //$NON-NLS-0$
						var deferred = serviceRegistry.getService("orion.git.provider").unstageAll(item.IndexLocation, "HARD"); //$NON-NLS-1$ //$NON-NLS-0$ 
						progressService.createProgressMonitor(
							deferred,
							messages["Resetting local changes"]);
						deferred.then(
							function(jsonData){
								dojo.hitch(explorer, explorer.changedItem)(item);
							}, displayErrorOnStatus
						);		
					}
				);
			},
			
			visibleWhen: function(item) {
				return mGitUtil.hasStagedChanges(item) || mGitUtil.hasUnstagedChanges(item);;
			}
		});

		commandService.addCommand(resetCommand);

		var checkoutCommand = new mCommands.Command({
			name: messages['Checkout'],
			tooltip: messages["Checkout files, discarding all changes"],
			imageClass: "git-sprite-checkout", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			id: "eclipse.orion.git.checkoutCommand", //$NON-NLS-0$
			callback: function(data) {				
				var items = forceArray(data.items);
				
				var dialog = serviceRegistry.getService("orion.page.dialog"); //$NON-NLS-0$
				dialog.confirm(messages["Your changes to the selected files will be discarded and cannot be recovered."] + "\n" + //$NON-NLS-1$
					messages['Are you sure you want to continue?'],
					function(doit) {
						if (!doit) {
							return;
						}
						
						var progressService = serviceRegistry.getService("orion.page.message"); //$NON-NLS-0$
						
						var paths = [];
						for ( var i = 0; i < items.length; i++) {
							paths[i] = items[i].name;
						}
						
						var deferred = serviceRegistry.getService("orion.git.provider").checkoutPath(data.userData.Clone.Location, paths); //$NON-NLS-0$
						progressService.createProgressMonitor(
							deferred,
							messages['Resetting local changes']);
						deferred.then(
							function(jsonData){
								dojo.hitch(explorer, explorer.changedItem)(items);
							}, displayErrorOnStatus
						);				
					}
				);
			},
			visibleWhen: function(item) {
				var items = forceArray(item);
				if (items.length === 0)
					return false;

				for (var i = 0; i < items.length; i++) {
					if (!mGitUtil.isChange(items[i]) || mGitUtil.isStaged(items[i]))
						return false; 
				}
				return true;
			}
		});

		commandService.addCommand(checkoutCommand);

		var showPatchCommand = new mCommands.Command({
			name: messages["Show Patch"],
			tooltip: messages["Show workspace changes as a patch"],
			imageClass: "git-sprite-diff", //$NON-NLS-0$
			spriteClass: "gitCommandSprite", //$NON-NLS-0$
			id: "eclipse.orion.git.showPatchCommand", //$NON-NLS-0$
			hrefCallback : function(data) {
				var items = forceArray(data.items);
				
				var url = data.userData.Clone.DiffLocation + "?parts=diff"; //$NON-NLS-0$
				for (var i = 0; i < items.length; i++) {
					url += "&Path="; //$NON-NLS-0$
					url += items[i].name;
				}
				return url;
			},
			visibleWhen: function(item) {
				var items = forceArray(item);
				if (items.length === 0)
					return false;

				for (var i = 0; i < items.length; i++) {
					if (mGitUtil.isStaged(items[i]))
						return false; 
				}
				return true;
			}
		});
		
		commandService.addCommand(showPatchCommand);
		
		// Rebase commands
		
		var rebaseContinueCommand = new mCommands.Command({
			name: messages["Continue"],
			tooltip: messages["Contibue Rebase"],
			id: "eclipse.orion.git.rebaseContinueCommand", //$NON-NLS-0$
			callback: function(data) {
				var item = data.items;
				return _rebase(item.Clone.HeadLocation, "CONTINUE"); //$NON-NLS-0$
			},
			
			visibleWhen: function(item) {
				return item.RepositoryState.indexOf("REBASING") != -1; //$NON-NLS-0$
			}
		});
		
		commandService.addCommand(rebaseContinueCommand);
		
		var rebaseSkipPatchCommand = new mCommands.Command({
			name: messages["Skip Patch"],
			tooltip: messages['Skip Patch'],
			id: "eclipse.orion.git.rebaseSkipPatchCommand", //$NON-NLS-0$
			callback: function(data) {
				var item = data.items;
				return _rebase(item.Clone.HeadLocation, "SKIP"); //$NON-NLS-0$
			},
			
			visibleWhen: function(item) {
				return item.RepositoryState.indexOf("REBASING") != -1; //$NON-NLS-0$
			}
		});
		
		commandService.addCommand(rebaseSkipPatchCommand);
		
		var rebaseAbortCommand = new mCommands.Command({
			name: messages["Abort"],
			tooltip: messages["Abort Rebase"],
			id: "eclipse.orion.git.rebaseAbortCommand", //$NON-NLS-0$
			callback: function(data) {
				var item = data.items;
				return _rebase(item.Clone.HeadLocation, "ABORT"); //$NON-NLS-0$
			},
			
			visibleWhen: function(item) {
				return item.RepositoryState.indexOf("REBASING") != -1; //$NON-NLS-0$
			}
		});
		
		commandService.addCommand(rebaseAbortCommand);	

		
		function _rebase(HeadLocation, action){
			var progressService = serviceRegistry.getService("orion.page.message"); //$NON-NLS-0$
			
			var deferred = serviceRegistry.getService("orion.git.provider").doRebase(HeadLocation, "", action); //$NON-NLS-0$ 
			progressService.createProgressMonitor(
				deferred,
				action);
			deferred.then(
				function(jsonData){
					if (jsonData.Result == "OK" || jsonData.Result == "ABORTED" || jsonData.Result == "FAST_FORWARD" || jsonData.Result == "UP_TO_DATE") { //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						var display = [];
						display.Severity = "Ok"; //$NON-NLS-0$
						display.HTML = false;
						display.Message = jsonData.Result;
						
						serviceRegistry.getService("orion.page.message").setProgressResult(display); //$NON-NLS-0$
						dojo.hitch(explorer, explorer.changedItem)({});
					}
					
					if (jsonData.Result == "STOPPED") { //$NON-NLS-0$
						var display = [];
						display.Severity = "Warning"; //$NON-NLS-0$
						display.HTML = false;
						display.Message = jsonData.Result + messages['. Repository still contains conflicts.'];
						
						serviceRegistry.getService("orion.page.message").setProgressResult(display); //$NON-NLS-0$
						dojo.hitch(explorer, explorer.changedItem)({});
					} else if (jsonData.Result == "FAILED_UNMERGED_PATHS") { //$NON-NLS-0$
						var display = [];
						display.Severity = "Error"; //$NON-NLS-0$
						display.HTML = false;
						display.Message = jsonData.Result + messages['. Repository contains unmerged paths. Resolve conflicts first.'];
						
						serviceRegistry.getService("orion.page.message").setProgressResult(display); //$NON-NLS-0$
					}
					
				}, displayErrorOnStatus
			);
		}
	};

}());
return exports;	
});
