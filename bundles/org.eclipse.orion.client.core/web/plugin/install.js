/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*jslint browser:true devel:true*/
/*global define window dijit dojo eclipse widgets serviceRegistry:true*/

define(['dojo', 'orion/bootstrap', 'orion/status', 'orion/commands', 
	        'orion/searchClient', 'orion/globalCommands',
	        'dojo/parser', 'dojo/hash', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane'], 
			function(dojo, mBootstrap, mStatus, mCommands, mSearchClient, mGlobalCommands) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			var pluginRegistry = core.pluginRegistry;
			document.body.style.visibility = "visible";
			dojo.parser.parse();
			
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService});
			var statusService = new mStatus.StatusReportingService(serviceRegistry, "statusPane", "notifications");
				
			// global commands
			mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, preferences, searcher);
		
			var pluginUrl = dojo.hash();
			if(pluginUrl) {
				dojo.byId("valid-hash").style.display = "block";
				dojo.place(window.document.createTextNode(pluginUrl), "plugin-location", "only");
				
				dojo.connect(dojo.byId("install"), "click", function(evt) {
					dojo.byId("valid-hash").style.display = "none";
					dojo.byId("wait").style.display = "block";
					
					if (pluginRegistry.getPlugin(pluginUrl)) {
						statusService.setErrorMessage("Already installed");
					} else {					
						pluginRegistry.installPlugin(pluginUrl).then(
							function(plugin) {
								dojo.byId("wait").style.display = "none";
								dojo.byId("success").style.display = "block";
								statusService.setMessage("Installed " + plugin.getLocation(), 5000);
								preferences.getPreferences("/plugins").then(function(plugins) {
									plugins.put(pluginUrl, true);
								}); // this will force a sync 
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
					}
				});
			} else {
				dojo.byId("invalid-hash").style.display = "block";
			}
		});
	
	});
});
