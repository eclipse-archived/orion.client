/******************************************************************************* 
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define console */

/** @namespace The global container for eclipse APIs. */

define(['dojo', 'orion/auth'], function(dojo, mAuth) {

var eclipse = eclipse || {};

eclipse.GitService = (function() {
	/**
	 * Creates a new Git service.
	 * @class Provides operations for browsing and manipulating Git repositories.
	 * @name orion.git.GitService
	 */
	function GitService(serviceRegistry) {
		if (serviceRegistry) {
			this._serviceRegistry = serviceRegistry;
			this._serviceRegistration = serviceRegistry.registerService(
					"orion.git.provider", this);
			var self = this;
			serviceRegistry.getService("orion.net.ssh").then(function(sshService){
				self._sshService = sshService;
			});
		}
	}

	GitService.prototype = /** @lends eclipse.GitService.prototype */
	{
		checkGitService : function() {
			var service = this;
		},
		cloneGitRepository : function(gitName, gitRepoUrl, targetPath, repoLocation, gitSshUsername, gitSshPassword, gitSshKnownHost, privateKey, passphrase) {
			var postData = {};
			if(gitName){
				postData.Name = gitName;
			}
			if(targetPath){
				postData.Path = targetPath;
			}
			if(gitRepoUrl){
				postData.GitUrl=gitRepoUrl;
			}
			postData.Location = repoLocation;
			if(gitSshUsername){
				postData.GitSshUsername = gitSshUsername;
			}
			if(gitSshPassword){
				postData.GitSshPassword = gitSshPassword;
			}
			if(gitSshKnownHost){
				postData.GitSshKnownHost = gitSshKnownHost;
			}
			if(privateKey) postData.GitSshPrivateKey=privateKey;
			if(passphrase) postData.GitSshPassphrase=passphrase;			
			
				return dojo.xhrPost({
					url : "/gitapi/clone/",
					headers : {
						"Orion-Version" : "1"
					},
					postData : dojo.toJson(postData),
					handleAs : "json",
					timeout : 15000,
					load : function(jsonData, secondArg) {
						return jsonData;
					},
					error : function(error, ioArgs) {
						mAuth.handleGetAuthenticationError(this, ioArgs);
						console.error("HTTP status code: ", ioArgs.xhr.status);
						return error;
					}
				});
			
		},
		
		initGitRepository : function(targetLocation){
			console.error("Not implemented yet");
		},
		
		removeGitRepository : function(repositoryLocation){
			return dojo.xhrDelete({
				url : repositoryLocation,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, secondArg) {
					return jsonData;
				},
				error : function(error, ioArgs) {
					mAuth.handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
					return error;
				}
			});
		},
		
		getDiffContent: function(diffURI , onLoad , onError){
			var service = this;
			dojo.xhrGet({
				url: diffURI , 
				headers: {
					"Orion-Version": "1"
				},
				content: { "parts": "diff" },
				handleAs: "text",
				timeout: 15000,
				load: function(jsonData, secondArg) {
					if (onLoad) {
						if (typeof onLoad === "function")
							onLoad(jsonData, secondArg);
						else
							service._serviceRegistration.dispatchEvent(onLoad,
									jsonData);
					}
				},
				error: function(response, ioArgs) {
					if(onError)
						onError(response,ioArgs);
					mAuth.handleGetAuthenticationError(this, ioArgs);
					return response;
				}
			});
		},
		
		getDiffFileURI: function(diffURI , onLoad , onError){
			dojo.xhrGet({
				url: diffURI , 
				headers: {
					"Orion-Version": "1"
				},
				content: { "parts": "uris" },
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, secondArg) {
					if (onLoad) {
						if (typeof onLoad === "function")
							onLoad(jsonData, secondArg);
						else
							service._serviceRegistration.dispatchEvent(onLoad,
									jsonData);
					}
				},
				error: function(response, ioArgs) {
					if(onError)
						onError(response,ioArgs);
					mAuth.handleGetAuthenticationError(this, ioArgs);
					return response;
				}
			});
		},
		
		getGitStatus: function(url , onLoad , onError){
			dojo.xhrGet({
				url: url , 
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, secondArg) {
					if (onLoad) {
						if (typeof onLoad === "function")
							onLoad(jsonData, secondArg);
						else
							service._serviceRegistration.dispatchEvent(onLoad,
									jsonData);
					}
				},
				error: function(response, ioArgs) {
					if(onError)
						onError(response,ioArgs);
					mAuth.handleGetAuthenticationError(this, ioArgs);
					return response;
				}
			});
		},
		
		stage: function(location , onLoad , onError){
			return dojo.xhrPut({
				url: location , 
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, secondArg) {
					if (onLoad) {
						if (typeof onLoad === "function")
							onLoad(jsonData, secondArg);
						else
							service._serviceRegistration.dispatchEvent(onLoad,
									jsonData);
					}
				},
				error: function(response, ioArgs) {
					if(onError)
						onError(response,ioArgs);
					mAuth.handleGetAuthenticationError(this, ioArgs);
					return response;
				}
			});
		},
		
		unstageAll: function(location , resetParam ,onLoad , onError){
			return dojo.xhrPost({
				url: location , 
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				postData: dojo.toJson({"Reset":resetParam} ),
				load: function(jsonData, secondArg) {
					if (onLoad) {
						if (typeof onLoad === "function")
							onLoad(jsonData, secondArg);
						else
							service._serviceRegistration.dispatchEvent(onLoad,
									jsonData);
					}
				},
				error: function(response, ioArgs) {
					if(onError)
						onError(response,ioArgs);
					mAuth.handleGetAuthenticationError(this, ioArgs);
					return response;
				}
			});
		},
		
		unstage: function(location , paths ,onLoad , onError){
			return dojo.xhrPost({
				url: location , 
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				postData: dojo.toJson({"Path" : paths} ),
				load: function(jsonData, secondArg) {
					if (onLoad) {
						if (typeof onLoad === "function")
							onLoad(jsonData, secondArg);
						else
							service._serviceRegistration.dispatchEvent(onLoad,
									jsonData);
					}
				},
				error: function(response, ioArgs) {
					if(onError)
						onError(response,ioArgs);
					mAuth.handleGetAuthenticationError(this, ioArgs);
					return response;
				}
			});
		},
		
		checkoutPath: function(gitCloneURI, paths , onLoad , onError){
			return dojo.xhrPut({
				url : gitCloneURI,
				headers : {
					"Orion-Version" : "1"
				},
				putData : dojo.toJson({
					"Path" : paths
				}),
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, secondArg) {
					if (onLoad) {
						if (typeof onLoad === "function")
							onLoad(jsonData, secondArg);
						else
							service._serviceRegistration.dispatchEvent(onLoad,
									jsonData);
					}
				},
				error: function(response, ioArgs) {
					if(onError)
						onError(response,ioArgs);
					handleGetAuthenticationError(this, ioArgs);
					return response;
				}
			});
		},
		
		commitAll: function(location , message , body ,  onLoad , onError){
			dojo.xhrPost({
				url: location , 
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				postData: body,
				load: function(jsonData, secondArg) {
					if (onLoad) {
						if (typeof onLoad === "function")
							onLoad(jsonData, secondArg);
						else
							service._serviceRegistration.dispatchEvent(onLoad,
									jsonData);
					}
				},
				error: function(response, ioArgs) {
					if(onError)
						onError(response,ioArgs);
					mAuth.handleGetAuthenticationError(this, ioArgs);
					return response;
				}
			});
		},
		
		getGitClone : function(gitCloneURI, onLoad) {
			var service = this;
			
			return dojo.xhrGet({
				url : gitCloneURI,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, secondArg) {
					if (onLoad) {
						if (typeof onLoad === "function")
							onLoad(jsonData, secondArg);
						else
							service._serviceRegistration.dispatchEvent(onLoad,
									jsonData);
					}
				},
				error : function(error, ioArgs) {
					mAuth.handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
				}
			});
		},
		getGitCloneConfig : function(gitCloneConfigURI) {
			var service = this;
			return dojo.xhrGet({
				url : gitCloneConfigURI,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, secondArg) {
					return jsonData;
				},
				error : function(error, ioArgs) {
					mAuth.handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
				}
			});
		},
		getGitBranch : function(gitBranchURI) {
			var service = this;
			return dojo.xhrGet({
				url : gitBranchURI,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, secondArg) {
					return jsonData;
				},
				error : function(error, ioArgs) {
					mAuth.handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
				}
			});
		},
		getGitRemote : function(gitRemoteURI) {
			var service = this;
			return dojo.xhrGet({
				url : gitRemoteURI,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, secondArg) {
					return jsonData;
				},
				error : function(error, ioArgs) {
					mAuth.handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
				}
			});
		},
		checkoutBranch : function(gitCloneURI, branchName) {
			var service = this;
			return dojo.xhrPut({
				url : gitCloneURI,
				headers : {
					"Orion-Version" : "1"
				},
				putData : dojo.toJson({
					"Branch" : branchName
				}),
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, secondArg) {
					return jsonData;
				},
				error : function(error, ioArgs) {
					mAuth.handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
					return error;
				}
			});
		},
		resetIndex : function(gitIndexURI, refId) {
			var service = this;
			return dojo.xhrPost({
				url : gitIndexURI,
				headers : {
					"Orion-Version" : "1"
				},
				postData : dojo.toJson({
					"Commit" : refId,
					"Reset" : "HARD"
				}),
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, secondArg) {
					return jsonData;
				},
				error : function(error, ioArgs) {
					mAuth.handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
				}
			});
		},
		addBranch : function(gitBranchParentURI, branchName, startPoint) {
			var service = this;
			
			var postData = {};
			if (branchName) postData.Name = branchName;
			if (startPoint) postData.Branch = startPoint;
			
			return dojo.xhrPost({
				url : gitBranchParentURI,
				headers : {
					"Orion-Version" : "1"
				},
				postData : dojo.toJson(postData),
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, secondArg) {
					return jsonData;
				},
				error : function(error, ioArgs) {
					mAuth.handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
					return error;
				}
			});
		},
		removeBranch : function(gitBranchURI) {
			var service = this;
			return dojo.xhrDelete({
				url : gitBranchURI,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, secondArg) {
					return jsonData;
				},
				error : function(error, ioArgs) {
					mAuth.handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
					return error;
				}
			});
		},
		addRemote : function(gitRemoteParentURI, remoteName, remoteURI) {
			var service = this;
			return dojo.xhrPost({
				url : gitRemoteParentURI,
				headers : {
					"Orion-Version" : "1"
				},
				putData : dojo.toJson({
					"Remote" : remoteName,
					"RemoteURI" : remoteURI
				}),
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, secondArg) {
					return jsonData;
				},
				error : function(error, ioArgs) {
					mAuth.handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
					return error;
				}
			});
		},
		removeRemote : function(gitRemoteURI) {
			var service = this;
			return dojo.xhrDelete({
				url : gitRemoteURI,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, secondArg) {
					return jsonData;
				},
				error : function(error, ioArgs) {
					mAuth.handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
					return error;
				}
			});
		},
		doGitLog : function(gitLogURI, onLoad) {
			var service = this;
						
			return dojo.xhrGet({
				url : gitLogURI,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, secondArg) {
					if (onLoad) {
						if (typeof onLoad === "function")
							onLoad(jsonData.Children, secondArg);
						else
							service._serviceRegistration.dispatchEvent(onLoad,
									jsonData.Children);
					}
					
					return jsonData.Children;
				},
				error : function(error, ioArgs) {
					mAuth.handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
				}
			});
		},
		getDiff : function(gitDiffURI, commitName, onLoad) {
			var service = this;
			
			dojo.xhrPost({
				url : gitDiffURI,
				headers : {
					"Orion-Version" : "1"
				},
				postData : dojo.toJson({
					"New" : commitName
				}),
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, secondArg) {
					if (onLoad) {
						if (typeof onLoad === "function")
							onLoad(jsonData, secondArg, secondArg);
						else
							service._serviceRegistration.dispatchEvent(onLoad,
									jsonData);
					}
				},
				error : function(error, ioArgs) {
					mAuth.handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
				}
			});
		},
		doFetch : function(gitRemoteBranchURI, force, onLoad, gitSshUsername, gitSshPassword, gitSshKnownHost, gitPrivateKey, gitPassphrase) {
			var service = this;
			
			return dojo.xhrPost({
				url : gitRemoteBranchURI,
				headers : {
					"Orion-Version" : "1"
				},
				postData : dojo.toJson({
					"Fetch" : "true",
					"Force" : force,
					"GitSshUsername" : gitSshUsername,
					"GitSshPassword" : gitSshPassword,
					"GitSshKnownHost" : gitSshKnownHost,
					"GitSshPrivateKey" : gitPrivateKey,
					"GitSshPassphrase" : gitPassphrase
				}),
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, secondArg) {
					if (onLoad) {
						if (typeof onLoad === "function")
							onLoad(jsonData, secondArg, secondArg);
						else
							service._serviceRegistration.dispatchEvent(onLoad,
									jsonData);
					}
				},
				error : function(error, ioArgs) {
					mAuth.handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
				}
			});
		},
		doMerge : function(gitHeadURI, commitName) {
			var service = this;
			
			return dojo.xhrPost({
				url : gitHeadURI,
				headers : {
					"Orion-Version" : "1"
				},
				postData : dojo.toJson({
					"Merge" : commitName
				}),
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, secondArg) {
					return {jsonData: jsonData, secondArg: secondArg};
				},
				error : function(error, ioArgs) {
					mAuth.handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
					return {error: error, ioArgs: ioArgs};
				}
			});
		},
		doRebase : function(gitHeadURI, commitName, operation, onLoad, onError) {
			var service = this;
			var postData = {};
			postData.Rebase = commitName;
			if (operation) postData.Operation = operation;
			
			return dojo.xhrPost({
				url : gitHeadURI,
				headers : {
					"Orion-Version" : "1"
				},
				postData : dojo.toJson(postData),
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, secondArg) {
					if (onLoad) {
						if (typeof onLoad === "function")
							onLoad(jsonData, secondArg);
						else
							service._serviceRegistration.dispatchEvent(onLoad,
									jsonData);
					}
					return {jsonData: jsonData, secondArg: secondArg};
				},
				error : function(error, ioArgs) {
					if(onError)
						onError(error, ioArgs);
					mAuth.handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
					return {error: error, ioArgs: ioArgs};
				}
			});
		},
		doPush : function(gitBranchURI, srcRef, force, onLoad, gitSshUsername, gitSshPassword, gitSshKnownHost, gitPrivateKey, gitPassphrase) {
			var service = this;
			
			return dojo.xhrPost({
				url : gitBranchURI,
				headers : {
					"Orion-Version" : "1"
				},
				postData : dojo.toJson({
					"PushSrcRef" : srcRef,
					"PushTags" : true,
					"Force" : force,
					"GitSshUsername" : gitSshUsername,
					"GitSshPassword" : gitSshPassword,
					"GitSshKnownHost" : gitSshKnownHost,
					"GitSshPrivateKey" : gitPrivateKey,
					"GitSshPassphrase" : gitPassphrase
				}),
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, secondArg) {
					if (onLoad) {
						if (typeof onLoad === "function")
							onLoad(jsonData, secondArg, secondArg);
						else
							service._serviceRegistration.dispatchEvent(onLoad,
									jsonData);
					}
				},
				error : function(error, ioArgs) {
					mAuth.handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
					return error;
				}
			});
		},
		getLog : function(gitCommitURI, commitName, onLoad) {
			var service = this;
			
			return dojo.xhrPost({
				url : gitCommitURI,
				headers : {
					"Orion-Version" : "1"
				},
				postData : dojo.toJson({
					"New" : commitName
				}),
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, secondArg) {
					return secondArg.xhr.getResponseHeader("Location");
				},
				error : function(error, ioArgs) {
					mAuth.handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
				}
			}).then(function(scopedGitCommitURI){
				dojo.xhrGet({
					url : scopedGitCommitURI,
					headers : {
						"Orion-Version" : "1"
					},
					handleAs : "json",
					timeout : 5000,
					load : function(jsonData, secondArg) {
						if (onLoad) {
							if (typeof onLoad === "function")
								onLoad(jsonData.Children, secondArg);
							else
								service._serviceRegistration.dispatchEvent(onLoad,
										jsonData.Children);
						}
						return jsonData.Children;
					},
					error : function(error, ioArgs) {
						mAuth.handleGetAuthenticationError(this, ioArgs);
						console.error("HTTP status code: ", ioArgs.xhr.status);
					}
				});
			});	
		},
		getDefaultRemoteBranch : function(gitRemoteURI, onLoad) {
			var service = this;
			
			dojo.xhrGet({
				url : gitRemoteURI,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, secondArg) {
					return jsonData;
				},
				error : function(error, ioArgs) {
					mAuth.handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
				}
			}).then(function(remoteJsonData){
				if (remoteJsonData.Children[0] == null)
					return null;
				
				dojo.xhrGet({
					url : remoteJsonData.Children[0].Location,
					headers : {
						"Orion-Version" : "1"
					},
					handleAs : "json",
					timeout : 5000,
					load : function(jsonData, secondArg) {
						if (onLoad) {
							if (typeof onLoad === "function")
								onLoad(jsonData.Children[0], secondArg);
							else
								service._serviceRegistration.dispatchEvent(onLoad,
										jsonData.Children[0]);
						}
						return jsonData;
					},
					error : function(error, ioArgs) {
						mAuth.handleGetAuthenticationError(this, ioArgs);
						console.error("HTTP status code: ", ioArgs.xhr.status);
					}
				});
			});	
		},
		doAddTag : function(gitCommitURI, tagName, onLoad) {
			var service = this;
			
			return dojo.xhrPut({
				url : gitCommitURI,
				headers : {
					"Orion-Version" : "1"
				},
				putData : dojo.toJson({
					"Name" : tagName
				}),
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, secondArg) {
					if (onLoad) {
						if (typeof onLoad === "function")
							onLoad(jsonData, secondArg, secondArg);
						else
							service._serviceRegistration.dispatchEvent(onLoad,
									jsonData);
					}
				},
				error : function(error, ioArgs) {
					mAuth.handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
				}
			});
		},
		addCloneConfigurationProperty: function(location, newKey, newValue, onLoad , onError){
			return dojo.xhrPost({
				url: location , 
				headers: {
					"Orion-Version": "1"
				},
				postData : dojo.toJson({
					"Key" : newKey,
					"Value" : newValue
				}),
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, secondArg) {
					if (onLoad) {
						if (typeof onLoad === "function")
							onLoad(jsonData, secondArg);
						else
							service._serviceRegistration.dispatchEvent(onLoad,
									jsonData);
					}
				},
				error: function(response, ioArgs) {
					if(onError)
						onError(response,ioArgs);
					mAuth.handleGetAuthenticationError(this, ioArgs);
					return response;
				}
			});
		},
	
		editCloneConfigurationProperty: function(location, newValue, onLoad , onError){
			return dojo.xhrPut({
				url: location , 
				headers: {
					"Orion-Version": "1"
				},
				putData : dojo.toJson({
					"Value" : newValue
				}),
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, secondArg) {
					if (onLoad) {
						if (typeof onLoad === "function")
							onLoad(jsonData, secondArg);
						else
							service._serviceRegistration.dispatchEvent(onLoad,
									jsonData);
					}
				},
				error: function(response, ioArgs) {
					if(onError)
						onError(response,ioArgs);
					mAuth.handleGetAuthenticationError(this, ioArgs);
					return response;
				}
			});
		},
	
		deleteCloneConfigurationProperty: function(location, onLoad , onError){
			return dojo.xhrDelete({
				url: location , 
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, secondArg) {
					if (onLoad) {
						if (typeof onLoad === "function")
							onLoad(jsonData, secondArg);
						else
							service._serviceRegistration.dispatchEvent(onLoad,
									jsonData);
					}
				},
				error: function(response, ioArgs) {
					if(onError)
						onError(response,ioArgs);
					mAuth.handleGetAuthenticationError(this, ioArgs);
					return response;
				}
			});
		}
	};
	
	return GitService;
}());

return eclipse;
});
