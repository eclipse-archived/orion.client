/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

/*global dojo*/
/*global OpenAjax*/
/*global document*/
/*global window*/

/**
 * @namespace The global container for eclipse APIs.
 */ 
var eclipse = eclipse || {};

eclipse.Plugin = function(url, data, internalRegistry) {
	var _self = this;
	
	var _container;
	var _deferredLoad = new dojo.Deferred();
	var _loaded = false;
	
	var _currentMessageId = 0;
	var _deferredResponses = {};
	var _serviceRegistrations = {};
		
	function _callService(serviceId, method, params, deferred) {
		if (!_container) {
			throw new Error("service container not ready");
		}
		var requestId = _currentMessageId++;
		_deferredResponses[String(requestId)] = deferred;
		var message = {
			id: requestId,
			serviceId: serviceId,
			method: method,
			params: params
		};
		internalRegistry.publish("request["+url+"]", message);
	}

	function _createServiceProxy(service) {
		var serviceProxy = {};
		if (service.methods) {
			for (var i = 0; i < service.methods.length; i++) {
				var method = service.methods[i];
				serviceProxy[method] = function(methodName) {
					return function() {
						var params = Array.prototype.slice.call(arguments);
						var d = new dojo.Deferred();
						_self._load().then( function() {
							_callService(service.serviceId, methodName, params, d);
						});
						return d.promise;
					};
				}(method);
			}
		}
		return serviceProxy;
	}
	
	function _parseData() {
		var services = data.services;
		if (services) {
			for(var i = 0; i < services.length; i++) {
				var service = services[i];
				var serviceProxy = _createServiceProxy(service);
				_serviceRegistrations[service.serviceId] = internalRegistry.registerService(service.type, serviceProxy, service.properties);
			}
		}	
	}
	
	function _responseHandler(topic, message) {
		try {
			if (topic === "onSecurityAlert") {
				if (message === "OpenAjax.hub.SecurityAlert.LoadTimeout") {
					_deferredLoad.reject(new Error("Load timeout for plugin: " + url));
				} else {
					console.log("Security Alert [" + url +"]: " + message);
				}
				return;
			}
			
			if (message.method) {
				if ("plugin" === message.method) {
					if (!data) {
						data = message.params[0];
						_parseData();
					}
					if (!_loaded) {
						_loaded = true;
						_deferredLoad.resolve(_self);
					}
				} else if ("dispatchEvent" === message.method){
					_serviceRegistrations[message.serviceId].dispatchEvent.apply(null, message.params);		
				} else {
					throw new Error("Bad response method: " + message.method);
				}		
			} else {
				var deferred = _deferredResponses[String(message.id)];
				delete _deferredResponses[String(message.id)];
				if (message.error) {
					deferred.reject(message.error);
				} else {
					deferred.resolve(message.result);
				}
			}
		} catch (e) {
			console.log(e);
		}
	}
	
	this.getLocation = function() {
		return url;
	};
	
	this.getData = function() {
		return data;
	};
	
	this.uninstall = function() {
		for (var serviceId in _serviceRegistrations) {
			if (_serviceRegistrations.hasOwnProperty(serviceId)) {
				_serviceRegistrations[serviceId].unregister();
				delete _serviceRegistrations[serviceId];
			}
		}
		if (_container) {
			internalRegistry.disconnect(_container);
		}
		internalRegistry.uninstallPlugin(this);
	};
	
	this.getServiceReferences = function() {
		var result = [];
		var serviceId;
		for (serviceId in _serviceRegistrations) {
			if (_serviceRegistrations.hasOwnProperty(serviceId)) {
				result.push(_serviceRegistrations[serviceId].getServiceReference());
			}
		}
		return result;
	};
	
	this._load = function() {
		if (!_container) {
			_container = internalRegistry.connect(url, _responseHandler);
		}
		return _deferredLoad.promise;
	};
	
	if (typeof url !== "string") {
		throw new Error("invalid url:" + url);
	}
	
	if (data) {
		_parseData();
	}
};

