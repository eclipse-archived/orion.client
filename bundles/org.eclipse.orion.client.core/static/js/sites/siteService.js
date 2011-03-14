/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global dojo eclipse handleAuthenticationError */
/*jslint devel:true*/

dojo.getObject("eclipse.sites", true);

/**
 * @name eclipse.sites.SITE_SERVICE_NAME
 * @property Constant used to identify the site service name.
 */
eclipse.sites.SITE_SERVICE_NAME = "org.eclipse.orion.sites.siteManagement";

// requires: auth.js
eclipse.sites.SiteService = (function() {
	/**
	 * Constructs a new SiteService.
	 * 
	 * @name eclipse.sites.SiteService
	 * @class Defines and implements a service that provides access to the server API for managing site 
	 * configurations.
	 * @param serviceRegistry {eclipse.ServiceRegistry} The service registry to register ourself with.
	 */
	function SiteService(serviceRegistry) {
		this._serviceRegistration = serviceRegistry.registerService(eclipse.sites.SITE_SERVICE_NAME, this);
	}
	SiteService.prototype = /** @lends eclipse.sites.SiteService.prototype */ {
		/**
		 * Gets all site configurations defined by the logged-in user.
		 * @returns {dojo.Deferred} A deferred for the result. Will be resolved with the 
		 * argument {SiteConfiguration[]} on success.
		 */
		getSiteConfigurations: function() {
			return this._doServiceCall("getSiteConfigurations", arguments);
		},
		
		/**
		 * Loads an individual site configuration from the given location.
		 * @param {String} Location URI of a site configuration resource.
		 * @returns {dojo.Deferred} A deferred for the result. Will be resolved with the 
		 * loaded {SiteConfiguration} on success.
		 */
		loadSiteConfiguration: function(locationUrl) {
			return this._doServiceCall("loadSiteConfiguration", arguments);
		},
		
		/**
		 * Creates a site configuration.
		 * @param {String} name
		 * @param {String} workspace
		 * @param {Object} [mappings]
		 * @param {String} [hostHint]
		 * @returns {dojo.Deferred} A deferred for the result. Will be resolved with the 
		 * created {SiteConfiguration} as argument on success.
		 */
		createSiteConfiguration: function(name, workspace, mappings, hostHint) {
			return this._doServiceCall("createSiteConfiguration", arguments);
		},
		
		/**
		 * Performs a start or stop action on a site configuration.
		 * @param {String} id
		 * @param {String} action
		 * @returns {dojo.Deferred} A deferred for the result. Will be resolved with the 
		 * changed {SiteConfiguration} on success.
		 */
		startStopSiteConfiguration: function(id, action) {
			return this._doServiceCall("startStopSiteConfiguration", arguments);
		},
		
		/**
		 * Edits an existing site configuration.
		 * @param id
		 * @param updatedSiteConfig
		 * @returns {dojo.Deferred} A deferred for the result. Will be resolved with the updated
		 * {SiteConfiguration} on success.
		 */
		updateSiteConfiguration: function(id, updatedSiteConfig) {
			return this._doServiceCall("updateSiteConfiguration", arguments);
		},
		
		/**
		 * Deletes a site configuration.
		 * @param id
		 * @returns {dojo.Deferred} A deferred for the result. Will be resolved with no argument on success.
		 */
		deleteSiteConfiguration: function(id) {
			return this._doServiceCall("deleteSiteConfiguration", arguments);
		},
		
		/**
		 * @private
		 */
		_serviceImpl : {
			getSiteConfigurations: function() {
				return dojo.xhrGet({
					url: "/site",
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
			createSiteConfiguration: function(name, workspace, mappings, hostHint) {
				var toCreate = {
						Name: name,
						Workspace: workspace
					};
				if (mappings) { toCreate.Mappings = mappings; }
				if (hostHint) { toCreate.HostHint = hostHint; }
				return dojo.xhrPost({
					url: "/site",
					postData: dojo.toJson(toCreate),
					headers: {
						"Content-Type": "application/json; charset=utf-8",
						"Orion-Version": "1"
					},
					handleAs: "json",
					timeout: 15000
				});
			},
			startStopSiteConfiguration: function(id, action) {
				return dojo.xhrPost({
					url: "/site/" + id,
					headers: {
						"Content-Type": "application/json, charset=utf-8",
						"Orion-Version": "1",
						"X-Action": action
					},
					handleAs: "json",
					timeout: 15000
				});
			},
			updateSiteConfiguration: function(id, updatedSiteConfig) {
				return dojo.xhrPut({
					url: "/site/" + id,
					putData: dojo.toJson(updatedSiteConfig),
					headers: {
						"Content-Type": "application/json; charset=utf-8",
						"Orion-Version": "1"
					},
					handleAs: "json",
					timeout: 15000
				});
			},
			deleteSiteConfiguration: function(id) {
				return dojo.xhrDelete({
					url: "/site/" + id,
					headers: {
						"Orion-Version": "1"
					},
					handleAs: "json",
					timeout: 15000
				});
			}
		},
		
		/**
		 * Performs a service call, handling authentication and retrying after auth.
		 * @private
		 * @returns {dojo.Deferred}
		 */
		_doServiceCall: function(methodName, args) {
			var service = this._serviceImpl;
			var serviceMethod = this._serviceImpl[methodName];
			var clientDeferred = new dojo.Deferred();
			
			// On success, just forward the result to the client
			var onSuccess = function(result) {
				clientDeferred.callback(result);
			};
			
			// On failure we might need to retry
			var onError = function(error) {
				if (error.status === 401 || error.status === 403) {
					handleAuthenticationError(error, function(message) {
						// Try again
						serviceMethod.apply(service, args).then(
							function(result) {
								clientDeferred.callback(result);
							},
							function(error) {
								clientDeferred.errback(error);
							}
						);
					});
				} else {
					// Forward other errors to client
					clientDeferred.errback(error);
				}
			};
			
			serviceMethod.apply(service, args).then(onSuccess, onError);
			return clientDeferred;
		}
	};
	return SiteService;
}());
