/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global console define document window*/
define(['require', 'orion/commands', 'orion/siteUtils', 'dojo'],
		function(require, mCommands, mSiteUtils, dojo) {
	var Command = mCommands.Command;
	var Deferred = dojo.Deferred;
	var workspacesCache = null;

	function WorkspacesCache(fileService) {
		var promise = null;
		this.getWorkspaces = function() {
			if (!promise) {
				promise = fileService.loadWorkspaces();
			}
			return promise;
		};
	}

	function makeUrl(site, path, file) {
		return site.HostingStatus.URL + (path[0] !== "/" ? "/" : "") + path + (file.Directory ? "/" : "");
	}

	function getPathOnSite(siteService, site, fileLocation) {
		var mappings = site.Mappings, filePath = siteService.makeRelativeFilePath(fileLocation);
		if (!mappings) {
			return false;
		}
		for (var i=0; i < mappings.length; i++) {
			var mapping = mappings[i];
			if (mapping.Target === filePath) {
				return mapping.Source;
			}
		}
		return null;
	}

	// TODO move to SiteService?
	function isFileMapped(siteService, site, fileLocation) {
		return getPathOnSite(siteService, site, fileLocation) !== null;
	}

	// TODO move to SiteService?
	function mapFileOnSite(siteService, site, file) {
		function insertMappingFor(virtualPath, filePath, mappings) {
			if (!isFileMapped(siteService, site, file.Location)) {
				mappings.push({Source: virtualPath, Target: filePath, FriendlyPath: virtualPath});
			}
		}
		var virtualPath = "/" + file.Name;
		var deferred, filePath;
		if (!site) {
			var name = file.Name + " site";
			filePath = siteService.makeRelativeFilePath(file.Location);
			var mappings = [];
			insertMappingFor(virtualPath, filePath, mappings);
			deferred = workspacesCache.getWorkspaces().then(function(workspaces) {
				var workspaceId = workspaces[0].Id;
				return siteService.createSiteConfiguration(name, workspaceId, mappings, null, {Status: "started"});
			});
		} else {
			if (site.HostingStatus.Status === "started") {
				site.HostingStatus.Status = "stopped";
			}
			filePath = siteService.makeRelativeFilePath(file.Location);
			insertMappingFor(virtualPath, filePath, site.Mappings);
			deferred = siteService.updateSiteConfiguration(site.Location, site).then(function(site) {
				return siteService.updateSiteConfiguration(site.Location, {HostingStatus: {Status: "started"}});
			});
		}
		return deferred.then(function(site) {
			return makeUrl(site, virtualPath, file);
		});
	}

	function isFileAvailable(siteService, site, file) {
		var fileLocation = (typeof file === "object") ? file.Location : file;
		var isStarted = site.HostingStatus && site.HostingStatus.Status === "started";
		return site && fileLocation && isStarted && isFileMapped(siteService, site, fileLocation);
	}

	/**
	 * Creates & adds commands that act on an individual site configuration.
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry
	 * @param {Function} options.createCallback
	 * @param {Function} options.startCallback
	 * @param {Function} options.stopCallback
	 * @param {Function} options.deleteCallback
	 * @param {Function} options.addAndStartCallback
	 * @param {Function} options.errorCallback
	 * @param {Object} [options.fileLocation]
	 * @name orion.siteCommands#createSiteCommands
	 * @function
	 */
	function createSiteCommands(serviceRegistry, options) {
		options = options || {};
		var commandService = serviceRegistry.getService("orion.page.command"),
		    siteService = options.siteService, //serviceRegistry.getService("orion.sites"), // Need synchronous
		    dialogService = serviceRegistry.getService("orion.page.dialog"),
		    progressService = serviceRegistry.getService("orion.page.progress");
		var createCommand = new mCommands.Command({
			name : "Create Site",
			tooltip: "Create a new site configuration",
			imageClass: "core-sprite-add",
			id: "orion.site.create",
			groupId: "orion.sitesGroup",
			parameters: new mCommands.ParametersDescription([new mCommands.CommandParameter('name', 'string', 'Name:')]),
			callback : function(data) {
				var name = data.parameters && data.parameters.valueFor('name');
				workspacesCache.getWorkspaces().then(function(workspaces) {
			        var workspaceId = workspaces && workspaces[0] && workspaces[0].Id;
			        if (workspaceId && name) {
				        siteService.createSiteConfiguration(name, workspaceId).then(function(site) {
							options.createCallback(mSiteUtils.generateEditSiteHref(site), site);
						}, options.errorCallback);
			        }
				});
			}});
		commandService.addCommand(createCommand);

		var editCommand = new Command({
			name: "Edit",
			tooltip: "Edit the site configuration",
			imageClass: "core-sprite-edit",
			id: "orion.site.edit",
			visibleWhen: function(item) {
				return item.HostingStatus;
			},
			hrefCallback: function(data) { return mSiteUtils.generateEditSiteHref(data.items);}});
		commandService.addCommand(editCommand);

		var startCommand = new Command({
			name: "Start",
			tooltip: "Start the site",
			imageClass: "core-sprite-start",
			id: "orion.site.start",
			visibleWhen: function(item) {
				return item.HostingStatus && item.HostingStatus.Status === "stopped";
			},
			/** @param {SiteConfiguration} [userData] If passed, we'll mutate this site config. */
			callback: function(data) {
				var newItem = data.userData || {} /* just update the HostingStatus */;
				newItem.HostingStatus = { Status: "started" };
				var deferred = siteService.updateSiteConfiguration(data.items.Location, newItem);
				progressService.showWhile(deferred).then(options.startCallback, options.errorCallback);
			}});
		commandService.addCommand(startCommand);

		var stopCommand = new Command({
			name: "Stop",
			tooltip: "Stop the site",
			imageClass: "core-sprite-stop",
			id: "orion.site.stop",
			visibleWhen: function(item) {
				return item.HostingStatus && item.HostingStatus.Status === "started";
			},
			/** @param {SiteConfiguration} [data.userData] If passed, we'll mutate this site config. */
			callback: function(data) {
				var newItem = data.userData || {} /* just update the HostingStatus */;
				newItem.HostingStatus = { Status: "stopped" };
				var deferred = siteService.updateSiteConfiguration(data.items.Location, newItem);
				progressService.showWhile(deferred).then(options.stopCallback, options.errorCallback);
			}});
		commandService.addCommand(stopCommand);

		var deleteCommand = new Command({
			name: "Delete",
			tooltip: "Delete the site configuration",
			imageClass: "core-sprite-delete",
			id: "orion.site.delete",
			visibleWhen: function(item) {
				return item.HostingStatus && item.HostingStatus.Status === "stopped";
			},
			callback: function(data) {
				var msg = "Are you sure you want to delete the site configuration '" + data.items.Name + "'?";
				dialogService.confirm(msg, function(confirmed) {
						if (confirmed) {
							siteService.deleteSiteConfiguration(data.items.Location).then(options.deleteCallback, options.errorCallback);
						}
					});
			}});
		commandService.addCommand(deleteCommand);

		var addAndStartSiteCommand = new Command({
			name: "View on site",
			tooltip: "View the file on this site",
			id: "orion.site.add-to",
			imageClass: "core-sprite-add",
			visibleWhen: function(item) {
				return !isFileAvailable(siteService, item.SiteConfiguration, options.fileLocation);
			},
			callback: function(data, callback) {
				var site = data.items.SiteConfiguration;
				var fileLocation = data.userData;
				return serviceRegistry.getService("orion.core.file").read(fileLocation, true).then(function(file) {
					return mapFileOnSite(siteService, site, file);
				}).then(options.addAndStartCallback, options.errorCallback);
			}});
		commandService.addCommand(addAndStartSiteCommand);

		// Command that generates a href to view the file on the site if it's mapped
		var viewOnSiteLink = new Command({
			name: "View",
			tooltip: "View the file on the site",
			id: "orion.site.view-on-link",
			visibleWhen: function(item) {
				return isFileAvailable(siteService, item.SiteConfiguration, options.fileLocation);
			},
			hrefCallback: function(data) {
				var fileLocation = data.userData;
				var site = data.items.SiteConfiguration;
				var path = getPathOnSite(siteService, site, fileLocation);
				return serviceRegistry.getService("orion.core.file").read(fileLocation, true).then(function(file) {
					return makeUrl(site, path, file);
				});
			}});
		commandService.addCommand(viewOnSiteLink);

		if (!workspacesCache) {
			workspacesCache = new WorkspacesCache(serviceRegistry.getService("orion.core.file"));
		}
	}
	return {
		createSiteCommands: createSiteCommands
	};
});