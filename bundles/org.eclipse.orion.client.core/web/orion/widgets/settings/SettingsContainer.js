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

/* This SettingsContainer widget is a dojo border container with a left and right side. The left is for choosing a 
   category, the right shows the resulting HTML for that category. */

define(['require', 'dojo', 'dijit', 'orion/util', 'orion/commands', 'orion/PageUtil', 'dijit/TooltipDialog', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/plugin/PluginList', 'orion/widgets/settings/SplitSelectionLayout', 'orion/widgets/settings/InputBuilder'], function(require, dojo, dijit, mUtil, mCommands, PageUtil) {

	dojo.declare("orion.widgets.settings.SettingsContainer", [orion.widgets.settings.SplitSelectionLayout], {

		constructor: function() {		
			
		},

		postCreate: function() {
			this.itemToIndexMap = {};
			this.toolbar = dojo.byId( this.pageActions );
			this.manageDefaultData(this.initialSettings);
			this.drawUserInterface(this.initialSettings);
			this.inputBuilder = new orion.widgets.settings.InputBuilder( this.preferences );
			dojo.subscribe("/dojo/hashchange", this, "processHash");
		},
		
		processHash: function() {
			var pageParams = PageUtil.matchResourceParameters();
			var category = pageParams.category || "plugins";
			this.showById(category);
			this.commandService.processURL(window.location.href);
		},

		displaySettings: function(id) {
			var settingsIndex = this.itemToIndexMap[id];

			dojo.empty(this.table);

			var category = this.initialSettings[settingsIndex].category;

			dojo.create("h1", {
				id: category,
				innerHTML: category
			}, this.table);

			var subcategory = this.initialSettings[settingsIndex].subcategory;

			for (var sub = 0; sub < subcategory.length; sub++) {

				var section = dojo.create("section", {
					id: subcategory[sub].label
				}, this.table);

				dojo.create("h3", {
					innerHTML: subcategory[sub].ui
				}, section);

				var outer = dojo.create("div", null, section);

				for (var item = 0; item < subcategory[sub].items.length; item++) {

					var inner = dojo.create("div", null, outer);
					var label = dojo.create("label", null, inner);
					dojo.create("span", {
						innerHTML: subcategory[sub].items[item].label + ":"
					}, label);
					this.inputBuilder.processInputType(category, subcategory[sub].label, subcategory[sub].items[item], label, subcategory[sub].ui);
				}
			}
		},

		addPlugins: function() {

			var item = {
				id: "plugins",
				innerHTML: "Plugins",
				"class": 'navbar-item',
				onclick: dojo.hitch( this, 'showPlugins', "plugins" )
			};

			this.addCategory(item, this.initialSettings.length);
		},


/*	showPlugins - iterates over the plugin array, reads
	meta-data and creates a dom entry for each plugin.
	
	This HTML structure is a special case - the other 
	settings cases should follow more of the JSEditor
	pattern. */

		showPlugins: function(id) {
		
			var td = this.preferences.getPreferences('/settings', 2).then( function(prefs){		
				var navigate = prefs.get("JavaScript Editor");	
				
				console.log( navigate );
			} );

			if (this.selectedCategory) {
				dojo.removeClass(this.selectedCategory, "navbar-item-selected");
			}

			if (id) {
				this.selectedCategory = dojo.byId(id);
			}

			dojo.addClass(this.selectedCategory, "navbar-item-selected");

			dojo.empty(this.table);

			if (this.pluginWidget) {
				this.pluginWidget.destroyRecursive(true);
			}

			this.updateToolbar(id);
			
			var pluginNode = dojo.create( 'div', null, this.table );

			this.pluginWidget = new orion.widgets.plugin.PluginList({
				settings: this.settingsCore,
				statusService: this.preferencesStatusService,
				dialogService: this.preferenceDialogService,
				commandService: this.commandService,
				toolbarID: "pageActions"
			}, pluginNode);
		},

		showById: function(id) {
			this.updateToolbar(id);
			if (id === "plugins") {
				this.showPlugins(id);
			} else {
				this.selectCategory(id);
			}
		},

		drawUserInterface: function(settings) {

			this.inherited(arguments);

			this.addPlugins();
			this.processHash();

			/* Adjusting width of mainNode - the css class is shared 
			   so tailoring it for the preference apps */

			dojo.style(this.mainNode, "maxWidth", "700px");
			dojo.style(this.mainNode, "minWidth", "500px");
		},
		
		handleError: function( error ){
			console.log( error );
			
			
		},

		manageDefaultData: function(settings) {
		
			this.preferences.getPreferences('/settings', 2).then(function(prefs){

			// var example = [ { "subcategory":"Font", [ { "label":"Family", "value":"serif" }, {"label":"Size", "value":"10pt"}, {"label":"Line Height", "value":"12pt"} ] ];
				for (var count = 0; count < settings.length; count++) {
	
					var category = settings[count].category;

						var cat = prefs.get( category );
						
						if( cat === undefined ){
						
							var subcategories = [];
		
							var subcategory = settings[count].subcategory;
		
							for (var sub = 0; sub < subcategory.length; sub++) {
		
								var elements = [];
		
								for (var item = 0; item < subcategory[sub].items.length; item++) {
		
									var element = {};
									element.label = subcategory[sub].items[item].label;
									element.value = subcategory[sub].items[item].setting;
									elements.push(element);
								}
		
								subcategories.push({
									"label": subcategory[sub].label,
									"data": elements
								});
							}
			
							prefs.put( category, JSON.stringify(subcategories) );	
						}
					}
			} );
		},


		/* initialSettings is the structure of the settings information that we're working with for now.
		   It is a json structure that describes the categories a setting falls in and the widgets
		   that need to be used for choosing the setting values. Each choice also points to a callback
		   function. We'll need to think about this some more - because we can't assume those functions
		   are all present on the page that we've loaded - so we'll need to think of a loading mechanism. */
		
		/* Need to work on an internationalization scheme - placeholder - 'ui' is the user interface name, 
		   it should be replaceable. Perhaps plugins will need to ship with a translation file, which
		   will need to be correlated with a selected language - will refer to dojo possibly. 'label' is
		   the key for the storage field */

initialSettings: [
			{"category": "General",
				"subcategory": [{ "ui": "Navigation", "label": "Navigation",
				"items": [{ "ui": "Links", "label": "Links", "input": "combo", "values": [{"label": "Open in same tab"}, {"label": "Open in new tab"}], "setting": "Open in new tab" } ] }
				]
			},
			{"category": "JavaScript Editor",
			"subcategory": [{
				"ui": "Font",
				"label": "Font",
				"items": [{
					"ui": "Family",
					"label": "Family",
					"input": "combo",
					"values": [{
						"label": "Sans Serif"
					},
					{
						"label": "Serif"
					}],
					"setting": "Serif"
				},
				{
					"ui": "Size",
					"label": "Size",
					"input": "combo",
					"values": [{
						"label": "8pt"
					},
					{
						"label": "9pt"
					},
					{
						"label": "10pt"
					},
					{
						"label": "11pt"
					},
					{
						"label": "12pt"
					}],
					"setting": "10pt"
				},
				{
					"ui": "Color",
					"label": "Color",
					"input": "color",
					"setting": "#000000"
				},
				{
					"ui": "Background",
					"label": "Background",
					"input": "color",
					"setting": "#FFFFFF"
				}]
			},

			{
				"ui": "Strings",
				"label": "String Types",
				"items": [{
					"ui": "Color",
					"label": "Color",
					"input": "color",
					"setting": "blue"
				},
				{
					"ui": "Weight",
					"label": "Weight",
					"input": "combo",
					"values": [{
						"label": "Normal"
					},
					{
						"label": "Bold"
					}],
					"setting": "Normal"
				}]
			},
			{
				"ui": "Comments",
				"label": "Comment Types",
				"items": [{
					"ui": "Color",
					"label": "Color",
					"input": "color",
					"setting": "green"
				},
				{
					"ui": "Weight",
					"label": "Weight",
					"input": "combo",
					"values": [{
						"label": "Normal"
					},
					{
						"label": "Bold"
					}],
					"setting": "Normal"
				}]
			},
			{
				"ui": "Keywords",
				"label": "Keyword Types",
				"items": [{
					"ui": "Color",
					"label": "Color",
					"input": "color",
					"setting": "darkred"
				},
				{
					"label": "Weight",
					"input": "combo",
					"values": [{
						"label": "Normal"
					},
					{
						"label": "Bold"
					}],
					"setting": "Bold"
				}]
			}]
		}]

	});
});