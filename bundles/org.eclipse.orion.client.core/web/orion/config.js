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
/*global console define setTimeout*/
define(['orion/textview/eventTarget', 'orion/Deferred', 'orion/serviceTracker', 'orion/pluginregistry'],
	function(mEventTarget, Deferred, ServiceTracker, mPluginRegistry) {
var Plugin = mPluginRegistry.Plugin;
var ManagedServiceTracker, ConfigAdminFactory, ConfigStore, ConfigAdminImpl, ConfigImpl;

var PROPERTY_PID = 'pid'; //$NON-NLS-0$
var MANAGED_SERVICE = 'orion.cm.managedservice'; //$NON-NLS-0$

/**
 * @name orion.cm.impl.ManagedServiceTracker
 * @class Tracks ManagedServices in a ServiceRegistry. Delivers updated() notifications to tracked ManagedServices.
 * This class also tracks the loading of {@link orion.pluginregistry.Plugin}s in a PluginRegistry, and provides 
 * the following guarantee: if a Plugin is being loaded and it provides any ManagedServices, their updated() methods
 * will be called prior to the Plugin's other service methods.
 * @private
 */
ManagedServiceTracker = /** @ignore */ function(serviceRegistry, pluginRegistry, store) {
	ServiceTracker.call(this, serviceRegistry, MANAGED_SERVICE); //$NON-NLS-0$

	var managedServiceRefs = {};
	var managedServices = {};
	var self = this;
	var pluginLoadedListener = function(plugin) {
		plugin.getServiceReferences().forEach(function(serviceRef) {
			if (serviceRef.getName() === MANAGED_SERVICE) {
				// Inject async updated() call to fulfill the guarantee
				self.initialUpdated(serviceRef);
			}
		});
	};

	function add(pid, serviceRef, service) {
		if (!managedServiceRefs[pid]) {
			managedServiceRefs[pid] = [];
		}
		if (!managedServices[pid]) {
			managedServices[pid] = [];
		}
		managedServiceRefs[pid].push(serviceRef);
		managedServices[pid].push(service);
	}
	function remove(pid, serviceRef, service) {
		var serviceRefs = managedServiceRefs[pid];
		var services = managedServices[pid];
		if (serviceRefs.length > 1) {
			serviceRefs.splice(serviceRefs.indexOf(serviceRef), 1);
		} else {
			delete managedServiceRefs[pid];
		}
		if (services.length > 1) {
			services.splice(services.indexOf(service), 1);
		} else {
			delete managedServices[pid];
		}
	}
	function getManagedServiceReferences(pid) {
		return managedServiceRefs[pid] || [];
	}
	function getManagedServices(pid) {
		return managedServices[pid] || [];
	}
	function asyncUpdated(managedServiceRef, managedService, properties) {
		function arr(v) {
			return v instanceof Array ? v : [v];
		}
		var serviceRefs = arr(managedServiceRef), services = arr(managedService);
		setTimeout(function() {
			for (var i=0; i < services.length; i++) {
				try {
					// Don't trigger a plugin load only to call updated(); pluginLoadedListener handles that case.
					var pluginUrl = serviceRefs[i].getProperty('__plugin__'); //$NON-NLS-0$
					var plugin = pluginUrl && pluginRegistry.getPlugin(pluginUrl);
					if (!pluginUrl || (plugin && plugin.getState() === Plugin.LOADED)) {
						services[i].updated(properties);
					}
				} catch(e) {
					if (console) {
						console.log(e);
					}
				}
			}
		}, 0);
	}
	this.addingService = function(serviceRef) {
		var pid = serviceRef.getProperty(PROPERTY_PID);
		var managedService = serviceRegistry.getService(serviceRef);
		if (!pid || !managedService) {
			return null;
		}
		add(pid, serviceRef, managedService);
		var configuration = store.find(pid);
		var properties = configuration && configuration.getProperties();
		asyncUpdated(serviceRef, managedService, properties);
		return managedService;
	};
	this.initialUpdated = function(managedServiceRef) {
		var pid = managedServiceRef.getProperty(PROPERTY_PID);
		var managedService = serviceRegistry.getService(managedServiceRef);
		if (pid && managedService) {
			var configuration = store.find(pid);
			var properties = configuration && configuration.getProperties();
			managedService.updated(properties); // async
		}
	};
	this.notifyUpdated = function(configuration) {
		var pid = configuration.getPid();
		asyncUpdated(getManagedServiceReferences(pid), getManagedServices(pid), configuration.getProperties());
	};
	this.notifyDeleted = function(configuration) {
		var pid = configuration.getPid();
		asyncUpdated(getManagedServiceReferences(pid), getManagedServices(pid), null);
	};
	this.onOpen = function() {
		pluginRegistry.addEventListener('pluginLoaded', pluginLoadedListener); //$NON-NLS-0$
	};
	this.onClose = function() {
		pluginRegistry.removeEventListener('pluginLoaded', pluginLoadedListener); //$NON-NLS-0$
	};
	this.removedService = function(serviceRef, service) {
		var pid = serviceRef.getProperty(PROPERTY_PID);
		remove(pid, serviceRef, service);
	};
};

/**
 * @name orion.cm.impl.ConfigAdminFactory
 * @class
 * @private
 */
ConfigAdminFactory = /** @ignore */ (function() {
//	var DELETED = 'deleted', UPDATED = 'updated';
//	function createConfigEvent(type, pid) {
//		return {type: type, pid: pid};
//	}
//var AsyncEventTarget = {
//	addMixin: function(object) {
//		mEventTarget.EventTarget.addMixin(object);
//		var syncDispatchEvent = object.dispatchEvent;
//		object.dispatchEvent = function() {
//			var args = Array.prototype.slice.call(arguments);
//			setTimeout(function() {
//				syncDispatchEvent.apply(object, args);
//			}, 0);
//		};
//	}
//};

	/** @private */
	function ConfigAdminFactory(serviceRegistry, pluginRegistry, prefsService) {
		this.serviceRegistry = serviceRegistry;
		this.store = new ConfigStore(this, prefsService);
		this.configAdmin = new ConfigAdminImpl(this, this.store);
		this.tracker = new ManagedServiceTracker(serviceRegistry, pluginRegistry, this.store);
		this.tracker.open();
		this.serviceRegistered = false;
//		this.dispatcher = {};
//		AsyncEventTarget.addMixin(this.dispatcher);
	}
	ConfigAdminFactory.prototype = {
		getConfigurationAdmin: function() {
			var self = this;
			return this.store.initialize().then(function() {
				if (!self.serviceRegistered) {
					// TODO don't register this ourself
					self.serviceRegistry.registerService('orion.cm.configadmin', self.configAdmin); //$NON-NLS-0$
				}
				return self.configAdmin;
			});
		},
		notifyDeleted: function(configuration) {
			this.tracker.notifyDeleted(configuration);
//			this.dispatcher.dispatchEvent(createConfigEvent(DELETED, self.pid));
		},
		notifyUpdated: function(configuration) {
			this.tracker.notifyUpdated(configuration);
//			self.dispatcher.dispatchEvent(createConfigEvent(UPDATED, self.pid));
		}
	};
	return ConfigAdminFactory;
}());

/**
 * @name orion.cm.ConfigAdminImpl
 * @class
 * @private
 */
ConfigAdminImpl = /** @ignore */ (function() {
	function ConfigAdminImpl(factory, store) {
		this.factory = factory;
		this.store = store;
	}
	ConfigAdminImpl.prototype = {
		getConfiguration: function(pid) {
			return this.store.get(pid);
		},
		listConfigurations: function() {
			return this.store.list();
		}
	};
	return ConfigAdminImpl;
}());

/**
 * @name orion.cm.ConfigStore
 * @class Manages Configurations and handles persisting them to preferences.
 * @private
 */
ConfigStore = /** @ignore */ (function() {
	function ConfigStore(factory, prefsService) {
		this.factory = factory;
		this.configs = {};
		this.pref = null;
		var self = this;
		this.initPromise = prefsService.getPreferences('/cm/configurations').then( //$NON-NLS-0$
			function(prefNode) {
				self.pref = prefNode;
				prefNode.keys().forEach(function(pid) {
					self.configs[pid] = new ConfigImpl(self.factory, self, prefNode.get(pid));
				});
			});
	}
	ConfigStore.prototype = {
		find: function(pid) {
			return this.configs[pid] || null;
		},
		get: function(pid) {
			var configuration = this.configs[pid];
			if (!configuration) {
				configuration = new ConfigImpl(this.factory, this, pid);
				this.configs[pid] = configuration;
				this.pref.put(pid, configuration);
			}
			return configuration;
		},
		initialize: function() {
			return this.initPromise;
		},
		list: function() {
			var pids = Object.keys(this.configs);
			var result = [];
			for (var i=0; i < pids.length; i++) {
				var configuration = this.configs[pids[i]];
				result.push(configuration);
			}
			return result;
		},
		remove: function(pid) {
			delete this.configs[pid];
			this.pref.remove(pid);
		},
		save: function(pid, configuration) {
			// TODO smarter pref layout instead of dumping all configs in one node
			this.pref.put(pid, configuration.getProperties());
		}
	};
	return ConfigStore;
}());

/**
 * @name orion.cm.impl.ConfigImpl
 * @class 
 * @private
 */
ConfigImpl = /** @ignore */ (function() {
	function clone(props) {
		// Configurations cannot have nested properties, so a 1-level-deep clone is enough
		var c = {}, keys = Object.keys(props);
		for (var i=0; i < keys.length; i++) {
			var key = keys[i], value = props[key];
			c[key] = (value instanceof Array) ? value.slice() : value;
		}
		return c;
	}
	function setProperties(configuration, newProps) {
		newProps = clone(newProps);
		delete newProps[PROPERTY_PID];
		configuration.properties = newProps;
	}
	function ConfigImpl(factory, store, pidOrProps) {
		this.factory = factory;
		this.store = store;
		if (typeof pidOrProps === 'object') { //$NON-NLS-0$
			this.pid = pidOrProps[PROPERTY_PID];
			setProperties(this, pidOrProps);
		} else {
			this.pid = pidOrProps;
			this.properties = null;
		}
	}
	ConfigImpl.prototype = {
		getPid: function() {
			return this.pid;
		},
		getProperties: function() {
			var props = null;
			if (this.properties) {
				props = clone(this.properties);
				props[PROPERTY_PID] = this.pid;
			}
			return props;
		},
		remove: function() {
			var self = this;
			this.store.remove(this.pid);
			self.factory.notifyDeleted(self);
		},
		update: function(props) {
			setProperties(this, props);
			var self = this;
			this.store.save(this.pid, this);
			self.factory.notifyUpdated(self);
		}
	};
	return ConfigImpl;
}());

/**
 * @name orion.cm.Configuration
 * @class The configuration information for a {@link orion.cm.ManagedService}.
 * @description A <code>Configuration</code> object contains configuration properties. Services wishing to receive those
 * properties do not deal with Configurations directly, but instead register a {@link orion.cm.ManagedService} with the
 * Service Registry.
 */
	/**
	 * @name getPid
	 * @methodOf orion.cm.Configuration.prototype
	 * @returns {String} The PID of this Configuration.
	 */
	/**
	 * @name getProperties
	 * @methodOf orion.cm.Configuration.prototype
	 * @returns {orion.cm.ConfigurationProperties} A private copy of this Configuration's properties, or <code>null</code>
	 * if the configuration has never been updated.
	 */
	/**
	 * @name remove
	 * @methodOf orion.cm.Configuration.prototype
	 * @description Deletes this Configuration. Any {@link orion.cm.ManagedService} that registered interest in this 
	 * Configuration's PID will have its {@link orion.cm.ManagedService#updated} method called with <code>null</code> properties. 
	 */
	/**
	 * @name update
	 * @methodOf orion.cm.Configuration.prototype
	 * @param {Object} [properties] The new properties to be set in this Configuration. The <code>pid</code> 
	 * property will be added or overwritten and set to this Configuration's PID.
	 * @description Updates the properties of this Configuration. Any {@link orion.cm.ManagedService} that registered
	 * interest in this Configuration's PID will have its {@link orion.cm.ManagedService#updated} method called.
	 */

/**
 * @name orion.cm.ConfigurationAdmin
 * @class Service for managing configuration data.
 */
	/**
	 * @name getConfiguration
	 * @methodOf orion.cm.ConfigurationAdmin.prototype
	 * @description Gets the configuration having the given PID, creating a new one if necessary. Newly created configurations
	 * have <code>null</code> properties.
	 * @param {String} pid
	 * @returns {orion.cm.Configuration}
	 */
	/**
	 * @name listConfigurations
	 * @methodOf orion.cm.ConfigurationAdmin.prototype
	 * @returns {orion.cm.Configuration[]} All Configurations with non-<code>null</code> properties.
	 */

/**
 * @private
 * @name orion.cm.ConfigurationEvent
 * @class
 * @property {String} type Either <code>'deleted'</code> or <code>'updated'</code>.
 * @property {String} pid The PID of the {@link orion.cm.Configuration} that was changed.
 */

/**
 * @name orion.cm.ManagedService
 * @class Interface for a service that needs configuration data.
 * @description A <code>ManagedService</code> is a service that needs configuration properties from a {@link orion.cm.ConfigurationAdmin}.
 * <p>A ManagedService is registered with the Service Registry using the service name <code>'orion.cm.managedservice'</code>.
 * The ManagedService's service properties must contain a <code>pid</code> property giving a unique identifier called a PID.
 * <p>When a change occurs to a Configuration object corresponding to the PID, the service's {@link #updated} method is 
 * called with the configuration's properties.
 */
	/**
	 * @name updated
	 * @methodOf orion.cm.ManagedService.prototype
	 * @description Invoked after a Configuration has been updated.
	 * @param {orion.cm.ConfigurationProperties} properties The properties of the {@link orion.cm.Configuration} that was
	 * updated. This parameter will be <code>null</code> if the Configuration does not exist or was deleted.
	 */
/**
 * @name orion.cm.ConfigurationProperties
 * @class A dictionary that holds configuration data.
 * @description A <code>ConfigurationProperties</code> carries the properties of a {@link orion.cm.Configuration}. Minimally a ConfigurationProperties
 * will have a {@link #pid} <code>pid</code> property. Other properties may also be present.
 * @property {String} pid Gives the PID of the {@link orion.cm.Configuration} whose properties this object represents.
 */
	return {
		ConfigurationAdminFactory: ConfigAdminFactory
	};
});