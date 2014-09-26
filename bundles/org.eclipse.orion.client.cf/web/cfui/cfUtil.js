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
			return {};
		},
		
		getLoginMessage: function(/*manageUrl*/){
			return messages["deploy.enterCredentials"];
		},
		
		prepareLaunchConfigurationContent : function(resp, appPath, editLocation){
			var appName = resp.App.name || resp.App.entity.name;
			var launchConfName = appName + " on " + resp.Target.Space.Name + " / " + resp.Target.Org.Name;
			
			var host, url, urlTitle;
			if(resp.Route !== undefined){
				host = resp.Route.host || resp.Route.entity.host;
				url = "http://" + host + "." + resp.Domain;
				urlTitle = appName;
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
					UrlTitle: urlTitle,
					Type: "Cloud Foundry",
					ManageUrl: resp.ManageUrl,
					Path: appPath
				},
				Message: "See Manual Deployment Information in the [root folder page](" + editLocation.href + ") to view and manage [" + launchConfName + "](" + resp.ManageUrl + ")"
			};
		}
	};
});