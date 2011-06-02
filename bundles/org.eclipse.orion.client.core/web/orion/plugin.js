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
/**
 * @namespace The global container for eclipse APIs.
 */ 
var eclipse = eclipse || {};

eclipse.ServiceProvider = function(serviceId, internalProvider) {
	
	this.dispatchEvent = function(eventName) {
		internalProvider.dispatchEvent.apply(internalProvider, [serviceId, eventName].concat(Array.prototype.slice.call(arguments, 1)));	
	};
	
	this.unregister = function() {
		internalProvider.unregisterServiceProvider(serviceId);
	};
};

eclipse.PluginProvider = function(metadata) {
	var _metadata = metadata;
	
	var _services = [];
	var _connected = false;
	var _target = null;

	function _publish(message) {
		if (_target) {
			_target.postMessage(JSON.stringify(message), "*");
		}
	}
	
	var _internalProvider = {
			dispatchEvent: function(serviceId, eventName) {
				if (!_connected) {
					throw new Error("Cannot dispatchEvent. Plugin Provider not connected");
				}
				var message = {
					serviceId: serviceId,
					method: "dispatchEvent",
					params: [eventName].concat(Array.prototype.slice.call(arguments, 2))
				};
				_publish(message);
				
			},
			unregisterServiceProvider: function(serviceId) {
				if (_connected) {
					throw new Error("Cannot unregister. Plugin Provider is connected");
				}
				_services[serviceId] = null;
			}
	};
	
	function _getPluginData() {
		var services = [];
		for (var i = 0; i < _services.length; i++) {
			if (_services[i]) {
				services.push({serviceId: i, type: _services[i].type, methods: _services[i].methods, properties: _services[i].properties });
			}
		}
		return {services: services, metadata: _metadata || {}};		
	}
	
	function _handleRequest(event) {
		
		if (event.source !== _target ) {
			return;
		}
		var message = JSON.parse(event.data);
		var serviceId = message.serviceId;
		var service = _services[serviceId].implementation;
		var method = service[message.method];
		
		var response = {id: message.id, result: null, error: null};		
		try {
			var promiseOrResult = method.apply(service, message.params);
			if(promiseOrResult && typeof promiseOrResult.then === "function"){
				promiseOrResult.then(function(result) {
					response.result = result;
					_publish(response);
				}, function(error) {
					response.error = error;
					_publish(response);
				});
			} else {
				response.result = promiseOrResult;
				_publish(response);
			}
		} catch (error) {
			response.error = error;
			_publish(response);
		}
	}
	
	this.registerServiceProvider = function(type, implementation, properties) {
		if (_connected) {
			throw new Error("Cannot register. Plugin Provider is connected");
		}
		
		var method = null;;
		var methods = [];
		for (method in implementation) {
			if (typeof implementation[method] === 'function') {
				methods.push(method);
			}
		}
		
		var serviceId = _services.length;
		_services[serviceId] = {type: type, methods: methods, implementation: implementation, properties: properties || {}};
		return new eclipse.ServiceProvider(serviceId, _internalProvider);	
	};
	
	this.connect = function(callback, errback) {
		if (_connected) {
			if (callback) {
				callback();
			}
			return;
		}

		if (!window) {
			_target = self;
		} else if (window !== window.parent) {
			_target = window.parent;
		} else if (window.opener !== null) {
			_target = window.opener;
		} else {
			errback("No valid plugin target");
			return;
		}
		addEventListener("message", _handleRequest, false);
		var message = {
			method: "plugin",
			params: [_getPluginData()]
		};
		_publish(message);
		_connected = true;
		if (callback) {
			callback();
		}
	};
	
	this.disconnect = function() {
		if (_connected) { 
			removeEventListener("message", _handleRequest);
			_target = null;
			_connected = false;
		}
	};
};