/*******************************************************************************
 * @license
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*eslint-env browser, amd*/
/*global URL*/
define(["orion/xhr", "orion/Deferred", "orion/URL-shim",  "orion/form"], function(xhr, Deferred, _, form) {

	function CollabFileImpl(fileBase) {
		this.fileBase = fileBase;
	}
	
	var GIT_TIMEOUT = 60000;

	CollabFileImpl.prototype = {
		fetchChildren: function(location) {
			var fetchLocation = location;
			if (fetchLocation===this.fileBase) {
				return new Deferred().resolve([]);
			}
			//If fetch location does not have ?depth=, then we need to add the depth parameter. Otherwise server will not return any children
			if (fetchLocation.indexOf("?depth=") === -1) { //$NON-NLS-0$
				fetchLocation += "?depth=1"; //$NON-NLS-0$
			}
			return xhr("GET", fetchLocation,{ //$NON-NLS-0$
				headers: {
					"Orion-Version": "1", //$NON-NLS-0$  //$NON-NLS-1$
					"Content-Type": "charset=UTF-8" //$NON-NLS-0$  //$NON-NLS-1$
				},
				timeout: GIT_TIMEOUT
			}).then(function(result) {
				var jsonData = result.response ? JSON.parse(result.response) : {};
				return jsonData.Children || [];
			});
		},
		loadWorkspaces: function() {
			return this.loadWorkspace(this._repoURL);
		},
		loadWorkspace: function(location) {
			var suffix = "/sharedWorkspace/";
			if (location && location.indexOf(suffix, location.length - suffix.length) !== -1) {
				location += "tree/";
			}
			
			return xhr("GET", location,{ //$NON-NLS-0$
				headers: {
					"Orion-Version": "1", //$NON-NLS-0$  //$NON-NLS-1$
					"Content-Type": "charset=UTF-8" //$NON-NLS-0$  //$NON-NLS-1$
				},
				timeout: GIT_TIMEOUT
			}).then(function(result) {
				var jsonData = result.response ? JSON.parse(result.response) : {};
				return jsonData || {};
			});
		},
		createProject: function(url, projectName, serverPath, create) {
			throw new Error("Not supported"); //$NON-NLS-0$ 
		},
		createFolder: function(parentLocation, folderName) {
			return xhr("POST", parentLocation, {
				headers: {
					"Orion-Version": "1",
					"X-Create-Options" : "no-overwrite",
					"Slug": form.encodeSlug(folderName),
					"Content-Type": "application/json;charset=UTF-8"
				},
				data: JSON.stringify({
					"Name": folderName,
					"LocalTimeStamp": "0",
					"Directory": true
				}),
				timeout: 15000
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		},
		createFile: function(parentLocation, fileName) {
			return xhr("POST", parentLocation, {
				headers: {
					"Orion-Version": "1",
					"X-Create-Options" : "no-overwrite",
					"Slug": form.encodeSlug(fileName),
					"Content-Type": "application/json;charset=UTF-8"
				},
				data: JSON.stringify({
					"Name": fileName,
					"LocalTimeStamp": "0",
					"Directory": false
				}),
				timeout: 15000
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		},
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
		moveFile: function(sourceLocation, targetLocation, name) {
			return this._doCopyMove(sourceLocation, targetLocation, true, name).then(function(result) {
				return result;
			});
		},
		copyFile: function(sourceLocation, targetLocation, name) {
			return this._doCopyMove(sourceLocation, targetLocation, false, name).then(function(result) {
				return result;
			});
		},
		_doCopyMove: function(sourceLocation, targetLocation, isMove, _name) {
			if (!_name) {
				//take the last segment (trailing slash will product an empty segment)
				var segments = sourceLocation.split("/");
				_name = segments.pop() || segments.pop();
			}
			return xhr("POST", targetLocation, {
				headers: {
					"Orion-Version": "1",
					"Slug": form.encodeSlug(_name),
					"X-Create-Options": "no-overwrite," + (isMove ? "move" : "copy"),
					"Content-Type": "application/json;charset=UTF-8"
				},
				data: JSON.stringify({
					"Location": sourceLocation,
					"Name": _name
				}),
				timeout: 15000
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		},
		read: function(loc, isMetadata, acceptPatch, options) {
			if (typeof acceptPatch === 'object') {
				options = acceptPatch;
				acceptPatch = false;
			}
			var url = new URL(loc, self.location);
			if (isMetadata) {
				if (options && options.parts !== undefined) {
					url.query.set("parts", options.parts);
				} else {
					url.query.set("parts", "meta");
				}
			}
			if (options && options.startLine !== undefined) {
				url.query.set("start", options.startLine.toString());
			}
			if (options && options.pageSize !== undefined) {
				url.query.set("count", options.pageSize.toString());
			}
			var timeout = options && options.timeout ? options.timeout : 15000,
				opts = {
					timeout: timeout,
					headers: {
						"Orion-Version": "1",
						"Accept": "application/json, *.*"
					},
					log: false
				};
			if (options && typeof options.readIfExists === 'boolean') {
				opts.headers["read-if-exists"] = Boolean(options.readIfExists).toString();
			}
			return xhr("GET", url.href, opts).then(function(result) {
				if (isMetadata) {
					var r = result.response ? JSON.parse(result.response) : null;
					if (url.query.get("tree") === "compressed") {
						expandLocations(r);
					}
					return r;
				}
				if (result.xhr.status === 204) {
					return null;
				}
				if (acceptPatch) {
					return {
						result: result.response,
						acceptPatch: result.xhr.getResponseHeader("Accept-Patch")
					};
				}
				return result.response;
			}).then(function(result) {
				if (this.makeAbsolute && result) { //can be null on 204
					_normalizeLocations(acceptPatch ? result.result : result);
				}
				return result;
			}.bind(this));
		},
		write: function(location, contents, args) {
			var url = new URL(location, window.location);
			
			var headerData = {
					"Orion-Version": "1",
					"Content-Type": "text/plain;charset=UTF-8"
				};
			if (args && args.ETag) {
				headerData["If-Match"] = args.ETag;
			}
			var options = {
				timeout: 15000,
				headers: headerData,
				data: contents,
				log: false
			};
						
			// check if we have raw contents or something else
			var method = "PUT";
			if (typeof contents !== "string") {
				// look for remote content
				if (contents.sourceLocation) {
					options.query = {source: contents.sourceLocation};
					options.data = null;
				} else if (contents.diff) {
					method = "POST";
					headerData["X-HTTP-Method-Override"] = "PATCH";
					headerData["Content-Type"] = "application/json;charset=UTF-8";
					options.data = JSON.stringify(options.data);
				} else {
					// assume we are putting metadata
					url.query.set("parts", "meta");
				}
			}
			return xhr(method, url.href, options).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			}).then(function(result) {
				if (this.makeAbsolute) {
					_normalizeLocations(result);
				}
				return result;
			}.bind(this));		
		},
		remoteImport: function(targetLocation, options) {
			throw new Error("Not supported"); //$NON-NLS-0$ 
		},
		remoteExport: function(sourceLocation, options) {
			throw new Error("Not supported"); //$NON-NLS-0$ 
		},
		readBlob: function(location) {
			return xhr("GET", location, { //$NON-NLS-0$ 
				responseType: "arraybuffer", //$NON-NLS-0$ 
				timeout: GIT_TIMEOUT
			}).then(function(result) {
				return result.response;
			});
		},
		writeBlob: function(location, contents, args) {
			throw new Error("Not supported"); //$NON-NLS-0$ 
		}
	};
	CollabFileImpl.prototype.constructor = CollabFileImpl;

	return CollabFileImpl;
});
