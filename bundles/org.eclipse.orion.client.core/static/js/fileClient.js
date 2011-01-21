/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others All rights reserved. This
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
	function FileService() {
	}
	FileService.prototype = /**@lends eclipse.FileService.prototype */{
		/**
		 * @param parentItem
		 * @param {Function(Object, Array} updateFunction First param is parentItem, second is children
		 */
		getChildren: function(parentItem, updateFunction) {
			dojo.xhrGet({
					url: parentItem.ChildrenLocation,
					headers: {
						"Orion-Version" : "1"
					},
					handleAs: "json",
					timeout: 15000,
					load: function(jsonData, ioArgs) {
						var fileChildren = jsonData.Children;
						parentItem.children = [];
						for (var e in fileChildren) {
							var child = fileChildren[e];
							child.parent=parentItem;
							parentItem.children.push(child);
						}
						// not ideal, but for now, sort here so it's done in one place.
						// this should really be something pluggable that the UI defines
						parentItem.children = parentItem.children.sort(function(a, b) {
							var isDir1 = a.Directory;
							var isDir2 = b.Directory;
							if (isDir1 !== isDir2) {
								return isDir1 ? -1 : 1;
							}
							var n1 = a.Name && a.Name.toLowerCase();
							var n2 = b.Name && b.Name.toLowerCase();
							if (n1 < n2) { return -1; }
							if (n1 > n2) { return 1; }
							return 0;
						}); 
						updateFunction(parentItem, parentItem.children);
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
		 *@param {Function} onCreate The function to invoke after the workspace is created
		 */	
		createWorkspace: function(name, onCreate) {
			dojo.xhrPost({
				url: "/workspace",
				headers: {
					"Orion-Version" : "1",
					"Slug" : name
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
		 * Loads the workspace with the given id and sets it to be the current
		 * workspace for the IDE. The workspace is created if none already exists.
		 * @param {String} location the location of the workspace to load
		 * @param {Function} onLoad the function to invoke when the workspace is loaded
		 */
		loadWorkspace: function(location, onLoad) {
			dojo.xhrGet({
				url: location ? location : "/workspace",
				headers: {
					"Orion-Version" : "1"
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
			var data = {Name: projectName};
			if (serverPath) {
				data.ContentLocation = serverPath;
			}
			if(create){
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
			var data = {ProjectURL: project.Location};
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
				postData: dojo.toJson({"Name": folderName,
					"LocalTimeStamp" : "0",
					"Directory" : "true"}),
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
					postData: dojo.toJson({"Name" : fileName,
						"LocalTimeStamp" : "0",
						"Directory" : "false"}),
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
