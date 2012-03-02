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
/*global dojo dijit widgets orion  window console define*/
/*jslint browser:true*/

/* This PluginList widget provides a HTML list placeholder for PluginEntries, and
   provides JavaScript functions for user management of Orion plugins. It is designed
   to contain PluginEntry widgets */

define(['require', 'dojo', 'dijit', 'orion/util', 'orion/commands', 'dijit/TooltipDialog', 'orion/widgets/PluginEntry'], function(require, dojo, dijit, mUtil, mCommands) {
	
	dojo.declare("orion.widgets.PluginList", [dijit._Widget, dijit._Templated], {
	
		templateString: '<div>' + 
							'<div class="pluginwrapper">' +
								'<div class="pluginTitle" data-dojo-attach-point="pluginTitle"></div>' +
					        '</div>' +
					        '<div class="displaytable">' +
								'<div class="plugin-settings">' +
									'<list style="overflow:hidden;" data-dojo-attach-point="pluginSettingsList"></list>' +
								'</div>' +
							'</div>' +
					    '</div>',
				
		pluginDialogState: false,
					    
		postCreate: function(){
			// set up the toolbar level commands
			var installPluginCommand = new mCommands.Command({
				name: "Install",
				tooltip: "Install a plugin by specifying its URL",
				id: "orion.installPlugin",
				parameters: new mCommands.ParametersDescription([new mCommands.CommandParameter('url', 'url', 'Plugin URL:', '')], false),
				callback: dojo.hitch(this, function(data) {
					if (data.parameters) {
						var location = data.parameters.valueFor('url');
						if (location) {
							this.installHandler(location);
						}
					}
				})
			});
			this.commandService.addCommand(installPluginCommand);
			this.commandService.registerCommandContribution(this.toolbarID, "orion.installPlugin", 1, /* not grouped */ null, false, /* no key binding yet */ null, new mCommands.URLBinding("installPlugin", "url"));
			var reloadAllPluginsCommand = new mCommands.Command({
				name: "Reload all",
				tooltip: "Reload all installed plugins",
				id: "orion.reloadAllPlugins",
				callback: dojo.hitch(this, function() {
					this.reloadPlugins();
				})
			});
			this.commandService.addCommand(reloadAllPluginsCommand);
			// register these with the toolbar and render them.  Rendering is normally done by our outer page, but since
			// we might have been created after the page first loaded, we have to do this ourselves.
			this.commandService.registerCommandContribution(this.toolbarID, "orion.reloadAllPlugins", 2);
			this.commandService.renderCommands(this.toolbarID, this.toolbarID, this, this, "button");
			
			var reloadPluginCommand = new mCommands.Command({
				name: "Reload",
				tooltip: "Reload the plugin",
				id: "orion.reloadPlugin",
				imageClass: "core-sprite-refresh",
				visibleWhen: function(items) {  // we expect a URL
					return typeof items === "string";
				},
				callback: dojo.hitch(this, function(data) {
					this.reloadPlugin(data.items);
				})
			});			
			this.commandService.addCommand(reloadPluginCommand);
			this.commandService.registerCommandContribution("pluginCommand", "orion.reloadPlugin", 1);

			// now we register commands that are appropriate at the object (row) level
			var uninstallPluginCommand = new mCommands.Command({
				name: "Delete",
				tooltip: "Delete this plugin from the configuration",
				imageClass: "core-sprite-delete",
				id: "orion.uninstallPlugin",
				visibleWhen: function(items) {  // we expect a URL
					return typeof items === "string";
				},
				callback: dojo.hitch(this, function(data) {
					this.removePlugin(data.items);
				})
			});			
			this.commandService.addCommand(uninstallPluginCommand);
			this.commandService.registerCommandContribution("pluginCommand", "orion.uninstallPlugin", 2);
			this.addRows();
		},
		
		addRows: function(){
			
			var list = this.pluginSettingsList;
			dojo.empty( list );
			var pluginList = this.settings.pluginRegistry.getPlugins();
			this.pluginTitle.innerHTML = "Plugins [" + pluginList.length +"]";

			for( var p = 0; p < pluginList.length; p++ ){
				var pluginEntry = new orion.widgets.PluginEntry( {plugin:pluginList[p], commandService:this.commandService}  );
				list.appendChild( pluginEntry.domNode );
				pluginEntry.startup();
			}	                
		},
				
		pluginURLFocus: function(){
			this.pluginUrlEntry.value = '';
			dojo.style( this.pluginUrlEntry, "color", "" );
		},
		
		pluginURLBlur: function(){
			if( this.pluginUrlEntry.value === '' ){
				this.pluginUrlEntry.value = 'Type a plugin url here ...';
				dojo.style( this.pluginUrlEntry, "color", "#AAA" );
			}
		},
		
		addPlugin: function( plugin ){
			this.statusService.setMessage("Installed " + plugin.getLocation(), 5000);
			this.settings.preferences.getPreferences("/plugins").then(function(plugins) {
				plugins.put(plugin.getLocation(), true);
			}); // this will force a sync
			
			this.addRows();

		},

		pluginError: function( error ){
			this.statusService.setErrorMessage(error);
		},
		
		installHandler: function(newPluginUrl){
			if (/^\S+$/.test(dojo.trim(newPluginUrl))) {
				this.statusService.setMessage("Installing " + newPluginUrl + "...");
				if( this.settings.pluginRegistry.getPlugin(newPluginUrl) ){
					this.statusService.setErrorMessage("Already installed");
				} else {
					this.settings.pluginRegistry.installPlugin(newPluginUrl).then( dojo.hitch( this, 'addPlugin' ), dojo.hitch( this, 'pluginError' ) );
				}
			}
		},
		
		reloaded: function(){
			var settingsPluginList = this.settings.pluginRegistry.getPlugins();
			this.statusService.setMessage( "Reloaded " + settingsPluginList.length + " plugin" + ( settingsPluginList.length===1 ? "": "s") + ".", 5000 );
			this.addRows();
		},
		
		/* reloads a single plugin */
		reloadPlugin: function(url) {
			var settingsPluginList = this.settings.pluginRegistry.getPlugins();
			for( var p = 0; p < settingsPluginList.length; p++ ){
				if( settingsPluginList[p].getLocation() === url ){
					settingsPluginList[p].update();
					this.statusService.setMessage("Reloaded " + url, 5000);
					break;
				}
			}
		},
		
		/* reloads all of the plugins - sometimes useful for reaffirming plugin initialization */

		reloadPlugins: function(){
		
			var settingsPluginList = this.settings.pluginRegistry.getPlugins();
		
			var count = 0;
			
			var d = new dojo.Deferred();
		
			for( var i = 0; i < settingsPluginList.length; i++) {
			
				settingsPluginList[i].update().then( function(){
					count++;
					if( count === settingsPluginList.length ){
						d.resolve();
					}
				});
			}
			
			d.then( dojo.hitch( this, "reloaded" ) );
		},
		
		forceRemove: function(url){
			var settings = this.settings;
			var statusService = this.statusService;
			
			var settingsPluginList = settings.pluginRegistry.getPlugins();
		
			for( var p = 0; p < settingsPluginList.length; p++ ){
				if( settingsPluginList[p].getLocation() === url ){
					settingsPluginList[p].uninstall();
					statusService.setMessage("Uninstalled " + url, 5000);
					settings.preferences.getPreferences("/plugins").then(function(plugins) {
						plugins.remove(url);
					}); // this will force a sync
					
					this.addRows();
					
					break;
				}
			}
		},
		
		
		/* removePlugin - removes a plugin by url */

		removePlugin: function( url ){

			/* 	The id of the source element is programmed with the
				url of the plugin to remove. */
				
			// TODO: Should be internationalized
				
			var confirmMessage = "Are you sure you want to uninstall '" + url + "'?";
			if (window.confirm(confirmMessage)) {
				this.forceRemove(url);
			}
		}
	});
});