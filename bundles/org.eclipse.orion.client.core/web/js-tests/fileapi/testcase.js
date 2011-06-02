/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global eclipse orion console DOMParser XPathResult document*/
var testcase = (function(assert) {
	var tests = {};


	tests["test root"] = function() {
		var storage = {};
		var serviceRegistry = new eclipse.ServiceRegistry();
		var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry, storage);	
		
		var promise = pluginRegistry.installPlugin("dummyFilePlugin.html").then(function(plugin) {
			var references = serviceRegistry.getServiceReferences("orion.file");
			assert.equal(references.length, 1);
			var reference = references[0];
			var root = reference.getProperty("root");
			assert.ok(root.match(/fileapi/));
		}).then(function() {
			pluginRegistry.shutdown();
		});
		return promise;
	};
	
	tests["test read"] = function() {
		var storage = {};
		var serviceRegistry = new eclipse.ServiceRegistry();
		var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry, storage);	
		
		var promise = pluginRegistry.installPlugin("dummyFilePlugin.html").then(function(plugin) {
			var references = serviceRegistry.getServiceReferences("orion.file");
			var reference = references[0];
			var root = reference.getProperty("root");
			return serviceRegistry.getService(reference).then(function(service) {
				return service.read(root + "dummyFilePlugin.html");
			});
		}).then(function(result) {
			assert.ok(result.status >= 200 && result.status < 300);
			pluginRegistry.shutdown();
		});
		return promise;
	};
	
	tests["test read notfound"] = function() {
		var storage = {};
		var serviceRegistry = new eclipse.ServiceRegistry();
		var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry, storage);	
		
		var promise = pluginRegistry.installPlugin("dummyFilePlugin.html").then(function(plugin) {
			var references = serviceRegistry.getServiceReferences("orion.file");
			var reference = references[0];
			var root = reference.getProperty("root");
			return serviceRegistry.getService(reference).then(function(service) {
				return service.read(root + "notfound.html");
			});
		}).then(function(result) {
			assert.ok(false);
		}, function(result) {
			assert.ok(result.status === 404);
		}).then(function(){
			pluginRegistry.shutdown();
		});
		return promise;
	};
	
	tests["test write"] = function() {
		var storage = {};
		var serviceRegistry = new eclipse.ServiceRegistry();
		var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry, storage);	
		
		var promise = pluginRegistry.installPlugin("dummyFilePlugin.html").then(function(plugin) {
			var references = serviceRegistry.getServiceReferences("orion.file");
			var reference = references[0];
			var root = reference.getProperty("root");
			return serviceRegistry.getService(reference).then(function(service) {
				return service.read(root + "newfile.html").then(function(result) {
					assert.ok(false);
				}, function(result) {
					assert.ok(result.status === 404);
					return service.write(root + "newfile.html", "<html><body>test</body></html>");
				}).then(function(result) {
					assert.ok(result.status >= 200 && result.status < 300);
					return service.read(root + "newfile.html");
				}).then(function(result) {
					assert.ok(result.status >= 200 && result.status < 300);
					return service.remove(root + "newfile.html");
				}).then(function(result) {
					assert.ok(result.status >= 200 && result.status < 300);
				});
			});
		}).then(function(){
			pluginRegistry.shutdown();
		});
		return promise;
	};
	
	tests["test mkdir"] = function() {
		var storage = {};
		var serviceRegistry = new eclipse.ServiceRegistry();
		var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry, storage);	
		
		var promise = pluginRegistry.installPlugin("dummyFilePlugin.html").then(function(plugin) {
			var references = serviceRegistry.getServiceReferences("orion.file");
			var reference = references[0];
			var root = reference.getProperty("root");
			return serviceRegistry.getService(reference).then(function(service) {
				return service.list(root + "newdir").then(function(result) {
					assert.ok(false);
				}, function(result) {
					assert.ok(result.status === 404);
					return service.mkdir(root + "newdir");
				}).then(function(result) {
					assert.ok(result.status >= 200 && result.status < 300);
					return service.list(root + "newdir");
				}).then(function(result) {
					assert.ok(result.status >= 200 && result.status < 300);
					return service.remove(root + "newdir");
				}).then(function(result) {
					assert.ok(result.status >= 200 && result.status < 300);
				});
			});
		}).then(function(){
			pluginRegistry.shutdown();
		});
		return promise;
	};
	

	return tests;
}(orion.Assert));
