/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*eslint-env browser, amd*/
define(['i18n!cfui/nls/messages', 'require', 'orion/xhr', 'orion/Base64', 'orion/Deferred', 'orion/operation'], 
	function(messages, require, xhr, Base64, Deferred, operation) {

	var eclipse = eclipse || {};

	eclipse.CFLauncherService = (function(){

		var contentType = "application/json; charset=UTF-8";

		/**
		 * Creates a new CF Launcher service.
		 *
		 * @class Provides operations for interacting with CF Launcher
		 * @name org.eclipse.orion.client.cf.CFLauncherService
		 */
		function CFLauncherService(serviceRegistry) {
			if (serviceRegistry) {
				this._serviceRegistry = serviceRegistry;
				this._serviceRegistration = serviceRegistry.registerService(
						"orion.cflauncher.service", this);
			}
		}

		CFLauncherService.prototype = /** @lends org.eclipse.orion.client.cf.CFLauncherService.prototype */
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
				deferred.reject(this._translateResponseToStatus(error));
			},

			_translateResponseToStatus: function(response) {
				var json;
				try {
					json = JSON.parse(response.responseText);
				} catch (e) {
					json = {
						Message : messages["problemWhilePerformingTheAction"]
					};
				}
				json.HttpCode = response.status;
				return json;
			},
			

			_str2ab : function(str) {
				var array = [];
				for (var i = 0, j = str.length; i < j; ++i) {
					array.push(str.charCodeAt(i));
				}
				return new Uint8Array(array);
			},

			_xhrV1 : function(method, url, data, password) {
				var self = this;
				var clientDeferred = new Deferred();

				xhr(method, url, { headers : {
					"Origin" : "https://beta3.hub.jazz.net",
					"Content-Type" : contentType,
					"Authorization": "Basic " + Base64.encode(self._str2ab("vcap:" + password))
				},
				timeout : 15000,
				handleAs : "json",
				data : JSON.stringify(data)
				}).then(function(result) {
					self._getServiceResponse(clientDeferred, result);
				}, function(error) {
					self._handleServiceResponseError(clientDeferred, error);
				});

				return clientDeferred;
			},

			getApp: function(url, password) {
				if (!url.endsWith("/"))
					url += "/";
				url += "launcher/apps/target";
				
				return this._xhrV1("GET", url, undefined, "holydiver");
			},

			startApp: function(url, password) {
				if (!url.endsWith("/"))
					url += "/";
				url += "launcher/apps/target";
				var startReq = {
					state: "debug"
				};

				return this._xhrV1("PUT", url, startReq, "holydiver");
			},
			
			stopApp: function(url, password) {
				if (!url.endsWith("/"))
					url += "/";
				url += "launcher/apps/target";
				var startReq = {
					state: "stop"
				};

				return this._xhrV1("PUT", url, startReq, "holydiver");
			}
		};

		return CFLauncherService;
	}());

	return eclipse;
});
