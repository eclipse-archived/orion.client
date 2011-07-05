/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global window define */
/*jslint forin:true devel:true*/

/** @namespace The global container for eclipse APIs. */

define(["dojo", "orion/auth"], function(dojo, mAuth){

	/**
	 * Creates a new file client.
	 * @class The file client provides a convenience API for interacting with a file service
	 * provided by a plugin. This class handles authorization, and authentication-related
	 * error handling.
	 * @name orion.fileClient.FileClient
	 */
	function FileClient(fileService) {
		this.fileService = fileService;
	}
	
	FileClient.prototype = /**@lends orion.fileClient.FileClient.prototype */ {
		/**
		 * Set the file service
		 * @param fileService the file service object
		 */
		setFileService: function(fileService) {
			this.fileService = fileService;
		},
		
		/**
		 * Obtains the children of a remote resource
		 * @param location The location of the item to obtain children for
		 * @return A deferred that will provide the array of child objects when complete
		 */
		fetchChildren: function(location) {
			return this._doServiceCall("fetchChildren", arguments);
		},

		/**
		 * Creates a new workspace with the given name. The resulting workspace is
		 * passed as a parameter to the provided onCreate function.
		 * @param {String} name The name of the new workspace
		 */
		createWorkspace: function(name) {
			return this._doServiceCall("createWorkspace", arguments);
		},

		/**
		 * Loads all the user's workspaces. Returns a deferred that will provide the loaded
		 * workspaces when ready.
		 */
		loadWorkspaces: function() {
			return this._doServiceCall("loadWorkspaces", arguments);
		},
		
		/**
		 * Loads the workspace with the given id and sets it to be the current
		 * workspace for the IDE. The workspace is created if none already exists.
		 * @param {String} location the location of the workspace to load
		 * @param {Function} onLoad the function to invoke when the workspace is loaded
		 */
		loadWorkspace: function(location) {
			return this._doServiceCall("loadWorkspace", arguments);
		},
		
		/**
		 * Adds a project to a workspace.
		 * @param {String} url The workspace location
		 * @param {String} projectName the human-readable name of the project
		 * @param {String} serverPath The optional path of the project on the server.
		 * @param {Boolean} create If true, the project is created on the server file system if it doesn't already exist
		 */
		createProject: function(url, projectName, serverPath, create) {
			return this._doServiceCall("createProject", arguments);
		},
		/**
		 * Creates a folder.
		 * @param {String} parentLocation The location of the parent folder
		 * @param {String} folderName The name of the folder to create
		 * @return {Object} JSON representation of the created folder
		 */
		createFolder: function(parentLocation, folderName) {
			return this._doServiceCall("createFolder", arguments);
		},
		/**
		 * Create a new file in a specified location. Returns a deferred that will provide
		 * The new file object when ready.
		 * @param {String} parentLocation The location of the parent folder
		 * @param {String} fileName The name of the file to create
		 * @return {Object} A deferred that will provide the new file object
		 */
		createFile: function(parentLocation, fileName) {
			return this._doServiceCall("createFile", arguments);
		},
		/**
		 * Deletes a file, directory, or project.
		 * @param {String} location The location of the file or directory to delete.
		 */
		deleteFile: function(location) {
			return this._doServiceCall("deleteFile", arguments);
		},
		
		/**
		 * Moves a file or directory.
		 * @param {String} sourceLocation The location of the file or directory to move.
		 * @param {String} targetLocation The location of the target folder.
		 * @param {String} [name] The name of the destination file or directory in the case of a rename
		 */
		moveFile: function(sourceLocation, targetLocation) {
			return this._doServiceCall("moveFile", arguments);
		},
		 
		/**
		 * Copies a file or directory.
		 * @param {String} sourceLocation The location of the file or directory to copy.
		 * @param {String} targetLocation The location of the target folder.
		 * @param {String} [name] The name of the destination file or directory in the case of a rename
		 */
		copyFile: function(sourceLocation, targetLocation) {
			return this._doServiceCall("copyFile", arguments);
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
			return this._doServiceCall("read", arguments);
		},

		/**
		 * Writes the contents or metadata of the file at the given location.
		 *
		 * @param {String} location The location of the file to set contents for
		 * @param {String|Object} contents The content string, or metadata object to write
		 * @param {String|Object} args Additional arguments used during write operation (i.e. ETag) 
		 * @return A deferred for chaining events after the write completes with new metadata object
		 */		
		write: function(location, contents, args) {
			return this._doServiceCall("write", arguments);
		},

		/**
		 * Imports file and directory contents from another server
		 *
		 * @param {String} targetLocation The location of the folder to import into
		 * @param {Object} options An object specifying the import parameters
		 * @return A deferred for chaining events after the import completes
		 */		
		remoteImport: function(targetLocation, options) {
			return this._doServiceCall("remoteImport", arguments);
		},

		/**
		 * Exports file and directory contents to another server
		 *
		 * @param {String} sourceLocation The location of the folder to export from
		 * @param {Object} options An object specifying the export parameters
		 * @return A deferred for chaining events after the export completes
		 */		
		remoteExport: function(sourceLocation, options) {
			return this._doServiceCall("remoteExport", arguments);
		},

		/**
		 * This helper method implements invocation of the service call,
		 * with retry on authentication error if needed.
		 * @private
		 */
		_doServiceCall: function(funcName, funcArgs) {
			var clientDeferred = new dojo.Deferred();
			var fileService = this.fileService;
			fileService[funcName].apply(fileService, funcArgs).then(
				//on success, just forward the result to the client
				function(result) {
					clientDeferred.callback(result);
				},
				//on failure we might need to retry
				function(error) {
					if (error.status === 401 || error.status === 403) {
						mAuth.handleAuthenticationError(error, function(message) {
							//try again
							fileService[funcName].apply(fileService, funcArgs).then(
								function(result) {
									clientDeferred.callback(result);
								},
								function(error) {
									clientDeferred.errback(error);
								}
							);
						});
					} else {
						//forward other errors to client
						clientDeferred.errback(error);
					}
				}
			);
			return clientDeferred;
		}
	};//end FileClient prototype
	FileClient.prototype.constructor = FileClient;

	//return the module exports
	return {FileClient: FileClient};
});

