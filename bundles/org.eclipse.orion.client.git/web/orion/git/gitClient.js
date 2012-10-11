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

/*global define console */

/** @namespace The global container for eclipse APIs. */

define(['require', 'dojo'], function(require, dojo) {

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
					"orion.git.provider", this); //$NON-NLS-0$
			this._sshService = serviceRegistry.getService("orion.net.ssh"); //$NON-NLS-0$
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
			var gitapiCloneUrl = require.toUrl("gitapi/clone/._"); //$NON-NLS-0$
			gitapiCloneUrl = gitapiCloneUrl.substring(0,gitapiCloneUrl.length-2);
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
				url : gitapiCloneUrl,
				headers : {
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				postData : dojo.toJson(postData),
				handleAs : "json", //$NON-NLS-0$
				timeout : 15000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
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
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				handleAs : "json", //$NON-NLS-0$
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error : function(error, ioArgs) {
					return dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		getDiffContent: function(diffURI){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrGet({
				url: diffURI , 
				headers: {
					"Orion-Version": "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				content: { "parts": "diff" }, //$NON-NLS-1$ //$NON-NLS-0$
				handleAs: "text", //$NON-NLS-0$
				timeout: 15000,
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error: function(error, ioArgs) {
					return dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, dojo.xhrGet);
				}
			});
			return clientDeferred;
		},
		getDiffFileURI: function(diffURI){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrGet({
				url: diffURI , 
				headers: {
					"Orion-Version": "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				content: { "parts": "uris" }, //$NON-NLS-1$ //$NON-NLS-0$
				handleAs: "json", //$NON-NLS-0$
				timeout: 15000,
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error: function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, dojo.xhrGet);
				}
			});
			return clientDeferred;
		},
		getGitStatus: function(url){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrGet({
				url: url , 
				headers: {
					"Orion-Version": "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				handleAs: "json", //$NON-NLS-0$
				timeout: 15000,
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error: function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, dojo.xhrGet);
				}
			});
			return clientDeferred;
		},
		stage: function(location){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPut({
				url: location , 
				headers: {
					"Orion-Version": "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				handleAs: "json", //$NON-NLS-0$
				timeout: 15000,
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error: function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		stageMultipleFiles: function(gitCloneURI, paths){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPut({
				url: gitCloneURI , 
				headers: {
					"Orion-Version": "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				putData : dojo.toJson({
					"Path" : paths //$NON-NLS-0$
				}),
				handleAs: "json", //$NON-NLS-0$
				timeout: 15000,
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error: function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		unstageAll: function(location , resetParam){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
				url: location , 
				headers: {
					"Orion-Version": "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				handleAs: "json", //$NON-NLS-0$
				timeout: 15000,
				postData: dojo.toJson({"Reset":resetParam} ), //$NON-NLS-0$
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error: function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		unstage: function(location , paths){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
				url: location , 
				headers: {
					"Orion-Version": "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				handleAs: "json", //$NON-NLS-0$
				timeout: 15000,
				postData: dojo.toJson({"Path" : paths} ), //$NON-NLS-0$
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error: function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		checkoutPath: function(gitCloneURI, paths){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPut({
				url : gitCloneURI,
				headers : {
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				putData : dojo.toJson({
					"Path" : paths, //$NON-NLS-0$
					"RemoveUntracked" : "true" //$NON-NLS-1$ //$NON-NLS-0$
				}),
				handleAs: "json", //$NON-NLS-0$
				timeout: 15000,
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error: function(error, ioArgs) {
					return dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		commitAll: function(location , message , body){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
				url: location , 
				headers: {
					"Orion-Version": "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				handleAs: "json", //$NON-NLS-0$
				timeout: 15000,
				postData: body,
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error: function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		getGitClone : function(gitCloneURI) {
			var service = this;
			var clientDefferred = new dojo.Deferred();
			dojo.xhrGet({
				url : gitCloneURI,
				headers : {
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				handleAs : "json", //$NON-NLS-0$
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDefferred, jsonData, xhrArgs);
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDefferred, this, error, ioArgs, dojo.xhrGet);
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
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				handleAs : "json", //$NON-NLS-0$
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, dojo.xhrGet);
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
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				handleAs : "json", //$NON-NLS-0$
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, dojo.xhrGet);
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
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				handleAs : "json", //$NON-NLS-0$
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, dojo.xhrGet);
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
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				putData : dojo.toJson({
					"Branch" : branchName //$NON-NLS-0$
				}),
				handleAs : "json", //$NON-NLS-0$
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
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
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				postData : dojo.toJson({
					"Commit" : refId, //$NON-NLS-0$
					"Reset" : "HARD" //$NON-NLS-1$ //$NON-NLS-0$
				}),
				handleAs : "json", //$NON-NLS-0$
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
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
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				postData : dojo.toJson(postData),
				handleAs : "json", //$NON-NLS-0$
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
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
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				handleAs : "json", //$NON-NLS-0$
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
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
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				putData : dojo.toJson({
					"Remote" : remoteName, //$NON-NLS-0$
					"RemoteURI" : remoteURI //$NON-NLS-0$
				}),
				handleAs : "json", //$NON-NLS-0$
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
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
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				handleAs : "json", //$NON-NLS-0$
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		doGitLog : function(gitLogURI) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrGet({
				url : gitLogURI,
				headers : {
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				handleAs : "json", //$NON-NLS-0$
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, dojo.xhrGet);
				}
			});
			return clientDeferred;
		},
		getDiff : function(gitDiffURI, commitName) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
				url : gitDiffURI,
				headers : {
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				postData : dojo.toJson({
					"New" : commitName //$NON-NLS-0$
				}),
				handleAs : "json", //$NON-NLS-0$
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					clientDeferred.callback(xhrArgs.xhr.getResponseHeader("Location")); //TODO bug 367344 //$NON-NLS-0$
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, dojo.xhrPost);
				}
			});
			return clientDeferred;
		},
		doFetch : function(gitRemoteBranchURI, force, gitSshUsername, gitSshPassword, gitSshKnownHost, gitPrivateKey, gitPassphrase) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
				url : gitRemoteBranchURI,
				headers : {
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				postData : dojo.toJson({
					"Fetch" : "true", //$NON-NLS-1$ //$NON-NLS-0$
					"Force" : force, //$NON-NLS-0$
					"GitSshUsername" : gitSshUsername, //$NON-NLS-0$
					"GitSshPassword" : gitSshPassword, //$NON-NLS-0$
					"GitSshKnownHost" : gitSshKnownHost, //$NON-NLS-0$
					"GitSshPrivateKey" : gitPrivateKey, //$NON-NLS-0$
					"GitSshPassphrase" : gitPassphrase //$NON-NLS-0$
				}),
				handleAs : "json", //$NON-NLS-0$
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		doPull : function(gitCloneURI, force, gitSshUsername, gitSshPassword, gitSshKnownHost, gitPrivateKey, gitPassphrase) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
				url : gitCloneURI,
				headers : {
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				postData : dojo.toJson({
					"Pull" : "true", //$NON-NLS-1$ //$NON-NLS-0$
					"Force" : force, //$NON-NLS-0$
					"GitSshUsername" : gitSshUsername, //$NON-NLS-0$
					"GitSshPassword" : gitSshPassword, //$NON-NLS-0$
					"GitSshKnownHost" : gitSshKnownHost, //$NON-NLS-0$
					"GitSshPrivateKey" : gitPrivateKey, //$NON-NLS-0$
					"GitSshPassphrase" : gitPassphrase //$NON-NLS-0$
				}),
				handleAs : "json", //$NON-NLS-0$
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		doMerge : function(gitHeadURI, commitName, squash) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
				url : gitHeadURI,
				headers : {
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				postData : dojo.toJson({
					"Merge" : commitName, //$NON-NLS-0$
					"Squash" : squash
				}),
				handleAs : "json", //$NON-NLS-0$
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					var mergeResult = new dojo.Deferred(); 
					dojo.hitch(service, service._getGitServiceResponse)(mergeResult, jsonData, xhrArgs);
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
		doCherryPick : function(gitHeadURI, commitName) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
				url : gitHeadURI,
				headers : {
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				postData : dojo.toJson({
					"Cherry-Pick" : commitName //$NON-NLS-0$
				}),
				handleAs : "json", //$NON-NLS-0$
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		doRebase : function(gitHeadURI, commitName, operation) {
			var service = this;
			var postData = {};
			postData.Rebase = commitName;
			if (operation) postData.Operation = operation;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
				url : gitHeadURI,
				headers : {
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				postData : dojo.toJson(postData),
				handleAs : "json", //$NON-NLS-0$
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		doPush : function(gitBranchURI, srcRef, tags, force, gitSshUsername, gitSshPassword, gitSshKnownHost, gitPrivateKey, gitPassphrase) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
				url : gitBranchURI,
				headers : {
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				postData : dojo.toJson({
					"PushSrcRef" : srcRef, //$NON-NLS-0$
					"PushTags" : tags, //$NON-NLS-0$
					"Force" : force, //$NON-NLS-0$
					"GitSshUsername" : gitSshUsername, //$NON-NLS-0$
					"GitSshPassword" : gitSshPassword, //$NON-NLS-0$
					"GitSshKnownHost" : gitSshKnownHost, //$NON-NLS-0$
					"GitSshPrivateKey" : gitPrivateKey, //$NON-NLS-0$
					"GitSshPassphrase" : gitPassphrase //$NON-NLS-0$
				}),
				handleAs : "json", //$NON-NLS-0$
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		getLog : function(gitCommitURI, commitName) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			var clientDeferred1 = new dojo.Deferred();
			dojo.xhrPost({
				url : gitCommitURI,
				headers : {
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				postData : dojo.toJson({
					"New" : commitName //$NON-NLS-0$
				}),
				handleAs : "json", //$NON-NLS-0$
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					clientDeferred1.callback(xhrArgs.xhr.getResponseHeader("Location")); //TODO bug 367344 //$NON-NLS-0$
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred1, this, error, ioArgs, dojo.xhrPost);
				}
			});
			clientDeferred1.then(function(scopedGitCommitURI){
				dojo.xhrGet({
					url : scopedGitCommitURI,
					headers : {
						"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
					},
					handleAs : "json", //$NON-NLS-0$
					timeout : 5000,
					load : function(jsonData, xhrArgs) {
						dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
					},
					error : function(error, ioArgs) {
						dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, dojo.xhrGet);
					}
				});
			});	
			return clientDeferred;
		},
		getDefaultRemoteBranch : function(gitRemoteURI) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			var clientDeferred1 = new dojo.Deferred();
			dojo.xhrGet({
				url : gitRemoteURI,
				headers : {
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				handleAs : "json", //$NON-NLS-0$
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred1, jsonData, xhrArgs);
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred1, this, error, ioArgs, dojo.xhrGet);
				}
			});
			clientDeferred1.then(function(remoteJsonData){
				if (remoteJsonData.Children[0] == null)
					return null;
				
				dojo.xhrGet({
					url : remoteJsonData.Children[0].Location,
					headers : {
						"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
					},
					handleAs : "json", //$NON-NLS-0$
					timeout : 5000,
					load : function(jsonData, xhrArgs) {
						dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
					},
					error : function(error, ioArgs) {
						dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs, dojo.xhrGet);
					}
				});
			});	
			return clientDeferred;
		},
		doAddTag : function(gitCommitURI, tagName) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPut({
				url : gitCommitURI,
				headers : { "Orion-Version" : "1" }, //$NON-NLS-1$ //$NON-NLS-0$
				putData : dojo.toJson({ "Name" : tagName }), //$NON-NLS-0$
				handleAs : "json", //$NON-NLS-0$
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		doRemoveTag : function(gitTagURI) {
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrDelete({
				url : gitTagURI,
				headers : { "Orion-Version" : "1" }, //$NON-NLS-1$ //$NON-NLS-0$
				handleAs : "json", //$NON-NLS-0$
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
				dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		checkoutTag : function(gitCloneURI, tag, branchName){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPut({
				url : gitCloneURI,
				headers : {
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				putData : dojo.toJson({
					"Tag" : tag, //$NON-NLS-0$
					"Branch" : branchName //$NON-NLS-0$
				}),
				handleAs : "json", //$NON-NLS-0$
				timeout : 5000,
				load : function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error : function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		addCloneConfigurationProperty: function(location, newKey, newValue){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
				url: location , 
				headers: {
					"Orion-Version": "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				postData : dojo.toJson({
					"Key" : newKey, //$NON-NLS-0$
					"Value" : newValue //$NON-NLS-0$
				}),
				handleAs: "json", //$NON-NLS-0$
				timeout: 15000,
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error: function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		editCloneConfigurationProperty: function(location, newValue){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPut({
				url: location , 
				headers: {
					"Orion-Version": "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				putData : dojo.toJson({
					"Value" : newValue //$NON-NLS-0$
				}),
				handleAs: "json", //$NON-NLS-0$
				timeout: 15000,
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error: function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		deleteCloneConfigurationProperty: function(location){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrDelete({
				url: location , 
				headers: {
					"Orion-Version": "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				handleAs: "json", //$NON-NLS-0$
				timeout: 15000,
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error: function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		sendCommitReviewRequest: function(commit, location, login, url, authorName, message){
			var service = this;
			var clientDeferred = new dojo.Deferred();
			dojo.xhrPost({
				url: location , 
				handleAs: "json", //$NON-NLS-0$
				timeout: 15000,
				postData : dojo.toJson({
					"ReviewReqCommit": commit,
					"ReviewReqUrl" : url, //$NON-NLS-0$
					"ReviewReqNotifyLogin" : login, //$NON-NLS-0$	
					"ReviewReqAuthorName" : authorName,
					"ReviewMessage" : message
				}),
				load: function(jsonData, xhrArgs) {
					dojo.hitch(service, service._getGitServiceResponse)(clientDeferred, jsonData, xhrArgs);
				},
				error: function(error, ioArgs) {
					dojo.hitch(service, service._handleGitServiceResponseError)(clientDeferred, this, error, ioArgs);
				}
			});
			return clientDeferred;
		},
		_getGitServiceResponse: function(clientDeferred, jsonData, xhrArgs){
			if(xhrArgs && xhrArgs.xhr.status === 202){
				var deferred = new dojo.Deferred();
				deferred.callback(jsonData);
				return this._serviceRegistry.getService("orion.page.progress").showWhile(deferred).then(function(progressResp) { //$NON-NLS-0$
					var returnData = progressResp.Result.Severity === "Ok" ? progressResp.Result.JsonData : progressResp.Result; //$NON-NLS-0$
					clientDeferred.callback(returnData);
					return;
				});
			}
			clientDeferred.callback(jsonData);
			return;
		},
		
		_handleGitServiceResponseError: function(deferred, currentXHR, error, ioArgs, retryFunc){
			if(!deferred) {
				deferred = new dojo.Deferred();
			}
			deferred.errback(error);
			return deferred;
		}
	};
	return GitService;
}());

return eclipse;
});
