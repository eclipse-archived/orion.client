/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define document window*/
/*jslint regexp:false*/
define(['require', 'orion/xhr'], function(require, xhr) {
	
	var temp = document.createElement('a');
	
	function qualifyURL(url) {
		var link = document.createElement("a");
		link.href = url;
		return link.href;
	}
	function getContext() {
		var root = require.toUrl("._");
		var url = qualifyURL(root);
		return url.substring(0, url.length-2);
	}
	function makeHostRelative(url) {
		if (url.indexOf(":") !== -1) {
			return url.substring(url.indexOf(window.location.host) + window.location.host.length);
		}
		return url;
	}
	function makeURL(site, path, file) {
		return site.HostingStatus.URL + (path[0] !== "/" ? "/" : "") + path + (file.Directory ? "/" : "");
	}
	function isInternalPath(path) {
		return new RegExp("^/").test(path);
	}
	
	function makeAbsolute(location) {
		temp.href = location;
		return temp.href;
	}
	
	function _normalizeLocations(data) {
		if (data && typeof data === "object") {
			Object.keys(data).forEach(function(key) {
				var value = data[key];
				if (key.indexOf("Location") !== -1) {
					data[key] = makeAbsolute(value);
				} else {
					_normalizeLocations(value);
				}
			});
		}
		return data;
	}
	
	/**
	 * @returns {String} A display string constructed by replacing the first segment (project id)
	 * of internalPath with the project's Name.
	 */
	function getDisplayString(internalPath, projects) {
		var displayString;
		var segments = internalPath.split('/');
		var firstSegment = segments[1];
		for (var i=0; i < projects.length; i++) {
			var project = projects[i];
			if (project.Id === firstSegment) {
				segments[1] = project.Name;
				displayString = segments.join('/');
				break;
			}
		}
		return displayString;
	}
	/**
	 * Invoke the xhr API passing JSON data and returning the response as JSON.
	 * @returns {Deferred} A deferred that resolves to a JS object, or null if the server returned
	 * an empty response.
	 */
	function xhrJson(method, url, options) {
		if (options && typeof options.data !== 'undefined') {
			options.data = JSON.stringify(options.data);
		}
		return xhr.apply(null, Array.prototype.slice.call(arguments)).then(function(result) {
			return JSON.parse(result.response || null);
		});
	}
	function Cache(workspaceBase) {
		this.projects = {};
		this.getProjects = function(workspaceId) {
			// TODO would be better to invoke the FileService here but we are inside a plugin so we can't.
			var headers = { "Orion-Version": "1" };
			if (!this.projects[workspaceId]) {
				this.projects[workspaceId] = xhrJson('GET', workspaceBase,
					{	headers: headers
					}).then(function(data) {
						var workspaces = data.Workspaces;
						var workspace;
						for (var i=0; i < workspaces.length; i++) {
							workspace = workspaces[i];
							if (workspace.Id === workspaceId) {
								break;
							}
						}
						return xhrJson('GET', workspace.Location, {
							headers: headers
						}).then(function(workspaceData) {
							return workspaceData.Children || [];
						});
					});
			}
			return this.projects[workspaceId];
		};
	}
	function getSelfHostingMappings(basePath, port) {
		var hostPrefix = "http://localhost" + ":" + port + makeHostRelative(getContext());
		return [
			["/", basePath + "/bundles/org.eclipse.orion.client.core/web/index.html"],
			["/", basePath + "/bundles/org.eclipse.orion.client.core/web"],
			["/", basePath + "/bundles/org.eclipse.orion.client.editor/web"],
			["/org.dojotoolkit/dojo", basePath + "/bundles/org.eclipse.orion.client.core/web/dojo"],
			["/org.dojotoolkit/dojox", basePath + "/bundles/org.eclipse.orion.client.core/web/dojox"],
			["/file", hostPrefix + "file"],
			["/prefs", hostPrefix + "prefs"],
			["/workspace", hostPrefix + "workspace"],
			["/org.dojotoolkit", hostPrefix + "org.dojotoolkit"],
			["/users", hostPrefix + "users"],
			["/authenticationPlugin.html", hostPrefix + "authenticationPlugin.html"],
			["/login", hostPrefix + "login"],
			["/loginstatic", hostPrefix + "loginstatic"],
			["/useremailconfirmation", hostPrefix + "useremailconfirmation"],
			["/site", hostPrefix + "site"],
			["/", basePath + "/bundles/org.eclipse.orion.client.git/web"],
			["/gitapi", hostPrefix + "gitapi"],
			["/", basePath + "/bundles/org.eclipse.orion.client.users/web"],
			["/xfer", hostPrefix + "xfer"],
			["/filesearch", hostPrefix + "filesearch"],
			["/index.jsp", hostPrefix + "index.jsp"],
			["/plugins/git", hostPrefix + "plugins/git"],
			["/plugins/user", hostPrefix + "plugins/user"],
			["/logout", hostPrefix + "logout"],
			["/mixlogin/manageopenids", hostPrefix + "mixlogin/manageopenids"],
			["/openids", hostPrefix + "openids"],
			["/task", hostPrefix + "task"],
			["/help", hostPrefix + "help"]
		].map(function(item) {
			return {Source: item[0], Target: item[1]};
		});
	}

	function SiteImpl(filePrefix, workspacePrefix) {
		this.filePrefix = filePrefix;
		this.cache = new Cache(workspacePrefix);
		this.makeAbsolute = workspacePrefix && workspacePrefix.indexOf("://") !== -1;
	}
	
	SiteImpl.prototype = {
		getSiteConfigurations: function() {
			//NOTE: require.toURL needs special logic here to handle "site"
			var siteUrl = require.toUrl("site._");
			siteUrl = siteUrl.substring(0,siteUrl.length-2);
			return xhrJson('GET', siteUrl, {
				headers: {
					"Orion-Version": "1"
				},
				timeout: 15000
			}).then(function(response) {
				return response.SiteConfigurations;
			}).then(
				function(result) {
					if (this.makeAbsolute) {
						_normalizeLocations(result);
					}
					return result;
				}.bind(this)
			);
		},
		loadSiteConfiguration: function(locationUrl) {
			return xhrJson('GET', locationUrl, {
				headers: {
					"Orion-Version": "1"
				},
				timeout: 15000
			}).then(
				function(result) {
					if (this.makeAbsolute) {
						_normalizeLocations(result);
					}
					return result;
				}.bind(this)
			);
		},
		/**
		 * @param {String} name
		 * @param {String} workspaceId
		 * @param {Object} [mappings]
		 * @param {String} [hostHint]
		 * @param {String} [status]
		 */
		createSiteConfiguration: function(name, workspaceId, mappings, hostHint, hostingStatus) {
			function hostify(name) {
				return name.replace(/ /g, "-").replace(/[^A-Za-z0-9-_]/g, "").toLowerCase();
			}
			var toCreate = {
					Name: name,
					Workspace: workspaceId,
					HostHint: hostify(name)
				};
			if (mappings) { toCreate.Mappings = mappings; }
			if (hostHint) { toCreate.HostHint = hostHint; }
			if (hostingStatus) { toCreate.HostingStatus = hostingStatus; }

			//NOTE: require.toURL needs special logic here to handle "site"
			var siteUrl = require.toUrl("site._");
			siteUrl = siteUrl.substring(0,siteUrl.length-2);
			return xhrJson('POST', siteUrl, {
				data: toCreate,
				headers: {
					"Content-Type": "application/json; charset=utf-8",
					"Orion-Version": "1"
				},
				timeout: 15000
			}).then(
				function(result) {
					if (this.makeAbsolute) {
						_normalizeLocations(result);
					}
					return result;
				}.bind(this)
			);
		},
		updateSiteConfiguration: function(locationUrl, updatedSiteConfig) {
			return xhrJson('PUT', locationUrl, {
				data: updatedSiteConfig,
				headers: {
					"Content-Type": "application/json; charset=utf-8",
					"Orion-Version": "1"
				},
				timeout: 15000
			}).then(
				function(result) {
					if (this.makeAbsolute) {
						_normalizeLocations(result);
					}
					return result;
				}.bind(this)
			);
		},
		deleteSiteConfiguration: function(locationUrl) {
			return xhrJson('DELETE', locationUrl, {
				headers: {
					"Orion-Version": "1"
				},
				timeout: 15000
			}).then(
				function(result) {
					if (this.makeAbsolute) {
						_normalizeLocations(result);
					}
					return result;
				}.bind(this)
			);
		},
		/**
		 * @param {String} fileLocation
		 */
		toInternalForm: function(fileLocation) {
			var relFilePrefix = makeHostRelative(this.filePrefix);
			var relLocation = makeHostRelative(fileLocation);
			var path;
			if (relLocation.indexOf(relFilePrefix) === 0) {
				path = relLocation.substring(relFilePrefix.length);
			}
			if (path[path.length-1] === "/"){
				path = path.substring(0, path.length - 1);
			}
			return path;
		},
		/**
		 * @param {String} internalPath
		 */
		toFileLocation: function(internalPath) {
			function _removeEmptyElements(array) {
				return array.filter(function(s){return s !== "";});
			}
			var relativePath = require.toUrl(this.filePrefix + internalPath + "._");
			relativePath = relativePath.substring(0, relativePath.length - 2);
			var segments = internalPath.split("/");
			if (_removeEmptyElements(segments).length === 1) {
				relativePath += "/";
			}
			return makeHostRelative(qualifyURL(relativePath));
		},
		/** @returns {Object} */
		getMappingObject: function(site, fileLocation, virtualPath) {
			var internalPath = this.toInternalForm(fileLocation);
			return this.cache.getProjects(site.Workspace).then(function(projects) {
				var displayString = getDisplayString(internalPath, projects);
				return {
					Source: virtualPath,
					Target: internalPath,
					FriendlyPath: displayString || virtualPath
				};
			});
		},
		getMappingProposals: function(site) {
			var self = this;
			return this.cache.getProjects(site.Workspace).then(function(projects) {
				return projects.map(function(project) {
					return {
						Source: '/' + project.Name,
						Target: self.toInternalForm(project.Location),
						FriendlyPath: '/' + project.Name
					};
				});
			});
		},
		updateMappingsDisplayStrings: function(site) {
			return this.cache.getProjects(site.Workspace).then(function(projects) {
				var mappings = site.Mappings;
				for (var i = 0; i < mappings.length; i++) {
					var mapping = mappings[i];
					if (isInternalPath(mapping.Target)) {
						mapping.FriendlyPath = getDisplayString(mapping.Target, projects);
					}
				}
				return site;
			});
		},
		parseInternalForm: function(site, displayString) {
			if (isInternalPath(displayString)) {
				return this.cache.getProjects(site.Workspace).then(function(projects) {
					// Find project whose Name matches the first segment of display string
					var segments = displayString.split('/');
					for (var i=0; i < projects.length; i++) {
						var project = projects[i];
						if (segments[1] === project.Name) {
							// Replace Name by Id to produce the internal form
							segments[1] = project.Id;
							return segments.join('/');
						}
					}
				});
			}
			return null; // no internal form
		},
		isSelfHostingSite: function(site) {
			function hasMapping(mappings, mapping) {
				for (var i=0; i < mappings.length; i++) {
					var m = mappings[i];
					if (m.Source === mapping.Source || m.Target === mapping.Target) {
						return true;
					}
				}
				return false;
			}
			var self = this;
			return this.cache.getProjects(site.Workspace).then(function(projects) {
				// There must be a project for which all self hosting mappings can be generated using the project's Id
				return projects.some(function(project) {
					var internalPath = self.toInternalForm(project.Location);
					var selfHostMappings = getSelfHostingMappings(internalPath);
					for (var i=0; i < selfHostMappings.length; i++) {
						if (!hasMapping(site.Mappings, selfHostMappings[i])) {
							return false;
						}
					}
					return true;
				});
			});
		},
		convertToSelfHosting: function(site, selfHostfileLocation, port) {
			var internalPath = this.toInternalForm(selfHostfileLocation);
			var mappings = getSelfHostingMappings(internalPath, port);
			site.Mappings = mappings;
			return site;
		},
		getURLOnSite: function(site, file) {
			var mappings = site.Mappings, filePath = this.toInternalForm(file.Location);
			if (!mappings) {
				return null;
			}
			for (var i=0; i < mappings.length; i++) {
				var mapping = mappings[i];
				if (mapping.Target === filePath) {
					return makeURL(site, mapping.Source, file);
				}
			}
			return null;
		}
	};
	return {
		SiteImpl: SiteImpl
	};
});