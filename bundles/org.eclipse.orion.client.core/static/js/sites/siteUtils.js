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

dojo.getObject("eclipse.sites.util", true);
// require utils.js

/**
 * Utility methods
 * @namespace eclipse.sites.util holds stateless utility methods.
 */
eclipse.sites.util = {
	/**
	 * @param {SiteConfiguration} siteConfig
	 * @return Href for a link to the editing page of the given siteConfiguration.
	 */
	generateEditSiteHref: function(siteConfig) {
		return "edit-site.html#site=" + eclipse.util.makeRelative(siteConfig.Location);
	},
	
	/**
	 * Parses the state of the edit-site page from a hash value.
	 * @param {String} hash
	 * @return {site: String, [action: String], [actionDetails:String]}
	 */
	parseStateFromHash: function(hash) {
		return dojo.queryToObject(hash);
	},
	
	/**
	 * Turns the state of the edit-site page into a hash value.
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
	}
};