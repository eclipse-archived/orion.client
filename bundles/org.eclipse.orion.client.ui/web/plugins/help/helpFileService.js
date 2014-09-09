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
define(["orion/Deferred", "orion/xhr", "orion/URL-shim"], function(Deferred, xhr) {

	var HIDDEN = "_"; //$NON-NLS-0$

	var temp = document.createElement("a"); //$NON-NLS-0$
	function makeAbsolute(location) {
		temp.href = location;
		return temp.href;
	}

	function normalizeLocations(data) {
		if (data && typeof data === "object") { //$NON-NLS-0$
			Object.keys(data).forEach(function(key) {
				var value = data[key];
				if (key.indexOf("Location") !== -1) { //$NON-NLS-0$
					data[key] = makeAbsolute(value);
				} else {
					normalizeLocations(value);
				}
			});
		}
		return data;
	}

	function HelpFileServiceImpl(rootURL) {
		this.rootURL = rootURL;
	}
	
	HelpFileServiceImpl.prototype = {/**@lends eclipse.FileServiceImpl.prototype */
		/**
		 * Obtains the children of a remote resource
		 * @param location The location of the item to obtain children for
		 * @return A deferred that will provide the array of child objects when complete
		 */
		fetchChildren: function(location) {
			/* if fetch location does not have a depth parameter then add one, otherwise server will not return any children */
			if (location.indexOf("?depth=") === -1) { //$NON-NLS-0$
				location += "?depth=1"; //$NON-NLS-0$
			}
			return xhr("GET", location, { //$NON-NLS-0$
				headers: {
					"Orion-Version": "1", //$NON-NLS-1$ //$NON-NLS-0$
					"Content-Type": "charset=UTF-8" //$NON-NLS-1$ //$NON-NLS-0$
				},
				timeout: 15000
			}).then(function(result) {
				var jsonData = result.response ? JSON.parse(result.response) : {};
				var children = (jsonData.Children || []).filter(
					function(child) {
						return child.Name.indexOf(HIDDEN) !== 0;
					}
				);
				children.sort(function(a,b) {
					if (a.Directory !== b.Directory) {
						return a.Directory ? 1 : -1;
					}
					var name1 = a.Name && a.Name.toLowerCase();
					var name2 = b.Name && b.Name.toLowerCase();
					if (name1 < name2) {
						return -1;
					}
					return name1 > name2 ? 1 : 0;
				});
				return children;
			}).then(function(result) {
				if (this.makeAbsolute) {
					normalizeLocations(result);
				}
				return result;
			}.bind(this));
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
			var url = new URL(location, window.location);
			if (isMetadata) {
				url.query.set("parts", "meta"); //$NON-NLS-1$ //$NON-NLS-0$
			}
			return xhr("GET", url.href, { //$NON-NLS-0$
				timeout: 15000,
				headers: { "Orion-Version": "1" }, //$NON-NLS-1$ //$NON-NLS-0$
				log: false
			}).then(function(result) {
				if (false && isMetadata) { // TODO temporary workaround
					return result.response ? JSON.parse(result.response) : null;
				} else {
					return result.response;
				}
			}).then(function(result) {
				if (this.makeAbsolute) {
					normalizeLocations(result);
				}
				return result;
			}.bind(this));
		}
	};

	function handleError(error) {
		var errorMessage = "Unknown Error"; //$NON-NLS-0$
		if(error.status && error.status === 404) {
			errorMessage = "File not found."; //$NON-NLS-0$
		} else if (error.xhr && error.xhr.statusText){
			errorMessage = error.xhr.statusText;
		}
		var errorObj = {Severity: "Error", Message: errorMessage}; //$NON-NLS-0$
		error.responseText = JSON.stringify(errorObj);
		return new Deferred().reject(error);
	}

	function call2(method, url, headerData, body) {
		var options = {
			//timeout: 15000,
			responseType: "arraybuffer", //$NON-NLS-0$
			headers: headerData ? headerData : {"Orion-Version": "1"}, //$NON-NLS-1$ //$NON-NLS-0$
			data: body,
			log: false
		};
		return xhr(method, url, options).then(function(result) {
			return result.response;
		}, function(error) { return handleError(error);}).then(function(result) {
			if (this.makeAbsolute) {
				normalizeLocations(result);
			}
			return result;
		}.bind(this));
	}

	if (window.Blob) {
		HelpFileServiceImpl.prototype.readBlob = function(location) {
			return call2("GET", location).then(function(result) { //$NON-NLS-0$
				return result;
			});
		};
	}

	return {
		HelpFileService: HelpFileServiceImpl
	};
});
