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

/*global define console */

/** @namespace The global container for eclipse APIs. */

define(['require', 'dojo', 'orion/auth'], function(require, dojo, mAuth) {

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
			this._sshService = serviceRegistry.getService("orion.net.ssh");
		}
	}

	GitService.prototype = /** @lends eclipse.GitService.prototype */
	{
		checkGitService : function() {
			var service = this;
		},
		cloneGitRepository : function(gitName, gitRepoUrl, targetPath, repoLocation, gitSshUsername, gitSshPassword, gitSshKnownHost, privateKey, passphrase) {
			var service = this;
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
			
			//NOTE: require.toURL needs special logic here to handle "gitapi/clone"
			var gitapiCloneUrl = require.toUrl("gitapi/clone/._");
			gitapiCloneUrl = gitapiCloneUrl.substring(0,gitapiCloneUrl.length-2);
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
				url : gitapiCloneUrl,
				headers : {
					"Orion-Version" : "1"
				},
				postData : dojo.toJson(postData),
				handleAs : "json",
				timeout : 15000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, gitRepoUrl ? "Cloning repository: " + gitRepoUrl : "Initializing repository: " + gitName);
				},
				error : function(error, ioArgs) {
					return dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		removeGitRepository : function(repositoryLocation){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrDelete({
				url : repositoryLocation,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Removing repository");
				},
				error : function(error, ioArgs) {
					return dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		getDiffContent: function(diffURI , onLoad , onError){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrGet({
				url: diffURI , 
				headers: {
					"Orion-Version": "1"
				},
				content: { "parts": "diff" },
				handleAs: "text",
				timeout: 15000,
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Getting git diff", onLoad, onError);
				},
				error: function(error, ioArgs) {
					return dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, onLoad, onError, dojo.xhrGet);
				}
			});
			return clientDeferred;
		},
		getDiffFileURI: function(diffURI , onLoad , onError){
			var clientDeferred = new dojo.Deferred();
			dojo.xhrGet({
				url: diffURI , 
				headers: {
					"Orion-Version": "1"
				},
				content: { "parts": "uris" },
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Getting git diff", onLoad, onError);
				},
				error: function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, onLoad, onError, dojo.xhrGet);
				}
			});
			return clientDeferred;
		},
		getGitStatus: function(url , onLoad , onError){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrGet({
				url: url , 
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Getting git status", onLoad, onError);
				},
				error: function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, onLoad, onError, dojo.xhrGet);
				}
			});
			return clientDeferred;
		},
		stage: function(location , onLoad , onError){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPut({
				url: location , 
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Staging", onLoad, onError);
				},
				error: function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, onLoad, onError);
				}
			});
			return clientDeferred;
		},
		stageMultipleFiles: function(gitCloneURI, paths , onLoad , onError){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPut({
				url: gitCloneURI , 
				headers: {
					"Orion-Version": "1"
				},
				putData : dojo.toJson({
					"Path" : paths
				}),
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Staging", onLoad, onError);
				},
				error: function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, onLoad, onError);
				}
			});
			return clientDeferred;
		},
		unstageAll: function(location , resetParam ,onLoad , onError){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
				url: location , 
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				postData: dojo.toJson({"Reset":resetParam} ),
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Unstaging", onLoad, onError);
				},
				error: function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, onLoad, onError);
				}
			});
			return clientDeferred;
		},
		unstage: function(location , paths ,onLoad , onError){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
				url: location , 
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				postData: dojo.toJson({"Path" : paths} ),
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Unstaging", onLoad, onError);
				},
				error: function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, onLoad, onError);
				}
			});
			return clientDeferred;
		},
		checkoutPath: function(gitCloneURI, paths , onLoad , onError){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPut({
				url : gitCloneURI,
				headers : {
					"Orion-Version" : "1"
				},
				putData : dojo.toJson({
					"Path" : paths,
					"RemoveUntracked" : "true"
				}),
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Checking out", onLoad, onError);
				},
				error: function(error, ioArgs) {
					return dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, onLoad, onError);
				}
			});
			return clientDeferred;
		},
		commitAll: function(location , message , body ,  onLoad , onError){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
				url: location , 
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				postData: body,
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Committing", onLoad, onError);
				},
				error: function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, onLoad, onError);
				}
			});
			return clientDeferred;
		},
		getGitClone : function(gitCloneURI, onLoad, onError) {
			var service = this;
			var clientDefferred = new dojo.Deferred();
			dojo.xhrGet({
				url : gitCloneURI,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDefferred, jsonData, xhrArgs, "Getting git repository information", onLoad);
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDefferred, this, error, ioArgs, onLoad, onError, dojo.xhrGet);
				}
			});
			return clientDefferred;
		},
		getGitCloneConfig : function(gitCloneConfigURI) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrGet({
				url : gitCloneConfigURI,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Getting git repository configuration");
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, null, null, dojo.xhrGet);
				}
			});
			return clientDeferred;
		},
		getGitBranch : function(gitBranchURI) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrGet({
				url : gitBranchURI,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Getting branch information");
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, null, null, dojo.xhrGet);
				}
			});
			return clientDeferred;
		},
		getGitRemote : function(gitRemoteURI) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrGet({
				url : gitRemoteURI,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Getting remote branch information");
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, null, null, dojo.xhrGet);
				}
			});
			return clientDeferred;
		},
		checkoutBranch : function(gitCloneURI, branchName) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPut({
				url : gitCloneURI,
				headers : {
					"Orion-Version" : "1"
				},
				putData : dojo.toJson({
					"Branch" : branchName
				}),
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, branchName ? "Checking out branch " + branchName: "Checking out branch");
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		resetIndex : function(gitIndexURI, refId) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
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
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Resetting index");
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		addBranch : function(gitBranchParentURI, branchName, startPoint) {
			var service = this;
			
			var postData = {};
			if (branchName) postData.Name = branchName;
			if (startPoint) postData.Branch = startPoint;
			
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
				url : gitBranchParentURI,
				headers : {
					"Orion-Version" : "1"
				},
				postData : dojo.toJson(postData),
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, branchName ? "Adding branch " + branchName: "Adding branch");
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		removeBranch : function(gitBranchURI) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrDelete({
				url : gitBranchURI,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Removing branch");
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		addRemote : function(gitRemoteParentURI, remoteName, remoteURI) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
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
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, remoteName ? "Adding remote " + remoteName : "Adding remote");
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		removeRemote : function(gitRemoteURI) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrDelete({
				url : gitRemoteURI,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Removing remote");
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		doGitLog : function(gitLogURI, onLoad, onError) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrGet({
				url : gitLogURI,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Getting git log", onLoad);
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, onLoad, onError, dojo.xhrGet);
				}
			});
			return clientDeferred;
		},
		getDiff : function(gitDiffURI, commitName, onLoad, onError) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
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
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, commitName ? "Getting git diff for " + commitName: "Getting git diff", onLoad);
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, onLoad, onError, dojo.xhrPost);
				}
			});
			return clientDeferred;
		},
		doFetch : function(gitRemoteBranchURI, force, onLoad, gitSshUsername, gitSshPassword, gitSshKnownHost, gitPrivateKey, gitPassphrase) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
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
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Fetching remote: " + gitRemoteBranchURI, onLoad);
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		doPull : function(gitCloneURI, force, onLoad, gitSshUsername, gitSshPassword, gitSshKnownHost, gitPrivateKey, gitPassphrase) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
				url : gitCloneURI,
				headers : {
					"Orion-Version" : "1"
				},
				postData : dojo.toJson({
					"Pull" : "true",
					"Force" : force,
					"GitSshUsername" : gitSshUsername,
					"GitSshPassword" : gitSshPassword,
					"GitSshKnownHost" : gitSshKnownHost,
					"GitSshPrivateKey" : gitPrivateKey,
					"GitSshPassphrase" : gitPassphrase
				}),
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Pulling : " + gitCloneURI, onLoad);
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		doMerge : function(gitHeadURI, commitName) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
				url : gitHeadURI,
				headers : {
					"Orion-Version" : "1"
				},
				postData : dojo.toJson({
					"Merge" : commitName
				}),
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					var mergeResult = new dojo.Deferred(); 
					dojo.hitch(service, service._getGitServiceResponse)(mergeResult, jsonData, xhrArgs, "Merging " + gitHeadURI);
					mergeResult.then(function(jsonData){
						clientDeferred.callback({jsonData: jsonData});
					});
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		doCherryPick : function(gitHeadURI, commitName, onLoad, onError) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
				url : gitHeadURI,
				headers : {
					"Orion-Version" : "1"
				},
				postData : dojo.toJson({
					"Cherry-Pick" : commitName
				}),
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Cherry pick of " + commitName, onLoad, onError);
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, onLoad, onError);
				}
			});
			return clientDeferred;
		},
		doRebase : function(gitHeadURI, commitName, operation, onLoad, onError) {
			var service = this;
			var postData = {};
			postData.Rebase = commitName;
			if (operation) postData.Operation = operation;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
				url : gitHeadURI,
				headers : {
					"Orion-Version" : "1"
				},
				postData : dojo.toJson(postData),
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, commitName ? "Rebase on top of " : "Rebase" + commitName, onLoad, onError);
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, onLoad, onError);
				}
			});
			return clientDeferred;
		},
		doPush : function(gitBranchURI, srcRef, tags, force, onLoad, message, gitSshUsername, gitSshPassword, gitSshKnownHost, gitPrivateKey, gitPassphrase) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
				url : gitBranchURI,
				headers : {
					"Orion-Version" : "1"
				},
				postData : dojo.toJson({
					"PushSrcRef" : srcRef,
					"PushTags" : tags,
					"Force" : force,
					"GitSshUsername" : gitSshUsername,
					"GitSshPassword" : gitSshPassword,
					"GitSshKnownHost" : gitSshKnownHost,
					"GitSshPrivateKey" : gitPrivateKey,
					"GitSshPassphrase" : gitPassphrase
				}),
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, message ? message : "Pushing repository");
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		getLog : function(gitCommitURI, commitName, message, onLoad, onError) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			var clientDeferred1 = new dojo.Deferred();
			dojo.xhrPost({
				url : gitCommitURI,
				headers : {
					"Orion-Version" : "1"
				},
				postData : dojo.toJson({
					"New" : commitName
				}),
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					clientDeferred1.callback(xhrArgs.xhr.getResponseHeader("Location")); //TODO bug 367344
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred1, this, error, ioArgs, onLoad, onError, dojo.xhrPost);
				}
			});
			clientDeferred1.then(function(scopedGitCommitURI){
				dojo.xhrGet({
					url : scopedGitCommitURI,
					headers : {
						"Orion-Version" : "1"
					},
					handleAs : "json",
					timeout : 5000,
					load : function(jsonData, xhrArgs) {
						dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, message ? message : "Generating git log", onLoad);
					},
					error : function(error, ioArgs) {
						dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, onLoad, onError, dojo.xhrGet);
					}
				});
			});	
			return clientDeferred;
		},
		getDefaultRemoteBranch : function(gitRemoteURI, onLoad, onError) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			var clientDeferred1 = new dojo.Deferred();
			dojo.xhrGet({
				url : gitRemoteURI,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred1, jsonData, xhrArgs, "Getting remote branches");
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred1, this, error, ioArgs, onLoad, onError, dojo.xhrGet);
				}
			});
			clientDeferred1.then(function(remoteJsonData){
				if (remoteJsonData.Children[0] == null)
					return null;
				
				dojo.xhrGet({
					url : remoteJsonData.Children[0].Location,
					headers : {
						"Orion-Version" : "1"
					},
					handleAs : "json",
					timeout : 5000,
					load : function(jsonData, xhrArgs) {
						dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Getting default remote branch", onLoad);
					},
					error : function(error, ioArgs) {
						dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, onLoad, onError, dojo.xhrGet);
					}
				});
			});	
			return clientDeferred;
		},
		doAddTag : function(gitCommitURI, tagName, onLoad, onError) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPut({
				url : gitCommitURI,
				headers : { "Orion-Version" : "1" },
				putData : dojo.toJson({ "Name" : tagName }),
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Adding tag ..." + tagName, onLoad);
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, onLoad, onError);
				}
			});
			return clientDeferred;
		},
		doRemoveTag : function(gitTagURI) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrDelete({
				url : gitTagURI,
				headers : { "Orion-Version" : "1" },
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
				dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Removing tag ...");
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		checkoutTag : function(gitCloneURI, tag, branchName, onLoad, onError){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPut({
				url : gitCloneURI,
				headers : {
					"Orion-Version" : "1"
				},
				putData : dojo.toJson({
					"Tag" : tag,
					"Branch" : branchName
				}),
				handleAs : "json",
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Checking out tag " + tag, onLoad, onError);
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, onLoad, onError);
				}
			});
			return clientDeferred;
		},
		addCloneConfigurationProperty: function(location, newKey, newValue, onLoad , onError){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
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
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Adding configuration property " + newKey, onLoad, onError);
				},
				error: function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, onLoad, onError);
				}
			});
			return clientDeferred;
		},
		editCloneConfigurationProperty: function(location, newValue, onLoad , onError){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPut({
				url: location , 
				headers: {
					"Orion-Version": "1"
				},
				putData : dojo.toJson({
					"Value" : newValue
				}),
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Saving configuration property as " + newValue, onLoad, onError);
				},
				error: function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, onLoad, onError);
				}
			});
			return clientDeferred;
		},
		deleteCloneConfigurationProperty: function(location, onLoad , onError){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrDelete({
				url: location , 
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs, "Deleting configuration property", onLoad, onError);
				},
				error: function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, onLoad, onError);
				}
			});
			return clientDeferred;
		},
		_getGitServiceResponse: function(clientDeferred, jsonData, xhrArgs, message, onLoad){
			var service = this;
			
			if(xhrArgs && xhrArgs.xhr.status === 202){
				var deferred = new dojo.Deferred();
				deferred.callback(jsonData);
				return this._serviceRegistry.getService("orion.page.progress").showWhile(deferred, message).then(function(progressResp) {
					var returnData = progressResp.Result.Severity == "Ok" ? progressResp.Result.JsonData : progressResp.Result;
					if (onLoad) {
						if (typeof onLoad === "function")
							onLoad(returnData);
						else
							service._serviceRegistration.dispatchEvent(onLoad,
									returnData);
					}
					clientDeferred.callback(returnData);
					return;
				});
			}
			
			if (onLoad) {
				if (typeof onLoad === "function")
					onLoad(jsonData, xhrArgs);
				else
					service._serviceRegistration.dispatchEvent(onLoad,
							jsonData);
			}
			clientDeferred.callback(jsonData);
			return;
		},
		
		_handleGitServiceResponseError: function(deferred, currentXHR, error, ioArgs, onLoad, onError, retryFunc){
			if(!deferred)
				deferred = new dojo.Deferred();
			if (error.status === 401 || error.status === 403) {
				if(mAuth.handleAuthenticationError(ioArgs.xhr, function(){
						if(!retryFunc){
							deferred.errback(error);
							return;
						}
						retryFunc(currentXHR).then(
								function(result, ioArgs) {
									deferred.callback(result, ioArgs);
								},
								function(error, ioArgs) {
									if(onError)
										onError(error,ioArgs);
									deferred.errback(error, ioArgs);
								});						
					})==null)
						return deferred;
				else{
					deferred.errback(error);
					return deferred;
				}
			}
			if(onError)
				onError(error,ioArgs);
			
			deferred.errback(error);
			return deferred;
		}
	};
	return GitService;
}());

return eclipse;
});
