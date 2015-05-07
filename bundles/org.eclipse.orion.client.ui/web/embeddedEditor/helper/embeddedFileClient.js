/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*eslint-env browser, amd*/
define(["orion/Deferred"], function(Deferred){
	
	var reameFile = {
		Directory: false,
		Length: 1159,
		LocaltimeStamp: 1389974936424,
		Location: "readme",
		Name: "foo.js"
	};
	
	var reameFileMeta = {
		Directory: false,
		Length: 1159,
		LocaltimeStamp: 1389974936424,
		Location: "readme",
		Name: "foo.js",
		Parents: []
	};
	
	var readmeContents = 'var foo = "bar";\n' +
						 "var bar = foo;\n" + 
						 "/*\n" + 
						 " * test demo\n" + 
						 "*/\n" + 
						 "function test(){\n" + 
						 "	var foo1 = bar.lastIndexOf(char, from);\n" + 
						 "}\n" + 
						"//Keep editting in this demo and try the content assit, probem validations and hover service!\n" +
						 "var foo2 = foo."; 
	
	var emptyRoot = {
		Children: [reameFile],
		ChildrenLocation: "children",
		Directory: true,
		Length: 0,
		LocaltimeStamp: 1389974936424,
		Location: "root",
		Name: ""
	};
	
	function FileClient() {
	}
	
	FileClient.prototype =  {
		/**
		 * Returns the name of the file service managing this location
		 * @param location The location of the item 
		 */
		fileServiceName: function(location) {
			return "Empty";
		},
		 
		/**
		 * Returns the root url of the file service managing this location
		 * @param location The location of the item 
		 */
		fileServiceRootURL: function(location) {
			return "";
		},
		 
		/**
		 * Obtains the children of a remote resource
		 * @param location The location of the item to obtain children for
		 * @return A deferred that will provide the array of child objects when complete
		 */
		fetchChildren: function(location) {
			return new Deferred().resolve([reameFile]);
		},

		/**
		 * Loads all the user's workspaces. Returns a deferred that will provide the loaded
		 * workspaces when ready.
		 */
		loadWorkspaces: function() {
			return new Deferred().resolve(emptyRoot);
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
			return new Deferred().resolve(readmeContents);
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
			if(isMetadata){
				return new Deferred().resolve(reameFileMeta);
			}
			return new Deferred().resolve(readmeContents);
		},
		
		/**
		 * Loads the workspace with the given id and sets it to be the current
		 * workspace for the IDE. The workspace is created if none already exists.
		 * @param {String} location the location of the workspace to load
		 * @param {Function} onLoad the function to invoke when the workspace is loaded
		 */
		loadWorkspace: function(location) {
			return new Deferred().resolve(emptyRoot);
		}
	};//end FileClient prototype
	FileClient.prototype.constructor = FileClient;

	//return the module exports
	return {EmbeddedFileClient: FileClient};
});
