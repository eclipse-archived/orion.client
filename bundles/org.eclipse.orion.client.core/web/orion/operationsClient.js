/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd*/
define(['i18n!orion/operations/nls/messages', "orion/Deferred"], function(messages, Deferred) {

    function _doServiceCall(operationsService, funcName, funcArgs) {
        return operationsService[funcName].apply(operationsService, funcArgs);
    }

    function _getOperations(operationsService, options) {
        return _doServiceCall(operationsService, "getOperations", [options]); //$NON-NLS-0$
    }

    function NoMatchingOperationsClient(location) {
        this._location = location;
    }

    function returnNoMatchingError() {
        var result = new Deferred();
        result.reject(messages["NoMatchingOpSrvLocation"] + this._location);
        return result;
    }

    NoMatchingOperationsClient.prototype = {
        getOperation: returnNoMatchingError,
        getOperations: returnNoMatchingError,
        removeCompletedOperations: returnNoMatchingError,
        removeOperation: returnNoMatchingError,
        cancelOperation: returnNoMatchingError
    };

    NoMatchingOperationsClient.prototype.constructor = NoMatchingOperationsClient;
    
    function LocalOperationsClient(serviceRegistry) {
    	this._serviceRegistry = serviceRegistry;
    }
    
    function _generateLocation() {
    	return "/localtask/id/" + Math.floor(Math.random()*65534);
    }

    
    LocalOperationsClient.prototype = {
    	getOperation: function(taskLocation) {
    		var def = new Deferred();
    		this._serviceRegistry.getService("orion.core.preference").getPreferences("/local/operations").then(function(localOperations) {
				var operation = localOperations.get(taskLocation);
				if (operation) {
					def.resolve(operation);
				} else {
					def.reject({
						Severity: "Error",
						Message: "Local Operation " + taskLocation + "not found" 
					});
				}
			});
    		return def;
    	},
    	getOperations: function(options) {
    		var def = new Deferred();
    		this._serviceRegistry.getService("orion.core.preference").getPreferences("/local/operations").then(function(localOperations){
    			var result = [];
    			for (var key in localOperations.keys()) {
    				result.push(localOperations.get(key));
    			}
    			def.resolve(result);
    		});
    		return def;
    	},
    	removeCompletedOperations: function() {
    		var def = new Deferred();
    		this._serviceRegistry.getService("orion.core.preference").getPreferences("/local/operations").then(function(localOperations){
    			var result = [];
    			for (var key in localOperations.keys()) {
    				var operation = localOperations.get(key);
    				if (!operation || !operation.type || operation.type === "loadend") {
    					localOperations.remove(key);
    				} else {
    					result.push(key);
    				}
    			}
    			def.resolve(result);
    		});
    		return def;
    	},
    	removeOperation: function(taskLocation) {
    		var def = new Deferred();
    		this._serviceRegistry.getService("orion.core.preference").getPreferences("/local/operations").then(function(localOperations){
    			var operation = localOperations.get(taskLocation);
    			if (operation) {
    				localOperations.remove(taskLocation);
    			}
    			def.resolve(taskLocation);
    		});
    		return def;
    	},
    	cancelOperation: returnNoMatchingError,
    	createOperation: function (operationName, type, result, expTime) {
			var exp = new Date();
			exp.setTime(exp.getTime()+5*60);
			if (expTime) {
				exp = expTime;
			}
			var location = 	_generateLocation();
			var operation = {
				Name: operationName,
				expires: exp.getTime(),
				Location: location,
				location: location,
				type: type,
				Result: result
			};
			if(operation.Location){
				this._serviceRegistry.getService("orion.core.preference").getPreferences("/local/operations").then(function(localOperations){
					localOperations.put(operation.Location, operation);
				});
				this._serviceRegistry.getService("orion.core.preference").getPreferences("/operations").then(function(globalOperations){
					globalOperations.put(operation.Location, {Name: operation.Name, expires: operation.expires});
				});
			}
			return operation;
    	}
    };

    LocalOperationsClient.prototype.constructor = LocalOperationsClient;

    function OperationsClient(serviceRegistry) {
        this._services = [];
        this._patterns = [];
        this._operationListeners = [];
        this._currentLongpollingIds = [];
        this._preferenceService = serviceRegistry.getService("orion.core.preference"); //$NON-NLS-0$
        var operationsServices = serviceRegistry.getServiceReferences("orion.core.operation"); //$NON-NLS-0$
        for (var i = 0; i < operationsServices.length; i++) {
            var servicePtr = operationsServices[i];
            var operationsService = serviceRegistry.getService(servicePtr);
            this._services[i] = operationsService;

            var patternString = operationsServices[i].getProperty("pattern") || ".*"; //$NON-NLS-1$ //$NON-NLS-0$
            if (patternString[0] !== "^") { //$NON-NLS-0$
                patternString = "^" + patternString; //$NON-NLS-0$
            }
            this._patterns[i] = new RegExp(patternString);
        }
        this._patterns.unshift(/^\/localtask/);
        this._services.unshift(new LocalOperationsClient(serviceRegistry));

        this._getService = function(location) {
            if (!location) {
                return this._services[0];
            }
            for (var j = 0; j < this._patterns.length; ++j) {
                if (this._patterns[j].test(location)) {
                    return this._services[j];
                }
            }
            this._operations.remove(location);
            return new NoMatchingOperationsClient(location);
        };
    }

    function _mergeOperations(lists) {
        var result = {
            Children: []
        };
        for (var i = 0; i < lists.length; i++) {
            result.Children = result.Children.concat(lists[i].Children);
        }
        return result;
    }

    function _notifyChangeListeners(result) {
        for (var i = 0; i < this._operationListeners.length; i++) {
            this._operationListeners[i](result);
        }
    }

    OperationsClient.prototype = {
    	createOperation: function(operationName, type, result) {
    		return _doServiceCall(this._getService(_generateLocation()), "createOperation", arguments); //$NON-NLS-0$
    	},
        getOperations: function() {
            var def = new Deferred();
            if (this._operations) {
                def.resolve(this._operations);
                return def;
            }
            var that = this;
            this._preferenceService.getPreferences("/operations").then(function(globalOperations) {
                that._operations = globalOperations;
                def.resolve(that._operations);
            });
            return def;
        },
        getOperation: function(operationLocation) {
            return _doServiceCall(this._getService(operationLocation), "getOperation", arguments); //$NON-NLS-0$
        },
        removeCompletedOperations: function() {
            var results = [];
            var that = this;
            for (var i = 0; i < this._services.length; i++) {
                var pattern = this._patterns[i];
                var def = new Deferred();
                results[i] = def.promise;
                _doServiceCall(this._services[i], "removeCompletedOperations").then(function(def) {
                    return function(operationsLeft) {
                        if (!Array.isArray(operationsLeft)) {
                            return;
                        }
                        that.getOperations.bind(that)().then(function(globalOperations) {
                            var operationLocations = globalOperations.keys();
                            for (var j = 0; j < operationLocations.length; j++) {
                                var location = operationLocations[j];
                                if (pattern.test(location)) {
                                    if (operationsLeft.indexOf(location) < 0) {
                                        globalOperations.remove(location);
                                    }
                                }
                            }
                            def.resolve();
                        });
                    };
                }(def), function(def) {
                    return function(error) {
                        def.reject(error);
                    };
                }(def));
            }
            return Deferred.all(results);
        },

        removeOperation: function(operationLocation) {
            var that = this;
            return _doServiceCall(this._getService(operationLocation), "removeOperation", arguments).then(function(result) {
                that.getOperations.bind(that)().then(function(globalOperations) {
                    globalOperations.remove(operationLocation);
                });
            }, function(error) {
                return error;
            }, function(progress) {
                return progress;
            });
        }
    };

    OperationsClient.prototype.constructor = OperationsClient;

    return {
        OperationsClient: OperationsClient
    };
});