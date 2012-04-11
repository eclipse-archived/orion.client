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

/*global define document window*/
/*jslint devel:true regexp:false*/

define(['require', 'dojo', 'orion/auth'], function(require, dojo, mAuth) {

// Service id used for registering or obtaining the site service.
var SERVICE_ID = "orion.sites";

/**
 * @name orion.sites.SiteConfiguration
 * @class Interface for an in-memory representation of a site configuration resource. Objects of
 * this interface are used as parameters, and returned by, methods of the  {@link orion.sites.SiteService}
 * API.
 */
	/**#@+
		@fieldOf orion.sites.SiteConfiguration.prototype
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
	 * @name orion.sites.SiteService
	 * @class Defines and implements a service that provides access to the server API for managing site 
	 * configurations.
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry The service registry to register ourself with.
	 */
	function SiteService(serviceRegistry) {
		this._serviceRegistration = serviceRegistry.registerService(SERVICE_ID, this);
		
		var baseUrl = this.getContext();
		var fileReferences = serviceRegistry.getServiceReferences("orion.core.file");
		for (var i=0; i < fileReferences.length; i++) {
			var top = fileReferences[i].getProperty("top");
			if (top && this.toFullUrl(top).indexOf(baseUrl) === 0) {
				this.filePrefix = top;
				break;
			}
		}
	}
	
	SiteService.prototype = /** @lends orion.sites.SiteService.prototype */ {
		/**
		 * Retrieves all site configurations defined by the logged-in user.
		 * @returns {dojo.Deferred} A deferred for the result. Will be resolved with the 
		 * argument {@link Array} on success, where each element of the array is a
		 * {@link orion.sites.SiteConfiguration}.
		 */
		getSiteConfigurations: function() {
			return this._doServiceCall("getSiteConfigurations", arguments);
		},
		
		/**
		 * Loads an individual site configuration from the given location.
		 * @param {String} locationUrl Location URL of a site configuration resource.
		 * @returns {dojo.Deferred} A deferred for the result. Will be resolved with the 
		 * loaded {@link orion.sites.SiteConfiguration} on success.
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
		 * created {@link orion.sites.SiteConfiguration} on success.
		 */
		createSiteConfiguration: function(name, workspace, mappings, hostHint) {
			return this._doServiceCall("createSiteConfiguration", arguments);
		},
		
		/**
		 * Edits an existing site configuration.
		 * @param {String} locationUrl Location of the site configuration resource to be updated.
		 * @param {orion.sites.SiteConfiguration} updatedSiteConfig A representation of the updated site.
		 * Properties that are not changing may be omitted.
		 * @returns {dojo.Deferred} A deferred for the result. Will be resolved with the updated
		 * {@link orion.sites.SiteConfiguration} on success.
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
				//NOTE: require.toURL needs special logic here to handle "site"
				var siteUrl = require.toUrl("site._");
				siteUrl = siteUrl.substring(0,siteUrl.length-2);
				return dojo.xhrGet({
					url: siteUrl,
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
			/**
			 * @param {String} name
			 * @param {String} workspaceId
			 * @param {Object} [mappings]
			 * @param {String} [hostHint]
			 * @param {String} [status]
			 */
			createSiteConfiguration: function(name, workspaceId, mappings, hostHint, hostingStatus) {
				function hostify(name) {
					return name.replace(/ /g, "-").replace(/[^A-Za-z0-9-_]/g, "").toLowerCase();
				}
				var toCreate = {
						Name: name,
						Workspace: workspaceId,
						HostHint: hostify(name)
					};
				if (mappings) { toCreate.Mappings = mappings; }
				if (hostHint) { toCreate.HostHint = hostHint; }
				if (hostingStatus) { toCreate.HostingStatus = hostingStatus; }

				//NOTE: require.toURL needs special logic here to handle "site"
				var siteUrl = require.toUrl("site._");
				siteUrl = siteUrl.substring(0,siteUrl.length-2);
				return dojo.xhrPost({
					url: siteUrl,
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
		},
		
		_makeHostRelative: function(url) {
			if (url.indexOf(":") !== -1) {
				return url.substring(url.indexOf(window.location.host) + window.location.host.length);
			}
			return url;
		},
		
		getContext: function() {
			var root = require.toUrl("._");
			var url = this.toFullUrl(root);
			return url.substring(0, url.length-2);
		},
		
		toFullUrl: function(url) {
			var link = document.createElement("a");
			link.href = url;
			return link.href;
		},
		
		makeRelativeFilePath: function(location) {
//			var context = this.getContext();
//			var fakeUrl = this._makeHostRelative(context);
//			var relativePath = location.substring(location.indexOf(fakeUrl) + fakeUrl.length);
//			var path = relativePath.substring(relativePath.indexOf(this.filePrefix) + this.filePrefix.length);
			var relFilePrefix = this._makeHostRelative(this.filePrefix);
			var relLocation = this._makeHostRelative(location);
			var path;
			if (relLocation.indexOf(relFilePrefix) === 0) {
				path = relLocation.substring(relFilePrefix.length);
			}
			if (path[path.length-1] === "/"){
				path = path.substring(0, path.length - 1);
			}
			return path;
		},
		
		makeFullFilePath: function(target) {
			function _removeEmptyElements(array) {
				return dojo.filter(array, function(s){return s !== "";});
			}
			var relativePath = require.toUrl(this.filePrefix + target + "._");
			relativePath = relativePath.substring(0, relativePath.length - 2);
			var segments = target.split("/");
			if (_removeEmptyElements(segments).length === 1) {
				relativePath += "/";
			}
			return this.toFullUrl(relativePath);
		}
	};
	SiteService.prototype.constructor = SiteService;

	//return module exports
	return {
		SERVICE_ID: SERVICE_ID,
		SiteService: SiteService
	};
});
