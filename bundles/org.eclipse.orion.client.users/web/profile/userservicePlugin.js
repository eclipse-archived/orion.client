/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define confirm eclipse*/
define(["orion/plugin", "profile/UsersService", "dojo", "domReady!"], function(PluginProvider, UsersService, dojo) {
	var usersService = new UsersService();
	var provider = new PluginProvider();

	usersService.info = function () {
		return {
			name: "User profile"
		};
	};


	usersService.getDivContent = function () {
		var content = {
			"actions": [{
				"id": "saveProfileButton",
				"name": "Save Profile",
				"tooltip": "Save Profile",
				"action": "saveProfile"
			}, {
				"id": "resetProfileButton",
				"name": "Reset",
				"tooltip": "Reset Profile Information",
				"action": "resetProfile"
			}, {
				"id": "deleteProfileButton",
				"name": "Delete Profile",
				"tooltip": "Delete Profile",
				"action": "deleteProfile"
			}]
		};

		return content;
	};

	usersService.initProfile = function (userURI, pluginsEventName, dataEventName) {
		return this.getUserInfo(userURI, function (json) {
			usersService.dispatchEvent(pluginsEventName, {
				"plugins": json.Plugins
			});
			usersService.dispatchEvent(dataEventName, json);
		});
	};

	usersService.fire = function (action, url, jsonData) {
		switch (action) {
		case "saveProfile":
			return this.updateUserInfo(url, jsonData, dojo.hitch(this, function (url, jsonResp) {
				this.initProfile(url, "requiredPluginsChanged", "userInfoChanged");
				return (jsonResp && jsonResp.Message) ? jsonResp : {
					Message: "Profile saved!",
					status: 200
				};
			}, url));
			break;
		case "resetProfile":
			return this.getUserInfo(url, "userInfoChanged");
			break;
		case "deleteProfile":
			var login = jsonData.login ? jsonData.login : url;
			if (confirm("Do you really want to delete user " + login + "?")) {
				return this.deleteUser(url, "userDeleted");
			}
			break;
		default:
			return this.updateUserInfo(url, jsonData, dojo.hitch(this, function (url, jsonResp) {
				this.initProfile(url, "requiredPluginsChanged", "userInfoChanged");
				return (jsonResp && jsonResp.Message) ? jsonResp : {
					Message: "Profile saved!",
					status: 200
				};
			}, url));
			break;
		}
	};
	usersService.dispatchEvent = function(){
		// this method will get wrapped and delegated to the plugin
	};

	provider.registerService("orion.core.user", usersService);
	provider.connect();
});