/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define escape */
define(["orion/Deferred", "orion/xhr"], function(Deferred, xhr) {
	function formEncode(value) {
		return encodeURIComponent(value).replace(/[!'()*]/g, escape).replace('%20', '+'); //$NON-NLS-0$ //$NON-NLS-1$
	}

	/**
	 * @returns The map as application/x-www-form-urlencoded data.
	 */
	function formData(map) {
		var keys = Object.keys(map);
		var buf = [];
		for (var i=0; i < keys.length; i++) {
			var key = keys[i], value = map[key];
			buf.push(formEncode(key) + "=" + formEncode(value)); //$NON-NLS-0$
		}
		return buf.join("&"); //$NON-NLS-0$
	}

	function getJSON(data) {
		return data === "" ? null : JSON.parse(data);
	}

	function getError(xhrResult) {
		return new Error("Error loading " + xhrResult.args.url + " status: " + xhrResult.status);
	}

	/**
	 * @class Provides operations on users and users groups.
	 * @name eclipse.UsersService
	 */
	function UsersService(serviceRegistry) {
		if(serviceRegistry){
			this._serviceRegistry = serviceRegistry;
			this._serviceRegistration = serviceRegistry.registerService(
					"orion.core.user", this); //$NON-NLS-0$
		}
	}

	UsersService.prototype = /** @lends eclipse.FileService.prototype */
	{
		getUsersList : function(onLoad) {
			var service = this;
			return xhr("GET", "../users", { //$NON-NLS-1$ //$NON-NLS-0$
				headers : {
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				timeout: 15000
			}).then(function(result) {
				var jsonData = getJSON(result.response);
				if (onLoad){
					if(typeof onLoad === "function") //$NON-NLS-0$
						onLoad(jsonData);
					else
						service.dispatchEvent(onLoad, jsonData);
				}
				return jsonData.users;
			}, function(result) {
				var error = getError(result);
				if(!service.info) {
					handleAuthenticationError(error, function(){
						service.getUsersList(onLoad); // retry GET
					});
				}
				return error;
			});
		},
		deleteUser : function(userURI, onLoad) {
			var service = this;
			return xhr("DELETE", userURI, { //$NON-NLS-0$
				headers : {
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				timeout: 15000
			}).then(function(result) {
				var jsonData = getJSON(result.response);
				if (onLoad){
					if(typeof onLoad === "function") //$NON-NLS-0$
						onLoad(jsonData);
					else
						service.dispatchEvent(onLoad, jsonData);
				}
			}, function(result) {
				var error = getError(result);
				if(!service.info) {
					handleAuthenticationError(error, function(){
						service.deleteUser(userURI, onLoad); // retry DELETE
					});
				}
				return error;
			});
		},
		createUser : function(userName, password, onLoad, onError) {
			var service = this;
			return xhr("POST", "../users", { //$NON-NLS-1$ //$NON-NLS-0$
				headers : {
					"Content-Type": "application/x-www-form-urlencoded", //$NON-NLS-1$ //$NON-NLS-0$
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				timeout: 15000,
				data: formData({
					login : userName,
					password : password
				})
			}).then(function(result) {
				var jsonData = getJSON(result.response);
				if (onLoad){
					if(typeof onLoad === "function") //$NON-NLS-0$
						onLoad(jsonData);
					else
						service.dispatchEvent(onLoad, jsonData);
				}
				return jsonData;
			}, function(result) {
				var error = getError(result);
				if (onError) {
					onError(error);
				}
				return error;
			});
		},
		getUserInfo: function(userURI, onLoad){
			var service = this;
			return xhr("GET", userURI, { //$NON-NLS-0$
				headers : {
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				timeout: 15000
			}).then(function(result) {
				var jsonData = getJSON(result.response);
				if (onLoad){
					if(typeof onLoad === "function") //$NON-NLS-0$
						onLoad(jsonData);
					else
						service.dispatchEvent(onLoad, jsonData);
				}
				return jsonData;
			}, function(result) {
				var error = getError(result);
				if(!service.info) {
					handleAuthenticationError(error, function(){
						service.getUserInfo(userURI, onLoad); // retry GET
					});
				}
				return error;
			});
		},
		updateUserInfo: function(userUri, data, onLoad){
			var service = this;
			var uri = userUri;
			

			if(data.password!==data.passwordRetype){
				var ret = new Deferred();
				ret.reject({message: messages["Passwords do not match!"]});
				return ret;
			}

			return xhr("PUT", uri, { //$NON-NLS-0$
				headers : {
					"Content-Type": "application/json", //$NON-NLS-1$ //$NON-NLS-0$
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				timeout : 15000,
				data: JSON.stringify(data)
			}).then(function(result) {
				var jsonData = getJSON(result.response);
				if (onLoad){
					if(typeof onLoad === "function") //$NON-NLS-0$
						return onLoad(jsonData);
					else{
						service.dispatchEvent(onLoad, jsonData);
						return jsonData;
					}
				} else {
					return jsonData;
				}
			}, function(result) {
				var error = getError(result);
				if(!service.info) {
					handleAuthenticationError(error, function(){
						service.updateUserInfo(userUri, data, onLoad); // retry GET
					});
				}
				return error;
			});
		},
		resetUserPassword: function(login, password, onLoad){
			var service = this;
			return xhr("POST", "../users", { //$NON-NLS-1$ //$NON-NLS-0$
				headers : {
					"Content-Type": "application/x-www-form-urlencoded", //$NON-NLS-1$ //$NON-NLS-0$
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				timeout : 15000,
				data : formData({
					reset: true,
					login : login,
					password : password
				})
			}).then(function(result) {
				var jsonData = getJSON(result.response);
				if (onLoad){
					if(typeof onLoad === "function") //$NON-NLS-0$
						onLoad(jsonData);
					else
						service.dispatchEvent(onLoad, jsonData);
				}
				return jsonData;
			}, function(result) {
				return result.response;
			});
		}
	};
	return UsersService;
});