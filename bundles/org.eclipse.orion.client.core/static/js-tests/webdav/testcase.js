/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global eclipse orion console DOMParser*/
var testcase = (function(assert) {
	var tests = {};

	tests["test plugin GET call"] = function() {
		var storage = {};
		var serviceRegistry = new eclipse.ServiceRegistry();
		var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry, storage);
		
		assert.equal(pluginRegistry.getPlugins().length, 0);
		assert.equal(serviceRegistry.getServiceReferences().length, 0);		
		
		var promise = pluginRegistry.installPlugin("http://localhost/dav/plugin/xhrPlugin.html").then(function(plugin) {
			return serviceRegistry.getService("xhr");
		}).then(function(service) {
			return service.call("GET", "xhrPlugin.html");
		}).then(function(result) {
			assert.ok(result.status >= 200 && result.status < 300);
			pluginRegistry.shutdown();
		});
		return promise;
	};
	
	tests["test plugin GET and PROPFIND call"] = function() {
		var storage = {};
		var serviceRegistry = new eclipse.ServiceRegistry();
		var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry, storage);
		
		assert.equal(pluginRegistry.getPlugins().length, 0);
		assert.equal(serviceRegistry.getServiceReferences().length, 0);		
		
		var promise = pluginRegistry.installPlugin("http://localhost/dav/plugin/xhrPlugin.html").then(function(plugin) {
			return serviceRegistry.getService("xhr");
		}).then(function(service) {
			return service.call("GET", "xhrPlugin.html").then(function(result) {
				assert.ok(result.status >= 200 && result.status < 300);
				return service.call("PROPFIND", "xhrPlugin.html");
			}).then(function(result) {
				assert.ok(result.status >= 200 && result.status < 300);
				var dom = new DOMParser().parseFromString(result.responseText, "text/xml");
				console.log(result.responseText);
				return service.call("PROPFIND", ".", {depth:1});
			}).then(function(result) {
				assert.ok(result.status >= 200 && result.status < 300);
				console.log(result.responseText);
				pluginRegistry.shutdown();
			});
		});
		return promise;
	};
	
	tests["test plugin PUT and DELETE call"] = function() {
		var storage = {};
		var serviceRegistry = new eclipse.ServiceRegistry();
		var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry, storage);
		
		assert.equal(pluginRegistry.getPlugins().length, 0);
		assert.equal(serviceRegistry.getServiceReferences().length, 0);		
		
		var promise = pluginRegistry.installPlugin("http://localhost/dav/plugin/xhrPlugin.html").then(function(plugin) {
			return serviceRegistry.getService("xhr");
		}).then(function(service) {
			return service.call("GET", "xhrPlugin.html").then(function(result) {
				assert.ok(result.status >= 200 && result.status < 300);
				return service.call("PUT", "dummy-xhrPlugin.html", null, result.responseText);
			}).then(function(result) {
				assert.ok(result.status >= 200 && result.status < 300);
				return service.call("GET", "dummy-xhrPlugin.html");
			}).then(function(result) {
				assert.ok(result.status >= 200 && result.status < 300);
				return service.call("DELETE", "dummy-xhrPlugin.html");
			}).then(function(result) {
				assert.ok(result.status >= 200 && result.status < 300);				
				pluginRegistry.shutdown();
			});
		});
		return promise;
	};
	
	tests["test plugin MKCOL and DELETE call"] = function() {
		var storage = {};
		var serviceRegistry = new eclipse.ServiceRegistry();
		var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry, storage);
		
		assert.equal(pluginRegistry.getPlugins().length, 0);
		assert.equal(serviceRegistry.getServiceReferences().length, 0);		
		
		var promise = pluginRegistry.installPlugin("http://localhost/dav/plugin/xhrPlugin.html").then(function(plugin) {
			return serviceRegistry.getService("xhr");
		}).then(function(service) {
			return service.call("MKCOL", "test/").then(function(result) {
				assert.ok(result.status >= 200 && result.status < 300);
				return service.call("GET", "test/", null, result.responseText);
			}).then(function(result) {
				assert.ok(result.status >= 200 && result.status < 300);
				return service.call("DELETE", "test/");
			}).then(function(result) {
				assert.ok(result.status >= 200 && result.status < 300);				
				pluginRegistry.shutdown();
			});
		});
		return promise;
	};
	

	return tests;
}(orion.Assert));
