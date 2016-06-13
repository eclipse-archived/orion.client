/*******************************************************************************
 * @license
 * Copyright (c) 2012, 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/

/* This SettingsContainer widget manages a left and right side. The left is for choosing a 
   category, the right shows the resulting HTML for that category. */

define([
	'i18n!orion/settings/nls/messages',
	'orion/globalCommands',
	'orion/PageUtil',
	'orion/webui/littlelib',
	'orion/objects',
	'orion/URITemplate',
	'orion/widgets/themes/ThemeBuilder',
	'orion/settings/ui/PluginSettings',
	'orion/widgets/themes/ThemePreferences',
	'orion/widgets/themes/editor/ThemeData',
	'orion/widgets/themes/ThemeImporter',
	'orion/widgets/settings/SplitSelectionLayout',
	'orion/widgets/plugin/PluginList',
	'orion/widgets/settings/GitSettings',
	'orion/widgets/settings/EditorSettings',
	'orion/widgets/settings/ThemeSettings',
	'orion/widgets/settings/UserSettings',
	'orion/widgets/settings/GlobalizationSettings',
	'orion/widgets/settings/GeneralSettings',
	'orion/editorPreferences',
	'orion/generalPreferences',
	'orion/metrics',
	'orion/util'
], function(messages, mGlobalCommands, PageUtil, lib, objects, URITemplate, 
		ThemeBuilder, SettingsList, mThemePreferences, editorThemeData, editorThemeImporter, SplitSelectionLayout, PluginList, 
		GitSettings, EditorSettings, ThemeSettings, UserSettings, GlobalizationSettings, GeneralSettings, mEditorPreferences, mGeneralPreferences, mMetrics, util) {

	/**
	 * @param {Object} options
	 * @param {DomNode} node
	 */
	var superPrototype = SplitSelectionLayout.prototype;
	function SettingsContainer(options, node) {
		SplitSelectionLayout.apply(this, arguments);

		var getPluginsRefs = this.registry.getServiceReferences("orion.core.getplugins"); //$NON-NLS-0$
		this.pluginsUri = getPluginsRefs[0] && getPluginsRefs[0].getProperty("uri"); //$NON-NLS-0$

		this.settingsCategories = [];
		
		var pluginsUpdated = function() {
			this.show();
		}.bind(this);

		this.settingsCore.pluginRegistry.addEventListener("started", pluginsUpdated);
		this.settingsCore.pluginRegistry.addEventListener("stopped", pluginsUpdated);
		this.settingsCore.pluginRegistry.addEventListener("updated", pluginsUpdated);
	}
	SettingsContainer.prototype = Object.create(superPrototype);
	objects.mixin(SettingsContainer.prototype, {
		/**
		 * @returns {orion.Promise}
		 */
		show: function() {
			var _self = this;

			this.preferences.get('/settingsContainer').then(function(prefs){ //$NON-NLS-1$
				_self.settingsCategories = [];
			
				var categories = prefs[ 'categories' ] || {};
				if (!util.isElectron && (categories.showUserSettings === undefined || categories.showUserSettings)) {
					_self.settingsCategories.push({
						id: "userSettings", //$NON-NLS-0$
						textContent: messages["User Profile"],
						show: _self.showUserSettings
					});
				}
				
				if (categories.showGitSettings === undefined || categories.showGitSettings) {
					_self.settingsCategories.push({
						id: "gitSettings", //$NON-NLS-0$
						textContent: messages.Git,
						show: _self.showGitSettings
					});
				}
				
				if (categories.showThemeSettings === undefined || categories.showThemeSettings) {
					_self.settingsCategories.push({
						id: "themeSettings", //$NON-NLS-0$
						textContent: messages.Theme,
						show: _self.showThemeSettings
					});
				}
				
				if (categories.showEditorSettings === undefined || categories.showEditorSettings) {
					_self.settingsCategories.push({
						id: "editorSettings", //$NON-NLS-0$
						textContent: messages.Editor,
						show: _self.showEditor
					});
				}
				
				if (categories.showPluginSettings === undefined || categories.showPluginSettings) {
					_self.settingsCategories.push({
						id: "plugins", //$NON-NLS-0$
						textContent: messages["Plugins"],
						show: _self.showPlugins
					});
				}
				
				if (categories.showGlobalizationSettings === undefined || categories.showGlobalizationSettings) {
					_self.settingsCategories.push({
						id: "Globalization", //$NON-NLS-0$
						textContent: messages.Globalization,
						show: _self.showGlobalizationSettings
					});
				}

				if (categories.showGeneralSettings === undefined || categories.showGeneralSettings) {
					_self.settingsCategories.push({
						id: "General", //$NON-NLS-0$
						textContent: messages.General,
						show: _self.showGeneralSettings
					});
				}

				_self.settingsCategories.forEach(function(item) {
					item.show = item.show.bind(_self, item.id);
				}.bind(_self));

				// Add plugin-contributed extension categories
				var settingsRegistry = _self.settingsRegistry;
				var pluginCategories = settingsRegistry.getCategories().map(function(category) {
					return {
						id: category,
						textContent: settingsRegistry.getCategoryLabel(category) || messages[category] || category,
						show: _self.showPluginSettings.bind(_self, category)
					};
				});
				_self.settingsCategories = _self.settingsCategories.concat(pluginCategories);
				
				// Sort all categories alphabetically by their title
				_self.settingsCategories.sort(function(a, b) {
					return a.textContent.localeCompare(b.textContent);
				});

				_self.itemToIndexMap = {};
				_self.toolbar = lib.node( _self.pageActions );
				
				_self.drawUserInterface();
	
				window.addEventListener("hashchange", _self.processHash.bind(_self));
	
				mGlobalCommands.setPageTarget({task: messages['Settings'], serviceRegistry: _self.registry, commandService: _self.commandService});

				mMetrics.logPageLoadTiming("interactive", window.location.pathname); //$NON-NLS-0$
				mMetrics.logPageLoadTiming("complete", window.location.pathname); //$NON-NLS-0$
			});
		},
		
		processHash: function() {
			var pageParams = PageUtil.matchResourceParameters();
			
			this.preferences.get('/settingsContainer').then(function(prefs){ //$NON-NLS-1$

				var selection = prefs['selection'];

				var category = pageParams.category || selection;
				if (!category) {
					// no selection exists, select the first one
					category = this.settingsCategories[0].id;
				}

				this.showByCategory(category);
				
			}.bind(this) );
			
			window.setTimeout(function() {this.commandService.processURL(window.location.href);}.bind(this), 0);
		},
		
		showEditor: function(id){
		
			this.selectCategory(id);
			
			
			lib.empty(this.table);
		
			if (this.editorSettingWidget) {
				this.editorSettingWidget.destroy();
			}

			this.updateToolbar(id);

			var editorSettingsNode = document.createElement('div'); //$NON-NLS-0$
			this.table.appendChild(editorSettingsNode);

			var editorTheme = new editorThemeData.ThemeData();
			var themePreferences = new mThemePreferences.ThemePreferences(this.preferences, editorTheme);
			
			var editorPreferences = new mEditorPreferences.EditorPreferences (this.preferences);
			
			this.editorSettings = new EditorSettings({
				registry: this.registry,
				preferences: editorPreferences,
				themePreferences: themePreferences,
				statusService: this.preferencesStatusService,
				dialogService: this.preferenceDialogService,
				commandService: this.commandService,
				userClient: this.userClient
			}, editorSettingsNode);
			
			this.editorSettings.show();
		},
		
		showUserSettings: function(id){

			this.selectCategory(id);

			lib.empty(this.table);

			if (this.userWidget) {
				this.userWidget.destroy();
			}

			this.updateToolbar(id);
			
			var userNode = document.createElement('div'); //$NON-NLS-0$
			this.table.appendChild(userNode);

			this.userWidget = new UserSettings({
				registry: this.registry,
				settings: this.settingsCore,
				preferences: this.preferences,
				statusService: this.preferencesStatusService,
				dialogService: this.preferenceDialogService,
				commandService: this.commandService,
				userClient: this.userClient
			}, userNode);
			
			this.userWidget.show();
		},
		
		showGitSettings: function(id){
		
			this.selectCategory(id);

			lib.empty(this.table);

			if (this.gitWidget) {
				this.gitWidget.destroy();
			}

			this.updateToolbar(id);
			
			var userNode = document.createElement('div'); //$NON-NLS-0$
			this.table.appendChild(userNode);

			this.gitWidget = new GitSettings({
				registry: this.registry,
				settings: this.settingsCore,
				preferences: this.preferences,
				statusService: this.preferencesStatusService,
				dialogService: this.preferenceDialogService,
				commandService: this.commandService,
				userClient: this.userClient
			}, userNode);
			
			this.gitWidget.show();
		},
		
		showThemeSettings: function(id){ // INSOO
			this.selectCategory(id);

			lib.empty(this.table);

			this.updateToolbar(id);

			var themeSettingsNode = document.createElement('div'); //$NON-NLS-0$
			this.table.appendChild(themeSettingsNode);

			var editorTheme = new editorThemeData.ThemeData();
			var themeImporter = new editorThemeImporter.ThemeImporter();
			var themePreferences = new mThemePreferences.ThemePreferences(this.preferences, editorTheme);
			var editorThemeWidget = new ThemeBuilder({ commandService: this.commandService, preferences: themePreferences, themeData: editorTheme, toolbarId: 'editorThemeSettingsToolActionsArea', serviceRegistry: this.registry}); //$NON-NLS-0$

			var command = {
				name:messages.Import,
				tip:messages['Import a theme'],
				id: "orion.importTheme", //$NON-NLS-1$
				callback: themeImporter.showImportThemeDialog.bind(themeImporter)
			};
			this.commandService.addCommand(command);
			this.commandService.registerCommandContribution('themeCommands', "orion.importTheme", 4); //$NON-NLS-1$ //$NON-NLS-2$
			var editorPreferences = new mEditorPreferences.EditorPreferences (this.preferences);

			this.themeSettings = new ThemeSettings({
				registry: this.registry,
				preferences: editorPreferences,
				themePreferences: themePreferences,
				editorThemeWidget: editorThemeWidget,
				statusService: this.preferencesStatusService,
				dialogService: this.preferenceDialogService,
				commandService: this.commandService,
				userClient: this.userClient
			}, themeSettingsNode);

			this.themeSettings.show();
		},
		
		showGlobalizationSettings: function(id){

			this.selectCategory(id);

			lib.empty(this.table);

			if (this.globalizationWidget) {
				this.globalizationWidget.destroy();
			}

			this.updateToolbar(id);
			
			var userNode = document.createElement('div'); //$NON-NLS-0$
			this.table.appendChild(userNode);

			this.globalizationWidget = new GlobalizationSettings({
				registry: this.registry,
				settings: this.settingsCore,
				preferences: this.preferences,
				statusService: this.preferencesStatusService,
				dialogService: this.preferenceDialogService,
				commandService: this.commandService,
				userClient: this.userClient	
			}, userNode);
			
			this.globalizationWidget.show();
		},
		
		showGeneralSettings: function(id){

			this.selectCategory(id);

			lib.empty(this.table);

			if (this.generalWidget) {
				this.generalWidget.destroy();
			}

			this.updateToolbar(id);
			
			var userNode = document.createElement('div'); //$NON-NLS-0$
			this.table.appendChild(userNode);
			
			var generalPreferences = new mGeneralPreferences.GeneralPreferences (this.preferences);

			this.generalWidget = new GeneralSettings({
				registry: this.registry,
				settings: this.settingsCore,
				preferences: generalPreferences,
				statusService: this.preferencesStatusService,
				dialogService: this.preferenceDialogService,
				commandService: this.commandService,
				userClient: this.userClient	
			}, userNode);
			
			this.generalWidget.show();
		},
		
		initPlugins: function(id){
			lib.empty(this.table);

			if (this.pluginWidget) {
				this.pluginWidget.destroy();
			}

			var pluginNode = document.createElement('div');
			this.table.appendChild(pluginNode);

			this.pluginWidget = new PluginList({
				settings: this.settingsCore,
				preferences: this.preferences,
				statusService: this.preferencesStatusService,
				progressService: this.progressService,
				dialogService: this.preferenceDialogService,
				commandService: this.commandService,
				registry: this.registry,
				pluginsUri: this.pluginsUri
			}, pluginNode);
			
			this.pluginWidget.show();
		},

		initPluginSettings: function(category) {
			function settingsCompare(a, b) {
				if (a.getOrder() > b.getOrder()) {
					return 1;
				} else if (b.getOrder() > a.getOrder()) {
					return -1;
				}
				var nameA = a.getName(), nameB = b.getName();
				if (typeof nameA === 'string' && typeof nameB === 'string') {
					return nameA.localeCompare(nameB);
				}
				return a.getPid().localeCompare(b.getPid());
			}

			lib.empty(this.table);

			if (this.pluginSettingsWidget) {
				this.pluginSettingsWidget.destroy();
			}

			var settingsInCategory = this.settingsRegistry.getSettings(category).sort(settingsCompare);
			var title = this.settingsRegistry.getCategoryLabel(category) || messages[category] || category;
			this.pluginSettingsWidget = new SettingsList({
				parent: this.table,
				serviceRegistry: this.registry,
				commandRegistry: this.commandService,
				settings: settingsInCategory,
				title: title,
				fileClient: this.fileClient
			});
		},

/*	showPlugins - iterates over the plugin array, reads
	meta-data and creates a dom entry for each plugin.
	
	This HTML structure is a special case - the other 
	settings cases should follow more of the JSEditor
	pattern. */

		showPlugins: function(id) {

			this.selectCategory(id);
			
			this.updateToolbar(id);

			this.initPlugins(id);
		},

		showPluginSettings: function(category) {
			var id = category;
			this.selectCategory(id);
			
			this.updateToolbar(id);

			this.initPluginSettings(category);
		},
		
		selectCategory: function(id) {
			this.preferences.put('/settingsContainer', {selection: id}); //$NON-NLS-1$

			superPrototype.selectCategory.apply(this, arguments);

			var params = PageUtil.matchResourceParameters();
			if (params.category !== id) {
				params.category = id;
				var resource = params.resource;
				delete params.resource;
				window.location = new URITemplate("#{,resource,params*}").expand({ //$NON-NLS-0$
					resource: resource,
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
			category.role = "tab"; //$NON-NLS-1$
			category.tabindex = -1;
			category["aria-selected"] = "false"; //$NON-NLS-1$
			category.onclick = category.show;
			superPrototype.addCategory.apply(this, arguments);
		},

		addCategories: function() {
			var self = this;
			this.settingsCategories.forEach(function(category, i) {
				self.addCategory(category);
			});
		},

		/**
		 * @callback
		 */
		drawUserInterface: function(settings) {
			superPrototype.drawUserInterface.apply(this, arguments);
			this.addCategories();
			this.processHash();
		},
		
		handleError: function(error){
			window.console.log(error);
		}
	});
	return SettingsContainer;
});
