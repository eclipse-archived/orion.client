/*******************************************************************************
 * @license
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

define(['require', 'dojo', 'orion/commands', 'orion/util', 'orion/URITemplate'],
	function(require, dojo, mCommands, mUtil, URITemplate) {
	/**
	 * This class contains utility methods for dealing with sites.
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
		var base = require.toUrl("sites/site.html");
		return new URITemplate(base + "#{,resource,params*}").expand({
			resource: mUtil.makeRelative(site.Location)
		});
	}
	
	/**
	 * Creates & adds commands that act on an individual site configuration.
	 * @param {eclipse.CommandService} commandService
	 * @param {orion.sites.SiteService} siteService
	 * @param {eclipse.ProgressService} progressService
	 * @param {eclipse.DialogService} dialogService
	 * @param {Function} startCallback
	 * @param {Function} stopCallback
	 * @param {Function} deleteCallback
	 * @param {Function} errorCallback Called when a server request fails.
	 * @name orion.siteUtils#createSiteCommands
	 * @function
	 */
	function createSiteCommands(commandService, siteService, progressService, dialogService,
			startCallback, stopCallback, deleteCallback, errorCallback) {
		var editCommand = new mCommands.Command({
			name: "Edit",
			tooltip: "Edit the site configuration",
			imageClass: "core-sprite-edit",
			id: "orion.site.edit",
			visibleWhen: function(item) {
				return item.HostingStatus;
			},
			hrefCallback: function(data) { return generateEditSiteHref(data.items);}});
		commandService.addCommand(editCommand);
		
		var startCommand = new mCommands.Command({
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
				progressService.showWhile(deferred).then(startCallback, errorCallback);
			}});
		commandService.addCommand(startCommand);
		
		var stopCommand = new mCommands.Command({
			name: "Stop",
			tooltip: "Stop the site",
			imageClass: "core-sprite-stop",
			id: "orion.site.stop",
			visibleWhen: function(item) {
				return item.HostingStatus && item.HostingStatus.Status === "started";
			},
			/** @param {SiteConfiguration} [userData] If passed, we'll mutate this site config. */
			callback: function(data) {
				var newItem = data.userData || {} /* just update the HostingStatus */;
				newItem.HostingStatus = { Status: "stopped" };
				
				var deferred = siteService.updateSiteConfiguration(data.items.Location, newItem);
				progressService.showWhile(deferred).then(stopCallback, errorCallback);
			}});
		commandService.addCommand(stopCommand);
		
		var deleteCommand = new mCommands.Command({
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
							siteService.deleteSiteConfiguration(data.items.Location).then(deleteCallback, errorCallback);
						}
					});
			}});
		commandService.addCommand(deleteCommand);
	}

	var siteUtils = {};
	siteUtils.generateEditSiteHref = generateEditSiteHref;
	siteUtils.createSiteCommands = createSiteCommands;
	
	//return the module exports
	return siteUtils;
});