eclipse.PluginRegistry = function(serviceRegistry, opt_storage) {
	var _self = this;
	var _storage = opt_storage || localStorage || {};
	var _plugins = [];
	var _pluginEventTarget = new eclipse.EventTarget();
	
	// storage
	var _defaultPlugins = {};
	var _userPlugins;
	
	
	var _managedHub = new OpenAjax.hub.ManagedHub({
		log : function(message) {
			console.log(message);
		},
		onPublish : function(topic, data, publishContainer, subscribeContainer) {
			return true;
		},
		onSubscribe : function(topic, container) {
			return true;
		},
		onUnsubscribe : function(topic, container) {
			return true;
		},
		onSecurityAlert : function(source, alertType) {
			console.log(source + ":" + alertType );
		}
	});

	function _loadFromStorage() {
		var plugin,
			pluginURL,
			pluginData,
			key,
			defaults;
		
		//default
		defaults = _storage["/orion/preferences/default"] ? JSON.parse(_storage["/orion/preferences/default"]) : null;
		if (defaults && defaults["/plugins"]) {
			_defaultPlugins = defaults["/plugins"];
			for(pluginURL in _defaultPlugins) {
				if (_defaultPlugins.hasOwnProperty(pluginURL)) {
					pluginURL = _normalizeURL(pluginURL);
					key = "plugin." + pluginURL;
					if (_storage[key]) {
						pluginData = JSON.parse(_storage[key]);
						plugin = new eclipse.Plugin(pluginURL, pluginData, internalRegistry); 
						_plugins.push(plugin);
					} else {
						_self.installPlugin(pluginURL);
					}
				}
			}
		}
		
		//user
		_userPlugins = _storage["/orion/preferences/user/plugins"] ? JSON.parse(_storage["/orion/preferences/user/plugins"]) : null;
		if (!_userPlugins) {
			_userPlugins = {};
		}
		for(pluginURL in _userPlugins) {
			if (_userPlugins.hasOwnProperty(pluginURL)) {
				pluginURL = _normalizeURL(pluginURL);
				key = "plugin." + pluginURL;
				if (_storage[key]) {
					pluginData = JSON.parse(_storage[key]);
					plugin = new eclipse.Plugin(pluginURL, pluginData, internalRegistry); 
					_plugins.push(plugin);
				} else {
					_self.installPlugin(pluginURL);
				}
			}
		}
		
		
		
//		for (var i = 0; i < _storage.length; i++) {
//			var key = _storage.key(i);
//			if (key.indexOf("plugin.") === 0) {
//				var pluginURL = key.substring("plugin.".length);
//				var pluginData = JSON.parse(_storage[key]);
//				var plugin = new eclipse.Plugin(pluginURL, pluginData, internalRegistry); 
//				_plugins.push(plugin);
//			}
//		}	
	}
	
	function _persist(plugin) {
		var pluginURL;
		_storage["plugin."+plugin.getLocation()] = JSON.stringify(plugin.getData());
		for(pluginURL in _defaultPlugins) {
			if (_defaultPlugins.hasOwnProperty(pluginURL)) {
				if (plugin.getLocation() === _normalizeURL(pluginURL)) {
					return;
				}
			}
		}
		for(pluginURL in _userPlugins) {
			if (_userPlugins.hasOwnProperty(pluginURL)) {
				if (plugin.getLocation() === _normalizeURL(pluginURL)) {
					return;
				}
			}
		}
		_userPlugins[plugin.getLocation()] = true;
		_storage["/orion/preferences/user/plugins"] = JSON.stringify(_userPlugins);
	}

	function _clear(plugin) {
		var pluginURL;
		
		delete _storage["plugin."+plugin.getLocation()];
		for(pluginURL in _userPlugins) {
			if (_userPlugins.hasOwnProperty(pluginURL)) {
				if (plugin.getLocation() === _normalizeURL(pluginURL)) {
					delete _userPlugins[plugin.getLocation()];
					_storage["/orion/preferences/user/plugins"] = JSON.stringify(_userPlugins);
					return;
				}
			}
		}
	}
	
	function _normalizeURL(location) {
		if (location.indexOf("://") === -1) {
			var temp = document.createElement('a');
			temp.href = location;
	        return temp.href;
		}
		return location;
	}
	
	var internalRegistry = {
			registerService: dojo.hitch(serviceRegistry, serviceRegistry.registerService),
			connect: function(url, responseHandler) {
				return new OpenAjax.hub.IframeContainer(_managedHub, url, {
					Container : {
						log : function(message) {
							console.log(message);
						},
						onSecurityAlert : function(source, alertType) {
							responseHandler("onSecurityAlert", alertType);
						},
						onConnect : function(container) {
							_managedHub.subscribe("response[" + url + "]", responseHandler);
						},
						onDisconnect : function(container) {
							_managedHub.unsubscribe("response[" + url + "]");
						}
					},
					IframeContainer : {
						parent : document.body,
						iframeAttrs : {
							style : {
								display : "none"
							}
						},
						uri : url,
						tunnelURI : window.location.protocol + "//" + window.location.host + "/openajax/release/all/tunnel.html"
//						tunnelURI : window.location.protocol + "//" + window.location.host + "/openajax/src/containers/iframe/tunnel.html"					
					}
				});
			},
			disconnect: function(container) {
				_managedHub.removeContainer(container);
			},
			uninstallPlugin: function(plugin) {
				_clear(plugin);
				for (var i = 0; i < _plugins.length; i++) {
					if (plugin === _plugins[i]) {
						_plugins.splice(i,1);
						_pluginEventTarget.dispatchEvent("pluginRemoved", plugin);
						break;
					}
				}
			},
			publish: function(topic, message) {
				_managedHub.publish(topic, message);
			}
	};
	
	this.shutdown = function() {
		_managedHub.disconnect();
	};
	
	this.installPlugin = function(url, opt_data) {
		url = _normalizeURL(url);
		var d = new dojo.Deferred();
		var plugin;
		for (var i = 0; i < _plugins.length; i++) {
			if (url === _plugins[i].getLocation()) {
				plugin = _plugins[i];
				break;
			}
		}
		if (plugin) {
			if(plugin.getData()) {
				d.resolve(plugin);
			} else {
				var pluginTracker = function(plugin) {
					if (plugin.getLocation() === url) {
						d.resolve(plugin);
						_pluginEventTarget.removeEventListener("pluginAdded", pluginTracker);
					}
				};
				_pluginEventTarget.addEventListener("pluginAdded", pluginTracker);
			}
		} else {
			plugin = new eclipse.Plugin(url, opt_data, internalRegistry);
			_plugins.push(plugin);
			if(plugin.getData()) {
				_persist(plugin);
				_pluginEventTarget.dispatchEvent("pluginAdded", plugin);
				d.resolve(plugin);
			} else {		
				plugin._load().then(function() {
					_persist(plugin);
					_pluginEventTarget.dispatchEvent("pluginAdded", plugin);
					d.resolve(plugin);
				}, function(e) {
					d.reject(e);
				});
			}
		}
		return d.promise;	
	};
	
	this.getPlugins = function() {
		var result =[];
		for (var i = 0; i < _plugins.length; i++) {
			if (_plugins[i].getData()) {
				result.push(_plugins[i]);
			}
		}
		return result;
	};

	this.getPlugin = function(url) {
		url = _normalizeURL(url);
		for (var i = 0; i < _plugins.length; i++) {
			if (_plugins[i].getData() && url === _plugins[i].getLocation()) {
				return _plugins[i];
			}
		}
		return null;
	};
	
	// pluginAdded, pluginRemoved
	this.addEventListener = function(eventName, listener) {
		_pluginEventTarget.addEventListener(eventName, listener);
	};
	
	this.removeEventListener = function(eventName, listener) {
		_pluginEventTarget.removeEventListener(eventName, listener);
	};
	
	_loadFromStorage();
};