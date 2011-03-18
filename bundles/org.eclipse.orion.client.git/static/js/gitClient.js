/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/** @namespace The global container for eclipse APIs. */
var eclipse = eclipse || {};

eclipse.GitService = (function() {
	/**
	 * @class Provides operations on Git.
	 * @name eclipse.GitService
	 */
	function GitService(serviceRegistry) {
		if (serviceRegistry) {
			this._serviceRegistry = serviceRegistry;
			this._serviceRegistration = serviceRegistry.registerService(
					"IGitService", this);
		}
	}

	GitService.prototype = /** @lends eclipse.GitService.prototype */
	{
		checkGitService : function() {
			var service = this;
			console.info("Git Service checked");
		},
		cloneGitRepository : function(gitName, gitRepoUrl, gitSshUsername, gitSshPassword, gitSshKnownHost, onLoad) {
			var service = this;
			dojo.xhrPost({
				url : "/git/clone/",
				headers : {
					"Orion-Version" : "1"
				},
				postData : dojo.toJson({
					"Name" : gitName,
					"GitUrl" : gitRepoUrl,
					"GitSshUsername" : gitSshUsername,
					"GitSshPassword" : gitSshPassword,
					"GitSshKnownHost" : gitSshKnownHost
				}),
				handleAs : "json",
				timeout : 15000,
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
					handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
				}
			});
		},
		doGitDiff : function(gitDiffURI, onLoad) {
			var service = this;
			
			// the place for Libing's diff method
			console.info("doGitDiff called");
			
			dojo.xhrGet({
				url : gitDiffURI,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "text",
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
					handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
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
					handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
				}
			});
		},
		doGitLog : function(gitDiffURI, onLoad) {
			var service = this;
			
			console.info("doGitLog called");
			
			dojo.xhrGet({
				url : gitDiffURI,
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
					handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
				}
			});
		}
	};
	return GitService;
}());