/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
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
					"IUsersService", this);
		}
	}

	UsersService.prototype = /** @lends eclipse.FileService.prototype */
	{
		getUsersList : function(onLoad) {
			var service = this;
			dojo.xhrGet({
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
				},
				error : function(error, ioArgs) {
					handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
				}
			});
		},
		deleteUser : function(userURI, onLoad) {
			var service = this;
				dojo.xhrDelete({
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
						handleGetAuthenticationError(this, ioArgs);
						console.error("HTTP status code: ", ioArgs.xhr.status);
					}
				});

		},
		createUser : function(userName, password, onLoad, onError) {
			var service = this;
			dojo.xhrPost({
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
				},
				error : function(jsonData, secondArg) {
					if (onError)
						onError(jsonData, secondArg);
				}
			});
		},
		getUserInfo: function(userURI, onLoad){
			var service = this;
			dojo.xhrGet({
				url : userURI,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				timeout : 15000,
				sync: false,
				load : function(jsonData, secondArg) {
					if (onLoad){
						if(typeof onLoad === "function")
							onLoad(jsonData, secondArg);
						else
							service._serviceRegistration.dispatchEvent(onLoad, jsonData);
					}
				},
				error : function(error, ioArgs) {
					handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
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


			dojo.xhrPut({
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
					handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
				}
			});
		}
	};
	return UsersService;
}());