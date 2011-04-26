/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global eclipse */
/*global console */
/*global dojo */
var eclipse = eclipse || {};
eclipse.ServiceReference = function(serviceId, name, properties) {
	this.getServiceId = function() {
		return serviceId;
	};
	
	this.getName = function() {
		return name;
	};

	this.getPropertyNames = function() {
		var result = [];
		var name;
		for (name in properties) {
			if (properties.hasOwnProperty(name)) {
				result.push(name);
			}
		}
		return result;
	};

	this.getProperty = function(propertyName) {
		return properties[propertyName];
	};
};

eclipse.ServiceRegistration = function(serviceId, serviceReference, internalRegistry){
	this.unregister = function() {
		internalRegistry.unregisterService(serviceId);
	};

	this.dispatchEvent = function(eventName) {
		internalRegistry.dispatchEvent.apply(internalRegistry, [serviceId, eventName].concat(Array.prototype.slice.call(arguments, 1)));
	};
	
	this.getServiceReference = function() {
		return serviceReference;
	};
};

eclipse.Service = function(serviceId, implementation, internalRegistry) {
	var method;
	for (method in implementation) {
		if (typeof implementation[method] === 'function') {
			this[method] = function(methodName) {
				return function() {
					if (internalRegistry.isRegistered(serviceId)) {
						var d = new dojo.Deferred();
						try {
							var result = implementation[methodName].apply(implementation, Array.prototype.slice.call(arguments));
							dojo.when(result, dojo.hitch(d, d.resolve), dojo.hitch(d, d.reject));
						} catch (e) {
							d.reject(e);
						}
						return d.promise;
					}
					throw new Error("Service was unregistered");
				};
			}(method);
		}
	}
	
	this.addEventListener = function(eventName, listener) {
		internalRegistry.addEventListener(serviceId, eventName, listener);
	};
	
	this.removeEventListener = function(eventName, listener) {
		internalRegistry.removeEventListener(serviceId, eventName, listener);
	};	
};

eclipse.EventTarget = function() {
	var _namedlisteners = {};
	
	this.dispatchEvent = function(eventName) {
		var listeners = _namedlisteners[eventName];
		if (listeners) {
			for (var i = 0; i < listeners.length; i++) {
				try {
					var args = Array.prototype.slice.call(arguments, 1);
					listeners[i].apply(null, args);
				} catch (e) {
					console.log(e); // for now, probably should dispatch an ("error", e)
				}
			}
		}
	};
	
	this.addEventListener = function(eventName, listener) {
		_namedlisteners[eventName] = _namedlisteners[eventName] || [];
		_namedlisteners[eventName].push(listener);
	};
	
	this.removeEventListener = function(eventName, listener) {
		var listeners = _namedlisteners[eventName];
		if (listeners) {
			for (var i = 0; i < listeners.length; i++) {
				if (listeners[i] === listener) {
					if(listeners.length === 1) {
						delete _namedlisteners[eventName];
					} else {
						listeners.splice(i,1);
					}
					break;
				}
			}
		}
	};	
};

eclipse.ServiceRegistry = function() {
	var _entries = [];
	var _namedReferences = {};
	var _serviceEventTarget = new eclipse.EventTarget();
	
	var internalRegistry = {
			isRegistered: function(serviceId) {
				return _entries[serviceId] ? true: false;
			},
			unregisterService: function(serviceId) {
				var entry = _entries[serviceId];
				if (entry) {
					var reference = entry.reference;
					var namedReferences = _namedReferences[reference.getName()];
					for (var i = 0; i < namedReferences.length; i++) {
						if (namedReferences[i] === reference) {
							if(namedReferences.length === 1) {
								delete _namedReferences[reference.getName()];
							} else {
								namedReferences.splice(i,1);
							}
							break;
						}
					}
					_entries[serviceId] = null;
					_serviceEventTarget.dispatchEvent("serviceRemoved", reference, entry.service);
				}				
			},
			dispatchEvent: function(serviceId, eventName) {
				var entry = _entries[serviceId];
				if (entry) {
					entry.eventTarget.dispatchEvent.apply(entry.eventTarget, [eventName].concat(Array.prototype.slice.call(arguments, 2)));
				}				
			},
			addEventListener: function(serviceId, eventName, listener) {
				var entry = _entries[serviceId];
				if (entry) {
					entry.eventTarget.addEventListener(eventName, listener);
				}		
			},
			removeEventListener: function(serviceId, eventName, listener) {
				var entry = _entries[serviceId];
				if (entry) {
					entry.eventTarget.removeEventListener(eventName, listener);
				}		
			}
	};
	
	this.getService = function(nameOrServiceReference, timeout) {
		var service;
		var d = new dojo.Deferred();
		if (typeof nameOrServiceReference === 'string') {
			if (_namedReferences[nameOrServiceReference]) {
				for (var i = 0; i < _namedReferences[nameOrServiceReference].length; i++) {
					service = _entries[_namedReferences[nameOrServiceReference][i].getServiceId()].service;
					if (service) {
						break;
					}
				}
			}
		} else {
			service = _entries[nameOrServiceReference.getServiceId()].service;
		}
		if (service) {
			d.resolve(service);
		} else if (timeout === 0) {
			d.reject(new Error("timeout: getService"));
		} else {
			var serviceTracker = function(reference, service) {
				if (nameOrServiceReference === reference || nameOrServiceReference === reference.getName()) {
					d.resolve(service);
					_serviceEventTarget.removeEventListener("serviceAdded", serviceTracker);
				}
			};
			_serviceEventTarget.addEventListener("serviceAdded", serviceTracker);
		}
		return d.promise;
	};
	
	this.getServiceReferences = function(name) {
		if (name) {
			return _namedReferences[name] ? _namedReferences[name] : [];
		}
		var result = [];
		for (var i = 0; i <_entries.length; i++) {
			if (_entries[i]) {
				result.push(_entries[i].reference);
			}
		}
		return result;
	};
	
	this.registerService = function(name, implementation, properties) {
		var serviceId = _entries.length;
		var reference = new eclipse.ServiceReference(serviceId, name, properties);
		var service = new eclipse.Service(serviceId, implementation, internalRegistry);
		
		_namedReferences[name] = _namedReferences[name] || [];
		_namedReferences[name].push(reference);
		_entries.push({reference: reference, service: service, eventTarget: new eclipse.EventTarget()});
		_serviceEventTarget.dispatchEvent("serviceAdded", reference, service);
		return new eclipse.ServiceRegistration(serviceId, reference, internalRegistry);
	};
	
	// serviceAdded, serviceRemoved
	this.addEventListener = function(eventName, listener) {
		_serviceEventTarget.addEventListener(eventName, listener);
	};
	
	this.removeEventListener = function(eventName, listener) {
		_serviceEventTarget.removeEventListener(eventName, listener);
	};	
};
