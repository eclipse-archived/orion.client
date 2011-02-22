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

var sites = dojo.getObject("eclipse.sites", true);

/**
 * @name eclipse.sites.SITE_SERVICE_NAME
 * @property Constant used to identify the site service name.
 */
sites.SITE_SERVICE_NAME = "org.eclipse.orion.sites.siteManagement";

// TODO call authentication as a service
sites.SiteService = (function() {
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
		 * @return {dojo.Deferred} A future for the result. Future will be resolved with the 
		 * argument {SiteConfiguration[]}.
		 */
		getSiteConfigurations: function() {
			return dojo.xhrGet({
					url: this._siteUrl,
					headers: {
						"Orion-Version": "1"
					},
					handleAs: "json",
					timeout: 5000,
					error: function(response, ioArgs) {
						console.error("HTTP status code: ", ioArgs.xhr.status);
						handleGetAuthenticationError(this, ioArgs);
						return response;
					}
				}).then(function(response) {
					return response.SiteConfigurations;
				});
		},
		
		getSiteConfiguration: function(id) {
			
		},
		
		createSiteConfiguration: function() {
			
		},
		
		updateSiteConfiguration: function() {
			
		},
		
		deleteSiteConfiguration: function() {
			
		}
	};
	return SiteService;
}());
