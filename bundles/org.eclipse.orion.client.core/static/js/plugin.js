/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
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

eclipse.PluginProvider = function() {
	var _hubClient = null;
	
	var _services = [];
	var _connected = false;

	function _publish(message) {
		_hubClient.publish("response["+_hubClient.getClientID()+"]", message);
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
		return {services: services};		
	}
	
	function _handleRequest(topic, message) {
		try {
			var serviceId = message.serviceId;
			var service = _services[serviceId].implementation;
			var method = service[message.method];
			
			var response = {id: message.id, result: null, err: null};
			var promiseOrResult = method.apply(service, message.params);
			if(promiseOrResult && typeof promiseOrResult.then === "function"){
				promiseOrResult.then(function(result) {
					response.result = result;
					_publish(message);
				}, function(error) {
					response.error = error;
					_publish(message);
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
		
		var method;
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
		if (_hubClient) {
			if (callback) {
				callback();
			}
			return;
		}
		
		_hubClient = new OpenAjax.hub.IframeHubClient({
	        HubClient: {
	          onSecurityAlert: function(source, alertType) {
	        	  console.log(source + ":" + alertType );
	          }
	        }
		});
		_hubClient.connect(function(hubClient, success, error) {
			if (success) {
				_hubClient.subscribe("request["+_hubClient.getClientID()+"]", _handleRequest);
				var message = {
					method: "plugin",
					params: [_getPluginData()]
				};
				_publish(message);
				_connected = true;
				if (callback) {
					callback();
				}
			} else {
				if (errback) {
					errback(error);
				}
			}
		});
	};
	
	this.disconnect = function() {
		if (_hubClient) { 
			var doomed = _hubClient; 
			_hubClient = null;
			doomed.disconnect( function() {
				_connected = false;
			});
		}
	};
};