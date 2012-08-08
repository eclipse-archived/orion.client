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
					"orion.core.user", this); //$NON-NLS-0$
		}
	}

	UsersService.prototype = /** @lends eclipse.FileService.prototype */
	{
		getUsersList : function(onLoad) {
			var service = this;
			return dojo.xhrGet({
				url : "../users", //$NON-NLS-0$
				headers : {
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				handleAs : "json", //$NON-NLS-0$
				timeout : 15000,
				load : function(jsonData, secondArg) {
					if (onLoad){
						if(typeof onLoad === "function") //$NON-NLS-0$
							onLoad(jsonData, secondArg);
						else
							service.dispatchEvent(onLoad, jsonData);
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
						"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
					},
					handleAs : "json", //$NON-NLS-0$
					timeout : 15000,
					load : function(jsonData, secondArg) {
						if (onLoad){
							if(typeof onLoad === "function") //$NON-NLS-0$
								onLoad(jsonData, secondArg);
							else
								service.dispatchEvent(onLoad, jsonData);
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
				url : "../users", //$NON-NLS-0$
				headers : {
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				content : {
					login : userName,
					password : password
				},
				handleAs : "text", //$NON-NLS-0$
				timeout : 15000,
				load : function(jsonData, secondArg) {
					if (onLoad){
						if(typeof onLoad === "function") //$NON-NLS-0$
							onLoad(jsonData, secondArg);
						else
							service.dispatchEvent(onLoad, jsonData);
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
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				handleAs : "json", //$NON-NLS-0$
				timeout : 15000,
				load : function(jsonData, secondArg) {
					if (onLoad){
						if(typeof onLoad === "function") //$NON-NLS-0$
							onLoad(jsonData, secondArg);
						else
							service.dispatchEvent(onLoad, jsonData);
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
				var ret = new dojo.Deferred();
				ret.errback({message: messages["Passwords do not match!"]});
				return ret;
			}


			return dojo.xhrPut({
				url : uri,
				headers : {
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				handleAs : "json", //$NON-NLS-0$
				putData: dojo.toJson(data),
				timeout : 15000,
				load : function(jsonData, secondArg) {
					if (onLoad){
						if(typeof onLoad === "function") //$NON-NLS-0$
							return onLoad(jsonData, secondArg);
						else{
							service.dispatchEvent(onLoad, jsonData);
							return jsonData;
						}
					} else {
						return jsonData;
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
		},
		resetUserPassword: function(login, password, onLoad){
			
			return dojo.xhrPost({
				url : "../users", //$NON-NLS-0$
				headers : {
					"Orion-Version" : "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				content : {
					reset: true,
					login : login,
					password : password
				},
				handleAs : "json", //$NON-NLS-0$
				timeout : 15000,
				load : function(jsonData, secondArg) {
					if (onLoad){
						if(typeof onLoad === "function") //$NON-NLS-0$
							onLoad(jsonData, secondArg);
						else
							service.dispatchEvent(onLoad, jsonData);
					}
					
					return jsonData;
				},
				error : function(error, secondArg) {
					return error;
				}
			});
			
			
		}
	};
	return UsersService;
}());