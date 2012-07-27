/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define console */

define(["orion/Deferred", "orion/EventTarget", "orion/es5shim"], function(Deferred, EventTarget) {

	/**
	 * Creates a new service reference.
	 *
	 * @name orion.serviceregistry.ServiceReference
	 * @class A reference to a service in the Orion service registry
	 * @param {String} serviceId The symbolic id of this service instance
	 * @param {String} name The service name
	 * @param {Object} properties A JSON object containing the service's declarative properties
	 */

	function ServiceReference(serviceId, names, properties) {
		this.properties = properties || {};
		this.properties["service.id"] = serviceId;
		this.properties["service.names"] = names;
	}

	ServiceReference.prototype = /** @lends orion.serviceregistry.ServiceReference.prototype */
	{
		/**
		 * Returns the names of the declarative properties of this service.
		 */
		getPropertyKeys: function() {
			var result = [];
			var name;
			for (name in this.properties) {
				if (this.properties.hasOwnProperty(name)) {
					result.push(name);
				}
			}
			return result;
		},
		/**
		 * Returns the declarative service property with the given name, or undefined
		 * if this service does not have such a property.
		 * @param {String} propertyName The name of the service property to return
		 */
		getProperty: function(propertyName) {
			return this.properties[propertyName];
		}
	};
	ServiceReference.prototype.constructor = ServiceReference;

	/**
	 * Creates a new service registration. This constructor is private and should only be called by the service registry.
	 *
	 * @name orion.serviceregistry.ServiceRegistration
	 * @class A reference to a registered service in the Orion service registry
	 * @param {String} serviceId The symbolic id of this service
	 * @param {String} serviceReference A reference to the service
	 * @param {Object} internalRegistry A JSON object containing the service's declarative properties
	 */

	function ServiceRegistration(serviceId, serviceReference, internalRegistry) {
		this.serviceId = serviceId;
		this.serviceReference = serviceReference;
		this.internalRegistry = internalRegistry;
	}
	ServiceRegistration.prototype = /** @lends orion.serviceregistry.ServiceRegistration.prototype */
	{
		/**
		 * Unregister this service registration.
		 */
		unregister: function() {
			this.internalRegistry.unregisterService(this.serviceId);
		},

		/**
		 * Returns a reference to this registered service.
		 */
		getServiceReference: function() {
			return this.serviceReference;
		}
	};
	ServiceRegistration.prototype.constructor = ServiceRegistration;

	function Service(serviceId, implementation, internalRegistry, registered) {
		var method;

		function _createServiceCall(methodName) {
			return function() {
				var args = arguments;
				return registered.then(function() {
					if (internalRegistry.isRegistered(serviceId)) {
						return implementation[methodName].apply(implementation, Array.prototype.slice.call(args));
					}
					throw new Error("Service was unregistered");
				});
			};
		}

		for (method in implementation) {
			if (typeof implementation[method] === 'function') {
				this[method] = _createServiceCall(method);
			}
		}
	}

	/**
	 * Creates a new service registry
	 * 
	 * @name orion.serviceregistry.ServiceRegistry
	 * @class The Orion service registry
	 */

	function ServiceRegistry() {
		this._entries = [];
		this._namedReferences = {};
		this._serviceEventTarget = new EventTarget();
		var that = this;
		this.internalRegistry = {
			isRegistered: function(serviceId) {
				return that._entries[serviceId] ? true : false;
			},
			unregisterService: function(serviceId) {
				var entry = that._entries[serviceId];
				if (entry) {
					var reference = entry.reference;
					var names = reference.getProperty("service.names");
					names.forEach(function(name) {
						var namedReferences = that._namedReferences[name];
						for (var i = 0; i < namedReferences.length; i++) {
							if (namedReferences[i] === reference) {
								if (namedReferences.length === 1) {
									delete that._namedReferences[name];
								} else {
									namedReferences.splice(i, 1);
								}
								break;
							}
						}
					});
					that._entries[serviceId] = null;
					that._serviceEventTarget.dispatchEvent("serviceRemoved", reference, entry.service);
				}
			}
		};
	}
	ServiceRegistry.prototype = /** @lends orion.serviceregistry.ServiceRegistry.prototype */
	{

		/**
		 * Returns the service with the given name or reference.
		 * @param {String|orion.serviceregistry.ServiceReference} nameOrServiceReference The service name or a service reference
		 */
		getService: function(nameOrServiceReference) {
			var service;
			if (typeof nameOrServiceReference === "string") {
				var references = this._namedReferences[nameOrServiceReference];
				if (references) {
					references.some(function(reference) {
						service = this._entries[reference.getProperty("service.id")].service;
						return !!service;
					}, this);
				}
			} else {
				service = this._entries[nameOrServiceReference.getProperty("service.id")].service;
			}
			return service || null;
		},

		/**
		 * Returns all references to the service with the given name
		 * @param {String} name The name of the service to return
		 * @returns {orion.serviceregistry.ServiceReference[]} An array of service references
		 */
		getServiceReferences: function(name) {
			if (name) {
				return this._namedReferences[name] ? this._namedReferences[name] : [];
			}
			var result = [];
			this._entries.forEach(function(entry) {
				if (entry) {
					result.push(entry.reference);
				}
			});
			return result;
		},
		/**
		 * Registers a service with this registry.
		 * @param {String|String[]} names the names of the service being registered
		 * @param {Object} implementation The service implementation
		 * @param {Object} properties A JSON collection of declarative service properties
		 * @returns {orion.serviceregistry.ServiceRegistration} A service registration object for the service.
		 */
		registerService: function(names, implementation, properties) {
			var serviceId = this._entries.length;
			
			if (typeof(names) === "string") {
				names = [names];
			}
			
			var reference = new ServiceReference(serviceId, names, properties);
			var registered = new Deferred();
			var service = new Service(serviceId, implementation, this.internalRegistry, registered);

			var namedReferences = this._namedReferences;
			names.forEach(function(name) {
				namedReferences[name] = namedReferences[name] || [];
				namedReferences[name].push(reference);
			});
			
			this._entries.push({
				reference: reference,
				service: service
			});
			this._serviceEventTarget.dispatchEvent("serviceAdded", reference, service).then(registered.resolve);
			return new ServiceRegistration(serviceId, reference, this.internalRegistry);
		},

		/**
		 * Adds a listener for events on this registry
		 * @param {String} eventName The name of the event to listen for
		 * @param {Function} listener The listener to add
		 */
		addEventListener: function(eventName, listener) {
			this._serviceEventTarget.addEventListener(eventName, listener);
		},

		/**
		 * Removes a listener for events on this registry
		 * @param {String} eventName The name of the event to stop listening for
		 * @param {Function} listener The listener to remove
		 */
		removeEventListener: function(eventName, listener) {
			this._serviceEventTarget.removeEventListener(eventName, listener);
		}
	};
	ServiceRegistry.prototype.constructor = ServiceRegistry;

	//return the module exports
	return {
		ServiceReference: ServiceReference,
		ServiceRegistration: ServiceRegistration,
		ServiceRegistry: ServiceRegistry
	};
});