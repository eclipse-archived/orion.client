/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define document orion*/
define(['i18n!orion/settings/nls/messages', 'orion/explorers/explorer', 'orion/section', 'orion/i18nUtil', 'orion/Deferred',
		'dojo', 'dijit', 'orion/widgets/settings/LabeledCheckbox', 'orion/widgets/settings/LabeledTextfield',
		'orion/widgets/settings/LabeledSelect'],
		function(messages, mExplorer, mSection, i18nUtil, Deferred, dojo, dijit) {
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
	}),
	PropertyTextField = dojo.declare('orion.widgets.settings.PropertyTextField', [orion.widgets.settings.LabeledTextfield, PropertyWidget], { //$NON-NLS-0$
		postCreate: function() {
			this.inherited(arguments);
			var type = this.property.getType();
			if (type === 'number') { //$NON-NLS-0$
				this.myfield.type = 'number'; //$NON-NLS-0$
			} else {
				this.myfield.type = 'text'; //$NON-NLS-0$
			}
		},
		change: function(event) {
			this.changeProperty(this.myfield.value);
		},
		updateField: function(value) {
			this.myfield.value = value;
		}
	}),
	PropertyCheckbox = dojo.declare('orion.widgets.settings.PropertyCheckbox', [orion.widgets.settings.LabeledCheckbox, PropertyWidget], { //$NON-NLS-0$
		change: function(event) {
			this.changeProperty(event.target.checked); //$NON-NLS-0$
		},
		updateField: function(value) {
			this.myfield.checked = value;
		}
	}),
	PropertySelect = dojo.declare('orion.widgets.settings.PropertySelect', [orion.widgets.settings.LabeledSelect, PropertyWidget], { //$NON-NLS-0$
		postCreate: function() {
			var values = this.property.getOptionValues(), labels = this.property.getOptionLabels();
			this.options = values.map(function(value, i) {
				var label = (typeof labels[i] === 'string' ? labels[i] : value); //$NON-NLS-0$
				return {value: label, label: label};
			});
			this.inherited(arguments);
		},
		change: function(event) {
			this.inherited(arguments);
			var selectedOptionValue = this.property.getOptionValues()[this.getSelectedIndex()];
			if (typeof selectedOptionValue !== 'undefined') { //$NON-NLS-0$
				this.changeProperty(selectedOptionValue);
			}
		},
		updateField: function(value) {
			this.inherited(arguments);
			var index = this.property.getOptionValues().indexOf(value);
			if (index !== -1) {
				this.setSelectedIndex(index);
			}
		}
	}),
	PropertiesWidget = dojo.declare('orion.widgets.settings.PropertiesWidget', [dijit._WidgetBase, dijit._Container], { //$NON-NLS-0$
		buildRendering: function() {
			this.inherited(arguments);
			var serviceRegistry = this.serviceRegistry;
			var self = this;
			this.configAdmin = serviceRegistry.getService('orion.cm.configadmin'); //$NON-NLS-0$
			this.initConfiguration().then(function(configuration) {
				self.createChildren(configuration);
			});
		},
		/** Creates a new configuration if necessary */
		initConfiguration: function() {
			var configuration = this.configuration;
			if (!configuration) {
				var self = this;
				this.configPromise = this.configPromise || this.configAdmin.getConfiguration(this.setting.getPid())
					.then(function(resolvedConfiguration) {
						self.configuration = resolvedConfiguration;
						return resolvedConfiguration;
					});
				return this.configPromise;
			} else {
				var d = new Deferred();
				d.resolve(configuration);
				return d;
			}
		},
		createChildren: function(configuration) {
			var self = this;
			this.setting.getAttributeDefinitions().forEach(function(property) {
				var options = {
					property: property, configuration: configuration, serviceRegistry: self.serviceRegistry,
					changeProperty: self.changeProperty.bind(self, property)
				};
				var widget;
				if (property.getOptionValues()) {
					// Enumeration
					widget = new PropertySelect(options);
				} else {
					switch (property.getType()) {
						case 'boolean': //$NON-NLS-0$
							widget = new PropertyCheckbox(options);
							break;
						case 'number': //$NON-NLS-0$
						case 'string': //$NON-NLS-0$
							widget = new PropertyTextField(options);
							break;
					}
				}
				self.addChild(widget);
			});
		},
		changeProperty: function(attributeDefinition, value) {
			this.initConfiguration().then(function(configuration) {
				var setting = this.setting;
				var props = configuration.getProperties() || {};
				props[attributeDefinition.getId()] = value;
				if (setting.isDefaults(props)) {
					configuration.remove();
					this.configuration = null;
					this.configPromise = null;
				} else {
					configuration.update(props);
				}
			}.bind(this));
		}
	});

	/**
	 * Renderer for SettingsList.
	 */
	function SettingsRenderer(settingsList, serviceRegistry) {
		this.serviceRegistry = serviceRegistry;
		this.childWidgets = [];
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
		sectionHeader.textContent = setting.getName();

		var propertiesElement = document.createElement('div'); //$NON-NLS-0$
		propertiesElement.className = 'setting-content'; //$NON-NLS-0$
		var propertiesWidget = this.createPropertiesWidget(propertiesElement, setting);
		this.childWidgets.push(propertiesWidget);
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
	SettingsRenderer.prototype.destroy = function() {
		if (this.childWidgets) {
			this.childWidgets.forEach(function(widget) {
				widget.destroyRecursive();
			});
		}
		this.childWidgets = null;
	};

	/**
	 * Explorer for SettingsList.
	 */
	function SettingsListExplorer(serviceRegistry, selection) {
		Explorer.call(this, serviceRegistry, selection, new SettingsRenderer(this, serviceRegistry));
	}
	SettingsListExplorer.prototype = new Explorer();
	SettingsListExplorer.prototype.destroy = function() {
		if (this.renderer) {
			this.renderer.destroy();
		}
	};

	/**
	 * Widget showing list of Plugin Settings.
	 * Requires the 'orion.cm.configadmin' service.
	 * @param {DomNode|String} options.parent
	 * @param {orion.serviceregistry.ServiceRegistry} options.serviceRegistry
	 * @param {orion.settings.Settings[]} options.settings
	 */
	function SettingsList(options) {
		var parent = options.parent;
		var serviceRegistry = options.serviceRegistry;
		var settings = options.settings;
		if (!options.parent || !options.serviceRegistry || !options.settings || !options.title) {
			throw 'Missing required option'; //$NON-NLS-0$
		}
		this.parent = typeof parent === 'string' ? document.getElementById('parent') : parent; //$NON-NLS-0$ //$NON-NLS-1$
		// TODO add commands
		this.render(parent, serviceRegistry, settings, options.title);
	}
	SettingsList.prototype = {
		_makeSection: function(parent, sectionId, settings, title) {
			var section = new Section(parent, { id: sectionId, title: title, useAuxStyle: true,
					getItemCount: function() { return settings.length; } });
			return section;
		},
		destroy: function() {
			this.explorer.destroy();
		},
		render: function(parent, serviceRegistry, settings, title) {
			// FIXME Section forces a singleton id, bad
			var idPrefix = 'pluginsettings-'; //$NON-NLS-0$
			var sectionId = idPrefix + 'section'; //$NON-NLS-0$
			var section = this._makeSection(parent, sectionId, settings, title);

			this.explorer = new SettingsListExplorer(serviceRegistry);
			this.explorer.createTree(section.getContentElement().id, new mExplorer.SimpleFlatModel(settings, 'setting-', //$NON-NLS-0$
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
