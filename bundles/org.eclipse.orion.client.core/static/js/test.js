/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
var orion = orion || {};
orion.Test = (function(assert) {

	var Test = function() {	
		var exports = {};
		var AssertionError = assert.AssertionError;
	
		var _namedlisteners = {};
		function dispatchEvent(eventName) {
			var listeners = _namedlisteners[eventName];
			if (listeners) {
				for ( var i = 0; i < listeners.length; i++) {
					try {
						var args = Array.prototype.slice.call(arguments, 1);
						listeners[i].apply(null, args);
					} catch (e) {
						console.log(e); // for now, probably should dispatch an
										// ("error", e)
					}
				}
			}
		}
	
		exports.addEventListener = function(eventName, listener) {
			_namedlisteners[eventName] = _namedlisteners[eventName] || [];
			_namedlisteners[eventName].push(listener);
		};
	
		exports.removeEventListener = function(eventName, listener) {
			var listeners = _namedlisteners[eventName];
			if (listeners) {
				for ( var i = 0; i < listeners.length; i++) {
					if (listeners[i] === listener) {
						if (listeners.length === 1) {
							delete _namedlisteners[eventName];
						} else {
							_namedlisteners[eventName].splice(i, 1);
						}
						break;
					}
				}
			}
		};
	
		function _run(runName, obj) {
			dispatchEvent("runStart", runName);
			var failures = 0;
			var deferredCount = 1;
			var result = new dojo.Deferred();
	
			for ( var property in obj) {
				if (property.match(/^test.+/)) {
					var test = obj[property];
					var testName = runName ? runName + "." + property : property;
					if (typeof test === "function") {
						dispatchEvent("testStart", testName);
						try {
							var testResult = test();
							if (testResult && typeof testResult.then === "function") {
								deferredCount++;
								testResult.then(function(testName) {
									return function() {
										dispatchEvent("testDone", testName, {
											result : true
										});
									};
								}(testName), function(testName) {
									return function(e) {
										failures++;
										e.log = false;
										dispatchEvent("testDone", testName, {
											result : false,
											message : e.toString(),
											stack: e.stack || e.stacktrace
										});
									};
								}(testName)).then(function() {
									deferredCount--;
									if (deferredCount === 0) {
										result.resolve(failures);
									}
								});
							} else {
								dispatchEvent("testDone", testName, {
									result : true
								});
							}
						} catch (e) {
							failures++;
							dispatchEvent("testDone", testName, {
								result : false,
								message : e.toString(),
								stack: e.stack || e.stacktrace
							});
						}
					} else if (typeof test === "object") {
						deferredCount++;
						var runResult = _run(testName, test);
						if (runResult && typeof runResult.then === "function") {
							runResult.then(function(runFailures) {
								failures += runFailures;
								deferredCount--;
								if (deferredCount === 0) {
									result.resolve(failures);
								}
							});
						} else {
							deferredCount--;
							failures += runResult;
						}
					}
				}
			}
			deferredCount--;
	
			if (deferredCount == 0) {
				dispatchEvent("runDone", runName, {
					failures : failures
				});
				return failures;
			} else {
				result.then(function() {
					dispatchEvent("runDone", runName, {
						failures : failures
					});
				});
				return result.promise;
			}
		}
	
		exports.list = function(name, obj) {
			if (typeof obj === "undefined") {
				obj = name;
				name = "";
			}
	
			if (!obj || typeof obj !== "object") {
				throw Error("not a test object");
			}
			return _list(name, obj);
		};
		
	
		function _list(runName, obj) {
			var result = [],
				property,
				test,
				testName;
			
			for (property in obj) {
				if (property.match(/^test.+/)) {
					test = obj[property];
					testName = runName ? runName + "." + property : property;
					if (typeof test === "function") {
						result.push(testName);
					} else if (typeof test === "object") {
						result = result.concat(_list(testName, test, result));
					}
				}
			}
			return result;
		};
	
		
		exports.run = function(name, obj) {
			if (typeof obj === "undefined") {
				obj = name;
				name = "";
			}
	
			if (!obj || typeof obj !== "object") {
				throw Error("not a test object");
			}
			
			if (top != self && typeof(eclipse) !== "undefined" && eclipse.PluginProvider) {
				var result = new dojo.Deferred();
				try {
					var provider = new eclipse.PluginProvider();
					var serviceProvider = provider.registerServiceProvider("testRunner", {
						run: function() {
							dojo.when(_run(name, obj), dojo.hitch(result, "resolve"));
						},
						list: function() {
							return _list(name, obj);
						}
					});
	
					provider.connect(function() {
						exports.addEventListener("runStart", function(name) { serviceProvider.dispatchEvent("runStart", name); });
						exports.addEventListener("runDone", function(name, obj) { serviceProvider.dispatchEvent("runDone", name, obj); });
						exports.addEventListener("testStart", function(name) { serviceProvider.dispatchEvent("testStart", name); });
						exports.addEventListener("testDone", function(name, obj) { serviceProvider.dispatchEvent("testDone", name, obj); });
					}, function() {
						if (!(_namedlisteners.runStart ||_namedlisteners.runDone ||_namedlisteners.testStart  ||_namedlisteners.testDone)) {
							exports.useConsole();
						}
						dojo.when(_run(name, obj), dojo.hitch(result, "resolve"));
					});
					return result;
				} catch (e) {
					// fall through
					console.log(e);
				}
			}
			// if no listeners add the console
			if (!(_namedlisteners.runStart ||_namedlisteners.runDone ||_namedlisteners.testStart  ||_namedlisteners.testDone)) {
				exports.useConsole();
			}
			return _run(name, obj);
		};
		
		exports.useConsole = function() {
			var times = {};
			var testCount = 0;
			var top;
			
			exports.addEventListener("runStart", function(name) {
				var name = name ? name : "<top>";
				if (!top) {
					top = name;
				};
				console.log("[Test Run] - " + name + " start");
				times[name] = new Date().getTime();
			});
			exports.addEventListener("runDone", function(name, obj) {
				var name = name ? name : "<top>";
				var result = [];
				result.push("[Test Run] - " + name + " done - ");
				result.push("[Failures:" + obj.failures + (name === top ? ", Test Count:" + testCount : "") +"] ");
				result.push("(" + (new Date().getTime() - times[name]) / 1000 + "s)");
				delete times[name];
				console.log(result.join(""));
			});
			exports.addEventListener("testStart", function(name) {
				times[name] = new Date().getTime();
				testCount++;
			});
			exports.addEventListener("testDone", function(name, obj) {
				var result = [];
				result.push(obj.result ? " [passed] " : " [failed] ");
				result.push(name);
				result.push(" (" + (new Date().getTime() - times[name]) / 1000 + "s)");
				delete times[name];
				if (!obj.result) {
					result.push("\n  " + obj.message);
					if (obj.stack) {
						result.push("\n Stack Trace:\n" + obj.stack);
					}
				}
				console.log(result.join(""));
			});
		};
		
		exports.newTest = function() {
			return Test();
		};
		return exports;
	};
	return Test();
}(orion.Assert));