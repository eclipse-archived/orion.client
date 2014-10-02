/*******************************************************************************
 * @license
 * Copyright (c) 2013, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser,amd*/
define([
	'i18n!cfui/nls/messages',
	'orion/Deferred',
	'orion/i18nUtil',
	'orion/URITemplate',
	'orion/PageLinks',
], function(messages, Deferred, i18nUtil, URITemplate, PageLinks){

	function handleNoCloud(error) {
		error = error || {};
		var cloudSettingsPageUrl = new URITemplate("{+OrionHome}/settings/settings.html#,category=cloud").expand({
			OrionHome : PageLinks.getOrionHome()
		});
		error.Message = i18nUtil.formatMessage(messages["deploy.setUpYourCloud"], cloudSettingsPageUrl);
		error.Severity = "Warning";
		return new Deferred().reject(error);
	}

	return {
		getTargets : function(preferences) {
			return preferences.getPreferences('/cm/configurations').then(function(settings){
				var cloud = settings.get("org.eclipse.orion.client.cf.settings");
				if (cloud && cloud.targetUrl){
					var target = {};
					target.Url = cloud.targetUrl;
					if (cloud.manageUrl)
						target.ManageUrl = cloud.manageUrl;
					return [target];
				}
				return handleNoCloud();
			}, handleNoCloud);
		},
		
		getDefaultTarget: function(resource){
			var clientDeferred = new Deferred();
			clientDeferred.resolve({});
			return clientDeferred;
		},
		
		getLoginMessage: function(/*manageUrl*/){
			return messages["deploy.enterCredentials"];
		},
		
		prepareLaunchConfigurationContent : function(resp, appPath, editLocation){
			var appName = resp.App.name || resp.App.entity.name;
			var launchConfName = appName + " on " + resp.Target.Space.Name + " / " + resp.Target.Org.Name;
			
			var host, url;
			if(resp.Route !== undefined){
				host = resp.Route.host || resp.Route.entity.host;
				url = "http://" + host + "." + resp.Domain;
			}
			
			return {
				CheckState: true,
				ToSave: {
					ConfigurationName: launchConfName,
					Parameters: {
						Target: {
							Url: resp.Target.Url,
							Org: resp.Target.Org.Name,
							Space: resp.Target.Space.Name
						},
						Name: appName,
						Timeout: resp.Timeout
					},
					Url: url,
					Type: "Cloud Foundry",
					ManageUrl: resp.ManageUrl,
					Path: appPath
				},
				Message: "See Manual Deployment Information in the [root folder page](" + editLocation.href + ") to view and manage [" + launchConfName + "](" + resp.ManageUrl + ")"
			};
		},
		
		/* ===== WIZARD COMMUNICATION HELPERS ===== */
		
		/**
		 * Posts the given status message.
		 */
		defaultPostMsg : function(status){
			window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI", 
				 source: "org.eclipse.orion.client.cf.deploy.uritemplate", 
				 status: status}), "*");
		},
		
		/**
		 * Posts the given given error.
		 */
		defaultPostError : function(error, target){
			if (error.Message && error.Message.indexOf("The host is taken") === 0)
				error.Message = "The host is already in use by another application. Please check the host/domain in the manifest file.";
			
			if (error.HttpCode === 404){
				
				error = {
					State: "NOT_DEPLOYED",
					Message: error.Message
				};
				
			} else if (error.JsonData && error.JsonData.error_code) {
				var err = error.JsonData;
				if (err.error_code === "CF-InvalidAuthToken" || err.error_code === "CF-NotAuthenticated"){
					
					error.Retry = {
						parameters: [{id: "user", type: "text", name: "ID:"}, {id: "password", type: "password", name: "Password:"}, {id: "url", hidden: true, value: target.Url}]
					};
					
					error.forceShowMessage = true;
					error.Severity = "Info";
					error.Message = this.getLoginMessage(target.ManageUrl);
				
				} else if (err.error_code === "CF-TargetNotSet"){
					var cloudSettingsPageUrl = new URITemplate("{+OrionHome}/settings/settings.html#,category=cloud").expand({OrionHome : PageLinks.getOrionHome()});
					error.Message = "Set up your Cloud. Go to [Settings](" + cloudSettingsPageUrl + ")."; 
				}
			}
			
			window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI", 
				 source: "org.eclipse.orion.client.cf.deploy.uritemplate", 
				 status: error}), "*");
		},
		
		/**
		 *  Posts to close the plugin frame.
		 */
		defaultCloseFrame : function(){
			window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI", 
				 source: "org.eclipse.orion.client.cf.deploy.uritemplate", cancelled: true}), "*");
		}
	};
});
