/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*jslint browser:true devel:true*/
/*global dijit dojo eclipse widgets serviceRegistry:true*/

dojo.addOnLoad(function() {
	
	// TODO get the registry from somewhere else
	serviceRegistry = new eclipse.ServiceRegistry();
	var registry = new eclipse.PluginRegistry(serviceRegistry);
	dojo.addOnWindowUnload(function() {
		registry.shutdown();
	});
	var preferenceService = new eclipse.PreferencesService(serviceRegistry, "/prefs/user");
	var commandService = new eclipse.CommandService({serviceRegistry: serviceRegistry});
	var searcher = new eclipse.Searcher({serviceRegistry: serviceRegistry});
	var statusService = new eclipse.StatusReportingService(serviceRegistry, "statusPane", "notifications");
		
	// global commands
	eclipse.globalCommandUtils.generateBanner("toolbar", serviceRegistry, commandService, preferenceService, searcher);

	var installHandler = function(evt) {
		var pluginUrl = installUrlTextBox.value;
		if (/^\S+$/.test(dojo.trim(pluginUrl))) {
			registry.installPlugin(pluginUrl).then(
				function(plugin) {
					refreshButton.onClick();
					installUrlTextBox.value="";
					statusService.setMessage("Installed " + plugin.getLocation(), 5000);
				}, function(error) {
					statusService.setErrorMessage(error);
				});
		}
	};
		
	var pluginUrl = dojo.hash();
	if(pluginUrl) {
		dojo.byId("valid-hash").style.display = "block";
		dojo.place(window.document.createTextNode(pluginUrl), "extension-location", "only");
		
		dojo.connect(dojo.byId("install"), "click", function(evt) {
			dojo.byId("valid-hash").style.display = "none";
			dojo.byId("wait").style.display = "block";
			registry.installPlugin(pluginUrl).then(
				function(plugin) {
					dojo.byId("wait").style.display = "none";
					dojo.byId("success").style.display = "block";
					statusService.setMessage("Installed " + plugin.getLocation(), 5000);
					var metadata = plugin.getData().metadata;
					if (metadata) {
						if (metadata.postInstallUrl) {
							window.location.href = metadata.postInstallUrl;
						}
					}
				}, function(error) {
					dojo.byId("wait").style.display = "none";
					dojo.byId("failure").style.display = "block";
					dojo.place(window.document.createTextNode(error), "problem", "only");
					statusService.setErrorMessage(error);
				});
		});
	} else {
		dojo.byId("invalid-hash").style.display = "block";
	}
});