/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global eclipse orion*/
var testcase = (function(assert) {
	var tests = {};
	
	tests["test empty registry"] = function() {
		var storage = {};
		var serviceRegistry = new eclipse.ServiceRegistry();
		var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry, storage);
		
		assert.equal(pluginRegistry.getPlugins().length, 0);
		assert.equal(serviceRegistry.getServiceReferences().length, 0);		
	};

	tests["test install plugin"] = function() {
		var storage = {};
		var serviceRegistry = new eclipse.ServiceRegistry();
		var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry, storage);
		
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
	
	tests["test reload installed plugin"] = function() {
		var storage = {};
		var serviceRegistry = new eclipse.ServiceRegistry();
		var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry, storage);

		assert.equal(pluginRegistry.getPlugins().length, 0);
		assert.equal(serviceRegistry.getServiceReferences().length, 0);

		var promise = pluginRegistry.installPlugin("testPlugin.html").then(function(plugin) {
			var pluginInfo = {
				location: plugin.getLocation(),
				data: plugin.getData()
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
		var serviceRegistry = new eclipse.ServiceRegistry();
		var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry, storage);
		
		assert.equal(pluginRegistry.getPlugins().length, 0);
		assert.equal(serviceRegistry.getServiceReferences().length, 0);		
		
		var promise = pluginRegistry.installPlugin("testPlugin.html").then(function(plugin) {
			return serviceRegistry.getService("test");
		}).then(function(service) {
			return service.test("echo");
		}).then(function(result) {
			assert.equal(result, "echo");
			pluginRegistry.shutdown();
		});
		return promise;
	};
	
	tests["test plugin event"] = function() {
		var storage = {};
		var serviceRegistry = new eclipse.ServiceRegistry();
		var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry, storage);
		
		assert.equal(pluginRegistry.getPlugins().length, 0);
		assert.equal(serviceRegistry.getServiceReferences().length, 0);
		
		var eventListenerCalls = 0;
		function eventListener(result) {
			if (result === "echotest") {
				eventListenerCalls++;
			}
		}
		
		var promise = pluginRegistry.installPlugin("testPlugin.html").then(function(plugin) {
			return serviceRegistry.getService("test");
		}).then(function(service) {
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
	
	
	
	tests["test 404 plugin"] = function() {
		var storage = {};
		var serviceRegistry = new eclipse.ServiceRegistry();
		var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry, storage);
		
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
	
	
	return tests;
}(orion.Assert));
