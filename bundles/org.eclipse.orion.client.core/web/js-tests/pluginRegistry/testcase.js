/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define navigator Worker*/


define(["orion/assert", "orion/serviceregistry", "orion/pluginregistry", "orion/Deferred"], function(assert, mServiceregistry, mPluginregistry, Deferred) {
	var Plugin = mPluginregistry.Plugin;
	var tests = {};
	
	tests["test empty registry"] = function() {
		var storage = {};
		var serviceRegistry = new mServiceregistry.ServiceRegistry();
		var pluginRegistry = new mPluginregistry.PluginRegistry(serviceRegistry, storage);
		
		assert.equal(pluginRegistry.getPlugins().length, 0);
		assert.equal(serviceRegistry.getServiceReferences().length, 0);		
	};

	tests["test install plugin"] = function() {
		var storage = {};
		var serviceRegistry = new mServiceregistry.ServiceRegistry();
		var pluginRegistry = new mPluginregistry.PluginRegistry(serviceRegistry, storage);
		
		assert.equal(pluginRegistry.getPlugins().length, 0);
		assert.equal(serviceRegistry.getServiceReferences().length, 0);		
		
		var promise = pluginRegistry.installPlugin("testPlugin.html").then(function(plugin) {
			assert.equal(pluginRegistry.getPlugins().length, 1);
			assert.equal(serviceRegistry.getServiceReferences().length, 1);		
			
			plugin.uninstall();
			
			assert.equal(pluginRegistry.getPlugins().length, 0);
			assert.equal(serviceRegistry.getServiceReferences().length, 0);
			pluginRegistry.shutdown();
		});
		return promise;
	};

	tests["test install same plugin URL"] = function() {
		var storage = {};
		var serviceRegistry = new mServiceregistry.ServiceRegistry();
		var pluginRegistry = new mPluginregistry.PluginRegistry(serviceRegistry, storage);

		var promise1 = pluginRegistry.installPlugin("testPlugin.html");
		var promise2 = pluginRegistry.installPlugin("testPlugin.html");
		return promise1.then(function(plugin1) {
			return promise2.then(function(plugin2) {
				assert.equal(plugin1, plugin2, "Got the same Plugin instance");
				plugin1.uninstall();
				pluginRegistry.shutdown();
			});
		});
	};
	
		tests["test install worker plugin"] = function() {
		if (typeof(Worker) === "undefined") {
			return;
		}
		
		var storage = {};
		var serviceRegistry = new mServiceregistry.ServiceRegistry();
		var pluginRegistry = new mPluginregistry.PluginRegistry(serviceRegistry, storage);
		
		assert.equal(pluginRegistry.getPlugins().length, 0);
		assert.equal(serviceRegistry.getServiceReferences().length, 0);		
		
		var promise = pluginRegistry.installPlugin("testPlugin.js").then(function(plugin) {
			assert.equal(pluginRegistry.getPlugins().length, 1);
			assert.equal(serviceRegistry.getServiceReferences().length, 1);		
			
			plugin.uninstall();
			
			assert.equal(pluginRegistry.getPlugins().length, 0);
			assert.equal(serviceRegistry.getServiceReferences().length, 0);
			pluginRegistry.shutdown();
		});
		return promise;
	};
	
	tests["test reload installed plugin"] = function() {
		var storage = {};
		var serviceRegistry = new mServiceregistry.ServiceRegistry();
		var pluginRegistry = new mPluginregistry.PluginRegistry(serviceRegistry, storage);

		assert.equal(pluginRegistry.getPlugins().length, 0);
		assert.equal(serviceRegistry.getServiceReferences().length, 0);

		var promise = pluginRegistry.installPlugin("testPlugin.html").then(function(plugin) {
			var pluginInfo = {
				location: plugin.getLocation(),
				data: plugin.getHeaders()
			};

			assert.equal(pluginRegistry.getPlugins().length, 1);
			assert.equal(serviceRegistry.getServiceReferences().length, 1);

			plugin.uninstall();

			assert.equal(pluginRegistry.getPlugins().length, 0);
			assert.equal(serviceRegistry.getServiceReferences().length, 0);
			return pluginInfo;
		}).then(function(pluginInfo) {
			return pluginRegistry.installPlugin(pluginInfo.location, pluginInfo.data);
		}).then(function(plugin) {
			assert.equal(pluginRegistry.getPlugins().length, 1);
			assert.equal(serviceRegistry.getServiceReferences().length, 1);

			plugin.uninstall();

			assert.equal(pluginRegistry.getPlugins().length, 0);
			assert.equal(serviceRegistry.getServiceReferences().length, 0);
			pluginRegistry.shutdown();
		});

		return promise;
	};
	
	
	tests["test plugin service call"] = function() {
		var storage = {};
		var serviceRegistry = new mServiceregistry.ServiceRegistry();
		var pluginRegistry = new mPluginregistry.PluginRegistry(serviceRegistry, storage);
		
		assert.equal(pluginRegistry.getPlugins().length, 0);
		assert.equal(serviceRegistry.getServiceReferences().length, 0);		
		
		var promise = pluginRegistry.installPlugin("testPlugin.html").then(function(plugin) {
			return serviceRegistry.getService("test").test("echo");
		}).then(function(result) {
			assert.equal(result, "echo");
			pluginRegistry.shutdown();
		});
		return promise;
	};
	
	tests["test plugin service call promise"] = function() {
		var storage = {};
		var serviceRegistry = new mServiceregistry.ServiceRegistry();
		var pluginRegistry = new mPluginregistry.PluginRegistry(serviceRegistry, storage);
		
		var progress = false;
		
		assert.equal(pluginRegistry.getPlugins().length, 0);
		assert.equal(serviceRegistry.getServiceReferences().length, 0);		
		
		var promise = pluginRegistry.installPlugin("testPlugin.html").then(function(plugin) {
			return serviceRegistry.getService("test").testPromise("echo");
		}).then(function(result) {
			assert.equal(result, "echo");
			assert.ok(progress);
			pluginRegistry.shutdown();
		}, function(error) {
			assert.ok(false);
		}, function (update) {
			assert.equal(update, "progress");
			progress = true;
		});
		return promise;
	};
	
	tests["test plugin event"] = function() {
		var storage = {};
		var serviceRegistry = new mServiceregistry.ServiceRegistry();
		var pluginRegistry = new mPluginregistry.PluginRegistry(serviceRegistry, storage);
		
		assert.equal(pluginRegistry.getPlugins().length, 0);
		assert.equal(serviceRegistry.getServiceReferences().length, 0);
		
		var eventListenerCalls = 0;
		function eventListener(result) {
			if (result === "echotest") {
				eventListenerCalls++;
			}
		}
		
		var promise = pluginRegistry.installPlugin("testPlugin.html").then(function(plugin) {
			var service = serviceRegistry.getService("test");
			service.addEventListener("echo", eventListener);
			return service.testEvent("echo").then(function() {
				service.removeEventListener("echo", eventListener);
				return service.testEvent("echo");
			});
		}).then(function(result) {
			assert.equal(eventListenerCalls, 1);
			pluginRegistry.shutdown();
		});
		return promise;
	};
	
	tests["test pluginregistry event pluginLoaded - lazy"] = function() {
		var storage = {};
		var serviceRegistry = new mServiceregistry.ServiceRegistry();
		var pluginRegistry = new mPluginregistry.PluginRegistry(serviceRegistry, storage);
		
		assert.equal(pluginRegistry.getPlugins().length, 0);
		assert.equal(serviceRegistry.getServiceReferences().length, 0);		
		
		var promise = new Deferred();
		pluginRegistry.installPlugin("testPlugin.html").then(function(plugin) {
			// Dance required to trigger a lazy load: shutdown, recreate (reuse plugin storage), startup
			pluginRegistry.shutdown();
			serviceRegistry = new mServiceregistry.ServiceRegistry();
			pluginRegistry = new mPluginregistry.PluginRegistry(serviceRegistry, storage);
			pluginRegistry.addEventListener("pluginLoaded", function(plugin) {
				try {
					assert.ok(!!plugin, "plugin not null");
					assert.equal(plugin.getServiceReferences().length, 1);
					assert.equal(plugin.getServiceReferences()[0].getProperty("name"), "echotest");
					promise.resolve();
				} catch(e) {
					promise.reject(e);
				}
			});
			pluginRegistry.startup(["testPlugin.html"]).then(function() {
				// This service call should trigger pluginLoaded listener
				serviceRegistry.getService("test").test().then(function() {
					plugin.uninstall();
					pluginRegistry.shutdown();
				});
			});
		});
		return promise;
	};

	tests["test pluginregistry event pluginLoaded - non-lazy"] = function() {
		var storage = {};
		var serviceRegistry = new mServiceregistry.ServiceRegistry();
		var pluginRegistry = new mPluginregistry.PluginRegistry(serviceRegistry, storage);

		assert.equal(pluginRegistry.getPlugins().length, 0);
		assert.equal(serviceRegistry.getServiceReferences().length, 0);		

		var listenerCalled = false;
		pluginRegistry.addEventListener("pluginLoaded", function() {
			listenerCalled = true;
		});
		return pluginRegistry.installPlugin("testPlugin.html").then(function(plugin) {
			// Plugin already loaded here, so this is not lazy
			return serviceRegistry.getService("test").test().then(function() {
				assert.ok(listenerCalled, "Listener called");
				pluginRegistry.shutdown();
			});
		});
	};

	// Test ordering guarantee:
	// The testOrdering1() service call injected by our pluginLoaded listener should call back before the original 
	// testOrdering2() service call that triggered the listener.
	tests["test pluginregistry event pluginLoaded service call ordering"] = function() {
		var storage = {};
		var serviceRegistry = new mServiceregistry.ServiceRegistry();
		var pluginRegistry = new mPluginregistry.PluginRegistry(serviceRegistry, storage);

		assert.equal(pluginRegistry.getPlugins().length, 0);
		assert.equal(serviceRegistry.getServiceReferences().length, 0);		

		return pluginRegistry.installPlugin("testPlugin2.html").then(function(plugin) {
			// To trigger lazy load: shutdown, recreate (reuse plugin storage), startup
			pluginRegistry.shutdown();
			serviceRegistry = new mServiceregistry.ServiceRegistry();
			pluginRegistry = new mPluginregistry.PluginRegistry(serviceRegistry, storage);
			var listenerCalls = 0;
			pluginRegistry.addEventListener("pluginLoaded", function(plugin) {
				assert.equal(++listenerCalls, 1);
				// Our loading handler invokes testOrdering2 method of the plugin that is loading
				serviceRegistry.getService("testOrdering").testOrdering1();
			});
			return pluginRegistry.startup(["testPlugin2.html"]).then(function() {
				var service = serviceRegistry.getService("testOrdering");
				// Kicks off the lazy-load process:
				return service.testOrdering2().then(function() {
					// At this point both testOrdering1() (injected) and testOrdering2() should've called back.
					return service.getCallOrder().then(function(order) {
						assert.deepEqual(order, ["testOrdering1", "testOrdering2"], "Service method call order is as expected");
						plugin.uninstall();
						pluginRegistry.shutdown();
					});
				});
			});
		});
	};

	tests["test pluginregistry events pluginLoaded"] = function() {
		var storage = {};
		var serviceRegistry = new mServiceregistry.ServiceRegistry();
		var pluginRegistry = new mPluginregistry.PluginRegistry(serviceRegistry, storage);
		
		assert.equal(pluginRegistry.getPlugins().length, 0);
		assert.equal(serviceRegistry.getServiceReferences().length, 0);		
		
		var promise = new Deferred();
		pluginRegistry.addEventListener("pluginLoaded", function(plugin) {
			try {
				assert.ok(!!plugin, "plugin not null");
					assert.equal(plugin.getServiceReferences().length, 1);
					assert.equal(plugin.getServiceReferences()[0].getProperty("name"), "echotest");
				promise.resolve();
			} catch(e) {
				promise.reject(e);
			}
		});
		pluginRegistry.installPlugin("testPlugin.html").then(function(plugin) {
			plugin.uninstall();
			pluginRegistry.shutdown();
		});
		return promise;
	};

	tests["test 404 plugin"] = function() {
		var storage = {};
		var serviceRegistry = new mServiceregistry.ServiceRegistry();
		var pluginRegistry = new mPluginregistry.PluginRegistry(serviceRegistry, storage);
		
		var plugins = pluginRegistry.getPlugins();
		assert.equal(plugins.length, 0);
		
		var promise = pluginRegistry.installPlugin("badURLPlugin.html").then(function() {
			throw new assert.AssertionError();
		}, function(e) {
			assert.ok(e.message.match(/Load timeout for plugin/));
			plugins = pluginRegistry.getPlugins();
			assert.equal(plugins.length, 0);
			pluginRegistry.shutdown();
		});
		return promise;
	};
	
	if (navigator && navigator.userAgent && navigator.userAgent.indexOf("WebKit") !== -1) {
		tests["test iframe sandbox"] = function() {
			var storage = {};
			var serviceRegistry = new mServiceregistry.ServiceRegistry();
			var pluginRegistry = new mPluginregistry.PluginRegistry(serviceRegistry, storage);
			
			var plugins = pluginRegistry.getPlugins();
			assert.equal(plugins.length, 0);
			
			var promise = pluginRegistry.installPlugin("testsandbox.html").then(function() {
				throw new assert.AssertionError();
			}, function(e) {
				assert.ok(e.message.match(/Load timeout for plugin/));
				plugins = pluginRegistry.getPlugins();
				assert.equal(plugins.length, 0);
				pluginRegistry.shutdown();
			});
			return promise;
		};
	}

	tests["test __plugin__ property"] = function() {
		var storage = {};
		var serviceRegistry = new mServiceregistry.ServiceRegistry();
		var pluginRegistry = new mPluginregistry.PluginRegistry(serviceRegistry, storage);
		return pluginRegistry.installPlugin("testPlugin.html").then(function(plugin) {
			var serviceReferences = serviceRegistry.getServiceReferences("test");
			assert.equal(serviceReferences.length, 1);
			var __plugin__ = serviceReferences[0].getProperty("__plugin__");
			assert.equal(__plugin__, plugin.getLocation());

			plugin.uninstall();
			pluginRegistry.shutdown();
		});
	};

	tests["test plugin states"] = function() {
		var storage = {};
		var serviceRegistry = new mServiceregistry.ServiceRegistry();
		var pluginRegistry = new mPluginregistry.PluginRegistry(serviceRegistry, storage);
		// Eager-load case
		return pluginRegistry.installPlugin("testPlugin.html").then(function(plugin) {
			var pluginLocation = plugin.getLocation();
			assert.equal(plugin.getState(), Plugin.LOADED, "Plugin loaded (eager)");
			pluginRegistry.shutdown();

			// Lazy-load case
			serviceRegistry = new mServiceregistry.ServiceRegistry();
			pluginRegistry = new mPluginregistry.PluginRegistry(serviceRegistry, storage);
			return pluginRegistry.startup(["testPlugin.html"]).then(function() {
				plugin = pluginRegistry.getPlugin(pluginLocation);
				assert.equal(plugin.getState(), Plugin.INSTALLED, "Plugin installed");
				return serviceRegistry.getService("test").test().then(function() {
					assert.equal(plugin.getState(), Plugin.LOADED, "Plugin loaded (lazy)");
					plugin.uninstall();
					assert.equal(plugin.getState(), Plugin.UNINSTALLED, "Plugin uninstalled");
					pluginRegistry.shutdown();
				});
			});
		});
	};

	return tests;
});
