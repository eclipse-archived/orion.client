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

define(['i18n!javascript/nls/messages',
		'javascript/handlers/ternPluginsHandler',
		'orion/commands', 
		'orion/commandRegistry',
		'orion/objects',
		'orion/webui/littlelib',
		'orion/widgets/plugin/PluginEntry',
		'orion/explorers/explorer'
		], function(messages, ternHandler, mCommands, mCommandRegistry, objects, lib, PluginEntry, mExplorer) {

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
	PluginListRenderer.prototype.getCellElement = function(col_no, item, tableRow) {
		if (col_no === 0) {
			
//			var pluginEntry = new PluginEntry( {plugin: item, commandService: this.commandService}  );
			var node = document.createElement("div"); //$NON-NLS-1$
			var entryNode = document.createElement("div");
			entryNode.classList.add("plugin-entry"); //$NON-NLS-1$
			node.appendChild(entryNode);
			
			if (item.name){
				var nameNode = document.createElement("div"); //$NON-NLS-1$
				nameNode.classList.add("plugin-title"); //$NON-NLS-1$
				nameNode.textContent = item.name;
				entryNode.appendChild(nameNode);
			}
			
			if (item.description){
				var descNode = document.createElement("div"); //$NON-NLS-1$
//				descNode.classList.add("plugin-description"); //$NON-NLS-1$
				descNode.textContent = item.description;
				entryNode.appendChild(descNode);
			}
			
//			var cmdNode = document.createElement("span");
//			entryNode.appendChild(cmdNode);
//			this.commandService.renderCommands("pluginCommand", entryNode, null, this, "tool"); //$NON-NLS-1$ //$NON-NLS-0$
			
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
							'<div id="pluginCommands" class="pluginCommands layoutRight sectionActions"></div>' + /* pluginCommands */ //$NON-NLS-0$
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
			this.pluginCommands = lib.$(".pluginCommands", this.node); //$NON-NLS-0$	
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
			var _this = this;
			this.render();
		},

		updateToolbar: function(id){
			if(this.pluginCommands) {
				this.commandService.destroy(this.pluginCommands);
			}
		},
				
		show: function(){
			this.createElements();

			this.updateToolbar();
			
//			// set up the toolbar level commands	
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
//			
//			this.commandService.registerCommandContribution("pluginCommands", "orion.installPlugin", 2, /* not grouped */ null, false, /* no key binding yet */ null, new mCommandRegistry.URLBinding("installPlugin", "url")); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
//			var reloadAllPluginsCommand = new mCommands.Command({
//				name: messages["Reload all"],
//				tooltip: messages["ReloadAllPlugs"],
//				id: "orion.reloadAllPlugins", //$NON-NLS-0$
//				callback: this.reloadPlugins.bind(this)
//			});

			// Render the commands in the heading, emptying any old ones.
//			this.commandService.renderCommands("pluginCommands", "pluginCommands", this, this, "button"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
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

			var self = this;
			return this.preferences.getPreferences("/cm/configurations").then(function(prefs){ //$NON-NLS-1$
					var props = prefs.get("tern"); //$NON-NLS-1$
					var plugins;
					if (props && props["plugins"] !== "undefined"){
						plugins = props["plugins"];
					} else {
						plugins = {};
					}
					
					var pluginArray = [];
					for (var property in plugins) {
    					if (plugins.hasOwnProperty(property)) {
    						pluginArray.push(plugins[property]);
					    }
					}	
					
					// TODO NLS
					self.pluginTitle.textContent = "Content Assist Plugins";
					self.pluginCount.textContent = pluginArray.length;
					
					// TODO Mark some as default?
					//			for (var i=0; i<plugins.length; i++) {
					//				if (defaultPluginURLs[plugins[i].getLocation()]) {
					//					plugins[i].isDefaultPlugin = true;
					//				}
					//			}			
								
					// TODO Re-enable sorting?
					//			plugins.sort(this._sortPlugins); 
					
					
					self.explorer = new PluginListExplorer(self.commandService);
					self.pluginListTree = self.explorer.createTree(self.pluginList.id, new mExplorer.SimpleFlatModel(pluginArray, "plugin", function(item) { //$NON-NLS-1$ //$NON-NLS-0$
						return item.name;
					}), { /*setFocus: false,*/ noSelection: true});
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
			var aState = a.getState();
			var bState = b.getState();
			var aHeaders = a.getHeaders();
			var bHeaders = b.getHeaders();

			if (a.getProblemLoading() && !b.getProblemLoading()){
				return -1;
			}
			if (b.getProblemLoading() && !a.getProblemLoading()){
				return 1;
			}
			
			if (b.isDefaultPlugin && !a.isDefaultPlugin){
				return -1;
			}
			if (a.isDefaultPlugin && !b.isDefaultPlugin){
				return 1;
			}
			
			if (!aHeaders || !aHeaders.name){
				return -1;
			}
			if (!bHeaders || !bHeaders.name){
				return 1;
			}
			var n1 = aHeaders.name && aHeaders.name.toLowerCase();
			var n2 = bHeaders.name && bHeaders.name.toLowerCase();
			if (n1 < n2) { return -1; }
			if (n1 > n2) { return 1; }
			return 0;
		}
	});
	return PluginList;
});