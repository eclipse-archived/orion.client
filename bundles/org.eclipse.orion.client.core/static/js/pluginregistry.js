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
/*global eclipse */
/**
 * @namespace The global container for eclipse APIs.
 */ 
var eclipse = eclipse || {};

/**
 * A ServiceReference enables services to be called and released.
 * @class A ServiceReference enables services to be called and released.
 */
eclipse.Service0 = function(serviceReference, registry, onLoadCallback) {
	serviceReference._service = this;
	this._serviceReference = serviceReference;
	this._registry = registry;
	this._eventListeners = {};
	var pluginContainer = registry._managedHub.getContainer(serviceReference._pluginServiceProvider.pluginURL);
	if (pluginContainer !== null) {
		//console.debug("pluginContainer already exists for ["+serviceReference._pluginServiceProvider.pluginURL+"]");
		this._createProxies();
		onLoadCallback(this);
	} else {
		var scope = this;
		//console.debug("loading pluginContainer for ["+serviceReference._pluginServiceProvider.pluginURL+"]");
		registry.loadPlugin(serviceReference._pluginServiceProvider.pluginURL, function(plugin) {
			//console.debug("pluginContainer for ["+serviceReference._pluginServiceProvider.pluginURL+"] loaded");
			scope._createProxies();
			onLoadCallback(scope);
		});
	}
};

eclipse.Service0.prototype = {
	invoke: function(methodName, params, callback) {
		this._registry._sendPluginRequest("service", {method: methodName, params: params}, this._serviceReference._pluginServiceProvider.pluginURL, callback);
	},
	
	addEventListener: function(eventType, eventListener) {
		if (this._eventListeners[eventType] === undefined) {
			this._eventListeners[eventType] = [];
		}
		this._eventListeners[eventType].push(eventListener);
	},
	
	removeEventListener: function(eventType, eventListener) {
		if (this._eventListeners[eventType] !== undefined) {
			for (var i = 0; i < this._eventListeners[eventType].length; i++) {
				if (this._eventListeners[eventType][i] === eventListener) {
					this._eventListeners[eventType].splice(i, 1);
				}
			}
		}
	},
	
	_dispatchEvent: function(eventType, eventData) {
		if (this._eventListeners[eventType] !== undefined) {
			for (var i = 0; i < this._eventListeners[eventType].length; i++) {
				this._eventListeners[eventType][i]({type: eventType, data: eventData});
			}
		}
	},
	
	_createProxies: function() {
		if (this._serviceReference._serviceType.interfaces !== undefined) {
			var interfaces = this._serviceReference._serviceType.interfaces;
			for (var i = 0; i < interfaces.length; i++) {
				var scope = this;
				var methodName = interfaces[i]; 
				this[methodName] = function() {
					scope._registry._sendPluginRequest("service", {method: methodName, params: arguments[0]}, scope._serviceReference._serviceType.provider, arguments[1]);
				};
			}
		}
	}
};

/**
 * A ServiceReference enables services to be called and released.
 * @class A ServiceReference enables services to be called and released.
 */
eclipse.ServiceReference0 = function(serviceType, pluginServiceProvider, registry) {
	this._pluginServiceProvider = pluginServiceProvider;
	this._serviceType = serviceType;
	this._registry = registry;
	this._useCount = 0;
	this._pluginServiceProvider._serviceReferences[this._serviceType.id] = this;
};

eclipse.ServiceReference0.prototype = {
	_incrementUseCount: function() {
		this._useCount++;
	},	
	_decrementUseCount: function() {
		this._useCount--;
	},	
	_unget: function() {
		//console.debug("unget for service reference of type ["+this._serviceType.id+"] count = "+this._useCount);
		this._decrementUseCount();
		if (this._useCount < 1) {
			this._registry._cleanupServiceReference(this);
		}
	}
};

/**
 * The registry manages the set of available plugins.
 * @class The registry manages the set of available plugins.
 */
