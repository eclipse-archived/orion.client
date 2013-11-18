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
		 * @name com.ibm.cloudoe.cf.CFService
		 */
		function CFService(serviceRegistry) {
			if (serviceRegistry) {
				this._serviceRegistry = serviceRegistry;
				this._serviceRegistration = serviceRegistry.registerService(
						"com.ibm.cloudoe.cf.service", this);
			}
		}
	
		CFService.prototype = /** @lends com.ibm.cloudoe.cf.CFService.prototype */
		{	
			_getServiceResponse: function(deferred, result){
				var self = this;
				var response =  result.response ? JSON.parse(result.response) : null;
				if (response && response instanceof Array) {
					response = self._parseNestedJson(response);
				}
				if (result.xhr && result.xhr.status === 202) {
					var def = operation.handle(response.Location);
					def.then(
						deferred.resolve, 
						function(data) {
							data.failedOperation = response.Location;
							deferred.reject(data);
						}, 
						deferred.progress
					);
					deferred.then(null, function(error){def.reject(error);});
					return;
				}
				deferred.resolve(response);
				return;
			},
			
			_handleServiceResponseError: function(deferred, error){
				deferred.reject(error);
			},
			
			_xhr: function(method, url, data, timeout){
				var self = this;
				var d = new Deferred();
				
				xhr(method, url, { 
					headers : { 
						"Orion-Version" : "1"
					},
					data : data ? JSON.stringify(data) : null,
					timeout : timeout ? timeout : 15000,
					handleAs : "json"
				}).then(function(result) {
					self._getServiceResponse(d, result);
				}, function(error){
					self._handleServiceResponseError(d, error);
				});
	
				return d;
			},
			
			_parseNestedJson: function(arr) {
				if (!arr) {
					return null;
				}
				var result = [];
				if (arr.every(function (item) {
					if (typeof item === "string") {
						try {
							result.push(JSON.parse(item));
							return true;
						} catch(e){}
					}
					return false;
				})) {
					return result;
				}
				return arr;
			},	
		
			getTarget: function() {
				var self = this;
				return self._xhr("GET", require.toUrl("cf/target"), null, 120000);
			},
			
			setTarget: function(url, token) {
				var self = this;
				return self._xhr("POST", require.toUrl("cf/target"), {URL: url, 'token': token}, 240000);
			},
			
//			register: function(user, password) {
//				var self = this;
//				return self._xhr("POST", require.toUrl("cf/users"), {email: user, 'password': password});
//			},
//			login: function(email, password, organization, space) {
//				var self = this;
//				return self._xhr("POST", require.toUrl("cf/login"), 
//					{'email': email, 'password': password, 'organization': organization, 'space': space},
//					15000);
//			},
//			loginUsingToken: function(token) {
//				var self = this;
//				return self._xhr("POST", require.toUrl("cf/login"), 
//					{'token': token},
//					15000);
//			},
//			logout: function() {
//				var self = this;
//				return self._xhr("POST", require.toUrl("cf/logout"));
//			},
//			getInfo: function() {
//				var self = this;
//				return self._xhr("GET", require.toUrl("cf/info"));
//			},
//			getApplications: function() {
//				var self = this;
//				return self._xhr("GET", require.toUrl("cf/apps"));
//			},
//			getApplication: function(application, dir) {
//				var self = this;
//				var url = require.toUrl("cf/app");
//				if (application) {
//					url += "/" + application;
//				}
//				if (dir) {
//					url += "?location=" + dir;
//				}
//				return self._xhr("GET", url);
//			},
//			getLogs: function(application, dir) {
//				var self = this;
//				var url = require.toUrl("cf/logs");
//				if (application) {
//		           url += "?app=" + application;
//				} else if (dir) {
//		           url += "?location=" + dir;
//		        }
//				return self._xhr("GET", url, null, 30000);
//			},
//			startApplication: function(application, dir) {
//				var self = this;
//				return self._xhr("POST", require.toUrl("cf/start"), {app: application, location: dir}, 240000);
//			},
//			stopApplication: function(application, dir) {
//				var self = this;
//				return self._xhr("POST", require.toUrl("cf/stop"), {app: application, location: dir}, 240000);
//			},
//			restartApplication: function(application, dir) {
//				var self = this;
//				return self._xhr("POST", require.toUrl("cf/restart"), {app: application, location: dir}, 240000);
//			},
//			pushApplication: function(application, dir) {
//				var self = this;
//				return self._xhr("POST", require.toUrl("cf/push"), {app: application, location: dir}, 240000);
//			},
//			deleteApplication: function(application, dir) {
//				var self = this;
//				return self._xhr("POST", require.toUrl("cf/delete"), {app: application, location: dir}, 240000);
//			},
//			changePassword: function(newPassword) {
//				var self = this;
//				return self._xhr("PUT", require.toUrl("cf/users"), {password: newPassword}, 240000);
//			},
//			getServices: function() {
//				var self = this;
//				return self._xhr("GET", require.toUrl("cf/services"));
//			},
//			getService: function(instanceName) {
//				var self = this;
//				return self._xhr("GET", require.toUrl("cf/services/") + instanceName);
//			},
//			createService: function(instanceName, service, version) {
//				var self = this;
//				return self._xhr("POST", require.toUrl("cf/services"), {name: instanceName, 'service': service, 'version': version});
//			},
//			deleteService: function(instanceName) {
//				var self = this;
//				return self._xhr("DELETE", require.toUrl("cf/services/") + instanceName);
//			},
//			bindService: function(instanceName, application) {
//				var self = this;
//				var url = require.toUrl("cf/app/") + application + "/services";
//				return self._xhr("POST", url, {service: instanceName});
//			},
//			unbindService: function(instanceName, application) {
//				var self = this;
//				var url = require.toUrl("cf/app/") + application + "/services/" + instanceName;
//				return self._xhr("DELETE", url);
//			},
//			getSpaces: function() {
//				var self = this;
//				return self._xhr("GET", require.toUrl("cf/spaces"));
//			}
		};
		
		return CFService;
	}());
	
	return eclipse;
});