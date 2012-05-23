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

define(['i18n!orion/settings/nls/messages', 'require', 'dojo', 'dijit', 'orion/util', 'orion/commands', 'orion/PageUtil', 'dijit/TooltipDialog', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/plugin/PluginList', 'orion/widgets/settings/SplitSelectionLayout', 'orion/widgets/settings/UserSettings', 'orion/widgets/settings/InputBuilder'], function(messages, require, dojo, dijit, mUtil, mCommands, PageUtil) {

	dojo.declare("orion.widgets.settings.SettingsContainer", [orion.widgets.settings.SplitSelectionLayout], { //$NON-NLS-0$

		constructor: function() {		
			
		},

		postCreate: function() {
			this.itemToIndexMap = {};
			this.toolbar = dojo.byId( this.pageActions );
			this.manageDefaultData(this.initialSettings);
			this.drawUserInterface(this.initialSettings);
			this.inputBuilder = new orion.widgets.settings.InputBuilder( this.preferences );
			dojo.subscribe("/dojo/hashchange", this, "processHash"); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.byId('location').innerHTML = 'Settings';
		},
		
		processHash: function() {
			var pageParams = PageUtil.matchResourceParameters();
			var category = pageParams.category || "userSettings"; //$NON-NLS-0$
			this.showById(category);
			this.commandService.processURL(window.location.href);
		},

		displaySettings: function(id) {
			var settingsIndex = this.itemToIndexMap[id];

			dojo.empty(this.table);

			var category = this.initialSettings[settingsIndex].category;

			dojo.create("h1", { //$NON-NLS-0$
				id: category,
				innerHTML: category
			}, this.table);

			var subcategory = this.initialSettings[settingsIndex].subcategory;

			for (var sub = 0; sub < subcategory.length; sub++) {

				var section = dojo.create("section", { //$NON-NLS-0$
					id: subcategory[sub].label, 
					role: "region",  //$NON-NLS-0$
					"aria-labelledby": subcategory[sub].label.replace(/ /g,"") + "-header" //$NON-NLS-1$ //$NON-NLS-0$
				}, this.table);

				dojo.create("h3", { //$NON-NLS-0$
					id: subcategory[sub].label.replace(/ /g,"") + "-header", //$NON-NLS-0$
					innerHTML: subcategory[sub].ui
				}, section);

				var outer = dojo.create("div", null, section); //$NON-NLS-0$

				for (var item = 0; item < subcategory[sub].items.length; item++) {

					var inner = dojo.create("div", null, outer); //$NON-NLS-0$
					var label = dojo.create("label", null, inner); //$NON-NLS-0$
					dojo.create("span", { //$NON-NLS-0$
						innerHTML: subcategory[sub].items[item].label + ":" //$NON-NLS-0$
					}, label);
					this.inputBuilder.processInputType(category, subcategory[sub].label, subcategory[sub].items[item], label, subcategory[sub].ui);
				}
			}
		},

		addPlugins: function() {

			var item = {
				id: "plugins", //$NON-NLS-0$
				innerHTML: messages["Plugins"],
				"class": 'navbar-item', //$NON-NLS-1$ //$NON-NLS-0$
				role: "tab", //$NON-NLS-0$
				tabindex: -1,
				"aria-selected": "false", //$NON-NLS-1$ //$NON-NLS-0$
				onclick: dojo.hitch( this, 'showPlugins', "plugins" ) //$NON-NLS-1$ //$NON-NLS-0$
			};

			this.addCategory(item, this.initialSettings.length);
		},
		
		addUserSettings: function() {

			var item = {
				id: "userSettings", //$NON-NLS-0$
				innerHTML: messages["User Profile"],
				"class": 'navbar-item', //$NON-NLS-1$ //$NON-NLS-0$
				role: "tab", //$NON-NLS-0$
				tabindex: -1,
				"aria-selected": "false", //$NON-NLS-1$ //$NON-NLS-0$
				onclick: dojo.hitch( this, 'showUserSettings', "userSettings" ) //$NON-NLS-1$ //$NON-NLS-0$
			};

			this.addCategory(item, this.initialSettings.length);
		},
		
		
		showUserSettings: function(id){

			if (this.selectedCategory) {
				dojo.removeClass(this.selectedCategory, "navbar-item-selected"); //$NON-NLS-0$
				dojo.attr(this.selectedCategory, "aria-selected", "false"); //$NON-NLS-1$ //$NON-NLS-0$
				this.selectedCategory.tabIndex = -1;
			}

			if (id) {
				this.selectedCategory = dojo.byId(id);
			}

			dojo.addClass(this.selectedCategory, "navbar-item-selected"); //$NON-NLS-0$
			dojo.attr(this.selectedCategory, "aria-selected", "true"); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.attr(this.mainNode, "aria-labelledby", id); //$NON-NLS-0$
			this.selectedCategory.tabIndex = 0;
			this.selectedCategory.focus();

			dojo.empty(this.table);

			if (this.userWidget) {
				this.userWidget.destroyRecursive(true);
			}

			this.updateToolbar(id);
			
			var pluginNode = dojo.create( 'div', null, this.table ); //$NON-NLS-0$

			this.userWidget = new orion.widgets.settings.UserSettings({
				registry: this.registry,
				settings: this.settingsCore,
				preferences: this.preferences,
				statusService: this.preferencesStatusService,
				dialogService: this.preferenceDialogService,
				commandService: this.commandService,
				userClient: this.userClient,
				toolbarID: "pageActions" //$NON-NLS-0$
			}, pluginNode);
			
			this.userWidget.startUp();
		},


/*	showPlugins - iterates over the plugin array, reads
	meta-data and creates a dom entry for each plugin.
	
	This HTML structure is a special case - the other 
	settings cases should follow more of the JSEditor
	pattern. */

		showPlugins: function(id) {
		
			var td = this.preferences.getPreferences('/settings', 2).then( function(prefs){		 //$NON-NLS-0$
				var navigate = prefs.get(messages["JavaScript Editor"]);					
			} );

			if (this.selectedCategory) {
				dojo.removeClass(this.selectedCategory, "navbar-item-selected"); //$NON-NLS-0$
				dojo.attr(this.selectedCategory, "aria-selected", "false"); //$NON-NLS-1$ //$NON-NLS-0$
				this.selectedCategory.tabIndex = -1;
			}

			if (id) {
				this.selectedCategory = dojo.byId(id);
			}

			dojo.addClass(this.selectedCategory, "navbar-item-selected"); //$NON-NLS-0$
			dojo.attr(this.selectedCategory, "aria-selected", "true"); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.attr(this.mainNode, "aria-labelledby", id); //$NON-NLS-0$
			this.selectedCategory.tabIndex = 0;
			this.selectedCategory.focus();

			dojo.empty(this.table);

			if (this.pluginWidget) {
				this.pluginWidget.destroyRecursive(true);
			}

			this.updateToolbar(id);
			
			var pluginNode = dojo.create( 'div', null, this.table ); //$NON-NLS-0$

			this.pluginWidget = new orion.widgets.plugin.PluginList({
				settings: this.settingsCore,
				preferences: this.preferences,
				statusService: this.preferencesStatusService,
				dialogService: this.preferenceDialogService,
				commandService: this.commandService,
				toolbarID: "pageActions" //$NON-NLS-0$
			}, pluginNode);
		},

		showById: function(id) {
			this.updateToolbar(id);
			
			switch(id){
			
				case "plugins": //$NON-NLS-0$
					this.showPlugins(id);
					break;
				
				case "userSettings": //$NON-NLS-0$
					this.showUserSettings(id);
					break;
					
				default:
					this.selectCategory(id);
					break;
			
			}
		},

		drawUserInterface: function(settings) {

			this.inherited(arguments);


			this.addUserSettings();
			this.addPlugins();
			this.processHash();

			/* Adjusting width of mainNode - the css class is shared 
			   so tailoring it for the preference apps */

			dojo.style(this.mainNode, "maxWidth", "700px"); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.style(this.mainNode, "minWidth", "500px"); //$NON-NLS-1$ //$NON-NLS-0$
		},
		
		handleError: function( error ){
			console.log( error );
		},

		manageDefaultData: function(settings) {
		
			this.preferences.getPreferences('/settings', 2).then(function(prefs){ //$NON-NLS-0$

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
									"label": subcategory[sub].label, //$NON-NLS-0$
									"data": elements //$NON-NLS-0$
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
		   
		   /* { "ui": "Login", "label": "Login", "input": "textfield", "setting": "" },
							{ "ui": "Login", "label": "Login", "input": "textfield", "setting": "" },
							{ "ui": "Email Address", "label": "Email Address", "input": "textfield", "setting": "" }*/

initialSettings: [
//			{"category": "User",
//				"subcategory": [{ "ui": "Personal information", "label": "Personal information",
//				"items": [ { "ui": "Login", "label": "Login", "input": "textfield", "setting": "" },
//							{ "ui": "Email Address", "label": "Email Address", "input": "textfield", "setting": "" } ]}
//				]
//			},
			{"category": messages["General"], //$NON-NLS-0$
				"subcategory": [{ "ui": messages['Navigation'], "label": messages["Navigation"], //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
				"items": [{ "ui": messages['Links'], "label": messages["Links"], "input": "combo", "values": [{"label": messages['Open in same tab']}, {"label": messages["Open in new tab"]}], "setting": messages["Open in same tab"] } ] } //$NON-NLS-12$ //$NON-NLS-10$ //$NON-NLS-8$ //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
				]
			},
			{"category": messages['JavaScript Editor'], //$NON-NLS-0$
			"subcategory": [{
				"ui": messages["Font"], //$NON-NLS-0$
				"label": messages['Font'], //$NON-NLS-0$
				"items": [{ //$NON-NLS-0$
					"ui": messages["Family"], //$NON-NLS-0$
					"label": messages['Family'], //$NON-NLS-0$
					"input": "combo", //$NON-NLS-1$ //$NON-NLS-0$
					"values": [{ //$NON-NLS-0$
						"label": messages["Sans Serif"] //$NON-NLS-0$
					},
					{
						"label": messages["Serif"] //$NON-NLS-0$
					}],
					"setting": messages['Serif'] //$NON-NLS-0$
				},
				{
					"ui": messages["Size"], //$NON-NLS-0$
					"label": messages['Size'], //$NON-NLS-0$
					"input": "combo", //$NON-NLS-1$ //$NON-NLS-0$
					"values": [{ //$NON-NLS-0$
						"label": messages["8pt"] //$NON-NLS-0$
					},
					{
						"label": messages["9pt"] //$NON-NLS-0$
					},
					{
						"label": messages["10pt"] //$NON-NLS-0$
					},
					{
						"label": "11pt" //$NON-NLS-1$ //$NON-NLS-0$
					},
					{
						"label": messages["12pt"] //$NON-NLS-0$
					}],
					"setting": messages['10pt'] //$NON-NLS-0$
				},
				{
					"ui": messages["Color"], //$NON-NLS-0$
					"label": messages['Color'], //$NON-NLS-0$
					"input": "color", //$NON-NLS-1$ //$NON-NLS-0$
					"setting": "#000000" //$NON-NLS-1$ //$NON-NLS-0$
				},
				{
					"ui": messages["Background"], //$NON-NLS-0$
					"label": messages['Background'], //$NON-NLS-0$
					"input": "color", //$NON-NLS-1$ //$NON-NLS-0$
					"setting": "#FFFFFF" //$NON-NLS-1$ //$NON-NLS-0$
				}]
			},

			{
				"ui": messages["Strings"], //$NON-NLS-0$
				"label": messages["String Types"], //$NON-NLS-0$
				"items": [{ //$NON-NLS-0$
					"ui": messages['Color'], //$NON-NLS-0$
					"label": messages['Color'], //$NON-NLS-0$
					"input": "color", //$NON-NLS-1$ //$NON-NLS-0$
					"setting": messages["blue"] //$NON-NLS-0$
				},
				{
					"ui": messages["Weight"], //$NON-NLS-0$
					"label": messages['Weight'], //$NON-NLS-0$
					"input": "combo", //$NON-NLS-1$ //$NON-NLS-0$
					"values": [{ //$NON-NLS-0$
						"label": messages["Normal"] //$NON-NLS-0$
					},
					{
						"label": messages["Bold"] //$NON-NLS-0$
					}],
					"setting": messages['Normal'] //$NON-NLS-0$
				}]
			},
			{
				"ui": messages["Comments"], //$NON-NLS-0$
				"label": messages["Comment Types"], //$NON-NLS-0$
				"items": [{ //$NON-NLS-0$
					"ui": messages['Color'], //$NON-NLS-0$
					"label": messages['Color'], //$NON-NLS-0$
					"input": "color", //$NON-NLS-1$ //$NON-NLS-0$
					"setting": messages["green"] //$NON-NLS-0$
				},
				{
					"ui": messages['Weight'], //$NON-NLS-0$
					"label": messages['Weight'], //$NON-NLS-0$
					"input": "combo", //$NON-NLS-1$ //$NON-NLS-0$
					"values": [{ //$NON-NLS-0$
						"label": messages['Normal'] //$NON-NLS-0$
					},
					{
						"label": messages['Bold'] //$NON-NLS-0$
					}],
					"setting": messages['Normal'] //$NON-NLS-0$
				}]
			},
			{
				"ui": messages["Keywords"], //$NON-NLS-0$
				"label": messages["Keyword Types"], //$NON-NLS-0$
				"items": [{ //$NON-NLS-0$
					"ui": messages['Color'], //$NON-NLS-0$
					"label": messages['Color'], //$NON-NLS-0$
					"input": "color", //$NON-NLS-1$ //$NON-NLS-0$
					"setting": messages["darkred"] //$NON-NLS-0$
				},
				{
					"label": messages['Weight'], //$NON-NLS-0$
					"input": "combo", //$NON-NLS-1$ //$NON-NLS-0$
					"values": [{ //$NON-NLS-0$
						"label": messages['Normal'] //$NON-NLS-0$
					},
					{
						"label": messages['Bold'] //$NON-NLS-0$
					}],
					"setting": messages['Bold'] //$NON-NLS-0$
				}]
			}]
		}]

	});
});
