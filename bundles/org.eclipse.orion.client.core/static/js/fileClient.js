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
		this._serviceRegistry = serviceRegistry;
		this._serviceRegistration = serviceRegistry.registerService("IFileService", this);
	}
	FileService.prototype = /**@lends eclipse.FileService.prototype */
	{
		/**
		 * Obtains the children of a remote resource
		 * @param location The location of the item to obtain children for
		 * @param {Function(Array)} A function that will be provided with an array of children
		 */
		fetchChildren: function(location, updateFunction) {
			// console.log("get children");
			dojo.xhrGet({
				url: location,
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, ioArgs) {
					updateFunction(jsonData.Children);
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
		 * @param {Function} onCreate The function to invoke after the workspace is created
		 */
		createWorkspace: function(name, onCreate) {
			dojo.xhrPost({
				url: "/workspace",
				headers: {
					"Orion-Version": "1",
					"Slug": name
				},
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, ioArgs) {
					onCreate(jsonData);
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
		 * Loads all the user's workspaces.
		 * @param {Function} onLoad the function to invoke with the loaded workspaces
		 */
		loadWorkspaces: function(onLoad) {
			dojo.xhrGet({
				url: "/workspace",
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				load: dojo.hitch(this, function(jsonData, ioArgs) {
					onLoad(jsonData.Workspaces);
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
		loadWorkspace: function(location, onLoad) {
			// console.log("loadWorkspace");
			dojo.xhrGet({
				url: location ? location : "/workspace",
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				load: dojo.hitch(this, function(jsonData, ioArgs) {
					//in most cases the returned object is the workspace we care about
					if (location) {
						onLoad(jsonData);
					} else {
						//user didn't specify a workspace so we are at the root
						//just pick the first location in the provided list
						if (jsonData.Workspaces.length > 0) {
							this.loadWorkspace(jsonData.Workspaces[0].Location, onLoad);
						} else {
							//no workspace exists, and the user didn't specify one. We'll create one for them
							this.createWorkspace("MyWorkspace", onLoad);
						}
					}
					return jsonData;
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
		createProject: function(url, projectName, serverPath, create, callback) {
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
			dojo.xhrPost({
				url: url,
				headers: {
					"Orion-Version": "1",
					"Content-Type": "application/json"
				},
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, ioArgs) {
					callback();
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
		removeProject: function(workspace, project, callback) {
			var data = {
				ProjectURL: project.Location
			};
			data.Remove = true;
			dojo.xhrPost({
				url: workspace.Location,
				headers: {
					"Orion-Version": "1",
					"Content-Type": "application/json"
				},
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, ioArgs) {
					callback();
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
		 * @param folderName
		 * @param item
		 * @param {Function(Object)} updateFunction
		 */
		createFolder: function(folderName, item, updateFunction) {
			dojo.xhrPost({
				url: (item.Location),
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
					updateFunction(item);
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
		 * 
		 * @param fileName
		 * @param item
		 * @param {Function(Object)} updateFunction
		 */
		createFile: function(fileName, item, updateFunction) {
			dojo.xhrPost({
				url: (item.Location),
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
					updateFunction(item);
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
		 * 
		 * @param item
		 * @param function(Object) updateFunction
		 */
		deleteFile: function(item, updateFunction) {
			dojo.xhrDelete({
				url: (item.Location),
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, ioArgs) {
					if (item.parent) {
						updateFunction(item.parent);
					} else {
						updateFunction(item);
					}
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