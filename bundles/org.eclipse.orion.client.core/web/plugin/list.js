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
/*global define dijit dojo orion widgets serviceRegistry:true window*/

define(['require', 'dojo', 'orion/bootstrap', 'orion/status', 'orion/progress', 'orion/commands', 'orion/fileClient', 'orion/operationsClient',
	        'orion/searchClient', 'orion/globalCommands', 'orion/dialogs',
	        'dojo/parser', 'dojo/hash', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/RegistryTree'], 
			function(require, dojo, mBootstrap, mStatus, mProgress, mCommands, mFileClient, mOperationsClient, mSearchClient, mGlobalCommands, mDialogs) {

dojo.addOnLoad(function() {
	mBootstrap.startup().then(function(core) {
		var serviceRegistry = core.serviceRegistry;
		var preferences = core.preferences;
		var pluginRegistry = core.pluginRegistry;
		document.body.style.visibility = "visible";
		dojo.parser.parse();
		var dialogService = new mDialogs.DialogService(serviceRegistry);
		var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
		var fileClient = new mFileClient.FileClient(serviceRegistry);
		var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
		var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
		var statusService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications");
		new mProgress.ProgressService(serviceRegistry, operationsClient);
		var tree;
		
		var initTree = function() {
			tree = new orion.widgets.RegistryTree({ registry: pluginRegistry, showRoot: false }, "registry-tree");
			tree.startup();
		};
		
		// global commands
		mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, preferences, searcher);
	
		// add install stuff to page actions toolbar
		// We could use the command framework for the links but we are being lazy since we have to add a textbox anyway
		var pageActions = dojo.byId("pageActions");
		if (pageActions) {
			dojo.place('<input type="text" id="installUrlTextBox" value="Type a plugin URL here" style="width:16em;"></input>',
				pageActions, "last");
			dojo.place('<a id="installButton" title="Install the plugin specified in the edit box">Install</a>',
				pageActions, "last");
			dojo.place('<a id="uninstallButton" title="Uninstall the selected plugins">Uninstall</a>',
				pageActions, "last");
			dojo.place('<a id="reloadButton" title="Reload the selected plugin from its URL">Reload</a>',
				pageActions, "last");
			dojo.place('<a id="copyButton" title="Copy the selected location into the install edit box">Copy Location</a>',
				pageActions, "last");


		}	
		// Hook up event handlers
		var installUrlTextBox = dojo.byId("installUrlTextBox");
		dojo.style(installUrlTextBox, "marginRight", "8px");
		var installButton = dojo.byId("installButton");
		dojo.addClass(installButton, "commandLink");
		var uninstallButton = dojo.byId("uninstallButton");
		dojo.addClass(uninstallButton, "commandLink");
		var reloadButton = dojo.byId("reloadButton");
		dojo.addClass(reloadButton, "commandLink");
		var copyButton = dojo.byId("copyButton");
		dojo.addClass(copyButton, "commandLink");
		
		var installHandler = function(evt) {
			var pluginUrl = installUrlTextBox.value;
			if (/^\S+$/.test(dojo.trim(pluginUrl))) {
				statusService.setMessage("Installing " + pluginUrl + "...");
				if (pluginRegistry.getPlugin(pluginUrl)) {
					statusService.setErrorMessage("Already installed");
				} else {
					pluginRegistry.installPlugin(pluginUrl).then(
						function(plugin) {
							var old = dijit.byId("registry-tree");
							if (old) {
								dijit.registry.remove("registry-tree");
							}
							initTree();
							installUrlTextBox.value="";
							statusService.setMessage("Installed " + plugin.getLocation(), 5000);
							preferences.getPreferences("/plugins").then(function(plugins) {
								plugins.put(pluginUrl, true);
							}); // this will force a sync
						}, function(error) {
							statusService.setErrorMessage(error);
						});
				}
			}
		};
		
		// enter is same as pushing install button
		dojo.connect(installUrlTextBox, "onkeypress", function(e) {
			if (dojo.keys.ENTER === e.keyCode) {
				installHandler(e);
			}
		});
		
		// select everything when focus first gets to install box
		dojo.connect(installUrlTextBox, "onfocus", function(e) {
			installUrlTextBox.select();
		});
		
		dojo.connect(installButton, "onclick", installHandler);
		dojo.connect(uninstallButton, "onclick", function() {
			var plugins = tree.getSelectedPlugins();
			if (plugins.length === 0) {
				window.alert("You must first select the plugins you wish to uninstall.");
				return;
			}
			var confirmMessage = plugins.length === 1 ? "Are you sure you want to uninstall '" + plugins[0].getLocation() + "'?" : "Are you sure you want to delete these " + plugins.length + " plugins?";
			dialogService.confirm(confirmMessage, function(doit) {
				if (!doit) {
					return;
				}
				var message = plugins[0].getLocation();
				if (plugins.length > 1) {
					message += ", " + (plugins.length - 1) + " more";
				}
				for (var i=0; i<plugins.length; i++) {
					plugins[i].uninstall();
				}
				var old = dijit.byId("registry-tree");
				if (old) {
					dijit.registry.remove("registry-tree");
				}
				initTree();
				// report what we uninstalled so it's easy for user to copy/paste a plugin that they want back
				statusService.setMessage("Uninstalled " + message, 5000);
				preferences.getPreferences("/plugins").then(function(pref) {
					var uninstalled = [];
					var i;
					for (i=0; i<plugins.length; i++) {
						uninstalled.push(plugins[i].getLocation());
					}

					var temp = document.createElement('a');
					var keys = pref.keys();
					for (i=0; i<keys.length; i++) {
						var key = keys[i];
						var location = key;
						if (location.indexOf("://") === -1) {
							temp.href = require.toUrl(location);
					        location = temp.href;
						}
						if (uninstalled.indexOf(location) !== -1) {
							pref.remove(key);
						}
					}
				}); // this will force a sync
			});
		});
		
		dojo.connect(reloadButton, "onclick", function() {
			var plugins = tree.getSelectedPlugins();
			if (plugins.length === 0) {
				plugins = pluginRegistry.getPlugins();
			}
			var count = 0;
			var d = new dojo.Deferred();
			for (var i = 0; i < plugins.length; i++) {
				plugins[i]._load().then(function() {
					count++;
					if (count === plugins.length) {
						d.resolve();
					}
				});
			}
			d.then(function() {
				statusService.setMessage("Reloaded " + plugins.length + " plugin" + (plugins.length===1 ? "": "s") + ".", 5000);
				var old = dijit.byId("registry-tree");
				if (old) {
					dijit.registry.remove("registry-tree");
				}
				initTree();
			});
		});	
		
		dojo.connect(copyButton, "onclick", function() {
			var plugins = tree.getSelectedPlugins();
			if (plugins.length > 0) {
				installUrlTextBox.value = plugins[0].getLocation();
				installUrlTextBox.focus();
			}
		});			

		initTree();
		installUrlTextBox.focus();
	});
});
});