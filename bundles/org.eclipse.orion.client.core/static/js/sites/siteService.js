/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global dojo eclipse:true handleGetAuthenticationError handlePostAuthenticationError
  handleDeleteAuthenticationError */
/*jslint devel:true*/

dojo.getObject("eclipse.sites", true);

/**
 * @name eclipse.sites.SITE_SERVICE_NAME
 * @property Constant used to identify the site service name.
 */
eclipse.sites.SITE_SERVICE_NAME = "org.eclipse.orion.sites.siteManagement";

// requires: authentication service
eclipse.sites.SiteService = (function() {
	/**
	 * Constructs a new SiteService.
	 * 
	 * @name eclipse.sites.SiteService
	 * @class Implements a service that provides access to the server API for managing site configurations.
	 * To do this it may be registered with a {eclipse.ServiceRegistry}, for example:
	 * <code>
	 * var serviceRegistry = ...
	 * var siteService = new eclipse.sites.SiteService();
	 * var registration = serviceRegistry.registerService(eclipse.sites.SITE_SERVICE_NAME, siteService);
	 * </code>
	 */
	function SiteService() {
		this._siteUrl = "/site";
	}
	SiteService.prototype = /** @lends eclipse.sites.SiteService.prototype */ {
		/**
		 * Gets all site configurations defined by the logged-in user.
		 * @return {dojo.Deferred} A deferred for the result. Will be resolved with the 
		 * argument {SiteConfiguration[]} on success.
		 */
		getSiteConfigurations: function() {
			return dojo.xhrGet({
					url: this._siteUrl,
					headers: {
						"Orion-Version": "1"
					},
					handleAs: "json",
					timeout: 15000,
					error: function(response, ioArgs) {
						console.error("HTTP status code: ", ioArgs.xhr.status);
						handleGetAuthenticationError(this, ioArgs);
						return response;
					}
				}).then(function(response) {
					return response.SiteConfigurations;
				});
		},
		
		/**
		 * Loads an individual site configuration from the given location.
		 * @static
		 * @param {String} location URL of a site configuration resource.
		 * @return {dojo.Deferred} A deferred for the result. Will be resolved with the 
		 * loaded {SiteConfiguration} on success.
		 */
		loadSiteConfiguration: function(location) {
			return dojo.xhrGet({
				url: location,
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				error: function(response, ioArgs) {
					console.error("HTTP status code: ", ioArgs.xhr.status);
					handleGetAuthenticationError(this, ioArgs);
					return response;
				}
			});
		},
		
		/**
		 * Creates a site configuration.
		 * @param {String} name
		 * @param {String} workspace
		 * @param {Object} [mappings]
		 * @param {String} [hostHint]
		 * @return {dojo.Deferred} A deferred for the result. Will be resolved with the 
		 * created {SiteConfiguration} as argument on success.
		 */
		createSiteConfiguration: function(name, workspace, mappings, hostHint) {
			var toCreate = {
					Name: name,
					Workspace: workspace
				};
			if (mappings) { toCreate.Mappings = mappings; }
			if (hostHint) { toCreate.HostHint = hostHint; }
			return dojo.xhrPost({
				url: this._siteUrl,
				postData: dojo.toJson(toCreate),
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				error: function(response, ioArgs) {
					console.error("HTTP status code: ", ioArgs.xhr.status);
					handleGetAuthenticationError(this, ioArgs);
					return response;
				}
			});
		},
		
		/**
		 * Performs a start or stop action on a site configuration.
		 * @param {String} id
		 * @param {String} action
		 * @returns {dojo.Deferred} A deferred for the result. Will be resolved with the 
		 * changed {SiteConfiguration} on success.
		 */
		startStopSiteConfiguration: function(id, action) {
			return dojo.xhrPost({
				url: this._siteUrl + "/" + id,
				headers: {
					"Orion-Version": "1",
					"X-Action": action
				},
				handleAs: "json",
				timeout: 15000,
				error: function(response, ioArgs) {
					console.error("HTTP status code: ", ioArgs.xhr.status);
					handleGetAuthenticationError(this, ioArgs);
					return response;
				}
			});
		},
		
		/**
		 * Edits an existing site configuration.
		 * @param id
		 * @param updatedSiteConfig
		 * @returns {dojo.Deferred} A deferred for the result. Will be resolved with the updated
		 * {SiteConfiguration} on success.
		 */
		updateSiteConfiguration: function(id, updatedSiteConfig) {
			return dojo.xhrPut({
				url: this._siteUrl + "/" + id,
				putData: dojo.toJson(updatedSiteConfig),
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				error: function(response, ioArgs) {
					console.error("HTTP status code: ", ioArgs.xhr.status);
					handleGetAuthenticationError(this, ioArgs);
					return response;
				}
			});
		},
		
		/**
		 * Deletes a site configuration.
		 * @param id
		 * @returns {dojo.Deferred} A deferred for the result. Will be resolved with no argument on success.
		 */
		deleteSiteConfiguration: function(id) {
			return dojo.xhrDelete({
				url: this._siteUrl + "/" + id,
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				error: function(response, ioArgs) {
					console.error("HTTP status code: ", ioArgs.xhr.status);
					handleGetAuthenticationError(this, ioArgs);
					return response;
				}
			});
		}
	};
	return SiteService;
}());
