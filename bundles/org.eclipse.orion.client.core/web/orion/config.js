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
define(['orion/textview/eventTarget', 'orion/Deferred', 'orion/serviceTracker'],
	function(mEventTarget, Deferred, ServiceTracker) {
var ManagedServiceTracker, ConfigAdminFactory, ConfigStore, ConfigAdminImpl, ConfigImpl;

var PROPERTY_PID = 'pid'; //$NON-NLS-0$
var MANAGED_SERVICE = 'orion.cm.managedservice'; //$NON-NLS-0$

/**
 * @name orion.cm.impl.ManagedServiceTracker
 * @class Tracks ManagedServices in a ServiceRegistry. Delivers updated() notifications to tracked ManagedServices.
 * @private
 */
ManagedServiceTracker = /** @ignore */ function(serviceRegistry, store) {
	ServiceTracker.call(this, serviceRegistry, MANAGED_SERVICE); //$NON-NLS-0$

	var managedServiceRefs = {};
	var managedServices = {};

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
		function arr(v) { return Array.isArray(v) ? v : [v]; }
		arr(managedService).forEach(function(service) {
			try {
				service.updated(properties);
			} catch(e) {
				if (typeof console !== 'undefined') { //$NON-NLS-0$
					console.log(e);
				}
			}
		});
	}
	this.addingService = function(serviceRef) {
		var pid = serviceRef.getProperty(PROPERTY_PID);
		var managedService = serviceRegistry.getService(serviceRef);
		if (!pid || !managedService) {
			return null;
		}
		add(pid, serviceRef, managedService);
		return managedService;
	};
	/**
	 * @returns {Deferred} A deferred that resolves once the managed service's updated() method has been called
	 */
	this.onServiceAdded = function(serviceRef, managedService) {
		var pid = serviceRef.getProperty(PROPERTY_PID);
		return store.get(pid).then(function(configuration) {
			asyncUpdated(serviceRef, managedService, (configuration && configuration.getProperties()));
		});
	};
	this.notifyUpdated = function(configuration) {
		var pid = configuration.getPid();
		asyncUpdated(getManagedServiceReferences(pid), getManagedServices(pid), configuration.getProperties());
	};
	this.notifyDeleted = function(configuration) {
		var pid = configuration.getPid();
		asyncUpdated(getManagedServiceReferences(pid), getManagedServices(pid), null);
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
	/** @private */
	function ConfigAdminFactory(serviceRegistry, prefsService) {
		this.store = new ConfigStore(this, prefsService);
		this.configAdmin = new ConfigAdminImpl(this, this.store);
		this.tracker = new ManagedServiceTracker(serviceRegistry, this.store);
		this.tracker.open();
	}
	ConfigAdminFactory.prototype = {
		getConfigurationAdmin: function() {
			return this.configAdmin;
		},
		notifyDeleted: function(configuration) {
			this.tracker.notifyDeleted(configuration);
		},
		notifyUpdated: function(configuration) {
			this.tracker.notifyUpdated(configuration);
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
var CONFIG_PREF_NODE = '/cm/configurations'; //$NON-NLS-0$
ConfigStore = /** @ignore */ (function() {
	function ConfigStore(factory, prefsService) {
		this.factory = factory;
		this.prefsService = prefsService;
		this.configs = Object.create(null); /* PID -> Configuration */
		this.prefs = Object.create(null); /* PID -> Preferences node */
		this.prefRoot = null;
	}
	ConfigStore.prototype = {
		_createConfig: function(properties) {
			return new ConfigImpl(this.factory, this, properties);
		},
		_find: function(pid) {
			return this.configs[pid] || null;
		},
		isNodeLoaded: function(pid) {
			var node = this.prefs[pid];
			return node && node.state() === 'resolve'; //$NON-NLS-0$
		},
		loadNode: function(pid) {
			if (typeof pid !== 'string') { //$NON-NLS-0$
				throw new Error('Invalid pid: ' + pid); //$NON-NLS-0$
			}
			this.prefRoot = this.prefRoot || this.prefsService.getPreferences(CONFIG_PREF_NODE);
			this.prefs[pid] = this.prefs[pid] || this.prefsService.getPreferences(CONFIG_PREF_NODE + '/' + pid); //$NON-NLS-0$
			var self = this;
			return Deferred.all([this.prefRoot, this.prefs[pid]]).then(function(result) {
				var prefRoot = result[0], prefNode = result[1];
				if (!prefRoot.get(pid)) {
					prefRoot.put(pid, true);
				}
				var props = prefNode.get('properties'); //$NON-NLS-0$
				if (props) {
					self.configs[pid] = self._createConfig(props);
				}
				return prefNode;
			});
		},
		get: function(pid) {
			var self = this;
			return this.loadNode(pid).then(function(prefNode) {
				var configuration = self._find(pid);
				if (!configuration) {
					configuration = new ConfigImpl(self.factory, self, pid);
					self.configs[pid] = configuration;
					// only pid is in the properties here
					prefNode.put('properties', configuration.getProperties()); //$NON-NLS-0$
				}
				return configuration;
			});
		},
		list: function() {
			var self = this;
			this.prefRoot = this.prefRoot || this.prefsService.getPreferences(CONFIG_PREF_NODE);
			return this.prefRoot.then(function(prefRoot) {
				var pids = prefRoot.keys();
				return Deferred.all(pids.map(self.loadNode.bind(self))).then(function() {
					return pids.map(self._find.bind(self));
				});
			});
		},
		remove: function(pid) {
			delete this.configs[pid];
			var self = this;
			this.loadNode(pid).then(function(prefNode) {
				// TODO want to remove the whole node here, see https://bugs.eclipse.org/bugs/show_bug.cgi?id=386582
				// TODO remove from list
				prefNode.clear();
				//delete self.prefs[pid];
			});
		},
		save: function(pid, configuration) {
			var properties = configuration.getProperties();
			this.loadNode(pid).then(function(prefNode) {
				prefNode.put('properties', properties); //$NON-NLS-0$
			});
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
		if (pidOrProps !== null && typeof pidOrProps === 'object') { //$NON-NLS-0$
			this.pid = pidOrProps[PROPERTY_PID];
			setProperties(this, pidOrProps);
		} else if (typeof pidOrProps === 'string') { //$NON-NLS-0$
			this.pid = pidOrProps;
			this.properties = null;
		} else {
			throw new Error('Invalid pid/properties ' + pidOrProps); //$NON-NLS-0$
		}
	}
	ConfigImpl.prototype = {
		_checkRemoved: function() {
			if (this._removed) {
				throw new Error('Configuration was removed'); //$NON-NLS-0$
			}
		},
		getPid: function() {
			this._checkRemoved();
			return this.pid;
		},
		getProperties: function() {
			this._checkRemoved();
			var props = null;
			if (this.properties) {
				props = clone(this.properties);
				props[PROPERTY_PID] = this.pid;
			}
			return props;
		},
		remove: function() {
			this._checkRemoved();
			var self = this;
			self.factory.notifyDeleted(self);
			this.store.remove(this.pid);
			this._removed = true;
		},
		update: function(props) {
			this._checkRemoved();
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
	 * @returns {orion.cm.Configuration} A deferred resolving to the {@link orion.cm.Configuration}.
	 */
	/**
	 * @name listConfigurations
	 * @methodOf orion.cm.ConfigurationAdmin.prototype
	 * @description Returns all Configurations having non-<code>null</code> properties.
	 * @returns {orion.cm.Configuration[]} A deferred resolving to an array of configurations.
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