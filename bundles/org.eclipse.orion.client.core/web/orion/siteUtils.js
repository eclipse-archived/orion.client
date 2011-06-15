/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define */
/*jslint devel:true*/

define(['dojo', 'orion/commands', 'orion/util'], function(dojo, mCommands, mUtil) {

	/**
	 * This class contains static utility methods for dealing with sites.
	 * @name orion.siteUtils
	 */


	/**
	 * Returns a relative URL pointing to the editing page for the given site configuration. 
	 * @param {orion.siteService.SiteConfiguration} site The site configuration
	 * @return {String} The URL.
	 * @name orion.siteUtils#generateEditSiteHref
	 * @function
	 */
	function generateEditSiteHref(site) {
		return "site.html#" + mUtil.makeRelative(site.Location);
	}
	
	/**
	 * Parses the state of the site page from a hash value.
	 * @param {String} hash The hash string.
	 * @returns {Object} An object having the properties:<ul>
	 * <li>{@link String} <code>site</code> The location URL of the site being edited.</li>
	 * <li>{@link String} <code>action</code> Optional, currently unused</li>
	 * <li>{@link String} <code>actionDetails</code> Optional, currently unused</li>
	 * </ul>
	 * @name orion.siteUtils#parseStateFromHash
	 * @function
	 */
	function parseStateFromHash(hash) {
		var obj = dojo.queryToObject(hash);
		var state = dojo.mixin({}, obj);
		// Find the property name that represents the site
		for (var prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				if (obj[prop] === "" && prop !== "action" && prop !== "actionDetails") {
					state.site = prop;
					delete state[prop];
				}
			}
		}
		return state;
	}
	
	/**
	 * Converts the state of the site page into a hash string.
	 * @param {String} siteLocation The location URL of the site configuration being edited.
	 * @param [String] action Currently unused
	 * @param [String] actionDetails Currently unused
	 * @returns {String} Hash string representing the new state.
	 * @name orion.siteUtils#stateToHash
	 * @function
	 */
	function stateToHash(siteLocation, action, actionDetails) {
		var obj = {};
		if (siteLocation) {
			obj[siteLocation] = "";
		}
		if (action) {
			obj.action = action;
		}
		if (actionDetails) {
			obj.actionDetails = actionDetails;
		}
		return dojo.objectToQuery(obj);
	}
	
	/**
	 * Creates & adds commands that act on an individual site configuration.
	 * @param {eclipse.CommandService} commandService
	 * @param {eclipse.sites.SiteService} siteService
	 * @param {eclipse.StatusReportingService} statusService
	 * @param {eclipse.DialogService} dialogService
	 * @param {Function} startCallback
	 * @param {Function} stopCallback
	 * @param {Function} deleteCallback
	 * @param {Function} errorCallback Called when a server request fails.
	 * @name orion.siteUtils#createSiteCommands
	 * @function
	 */
	function createSiteCommands(commandService, siteService, statusService, dialogService,
			startCallback, stopCallback, deleteCallback, errorCallback) {
		var editCommand = new mCommands.Command({
			name: "Edit",
			image: "/images/editing_16.gif",
			id: "eclipse.site.edit",
			visibleWhen: function(item) {
				return item.HostingStatus && item.HostingStatus.Status === "stopped";
			},
			hrefCallback: generateEditSiteHref});
		commandService.addCommand(editCommand, "object");
		
		var startCommand = new mCommands.Command({
			name: "Start",
			image: "/images/lrun_obj.gif",
			id: "eclipse.site.start",
			visibleWhen: function(item) {
				return item.HostingStatus && item.HostingStatus.Status === "stopped";
			},
			/** @param {SiteConfiguration} [userData] If passed, we'll mutate this site config. */
			callback: function(item, cmdId, imageId, userData) {
				var newItem = userData || {} /* just update the HostingStatus */;
				newItem.HostingStatus = { Status: "started" };
				
				var deferred = siteService.updateSiteConfiguration(item.Location, newItem).then(startCallback, errorCallback);
				statusService.showWhile(deferred, "Starting...");
			}});
		commandService.addCommand(startCommand, "object");
		
		var stopCommand = new mCommands.Command({
			name: "Stop",
			image: "/images/stop.gif",
			id: "eclipse.site.stop",
			visibleWhen: function(item) {
				return item.HostingStatus && item.HostingStatus.Status === "started";
			},
			/** @param {SiteConfiguration} [userData] If passed, we'll mutate this site config. */
			callback: function(item, cmdId, imageId, userData) {
				var newItem = userData || {} /* just update the HostingStatus */;
				newItem.HostingStatus = { Status: "stopped" };
				
				var deferred = siteService.updateSiteConfiguration(item.Location, newItem).then(stopCallback, errorCallback);
				statusService.showWhile(deferred, "Stopping " + item.Name + "...");
			}});
		commandService.addCommand(stopCommand, "object");
		
		var deleteCommand = new mCommands.Command({
			name: "Delete",
			image: "/images/delete.gif",
			id: "eclipse.site.delete",
			visibleWhen: function(item) {
				return item.HostingStatus && item.HostingStatus.Status === "stopped";
			},
			callback: function(item) {
				var msg = "Are you sure you want to delete the site configuration '" + item.Name + "'?";
				dialogService.confirm(msg, function(confirmed) {
						if (confirmed) {
							siteService.deleteSiteConfiguration(item.Location).then(deleteCallback, errorCallback);
						}
					});
			}});
		commandService.addCommand(deleteCommand, "object");
	}

	function _removeEmptyElements(array) {
		return dojo.filter(array, function(s){return s !== "";});
	}
	
	/**
	 * @param location The absolute URL of a file resource.
	 * @returns {String} The path of the URL, relative to this server, with no /file/ prefix.<br/>
	 * <b>FIXME:</b> this is URL manipulation; it should be done by the server
	 * @name orion.siteUtils#makeRelativeFilePath
	 * @function
	 */
	function makeRelativeFilePath(location) {
		var path = mUtil.makeRelative(location);
		var segments = path.split("/");
		var filteredSegments = _removeEmptyElements(segments);
		return "/" + filteredSegments.slice(1).join("/");
	}
	
	/**
	 * @param target The "Target" field from a site configuration
	 * @returns {String} The URL that the target points to.<br/>
	 * <b>FIXME:</b> this is URL manipulation; it should be done by the server
	 * @name orion.siteUtils#makeFullFilePath
	 * @function
	 */
	function makeFullFilePath(target) {
		var relativePath = "/file" + target;
		var segments = target.split("/");
		if (_removeEmptyElements(segments).length === 1) {
			relativePath += "/";
		}
		return mUtil.makeFullPath(relativePath);
	}
	//return the module exports
	return {
		generateEditSiteHref: generateEditSiteHref,
		parseStateFromHash: parseStateFromHash,
		stateToHash: stateToHash,
		createSiteCommands: createSiteCommands,
		makeRelativeFilePath: makeRelativeFilePath,
		makeFullFilePath: makeFullFilePath
	};
});