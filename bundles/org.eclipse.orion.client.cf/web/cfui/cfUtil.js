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
		// make sure target is set and it matches the url in settings
		getTarget : function(preferences) {
			return preferences.getPreferences('/cm/configurations').then(function(settings){
				var cloud = settings.get("org.eclipse.orion.client.cf.settings");
				if (cloud && cloud.targetUrl){
					var target = {};
					target.Url = cloud.targetUrl;
					if (cloud.manageUrl)
						target.ManageUrl = cloud.manageUrl;
					if (cloud.org)
						target.Org = cloud.org;
					if (cloud.space)
						target.Space = cloud.space;
					return target;
				}
				return handleNoCloud();
			}, handleNoCloud);
		},
		getLoginMessage: function(/*manageUrl*/){
			return messages["deploy.enterCredentials"];
		}
	};
});