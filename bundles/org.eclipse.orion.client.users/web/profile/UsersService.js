/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define escape */
define(["orion/Deferred", "orion/xhr", 'orion/EventTarget', 'orion/urlencode'], function(Deferred, xhr, EventTarget, urlencode) {

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
		EventTarget.attach(this);
		if(serviceRegistry){
			this._serviceRegistry = serviceRegistry;
			this._serviceRegistration = serviceRegistry.registerService(
					"orion.core.user", this); //$NON-NLS-0$
		}
	}

	UsersService.prototype = /** @lends eclipse.FileService.prototype */
	{
		getUsersListSubset : function(start, rows, onLoad) {
			var ret = new Deferred();
			var service = this;
			var uri = "../users?start=" + start + "&rows=" + rows;
			xhr("GET", uri, { //$NON-NLS-1$ 
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
						service.dispatchEvent({type: onLoad, data: jsonData});
				}
				ret.resolve(jsonData);
			}, function(error) {
				if(!service.info) {
					handleAuthenticationError(getError(error), function(){
						service.getUsersListSubset(start, rows); // retry GET
					});
				}
				ret.reject(error.response || error);
			});
			return ret;
		},
		getUsersList : function(onLoad) {
			var ret = new Deferred();
			var service = this;
			xhr("GET", "../users", { //$NON-NLS-1$ //$NON-NLS-0$
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
						service.dispatchEvent({type: onLoad, data: jsonData});
				}
				ret.resolve(jsonData.users);
			}, function(error) {
				if(!service.info) {
					handleAuthenticationError(getError(error), function(){
						service.getUsersList(onLoad); // retry GET
					});
				}
				ret.reject(error.response || error);
			});
			return ret;
		},
		deleteUser : function(userURI, onLoad) {
			var ret = new Deferred();
			var service = this;
			xhr("DELETE", userURI, { //$NON-NLS-0$
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
						service.dispatchEvent({type: onLoad, data: jsonData});
				}
				ret.resolve(jsonData);
			}, function(error) {
				if(!service.info) {
					handleAuthenticationError(getError(error), function(){
						service.deleteUser(userURI, onLoad); // retry DELETE
					});
				}
				ret.reject(error.response || error);
			});
			return ret;
		},
		createUser : function(userName, password, email, onLoad, onError) {
			var ret = new Deferred();
			xhr("POST", "../users", { //$NON-NLS-1$ //$NON-NLS-0$
				headers : {
					"Content-Type": "application/x-www-form-urlencoded", //$NON-NLS-1$ //$NON-NLS-0$
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				timeout: 15000,
				data: urlencode.encodeFormData({
					login : userName,
					password : password,
					email: email
				}),
				load : function(jsonData, xhrArgs) {
					ret.resolve(jsonData);
				},
				error : function(error, ioArgs) {
					ret.reject(error.response || error);
				}
			});
			return ret;
		},
		getUserInfo: function(userURI, onLoad){
			var ret = new Deferred();
			var service = this;
			xhr("GET", userURI, { //$NON-NLS-0$
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
						service.dispatchEvent({type: onLoad, data: jsonData});
				}
				ret.resolve(jsonData);
			}, function(error) {
				if(!service.info) {
					handleAuthenticationError(getError(error), function(){
						service.getUserInfo(userURI, onLoad); // retry GET
					});
				}
				ret.reject(error.response || error);
			});
			return ret;
		},
		updateUserInfo: function(userUri, data, onLoad){
			var ret = new Deferred();
			var service = this;
			var uri = userUri;
			

			if(data.password!==data.passwordRetype){
				ret.reject({message: messages["Passwords do not match!"]});
				return ret;
			}

			xhr("PUT", uri, { //$NON-NLS-0$
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
						onLoad(jsonData);
					else
						service.dispatchEvent({type: onLoad, data: jsonData});
				}
				ret.resolve(jsonData);
			}, function(error) {
				if(!service.info) {
					handleAuthenticationError(getError(error), function(){
						service.updateUserInfo(userUri, data, onLoad); // retry GET
					});
				}
				ret.reject(error.response || error);
			});
			
			return ret;
		},
		resetUserPassword: function(login, password, onLoad){
			var ret = new Deferred();
			var service = this;
			xhr("POST", "../users", { //$NON-NLS-1$ //$NON-NLS-0$
				headers : {
					"Content-Type": "application/x-www-form-urlencoded", //$NON-NLS-1$ //$NON-NLS-0$
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				timeout : 15000,
				data : urlencode.encodeFormData({
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
						service.dispatchEvent({type: onLoad, data: jsonData});
				}
				ret.resolve(jsonData);
			}, function(result) {
				ret.reject(error.response || error);
			});
			return ret;
		}
	};
	return UsersService;
});