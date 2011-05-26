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


define(['dojo', 'orion/serviceregistry', 'orion/preferences', 'orion/pluginregistry', 'orion/status', 'orion/commands', 
	        'orion/searchClient', 'orion/globalCommands',
	        'dojo/parser', 'dojo/hash', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/RegistryTree'], 
			function(dojo, mServiceregistry, mPreferences, mPluginRegistry, mStatus, mCommands, mSearchClient, mGlobalCommands) {

dojo.addOnLoad(function() {
	
	dojo.parser.parse();

	var serviceRegistry = new mServiceregistry.ServiceRegistry();
	// This is code to ensure the first visit to orion works
	// we read settings and wait for the plugin registry to fully startup before continuing
	var preferenceService = new mPreferences.PreferencesService(serviceRegistry, "/prefs/user");
	var pluginRegistry;
	preferenceService.getPreferences("/plugins").then(function() {
		pluginRegistry = new mPluginRegistry.PluginRegistry(serviceRegistry);
		dojo.addOnWindowUnload(function() {
			pluginRegistry.shutdown();
		});
		return pluginRegistry.startup();
	}).then(function() {
		var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
		var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry});
		var statusService = new mStatus.StatusReportingService(serviceRegistry, "statusPane", "notifications");
		
		var initTree = function() {
			var tree = new widgets.RegistryTree({ registry: pluginRegistry }, "registry-tree");
			tree.startup();
		};
		
		// global commands
		mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, preferenceService, searcher);
	
		// add install stuff to page actions toolbar
		var pageActions = dojo.byId("pageActions");
		if (pageActions) {
			dojo.place('<input type="text" id="installUrlTextBox" value="Type a plugin URL here" style="width:16em;"></input>',
				pageActions, "last");
			dojo.place('<button id="installButton">Install</button>',
				pageActions, "last");
		}	
		// Hook up event handlers
		var installUrlTextBox = dojo.byId("installUrlTextBox");
		var installButton = dojo.byId("installButton");
		var refreshButton = dijit.byId("refreshButton");
		var clearButton = dijit.byId("clearButton");
	
		dojo.connect(refreshButton, "onClick", function(evt) {
			var old = dijit.byId("registry-tree");
			if (old) {
				//old.destroyRecursive();
				dijit.registry.remove("registry-tree");
			}
			initTree();
		});
		dojo.connect(clearButton, "onClick", function(evt) {
			var old = dijit.byId("registry-tree");
			if (old) {
				//old.destroyRecursive();
				dijit.registry.remove("registry-tree");
			}
			var plugins = pluginRegistry.getPlugins();
			for (var i = 0; i < plugins.length; i++) {
				plugins[i].uninstall();
			}
			initTree();
		});
		var installHandler = function(evt) {
			var pluginUrl = installUrlTextBox.value;
			if (/^\S+$/.test(dojo.trim(pluginUrl))) {
				pluginRegistry.installPlugin(pluginUrl).then(
					function(plugin) {
						refreshButton.onClick();
						installUrlTextBox.value="";
						statusService.setMessage("Installed " + plugin.getLocation(), 5000);
					}, function(error) {
						statusService.setErrorMessage(error);
					});
			}
		};
		dojo.connect(installUrlTextBox, "onkeypress", function(e) {
			if (dojo.keys.ENTER === e.keyCode) {
				installHandler(e);
			}
		});
		dojo.connect(installButton, "onclick", installHandler);
			
		// Wait until the JSLint plugin has (hopefully) loaded, then draw the tree
		setTimeout(function() {
			initTree();
			installUrlTextBox.focus();
			installUrlTextBox.select();
		}, 500);
	});
});
});