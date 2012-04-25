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

/*global define document window*/
define(['require', 'orion/Deferred', 'orion/auth', 'orion/fileClient'], function(require, Deferred, mAuth, mFileClient) {
	/**
	 * Performs a service call, handling authentication and retrying after auth.
	 * @returns {Promise}
	 */
	function _doServiceCall(service, methodName, args) {
		var serviceMethod = service[methodName];
		var clientDeferred = new Deferred();
		if (typeof serviceMethod !== 'function') {
			throw 'Service method missing: ' + methodName;
		}
		// On success, just forward the result to the client
		var onSuccess = function(result) {
			clientDeferred.resolve(result);
		};
		
		// On failure we might need to retry
		var onError = function(error) {
			if (error.status === 401 || error.status === 403) {
				mAuth.handleAuthenticationError(error, function(message) {
					// Try again
					serviceMethod.apply(service, args).then(
						function(result) {
							clientDeferred.resolve(result);
						},
						function(error) {
							clientDeferred.reject(error);
						}
					);
				});
			} else {
				// Forward other errors to client
				clientDeferred.reject(error);
			}
		};
		serviceMethod.apply(service, args).then(onSuccess, onError);
		return clientDeferred;
	}

	function getFileClient(serviceRegistry, filePattern) {
		return new mFileClient.FileClient(serviceRegistry, function(reference) {
			var top = reference.getProperty("top");
			return top && top.indexOf(filePattern) === 0;
		});
	}

	/**
	 * Constructs a new SiteClient.
	 * @name orion.sites.SiteClient
	 */
	function SiteClient(serviceRegistry, siteService, sitePattern, filePattern) {
		this._serviceRegistry = serviceRegistry;
		this._siteService = siteService;
		this._sitePattern = sitePattern;
		this._filePattern = filePattern;

		this._getService = function() {
			return this._siteService;
		};
		this._getFilePattern = function() {
			return this._filePattern;
		};
		this._getFileClient = function() {
			return getFileClient(this._serviceRegistry, this._getFilePattern());
		};
	}
	SiteClient.prototype = {
		createSiteConfiguration: function() {
			return _doServiceCall(this._getService(), 'createSiteConfiguration', Array.prototype.slice.call(arguments));
		},
		getSiteConfigurations: function() {
			return _doServiceCall(this._getService(), 'getSiteConfigurations', Array.prototype.slice.call(arguments));
		},
		deleteSiteConfiguration: function(location) {
			return _doServiceCall(this._getService(), 'deleteSiteConfiguration', Array.prototype.slice.call(arguments));
		},
		loadSiteConfiguration: function(location) {
			return _doServiceCall(this._getService(), 'loadSiteConfiguration', Array.prototype.slice.call(arguments));
		},
		updateSiteConfiguration: function(location) {
			return _doServiceCall(this._getService(), 'updateSiteConfiguration', Array.prototype.slice.call(arguments));
		},
		toFileLocation: function(internalForm) {
			return _doServiceCall(this._getService(), 'toFileLocation', Array.prototype.slice.call(arguments));
		},
		toInternalForm: function(filePath) {
			return _doServiceCall(this._getService(), 'toInternalForm', Array.prototype.slice.call(arguments));
		},
		toDisplayString: function() {
			return _doServiceCall(this._getService(), 'getURLOnSite', Array.prototype.slice.call(arguments));
		},
		getMappingObject: function(site, fileLocation, virtualPath) {
			return _doServiceCall(this._getService(), 'getMappingObject', Array.prototype.slice.call(arguments));
		},
		// TODO review the methods below
		getURLOnSite: function(site, file) {
			return _doServiceCall(this._getService(), 'getURLOnSite', Array.prototype.slice.call(arguments));
		},
		isFileMapped: function(site, file) {
			return _doServiceCall(this._getService(), 'isFileMapped', Array.prototype.slice.call(arguments));
		},
		mapOnSiteAndStart: function(site, file, workspaceId) {
			return _doServiceCall(this._getService(), 'mapOnSiteAndStart', Array.prototype.slice.call(arguments));
		},
		isSelfHosting: function(site) {
			return _doServiceCall(this._getService(), 'isSelfHosting', Array.prototype.slice.call(arguments));
		},
		getSelfHostingMappings: function(site, basePath) {
			return _doServiceCall(this._getService(), 'getSelfHostingMappings', Array.prototype.slice.call(arguments));
		}
	};
	SiteClient.prototype.constructor = SiteClient;

	function forLocation(serviceRegistry, location) {
		var siteReferences = serviceRegistry.getServiceReferences('orion.site');
		var references = [];
		var patterns = [];
		var services = [];
		for (var i=0; i < siteReferences.length; i++) {
			var pattern = siteReferences[i].getProperty('pattern');
			var patternEpxr;
			if (pattern[0] !== '^') {
				patternEpxr = '^' + pattern;
			} else {
				patternEpxr = pattern;
			}
			references.push(siteReferences[i]);
			patterns.push(new RegExp(patternEpxr));
			services.push(serviceRegistry.getService(siteReferences[i]));
		}

		var getServiceIndex = function(location) {
			if (location === '/') {
				return -1;
			} else if (!location || (location.length && location.length === 0)) {
				return 0;
			}
			for (var i=0; i < patterns.length; i++) {
				if (patterns[i].test(location)) {
					return i;
				}
			}
			throw 'No Matching SiteService for location: ' + location;
		};
		var serviceIndex = getServiceIndex(location);
		var service = services[serviceIndex];
		var serviceRef = references[serviceIndex];
		return new SiteClient(serviceRegistry, service, serviceRef.getProperty('sitePattern'), serviceRef.getProperty('filePattern'));
	}

	/**
	 * @name orion.sites.SiteConfiguration
	 * @class Interface for an in-memory representation of a site configuration resource. Objects of this
	 * interface are used as parameters, and returned by, methods of the  {@link orion.sites.SiteService} API.
	 * @property {String} Name The name of the site configuration.
	 * @property {String} Workspace The workspace id that this site configuration is associated with.
	 * @property {Array} Mappings The mappings defined by this site configuration. Each element has the properties 
	 * <code>Source</code> and <code>Target</code>, both of type {@link String}. 
	 * @property {String} [HostHint] A hint used to derive the domain name when the site is launched as a subdomain. 
	 * @property {Object} HostingStatus Gives information about the status of this site configuration. Has the following properties:
	 * <ul>
	 * <li>{String} <code>Status</code> Status of this site. Value is either <code>'started'</code> or <code>'stopped'</code>.</li>
	 * <li>{String} <code>URL</code> Optional, gives the URL where the running site can be accessed. Only present
	 * if the <code>Status</code> is <code>'started'</code>.</li>
	 * </ul>
	 */

	/**
	 * @name orion.sites.SiteService
	 * @class Interface for a service that manages site configurations.
	 */
	/**#@+
	 * @methodOf orion.sites.SiteService.prototype
	 */
		/**
		 * Creates a site configuration.
		 * @name createSiteConfiguration
		 * @param {String} name
		 * @param {String} workspace
		 * @param {Array} [mappings]
		 * @param {String} [hostHint] 
		 * @returns {Promise} A promise for the result. Will be resolved with the created {@link orion.sites.SiteConfiguration} on success.
		 */
		/**
		 * Deletes a site configuration.
		 * @name deleteSiteConfiguration
		 * @param {String} locationUrl Location of the site configuration resource to be deleted.
		 * @returns {Promise} A promise for the result. Will be resolved with no argument on success.
		 */
		/**
		 * Retrieves all site configurations defined by the logged-in user.
		 * @name getSiteConfigurations
		 * @returns {Promise} A promise for the result. Will be resolved with the argument {@link Array} on success, 
		 * where each element of the array is a {@link orion.sites.SiteConfiguration}.
		 */
		/**
		 * Loads an individual site configuration from the given location.
		 * @name loadSiteConfiguration
		 * @param {String} locationUrl Location URL of a site configuration resource.
		 * @returns {Promise} A promise for the result. Will be resolved with the loaded {@link orion.sites.SiteConfiguration} on success.
		 */
		/**
		 * Edits an existing site configuration.
		 * @name updateSiteConfiguration
		 * @param {String} locationUrl Location of the site configuration resource to be updated.
		 * @param {orion.sites.SiteConfiguration} updatedSiteConfig A representation of the updated site. Properties that are not changing
		 * may be omitted.
		 * @returns {Promise} A promise for the result. Will be resolved with the updated {@link orion.sites.SiteConfiguration} on success.
		 */
		 // TODOC getURLOnSite isFileMapped toFileLocation toInternalForm mapOnSite isSelfHosting getSelfHostingMappings
	/**#@-*/

	return {
		forLocation: forLocation,
		getFileClient: getFileClient,
		SiteClient: SiteClient
	};
});
