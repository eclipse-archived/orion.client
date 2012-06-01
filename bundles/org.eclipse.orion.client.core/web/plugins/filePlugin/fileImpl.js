/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global window define XMLHttpRequest BlobBuilder*/
/*jslint forin:true devel:true*/


define(["orion/Deferred", "orion/xhr", "orion/es5shim"], function(Deferred, xhr) {
	/**
	 * An implementation of the file service that understands the Orion 
	 * server file API. This implementation is suitable for invocation by a remote plugin.
	 */
	 
	/**
	 * @class Provides operations on files, folders, and projects.
	 * @name FileServiceImpl
	 */
	function FileServiceImpl(fileBase, workspaceBase) {
		this.fileBase = fileBase;
		this.workspaceBase = workspaceBase;
	}
	
	FileServiceImpl.prototype = /**@lends eclipse.FileServiceImpl.prototype */
	{
		/**
		 * Obtains the children of a remote resource
		 * @param location The location of the item to obtain children for
		 * @return A deferred that will provide the array of child objects when complete
		 */
		fetchChildren: function(location) {
			if (location===this.fileBase) {
				return this.loadWorkspace(location).then(function(jsondata) {return jsondata.Children || [];});
			}
			// console.log("get children");
			return xhr("GET", location,{
				headers: {
					"Orion-Version": "1"
				},
				timeout: 15000
			}).then(function(result) {
				var jsonData = result.response ? JSON.parse(result.response) : {};
				return jsonData.Children || [];
			});
		},

		/**
		 * Creates a new workspace with the given name. The resulting workspace is
		 * passed as a parameter to the provided onCreate function.
		 * @param {String} name The name of the new workspace
		 */
		_createWorkspace: function(name) {
			//return the deferred so client can chain on post-processing
			return xhr("POST", this.workspaceBase, {
				headers: {
					"Orion-Version": "1",
					"Slug": name
				},
				timeout: 15000
			}).then(function(result) {
				var jsonData = result.response ? JSON.parse(result.response) : {};
				return jsonData.Workspaces;
			});
		},

		/**
		 * Loads all the user's workspaces. Returns a deferred that will provide the loaded
		 * workspaces when ready.
		 */
		loadWorkspaces: function() {
			return xhr("GET", this.workspaceBase, {
				headers: {
					"Orion-Version": "1"
				},
				timeout: 15000
			}).then(function(result) {
				var jsonData = result.response ? JSON.parse(result.response) : {};
				return jsonData.Workspaces;
			});
		},
		
		/**
		 * Loads the workspace with the given id and sets it to be the current
		 * workspace for the IDE. The workspace is created if none already exists.
		 * @param {String} location the location of the workspace to load
		 * @param {Function} onLoad the function to invoke when the workspace is loaded
		 */
		loadWorkspace: function(location) {
			if (location===this.fileBase) {
				location = null;
			}
			return xhr("GET", location ? location : this.workspaceBase, {
				headers: {
					"Orion-Version": "1"
				},
				timeout: 15000,
				log: false
			}).then(function(result) {
				var jsonData = result.response ? JSON.parse(result.response) : {};
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
						return this._createWorkspace("MyWorkspace");
					}
				}
			}.bind(this));
		},
		/**
		 * Adds a project to a workspace.
		 * @param {String} url The workspace location
		 * @param {String} projectName the human-readable name of the project
		 * @param {String} serverPath The optional path of the project on the server.
		 * @param {Boolean} create If true, the project is created on the server file system if it doesn't already exist
		 */
		createProject: function(location, projectName, serverPath, create) {
			if (!location) { // null, undefined, '' ...
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
			return xhr("POST", location, {
				headers: {
					"Orion-Version": "1",
					"Content-Type": "application/json"
				},
				timeout: 15000,
				data: JSON.stringify(data)
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		},
		/**
		 * Creates a folder.
		 * @param {String} parentLocation The location of the parent folder
		 * @param {String} folderName The name of the folder to create
		 * @return {Object} JSON representation of the created folder
		 */
		createFolder: function(parentLocation, folderName) {
			return xhr("POST", parentLocation, {
				headers: {
					"Orion-Version": "1",
					"X-Create-Options" : "no-overwrite",
					"Slug": folderName,
					"Content-Type": "application/json"
				},
				data: JSON.stringify({
					"Name": folderName,
					"LocalTimeStamp": "0",
					"Directory": "true"
				}),
				timeout: 15000
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
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
			return xhr("POST", parentLocation, {
				headers: {
					"Orion-Version": "1",
					"X-Create-Options" : "no-overwrite",
					"Slug": fileName,
					"Content-Type": "application/json"
				},
				postData: JSON.stringify({
					"Name": fileName,
					"LocalTimeStamp": "0",
					"Directory": "false"
				}),
				timeout: 15000
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		},
		/**
		 * Deletes a file, directory, or project.
		 * @param {String} location The location of the file or directory to delete.
		 */
		deleteFile: function(location) {
			return xhr("DELETE", location, {
				headers: {
					"Orion-Version": "1"
				},
				timeout: 15000
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		},
		
		/**
		 * Moves a file or directory.
		 * @param {String} sourceLocation The location of the file or directory to move.
		 * @param {String} targetLocation The location of the target folder.
		 * @param {String} [name] The name of the destination file or directory in the case of a rename
		 */
		moveFile: function(sourceLocation, targetLocation, name) {
			return this._doCopyMove(sourceLocation, targetLocation, true, name);
		},
		 
		/**
		 * Copies a file or directory.
		 * @param {String} sourceLocation The location of the file or directory to copy.
		 * @param {String} targetLocation The location of the target folder.
		 * @param {String} [name] The name of the destination file or directory in the case of a rename
		 */
		copyFile: function(sourceLocation, targetLocation, name) {
			return this._doCopyMove(sourceLocation, targetLocation, false, name);
		},
		
		_doCopyMove: function(sourceLocation, targetLocation, isMove, name) {
			if (!name) {
				//take the last segment (trailing slash will product an empty segment)
				var segments = sourceLocation.split("/");
				name = segments.pop() || segments.pop();
			}
			return xhr("POST", targetLocation, {
				headers: {
					"Orion-Version": "1",
					"Slug": name,
					"X-Create-Options": "no-overwrite," + (isMove ? "move" : "copy")
				},
				data: JSON.stringify({"Location": sourceLocation}),
				timeout: 15000
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		},
		/**
		 * Returns the contents or metadata of the file at the given location.
		 *
		 * @param {String} location The location of the file to get contents for
		 * @param {Boolean} [isMetadata] If defined and true, returns the file metadata, 
		 *   otherwise file contents are returned
		 * @return A deferred that will be provided with the contents or metadata when available
		 */
		read: function(location, isMetadata) {
			return xhr("GET", location, {
				timeout: 5000,
				headers: { "Orion-Version": "1" },
				log: false,
				query: isMetadata ? { "parts": "meta" } : {}
			}).then(function(result) {
				if (isMetadata) {
					return result.response ? JSON.parse(result.response) : null;
				} else {
					return result.response;
				}
			});
		},
		/**
		 * Writes the contents or metadata of the file at the given location.
		 *
		 * @param {String} location The location of the file to set contents for
		 * @param {String|Object} contents The content string, object describing the location of content, or a metadata object to write
		 * @param {String|Object} args Additional arguments used during write operation (i.e. ETag) 
		 * @return A deferred for chaining events after the write completes with new metadata object
		 */		
		write: function(location, contents, args) {
			var headerData = {
					"Orion-Version": "1",
					"Content-Type": "text/plain;charset=UTF-8"
				};
			if (args && args.ETag) {
				headerData["If-Match"] = args.ETag;
			}
			var options = {
				timeout: 5000,
				headers: headerData,
				data: contents,
				log: false
			};
						
			// check if we have raw contents or something else
			if (typeof contents !== "string") {
				// look for remote content
				if (contents.sourceLocation) {
					options.query = {source: contents.sourceLocation};
					options.data = null;
				} else {
					// assume we are putting metadata
					options.query = {parts: "meta"};
				}
			}
			return xhr("PUT", location, options).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		},
		/**
		 * Imports file and directory contents from another server
		 *
		 * @param {String} targetLocation The location of the folder to import into
		 * @param {Object} options An object specifying the import parameters
		 * @return A deferred for chaining events after the import completes
		 */		
		remoteImport: function(targetLocation, options) {
			var headerData = {
				"Orion-Version": "1"
			};
			if (options.OptionHeader) {
				headerData["X-Xfer-Options"] = options.OptionHeader;
			}
			return xhr("POST", targetLocation, {
				headers: headerData,
				data: JSON.stringify(options),
				timeout: 15000
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		},
		/**
		 * Exports file and directory contents to another server
		 *
		 * @param {String} sourceLocation The location of the folder to export from
		 * @param {Object} options An object specifying the export parameters
		 * @return A deferred for chaining events after the export completes
		 */		
		remoteExport: function(sourceLocation, options) {
			var headerData = {
				"Orion-Version": "1"
			};
			if (options.OptionHeader) {
				headerData["X-Xfer-Options"] = options.OptionHeader;
			}
			return xhr("POST", sourceLocation, {
				headers: headerData,
				data: JSON.stringify(options),
				timeout: 15000
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		},
		
		/**
		 * Performs a search with the given query.
		 * @param {String} query The search query
		 */
		search: function(location, query) {
			return xhr("GET", "/filesearch" + query, {
				headers: {
					"Accept": "application/json",
					"Orion-Version": "1"
				},
				timeout: 15000
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : {};
			});
		}
	};
	
	function _call2(method, url, headers, body) {
		var d = new Deferred(); // create a promise
		var xhr = new XMLHttpRequest();
		var header;
		try {
			xhr.open(method, url);
			if (headers !== null) {
				for (header in headers) {
					if (headers.hasOwnProperty(header)) {
						xhr.setRequestHeader(header, headers[header]);
					}
				}
			}
			xhr.responseType = "arraybuffer";
			xhr.send(body);
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4) {
					d.resolve({
						status: xhr.status,
						statusText: xhr.statusText,
						headers: xhr.getAllResponseHeaders(),
						response: xhr.response //builder.getBlob()
					});													
				}
			};
		} catch (e) {
			d.reject(e);
		}
		return d; // return the promise immediately
	}	
	
	window.BlobBuilder = window.MozBlobBuilder || window.WebKitBlobBuilder || window.BlobBuilder;
	if (window.BlobBuilder) {
		FileServiceImpl.prototype.readBlob = function(location) {
			return _call2("GET", location).then(function(response) {
				if (window.WebKitBlobBuilder) { // webkit works better with blobs, FF with ArrayBuffers
					var builder = new BlobBuilder();
					builder.append(response.response);
					return builder.getBlob();
				}
				return response.response;
			});	
		};
		
		FileServiceImpl.prototype.writeBlob = function(location, contents, args) {
			var headerData = {};
			if (args && args.ETag) {
				headerData["If-Match"] = args.ETag;
			}
			
			if (!contents.type) { // webkit works better with blobs, FF with ArrayBuffers
				var builder = new BlobBuilder();
				if (contents) {
					builder.append(contents);
				}
				contents = builder.getBlob();
			}
			return _call2("PUT", location, headerData, contents);
		};

	}
	
	return FileServiceImpl;
});