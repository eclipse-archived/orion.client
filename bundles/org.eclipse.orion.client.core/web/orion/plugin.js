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

/*global window ArrayBuffer addEventListener removeEventListener self XMLHttpRequest define*/

/**
 * @private Don't jsdoc this.
 */

(function() {
	var global = this;
	if (!global.define) {
		global.define = function(f) {
			global.orion = global.orion || {};
			global.orion.PluginProvider = f();
			global.eclipse = global.orion; // (deprecated) backward compatibility 
			delete global.define;
		};
	}
}());

define(function() {
	function PluginProvider(headers) {
		var _headers = headers;
		var _services = [];
		var _conditions = [];
		var _connected = false;
		var _target = null;
	
		function _publish(message) {
			if (_target) {
				if (typeof(ArrayBuffer) === "undefined") { //$NON-NLS-0$
					message = JSON.stringify(message);
				}
				if (_target === self) {
					_target.postMessage(message);
				} else {
					_target.postMessage(message, "*"); //$NON-NLS-0$
				}
			}
		}
		
		function _getPluginData() {
			var services = [];
			// we filter out the service implementation from the data
			for (var i = 0; i < _services.length; i++) {
				services.push({serviceId: i, names: _services[i].names, methods: _services[i].methods, properties: _services[i].properties });
			}
			return {headers: _headers || {}, services: services, conditions: _conditions};		
		}
		
		function _jsonXMLHttpRequestReplacer(name, value) {
			if (value && value instanceof XMLHttpRequest) {
				return {
					status: value.status, 
					statusText: value.statusText
				};
			}
			return value;
		}
		
		function _handleRequest(event) {
			if (event.source !== _target ) {
				return;
			}
			var message = (typeof event.data !== "string" ? event.data : JSON.parse(event.data)); //$NON-NLS-0$
			var serviceId = message.serviceId;
			var service = _services[serviceId].implementation;
			var method = service[message.method];
			
			var response = {id: message.id, result: null, error: null};		
			try {
				var promiseOrResult = method.apply(service, message.params);
				if(promiseOrResult && typeof promiseOrResult.then === "function"){ //$NON-NLS-0$
					promiseOrResult.then(function(result) {
						response.result = result;
						_publish(response);
					}, function(error) {
						response.error = error ? JSON.parse(JSON.stringify(error, _jsonXMLHttpRequestReplacer)) : error; // sanitizing Error object 
						_publish(response);
					}, function() {
						_publish({requestId: message.id, method: "progress", params: Array.prototype.slice.call(arguments)}); //$NON-NLS-0$
					});
				} else {
					response.result = promiseOrResult;
					_publish(response);
				}
			} catch (error) {
				response.error = error ? JSON.parse(JSON.stringify(error, _jsonXMLHttpRequestReplacer)) : error; // sanitizing Error object 
				_publish(response);
			}
		}
	
		this.updateHeaders = function(headers) {
			if (_connected) {
				throw new Error("Cannot update headers. Plugin Provider is connected");
			}
			_headers = headers;
		};
		
		this.registerService = function(names, implementation, properties) {
			if (_connected) {
				throw new Error("Cannot register service. Plugin Provider is connected");
			}
			
			if (typeof(names) === "string") {
				names = [names];
			}
			
			var method = null;
			var methods = [];
			for (method in implementation) {
				if (typeof implementation[method] === 'function') { //$NON-NLS-0$
					methods.push(method);
				}
			}
			
			var serviceId = _services.length;
			_services[serviceId] = {names: names, methods: methods, implementation: implementation, properties: properties || {}};
	
			// try to provide/inject a plugin enabled dispatchEvent method if the service provides one
			if (implementation && typeof implementation.dispatchEvent === "function") {
				var originalDispatchEvent = implementation.dispatchEvent;
				implementation.dispatchEvent = function(eventName) {
					var args = Array.prototype.slice.call(arguments);
					if (_connected) {
						var message = {
							serviceId: serviceId,
							method: "dispatchEvent", //$NON-NLS-0$
							params: typeof eventName === "string" ? args : [eventName.type].concat(args)
						};
						_publish(message);

					}
					originalDispatchEvent.apply(implementation, args);
				};
			}
		};
		this.registerServiceProvider = this.registerService; // (deprecated) backwards compatibility only
		
		this.registerCondition = function(name, properties) {
			if (_connected) {
				throw new Error("Cannot register condition. Plugin Provider is connected");
			}
			_conditions.push({name: name, properties: properties});
		};
		
		this.connect = function(callback, errback) {
			if (_connected) {
				if (callback) {
					callback();
				}
				return;
			}
	
			if (typeof(window) === "undefined") { //$NON-NLS-0$
				_target = self;
			} else if (window !== window.parent) {
				_target = window.parent;
			} else if (window.opener !== null) {
				_target = window.opener;
			} else {
				if (errback) {
					errback("No valid plugin target");
				}
				return;
			}
			addEventListener("message", _handleRequest, false); //$NON-NLS-0$
			var message = {
				method: "plugin", //$NON-NLS-0$
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
				removeEventListener("message", _handleRequest); //$NON-NLS-0$
				_target = null;
				_connected = false;
			}
			// Note: re-connecting is not currently supported
		};
	}
	return PluginProvider;
});