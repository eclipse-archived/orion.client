/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd, node*/
/* eslint-disable missing-nls */
(function(root, factory) { // UMD
    if (typeof define === "function" && define.amd) {
        define(["orion/Deferred"], factory);
    } else if (typeof exports === "object") {
        module.exports = factory(require("orion/Deferred"));
    } else {
        root.orion = root.orion || {};
        root.orion.PluginProvider = factory(root.orion.Deferred);
    }
}(this, function(Deferred) {
    function ObjectReference(objectId, methods) {
        this.__objectId = objectId;
        this.__methods = methods;
    }
    
    function PluginProvider(headers) {
        var _headers = headers;
        var _connected = false;

        var _currentMessageId = 0;
        var _currentObjectId = 0;
        var _currentServiceId = 0;

        var _requestReferences = {};
        var _responseReferences = {};
        var _objectReferences = {};
        var _serviceReferences = {};
        
        var _ports = [];
        var _shared = false;
        
        var _target = null;
        if (typeof(window) === "undefined") {
            if (self.postMessage) {
                _target = self;
            } else {
                _shared = true;
            }
        } else if (window !== window.parent) {
            _target = window.parent;
        } else if (window.opener !== null) {
            _target = window.opener;
        }        

        function _publish(message, target) {
            target = target || _target;
            if (target) {
                if (typeof(ArrayBuffer) === "undefined") {
                    message = JSON.stringify(message);
                }
                if (target === self || _shared) {
                    target.postMessage(message);
                } else {
                    target.postMessage(message, "*");
                }
            }
        }
        var _notify = _publish;
        var _errHandler = function(evt){
        	_publish({method: "error", error: _serializeError(evt.error)});
        };
        addEventListener("error", _errHandler);
        
        var lastHeartbeat;
        var startTime = new Date().getTime();
        function log(state) {
            if (typeof(localStorage) !== "undefined" && localStorage.pluginLogging) {
            	console.log(state + "(" + (new Date().getTime() - startTime) + "ms)=" + self.location);
        	}
        }
        function heartbeat() {
            var time = new Date().getTime();
            // This timeout depends on the handshake timeout of the plugin registry. Update both accordingly.
            if (lastHeartbeat  && time - lastHeartbeat < 4000) return;
            lastHeartbeat = time;
            _publish({
                method: "loading"
            });
            log("heartbeat");
        }
        heartbeat();

        if (_shared) {
            self.addEventListener("connect", function(evt) {
                var port = evt.ports[0];
                _ports.push(port);
                if (_connected) {
                    var message = {
                        method: "plugin",
                        params: [_getPluginData()]
                    };
                    _publish(message, port);
                } else {
                    heartbeat();
                }
                port.addEventListener("message",  function(evt) {
                	_handleMessage(evt, port);
                });
                port.start();
            });
        }

        function _getPluginData() {
            var services = [];
            // we filter out the service implementation from the data
            Object.keys(_serviceReferences).forEach(function(serviceId) {
                var serviceReference = _serviceReferences[serviceId];
                services.push({
                    serviceId: serviceId,
                    names: serviceReference.names,
                    methods: serviceReference.methods,
                    properties: serviceReference.properties
                });
            });
            return {
                headers: _headers || {},
                services: services
            };
        }

        function _jsonXMLHttpRequestReplacer(name, value) {
            if (value && value instanceof XMLHttpRequest) {
                var status, statusText;
                try {
                    status = value.status;
                    statusText = value.statusText;
                } catch (e) {
                    // https://bugs.webkit.org/show_bug.cgi?id=45994
                    status = 0;
                    statusText = ""; //$NON-NLS-0
                }
                return {
                    status: status || 0,
                    statusText: statusText
                };
            }
            return value;
        }

        function _serializeError(error) {
            var result = error ? JSON.parse(JSON.stringify(error, _jsonXMLHttpRequestReplacer)) : error; // sanitizing Error object
            if (error instanceof Error) {
                result.__isError = true;
                result.message = result.message || error.message;
                result.name = result.name || error.name;
            }
            return result;
        }

        function _request(message, target) {
            target = target || _target;
            if (!target) {
                return new Deferred().reject(new Error("plugin not connected"));
            }

            message.id = String(_currentMessageId++);
            var d = new Deferred();
            _responseReferences[message.id] = d;
            d.then(null, function(error) {
                if (_connected && error instanceof Error && error.name === "Cancel") {
                    _notify({
                        requestId: message.id,
                        method: "cancel",
                        params: error.message ? [error.message] : []
                    }, target);
                }
            });

            var toString = Object.prototype.toString;
            message.params.forEach(function(param, i) {
                if (toString.call(param) === "[object Object]" && !(param instanceof ObjectReference)) {
                    var candidate, methods;
                    for (candidate in param) {
                        if (toString.call(param[candidate]) === "[object Function]") {
                            methods = methods || [];
                            methods.push(candidate);
                        }
                    }
                    if (methods) {
                        var objectId = _currentObjectId++;
                        _objectReferences[objectId] = param;
                        var removeReference = function() {
                            delete _objectReferences[objectId];
                        };
                        d.then(removeReference, removeReference);
                        message.params[i] = new ObjectReference(objectId, methods);
                    }
                }
            });
            _notify(message, target);
            return d.promise;
        }

        function _throwError(messageId, error, target) {
            if (messageId || messageId === 0) {
                _notify({
                    id: messageId,
                    result: null,
                    error: error
                }, target);
            } else {
                console.log(error);
            }

        }

        function _callMethod(messageId, implementation, method, params, target) {
            params.forEach(function(param, i) {
                if (param && typeof param.__objectId !== "undefined") {
                    var obj = {};
                    param.__methods.forEach(function(method) {
                        obj[method] = function() {
                            return _request({
                                objectId: param.__objectId,
                                method: method,
                                params: Array.prototype.slice.call(arguments)
                            }, target);
                        };
                    });
                    params[i] = obj;
                }
            });
            var response = typeof messageId === "undefined" ? null : {
                id: messageId,
                result: null,
                error: null
            };
            try {
                var promiseOrResult = method.apply(implementation, params);
                if (!response) {
                    return;
                }

                if (promiseOrResult && typeof promiseOrResult.then === "function") {
                    _requestReferences[messageId] = promiseOrResult;
                    promiseOrResult.then(function(result) {
                        delete _requestReferences[messageId];
                        response.result = result;
                        _notify(response, target);
                    }, function(error) {
                        if (_requestReferences[messageId]) {
                            delete _requestReferences[messageId];
                            response.error = _serializeError(error);
                            _notify(response, target);
                        }
                    }, function() {
                        _notify({
                            responseId: messageId,
                            method: "progress",
                            params: Array.prototype.slice.call(arguments)
                        }, target);
                    });
                } else {
                    response.result = promiseOrResult;
                    _notify(response, target);
                }
            } catch (error) {
                if (response) {
                    response.error = _serializeError(error);
                    _notify(response, target);
                }
            }
        }

        function _handleMessage(evnt, target) {
            if (!_shared && evnt.source !== _target && typeof window !== "undefined") {
                return;
            }
            var data = evnt.data;
            var message = (typeof data !== "string" ? data : JSON.parse(data));
            try {
                if (message.method) { // request
                    var method = message.method,
                        params = message.params || [];
                    if ("serviceId" in message) {
                        var service = _serviceReferences[message.serviceId];
                        if (!service) {
                            _throwError(message.id, "service not found", target);
                        } else {
	                        service = service.implementation;
	                        if (method in service) {
	                            _callMethod(message.id, service, service[method], params, target);
	                        } else {
	                            _throwError(message.id, "method not found", target);
	                        }
                    	}
                    } else if ("objectId" in message) {
                        var object = _objectReferences[message.objectId];
                        if (!object) {
                            _throwError(message.id, "object not found", target);
                        } else if (!method in object) {
                            _callMethod(message.id, object, object[method], params, target);
                        } else {
                            _throwError(message.id, "method not found", target);
                        }
                    } else if ("requestId" in message) {
                        var request = _requestReferences[message.requestId];
                        if (request && method === "cancel" && request.cancel) {
                            request.cancel.apply(request, params);
                        }
                    } else if ("responseId" in message) {
                        var response = _responseReferences[message.responseId];
                        if (response && method === "progress" && response.progress) {
                            response.progress.apply(response, params);
                        }
                    } else {
                        throw new Error("Bad method: " + message.method);
                    }
                } else {
                    var deferred = _responseReferences[String(message.id)];
                    delete _responseReferences[String(message.id)];
                    if (message.error) {
                        deferred.reject(message.error);
                    } else {
                        deferred.resolve(message.result);
                    }
                }
            } catch (e) {
                console.log("Plugin._messageHandler " + e);
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

            if (typeof names === "string") {
                names = [names];
            } else if (!Array.isArray(names)) {
                names = [];
            }

            var method = null;
            var methods = [];
            for (method in implementation) {
                if (typeof implementation[method] === 'function') {
                    methods.push(method);
                }
            }
            _serviceReferences[_currentServiceId++] = {
                names: names,
                methods: methods,
                implementation: implementation,
                properties: properties || {},
                listeners: {}
            };
            heartbeat();
        };
        this.registerServiceProvider = this.registerService;

        this.connect = function(callback, errback) {
            if (_connected) {
                if (callback) {
                    callback();
                }
                return;
            }
            removeEventListener("error", _errHandler);
            var message = {
                method: "plugin",
                params: [_getPluginData()]
            };
            if (!_shared) {
                if (!_target) {
                    if (errback) {
                        errback("No valid plugin target");
                    }
                    return;
                }           
                addEventListener("message", _handleMessage, false);
                _publish(message);
            }
            _ports.forEach(function(port) {
                _publish(message, port);
            });
            _connected = true;
            if (callback) {
                callback();
            }
        };

        this.disconnect = function() {
            if (_connected) {
                removeEventListener("message", _handleMessage);
                _ports.forEach(function(port) {
                    port.close();
                });
                _ports = null;
                _target = null;
                _connected = false;
            }
            // Note: re-connecting is not currently supported
        };            
    }
    
    return PluginProvider;
}));