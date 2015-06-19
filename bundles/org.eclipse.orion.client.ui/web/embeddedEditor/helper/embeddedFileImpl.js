/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*eslint-env browser, amd*/
/*global URL*/
define(["orion/Deferred", "orion/encoding-shim", "orion/URL-shim"], function(Deferred) {
	
	function EmbeddedFileImpl(fileBase) {
		this.fileBase = fileBase;
		this.fileRoot = {};
	}
	
	EmbeddedFileImpl.prototype = {
		fetchChildren: function(/*fLocation*/) {
			return new Deferred().resolve([]);
		},
		loadWorkspaces: function() {
			return new Deferred().resolve([]);
		},
		loadWorkspace: function(/*fLocation*/) {
			return new Deferred().resolve([]);
		},
		createProject: function(/*url, projectName, serverPath, create*/) {
			throw new Error("Not supported"); //$NON-NLS-0$ 
		},
		createFolder: function(/*parentLocation, folderName*/) {
			throw new Error("Not supported"); //$NON-NLS-0$ 
		},
		createFile: function(/*parentLocation, fileName*/) {
			throw new Error("Not supported"); //$NON-NLS-0$ 
		},
		moveFile: function(/*sourceLocation, targetLocation, name*/) {
			throw new Error("Not supported"); //$NON-NLS-0$ 
		},
		copyFile: function(/*sourceLocation, targetLocation, name*/) {
			throw new Error("Not supported"); //$NON-NLS-0$ 
		},
		remoteImport: function(/*targetLocation, options*/) {
			throw new Error("Not supported"); //$NON-NLS-0$ 
		},
		remoteExport: function(/*sourceLocation, options) {
			throw new Error("Not supported"); //$NON-NLS-0$ 
		},
		readBlob: function(/*fLocation*/) {
			throw new Error("Not supported"); //$NON-NLS-0$ 
		},
		writeBlob: function(/*fLocation, contents, args*/) {
			throw new Error("Not supported"); //$NON-NLS-0$ 
		},
		/**
		 * Returns the contents or metadata of the file at the given location.
		 *
		 * @param {String} location The location of the file to get contents for
		 * @param {Boolean} [isMetadata] If defined and true, returns the file metadata, 
		 *   otherwise file contents are returned
		 * @return A deferred that will be provided with the contents or metadata when available
		 */
		read: function(fLocation, isMetadata) {
			if(isMetadata){
				var locationURL = new URL(fLocation);
				var meta = {
					Directory: false,
					Length: 123,
					LocaltimeStamp: 123,
					Location: fLocation,
					Name: locationURL.pathname,
					Parents: []
				};
				return new Deferred().resolve(meta);
			}
			return new Deferred().resolve(this.fileRoot[fLocation]);
		},
		/**
		 * Writes the contents or metadata of the file at the given location.
		 *
		 * @param {String} location The location of the file to set contents for
		 * @param {String|Object} contents The content string, object describing the location of content, or a metadata object to write
		 * @param {String|Object} args Additional arguments used during write operation (i.e. ETag) 
		 * @return A deferred for chaining events after the write completes with new metadata object
		 */		
		write: function(fLocation, contents, args) {
			if (typeof contents === "string") {
				this.fileRoot[fLocation] = contents;
			}
			return new Deferred().resolve(contents);
		},
		/**
		 * Deletes a file, directory, or project.
		 * @param {String} location The location of the file or directory to delete.
		 */
		deleteFile: function(fLocation) {
			delete this.fileRoot[fLocation];
			return new Deferred().resolve([]);
		}
	};
	EmbeddedFileImpl.prototype.constructor = EmbeddedFileImpl;

	return EmbeddedFileImpl;
});