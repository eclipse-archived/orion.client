/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

var testcase = function(assert) {
	var tests = {};
	
	tests["test empty registry"] = function() {
		var storage = {};
		var serviceRegistry = new eclipse.ServiceRegistry();
		var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry, storage);
		
		var plugins = pluginRegistry.getPlugins();
		assert.equal(plugins.length, 0);
		
		var serviceReferences = serviceRegistry.getServiceReferences();
		assert.equal(serviceReferences.length, 0);
		
	};

	tests["test install plugin"] = function() {
		var storage = {};
		var serviceRegistry = new eclipse.ServiceRegistry();
		var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry, storage);
		
		var plugins = pluginRegistry.getPlugins();
		assert.equal(plugins.length, 0);
		
		var promise = pluginRegistry.installPlugin("testPlugin.html").then(function() {
			plugins = pluginRegistry.getPlugins();
			assert.equal(plugins.length, 1);
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
		});
		return promise;
	};
	
	
	return tests;
}(orion.Assert);
