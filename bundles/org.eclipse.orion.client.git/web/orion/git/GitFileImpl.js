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
define(["orion/xhr","orion/encoding-shim", "orion/URL-shim"], function(xhr) {
	
	function GitFileImpl() {
	}

	GitFileImpl.prototype = {
		fetchChildren: function(location) {
			var fetchLocation = location;
			if (fetchLocation===this.fileBase) {
				return this.loadWorkspace(fetchLocation).then(function(jsondata) {return jsondata.Children || [];});
			}
			//If fetch location does not have ?depth=, then we need to add the depth parameter. Otherwise server will not return any children
			if (fetchLocation.indexOf("?depth=") === -1) { //$NON-NLS-0$
				fetchLocation += "?depth=1"; //$NON-NLS-0$
			}
			// console.log("get children");
			return xhr("GET", fetchLocation,{
				headers: {
					"Orion-Version": "1",
					"Content-Type": "charset=UTF-8"
				},
				timeout: 15000
			}).then(function(result) {
				var jsonData = result.response ? JSON.parse(result.response) : {};
				return jsonData.Children || [];
			});
		},
		loadWorkspaces: function() {
			return this.loadWorkspace(this._repoURL);
		},
		loadWorkspace: function(location) {
			var _this = this;
			var url = new URL(location);
			return this.fetchChildren(location).then(function(children) {
				var result = {
					Attributes: {
						Archive: false,
						Hidden: false,
						ReadOnly: true,
						SymLink: false
					},
					Location: location,
					Name: null,
					Length: 0,
					LocalTimeStamp: 0,
					Directory: true,
					ChildrenLocation: location,
					Children: children
				};
				result.Parents = [];
				result.Name = "/";
				return result;
			})
		},
		createProject: function(url, projectName, serverPath, create) {
			throw "Not supported";
		},
		createFolder: function(parentLocation, folderName) {
			throw "Not supported";
		},
		createFile: function(parentLocation, fileName) {
			throw "Not supported";
		},
		deleteFile: function(location) {
			throw "Not supported";
		},
		moveFile: function(sourceLocation, targetLocation, name) {
			throw "Not supported";
		},
		copyFile: function(sourceLocation, targetLocation, name) {
			throw "Not supported";
		},
		read: function(location, isMetadata) {
			var url = new URL(location, window.location);
			if (isMetadata) {
				url.query.set("parts", "meta");
			}
			return xhr("GET", url.href, {
				timeout: 15000,
				headers: { "Orion-Version": "1" },
				log: false
			}).then(function(result) {
				if (isMetadata) {
					return result.response ? JSON.parse(result.response) : null;
				} else {
					return result.response;
				}
			});
		},
		write: function(location, contents, args) {
			throw "Not supported";
		},
		remoteImport: function(targetLocation, options) {
			throw "Not supported";
		},
		remoteExport: function(sourceLocation, options) {
			throw "Not supported";
		},
		readBlob: function(location) {
			return xhr("GET", location, {
				responseType: "arraybuffer",
				timeout: 15000
			}).then(function(result) {
				return result.response;
			});
		},
		writeBlob: function(location, contents, args) {
			throw "Not supported";
		}
	};
	GitFileImpl.prototype.constructor = GitFileImpl;

	return GitFileImpl;
});