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
/*global dojo dijit widgets orion console define*/
/*jslint browser:true*/

define(['require', 'dojo', 'dijit', 'orion/util', 'dijit/TooltipDialog', 'orion/widgets/ServiceCarousel'], function(require, dojo, dijit, mUtil) {
	
	dojo.declare("orion.widgets.PluginList", [dijit._Widget, dijit._Templated], {
	
		templateString: '<div>' + 
							'<div class="pluginwrapper">' +
								'<div class="pluginTitle" data-dojo-attach-point="pluginTitle"></div>' +
								'<div class="additions" data-dojo-attach-point="pluginControl" data-dojo-attach-event="onclick:addNewPlugins">Add Plugins</div>' +
					        '</div>' +
					        '<div class="displaytable">' +
								'<div data-dojo-attach-point="pluginDialog" class="interactionClosed">' +
									'<table id="dev-table" width="100%">' +
										'<tr>' +
											'<td>' +
												'<input data-dojo-attach-point="pluginUrlEntry" type="url" data-dojo-attach-event="onfocus:pluginURLFocus, onblur:pluginURLBlur" value="Type a plugin url here ..." name="user_url" style="width:400px;color:#AAA;"/>' +
												'<button data-dojo-attach-event="onclick:installHandler">Load this plugin</button>' +
											'</td>' +
											'<td align="right">' +
												'<button id="update-extensions-now" data-dojo-attach-event="onclick:reloadPlugins">Re-load all</button>' +
											'</td>' +
										'</tr>' +
									'</table>' +
								'</div>' +
								'<div class="plugin-settings">' +
									'<list data-dojo-attach-point="pluginSettingsList"></list>' +
								'</div>' +
							'</div>' +
					    '</div>',
					    
		iconSource: "data:image/png;base64,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",
				
		pluginDialogState: false,
				
	/*	derivePluginNameFromLocation - temporary function - 
		the current plugins don't provide useful enough, or 
		consistent meta-data to use for descriptions. */

		derivePluginNameFromLocation: function( location ){
		
			function wordToUpper(strSentence) {
		
				function convertToUpper() {
					return arguments[0].toUpperCase();
				}
		
				return strSentence.toLowerCase().replace(/\b[a-z]/g, convertToUpper);
			}
		
			var divides = location.split( "/" );
			var last = divides[divides.length-1];
			last = last.split( ".html" )[0];
			last = last.replace( /([a-z])([A-Z])/, "$1 $2");
			last = wordToUpper( last );
			return last;
		},
					    
					    
		postCreate: function(){
			this.addRows();
		},
		
		addRows: function(){
			
			var list = this.pluginSettingsList;
			dojo.empty( list );
			
			var pluginList = this.settings.pluginRegistry.getPlugins();
			
			this.pluginTitle.innerHTML = "Plugins [" + pluginList.length +"]";

			for( var p = 0; p < pluginList.length; p++ ){
			
				var plg = pluginList[p].getData();	
				var ref = pluginList[p].getServiceReferences();
				
				var rcount=0;
				var serviceData = [];	
				
				for( rcount;rcount<ref.length;rcount++ ){
				
					var s = { 'service': ref[rcount].name };
					var props = [];
					var properties = ref[rcount].properties;

					for( var pItem in properties ){
						if( pItem ){
							var item = { 'item':pItem, 'value':properties[pItem] };
							props.push(item);
						}
					}
					
					s.items = props;
					serviceData.push(s);
				}
				
				var location = pluginList[p].getLocation();
				
				var name = this.derivePluginNameFromLocation( location );
				
				var extensionListItem = dojo.create( "div", { "class":"plugin-list-item" }, list );
				var container = dojo.create( "div", /*{ "class":"container" }*/ null, extensionListItem );
				var icon = dojo.create( "img", { "class":"plugin-icon", "src": this.iconSource }, container );
				var detailsView = dojo.create( "div", { "class":"stretch" }, container );
				var title = dojo.create( "span", { "class":"plugin-title", innerHTML: name }, detailsView );
				dojo.create( "div", null, detailsView );
				var description = dojo.create( "span", { "class":"plugin-description", innerHTML: "A plugin for Eclipse Orion" }, detailsView );
				dojo.create( "a", { "class":"plugin-link", href: location, innerHTML: "Plugin Link" }, detailsView ); 
				
				var removeButton = dojo.create( "button", { "id":location, "class":"plugin-delete", innerHTML: "Remove", 'onclick': dojo.hitch( this, "removePlugin" ) }, container );	
				
				var serviceContainer = dojo.create("div", {'class':'plugin-service-item'}, list);
				
				new orion.widgets.ServiceCarousel({serviceData:serviceData}, serviceContainer );		
			}	                
		},
		
		addNewPlugins: function(){
			if( this.pluginDialogState === false ){		
				dojo.removeClass( this.pluginDialog, "interactionClosed" );
				dojo.addClass( this.pluginDialog, "interactionOpen" );
				this.pluginControl.innerHTML = "Hide Dialog";
				this.pluginDialogState = true;
			}else{
				dojo.removeClass( this.pluginDialog, "interactionOpen" );
				dojo.addClass( this.pluginDialog, "interactionClosed" );
				this.pluginControl.innerHTML = "Add Plugins";
				this.pluginDialogState = false;
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
			this.pluginUrlEntry.value="";
			this.statusService.setMessage("Installed " + plugin.getLocation(), 5000);
			this.settings.preferences.getPreferences("/plugins").then(function(plugins) {
				plugins.put(this.newPluginUrl, true);
			}); // this will force a sync
			
			this.addRows();

		},

		pluginError: function( error ){
			this.statusService.setErrorMessage(error);
		},
		
		installHandler: function(){
			this.newPluginUrl = this.pluginUrlEntry.value;
			if (/^\S+$/.test(dojo.trim(this.newPluginUrl))) {
				this.statusService.setMessage("Installing " + this.newPluginUrl + "...");
				if( this.settings.pluginRegistry.getPlugin(this.newPluginUrl) ){
					this.statusService.setErrorMessage("Already installed");
				} else {
					this.settings.pluginRegistry.installPlugin(this.newPluginUrl).then( dojo.hitch( this, 'addPlugin' ), dojo.hitch( this, 'pluginError' ) );
				}
			}
		},
		
		reloaded: function(){
			var settingsPluginList = this.settings.pluginRegistry.getPlugins();
			this.statusService.setMessage( "Reloaded " + settingsPluginList.length + " plugin" + ( settingsPluginList.length===1 ? "": "s") + ".", 5000 );
			this.addRows();
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
		
		forceRemove: function(decision){
			if( decision === true ){		
			
				var settings = this.settings;
				var statusService = this.statusService;
				
				var settingsPluginList = settings.pluginRegistry.getPlugins();
			
				for( var p = 0; p < settingsPluginList.length; p++ ){
					if( settingsPluginList[p].getLocation() === event.srcElement.id ){
						settingsPluginList[p].uninstall();
	
						this.pluginUrlEntry.value="";
						statusService.setMessage("Uninstalled " + event.srcElement.id, 5000);
						settings.preferences.getPreferences("/plugins").then(function(plugins) {
							plugins.remove(event.srcElement.id);
						}); // this will force a sync
						
						this.addRows();
						
						break;
					}
				}
			}
		},
		
		
		/* removePlugin - removes a plugin by url */

		removePlugin: function( event ){

			/* 	The id of the source element is programmed with the
				url of the plugin to remove. */
				
			// TODO: Should be internationalized
				
			var confirmMessage = "Are you sure you want to uninstall '" + event.srcElement.id + "'?";
			
			this.dialogService.confirm( confirmMessage, dojo.hitch( this, 'forceRemove' ) );
		}
	});
});