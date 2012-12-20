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
/*jslint browser:true sub:true*/

/* This SettingsContainer widget is a dojo border container with a left and right side. The left is for choosing a 
   category, the right shows the resulting HTML for that category. */

define(['i18n!orion/settings/nls/messages', 'require', 'dojo', 'dijit', 'orion/globalCommands',
		'orion/PageUtil', 'orion/widgets/themes/ThemeBuilder', 'orion/settings/ui/PluginSettings', 'orion/URITemplate', 'orion/widgets/themes/editor/ThemeData',
		'orion/widgets/themes/container/ThemeData', 'dijit/TooltipDialog', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/plugin/PluginList',
		'orion/widgets/settings/SplitSelectionLayout', 'orion/widgets/settings/UserSettings', 'orion/widgets/settings/InputBuilder'],
		function(messages, require, dojo, dijit, mGlobalCommands, PageUtil, mThemeBuilder, SettingsList, URITemplate, editorThemeData, containerThemeData) {

	dojo.declare("orion.widgets.settings.SettingsContainer", [orion.widgets.settings.SplitSelectionLayout], { //$NON-NLS-0$

		constructor: function() {		
			this.settingsCategories = [
				/*{
					id: "userSettings", //$NON-NLS-0$
					textContent: messages["User Profile"],
					show: this.showUserSettings
				},*/
				{
					id: "themeBuilder", //$NON-NLS-0$
					textContent: 'UI Theme', // messages["Themes"],
					show: this.showThemeBuilder
				},
				{
					id: "editorThemeBuilder", //$NON-NLS-0$
					textContent: 'Editor Theme', // messages["Themes"],
					show: this.showEditorThemeBuilder
				},
				{
					id: "plugins", //$NON-NLS-0$
					textContent: messages["Plugins"],
					show: this.showPlugins
				}];
			this.settingsCategories.forEach(function(item) {
				item.show = item.show.bind(this, item.id);
			}.bind(this));
		},

		postMixInProperties: function() {
			// Add extension categories
			this.settingsRegistry.getCategories().sort().forEach(function(category, i) {
				this.settingsCategories.push({
					id: category,
					textContent: messages[category] || category,
					show: this.showPluginSettings.bind(this, category)
				});
			}.bind(this));
		},

		postCreate: function() {
			this.itemToIndexMap = {};
			this.toolbar = dojo.byId( this.pageActions );
			this.manageDefaultData(this.initialSettings);
			// hack/workaround.  We may still be initializing the settings asynchronously in manageDefaultData, so we do not want
			// to build the UI until there are settings to be found there.
			window.setTimeout(dojo.hitch(this, function() {
				this.drawUserInterface(this.initialSettings);
				this.inputBuilder = new orion.widgets.settings.InputBuilder( this.preferences );
			}), 100);
			dojo.subscribe("/dojo/hashchange", this, "processHash"); //$NON-NLS-1$ //$NON-NLS-0$
			mGlobalCommands.setPageTarget({task: 'Settings'});
		},
		
		processHash: function() {
			var pageParams = PageUtil.matchResourceParameters();
			
			var container = this;
			
			this.preferences.getPreferences('/settingsContainer', 2).then(function(prefs){

				var selection = prefs.get( 'selection' );

				var category = pageParams.category || selection; //$NON-NLS-0$

				if(container.selectedCategory){
					if( container.selectedCategory.id === category){
						//No need to reselect the category
						return;
					}
				}

				container.showByCategory(category);
				
			} );
			
			window.setTimeout(dojo.hitch(this, function() {this.commandService.processURL(window.location.href);}), 0);
		},
		
		displaySettings: function(id) {
			var settingsIndex = this.itemToIndexMap[id];

			dojo.empty(this.table);

			var category = this.initialSettings[settingsIndex].category;
			
			var sectionWrapper = dojo.create('div', { 'class':'sectionWrapper sectionWrapperAux toolComposite' }, this.table );

			var div = dojo.create('div', { //$NON-NLS-0$
				id: category,
				'class':'sectionAnchor'
			}, sectionWrapper);
			div.textContent = category;
			
			// <div class="sectionWrapper sectionWrapperAux toolComposite"><div class="sectionAnchor">User Profile</div></div>

			var subcategory = this.initialSettings[settingsIndex].subcategory;

			for (var sub = 0; sub < subcategory.length; sub++) {

				var section = dojo.create("section", { //$NON-NLS-0$
					id: subcategory[sub].label, 
					role: "region",  //$NON-NLS-0$
					"aria-labelledby": subcategory[sub].label.replace(/ /g,"") + "-header", //$NON-NLS-1$ //$NON-NLS-0$
					className: 'setting-row'
				}, this.table);

				var h3 = dojo.create("h3", { //$NON-NLS-0$
					id: subcategory[sub].label.replace(/ /g,"") + "-header", //$NON-NLS-0$
					className: 'setting-header'
				}, section);
				h3.textContent = subcategory[sub].ui;

				var outer = dojo.create("div", {className: 'setting-content'}, section); //$NON-NLS-0$

				for (var item = 0; item < subcategory[sub].items.length; item++) {

					var inner = dojo.create("div", {className: 'setting-property'}, outer); //$NON-NLS-0$
					var label = dojo.create("label", null, inner); //$NON-NLS-0$
					var span = dojo.create("span", { //$NON-NLS-0$
						className: 'setting-label'
					}, label);
					span.textContent = subcategory[sub].items[item].label + ":"; //$NON-NLS-0$
					this.inputBuilder.processInputType(category, subcategory[sub].label, subcategory[sub].items[item], label, subcategory[sub].ui);
				}
			}
		},

		showThemeBuilder: function(id){
		
			this.selectCategory(id);
			
			this.updateToolbar(id);
		
			if(this.themeWidget) {
				this.themeWidget.destroy();
			}
			
			var containerTheme = new containerThemeData.ThemeData();
		
			this.themeWidget = new mThemeBuilder.ThemeBuilder({ commandService: this.commandService, preferences: this.preferences, themeData: containerTheme });
			
			dojo.empty(this.table);

			var themeNode = dojo.create( 'div', null, this.table );

			this.themeWidget.renderData( themeNode, 'INITIALIZE' );
		},
		
		showEditorThemeBuilder: function(id){
		
			this.selectCategory(id);
			
			this.updateToolbar(id);
		
			if(this.editorThemeWidget) {
				this.editorThemeWidget.destroy();
			}
			
			var editorTheme = new editorThemeData.ThemeData();
		
			this.editorThemeWidget = new mThemeBuilder.ThemeBuilder({ commandService: this.commandService, preferences: this.preferences, themeData: editorTheme });
			
			var command = { name:'Import', tip:'Import a theme', id:0, callback: dojo.hitch( editorTheme, 'importTheme' ) };
			
			this.editorThemeWidget.addAdditionalCommand( command );
			
			dojo.empty(this.table);

			var themeNode = dojo.create( 'div', null, this.table );

			this.editorThemeWidget.renderData( themeNode, 'INITIALIZE' );
		},
		
		showUserSettings: function(id){
		
//			var td = this.preferences.getPreferences('/settings', 2).then( function(prefs){		 //$NON-NLS-0$
//				var navigate = prefs.get(messages["JavaScript Editor"]);
//			} );

			this.selectCategory(id);

			dojo.empty(this.table);

			if (this.userWidget) {
				this.userWidget.destroyRecursive(true);
			}

			this.updateToolbar(id);
			
			var userNode = dojo.create( 'div', null, this.table ); //$NON-NLS-0$

			this.userWidget = new orion.widgets.settings.UserSettings({
				registry: this.registry,
				settings: this.settingsCore,
				preferences: this.preferences,
				statusService: this.preferencesStatusService,
				dialogService: this.preferenceDialogService,
				commandService: this.commandService,
				userClient: this.userClient
			}, userNode);
			
			this.userWidget.startUp();
		},
		
		initPlugins: function(id){
			dojo.empty(this.table);

			if (this.pluginWidget) {
				this.pluginWidget.destroyRecursive(true);
			}

			var pluginNode = dojo.create( 'div', null, this.table ); //$NON-NLS-0$

			this.pluginWidget = new orion.widgets.plugin.PluginList({
				settings: this.settingsCore,
				preferences: this.preferences,
				statusService: this.preferencesStatusService,
				dialogService: this.preferenceDialogService,
				commandService: this.commandService,
				registry: this.registry
//				toolbarID: "pageActions" //$NON-NLS-0$
			}, pluginNode);
			
			this.pluginWidget.startup();
		},

		initPluginSettings: function(category) {
			function settingsCompare(a, b) {
				var nameA = a.getName(), nameB = b.getName();
				if (typeof nameA === 'string' && typeof nameB === 'string') {
					return nameA.localeCompare(nameB);
				}
				return a.getPid().localeCompare(b.getPid());
			}

			dojo.empty(this.table);

			if (this.pluginSettingsWidget) {
				this.pluginSettingsWidget.destroy();
			}

			this.pluginSettingsWidget = new SettingsList({
				parent: this.table,
				serviceRegistry: this.registry,
				settings: this.settingsRegistry.getSettings(category).sort(settingsCompare),
				title: messages[category] || category
			});
		},

/*	showPlugins - iterates over the plugin array, reads
	meta-data and creates a dom entry for each plugin.
	
	This HTML structure is a special case - the other 
	settings cases should follow more of the JSEditor
	pattern. */

		showPlugins: function(id) {

//			var td = this.preferences.getPreferences('/settings', 2).then( function(prefs){		 //$NON-NLS-0$
//				var navigate = prefs.get(messages["JavaScript Editor"]);
//			} );

			this.selectCategory(id);

			this.initPlugins(id);
		},

		showPluginSettings: function(category) {
			var id = category;
			this.selectCategory(id);

			this.initPluginSettings(category);
		},
		
		selectCategory: function(id) {
			this.preferences.getPreferences('/settingsContainer', 2).then(function(prefs){
				prefs.put( 'selection', id );
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
			
			var params = PageUtil.matchResourceParameters();
			if (params.category !== id) {
				params.category = id;
				delete params.resource;
				window.location = new URITemplate("#,{params*}").expand({ //$NON-NLS-0$
					params: params
				});
			}
		},

		showByCategory: function(id) {
			
			this.updateToolbar(id);

			var isDefaultCategory = this.settingsCategories.some(function(category) {
				if (category.id === id) {
					category.show();
					return true;
				}
			});

			if (!isDefaultCategory) {
				this.selectCategory(id);
			}
		},

		addCategory: function(category) {
			category['class'] = (category['class'] || '') + ' navbar-item'; //$NON-NLS-1$ //$NON-NLS-0$
			category.role = "tab";
			category.tabindex = -1;
			category["aria-selected"] = "false"; //$NON-NLS-1$ //$NON-NLS-0$
			category.onclick = category.show;
			this.inherited(arguments);
		},

		addCategories: function() {
			var self = this;
			this.settingsCategories.forEach(function(category, i) {
				self.addCategory(category);
			});
		},

		drawUserInterface: function(settings) {

			this.inherited(arguments);

			this.addCategories();

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
						
						if (!cat){
						
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
			
			this.preferences.getPreferences('/settingsContainer', 2).then(function(prefs){
				
				var selection = prefs.get( 'selection' );
				
				if (!selection) {
					prefs.put( 'selection', 'plugins'/*'userSettings'*/ );
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

		initialSettings: []
	});
});
