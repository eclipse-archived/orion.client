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
		this._serviceRegistry = serviceRegistry;
		this._serviceRegistration = serviceRegistry.registerService(
				"IUsersService", this);
	}

	UsersService.prototype = /** @lends eclipse.FileService.prototype */
	{
		getUsersList : function(onLoad) {
			dojo.xhrGet({
				url : "/users",
				headers : {
					"EclipseWeb-Version" : "1"
				},
				handleAs : "json",
				timeout : 15000,
				load : function(jsonData, secondArg) {
					if (onLoad)
						onLoad(jsonData, secondArg);
				},
				error : function(error, ioArgs) {
					handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
				}
			});
		},
		deleteUser : function(userURI, onLoad) {
			

		
				dojo.xhrDelete({
					url : userURI,
					headers : {
						"EclipseWeb-Version" : "1"
					},
					handleAs : "json",
					timeout : 15000,
					load : function(jsonData, secondArg) {
						if (onLoad)
							onLoad(jsonData, secondArg);
					},
					error : function(error, ioArgs) {
						handleGetAuthenticationError(this, ioArgs);
						console.error("HTTP status code: ", ioArgs.xhr.status);
					}
				});

		},
		createUser : function(userName, password, onLoad, onError) {
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
					if (onLoad)
						onLoad(jsonData, secondArg);
				},
				error : function(jsonData, secondArg) {
					if (onError)
						onError(jsonData, secondArg);
				}
			});
		},
		getUserInfo: function(userURI, onLoad){
			dojo.xhrGet({
				url : userURI,
				headers : {
					"EclipseWeb-Version" : "1"
				},
				handleAs : "json",
				timeout : 15000,
				load : function(jsonData, secondArg) {
					if (onLoad)
						onLoad(jsonData, secondArg);
				},
				error : function(error, ioArgs) {
					handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
				}
			});
		},
		updateUserInfo: function(userUri, data, onLoad){
			var uri = userUri + "?name=" + data.name;
			
			if(data.password && data.passwordRetype && (data.password!=="" || data.passwordRetype!=="")){
				if(data.password===data.passwordRetype){
					uri = uri + "&password=" + data.password;	
				}else{
					alert("Passwords do not match!");
				}
			}

			dojo.xhrPut({
				url : uri,
				headers : {
					"EclipseWeb-Version" : "1"
				},
				handleAs : "json",
				timeout : 15000,
				load : function(jsonData, secondArg) {
					if (onLoad)
						onLoad(jsonData, secondArg);
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