/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global dojo eclipse:true */
/*jslint devel:true*/

// require utils.js
dojo.getObject("eclipse.sites.util", true);

/**
 * Utility methods
 * @namespace eclipse.sites.util holds stateless utility methods.
 */
eclipse.sites.util = {
	/**
	 * @static
	 * @param {SiteConfiguration} siteConfig
	 * @return The href for a link to the editing page of the given siteConfiguration.
	 */
	generateEditSiteHref: function(siteConfig) {
		return "edit-site.html#site=" + eclipse.util.makeRelative(siteConfig.Location);
	},
	
	/**
	 * Parses the state of the edit-site page from a hash value.
	 * @static
	 * @param {String} hash
	 * @return {site: String, [action: String], [actionDetails:String]}
	 */
	parseStateFromHash: function(hash) {
		return dojo.queryToObject(hash);
	},
	
	/**
	 * Turns the state of the edit-site page into a hash value.
	 * @static
	 * @param {String} siteLocation
	 * @param {String} action
	 * @param {String} actionDetails
	 * @return {String} Hash string representing the new state.
	 */
	stateToHash: function(siteLocation, action, actionDetails) {
		var obj = {};
		if (siteLocation) {
			obj.site = siteLocation;
		}
		if (action) {
			obj.action = action;
		}
		if (actionDetails) {
			obj.actionDetails = actionDetails;
		}
		return dojo.objectToQuery(obj);
	},
	
	/**
	 * Creates & adds commands that act on an individual site configuration.
	 * @static
	 * @param errorCallback {Function} Called when a server request fails.
	 */
	createSiteConfigurationCommands: function(commandService, siteService, statusService, dialogService,
			startCallback, stopCallback, deleteCallback, errorCallback) {
		var editCommand = new eclipse.Command({
			name: "Edit",
			image: "images/editing_16.gif",
			id: "eclipse.site.edit",
			visibleWhen: function(item) {
				return item.HostingStatus && item.HostingStatus.Status === "stopped";
			},
			hrefCallback: eclipse.sites.util.generateEditSiteHref});
		commandService.addCommand(editCommand, "object");
		
		var startCommand = new eclipse.Command({
			name: "Start",
			image: "images/lrun_obj.gif",
			id: "eclipse.site.start",
			visibleWhen: function(item) {
				return item.HostingStatus && item.HostingStatus.Status === "stopped";
			},
			callback: function(item) {
				statusService.setMessage("Starting...");
				siteService.startStopSiteConfiguration(item.Id, "start").then(startCallback, errorCallback);
			}});
		commandService.addCommand(startCommand, "object");
		
		var stopCommand = new eclipse.Command({
			name: "Stop",
			image: "images/stop.gif",
			id: "eclipse.site.stop",
			visibleWhen: function(item) {
				return item.HostingStatus && item.HostingStatus.Status === "started";
			},
			callback: function(item) {
				statusService.setMessage("Stopping " + item.Name + "...");
				siteService.startStopSiteConfiguration(item.Id, "stop").then(stopCallback, errorCallback);
			}});
		commandService.addCommand(stopCommand, "object");
		
		var deleteCommand = new eclipse.Command({
			name: "Delete",
			image: "images/remove.gif",
			id: "eclipse.site.delete",
			visibleWhen: function(item) {
				return item.HostingStatus && item.HostingStatus.Status === "stopped";
			},
			callback: function(item) {
				var msg = "Are you sure you want to delete the site configuration '" + item.Name + "'?";
				dialogService.confirm(msg, function(confirmed) {
						if (confirmed) {
							siteService.deleteSiteConfiguration(item.Id).then(deleteCallback, errorCallback);
						}
					});
			}});
		commandService.addCommand(deleteCommand, "object");
	},
	
	/**
	 * @param projectLocation The Location URL of a file-resource
	 * @returns {String} The path of the URL, relative to this server, with no /file/ prefix
	 * FIXME: this is URL manipulation; it should be done by the server
	 */
	makeRelativeFilePath: function(location) {
		var path = eclipse.util.makeRelative(location);
		return "/" + path.split("/").filter(function(s){return s !== "";}).splice(1).join("/");
	}
};