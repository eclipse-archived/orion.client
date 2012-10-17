/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit widgets orion  window console define localStorage*/
/*jslint browser:true*/

/* This PluginList widget provides a HTML list placeholder for PluginEntries, and
   provides JavaScript functions for user management of Orion plugins. It is designed
   to contain PluginEntry widgets */

define(['i18n!orion/settings/nls/messages', 'require', 'dojo', 'dijit', 'orion/Deferred', 'orion/commands', 'orion/commonHTMLFragments', 'dijit/TooltipDialog', 'orion/widgets/plugin/PluginEntry'], function(messages, require, dojo, dijit, Deferred, mCommands, mHTMLFragments) {
	
	var defaultPluginURLs = {};
	
	function _normalizeURL(location) {
		if (location.indexOf("://") === -1) { //$NON-NLS-0$
			var temp = document.createElement('a'); //$NON-NLS-0$
			temp.href = location;
	        return temp.href;
		}
		return location;
	}
	
	// This is temporary see Bug 368481 - Re-examine localStorage caching and lifecycle
	var defaultPluginsStorage = localStorage.getItem("/orion/preferences/default/plugins");
	if (defaultPluginsStorage) {
		var pluginsPreference = JSON.parse(defaultPluginsStorage);
		Object.keys(pluginsPreference).forEach(function(pluginURL) {
			defaultPluginURLs[_normalizeURL(require.toUrl(pluginURL))] = true;
		});
	}

	
	dojo.declare("orion.widgets.plugin.PluginList", [dijit._Widget, dijit._Templated], { //$NON-NLS-0$
	
		templateString: '<div>' +  //$NON-NLS-0$
							'<div id="pluginSectionHeader" data-dojo-attach-point="pluginSectionHeader" class="sectionWrapper sectionWrapperAux toolComposite">' + 
								'<div class="sectionAnchor sectionTitle layoutLeft" data-dojo-attach-point="pluginTitle"></div>' + 
								'<div class="sectionItemCount layoutLeft" data-dojo-attach-point="pluginCount">0</div>' + 
								'<div id="pluginCommands" data-dojo-attach-point="pluginCommands" class="layoutRight sectionActions"></div>' +
							'</div>' + //$NON-NLS-2$ //$NON-NLS-0$

					        '<div class="displaytable layoutBlock">' + //$NON-NLS-0$
								'<div class="plugin-settings">' + //$NON-NLS-0$
									'<list style="overflow:hidden;" data-dojo-attach-point="pluginSettingsList"></list>' + //$NON-NLS-0$
								'</div>' + //$NON-NLS-0$
							'</div>' + //$NON-NLS-0$
					    '</div>', //$NON-NLS-0$
				
		pluginDialogState: false,
		
		includeMaker: false,
		
		target: "_self", //$NON-NLS-0$
				
		postCreate: function(){
		
			var _this = this;
			if (this.pluginSectionHeader) {
				var slideout = mHTMLFragments.slideoutHTMLFragment("pluginSectionHeader");
				dojo.place(slideout, this.pluginSectionHeader);
			}
			this.addRows();

			this.registry.registerService("orion.cm.managedservice", //$NON-NLS-0$
				{	updated: function(properties) {
						var target;
						if (properties && properties["links.newtab"] !== "undefined") { //$NON-NLS-1$ //$NON-NLS-0$
							target = properties["links.newtab"] ? "_blank" : "_self"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						} else {
							target = "_self"; //$NON-NLS-0$
						}
						_this.setTarget(target);
					}.bind(this)
				}, {pid: "nav.config"}); //$NON-NLS-0$
		},

		updateToolbar: function(id){
			if(this.pluginCommands) {
				this.commandService.destroy(this.pluginCommands);
			}
		},
				
		startup: function(){
			this.updateToolbar();

			// set up the toolbar level commands	
			var installPluginCommand = new mCommands.Command({
				name: messages["Install"],
				tooltip: messages["Install a plugin by specifying its URL"],
				id: "orion.installPlugin", //$NON-NLS-0$
				parameters: new mCommands.ParametersDescription([new mCommands.CommandParameter('url', 'url', messages['Plugin URL:'], '')]), //$NON-NLS-1$ //$NON-NLS-0$
				callback: dojo.hitch(this, function(data) {
					if (data.parameters) {
						var location = data.parameters.valueFor('url'); //$NON-NLS-0$
						if (location) {
							this.installHandler(location);
						}
					}
				})
			});
			this.commandService.addCommand(installPluginCommand);
			this.commandService.registerCommandContribution("pluginCommands", "orion.installPlugin", 1, /* not grouped */ null, false, /* no key binding yet */ null, new mCommands.URLBinding("installPlugin", "url")); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var reloadAllPluginsCommand = new mCommands.Command({
				name: messages["Reload all"],
				tooltip: messages["Reload all installed plugins"],
				id: "orion.reloadAllPlugins", //$NON-NLS-0$
				callback: dojo.hitch(this, function() {
					this.reloadPlugins();
				})
			});
			this.commandService.addCommand(reloadAllPluginsCommand);
			// register these with the toolbar
			this.commandService.registerCommandContribution("pluginCommands", "orion.reloadAllPlugins", 2); //$NON-NLS-0$

			var createPluginCommand = new mCommands.Command({
				name: messages['Create'],
				tooltip: messages["Create a new Orion Plugin"],
				id: "orion.createPlugin", //$NON-NLS-0$
				callback: dojo.hitch(this, function(data){
					this.createPlugin(data.items);
				})
			
			});
			
			this.commandService.addCommand(createPluginCommand);
	
			if( this.includeMaker === true ){
				this.commandService.registerCommandContribution("pluginCommands", "orion.createPlugin", 2); //$NON-NLS-0$
			}
			
			// Render the commands in the heading, emptying any old ones.
			this.commandService.renderCommands("pluginCommands", "pluginCommands", this, this, "button"); //$NON-NLS-0$
		},
		
		addRows: function(referenceplugin){
		
			// Declare row-level commands so they will be rendered when the rows are added.
			var reloadPluginCommand = new mCommands.Command({
				name: messages["Reload"],
				tooltip: messages["Reload the plugin"],
				id: "orion.reloadPlugin", //$NON-NLS-0$
				imageClass: "core-sprite-refresh", //$NON-NLS-0$
				visibleWhen: function(items) {  // we expect a URL
					return typeof items === "string"; //$NON-NLS-0$
				},
				callback: function(data) {
					this.reloadPlugin(data.items);
				}.bind(this)
			});			
			this.commandService.addCommand(reloadPluginCommand);
			this.commandService.registerCommandContribution("pluginCommand", "orion.reloadPlugin", 1); //$NON-NLS-1$ //$NON-NLS-0$

			var uninstallPluginCommand = new mCommands.Command({
				name: messages["Delete"],
				tooltip: messages["Delete this plugin from the configuration"],
				imageClass: "core-sprite-delete", //$NON-NLS-0$
				id: "orion.uninstallPlugin", //$NON-NLS-0$
				visibleWhen: function(url) {  // we expect a URL
					return !defaultPluginURLs[url]; //$NON-NLS-0$
				},
				callback: function(data) {
					this.removePlugin(data.items);
				}.bind(this)
			});			
			this.commandService.addCommand(uninstallPluginCommand);
			this.commandService.registerCommandContribution("pluginCommand", "orion.uninstallPlugin", 2); //$NON-NLS-1$ //$NON-NLS-0$


			var pluginRegistry = this.settings.pluginRegistry;
			var disablePluginCommand = new mCommands.Command({
				name: "Disable",
				tooltip: "Disable the plugin",
				id: "orion.disablePlugin", //$NON-NLS-0$
				imageClass: "core-sprite-stop", //$NON-NLS-0$
				visibleWhen: function(url) {  // we expect a URL
					if (defaultPluginURLs[url]) {
						return false;
					}
					var plugin = pluginRegistry.getPlugin(url);
					return plugin._getAutostart() !== "stopped"; //$NON-NLS-0$
				},
				callback: function(data) {
					this.disablePlugin(data.items);
				}.bind(this)
			});			
			this.commandService.addCommand(disablePluginCommand);
			this.commandService.registerCommandContribution("pluginCommand", "orion.disablePlugin", 3); //$NON-NLS-1$ //$NON-NLS-0$

			
			var enablePluginCommand = new mCommands.Command({
				name: "Enable",
				tooltip: "Enable the plugin",
				id: "orion.enablePlugin", //$NON-NLS-0$
				imageClass: "core-sprite-start", //$NON-NLS-0$
				visibleWhen: function(url) {  // we expect a URL
					if (defaultPluginURLs[url]) {
						return false;
					}
					var plugin = pluginRegistry.getPlugin(url);
					return plugin._getAutostart() === "stopped"; //$NON-NLS-0$
				},
				callback: function(data) {
					this.enablePlugin(data.items);
				}.bind(this)
			});			
			this.commandService.addCommand(enablePluginCommand);
			this.commandService.registerCommandContribution("pluginCommand", "orion.enablePlugin", 4); //$NON-NLS-1$ //$NON-NLS-0$

		
			var list = this.pluginSettingsList;
		
			if(referenceplugin){
				list = referenceplugin.pluginSettingsList;
			}

			dojo.empty( list );
			var pluginList = this.settings.pluginRegistry.getPlugins();
			this.pluginTitle.textContent = messages['Plugins'];
			this.pluginCount.textContent = pluginList.length;

			for( var p = 0; p < pluginList.length; p++ ){
				var pluginEntry = new orion.widgets.plugin.PluginEntry( {plugin:pluginList[p], commandService:this.commandService}  );
				list.appendChild( pluginEntry.domNode );
				pluginEntry.startup();
			}	                
		},
				
		pluginURLFocus: function(){
			this.pluginUrlEntry.value = '';
			dojo.style( this.pluginUrlEntry, "color", "" ); //$NON-NLS-0$
		},
		
		pluginURLBlur: function(){
			if( this.pluginUrlEntry.value === '' ){
				this.pluginUrlEntry.value = messages['Type a plugin url here ...'];
				dojo.style( this.pluginUrlEntry, "color", "#AAA" ); //$NON-NLS-1$ //$NON-NLS-0$
			}
		},
		
		createPlugin: function( data ){
			var path = require.toUrl("settings/maker.html"); //$NON-NLS-0$
			window.open( path, this.target );
		},
		
		addPlugin: function( pluginUrl ){
			this.statusService.setMessage(messages["Installed "] + pluginUrl, 5000, true);
			this.settings.preferences.getPreferences("/plugins").then(function(plugins) { //$NON-NLS-0$
				plugins.put(pluginUrl, true);
			}); // this will force a sync
			
			this.addRows();

		},

		pluginError: function( error ){
			this.statusService.setErrorMessage(error);
		},
		
		installHandler: function(newPluginUrl){
			if (/^\S+$/.test(dojo.trim(newPluginUrl))) {
				this.statusService.setMessage(messages["Installing "] + newPluginUrl + "...", null, true); //$NON-NLS-1$ //$NON-NLS-0$
				if( this.settings.pluginRegistry.getPlugin(newPluginUrl) ){
					this.statusService.setErrorMessage(messages["Already installed"]);
				} else {
					this.settings.pluginRegistry.installPlugin(newPluginUrl).then(function(plugin) {
						return plugin.start({lazy:true});
					}).then(this.addPlugin.bind(this, newPluginUrl), this.pluginError.bind(this));
				}
			}
		},
		
		reloaded: function(){
			var settingsPluginList = this.settings.pluginRegistry.getPlugins();
			this.statusService.setMessage( messages["Reloaded "] + settingsPluginList.length + messages[" plugin"] + ( settingsPluginList.length===1 ? "": "s") + ".", 5000, true ); //$NON-NLS-3$ //$NON-NLS-2$
			this.addRows();
		},
		
		/* reloads a single plugin */
		reloadPlugin: function(url) {
			var plugin = this.settings.pluginRegistry.getPlugin(url);
			if (plugin) {
				plugin.update().then(this.addRows.bind(this));
				this.statusService.setMessage(messages['Reloaded '] + url, 5000, true);
			}
		},
		
		disablePlugin: function(url){
			var plugin = this.settings.pluginRegistry.getPlugin(url);
			if (plugin) {
				plugin.stop();
				this.statusService.setMessage("Disabled " + url, 5000, true);
				this.settings.preferences.getPreferences("/plugins").then(function(plugins) { //$NON-NLS-0$
					plugins.put(url, false);
					this.addRows(this);
				}.bind(this)); // this will force a sync
				this.addRows();
			}
		},
	
		enablePlugin: function(url){
			var plugin = this.settings.pluginRegistry.getPlugin(url);
			if (plugin) {
				plugin.start({lazy:true});
				this.statusService.setMessage("Enabled " + url, 5000, true);
				this.settings.preferences.getPreferences("/plugins").then(function(plugins) { //$NON-NLS-0$
					plugins.put(url, false);
					this.addRows(this);
				}.bind(this)); // this will force a sync
				this.addRows();
			}
		},

		setTarget: function(target) {
			this.target = target;
		},
		
		/* reloads all of the plugins - sometimes useful for reaffirming plugin initialization */

		reloadPlugins: function(){
			var plugins = this.settings.pluginRegistry.getPlugins();
			var updates = [];
			plugins.forEach(function(plugin){
				updates.push(plugin.update());
			});
			Deferred.all(updates, function(){}).then(this.reloaded.bind(this));
		},
		
		forceRemove: function(url){
			var plugin = this.settings.pluginRegistry.getPlugin(url);
			if (plugin) {
				plugin.uninstall();
				this.statusService.setMessage(messages["Uninstalled "] + url, 5000, true);
				this.settings.preferences.getPreferences("/plugins").then(function(plugins) { //$NON-NLS-0$
					plugins.remove(url);
					this.addRows(this);
				}.bind(this)); // this will force a sync
				this.addRows();
			}
		},
		
		/* removePlugin - removes a plugin by url */

		removePlugin: function( url ){

			/* 	The id of the source element is programmed with the
				url of the plugin to remove. */
				
			// TODO: Should be internationalized
				
			var confirmMessage = messages["Are you sure you want to uninstall '"] + url + "'?"; //$NON-NLS-1$
			if (window.confirm(confirmMessage)) {
				this.forceRemove(url);
			}
		}
	});
});