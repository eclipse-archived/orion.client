/*******************************************************************************
 * @license
 * Copyright (c) 2012, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/
define([
	'orion/explorers/explorer',
	'orion/section',
	'orion/Deferred',
	'orion/objects',
	'orion/webui/dialogs/ConfirmDialog',
	'orion/widgets/input/SettingsCheckbox',
	'orion/widgets/input/SettingsTextfield',
	'orion/widgets/input/SettingsSelect',
	'i18n!orion/settings/nls/messages',
	'orion/i18nUtil',
	'orion/metrics',
	'orion/commands'
], function(mExplorer, mSection, Deferred, objects, mConfirmDialog, SettingsCheckbox, SettingsTextfield, 
		SettingsSelect, messages, i18nUtil, mMetrics, Commands) {
	var Explorer = mExplorer.Explorer,
	    SelectionRenderer = mExplorer.SelectionRenderer,
	    Section = mSection.Section,
	    Command = Commands.Command,
	    ConfirmDialog = mConfirmDialog.ConfirmDialog;

	var METRICS_MAXLENGTH = 256;

	/**
	 * @name orion.settings.ui.PropertyWidget
	 * @class Base mixin for plugin settings widgets.
	 * @description Base mixin for plugin settings widgets.
	 */
	/**
	 * @name orion.settings.ui.PropertyWidget#property
	 * @field
	 * @type orion.metatype.AttributeDefinition
	 */
	var PropertyWidget = function(options) {
		objects.mixin(this, options);
		this.fieldlabel = this.property.getName(); // TODO nls
	};
	objects.mixin(PropertyWidget.prototype, /** @lends orion.settings.ui.PropertyWidget.prototype */ {
		postCreate: function() {
			var property = this.property, config = this.config, properties = config.getProperties();
			var value;
			if (properties && typeof properties[property.getId()] !== 'undefined') { //$NON-NLS-0$
				value = properties[property.getId()];
			} else {
				value = property.getDefaultValue();
			}
			if (typeof this.updateField === 'function') { //$NON-NLS-0$
				this.updateField(value);
			}
		},
		/**
		 * Sets the model value to reflect the given UI event.
		 * @param {Object} uiValue
		 */
		changeProperty: null, /*function() {},*/
		/**
		 * Sets the UI field to reflect the modelValue.
		 * @param {Object} modelValue
		 */
		updateField: null /*function(modelValue) {}*/
	});

	/**
	 * Widget displaying a string-typed plugin setting. Mixes in SettingsTextfield and PropertyWidget.
	 */
	var PropertyTextField = function(options) {
		PropertyWidget.apply(this, arguments);
		SettingsTextfield.apply(this, arguments);
	};
	objects.mixin(PropertyTextField.prototype, SettingsTextfield.prototype, PropertyWidget.prototype, {
		postCreate: function() {
			SettingsTextfield.prototype.postCreate.apply(this, arguments);
			PropertyWidget.prototype.postCreate.apply(this, arguments);
			var type = this.property.getType();
			if (type === 'number') { //$NON-NLS-0$
				this.textfield.type = 'number'; //$NON-NLS-0$
			} else {
				this.textfield.type = 'text'; //$NON-NLS-0$
			}
		},
		change: function(event) {
			this.changeProperty(this.textfield.value);
		},
		updateField: function(value) {
			this.textfield.value = value;
		}
	});

	/**
	 * Widget displaying a boolean-typed plugin setting. Mixes in SettingsCheckbox and PropertyWidget.
	 */
	var PropertyCheckbox = function(options) {
		PropertyWidget.apply(this, arguments);
		SettingsCheckbox.apply(this, arguments);
	};
	objects.mixin(PropertyCheckbox.prototype, SettingsCheckbox.prototype, PropertyWidget.prototype, {
		change: function(event) {
			this.changeProperty(event.target.checked); //$NON-NLS-0$
		},
		postCreate: function() {
			PropertyWidget.prototype.postCreate.call(this);
			SettingsCheckbox.prototype.postCreate.call(this);
		},
		updateField: function(value) {
			this.checkbox.checked = value;
		}
	});

	/**
	 * Widget displaying a plugin setting whose value is restricted to an enumerated set (options). Mixes in SettingsSelect and PropertyWidget.
	 */
	var PropertySelect = function(options) {
		PropertyWidget.apply(this, arguments);
		SettingsSelect.apply(this, arguments);
	};
	objects.mixin(PropertySelect.prototype, SettingsSelect.prototype, PropertyWidget.prototype, {
		postCreate: function() {
			var values = this.property.getOptionValues();
			var labels = this.property.getOptionLabels(); // TODO nls
			this.options = values.map(function(value, i) {
				var label = (typeof labels[i] === 'string' ? labels[i] : value); //$NON-NLS-0$
				return {value: label, label: label};
			});
			SettingsSelect.prototype.postCreate.apply(this, arguments);
			PropertyWidget.prototype.postCreate.apply(this, arguments);
		},
		change: function(event) {
			SettingsSelect.prototype.change.apply(this, arguments);
			var selectedOptionValue = this.property.getOptionValues()[this.getSelectedIndex()];
			if (typeof selectedOptionValue !== 'undefined') { //$NON-NLS-0$
				this.changeProperty(selectedOptionValue);
			}
		},
		updateField: function(value) {
			var index = this.property.getOptionValues().indexOf(value);
			if (index !== -1) {
				this.setSelectedIndex(index);
			}
		}
	});

	/**
	 * Container widget displaying the plugin settings of a single {@link orion.cm.Configuration}. Each setting is
	 * rendered by instantiating an appropriate Property* widget and adding it as a child of this widget.
	 */
	var PropertiesWidget = function(options, parentNode) {
		objects.mixin(this, options);
		if (!parentNode) { throw new Error("parentNode is required"); } //$NON-NLS-1$
		this.node = parentNode;
		this.messageService = this.serviceRegistry.getService("orion.page.message"); //$NON-NLS-0$
		this.updateMessage = i18nUtil.formatMessage(messages["SettingUpdateSuccess"], this.categoryTitle);
		var configAdmin = this.serviceRegistry.getService('orion.cm.configadmin'); //$NON-NLS-0$
		this.controller = new ConfigController(configAdmin, this.setting.getPid());
	};
	objects.mixin(PropertiesWidget.prototype, { //$NON-NLS-0$
		createElements: function() {
			var self = this;
			this.children = [];
			this.initConfiguration().then(function(configuration) {
				self.createChildren(configuration);
			});
		},
		startup: function() {
			this.createElements();
		},
		destroy: function() {
			if (this.children) {
				this.children.forEach(function(child) {
					child.destroy();
				});
			}
		},
		addChild: function(childWidget) {
			this.children.push(childWidget);
			this.node.appendChild(childWidget.node);
			childWidget.show();
		},
		createChildren: function(configuration) {
			var self = this;
			this.setting.getAttributeDefinitions().forEach(function(property) {
				var options = {
					config: configuration,
					property: property,
					changeProperty: self.changeProperty.bind(self, property) ,
					serviceRegistry: self.serviceRegistry
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
		initConfiguration: function() {
			return this.controller.initConfiguration();
		},
		changeProperty: function(attributeDefinition, value) {
			var _self = this;
			return this.controller.changeProperty(this.setting, attributeDefinition.getId(), value).then(function() {
				_self.messageService.setProgressResult(_self.updateMessage);
			});
		}
	});

	/**
	 * Controller for modifying a configuration
	 */
	function ConfigController(configAdmin, pid) {
		this.configAdmin = configAdmin;
		this.pid = pid;
		this.config = this.defaultConfig = this.configPromise = null;
	}
	objects.mixin(ConfigController.prototype, {
		/** Creates a new configuration if necessary */
		initConfiguration: function() {
			var configuration = this.config;
			if (!configuration) {
				var pid = this.pid, self = this;
				this.configPromise = this.configPromise ||
					Deferred.all([
						this.configAdmin.getDefaultConfiguration(pid),
						this.configAdmin.getConfiguration(pid)
					]).then(function(result) {
						self.defaultConfig = result[0];
						self.config = result[1];
						return self.config;
					});
				return this.configPromise;
			} else {
				return new Deferred().resolve(configuration);
			}
		},
		changeProperty: function(setting, attributeId, value) {
			return this.initConfiguration().then(function(configuration) {
				var props = configuration.getProperties() || {};
				props[attributeId] = value;
				// Decide if this configuration equals the setting's default values.
				var defaultProps = this.getDefaultProps();
				var isNoop = setting.isDefaults(props, defaultProps);
				if (isNoop) {
					// Entire configuration is a no-op (i.e. it equals its default values) so remove it entirely
					configuration.store.pref.valueChanged(props.pid, props);
					return this.remove();
				} else {
					configuration.update(props);
				}
			}.bind(this));
		},
		getDefaultProps: function() {
			return this.defaultConfig ? this.defaultConfig.getProperties() : null;
		},
		/** Reset the configuration back to the effective defaults, whatever they are */
		reset: function() {
			return this.initConfiguration().then(function(configuration) {
				var defaultProps = this.getDefaultProps();
				if (!defaultProps) {
					return this.remove();
				} else {
					configuration.update(defaultProps);
				}
			}.bind(this));
		},
		/** Remove the configuration */
		remove: function() {
			return this.initConfiguration().then(function(configuration) {
				configuration.remove();
				this.config = null;
				this.configPromise = null;
			}.bind(this));
		}
	});

	/**
	 * Renderer for SettingsList.
	 */
	function SettingsRenderer(settingsListExplorer, serviceRegistry) {
		this.serviceRegistry = serviceRegistry;
		this.childWidgets = [];
		SelectionRenderer.call(this, {cachePrefix: 'pluginSettings', noRowHighlighting: true}, settingsListExplorer); //$NON-NLS-0$
	}
	SettingsRenderer.prototype = Object.create(SelectionRenderer.prototype);
	SettingsRenderer.prototype.getCellElement = function(col_no, /*Setting*/ setting, rowElement) {
		var sectionId = setting.getPid(), headerId = sectionId + 'header'; //$NON-NLS-0$
		
		var settingSection = document.createElement('section'); //$NON-NLS-0$
		settingSection.id = sectionId;
		settingSection.className = 'setting-row'; //$NON-NLS-0$
		settingSection.setAttribute('role', 'region'); //$NON-NLS-0$ //$NON-NLS-1$
		settingSection.setAttribute('aria-label', setting.getName()); //$NON-NLS-0$ // currently there's only one section, so just use setting name
//		settingSection.setAttribute('aria-labelledby', headerId); //$NON-NLS-0$ // if there are ever multiple sections, use section header

		var sectionHeader = document.createElement('div'); //$NON-NLS-0$
		sectionHeader.id = headerId;
		// setting-header-generated sets the heading to be 0 width as there are no categories on generated settings pages
		sectionHeader.className = 'setting-header setting-header-generated'; //$NON-NLS-0$
//		sectionHeader.textContent = setting.getName(); // if there are ever multiple sections, use section header

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
		return new PropertiesWidget({serviceRegistry: this.serviceRegistry, setting: setting, categoryTitle: this.explorer.categoryTitle}, parent);
	};
	SettingsRenderer.prototype.renderTableHeader = function(tableNode) {
		return document.createElement('div'); //$NON-NLS-0$
	};
	SettingsRenderer.prototype.destroy = function() {
		if (this.childWidgets) {
			this.childWidgets.forEach(function(widget) {
				widget.destroy();
			});
		}
		this.childWidgets = null;
	};
	/**
	 * Explorer for SettingsList.
	 */
	function SettingsListExplorer(serviceRegistry, categoryTitle) {
		Explorer.call(this, serviceRegistry, undefined, new SettingsRenderer(this, serviceRegistry));
		this.categoryTitle = categoryTitle;
	}
	SettingsListExplorer.prototype = Object.create(Explorer.prototype);
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
		this.serviceRegistry = options.serviceRegistry;
		var commandRegistry = this.commandRegistry = options.commandRegistry;
		this.settings = options.settings;
		this.title = options.title;
		if (!options.parent || !options.serviceRegistry || !options.settings || !options.title) {
			throw new Error('Missing required option'); //$NON-NLS-0$
		}
		this.parent = typeof options.parent === 'string' ? document.getElementById('parent') : options.parent; //$NON-NLS-0$ //$NON-NLS-1$

		var restoreCommand = new Command({
			id: "orion.pluginsettings.restore", //$NON-NLS-0$
			name: messages["Restore"], //$NON-NLS-0$
			callback: function(data) {
				var dialog = new ConfirmDialog({
					confirmMessage: messages["ConfirmRestore"], //$NON-NLS-0$
					title: messages["Restore"] //$NON-NLS-0$
				});
				dialog.show();
				var _self = this;
				dialog.addEventListener("dismiss", function(event) { //$NON-NLS-0$
					if (event.value) {
					    if(data.items) {
						    _self.restore(data.items.pid);
						} else {
						    _self.restore();
						}
					}
				}); //$NON-NLS-0$
			}.bind(this)
		});
		commandRegistry.addCommand(restoreCommand);
		commandRegistry.registerCommandContribution("restoreDefaults", "orion.pluginsettings.restore", 2); //$NON-NLS-1$ //$NON-NLS-2$

		this.render(this.parent, this.serviceRegistry, this.settings, this.title);
	}
	SettingsList.prototype = {
		_makeSection: function(parent, sectionId, setting, title, hasMultipleSections) {
			var section = new Section(parent, { id: sectionId, title: title, useAuxStyle: true,
				canHide: hasMultipleSections, onExpandCollapse: true});
			return section;
		},
		destroy: function() {
			this.explorer.destroy();
		},
		restore: function(pid) {
			var deferreds = [];
			for(var i = 0; i < this.settings.length; i++) {
			    var setting = this.settings[i];
			    if(pid) {
			        if(setting.getPid() === pid) {
				        deferreds.push(new ConfigController(this.serviceRegistry.getService('orion.cm.configadmin'), setting.getPid()).reset()); //$NON-NLS-1$
				    }
				} else {
				    deferreds.push(new ConfigController(this.serviceRegistry.getService('orion.cm.configadmin'), setting.getPid()).reset()); //$NON-NLS-1$
				}
			}
			if(deferreds.length > 0) { 
    			Deferred.all(deferreds, function(err) { return err; }).then(function() {
    				this.parent.innerHTML = ""; // empty
    				
    				this.render(this.parent, this.serviceRegistry, this.settings, this.title);
    				this.serviceRegistry.getService("orion.page.message").setProgressResult(messages["settingsRestored"]); //$NON-NLS-1$
    			}.bind(this));
			}
		},
		render: function(parent, serviceRegistry, settings, categoryTitle) {
			// FIXME Section forces a singleton id, bad
			var idPrefix = 'pluginsettings-'; //$NON-NLS-0$
			
			for (var i=0; i<settings.length; i++) {
				var sectionId = idPrefix + 'section' + i; //$NON-NLS-0$
				var setting = settings[i];
				var section = this._makeSection(parent, sectionId, setting, setting.getName() || "Unnamed", settings.length > 1); //$NON-NLS-0$
				this.commandRegistry.renderCommands("restoreDefaults", section.getActionElement(), settings[i], this, "button"); //$NON-NLS-1$ //$NON-NLS-0$
				
				// Add a class name based on the category (all settings on the page have the same category currently)
				if(setting.category){
					// This does not match the full spec of legal class names, but we avoid categories breaking the UI, Bug 444194
					var className = setting.category.replace(/[^_0-9a-zA-Z-]/gi, '-') + "SettingsTable"; //$NON-NLS-0$ //$NON-NLS-1$
					section.getContentElement().classList.add(className);
				}
				
				this.explorer = new SettingsListExplorer(serviceRegistry, categoryTitle);
				this.explorer.createTree(section.getContentElement().id, new mExplorer.SimpleFlatModel([setting], 'setting-', //$NON-NLS-0$
					function(item) {
						return item.getPid();
					}),
					{	tableElement: 'div', //$NON-NLS-0$
						tableBodyElement: 'div', //$NON-NLS-0$
						tableRowElement: 'div', //$NON-NLS-0$
						noSelection: true // Until we support selection based commands, don't allow selection
					});
			}
		}
	};

	return SettingsList;
});
