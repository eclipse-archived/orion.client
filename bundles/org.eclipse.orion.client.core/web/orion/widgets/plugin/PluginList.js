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

define(['i18n!orion/settings/nls/messages', 'require', 'dojo', 'dijit', 'orion/util', 'orion/commands', 'dijit/TooltipDialog', 'orion/widgets/plugin/PluginEntry'], function(messages, require, dojo, dijit, mUtil, mCommands) {
	
	dojo.declare("orion.widgets.plugin.PluginList", [dijit._Widget, dijit._Templated], { //$NON-NLS-0$
	
		templateString: '<div>' +  //$NON-NLS-0$
							'<div class="sectionWrapper sectionWrapperAux toolComposite"><div class="sectionAnchor" data-dojo-attach-point="pluginTitle" style="float:left;"></div><div class="pluginCount" data-dojo-attach-point="pluginCount" style="float:left;;">0</div></div>' + //$NON-NLS-2$ //$NON-NLS-0$

					        '<div class="displaytable">' + //$NON-NLS-0$
								'<div class="plugin-settings">' + //$NON-NLS-0$
									'<list style="overflow:hidden;" data-dojo-attach-point="pluginSettingsList"></list>' + //$NON-NLS-0$
								'</div>' + //$NON-NLS-0$
							'</div>' + //$NON-NLS-0$
					    '</div>', //$NON-NLS-0$
				
		pluginDialogState: false,
		
		includeMaker: false,
		
		target: "_self", //$NON-NLS-0$
					    
		postCreate: function(){
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
			this.commandService.registerCommandContribution(this.toolbarID, "orion.installPlugin", 1, /* not grouped */ null, false, /* no key binding yet */ null, new mCommands.URLBinding("installPlugin", "url")); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var reloadAllPluginsCommand = new mCommands.Command({
				name: messages["Reload all"],
				tooltip: messages["Reload all installed plugins"],
				id: "orion.reloadAllPlugins", //$NON-NLS-0$
				callback: dojo.hitch(this, function() {
					this.reloadPlugins();
				})
			});
			this.commandService.addCommand(reloadAllPluginsCommand);
			// register these with the toolbar and render them.  Rendering is normally done by our outer page, but since
			// we might have been created after the page first loaded, we have to do this ourselves.
			this.commandService.registerCommandContribution(this.toolbarID, "orion.reloadAllPlugins", 2); //$NON-NLS-0$
			
			
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
				this.commandService.registerCommandContribution(this.toolbarID, "orion.createPlugin", 2); //$NON-NLS-0$
			}
			
			this.commandService.renderCommands(this.toolbarID, this.toolbarID, this, this, "button"); //$NON-NLS-0$
			
			var reloadPluginCommand = new mCommands.Command({
				name: messages["Reload"],
				tooltip: messages["Reload the plugin"],
				id: "orion.reloadPlugin", //$NON-NLS-0$
				imageClass: "core-sprite-refresh", //$NON-NLS-0$
				visibleWhen: function(items) {  // we expect a URL
					return typeof items === "string"; //$NON-NLS-0$
				},
				callback: dojo.hitch(this, function(data) {
					this.reloadPlugin(data.items);
				})
			});			
			this.commandService.addCommand(reloadPluginCommand);
			this.commandService.registerCommandContribution("pluginCommand", "orion.reloadPlugin", 1); //$NON-NLS-1$ //$NON-NLS-0$

			// now we register commands that are appropriate at the object (row) level
			var uninstallPluginCommand = new mCommands.Command({
				name: messages["Delete"],
				tooltip: messages["Delete this plugin from the configuration"],
				imageClass: "core-sprite-delete", //$NON-NLS-0$
				id: "orion.uninstallPlugin", //$NON-NLS-0$
				visibleWhen: function(items) {  // we expect a URL
					return typeof items === "string"; //$NON-NLS-0$
				},
				callback: dojo.hitch(this, function(data) {
					this.removePlugin(data.items);
				})
			});			
			this.commandService.addCommand(uninstallPluginCommand);
			this.commandService.registerCommandContribution("pluginCommand", "orion.uninstallPlugin", 2); //$NON-NLS-1$ //$NON-NLS-0$
			this.addRows();
			this.setTarget();
			this.storageKey = this.preferences.listenForChangedSettings( dojo.hitch( this, 'onStorage' ) ); //$NON-NLS-0$
		},
		
		addRows: function(){
			
			var list = this.pluginSettingsList;
			dojo.empty( list );
			var pluginList = this.settings.pluginRegistry.getPlugins();
			this.pluginTitle.innerHTML = messages['Plugins'];
			this.pluginCount.innerHTML = pluginList.length;

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
		
		addPlugin: function( plugin ){
			this.statusService.setMessage(messages["Installed "] + plugin.getLocation(), 5000, true);
			this.settings.preferences.getPreferences("/plugins").then(function(plugins) { //$NON-NLS-0$
				plugins.put(plugin.getLocation(), true);
			}); // this will force a sync
			
			this.addRows();

		},

		pluginError: function( error ){
			this.statusService.setErrorMessage(error);
		},
		
		installHandler: function(newPluginUrl){
			if (/^\S+$/.test(dojo.trim(newPluginUrl))) {
				this.statusService.setMessage(messages["Installing "] + newPluginUrl + "...", null, true); //$NON-NLS-1$
				if( this.settings.pluginRegistry.getPlugin(newPluginUrl) ){
					this.statusService.setErrorMessage(messages["Already installed"]);
				} else {
					this.settings.pluginRegistry.installPlugin(newPluginUrl).then( dojo.hitch( this, 'addPlugin' ), dojo.hitch( this, 'pluginError' ) ); //$NON-NLS-1$ //$NON-NLS-0$
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
			var settingsPluginList = this.settings.pluginRegistry.getPlugins();
			for( var p = 0; p < settingsPluginList.length; p++ ){
				if( settingsPluginList[p].getLocation() === url ){
					settingsPluginList[p].update();
					this.statusService.setMessage(messages['Reloaded '] + url, 5000, true);
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
			
			d.then( dojo.hitch( this, "reloaded" ) ); //$NON-NLS-0$
		},
		
		forceRemove: function(url){
			var settings = this.settings;
			var statusService = this.statusService;
			
			var settingsPluginList = settings.pluginRegistry.getPlugins();
		
			for( var p = 0; p < settingsPluginList.length; p++ ){
				if( settingsPluginList[p].getLocation() === url ){
					settingsPluginList[p].uninstall();
					statusService.setMessage(messages["Uninstalled "] + url, 5000, true);
					settings.preferences.getPreferences("/plugins").then(function(plugins) { //$NON-NLS-0$
						plugins.remove(url);
					}); // this will force a sync
					
					this.addRows();
					
					break;
				}
			}
		},
		
		setTarget: function(){
	
			var preferences = this.preferences;	
			var renderer = this;
		
			this.preferences.getPreferences('/settings', 2).then( function(prefs){	 //$NON-NLS-0$
			
				var data = prefs.get("General"); //$NON-NLS-0$
				
				if( data !== undefined ){
						
					var storage = JSON.parse( data );
					
					if(storage){
						var target = preferences.getSetting( storage, "Navigation", messages['Links'] ); //$NON-NLS-0$
						
						if( target === messages['Open in new tab'] ){
							target = "_blank"; //$NON-NLS-0$
						}else{
							target = "_self"; //$NON-NLS-0$
						}
						
						renderer.target = target;
					}
				}
			});
		},
		
		onStorage:function (e) {
			if( e.key === this.storageKey ){
				this.setTarget();
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