/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define console */
define(['orion/serviceTracker'], function(ServiceTracker) {
	var METATYPE_SERVICE = 'orion.cm.metatype', SETTING_SERVICE = 'orion.core.setting'; //$NON-NLS-0$ //$NON-NLS-1$
	var SETTINGS_PROP = 'settings'; //$NON-NLS-0$
	/**
	 * @name orion.settings.Setting
	 * @class Represents the definition of a setting.
	 * @description Represents the definition of a setting.
	 */
		/**
		 * @name orion.settings.Setting#getPid
		 * @function
		 * @description
		 * @returns {String}
		 */
		/**
		 * @name orion.settings.Setting#getObjectClassId
		 * @function
		 * @description
		 * @returns {String}
		 */
		/**
		 * @name orion.settings.Setting#getName
		 * @function
		 * @description
		 * @returns {String}
		 */
		/**
		 * @name orion.settings.Setting#getPropertyTypes
		 * @function
		 * @description
		 * @returns {orion.metatype.PropertyType[]}
		 */
		/**
		 * @name orion.settings.Setting#getTags
		 * @function
		 * @description
		 * @returns {String[]}
		 */
	function SettingImpl(json) {
		this.pid = json.pid;
		this.isRef = typeof json.classId === 'string';
		this.classId = this.isRef ? json.classId : this.pid + '.type';
		this.name = typeof json.name === 'string' ? json.name : null;
		this.properties = null;
		this.tags = json.tags;
		if (!this.pid) { throw new Error('Missing "pid" property'); }
	}
	SettingImpl.prototype = {
		getName: function() { return this.name; },
		getPid: function() { return this.pid; },
		getObjectClassId: function() { return this.classId; },
		getPropertyTypes: function() { return this.properties; },
		getTags: function() { return this.tags || []; }
	};

	/**
	 * Tracks dynamic registration/unregistration of settings and registers/unregisters the corresponding MetaType service.
	 */
	function SettingTracker(serviceRegistry, metaTypeRegistry, settingsMap) {
		var serviceRegistrations = {};

		function _addSetting(settingJson) {
			var setting = new SettingImpl(settingJson);
			var classId = setting.getObjectClassId();
			var serviceProperties = {
				designates: [{
					pid: setting.getPid(),
					classId: classId
				}]
			};
			if (!setting.isRef && !metaTypeRegistry.getObjectClass(classId)) {
				// The ObjectClass doesn't exist yet so we'll define it here
				serviceProperties.classes = [{
					id: classId,
					properties: settingJson.properties
				}];
			}
			serviceRegistrations[setting.getPid()] = serviceRegistry.registerService(METATYPE_SERVICE, {}, serviceProperties);
			var ocd = metaTypeRegistry.getObjectClass(classId);
			setting.properties = ocd.getPropertyTypes();
			settingsMap[setting.getPid()] = setting;
		}

		function _deleteSetting(pid) {
			var serviceRegistration = serviceRegistrations[pid];
			serviceRegistration.unregister();
			delete serviceRegistrations[pid];
			delete settingsMap[pid];
		}

		ServiceTracker.call(this, serviceRegistry, SETTING_SERVICE);
		serviceRegistry.getServiceReferences(SETTING_SERVICE).forEach(function(ref) {
			(ref.getProperty(SETTINGS_PROP) || []).forEach(function(settingJson) {
				_addSetting(settingJson);
			});
		});
		this.addingService = function(serviceRef) {
			var settings = serviceRef.getProperty(SETTINGS_PROP);
			if (!settings || !settings.length) {
				return null;
			}
			for (var i=0; i < settings.length; i++) {
				_addSetting(settings[i]);
			}
			return ServiceTracker.prototype.addingService.call(this, serviceRef);
		};
		this.removedService = function(serviceRef, service) {
			var settings = serviceRef.getProperty(SETTINGS_PROP);
			for (var i=0; i < settings.length; i++) {
				_deleteSetting(settings[i].pid);
			}
		};
	}

	/**
	 * @name orion.settings.SettingsRegistry
	 * @class
	 * @description
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry The service registry to consult.
	 * @param {orion.metatype.MetaTypeRegistry} metaTypeRegistry The metatype registry to look up Object Classes in.
	 */
	function SettingsRegistry(serviceRegistry, metaTypeRegistry) {
		this.settingsMap = {};
		var tracker = new SettingTracker(serviceRegistry, metaTypeRegistry, this.settingsMap);
		tracker.open();
	}
	SettingsRegistry.prototype = /** @lends orion.settings.SettingsRegistry.prototype */ {
		getSettings: function() {
			var settingsMap = this.settingsMap;
			return Object.keys(settingsMap).map(function(pid) {
				return settingsMap[pid];
			});
		}
	};

	return SettingsRegistry;
});