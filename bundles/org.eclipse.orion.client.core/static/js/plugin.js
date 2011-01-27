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
/**
 * @namespace The global container for eclipse APIs.
 */ 
var eclipse = eclipse || {};

/**
 * A Service Provider is an object that implements a Service Type
 * @class A Service Provider is an object that implements a Service Type
 */
eclipse.ServiceProvider = function() {
};

eclipse.ServiceProvider.prototype = {
	_initialize: function(plugin) {
		this._plugin = plugin;
	},
	
	dispatchEvent: function(eventType, eventData, serviceType, serviceId) {
		var event = {
			pluginURL: this.pluginURL,
			eventType: eventType,
			eventData: eventData,	
			serviceType: serviceType,
			serviceId: serviceId
		};
		this._plugin._hubClient.publish("orion.plugin.response", {type: "event", result: event, error: null});
	}
};

eclipse.ServiceProvider.extend = function(extender) {
	var serviceProvider = new eclipse.ServiceProvider();
	for (var name in extender) {
		serviceProvider[name] = extender[name];
	}
	return serviceProvider;
};

/**
 * A plugin is an object that is isolated in its own frame, and obtains and provides services
 * via the asynchronous postMessage mechanism.
 * @class A plugin is an object that is isolated in its own frame, and obtains and provides services
 * via the asynchronous postMessage mechanism.
 */
eclipse.Plugin = function(pluginData, service) {
	this._initialize(pluginData, service);
};

eclipse.Plugin.prototype = {
	_initialize: function(pluginData, service) {
		this.pluginURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
		this.pluginData = pluginData;
		if (service !== undefined) {
			this.service = service;
			if (service["_initialize"] !== undefined) {
				service._initialize(this);
			}
		}
	},
	
	start: function() {
		this._hubClient = new OpenAjax.hub.IframeHubClient({
	        HubClient: {
	          onSecurityAlert: function(source, alertType) {}
	        }
	    });
		var scope = this;
		this._hubClient.connect(function(hubClient, success, error) {
			if (success) {
				scope._hubClient.subscribe("orion.plugin.request["+scope.pluginURL+"]", scope._handlePluginRequest, scope);
				var result = {
					pluginURL: scope.pluginURL,
					pluginData: scope.pluginData
				};
				scope._hubClient.publish("orion.plugin.load", result);
			}
		});
	},
	
	stop: function() {
		this._hubClient.disconnect();
	},
	
	_handlePluginRequest: function(topic, request, subscriberData) {
		if (request.type === "metadata") {
			this._getMetadata(request);
		} else if (request.type === "service") {
			this._callService(request);
		}
	},
	
	_getMetadata: function(request) {
		var result = {
			pluginURL: this.pluginURL,
			pluginData: this.pluginData
		};
		this._hubClient.publish("orion.plugin.response", {type: "metadata", id: request.id, result: result, error: null});
	},
	
	_callService: function(request) {
		var method = request.msgData.method;
		var params = request.msgData.params;
		var result = null, error = null;
		try {
			if (this.service !== undefined) {
				if (typeof this.service[method] === "function") {
					result = this.service[method].apply(this, params); 
				}
			} else if (typeof this[method] === "function") {
				result = this[method].apply(this, params); 
			}
			if (result === null) {
				error = new Error("Unable to locate service method with name ["+method+"]");
			}
		} catch (e) {
			error = e;
		}
		this._hubClient.publish("orion.plugin.response", {type: "service", id: request.id, result: result, error: error});
	},
	
	dispatchEvent: function(eventType, eventData, serviceType, serviceId) {
		var event = {
			pluginURL: this.pluginURL,
			eventType: eventType,
			eventData: eventData,	
			serviceType: serviceType,
			serviceId: serviceId
		};
		this._hubClient.publish("org.eclipse.e4.plugin.PluginResponse", {type: "event", result: event, error: null});
	}
};
