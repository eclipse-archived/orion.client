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

define(['dojo', 'orion/auth'], function(dojo, mAuth) {

/**
 * Service id used for registering the site service with the service registry.
 * @name orion.siteService#SITE_SERVICE_NAME
 * @constant
 * @see orion.serviceregistry.ServiceRegistry#registerService
 */
var SITE_SERVICE_NAME = "org.eclipse.orion.sites.siteManagement";

/**
 * @name orion.siteService.SiteConfiguration
 * @class Interface for an in-memory representation of a site configuration resource. Objects of
 * this interface are used as parameters, and returned by, methods of the  {@link orion.siteService.SiteService}
 * API.
 */
	/**#@+
		@fieldOf orion.siteService.SiteConfiguration.prototype
	*/
	/**
	 * The name of the site configuration.
	 * @name Name
	 * @type String
	 */
	/**
	 * The workspace id that this site configuration is associated with.
	 * @name Workspace
	 * @type String
	 */
	/**
	 * The mappings defined by this site configuration. Each element has the properties 
	 * <code>Source</code> and <code>Target</code>, both of type {@link String}. 
	 * @name Mappings
	 * @type Array
	 */
	/**
	 * Optional: A hint used to derive the domain name when the site is launched as a subdomain. 
	 * @name HostHint
	 * @type String
	 */
	/**
	 * Gives information about the status of this site configuration. Has the following properties:<ul>
	 * <li>{String} <code>Status</code> Status of this site. Value is either <code>"started"</code> or <code>"stopped"</code>.</li>
	 * <li>{String} <code>URL</code> Optional, gives the URL where the running site can be accessed. Only present
	 * if the <code>Status</code> is <code>"started"</code>.</li>
	 * </ul>
	 * @name HostingStatus
	 * @type Object
	 */
	/**#@-*/

	
	/**
	 * Constructs a new SiteService.
	 * 
	 * @name orion.siteService.SiteService
	 * @class Defines and implements a service that provides access to the server API for managing site 
	 * configurations.
	 * @requires auth.js
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry The service registry to register ourself with.
	 */
	function SiteService(serviceRegistry) {
		this._serviceRegistration = serviceRegistry.registerService(SITE_SERVICE_NAME, this);
	}
	
	SiteService.prototype = /** @lends orion.siteService.SiteService.prototype */ {
		/**
		 * Retrieves all site configurations defined by the logged-in user.
		 * @returns {dojo.Deferred} A deferred for the result. Will be resolved with the 
		 * argument {@link Array} on success, where each element of the array is a
		 * {@link eclipse.sites.SiteConfiguration}.
		 */
		getSiteConfigurations: function() {
			return this._doServiceCall("getSiteConfigurations", arguments);
		},
		
		/**
		 * Loads an individual site configuration from the given location.
		 * @param {String} Location URL of a site configuration resource.
		 * @returns {dojo.Deferred} A deferred for the result. Will be resolved with the 
		 * loaded {@link eclipse.sites.SiteConfiguration} on success.
		 */
		loadSiteConfiguration: function(locationUrl) {
			return this._doServiceCall("loadSiteConfiguration", arguments);
		},
		
		/**
		 * Creates a site configuration.
		 * @param {String} name
		 * @param {String} workspace
		 * @param {Array} [mappings]
		 * @param {String} [hostHint] 
		 * @returns {dojo.Deferred} A deferred for the result. Will be resolved with the 
		 * created {@link eclipse.sites.SiteConfiguration} on success.
		 */
		createSiteConfiguration: function(name, workspace, mappings, hostHint) {
			return this._doServiceCall("createSiteConfiguration", arguments);
		},
		
		/**
		 * Edits an existing site configuration.
		 * @param {String} locationUrl Location of the site configuration resource to be updated.
		 * @param {eclipse.sites.SiteConfiguration} updatedSiteConfig A representation of the updated site.
		 * Properties that are not changing may be omitted.
		 * @returns {dojo.Deferred} A deferred for the result. Will be resolved with the updated
		 * {@link eclipse.sites.SiteConfiguration} on success.
		 */
		updateSiteConfiguration: function(locationUrl, updatedSiteConfig) {
			return this._doServiceCall("updateSiteConfiguration", arguments);
		},
		
		/**
		 * Deletes a site configuration.
		 * @param {String} locationUrl Location of the site configuration resource to be deleted.
		 * @returns {dojo.Deferred} A deferred for the result. Will be resolved with no argument on success.
		 */
		deleteSiteConfiguration: function(locationUrl) {
			return this._doServiceCall("deleteSiteConfiguration", arguments);
		},
		
		/**
		 * @private
		 */
		_serviceImpl : {
			getSiteConfigurations: function() {
				return dojo.xhrGet({
					url: "/site",
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
			updateSiteConfiguration: function(locationUrl, updatedSiteConfig) {
				return dojo.xhrPut({
					url: locationUrl,
					putData: dojo.toJson(updatedSiteConfig),
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
					mAuth.handleAuthenticationError(error, function(message) {
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
	SiteService.prototype.constructor = SiteService;

	//return module exports
	return {
		SITE_SERVICE_NAME: SITE_SERVICE_NAME,
		SiteService: SiteService
	};
});
