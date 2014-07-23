/*******************************************************************************
 * @license
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2014. All Rights Reserved. 
 * 
 * Note to U.S. Government Users Restricted Rights:  Use, 
 * duplication or disclosure restricted by GSA ADP Schedule 
 * Contract with IBM Corp.
 *******************************************************************************/
 /*global define*/
define(['orion/Deferred', 'orion/URITemplate', 'orion/PageLinks'], function(Deferred, URITemplate, PageLinks){
	
	return {
	// make sure target is set and it matches the url in settings
	getTarget : function(preferences) {
		var deferred = new Deferred();
			preferences.getPreferences('/cm/configurations').then(
				function(settings){
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
						deferred.resolve(target);
						return;
					} else {
						var error = {};
						var cloudSettingsPageUrl = new URITemplate("{+OrionHome}/settings/settings.html#,category=Cloud").expand({OrionHome : PageLinks.getOrionHome()});
						error.Message = "Set up your Cloud. Go to [Settings](" + cloudSettingsPageUrl + ")."; 
						error.Severity = "Warning";
						deferred.reject(error);
					}
				}, function(error){
					var cloudSettingsPageUrl = new URITemplate("{+OrionHome}/settings/settings.html#,category=Cloud").expand({OrionHome : PageLinks.getOrionHome()});
					error.Message = "Set up your Cloud. Go to [Settings](" + cloudSettingsPageUrl + ")."; 
					error.Severity = "Warning";
					deferred.reject(error);
				}
			);
			return deferred;
		}
	};
});