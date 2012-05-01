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
define(['require', 'dojo'], function(require, dojo) {
	var Deferred = dojo.Deferred;
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

	function SiteImpl(filePrefix, workspacePrefix) {
		this.filePrefix = filePrefix;
		this.cache = {
			getProjects: function(workspaceId) {
				// TODO would be better to invoke the FileService here but we are inside a plugin so we can't.
				if (!this.projects) {
					var headers = { "Orion-Version": "1" };
					this.projects = dojo.xhrGet({
						url: workspacePrefix,
						headers: headers,
						handleAs: 'json'
					}).then(function(data) {
						var workspaces = data.Workspaces;
						var workspace;
						for (var i = 0; i < workspaces.length; i++) {
							workspace = workspaces[i];
							if (workspace.Id === workspaceId) {
								break;
							}
						}
						return dojo.xhrGet({
							url: workspace.Location,
							headers: headers,
							handleAs: 'json'
						}).then(function(workspaceData) {
							return workspaceData.Children || [];
						});
					});
				}
				return this.projects;
			}
		};
	}
	SiteImpl.prototype = {
		getSiteConfigurations: function() {
			//NOTE: require.toURL needs special logic here to handle "site"
			var siteUrl = require.toUrl("site._");
			siteUrl = siteUrl.substring(0,siteUrl.length-2);
			return dojo.xhrGet({
				url: siteUrl,
				preventCache: true,
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000
			}).then(function(response) {
				return response.SiteConfigurations;
			});
		},
		loadSiteConfiguration: function(locationUrl) {
			return dojo.xhrGet({
				url: locationUrl,
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000
			});
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
			return dojo.xhrPost({
				url: siteUrl,
				postData: JSON.stringify(toCreate),
				headers: {
					"Content-Type": "application/json; charset=utf-8",
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000
			});
		},
		updateSiteConfiguration: function(locationUrl, updatedSiteConfig) {
			return dojo.xhrPut({
				url: locationUrl,
				putData: JSON.stringify(updatedSiteConfig),
				headers: {
					"Content-Type": "application/json; charset=utf-8",
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000
			});
		},
		deleteSiteConfiguration: function(locationUrl) {
			return dojo.xhrDelete({
				url: locationUrl,
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000
			});
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
				// Determine display string based on the project name (first segment of internal form)
				var segments = internalPath.split('/');
				var firstSegment = segments[1];
				var displayString;
				for (var i=0; i < projects.length; i++) {
					var project = projects[i];
					if (project.Id === firstSegment) {
						segments[1] = project.Name;
						displayString = segments.join('/');
						break;
					}
				}
				return {
					Source: virtualPath,
					Target: internalPath,
					FriendlyPath: displayString || virtualPath,
				};
			});
		},
		// TODO review the methods below
		// FIXME "view on site"
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
		},
		// FIXME "view on site"
		isFileMapped: function(site, file) {
			return this.getURLOnSite(site, file) !== null;
		},
		// FIXME "view on site"
		mapOnSiteAndStart: function(site, file, workspaceId) {
			function insertMappingFor(virtualPath, filePath, mappings) {
				if (!this.isFileMapped(site, file)) {
					mappings.push({Source: virtualPath, Target: filePath, FriendlyPath: virtualPath});
				}
			}
			var virtualPath = "/" + file.Name;
			var deferred, filePath;
			if (!site) {
				var name = file.Name + " site";
				filePath = this.toInternalForm(file.Location);
				var mappings = [];
				insertMappingFor(virtualPath, filePath, mappings);
				deferred = this.createSiteConfiguration(name, workspaceId, mappings, null, {Status: "started"});
			} else {
				if (site.HostingStatus.Status === "started") {
					site.HostingStatus.Status = "stopped";
				}
				filePath = this.toInternalForm(file.Location);
				insertMappingFor(virtualPath, filePath, site.Mappings);
				deferred = this.updateSiteConfiguration(site.Location, site).then(function(site) {
					return this.updateSiteConfiguration(site.Location, {HostingStatus: {Status: "started"}});
				});
			}
			return deferred.then(function(site) {
				return makeURL(site, virtualPath, file);
			});
		},
		// FIXME "self hosting"
		isSelfHosting: function(site) {
			var selfHost = this.getSelfHostingMappings('^.*');
			var mappings = site.Mappings;
			for (var i=0; i < selfHost.length; i++) {
				var selfHostEntry = new RegExp(selfHost[i].Target);
				var foundMatch = false;
				for (var j=0; j < mappings.length; j++) {
					var mapping = mappings[j];
					if (selfHostEntry.test(mapping.Target)) {
						foundMatch = true;
						break;
					}
				}
				if (!foundMatch) {
					return false;
				}
			}
			return true;
//			for (var i=0; i < projects.length; i++) {
//				var path = this._siteClient.toInternalForm(projects[i].Location);
//				var selfHostingMappings = this.getSelfHostingMappings(path);
//				var pass = true;
//				for (var j=0; j < selfHostingMappings.length; j++) {
//					if (!this.mappings.mappingExists(selfHostingMappings[j])) {
//						pass = false;
//					}
//				}
//				if (pass) {
//					return true;
//				}
//			}
		},
		getSelfHostingMappings: function(basePath) {
			// TODO: prompt for port? It is not detectable from client side if proxy is used
			var hostPrefix = "http://localhost" + ":" + "8080" + makeHostRelative(getContext());
			return [
				{ Source: "/",
				  Target: basePath + "/bundles/org.eclipse.orion.client.core/web/index.html"
				},
				{ Source: "/",
				  Target: basePath + "/bundles/org.eclipse.orion.client.core/web"
				},
				{ Source: "/",
				  Target: basePath + "/bundles/org.eclipse.orion.client.editor/web"
				},
				{ Source: "/org.dojotoolkit/dojo",
				  Target: basePath + "/bundles/org.eclipse.orion.client.core/web/dojo"
				},
				{ Source: "/org.dojotoolkit/dojox",
				  Target: basePath + "/bundles/org.eclipse.orion.client.core/web/dojox"
				},
				{ Source: "/file",
				  Target: hostPrefix + "file"
				},
				{ Source: "/prefs",
				  Target: hostPrefix + "prefs"
				},
				{ Source: "/workspace",
				  Target: hostPrefix + "workspace"
				},
				{ Source: "/org.dojotoolkit",
				  Target: hostPrefix + "org.dojotoolkit"
				},
				{ Source: "/users",
				  Target: hostPrefix + "users"
				},
				{ Source: "/authenticationPlugin.html",
				  Target: hostPrefix + "authenticationPlugin.html"
				},
				{ Source: "/login",
				  Target: hostPrefix + "login"
				},
				{ Source: "/loginstatic",
				  Target: hostPrefix + "loginstatic"
				},
				{ Source: "/site",
				  Target: hostPrefix + "site"
				},
				{ Source: "/",
				  Target: basePath + "/bundles/org.eclipse.orion.client.git/web"
				},
				{ Source: "/gitapi",
				  Target: hostPrefix + "gitapi"
				},
				{ Source: "/",
				  Target: basePath + "/bundles/org.eclipse.orion.client.users/web"
				},
				{ Source: "/xfer",
				  Target: hostPrefix + "xfer"
				},
				{ Source: "/filesearch",
				  Target: hostPrefix + "filesearch"
				},
				{ Source: "/index.jsp",
				  Target: hostPrefix + "index.jsp"
				},
				{ Source: "/plugins/git",
				  Target: hostPrefix + "plugins/git"
				},
				{ Source: "/plugins/user",
				  Target: hostPrefix + "plugins/user"
				},
				{ Source: "/logout",
				  Target: hostPrefix + "logout"
				},
				{ Source: "/mixloginstatic",
				  Target: hostPrefix + "mixloginstatic"
				},
				{ Source: "/mixlogin/manageopenids",
				  Target: hostPrefix + "mixlogin/manageopenids"
				},
				{ Source: "/openids",
				  Target: hostPrefix + "openids"
				},
				{ Source: "/task",
				  Target: hostPrefix + "task"
				},
				{ Source: "/help",
				  Target: hostPrefix + "help"
				}
			];
		}
	};
	return {
		SiteImpl: SiteImpl
	};
});