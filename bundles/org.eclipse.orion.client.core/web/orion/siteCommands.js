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
define(['require', 'orion/commands', 'orion/siteUtils'],
		function(require, mCommands, mSiteUtils) {
	var Command = mCommands.Command;
	var sitesCache = null;
	var workspacesCache = null;

	function SitesCache(siteService) {
		this.sites = [];
		var self = this;
		siteService.getSiteConfigurations().then(
			function(sites) {
				self.sites = sites;
			});
	}

	function WorkspacesCache(fileService) {
		var promise = null;
		this.getWorkspaces = function() {
			if (!promise) {
				promise = fileService.loadWorkspaces();
			}
			return promise;
		};
	}

	function toArray(obj) {
		return Array.isArray(obj) ? obj : [obj];
	}

	function oneFileOrFolder(items) {
		items = toArray(items);
		if (items.length === 0) {
			return false;
		}
		// Looks like a file object, not a site configuration
		return items[0].Location && !items[0].Mappings;
	}

	function makeViewOnSiteChoices(items, userData, serviceRegistry, viewOnCallback) {
		function insertMappingFor(virtualPath, filePath, mappings) {
			for (var i=0; i < mappings.length; i++) {
				var mapping = mappings[i];
				if (mapping.Target === filePath) {
					return;
				}
			}
			mappings.push({Source: virtualPath, Target: filePath, FriendlyPath: virtualPath});
		}
		function err(error) {
			serviceRegistry.getService("orion.page.progress").setProgressResult(error);
		}
		items = toArray(items);
		var callback = function(site, selectedItems) {
			selectedItems = Array.isArray(selectedItems) ? selectedItems : [selectedItems];
			var item = selectedItems[0];
			var virtualPath = "/" + item.Name;
			var siteService = serviceRegistry.getService("orion.sites");
			var deferred;
			if (!site) {
				var name = item.Name + " site";
				deferred = siteService.makeRelativeFilePath(item.Location).then(function(filePath) {
					var mappings = [];
					insertMappingFor(virtualPath, filePath, mappings);
					return workspacesCache.getWorkspaces().then(function(workspaces) {
						var workspaceId = workspaces[0].Id;
						return siteService.createSiteConfiguration(name, workspaceId, mappings, null, {Status: "started"});
					});
				});
			} else {
				if (site.HostingStatus.Status === "started") {
					site.HostingStatus.Status = "stopped";
				}
				deferred = siteService.makeRelativeFilePath(item.Location).then(function(filePath) {
					insertMappingFor(virtualPath, filePath, site.Mappings);
					return siteService.updateSiteConfiguration(site.Location, site).then(function(site) {
						return siteService.updateSiteConfiguration(site.Location, {HostingStatus: {Status: "started"}});
					});
				});
			}
			deferred.then(function(site) {
				// At this point the site is started
				var a = document.createElement("a");
				a.href = site.HostingStatus.URL + virtualPath + (item.Directory ? "/" : "");
				var url = a.href;
				if (viewOnCallback) {
					viewOnCallback(url, site);
				} else {
					window.location = url;
				}
			}, err);
		};
		var choices = [];
		for (var i = 0; i < sitesCache.sites.length; i++) {
			var site = sitesCache.sites[i];
			choices.push({name: site.Name, callback: callback.bind(null, site)});
		}
		if (choices.length) {
			choices.push({});	//separator
		}
		choices.push({name: "New Site", callback: callback.bind(null, null)});
		return choices;
	}

	/**
	 * Creates & adds commands that act on an individual site configuration.
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry
	 * @param {Function} options.createCallback
	 * @param {Function} options.startCallback
	 * @param {Function} options.stopCallback
	 * @param {Function} options.deleteCallback
	 * @param {Function} options.viewOnCallback
	 * @param {Function} options.errorCallback
	 * @name orion.siteCommands#createSiteCommands
	 * @function
	 */
	function createSiteCommands(serviceRegistry, options) {
		options = options || {};
		var commandService = serviceRegistry.getService("orion.page.command"),
		    siteService = serviceRegistry.getService("orion.sites"),
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

		var viewOnSiteCommand = new Command({
			name: "View on site",
			tooltip: "View this file on a web site hosted by Orion",
			id: "orion.site.viewon",
			choiceCallback: function(items, userData) {
				return makeViewOnSiteChoices(items, userData, serviceRegistry, options.viewOnCallback);
			},
			visibleWhen: oneFileOrFolder
			});
		commandService.addCommand(viewOnSiteCommand);

		if (!sitesCache) {
			sitesCache = new SitesCache(siteService);
		}
		if (!workspacesCache) {
			workspacesCache = new WorkspacesCache(serviceRegistry.getService("orion.core.file"));
		}
	}
	return {
		createSiteCommands: createSiteCommands
	};
});