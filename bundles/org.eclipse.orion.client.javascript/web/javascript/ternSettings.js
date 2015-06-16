/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/
/* This widget provides a list of Tern plug-in entries */

define([
'i18n!javascript/nls/messages',
'orion/commands', 
'orion/commandRegistry',
'orion/objects',
'orion/webui/littlelib',
'orion/explorers/explorer'
], function(messages, mCommands, mCommandRegistry, objects, lib, mExplorer) {

	var Explorer = mExplorer.Explorer;
	var SelectionRenderer = mExplorer.SelectionRenderer;

	/**
	 * PluginListRenderer
	 */
	function PluginListRenderer(commandService, explorer) {
		SelectionRenderer.call(this, {}, explorer);
		this.commandService = commandService;
	}
	PluginListRenderer.prototype = Object.create(SelectionRenderer.prototype);
	PluginListRenderer.prototype.getCellElement = /* @callback */ function(col_no, item, tableRow) {
		if (col_no === 0) {
			var node = document.createElement("div"); //$NON-NLS-1$
			var entryNode = document.createElement("div"); //$NON-NLS-1$
			entryNode.classList.add("plugin-entry"); //$NON-NLS-1$
			
//			var cmdNode = document.createElement("span"); //$NON-NLS-1$
//			cmdNode.classList.add("plugin-commands"); //$NON-NLS-1$
//			var reloadPluginsCommand = new mCommands.Command({
//				name: messages["reloadPluginCmd"],
//				tooltip: messages["reloadPluginCmdTooltip"],
//				id: "javascript.reloadTernPlugin", //$NON-NLS-0$
//				callback: function(){console.log("Reloading of Tern plugins is not supported yet");}/*this.reloadPlugins.bind(this)*/
//			});
//			this.commandService.addCommand(reloadPluginsCommand);
//			this.commandService.registerCommandContribution("ternPluginCommands", "javascript.reloadTernPlugin", 2); //$NON-NLS-1$ //$NON-NLS-0$ //$NON-NLS-2$
//			this.commandService.renderCommands("ternPluginCommands", cmdNode, this, this, "button"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			// TODO entryNode.appendChild(cmdNode);
			
			// TODO NLS Version and Removeable or replace with icons
			if (item.name){
				var nameNode = document.createElement("div"); //$NON-NLS-1$
				nameNode.classList.add("plugin-title"); //$NON-NLS-1$
				nameNode.textContent = item.name;
				
				if (item.version){
					var versionNode = document.createElement("span"); //$NON-NLS-1$
					versionNode.textContent = 'v'+item.version; //$NON-NLS-1$
					versionNode.style.marginLeft = "10px"; //$NON-NLS-1$
					nameNode.appendChild(versionNode);
				}
				
				entryNode.appendChild(nameNode);
			}
			
			if (item.description){
				var descNode = document.createElement("div"); //$NON-NLS-1$
				descNode.textContent = item.description;
				// TODO Show to the user that the plug-in is added by the platform and can't be removed
//				if (item.removable){
//					descNode.textContent += " (Removable)";
//				}
				entryNode.appendChild(descNode);
			}
			
			
			node.appendChild(entryNode);
			return node;
		}
	};

	/**
	 * PluginListExplorer
	 */
	function PluginListExplorer(commandService) {
		this.renderer = new PluginListRenderer(commandService, this);
	}
	PluginListExplorer.prototype = Object.create(Explorer.prototype);

	/**
	 * PluginList
	 * UI interface element showing a list of plugins
	 */
	function PluginList(options, parentNode) {
		objects.mixin(this, options);
		this.node = parentNode || document.createElement("div"); //$NON-NLS-0$
	}
	objects.mixin(PluginList.prototype, {
		templateString: '' +  //$NON-NLS-0$
						'<div id="pluginSectionHeader" class="pluginSectionHeader sectionWrapper toolComposite">' +  /* pluginSectionHeader */ //$NON-NLS-0$
							'<div class="sectionAnchor sectionTitle layoutLeft"></div>' + /* pluginTitle */ //$NON-NLS-0$
							'<div class="sectionItemCount layoutLeft">0</div>' + /* pluginCount */ //$NON-NLS-0$
							'<div id="ternPluginCommands" class="pluginCommands layoutRight sectionActions"></div>' + /* pluginCommands */ //$NON-NLS-0$
						'</div>' + //$NON-NLS-0$

				        '<div class="displaytable layoutBlock sectionTable">' + //$NON-NLS-0$
							'<div class="plugin-list-container">' + //$NON-NLS-0$
								'<div class="plugin-list" id="plugin-list" style="overflow:hidden;"></div>' + //$NON-NLS-0$ /* pluginList */
							'</div>' + //$NON-NLS-0$
						'</div>', //$NON-NLS-0$
				
		pluginDialogState: false,
		
		includeMaker: false,
		
		target: "_self", //$NON-NLS-0$

		createElements: function() {
			this.node.innerHTML = this.templateString;
			this.pluginSectionHeader = lib.$(".pluginSectionHeader", this.node); //$NON-NLS-0$
			this.pluginTitle = lib.$(".sectionAnchor", this.node); //$NON-NLS-0$
			this.pluginCount = lib.$(".sectionItemCount", this.node); //$NON-NLS-0$
			this.pluginCommands = lib.$(".ternPluginCommands", this.node); //$NON-NLS-0$	
			this.pluginList = lib.$(".plugin-list", this.node); //$NON-NLS-0$
			this.postCreate();
		},

		destroy: function() {
			if (this.node) {
				lib.empty(this.node);
				this.node = this.pluginSectionHeader = this.pluginTitle = this.pluginCount = this.pluginCommands = this.pluginList = null;
			}
		},
				
		postCreate: function(){
			this.render();
		},

		/**
		 * @callback
		 */
		updateToolbar: function(id){
			if(this.pluginCommands) {
				this.commandService.destroy(this.pluginCommands);
			}
		},
				
		show: function(){
			this.createElements();
			this.updateToolbar();
			
			// set up the toolbar level commands	
//			var installPluginCommand = new mCommands.Command({
//				name: messages["Install"],
//				tooltip: messages["PlugInstallByURL"],
//				id: "orion.installPlugin", //$NON-NLS-0$
//				parameters: new mCommandRegistry.ParametersDescription([new mCommandRegistry.CommandParameter('url', 'url', messages['Plugin URL:'], '')]), //$NON-NLS-1$ //$NON-NLS-0$
//				callback: function(data) {
//					if (data.parameters) {
//						var location = data.parameters.valueFor('url'); //$NON-NLS-0$
//						if (location) {
//							this.installHandler(location);
//						}
//					}
//				}.bind(this)
//			});
//			
//			this.commandService.addCommand(installPluginCommand);
			
//			this.commandService.registerCommandContribution("ternPluginCommands", "orion.installPlugin", 2, /* not grouped */ null, false, /* no key binding yet */ null, new mCommandRegistry.URLBinding("installPlugin", "url")); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
//			var reloadAllPluginsCommand = new mCommands.Command({
//				name: messages["reloadAllPluginsCmd"],
//				tooltip: messages["reloadAllPluginsCmdTooltip"],
//				id: "javascript.reloadAllTernPlugins", //$NON-NLS-0$
//				callback: function(){console.log("Reloading of Tern plugins is not supported yet");}/*this.reloadPlugins.bind(this)*/
//			});
//
//			this.commandService.addCommand(reloadAllPluginsCommand);
//			// register these with the toolbar
//			this.commandService.registerCommandContribution("ternPluginsCommands", "javascript.reloadAllTernPlugins", 3); //$NON-NLS-1$ //$NON-NLS-2$
//
//			// Render the commands in the heading, emptying any old ones.
//			this.commandService.renderCommands("ternPluginsCommands", "ternPluginCommands", this, this, "button"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-3$
		},
	
		render: function(referenceplugin){
		 
			// Declare row-level commands so they will be rendered when the rows are added.
			var reloadPluginCommand = new mCommands.Command({
				name: messages["reloadPluginCmd"],
				tooltip: messages["reloadPluginCmdTooltip"],
				id: "javascript.reloadTernPlugin", //$NON-NLS-0$
				imageClass: "core-sprite-refresh", //$NON-NLS-0$
				visibleWhen: function(items) {
					// TODO Fix reload command
//					return typeof items === "string"; //$NON-NLS-0$
					return true;
				},
				callback: function(data) {
//					this.reloadPlugin(data.items);
					console.log("Reloading plug-in");
				}.bind(this)
			});			
			this.commandService.addCommand(reloadPluginCommand);
			this.commandService.registerCommandContribution("ternPluginCommand", "javascript.reloadTernPlugin", 1); //$NON-NLS-1$ //$NON-NLS-2$

			var _self = this;
			return this.preferences.getPreferences("/cm/configurations").then(function(prefs){ //$NON-NLS-1$
					var props = prefs.get("tern/plugins"); //$NON-NLS-1$
					var plugins = Object.create(null);
					if(typeof(props) === 'string') {
						plugins = JSON.parse(props);
					} else {
						plugins = props;
					}
					var pluginArray = [];
					var keys = Object.keys(plugins);
					for (var i=0; i<keys.length; i++) {
						var plugin = plugins[keys[i]];
						if(typeof(plugin) === 'object' && plugin.name) {
							pluginArray.push(plugin);
						}
					}
					_self.pluginTitle.textContent = messages["ternPlugins"];
					
					if (pluginArray.length > 0){
						_self.pluginCount.textContent = pluginArray.length;
						pluginArray.sort(_self._sortPlugins); 
						_self.explorer = new PluginListExplorer(_self.commandService);
						_self.pluginListTree = _self.explorer.createTree(_self.pluginList.id, new mExplorer.SimpleFlatModel(pluginArray, "plugin", function(item) { //$NON-NLS-1$ //$NON-NLS-0$
							return item.name;
						}), { noSelection: true});
					} else {
						_self.pluginList.style.padding = "10px"; //$NON-NLS-1$
						_self.pluginList.textContent = messages["noTernPluginsAvailable"];
					}
			});
		},
		
		/**
		 * @name _sortPlugins
		 * @description sorts plugins by state, then default config, then name
		 * @function
		 * @private
		 * @param a first object to compare
		 * @param b second object to return
		 * @returns -1 for a first, 1 for b first, 0 if equals
		 */
		_sortPlugins: function(a, b) {
			//TODO do we want to sort by removable? or only colour them differently? or simply use the 'remove' command to show this
			/*if (b.removable && !a.removeable){
				return -1;
			}
			if (a.removable && !b.removable){
				return 1;
			}*/
			var n1 = a.name.toLowerCase();
			var n2 = b.name.toLowerCase();
			if (n1 < n2) { return -1; }
			if (n1 > n2) { return 1; }
			return 0;
		}
	});
	return PluginList;
});