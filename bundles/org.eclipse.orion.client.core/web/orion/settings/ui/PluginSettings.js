/*global define document orion*/
define(['i18n!orion/settings/nls/messages', 'orion/explorer', 'orion/section', 'orion/i18nUtil',
		'dojo', 'dijit', 'orion/widgets/settings/LabeledCheckbox', 'orion/widgets/settings/LabeledTextfield', 'orion/widgets/settings/Select'],
		function(messages, mExplorer, mSection, i18nUtil, dojo, dijit) {
	var Explorer = mExplorer.Explorer, SelectionRenderer = mExplorer.SelectionRenderer, Section = mSection.Section;

	var PropertyWidget = dojo.declare('orion.widgets.settings.SettingWidget', [dijit._Widget], { //$NON-NLS-0$
		postMixInProperties: function() {
			this.inherited(arguments);
			this.fieldlabel = this.property.getName();
		},
		postCreate: function() {
			this.inherited(arguments);
			var property = this.property, config = this.configuration;
			var properties = config.getProperties();
			var value;
			if (properties && typeof properties[property.getId()] !== 'undefined') { //$NON-NLS-0$
				value = properties[property.getId()];
			} else {
				value = property.getDefaultValue();
			}
			this.updateField(value);
		},
		changeProperty: function() {},
		updateField: function(modelValue) {}
	});
	var PropertyTextField = dojo.declare('orion.widgets.settings.PropertyTextField', [PropertyWidget, orion.widgets.settings.LabeledTextfield], { //$NON-NLS-0$
		postCreate: function() {
			this.inherited(arguments);
			var type = this.property.getType();
			if (type === 'number') { //$NON-NLS-0$
				this.myfield.type = 'number'; //$NON-NLS-0$
			} else {
				this.myfield.type = 'string'; //$NON-NLS-0$
			}
		},
		change: function(event) {
			this.changeProperty(this.myfield.value);
		},
		updateField: function(value) {
			this.myfield.value = value;
		}
	});
	var PropertyCheckbox = dojo.declare('orion.widgets.settings.PropertyTextField', [PropertyWidget, orion.widgets.settings.LabeledCheckbox], { //$NON-NLS-0$
		change: function(event) {
			this.changeProperty(event.target.checked); //$NON-NLS-0$
		},
		updateField: function(value) {
			this.myfield.checked = value;
		}
	});
	var PropertiesWidget = dojo.declare('orion.widgets.settings.PropertiesWidget', [dijit._Container, dijit._WidgetBase], { //$NON-NLS-0$
		buildRendering: function() {
			this.inherited(arguments);
			var setting = this.setting;
			var serviceRegistry = this.serviceRegistry;
			var self = this;
			var configAdmin = serviceRegistry.getService('orion.cm.configadmin'); //$NON-NLS-0$
			configAdmin.getConfiguration(setting.getPid()).then(function(configuration) {
				self.set('configuration', configuration); //$NON-NLS-0$
				self.createChildren(configuration);
			});
		},
		createChildren: function(configuration) {
			var self = this;
			this.setting.getPropertyTypes().forEach(function(property) {
				var options = {
					property: property, configuration: configuration, serviceRegistry: self.serviceRegistry,
					changeProperty: self.changeProperty.bind(self, property)
				};
				var widget;
				// TODO if property.getOptionValues(), use a Select
				switch (property.getType()) {
					case 'boolean': //$NON-NLS-0$
						widget = new PropertyCheckbox(options);
						break;
					case 'number': //$NON-NLS-0$
					case 'string': //$NON-NLS-0$
						widget = new PropertyTextField(options);
						break;
				}
				self.addChild(widget);
			});
		},
		changeProperty: function(propertyType, value) {
			var configuration = this.configuration;
			var setting = this.setting;
			var props = configuration.getProperties() || {};
			props[propertyType.getId()] = value;
			var isDefaultConfig = setting.getPropertyTypes().every(function(propertyType) {
				return props[propertyType.getId()] === propertyType.getDefaultValue();
			});
			if (isDefaultConfig) {
				configuration.remove();
				this.configuration = null;
			} else {
				configuration.update(props);
			}
		}
	});

	/**
	 * Renderer for SettingsList.
	 */
	function SettingsRenderer(settingsList, serviceRegistry) {
		this.serviceRegistry = serviceRegistry;
		SelectionRenderer.call(this, {/*registry: that.registry, actionScopeId: "sdsd",*/ cachePrefix: 'pluginSettings'}, settingsList); //$NON-NLS-0$
	}
	SettingsRenderer.prototype = new SelectionRenderer();
	SettingsRenderer.prototype.getCellElement = function(col_no, /*Setting*/ setting, rowElement) {
		var sectionId = setting.getPid(), headerId = sectionId + 'header'; //$NON-NLS-0$
		var settingSection = document.createElement('section'); //$NON-NLS-0$
		settingSection.id = sectionId;
		settingSection.className = 'setting-row'; //$NON-NLS-0$
		settingSection.setAttribute('role', 'region'); //$NON-NLS-0$ //$NON-NLS-1$
		settingSection.setAttribute('aria-labelledby', headerId); //$NON-NLS-0$

		var sectionHeader = document.createElement('h3'); //$NON-NLS-0$
		sectionHeader.id = headerId;
		sectionHeader.className = 'setting-header'; //$NON-NLS-0$
		sectionHeader.innerHTML = setting.getName();

		var propertiesElement = document.createElement('div'); //$NON-NLS-0$
		propertiesElement.className = 'setting-content'; //$NON-NLS-0$
		var propertiesWidget = this.createPropertiesWidget(propertiesElement, setting);
		propertiesWidget.startup();

		settingSection.appendChild(sectionHeader);
		settingSection.appendChild(propertiesElement);
		rowElement.appendChild(settingSection);
//		mNavUtils.addNavGrid(this.explorer.getNavDict(), setting, link);
	};
	SettingsRenderer.prototype.createPropertiesWidget = function(parent, setting, serviceRegistry) {
		return new PropertiesWidget({containerNode: parent, serviceRegistry: this.serviceRegistry, setting: setting});
	};
	SettingsRenderer.prototype.renderTableHeader = function(tableNode) {
		return document.createElement('div'); //$NON-NLS-0$
	};

	/**
	 * Explorer for SettingsList.
	 */
	function SettingsListExplorer(serviceRegistry, selection) {
		Explorer.call(this, serviceRegistry, selection, new SettingsRenderer(this, serviceRegistry));
	}
	SettingsListExplorer.prototype = new Explorer();

	/**
	 * Widget showing list of Plugin Settings.
	 * Requires the 'orion.cm.configadmin' service.
	 * @param {DomNode|String} options.parent
	 * @param {orion.serviceregistry.ServiceRegistry} options.serviceRegistry
	 * @param {orion.settings.SettingsRegistry} options.settingsRegistry
	 */
	function SettingsList(options) {
		var parent = options.parent;
		var serviceRegistry = options.serviceRegistry;
		var settingsRegistry = options.settingsRegistry;
		if (!options.parent || !options.serviceRegistry || !options.settingsRegistry) {
			throw 'Missing required option'; //$NON-NLS-0$
		}
		this.parent = typeof parent === 'string' ? document.getElementById('parent') : parent; //$NON-NLS-0$ //$NON-NLS-1$
		// TODO add commands
		this.render(parent, serviceRegistry, settingsRegistry);
	}
	SettingsList.prototype = {
		_makeSection: function(parent, sectionId, settings) {
			var title = document.createElement('div'); //$NON-NLS-0$
			var pluginSettings = document.createElement('div'); //$NON-NLS-0$
			pluginSettings.className = 'layoutLeft'; //$NON-NLS-0$
			pluginSettings.innerHTML = messages.PluginSettings;

			var count = document.createElement('div'); //$NON-NLS-0$
			count.innerHTML = settings.length;
			count.className = 'itemCount layoutLeft'; //$NON-NLS-0$
			title.appendChild(pluginSettings);
			title.appendChild(count);

			var section = new Section(parent, {id: sectionId, title: title.innerHTML, useAuxStyle: true});
			return section;
		},
		render: function(parent, serviceRegistry, settingsRegistry) {
			var allSettings = settingsRegistry.getSettings();
			// FIXME Section forces a singleton id, bad
			var idPrefix = 'pluginsettings-'; //$NON-NLS-0$
			var sectionId = idPrefix + 'section'; //$NON-NLS-0$
			var section = this._makeSection(parent, sectionId, allSettings);

			this.explorer = new SettingsListExplorer(serviceRegistry);
			this.explorer.createTree(section.getContentElement().id, new mExplorer.SimpleFlatModel(allSettings, 'setting-', //$NON-NLS-0$
				function(item) {
					return item.getPid();
				}),
				{	tableElement: 'div', //$NON-NLS-0$
					tableBodyElement: 'div', //$NON-NLS-0$
					tableRowElement: 'div' //$NON-NLS-0$
				});
		}
	};

	return SettingsList;
});
