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

define(["dojo"], function(dojo){

	/**
	 * Creates a new service reference.
	 *
	 * @name orion.serviceregistry.ServiceReference
	 * @class A reference to a service in the Orion service registry
	 * @param {String} serviceId The symbolic id of this service instance
	 * @param {String} name The service name
	 * @param {Object} properties A JSON object containing the service's declarative properties
	 */
	function ServiceReference(serviceId, name, properties) {
		this.serviceId = serviceId;
		this.name = name;
		this.properties = properties;
	}
	ServiceReference.prototype = /** @lends orion.serviceregistry.ServiceReference.prototype */ {
		/**
		 * Returns the symbolic id of this service.
		 */
		getServiceId: function() {
			return this.serviceId;
		},
		
		/**
		 * Returns the name of the service this reference provides.
		 */
		getName: function() {
			return this.name;
		},
		/**
		 * Returns the names of the declarative properties of this service.
		 */
		getPropertyNames: function() {
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
	 * Creates a new service registration
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
	ServiceRegistration.prototype = /** @lends orion.serviceregistry.ServiceRegistration.prototype */ {
		/**
		 * Unregister this service registration.
		 */
		unregister: function() {
			this.internalRegistry.unregisterService(this.serviceId);
		},
	
		/**
		 * Dispatches an event to this service.
		 * @param {String} eventName The name of the service event
		 */
		dispatchEvent: function(eventName) {
			this.internalRegistry.dispatchEvent.apply(this.internalRegistry, [this.serviceId, eventName].concat(Array.prototype.slice.call(arguments, 1)));
		},
		
		/**
		 * Returns a reference to this registered service.
		 */
		getServiceReference: function() {
			return this.serviceReference;
		}
	};
	ServiceRegistration.prototype.constructor = ServiceRegistration;

	/**
	 * Creates a new service instance.
	 *
	 * @name orion.serviceregistry.Service
	 * @class A concrete service in the Orion service registry
	 * @param {String} serviceId The symbolic id of this service
	 * @param {Object} implementation An object implementing the service contract
	 * @param {orion.serviceregistry.ServiceRegistry} internalRegistry A JSON object containing the service's declarative properties
	 */
	function Service(serviceId, implementation, internalRegistry) {
		this.serviceId= serviceId;
		this.implementation = implementation;
		this.internalRegistry = internalRegistry;
		var method;
		for (method in implementation) {
			if (typeof implementation[method] === 'function') {
				this[method] = function(methodName) {
					return function() {
						if (internalRegistry.isRegistered(serviceId)) {
							var d = new dojo.Deferred();
							try {
								var result = implementation[methodName].apply(implementation, Array.prototype.slice.call(arguments));
								dojo.when(result, dojo.hitch(d, d.resolve), dojo.hitch(d, d.reject), dojo.hitch(d, d.progress));
							} catch (e) {
								d.reject(e);
							}
							return d;
						}
						throw new Error("Service was unregistered");
					};
				}(method);
			}
		}
	}
	
	Service.prototype = /** @lends orion.serviceregistry.Service.prototype */ {

		/**
		 * Adds a listener to this service for a particular event.
		 * @param {String} eventName The name of the event to listen for
		 * @param {Object} listener The event listener
		 */
		addEventListener: function(eventName, listener) {
			this.internalRegistry.addEventListener(this.serviceId, eventName, listener);
		},
		
		/**
		 * Stops a listener from listening to a particular event on this service.
		 * @param {String} eventName The name of the event to listen for
		 * @param {Object} listener The event listener
		 */
		removeEventListener: function(eventName, listener) {
			this.internalRegistry.removeEventListener(this.serviceId, eventName, listener);
		}
	};
	Service.prototype.constructor = Service;
	

	/**
	 * Creates an Event Target
	 *
	 * @name orion.serviceregistry.EventTarget
	 * @class Base for creating an Orion event target
	 */
	function EventTarget() {
		this._namedlisteners = {};
	}	

	EventTarget.prototype = /** @lends orion.serviceregistry.EventTarget.prototype */{
		/**
		 * Dispatches a named event along with an arbitrarary set of parameters
		 * @param {String} eventName The event name
		 */
		dispatchEvent: function(eventName) {
			var listeners = this._namedlisteners[eventName];
			if (listeners) {
				for ( var i = 0; i < listeners.length; i++) {
					try {
						var args = Array.prototype.slice.call(arguments, 1);
						listeners[i].apply(null, args);
					} catch (e) {
						console.log(e); // for now, probably should dispatch an
										// ("error", e)
					}
				}
			}
		},

		/**
		 * Adds an event listener for a named event
		 * @param {String} eventName The event name
		 * @param {Function} listener The function called when an event occurs
		 */
		addEventListener: function(eventName, listener) {
			this._namedlisteners[eventName] = this._namedlisteners[eventName] || [];
			this._namedlisteners[eventName].push(listener);
		},

		/**
		 * Removes an event listener for a named event
		 * @param {String} eventName The event name
		 * @param {Function} listener The function called when an event occurs
		 */
		removeEventListener: function(eventName, listener) {
			var listeners = this._namedlisteners[eventName];
			if (listeners) {
				for ( var i = 0; i < listeners.length; i++) {
					if (listeners[i] === listener) {
						if (listeners.length === 1) {
							delete this._namedlisteners[eventName];
						} else {
							listeners.splice(i, 1);
						}
						break;
					}
				}
			}
		}

	};
	EventTarget.prototype.constructor = EventTarget;


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
					return that._entries[serviceId] ? true: false;
				},
				unregisterService: function(serviceId) {
					var entry = that._entries[serviceId];
					if (entry) {
						var reference = entry.reference;
						var namedReferences = that._namedReferences[reference.getName()];
						for (var i = 0; i < namedReferences.length; i++) {
							if (namedReferences[i] === reference) {
								if(namedReferences.length === 1) {
									delete that._namedReferences[reference.getName()];
								} else {
									namedReferences.splice(i,1);
								}
								break;
							}
						}
						that._entries[serviceId] = null;
						that._serviceEventTarget.dispatchEvent("serviceRemoved", reference, entry.service);
					}				
				},
				dispatchEvent: function(serviceId, eventName) {
					var entry = that._entries[serviceId];
					if (entry) {
						entry.eventTarget.dispatchEvent.apply(entry.eventTarget, [eventName].concat(Array.prototype.slice.call(arguments, 2)));
					}				
				},
				addEventListener: function(serviceId, eventName, listener) {
					var entry = that._entries[serviceId];
					if (entry) {
						entry.eventTarget.addEventListener(eventName, listener);
					}		
				},
				removeEventListener: function(serviceId, eventName, listener) {
					var entry = that._entries[serviceId];
					if (entry) {
						entry.eventTarget.removeEventListener(eventName, listener);
					}		
				}
		};
	}
	ServiceRegistry.prototype = /** @lends orion.serviceregistry.ServiceRegistry.prototype */ {

		/**
		 * Returns the service with the given name or reference.
		 * @param {String|orion.serviceregistry.ServiceReference} nameOrServiceReference The service name or a service reference
		 * @param timeout The amount of time in milliseconds to wait for this reference to arrive before failing.
		 */
		getService: function(nameOrServiceReference, timeout) {
			var service;
			var d = new dojo.Deferred();
			if (typeof nameOrServiceReference === 'string') {
				if (this._namedReferences[nameOrServiceReference]) {
					for (var i = 0; i < this._namedReferences[nameOrServiceReference].length; i++) {
						service = this._entries[this._namedReferences[nameOrServiceReference][i].getServiceId()].service;
						if (service) {
							break;
						}
					}
				}
			} else {
				service = this._entries[nameOrServiceReference.getServiceId()].service;
			}
			if (service) {
				d.resolve(service);
			} else if (timeout === 0) {
				d.reject(new Error("timeout: getService"));
			} else {
				var that = this;
				var serviceTracker = function(reference, service) {
					if (nameOrServiceReference === reference || nameOrServiceReference === reference.getName()) {
						d.resolve(service);
						that._serviceEventTarget.removeEventListener("serviceAdded", serviceTracker);
					}
				};
				this._serviceEventTarget.addEventListener("serviceAdded", serviceTracker);
			}
			return d.promise;
		},
		
		/**
		 * Returns all references to the service with the given name
		 * @param {String} name The name of the service to return
		 * @returns {Array} An array of service references
		 */
		getServiceReferences: function(name) {
			if (name) {
				return this._namedReferences[name] ? this._namedReferences[name] : [];
			}
			var result = [];
			for (var i = 0; i < this._entries.length; i++) {
				if (this._entries[i]) {
					result.push(this._entries[i].reference);
				}
			}
			return result;
		},
		/**
		 * Registers a service with this registry.
		 * @param {String} name the name of the service being registered
		 * @param {Object} The service implementation
		 * @param {Object} A JSON collection of declarative service properties
		 */
		registerService: function(name, implementation, properties) {
			var serviceId = this._entries.length;
			var reference = new ServiceReference(serviceId, name, properties);
			var service = new Service(serviceId, implementation, this.internalRegistry);
			
			this._namedReferences[name] = this._namedReferences[name] || [];
			this._namedReferences[name].push(reference);
			this._entries.push({reference: reference, service: service, eventTarget: new EventTarget()});
			this._serviceEventTarget.dispatchEvent("serviceAdded", reference, service);
			return new ServiceRegistration(serviceId, reference, this.internalRegistry);
		},

		/**
		 * Adds a listener for events on this registry
		 * @param {String} eventName The name of the event to listen for
		 * @param {Object} listener The listener to add
		 */
		addEventListener: function(eventName, listener) {
			this._serviceEventTarget.addEventListener(eventName, listener);
		},
		
		/**
		 * Removes a listener for events on this registry
		 * @param {String} eventName The name of the event to stop listening for
		 * @param {Object} listener The listener to remove
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
		Service: Service,
		EventTarget: EventTarget,
		ServiceRegistry: ServiceRegistry
	};
});
