/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global dojo window eclipse:true handleGetAuthenticationError handlePostAuthenticationError
  handleDeleteAuthenticationError */
/*jslint forin:true devel:true*/

/** @namespace The global container for eclipse APIs. */
var eclipse = eclipse || {};

eclipse.FileService = (function() {
	/**
	 * @class Provides operations on files, folders, and projects.
	 * @name eclipse.FileService
	 */
	function FileService(serviceRegistry) {
		if (serviceRegistry)
			this._serviceRegistration = serviceRegistry.registerService("IFileService", this);
	}
	
	FileService.prototype = /**@lends eclipse.FileService.prototype */
	{
		/**
		 * Obtains the children of a remote resource
		 * @param location The location of the item to obtain children for
		 * @return A deferred that will provide the array of child objects when complete
		 */
		fetchChildren: function(location) {
			// console.log("get children");
			return dojo.xhrGet({
				url: location,
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, ioArgs) {
					return jsonData.Children || [];
				},
				error: function(response, ioArgs) {
					console.error("HTTP status code: ", ioArgs.xhr.status);
					handleGetAuthenticationError(this, ioArgs);
					return response;
				}
			});
		},

		/**
		 * Creates a new workspace with the given name. The resulting workspace is
		 * passed as a parameter to the provided onCreate function.
		 * @param {String} name The name of the new workspace
		 */
		createWorkspace: function(name) {
			//return the deferred so client can chain on post-processing
			return dojo.xhrPost({
				url: "/workspace",
				headers: {
					"Orion-Version": "1",
					"Slug": name
				},
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, ioArgs) {
					return jsonData.Workspaces;
				},
				error: function(response, ioArgs) {
					console.error("HTTP status code: ", ioArgs.xhr.status);
					handlePostAuthenticationError(this, ioArgs);
					return response;
				}
			});
		},

		/**
		 * Loads all the user's workspaces. Returns a deferred that will provide the loaded
		 * workspaces when ready.
		 */
		loadWorkspaces: function() {
			return dojo.xhrGet({
				url: "/workspace",
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				load: dojo.hitch(this, function(jsonData, ioArgs) {
					return jsonData.Workspaces;
				}),
				error: function(response, ioArgs) {
					console.error("HTTP status code: ", ioArgs.xhr.status);
					handleGetAuthenticationError(this, ioArgs);
					// TODO need a better error handling
					onLoad(response);
					return response;
				}
			});
		},
		
		/**
		 * Loads the workspace with the given id and sets it to be the current
		 * workspace for the IDE. The workspace is created if none already exists.
		 * @param {String} location the location of the workspace to load
		 * @param {Function} onLoad the function to invoke when the workspace is loaded
		 */
		loadWorkspace: function(location) {
			// console.log("loadWorkspace");
			var deferred = dojo.xhrGet({
				url: location ? location : "/workspace",
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				load: dojo.hitch(this, function(jsonData) {
					//in most cases the returned object is the workspace we care about
					if (location) {
						return jsonData;
					} else {
						//user didn't specify a workspace so we are at the root
						//just pick the first location in the provided list
						if (jsonData.Workspaces.length > 0) {
							return this.loadWorkspace(jsonData.Workspaces[0].Location);
						} else {
							//no workspace exists, and the user didn't specify one. We'll create one for them
							return this.createWorkspace("MyWorkspace");
						}
					}
				}),
				error: function(response, ioArgs) {
					handleGetAuthenticationError(this, ioArgs);
					// TODO need a better error handling
					return response;
				}
			});
			return deferred;
		},
		/**
		 * Adds a project to a workspace.
		 * @param {String} url The workspace location
		 * @param {String} projectName the human-readable name of the project
		 * @param {String} serverPath The optional path of the project on the server.
		 * @param {Boolean} create If true, the project is created on the server file system if it doesn't already exist
		 */
		createProject: function(url, projectName, serverPath, create) {
			if (!url) { // null, undefined, '' ...
				// window.document.eas.status.setErrorMessage("<enter message here>");
				console.error("url is undefined, make sure you're signed in before creating a project");
				return;
			}
			var data = {
				Name: projectName
			};
			if (serverPath) {
				data.ContentLocation = serverPath;
			}
			if (create) {
				data.CreateIfDoesntExist = create;
			}
			return dojo.xhrPost({
				url: url,
				headers: {
					"Orion-Version": "1",
					"Content-Type": "application/json"
				},
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, ioArgs) {
					return jsonData;
				},
				error: function(response, ioArgs) {
					console.error("HTTP status code: ", ioArgs.xhr.status);
					handlePostAuthenticationError(this, ioArgs);
					return response;
				},
				postData: dojo.toJson(data)
			});
		},
		/**
		 * Removes a project from a workspace. Note that project contents are not deleted.
		 * @param {String} workspaceLocation The workspace URL
		 * @param {String} projectLocation The location of the project to be removed
		 * @return A deferred that can be used to chain events after the deletion completes
		 */
		removeProject: function(workspaceLocation, projectLocation) {
			return dojo.xhrPost({
				url: workspaceLocation,
				headers: {
					"Orion-Version": "1",
					"Content-Type": "application/json"
				},
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, ioArgs) {
					return jsonData;
				},
				error: function(response, ioArgs) {
					console.error("HTTP status code: ", ioArgs.xhr.status);
					handlePostAuthenticationError(this, ioArgs);
					return response;
				},
				postData: dojo.toJson({ProjectURL: projectLocation, Remove: true})
			});
		},
		/**
		 * Creates a folder.
		 * @param {String} parentLocation The location of the parent folder
		 * @param {String} folderName The name of the folder to create
		 * @return {Object} JSON representation of the created folder
		 */
		createFolder: function(parentLocation, folderName) {
			return dojo.xhrPost({
				url: parentLocation,
				headers: {
					"Orion-Version": "1",
					"Slug": folderName,
					"Content-Type": "application/json"
				},
				postData: dojo.toJson({
					"Name": folderName,
					"LocalTimeStamp": "0",
					"Directory": "true"
				}),
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, ioArgs) {
					return jsonData;
				},
				error: function(response, ioArgs) {
					console.error("HTTP status code: ", ioArgs.xhr.status);
					handlePostAuthenticationError(this, ioArgs);
					return response;
				}
			});
		},
		/**
		 * Create a new file in a specified location. Returns a deferred that will provide
		 * The new file object when ready.
		 * @param {String} parentLocation The location of the parent folder
		 * @param {String} fileName The name of the file to create
		 * @return {Object} A deferred that will provide the new file object
		 */
		createFile: function(parentLocation, fileName) {
			return dojo.xhrPost({
				url: parentLocation,
				headers: {
					"Orion-Version": "1",
					"Slug": fileName,
					"Content-Type": "application/json"
				},
				postData: dojo.toJson({
					"Name": fileName,
					"LocalTimeStamp": "0",
					"Directory": "false"
				}),
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, ioArgs) {
					return jsonData;
				},
				error: function(response, ioArgs) {
					console.error("HTTP status code: ", ioArgs.xhr.status);
					handlePostAuthenticationError(this, ioArgs);
					return response;
				}
			});
		},
		/**
		 * Deletes a file or directory.
		 * @param {String} location The location of the file or directory to delete.
		 */
		deleteFile: function(location) {
			return dojo.xhrDelete({
				url: location,
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, ioArgs) {
					return jsonData;
				},
				error: function(response, ioArgs) {
					console.error("HTTP status code: ", ioArgs.xhr.status);
					handleDeleteAuthenticationError(this, ioArgs);
					return response;
				}
			});
		}
	};
	return FileService;
}());