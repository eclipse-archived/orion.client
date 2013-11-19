/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define*/
define(['require', 'orion/xhr', 'orion/Deferred', 'orion/operation'], function(require, xhr, Deferred, operation) {

	var eclipse = eclipse || {};
	
	eclipse.CFService = (function(){
		
		/**
		 * Creates a new CF service.
		 * 
		 * @class Provides operations for interacting with Cloud Foundry
		 * @name org.eclipse.orion.client.cf.CFService
		 */
		function CFService(serviceRegistry) {
			if (serviceRegistry) {
				this._serviceRegistry = serviceRegistry;
				this._serviceRegistration = serviceRegistry.registerService(
						"orion.cf.service", this);
			}
		}
	
		CFService.prototype = /** @lends org.eclipse.orion.client.cf.CFService.prototype */
		{	
			_getServiceResponse : function(deferred, result) {
				var response = result.response ? JSON.parse(result.response) : null;

				if (result.xhr && result.xhr.status === 202) {
					var def = operation.handle(response.Location);
					def.then(function(data) {
						try {
							deferred.resolve(JSON.parse(data));
						} catch (e) {
							deferred.resolve(data);
						}
					}, function(data) {
						data.failedOperation = response.Location;
						deferred.reject(data);
					}, deferred.progress);
					deferred.then(null, function(error) {
						def.reject(error);
					});
					return;
				}
				deferred.resolve(response);
				return;
			},
				
			_handleServiceResponseError: function(deferred, error){
				deferred.reject(error);
			},

			_xhr : function(method, url) {
				var self = this;
				var clientDeferred = new Deferred();

				xhr(method, url, { headers : { "Orion-Version" : "1",
				"Content-Type" : contentType
				},
				timeout : 15000,
				handleAs : "json"
				}).then(function(result) {
					self._getServiceResponse(clientDeferred, result);
				}, function(error) {
					self._handleServiceResponseError(clientDeferred, error);
				});

				return clientDeferred;
			},
		
			getTarget: function(targetName) {
				var targetLocation = require.toUrl("jazz/Project");
				return this._xhrV2("GET", targetLocation + (targetName ? "/" + targetName : ""));
			},
			
//			setTarget: function(url, token) {
//				var self = this;
//				return self._xhr("POST", require.toUrl("cf/target"), {URL: url, 'token': token}, 240000);
//			}
		};
		
		return CFService;
	}());
	
	return eclipse;
});