eclipse.PluginRegistry = function(serviceRegistry) {
	this._serviceRegistry = serviceRegistry;
	this._currentId = 0;
	this._msgCallbacks = {};
	this._plugins = {};
	this._eventListeners = {onPluginLoad: [], onPluginInstall: [], onPluginUninstall: []};
	this._loadPluginCallbacks = {};
	this._serviceTypes = {};
	
	this._managedHub = new OpenAjax.hub.ManagedHub({
		onPublish:       function(topic, data, publishContainer, subscribeContainer) { return true; },
        onSubscribe:     function(topic, container) { return true; },
        onUnsubscribe:   function(topic, container) { return true; },
        onSecurityAlert: function(source, alertType) {}
	});
};

eclipse.PluginRegistry.prototype = {
	start: function() {
		console.debug("registry.start()");
		this._loadFromStorage();
		this._managedHub.subscribe("orion.plugin.response", this._handlePluginResponse, this);
		this._managedHub.subscribe("orion.plugin.load", this._handlePluginLoad, this);
	},
	
	stop: function() {
		console.debug("registry.stop()");
		//this.clear();
	},
	
	clear: function() {
		console.debug("registry.clear()");
		var pluginKeys = [];
		for (var i = 0; i < localStorage.length; i++) {
			var key = localStorage.key(i);
			var index = key.search(/^orion.plugin./); 
			if (index != -1) {
				pluginKeys.push(key);
			}
		}
		for (i = 0; i < pluginKeys.length; i++) {
			console.debug("removing localstorage item ["+pluginKeys[i]+"]");
			localStorage.removeItem(pluginKeys[i]);
		}
		this._plugins = {};
	},
	
	addEventListener: function(eventType, eventListener) {
		if (eventType === "onPluginLoad") {
			this._eventListeners.onPluginLoad.push(eventListener);
		} else if (eventType === "onPluginInstall") {
			this._eventListeners.onPluginInstall.push(eventListener);
		} else if (eventType === "onPluginUninstall") {
			this._eventListeners.onPluginUninstall.push(eventListener);
		} else {
			throw new Error("Invalid event type ["+eventType+"]");
		}
	},
	
	loadPlugin: function(pluginURL, callback) {
		pluginURL = this._resolvePluginURL(pluginURL);
		var pluginContainer = this._managedHub.getContainer(pluginURL);
		if (pluginContainer === null) {
			if (callback !== undefined) {
				if (this._loadPluginCallbacks[pluginURL] === undefined) {
					this._loadPluginCallbacks[pluginURL] = [];
				}
				this._loadPluginCallbacks[pluginURL].push(callback);
			}
			console.debug("loading plugin url["+pluginURL+"]");
		    pluginContainer = new OpenAjax.hub.IframeContainer(this._managedHub, pluginURL, {
    			Container: {
    				onSecurityAlert: function(source, alertType) {},
    	            onConnect:       function(container) {},
    	            onDisconnect:    function(container) {}
    			},
    			IframeContainer: {
    				parent:  document.body, 
    	            iframeAttrs: { style: { display: "none" }},
    	            uri: pluginURL,
    	            tunnelURI : window.location.protocol + "//"+window.location.host+"/openajax/release/all/tunnel.html"
    			}
		    });
		} else {
			this._sendPluginRequest("metadata", {}, pluginURL, function(metadata) {
				callback(metadata);
			});
		}
	    return pluginContainer.getIframe();
	},
	
	installPlugin: function(pluginURL, pluginData) {
		pluginURL = this._resolvePluginURL(pluginURL);
		if (localStorage["orion.plugin."+pluginURL] !== undefined && localStorage["orion.plugin."+pluginURL] !== null) {
			throw new Error("Plugin ["+pluginURL+"] has already been installed");
		}
		console.debug("installing plugin url["+pluginURL+"]");
		if (pluginData !== undefined) {
			var metadata = {pluginURL: pluginURL, pluginData: pluginData};
			this._installPlugin(metadata, this);
		} else {
			var scope = this;
			this.loadPlugin(pluginURL, function(metadata){
				scope._installPlugin(metadata, scope);
			});
		}
	},
	
	uninstallPlugin: function(pluginURL) {
		pluginURL = this._resolvePluginURL(pluginURL);
		if (localStorage["orion.plugin."+pluginURL] !== undefined && localStorage["orion.plugin."+pluginURL] !== null) {
			delete this._plugins[pluginURL];
			localStorage.removeItem("orion.plugin."+pluginURL);
			var pluginContainer = this._managedHub.getContainer(pluginURL);
			if (pluginContainer !== null) {
				this._managedHub.removeContainer(pluginContainer);
			}
			for (var serviceType in this._serviceTypes) {
				if (this._serviceTypes[serviceType].provider === pluginURL) {
					delete this._serviceTypes[serviceType];
				}
			}
			for (var i = 0; i < this._eventListeners.onPluginUninstall.length; i++) {
				this._eventListeners.onPluginUninstall[i]({pluginURL: pluginURL});
			}
		} else {
			throw new Error("Plugin ["+pluginURL+"] is not currently installed");
		}
	},
	
	getPlugins: function() {
		return this._plugins;
	},
	
	getPlugin: function(pluginURL) {
		pluginURL = this._resolvePluginURL(pluginURL);
		if (this._plugins[pluginURL] !== undefined) {
			return this._plugins[pluginURL];
		} else {
			return null;
		}
	},
	callService: function(serviceType, methodName, callback, params) {
		var scope = this;
		var serviceReference = this.getServiceReference(serviceType);
		this.getService(serviceReference, function(service) {
			service.invoke(methodName, params, function(data) {
				callback(data);
				scope.ungetService(serviceReference);
			});
		});
	},

	getServiceReference: function(serviceTypeId) {
		if (this._serviceTypes[serviceTypeId] === undefined) {
			throw new Error("No service of type ["+serviceTypeId+"] is available");
		}
		var serviceType = this._serviceTypes[serviceTypeId];
		var pluginServiceProvider = this.getPlugin(serviceType.provider);
		if (pluginServiceProvider._serviceReferences === undefined) {
			//console.debug("creating serviceReferences");
			pluginServiceProvider._serviceReferences = {};
		}
		var serviceReference = pluginServiceProvider._serviceReferences[serviceTypeId];
		if (serviceReference === undefined) {
			//console.debug("creating service reference for ["+serviceType+"]");
			serviceReference = new eclipse.ServiceReference0(serviceType, pluginServiceProvider, this);
		}
		return serviceReference;
	},
	
	getService: function(serviceReference, loadedCallback) {
		var service = serviceReference._service;
		serviceReference._incrementUseCount();
		if (service === undefined) {
			//console.debug("creating service for ["+serviceReference._serviceType.id+"]");
			service = new eclipse.Service0(serviceReference, this, loadedCallback);
		} else {
			//console.debug("using existing service for ["+serviceReference._serviceType.id+"]");
			loadedCallback(service);
		}
		return service;
	},
	
	ungetService: function(serviceReference) {
		serviceReference._unget();
	},
	
	_installPlugin: function(metadata, scope) {
		console.debug("writing localstorage with key ["+"orion.plugin."+metadata.pluginURL+"]");
		localStorage["orion.plugin."+metadata.pluginURL] = JSON.stringify(metadata);
		scope._plugins[metadata.pluginURL] = metadata;
		if (metadata.pluginData.services !== undefined) {
			scope._loadServiceTypes(metadata.pluginURL, metadata.pluginData.services);
		}

		for (var i = 0; i < scope._eventListeners.onPluginInstall.length; i++) {
			scope._eventListeners.onPluginInstall[i]({pluginURL: metadata.pluginURL});
		}
	},
	
	_resolvePluginURL: function(pluginURL) {
		if (pluginURL.indexOf("://") == -1) {
			return window.location.protocol + "//"+window.location.host + pluginURL; 
		} else {
			return pluginURL;
		}
	}, 
	
	_handlePluginResponse: function(topic, msg, subscriberData) {
		switch (msg.type) { 
			case "service" :
			case "metadata": {
				var callback = this._msgCallbacks[String(msg.id)];
				delete this._msgCallbacks[String(msg.id)];
				callback(msg.result);
				break;
			}
			case "event" : {
				var pluginServiceProvider = this.getPlugin(msg.result.pluginURL);
				if (pluginServiceProvider === null) {
					throw new Error("Unable to locate plugin service provider identified by ["+msg.result.pluginURL+"]");
				}
				var serviceReference = pluginServiceProvider._serviceReferences[msg.result.serviceType];
				if (serviceReference === undefined) {
					throw new Error("Unable to locate service reference in provider identified by ["+msg.result.pluginURL+"] type ["+msg.result.serviceType+"]");
				}
				serviceReference._service._dispatchEvent(msg.result.eventType, msg.result.eventData);
				break;
			}
		}
	},
	
	_handlePluginLoad: function(topic, result, subscriberData) {
		console.debug("_handlePluginLoad ["+result.pluginURL+"]");
		for (var i = 0; i < this._eventListeners.onPluginLoad.length; i++) {
			this._eventListeners.onPluginLoad[i](result);
		}
		if (this._loadPluginCallbacks[result.pluginURL] !== undefined) {
			var callbacks = this._loadPluginCallbacks[result.pluginURL];
			for (var i = 0; i < callbacks.length; i++) {
				callbacks[i](result);
			}
			delete this._loadPluginCallbacks[result.pluginURL];
		}
	},
	
	_loadFromStorage: function() {
		for (var i = 0; i < localStorage.length; i++) {
			var storageKey = localStorage.key(i);
			var index = storageKey.search(/^orion.plugin./); 
			if (index != -1) {
				try {
					var pluginURL = storageKey.substring(index+"orion.plugin.".length);
					var pluginDataString = localStorage[localStorage.key(i)];
					this._plugins[pluginURL] = JSON.parse(pluginDataString);
					if (this._plugins[pluginURL].pluginData.services !== undefined) {
						this._loadServiceTypes(pluginURL, this._plugins[pluginURL].pluginData.services);
					}
				} catch (exc) {
					console.debug("unable to parse plugin string ["+pluginDataString+"] : "+exc);
				}
			}
		}
	},
	
	_sendPluginRequest: function(type, msgData, pluginURL, callback) {
		var pluginContainer = this._managedHub.getContainer(pluginURL);
		if (pluginContainer !== null) {
			var requestId = ++this._currentId;
			this._msgCallbacks[String(requestId)] = callback;
			var msg = {
				id: requestId,
				type: type,
				msgData: msgData
			};
			this._managedHub.publish("orion.plugin.request["+pluginURL+"]", msg);
		} else {
			throw new Error("Unable to locate plugin container for ["+pluginURL+"]");
		}
	},
	
	_cleanupServiceReference: function(serviceReference) {
		//console.debug("deleting service reference for ["+serviceReference._serviceType.id+"]");
		delete serviceReference._pluginServiceProvider._serviceReferences[serviceReference._serviceType.id];
		var count = 0;
		for (var p in serviceReference._pluginServiceProvider._serviceReferences) { 
			count++;
		}
		//console.debug("pluginServiceProvider ["+serviceReference._pluginServiceProvider.pluginURL+"] has "+count+" service references");
		if (count < 1) {
			var pluginContainer = this._managedHub.getContainer(serviceReference._pluginServiceProvider.pluginURL);
			if (pluginContainer !== null) {
				//console.debug("removing container for ["+serviceReference._pluginServiceProvider.pluginURL+"]");
				this._managedHub.removeContainer(pluginContainer);
			}
		}
	},
	
	_loadServiceTypes: function(pluginURL, services) {
		for (var i = 0; i < services.length; i++) {
			var serviceType = services[i].serviceType;
			serviceType.provider = pluginURL;
			this._serviceTypes[serviceType.id] = serviceType;
			this._serviceRegistry.registerService(serviceType.id, this._createServiceProxy(serviceType));
		}
	},
	_createServiceProxy: function(serviceType) {
		var serviceProxy = {};
		var boundCallService = dojo.hitch(this, this.callService);
		if (serviceType.interfaces) {
			for (var i = 0; i < serviceType.interfaces.length; i++) {
				var method = serviceType.interfaces[i];
				serviceProxy[method] = function() {
					var d = new dojo.Deferred();
					boundCallService(serviceType.id, method, dojo.hitch(d, d.resolve), Array.prototype.slice.call(arguments));
					return d.promise;
				};
			}
		}
		return serviceProxy;
	}
};

