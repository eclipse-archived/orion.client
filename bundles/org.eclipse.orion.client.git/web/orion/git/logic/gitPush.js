/******************************************************************************* 
 * @license
 * Copyright (c) 2011, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*globals define confirm */

define(['i18n!git/nls/gitmessages','orion/commandRegistry','orion/git/widgets/ConfirmPushDialog','orion/git/gitPreferenceStorage','orion/git/logic/gitCommon','orion/Deferred'
        ,'orion/git/widgets/RemotePrompterDialog', 'orion/objects'], 
		function(messages,mCommandRegistry,mConfirmPush,GitPreferenceStorage, mGitCommon, Deferred,mRemotePrompter, objects) {
	
	var handleGitServiceResponse = mGitCommon.handleGitServiceResponse;
	var handleProgressServiceResponse = mGitCommon.handleProgressServiceResponse;
	var gatherSshCredentials = mGitCommon.gatherSshCredentials;
	
	/**
	 * Acts as a factory for push related functions.
	 * @param dependencies All required objects and values to perform the command
	 */
	return function(dependencies) {
		
		var serviceRegistry = dependencies.serviceRegistry;
		var commandService = dependencies.commandService;
		var tags = dependencies.tags;
		var force = dependencies.force;
		var gerrit = dependencies.gerrit;
		
		//Callbacks
		var confirmCallback = dependencies.confirmDialogCloseCallback;
		var remoteCallback = dependencies.remotePrompterDialogCloseCallback;
		var sshCredentialsCallback = dependencies.sshCredentialsDialogCloseCallback;
		var sshSlideoutCallback = dependencies.sshSlideoutCloseCallback;
		
		var chooseRemote = function(repository, branch, updateConfig) {
			var result = new Deferred();
			var remotes = new Deferred();
			var gitService = serviceRegistry.getService("orion.git.provider"); //$NON-NLS-0$
			var progress = serviceRegistry.getService("orion.page.progress"); //$NON-NLS-0$
			if (branch.RemoteLocation.length === 1 && branch.RemoteLocation[0].Children && branch.RemoteLocation[0].Children.length === 1) { //when we push next time - chance to switch saved remote
				remotes = progress.progress(gitService.getGitRemote(repository.RemoteLocation), "Getting git remote details " + branch.Name);
			} else {
				remotes.resolve({Children: branch.RemoteLocation});
			}
			remotes.then(function(remotes) {
				
				var handleError = function(error){
					handleProgressServiceResponse(error, {}, serviceRegistry);
					result.reject(error);
				};
						
				var dialog = new mRemotePrompter.RemotePrompterDialog({
					title: messages["Choose Branch"],
					serviceRegistry: serviceRegistry,
					gitClient: gitService,
					closeCallback: function() {
						result.reject();
					},
					treeRoot: {
						Children: remotes.Children
					},
					hideNewBranch: false,
					func: function(targetBranch, remote, optional) {
						var target;
						if(targetBranch === null){
							target = optional;
						}
						else{
							target = targetBranch;
						}
						if (updateConfig === undefined || updateConfig) {
							var configKey = "branch." + branch.Name + ".remote"; //$NON-NLS-1$ //$NON-NLS-0$
							progress.progress(gitService.addCloneConfigurationProperty(repository.ConfigLocation, configKey ,target.parent.Name), "Adding git configuration property "+ branch.Name).then(function(){
								result.resolve(target);
							}, function(err){
								if(err.status === 409){ //when confing entry is already defined we have to edit it
									gitService.getGitCloneConfig(repository.ConfigLocation).then(function(config){
										if(config.Children){
											for(var i=0; i<config.Children.length; i++){
												if(config.Children[i].Key===configKey){
													var locationToUpdate = config.Children[i].Location;
													progress.progress(gitService.editCloneConfigurationProperty(locationToUpdate,target.parent.Name), "Updating configuration property " + target.parent.Name).then(function(){
														result.resolve(target);
													},
													handleError);
													break;
												}
											}
										}
										
									}, handleError);
								} else {
									handleError(err);
								}
							});
						} else {
							result.resolve(target);
						}
					}
				});
				dialog.show();
			});
			return result;
		};
		
		var perform = function(data) {
			var d = new Deferred();
				
			var confirmDialogCallback = function () {
				if (typeof(confirmCallback) === "function") confirmCallback(); //$NON-NLS-0$
				d.reject();
			};
				
			var remotePrompterDialogCallback = function () {
				if (typeof(remoteCallback) === "function") remoteCallback(); //$NON-NLS-0$
				d.reject();
			};
				
			var sshCredentialsDialogCallback = function () {
				if (typeof(sshCredentialsCallback) === "function") sshCredentialsCallback(); //$NON-NLS-0$
				d.reject();
			};
				
			var sshSlideoutCloseCallback = function () {
				if (typeof(sshSlideoutCallback) === "function") sshSlideoutCallback(); //$NON-NLS-0$
				d.reject();
			};
				
			function command(data) {
				//previously saved target branch
				var itemTargetBranch = data.targetBranch;
				
				var confirmedWarnings = data.confirmedWarnings;
				if(force && !confirmedWarnings){
					if(!confirm(messages["You're going to override content of the remote branch. This can cause the remote repository to lose commits."]+"\n\n"+messages['Are you sure?'])){ //$NON-NLS-0$
						d.reject();
						return;
					} else {
						data.confirmedWarnings = true;
						confirmedWarnings = true;
					}
				}
			
				var item = data.items;
				if (item.LocalBranch && item.RemoteBranch) {
					itemTargetBranch = item.RemoteBranch;
					item = item.LocalBranch;
				}
				if (item.toRef) {
					item = item.toRef;
				}
				var commandInvocation = data;
				if (!commandInvocation.command) {
					commandInvocation.command = {};
					commandInvocation.command.callback = command;
				}

				var handleResponse = function(jsonData, commandInvocation){
					if (jsonData.JsonData.HostKey){
						commandInvocation.parameters = null;
						commandInvocation.errorData = jsonData.JsonData;
						commandInvocation.errorData.failedOperation = jsonData.failedOperation;
						commandService.collectParameters(commandInvocation,sshSlideoutCloseCallback);
					} else if (!commandInvocation.optionsRequested){
						var gitPreferenceStorage = new GitPreferenceStorage(serviceRegistry);
						gitPreferenceStorage.isEnabled().then(
							function(isEnabled){
								if(isEnabled){
									if (jsonData.JsonData.User)
										commandInvocation.parameters = new mCommandRegistry.ParametersDescription([new mCommandRegistry.CommandParameter("sshpassword", "password", messages['Password:']), new mCommandRegistry.CommandParameter("saveCredentials", "boolean", messages["Don't prompt me again:"])], {hasOptionalParameters: true}); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
									else
										commandInvocation.parameters = new mCommandRegistry.ParametersDescription([new mCommandRegistry.CommandParameter("sshuser", "text", messages['User Name:']), new mCommandRegistry.CommandParameter("sshpassword", "password", messages['Password:']), new mCommandRegistry.CommandParameter("saveCredentials", "boolean", messages["Don't prompt me again:"])], {hasOptionalParameters: true}); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
								} else {
									if (jsonData.JsonData.User)
										commandInvocation.parameters = new mCommandRegistry.ParametersDescription([new mCommandRegistry.CommandParameter("sshpassword", "password", messages['Password:'])], {hasOptionalParameters: true}); //$NON-NLS-1$ //$NON-NLS-0$
									else
										commandInvocation.parameters = new mCommandRegistry.ParametersDescription([new mCommandRegistry.CommandParameter("sshuser", "text", messages['User Name:']), new mCommandRegistry.CommandParameter("sshpassword", "password", messages['Password:'])], {hasOptionalParameters: true}); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-0$
								}
								
								commandInvocation.errorData = jsonData.JsonData;
								commandInvocation.errorData.failedOperation = jsonData.failedOperation;
								commandService.collectParameters(commandInvocation,sshSlideoutCloseCallback);
							}
						);
					} else {
						commandInvocation.errorData = jsonData.JsonData;
						commandInvocation.errorData.failedOperation = jsonData.failedOperation;
						commandService.collectParameters(commandInvocation,sshSlideoutCloseCallback);
					}
				};
				
				if (commandInvocation.parameters && commandInvocation.parameters.optionsRequested){
					commandInvocation.parameters = null;
					commandInvocation.optionsRequested = true;
					commandService.collectParameters(commandInvocation,sshSlideoutCloseCallback);
					return;
				}
				var gitService = serviceRegistry.getService("orion.git.provider"); //$NON-NLS-0$
				var progress = serviceRegistry.getService("orion.page.progress"); //$NON-NLS-0$
				
				if(commandInvocation.errorData && commandInvocation.errorData.failedOperation){
					progress.removeOperation(commandInvocation.errorData.failedOperation);
				}
				
				var handlePush = function(options, location, ref, name, force){
					var progressService = serviceRegistry.getService("orion.page.message"); //$NON-NLS-0$
					var deferred = progress.progress(gitService.doPush(location, ref, tags, force, //$NON-NLS-0$
							options.gitSshUsername, options.gitSshPassword, options.knownHosts,
							options.gitPrivateKey, options.gitPassphrase), messages['Pushing remote: '] + name);
					progressService.createProgressMonitor(deferred, messages['Pushing remote: '] + name);
					deferred.then(
						function(jsonData){
							handleGitServiceResponse(jsonData, serviceRegistry, 
								function() {
									if (itemTargetBranch && !itemTargetBranch.Id) {
										gitService.getGitBranch(itemTargetBranch.Location).then(function(remote) {
											objects.mixin(itemTargetBranch, remote);
											d.resolve();
										}, d.resolve);
									} else {
										d.resolve();
									}
								}, function (jsonData) {
									handleResponse(jsonData, commandInvocation);
								}
							);
						}, function(jsonData) {
							handleGitServiceResponse(jsonData, serviceRegistry, 
								function() {
									d.resolve();
								}, function (jsonData) {
									handleResponse(jsonData, commandInvocation);
								}
							);
						}
					);
				};

				progress.progress(gitService.getGitClone(item.CloneLocation), "Getting git repository details " + item.Name).then(
					function(clone){
						var repository = clone.Children[0];
						gatherSshCredentials(serviceRegistry, commandInvocation,null,sshCredentialsDialogCallback).then(
							function(options) {
								if(itemTargetBranch){
									handlePush(options, itemTargetBranch.Location, "HEAD", itemTargetBranch.Name, force); //$NON-NLS-0$
									return;
								}
								var choosingRemote = function() {
									chooseRemote(repository, item).then(function(target) {
										commandInvocation.targetBranch = target;
										commandInvocation.items.RemoteLocation = target.parent;
										handlePush(options, target.Location, "HEAD",target.Name, force); //$NON-NLS-0$
									}, function() {
										remotePrompterDialogCallback();
									});
								};
								if (item.RemoteLocation.length === 1 && item.RemoteLocation[0].Children && item.RemoteLocation[0].Children.length === 1) { //when we push next time - chance to switch saved remote
									var targetBranch = item.RemoteLocation[0].Children[0];
									var destination = item.Name;
									if (gerrit) {
										var branchLocation = item.RemoteLocation[0].Children[0].Location;
										var arr = branchLocation.split("/"); //$NON-NLS-0$
										destination = "refs/for/master"; //$NON-NLS-0$ // for now we hardcode it 
										arr[4] = encodeURIComponent(encodeURIComponent(destination));
										var remoteLocation = arr.join("/"); //$NON-NLS-0$
										targetBranch.Location = remoteLocation;
										targetBranch.Name = destination;
									}

									var dialog = new mConfirmPush.ConfirmPushDialog({
										title: messages["Choose Branch"],
										serviceRegistry: serviceRegistry,
										gitClient: gitService,
										moreCallback: function() {
											choosingRemote();
										},
										location: targetBranch.Name,
										func: function(){
											commandInvocation.targetBranch = targetBranch;
											handlePush(options, targetBranch.Location, "HEAD", destination, force); //$NON-NLS-0$
										},
										closeCallback : confirmDialogCallback
									});
									dialog.show();
								} else {
									choosingRemote();
								}
								
							}
						);
					}
				);
			} 
			command(data);
			return d;
		};
		return {
			perform:perform,
			chooseRemote: chooseRemote
		};
	};
});