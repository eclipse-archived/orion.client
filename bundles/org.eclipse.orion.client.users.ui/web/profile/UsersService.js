/*******************************************************************************
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/** @namespace The global container for eclipse APIs. */
var eclipse = eclipse || {};

eclipse.UsersService = (function() {
	/**
	 * @class Provides operations on users and users groups.
	 * @name eclipse.UsersService
	 */
	function UsersService(serviceRegistry) {
		if(serviceRegistry){
			this._serviceRegistry = serviceRegistry;
			this._serviceRegistration = serviceRegistry.registerService(
					"orion.core.user", this);
		}
	}

	UsersService.prototype = /** @lends eclipse.FileService.prototype */
	{
		getUsersList : function(onLoad) {
			var service = this;
			return dojo.xhrGet({
				url : "/users",
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				timeout : 15000,
				load : function(jsonData, secondArg) {
					if (onLoad){
						if(typeof onLoad === "function")
							onLoad(jsonData, secondArg);
						else
							service._serviceRegistration.dispatchEvent(onLoad, jsonData);
					}
					return jsonData.users;
				},
				error : function(error, ioArgs) {
					var xhrCall = this;
					if(!service.info) handleAuthenticationError(error, function(){
						dojo.xhrGet(xhrCall); // retry GET
					});
					return error;
				}
			});
		},
		deleteUser : function(userURI, onLoad) {
			var service = this;
				return dojo.xhrDelete({
					url : userURI,
					headers : {
						"Orion-Version" : "1"
					},
					handleAs : "json",
					timeout : 15000,
					load : function(jsonData, secondArg) {
						if (onLoad){
							if(typeof onLoad === "function")
								onLoad(jsonData, secondArg);
							else
								service._serviceRegistration.dispatchEvent(onLoad, jsonData);
						}
					},
					error : function(error, ioArgs) {
						var xhrCall = this;
						if(!service.info) handleAuthenticationError(error, function(){
							dojo.xhrDelete(xhrCall); // retry DELETE
						});
						return error;
					}
				});

		},
		createUser : function(userName, password, onLoad, onError) {
			var service = this;
			return dojo.xhrPost({
				url : "/users",
				headers : {
					"Orion-Version" : "1"
				},
				content : {
					login : userName,
					password : password
				},
				handleAs : "text",
				timeout : 15000,
				load : function(jsonData, secondArg) {
					if (onLoad){
						if(typeof onLoad === "function")
							onLoad(jsonData, secondArg);
						else
							service._serviceRegistration.dispatchEvent(onLoad, jsonData);
					}
					return jsonData;
				},
				error : function(error, secondArg) {
					if (onError)
						onError(error, secondArg);
					return error;
				}
			});
		},
		getUserInfo: function(userURI, onLoad){
			var service = this;
			return dojo.xhrGet({
				url : userURI,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				timeout : 15000,
				load : function(jsonData, secondArg) {
					if (onLoad){
						if(typeof onLoad === "function")
							onLoad(jsonData, secondArg);
						else
							service._serviceRegistration.dispatchEvent(onLoad, jsonData);
					}
				},
				error : function(error, ioArgs) {
					var xhrCall = this;
					if(!service.info) handleAuthenticationError(error, function(){
						dojo.xhrGet(xhrCall); // retry GET
					});
					return error;
				}
			});
		},
		updateUserInfo: function(userUri, data, onLoad){
			var service = this;
			var uri = userUri;
			

			if(data.password!==data.passwordRetype){
				alert("Passwords do not match!");
				return;
			}


			return dojo.xhrPut({
				url : uri,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				putData: dojo.toJson(data),
				timeout : 15000,
				load : function(jsonData, secondArg) {
					if (onLoad){
						if(typeof onLoad === "function")
							onLoad(jsonData, secondArg);
						else
							service._serviceRegistration.dispatchEvent(onLoad, jsonData);
					}
				},
				error : function(error, ioArgs) {
					var xhrCall = this;
					if(!service.info) handleAuthenticationError(error, function(){
						dojo.xhrPut(xhrCall); // retry GET
					});
					return error;
				}
			});
		}
	};
	return UsersService;
}());