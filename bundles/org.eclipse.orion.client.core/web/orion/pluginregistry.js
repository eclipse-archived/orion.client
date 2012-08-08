/*******************************************************************************
 * @license
 * Copyright (c) 2010-2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

/*global define setTimeout clearTimeout addEventListener document console localStorage Worker*/

define(["orion/Deferred", "orion/serviceregistry", "orion/EventTarget", "orion/es5shim"], function(Deferred, mServiceregistry, EventTarget){
	var INSTALLED = 1;
	var LOADED = 2;
	var UNINSTALLED = 3;
	/**
	 * Creates a new plugin. This constructor is private and should only be called by the plugin registry.
	 * @class Represents a single plugin in the plugin registry.
	 * @description
	 * <p>A plugin can be in one of three states:</p>
	 * <dl>
	 * <dt>{@link orion.pluginregistry.Plugin.INSTALLED}</dt>
	 * <dd>The plugin is not running, and is present in the plugin registry.
	 * <p>From the <code>INSTALLED</code> state, the plugin will become <code>LOADED</code> if a service method provided by one
	 * of the plugin's service references is called through the service registry.</p>
	 * </dd>
	 *
	 * <dt>{@link orion.pluginregistry.Plugin.LOADED}</dt>
	 * <dd>The plugin is running, and is present in the plugin registry.
	 * <p>From the <code>LOADED</code> state, the plugin will become <code>UNINSTALLED</code> if its {@link #uninstall} method
	 * is called.</p>
	 * </dd>
	 *
	 * <dt>{@link orion.pluginregistry.Plugin.UNINSTALLED}</dt>
	 * <dd>The plugin is not running, and has been removed from the plugin registry.
	 * <p>Any services formerly provided by the plugin have been unregistered and cannot be called. Although uninstalled plugins
	 * do not appear in the plugin registry, they can be observed if references to a Plugin instance are kept after its
	 * {@link #uninstall} method has been called.
	 * <p>From the <code>UNINSTALLED</code> state, the plugin cannot change to any other state.</p>
	 * </dd>
	 * @name orion.pluginregistry.Plugin
	 */
	function Plugin(url, data, internalRegistry) {
		var _self = this;
		
		var _channel = null;
		var _deferredLoad = new Deferred();
		var _deferredUpdate = null;
		var _state = 0;
		
		var _currentMessageId = 0;
		var _deferredResponses = {};
		var _services = {};
		
		function _callService(serviceId, method, params) {
			if (!_channel) {
				throw new Error("plugin not connected");
			}
			var requestId = _currentMessageId++;
			var d = new Deferred();
			_deferredResponses[String(requestId)] = d;
			var message = {
				id: requestId,
				serviceId: serviceId,
				method: method,
				params: params
			};
			internalRegistry.postMessage(message, _channel);
			return d.promise;
		}
	
		function _createServiceProxy(service) {
			var serviceProxy = {};
			if (service.methods) {
				service.methods.forEach(function(method) {
					serviceProxy[method] = function() {
						var params = Array.prototype.slice.call(arguments);
						if (_state === LOADED) {
							return _callService(service.serviceId, method, params);
						} else {
							return _self._load().then(function() {
								return _callService(service.serviceId, method, params);
							});
						}
					};
				});
				
				if (serviceProxy.addEventListener && serviceProxy.removeEventListener) {
					var eventTarget = new EventTarget();
					serviceProxy.dispatchEvent = eventTarget.dispatchEvent.bind(eventTarget);
					var _addEventListener = serviceProxy.addEventListener;
					serviceProxy.addEventListener = function(type, listener) {
						if (!eventTarget._namedlisteners[type]) {
							_addEventListener(type);
						}
						eventTarget.addEventListener(type, listener);
					};
					var _removeEventListener = serviceProxy.removeEventListener;
					serviceProxy.removeEventListener = function(type, listener) {
						eventTarget.removeEventListener(type, listener);
						if (eventTarget._namedlisteners[type]) {
							_removeEventListener(type);
						}
					};
				}
			}
			return serviceProxy;
		}
		
		function _setState(state) {
			_state = state;
			switch (state) {
				case UNINSTALLED:
					internalRegistry.dispatchEvent("pluginUninstalled", _self); //$NON-NLS-0$
					break;
				case INSTALLED:
					internalRegistry.dispatchEvent("pluginInstalled", _self); //$NON-NLS-0$
					break;
				case LOADED:
					internalRegistry.dispatchEvent("pluginLoaded", _self); //$NON-NLS-0$
					break;
			}
		}
	
		function checkNotUninstalled() {
			if (_state === UNINSTALLED) {
				throw new Error("Plugin is uninstalled");
			}
		}
	
		function _parseData() {
			var services = data.services;
			if (services) {
				services.forEach(function(service) {
					var serviceProxy = _createServiceProxy(service);
					var properties = service.properties ? JSON.parse(JSON.stringify(service.properties)) : {};
					properties.__plugin__ = _self.getLocation();
					var registration = internalRegistry.registerService(service.names || service.type, serviceProxy, properties);
					_services[service.serviceId] = {registration: registration, proxy: serviceProxy};
				});
			}
			if (!data._lastModified) {
				data._lastModified = new Date().getTime();
			}
		}
		
		function _checkForUpdate(newData) {
			if (data.headers && newData.headers) {
				if (JSON.stringify(data.headers) !== JSON.stringify(newData.headers)) {
					return true;
				}
			} else if (data.headers || newData.headers) {
				return true;
			}
			
			if (data.services && newData.services) {
				if (JSON.stringify(data.services) !== JSON.stringify(newData.services)) {
					return true;
				}
			} else if (data.services || newData.services) {
				return true;
			}
			return false;
		}
		
		function _responseHandler(message) {
			var deferred;
			try {
				if (message.method) {
					if ("plugin" === message.method) { //$NON-NLS-0$
						if (!data) {
							data = message.params[0];
							_parseData();
						} else if (_checkForUpdate(message.params[0])) {
							// check if the data has been updated
							for (var serviceId in _services) {
								if (_services.hasOwnProperty(serviceId)) {
									_services[serviceId].registration.unregister();
									delete _services[serviceId];
								}
							}
							data = {};
							if (message.params[0].headers) {
								data.headers = message.params[0].headers;
							}
							if (message.params[0].services) {
								data.services = message.params[0].services;
							}
							_parseData();
							internalRegistry.updatePlugin(_self);						
						}
						
						if (_state === INSTALLED) {
							_setState(LOADED);
							_deferredLoad.resolve(_self);
						}
						
						if (_deferredUpdate) {
							_deferredUpdate.resolve(_self);
							_deferredUpdate = null;
						}
					} else if ("dispatchEvent" === message.method){ //$NON-NLS-0$
						var proxy = _services[message.serviceId].proxy;
						proxy.dispatchEvent.apply(proxy, message.params);		
					} else if ("progress" === message.method){ //$NON-NLS-0$
						deferred = _deferredResponses[String(message.requestId)];
						deferred.update.apply(deferred, message.params);	
					} else if ("timeout"){
						if (_state === INSTALLED) {
							_deferredLoad.reject(new Error("Load timeout for plugin: " + url));
						}
						
						if (_deferredUpdate) {
							_deferredUpdate.reject(new Error("Load timeout for plugin: " + url));
							_deferredUpdate = null;
						}
					} else {
						throw new Error("Bad response method: " + message.method);
					}		
				} else {
					deferred = _deferredResponses[String(message.id)];
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
		
		this._getData = function() {
			return data;
		};
	
		/**
		 * Returns the URL location of this plugin
		 * @name orion.pluginregistry.Plugin#getLocation
		 * @return {String} The URL of this plugin
		 * @function
		 */
		this.getLocation = function() {
			return url;
		};
		
		/**
		 * Returns the headers of this plugin
		 * @name orion.pluginregistry.Plugin#getHeaders
		 * @return {Object} The plugin headers
		 * @function
		 */
		this.getHeaders = function(falsy) {
			var noData = falsy ? null : {};
			return data && data.headers ? data.headers : noData;
		};
		
		this.getName = function() {
			return this.getHeaders()["plugin.name"] || this.getLocation();
		};
		
		this.getVersion = function() {
			return this.getHeaders()["plugin.version"] || "0.0.0";
		};
		
		this.getLastModified = function() {
			return data && data._lastModified ? data._lastModified : 0;
		};
		
		/**
		 * Uninstalls this plugin
		 * @name orion.pluginregistry.Plugin#uninstall
		 * @function
		 */
		this.uninstall = function() {
			checkNotUninstalled();
			for (var serviceId in _services) {
				if (_services.hasOwnProperty(serviceId)) {
					_services[serviceId].registration.unregister();
					delete _services[serviceId];
				}
			}
			if (_channel) {
				internalRegistry.disconnect(_channel);
				_channel = null;
			}
			internalRegistry.uninstallPlugin(this);
			_setState(UNINSTALLED);
		};
		
		/**
		 * Returns the service references provided by this plugin
		 * @name orion.pluginregistry.Plugin#getServiceReferences
		 * @return {orion.serviceregistry.ServiceReference} The service references provided
		 * by this plugin.
		 * @function 
		 */
		this.getServiceReferences = function() {
			var result = [];
			var serviceId;
			for (serviceId in _services) {
				if (_services.hasOwnProperty(serviceId)) {
					result.push(_services[serviceId].registration.getServiceReference());
				}
			}
			return result;
		};
		
		this.update = function() {
			checkNotUninstalled();
			if (_state === INSTALLED) {
				return this._load();
			}
			
			var updatePromise;
			if (_deferredUpdate === null) {
				_deferredUpdate = new Deferred();
				updatePromise = _deferredUpdate;
				internalRegistry.disconnect(_channel);
				_channel = internalRegistry.connect(url, _responseHandler);
			}
			return _deferredUpdate.promise;
		};
		
		/**
		 * Returns this plugin's current state.
		 * @name orion.pluginregistry.Plugin#getState
		 * @returns {Number} This plugin's state. The value is one of:
		 * <ul>
		 * <li>{@link orion.pluginregistry.Plugin.INSTALLED}</li>
		 * <li>{@link orion.pluginregistry.Plugin.LOADED}</li>
		 * <li>{@link orion.pluginregistry.Plugin.UNINSTALLED}</li>
		 * </ul>
		 * @function
		 */
		this.getState = function() {
			return _state;
		};
	
		this._load = function(isInstall, optTimeout) {
			checkNotUninstalled();
			if (!_channel) {
				_channel = internalRegistry.connect(url, _responseHandler, optTimeout);
				_deferredLoad.then(null, function() {
					if (!isInstall) {
						data = {};
						internalRegistry.updatePlugin(_self);
					}
				});
			}
			return _deferredLoad.promise;
		};
		
		if (typeof url !== "string") { //$NON-NLS-0$
			throw new Error("invalid url:" + url); //$NON-NLS-0$
		}
		
		if (data) {
			_parseData();
		}
		_setState(INSTALLED);
	}
	
	/**
	 * State constant for the <code>INSTALLED</code> state.
	 * @name orion.pluginregistry.Plugin.INSTALLED
	 * @static
	 * @constant
	 * @type Number
	 */
	Plugin.INSTALLED = INSTALLED;
	/**
	 * State constant for the <code>LOADED</code> state.
	 * @name orion.pluginregistry.Plugin.LOADED
	 * @static
	 * @constant
	 * @type Number
	 */
	Plugin.LOADED = LOADED;
	/**
	 * State constant for the <code>UNINSTALLED</code> state.
	 * @name orion.pluginregistry.Plugin.UNINSTALLED
	 * @static
	 * @constant
	 * @type Number
	 */
	Plugin.UNINSTALLED = UNINSTALLED;
	
	/**
	 * Dispatched when a plugin has been installed. The type of this event is <code>'pluginInstalled'</code>.
	 * @name orion.pluginregistry.PluginRegistry#pluginInstalled
	 * @event
	 * @param {orion.pluginregistry.Plugin} plugin The plugin that was installed.
	 */
	/**
	 * Dispatched when a plugin has been loaded. The type of this event is <code>'pluginLoaded'</code>.
	 * @name orion.pluginregistry.PluginRegistry#pluginLoaded
	 * @event
	 * @param {orion.pluginregistry.Plugin} plugin The plugin that was loaded.
	 */
	/**
	 * Dispatched when a plugin has been uninstalled. The type of this event is <code>'pluginUninstalled'</code>.
	 * @name orion.pluginregistry.PluginRegistry#pluginUninstalled
	 * @event
	 * @param {orion.pluginregistry.Plugin} plugin The plugin that was uninstalled.
	 */
	/**
	 * Dispatched when a plugin has been updated. The type of this event is <code>'pluginUpdated'</code>.
	 * @name orion.pluginregistry.PluginRegistry#pluginUpdated
	 * @event
	 * @param {orion.pluginregistry.Plugin} plugin The plugin that was updated.
	 */
	
	/**
	 * Creates a new plugin registry.
	 * @class The Orion plugin registry
	 * @name orion.pluginregistry.PluginRegistry
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry The service registry to register plugin-provided services with.
	 * @param {Object} [opt_storage=localStorage] Target object to read and write plugin metadata from.
	 * @param {Boolean} [opt_visible=false] Whether a loaded plugin's iframe will be displayed. By default it is not displayed.
	 * @borrows orion.serviceregistry.EventTarget#addEventListener as #addEventListener
	 * @borrows orion.serviceregistry.EventTarget#removeEventListener as #removeEventListener
	 */
	function PluginRegistry(serviceRegistry, opt_storage, opt_visible) {
		var _storage = opt_storage || localStorage || {};
		var _plugins = [];
		var _channels = [];
		var _pluginEventTarget = new EventTarget();
	
		addEventListener("message", function(event) { //$NON-NLS-0$
			var source = event.source;
			_channels.some(function(channel){
				if (source === channel.target) {
					if (typeof channel.useStructuredClone === "undefined") { //$NON-NLS-0$
						channel.useStructuredClone = typeof event.data !== "string"; //$NON-NLS-0$
					}
					channel.handler(channel.useStructuredClone ? event.data : JSON.parse(event.data));
					return true; // e.g. break
				}
			});
		}, false);
		
		function _normalizeURL(location) {
			if (location.indexOf("://") === -1) { //$NON-NLS-0$
				var temp = document.createElement('a'); //$NON-NLS-0$
				temp.href = location;
		        return temp.href;
			}
			return location;
		}
		
		function _clear(plugin) {
			delete _storage["plugin."+plugin.getLocation()]; //$NON-NLS-0$
		}
		
		function _persist(plugin) {
			var expiresSeconds = 60 * 60;
			plugin._getData()._expires = new Date().getTime() + 1000 * expiresSeconds;
			_storage["plugin."+plugin.getLocation()] = JSON.stringify(plugin._getData()); //$NON-NLS-0$
		}
	
		var internalRegistry = {
				registerService: serviceRegistry.registerService.bind(serviceRegistry),
				connect: function(url, handler, timeout) {
					var channel = {
						handler: handler,
						url: url
					};
					
					function sendTimeout() {
						handler({method:"timeout"});
					}
					
					var loadTimeout = setTimeout(sendTimeout, timeout || 15000);
					
					if (url.match(/\.js$/) && typeof(Worker) !== "undefined") { //$NON-NLS-0$
						var worker = new Worker(url);
						worker.onmessage = function(event) {
								if (typeof channel.useStructuredClone === "undefined") { //$NON-NLS-0$
									channel.useStructuredClone = typeof event.data !== "string"; //$NON-NLS-0$
								}
								channel.handler(channel.useStructuredClone ? event.data : JSON.parse(event.data));
						};
						channel.target = worker;
						channel.close = function() {
							worker.terminate();
						};
					} else {
						var iframe = document.createElement("iframe"); //$NON-NLS-0$
						iframe.id = url;
						iframe.name = url;
						if (!opt_visible) {
							iframe.style.display = "none"; //$NON-NLS-0$
							iframe.style.visibility = "hidden"; //$NON-NLS-0$
						}
						iframe.src = url;
						iframe.onload = function() {
							clearTimeout(loadTimeout);
							setTimeout(sendTimeout, 5000);
						};
						iframe.sandbox = "allow-scripts allow-same-origin";
						document.body.appendChild(iframe);
						channel.target = iframe.contentWindow;
						channel.close = function() {
							if (iframe) {
								document.body.removeChild(iframe);
								iframe = null;
							}
						};
					}
					_channels.push(channel);
					return channel;
				},
				disconnect: function(channel) {
					for (var i = 0; i < _channels.length; i++) {
						if (channel === _channels[i]) {
							_channels.splice(i,1);
							try {
								channel.close();
							} catch(e) {
								// best effort
							}
							break;
						}
					}
				},
				uninstallPlugin: function(plugin) {
					_clear(plugin);
					for (var i = 0; i < _plugins.length; i++) {
						if (plugin === _plugins[i]) {
							_plugins.splice(i,1);
							break;
						}
					}
				},
				updatePlugin: function(plugin) {
					_persist(plugin);
					_pluginEventTarget.dispatchEvent("pluginUpdated", plugin); //$NON-NLS-0$
				},
				postMessage: function(message, channel) {
					channel.target.postMessage((channel.useStructuredClone ? message : JSON.stringify(message)), channel.url);
				},
				dispatchEvent: function(type, plugin) {
					try {
						_pluginEventTarget.dispatchEvent(type, plugin);
					} catch (e) {
						if (console) {
							console.log(e);
						}
					}
				}
		};
		
		function _getPlugin(url) {
			var result = null;
			url = _normalizeURL(url);
			_plugins.some(function(plugin){
				if (url === plugin.getLocation()) {
					result = plugin;
					return true;
				}
			});
			return result;
		}
		
		/**
		 * Starts the plugin registry
		 * @name orion.pluginregistry.PluginRegistry#startup
		 * @return A promise that will resolve when the registry has been fully started
		 * @function 
		 */
		this.startup = function(pluginURLs) {	
			var installList = [];
			pluginURLs.forEach(function(pluginURL) {
				pluginURL = _normalizeURL(pluginURL);
				var key = "plugin." + pluginURL; //$NON-NLS-0$
				var pluginData = _storage[key] ? JSON.parse(_storage[key]) : null;
				if (pluginData && pluginData._expires && pluginData._expires > new Date().getTime()) {
					if (_getPlugin(pluginURL) === null) {
						_plugins.push(new Plugin(pluginURL, pluginData, internalRegistry));
					}
				} else {
					_storage[key] ="{}"; //$NON-NLS-0$
					var plugin = new Plugin(pluginURL, {}, internalRegistry); 
					_plugins.push(plugin);
					installList.push(plugin._load(false, 5000)); // _load(false) because we want to ensure the plugin is updated
				}
			});
			return Deferred.all(installList, function(){});
		};
		
		/**
		 * Shuts down the plugin registry
		 * @name orion.pluginregistry.PluginRegistry#shutdown
		 * @function 
		 */
		this.shutdown = function() {
			_channels.forEach(function(channel) {
				try {
					channel.close();
				} catch(e) {
					// best effort
				}
			});
		};
		
		/**
		 * Installs the plugin at the given location into the plugin registry
		 * @name orion.pluginregistry.PluginRegistry#installPlugin
		 * @param {String} url The location of the plugin
		 * @param {Object} [opt_data] The plugin metadata
		 * @returns A promise that will resolve when the plugin has been installed.
		 * @function 
		 */
		this.installPlugin = function(url, opt_data) {
			url = _normalizeURL(url);
			var d = new Deferred();
			var plugin = _getPlugin(url);
			if (plugin) {
				if(plugin.getHeaders(true)) {
					d.resolve(plugin);
				} else {
					var pluginTracker = function(plugin) {
						if (plugin.getLocation() === url) {
							d.resolve(plugin);
							_pluginEventTarget.removeEventListener("pluginLoaded", pluginTracker); //$NON-NLS-0$
						}
					};
					_pluginEventTarget.addEventListener("pluginLoaded", pluginTracker); //$NON-NLS-0$
				}
			} else {
				plugin = new Plugin(url, opt_data, internalRegistry);
				_plugins.push(plugin);
				if(plugin.getHeaders(true)) {
					_persist(plugin);
					d.resolve(plugin);
				} else {				
					plugin._load(true).then(function() {
						_persist(plugin);
						d.resolve(plugin);
					}, function(e) {
						d.reject(e);
					});
				}
			}
			return d.promise;	
		};
		
		/**
		 * Returns all installed plugins
		 * @name orion.pluginregistry.PluginRegistry#getPlugins
		 * @return {orion.pluginregistry.Plugin[]} An array of all installed plugins.
		 * @function 
		 */
		this.getPlugins = function() {
			var result =[];
			_plugins.forEach(function(plugin) {
				if (plugin.getHeaders(true)) {
					result.push(plugin);
				}
			});
			return result;
		};
	
		/**
		 * Returns the installed plugin with the given URL.
		 * @name orion.pluginregistry.PluginRegistry#getPlugin
		 * @return {orion.pluginregistry.Plugin} The installed plugin matching the given URL, or <code>null</code>
		 * if no such plugin is installed.
		 * @function 
		 */
		this.getPlugin = function(url) {
			var plugin = _getPlugin(url);
			if (plugin && plugin.getHeaders(true)) {
				return plugin;
			}
			return null;
		};
		
		this.addEventListener = function(eventName, listener) {
			_pluginEventTarget.addEventListener(eventName, listener);
		};
		
		this.removeEventListener = function(eventName, listener) {
			_pluginEventTarget.removeEventListener(eventName, listener);
		};
	}
	return {
		Plugin: Plugin, 
		PluginRegistry: PluginRegistry
	};
});