/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*jslint browser: true, devel: true*/
/*global define XPathResult DOMParser*/
define(["orion/assert", "orion/serviceregistry", "orion/pluginregistry"], function(assert, mServiceregistry, mPluginregistry) {
	var tests = {};
	
	function parseDAVResponse(response)  {
		var result = {};
		result.href = response.querySelector("href").textContent;
		var prop = response.querySelector("propstat prop");
		if (prop !== null) {
			result.displayname = prop.querySelector("displayname").textContent;
			result.creationdate = prop.querySelector("creationdate").textContent;
			result.collection = prop.querySelector("resourcetype collection") !== null;
		}
		
		if (! result.collection ) {
			result.lastmodified = prop.querySelector("getlastmodified").textContent;
			result.contentlength = prop.querySelector("getcontentlength").textContent;
			result.contenttype = prop.querySelector("getcontenttype").textContent;
			result.etag = prop.querySelector("getetag").textContent;
		}
		return result;
	}

	tests["test plugin GET call"] = function() {
		var storage = {};
		var serviceRegistry = new mServiceregistry.ServiceRegistry();
		var pluginRegistry = new mPluginregistry.PluginRegistry(serviceRegistry, storage);
		
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
		var serviceRegistry = new mServiceregistry.ServiceRegistry();
		var pluginRegistry = new mPluginregistry.PluginRegistry(serviceRegistry, storage);
				
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
				var responses = dom.querySelectorAll("multistatus response");
				var response = responses[0];
				assert.ok(response);
				var jsonResponse = parseDAVResponse(response);
				assert.ok(jsonResponse.href.match(/xhrPlugin\.html$/));
				assert.ok(jsonResponse.collection === false);
				assert.ok(jsonResponse.contenttype === "text/html");
				return service.call("PROPFIND", ".", {depth:1});
			}).then(function(result) {
				assert.ok(result.status >= 200 && result.status < 300);
				var dom = new DOMParser().parseFromString(result.responseText, "text/xml");
				var responses = dom.querySelectorAll("multistatus response");
				var response = responses[0];
				assert.ok(response);
				var jsonResponse = parseDAVResponse(response);
				assert.ok(jsonResponse.collection === true);
				pluginRegistry.shutdown();
			});
		});
		return promise;
	};

	
	tests["test plugin PUT and DELETE call"] = function() {
		var storage = {};
		var serviceRegistry = new mServiceregistry.ServiceRegistry();
		var pluginRegistry = new mPluginregistry.PluginRegistry(serviceRegistry, storage);
		
		assert.equal(pluginRegistry.getPlugins().length, 0);
		assert.equal(serviceRegistry.getServiceReferences().length, 0);		
		
		var promise = pluginRegistry.installPlugin("http://localhost/dav/plugin/xhrPlugin.html").then(function(plugin) {
			return serviceRegistry.getService("xhr");
		}).then(function(service) {
			return service.call("GET", "testput.txt").then(function(result) {
				assert.ok(result.status === 404);
				return service.call("PUT", "testput.txt", null, "test");
			}).then(function(result) {
				assert.ok(result.status >= 200 && result.status < 300);
				return service.call("GET", "testput.txt");
			}).then(function(result) {
				assert.ok(result.status >= 200 && result.status < 300);
				return service.call("DELETE", "testput.txt");
			}).then(function(result) {
				assert.ok(result.status >= 200 && result.status < 300);
				return service.call("GET", "testput.txt");
			}).then(function(result) {
				assert.ok(result.status === 404);
				pluginRegistry.shutdown();
			});
		});
		return promise;
	};
	
	tests["test plugin MKCOL and DELETE call"] = function() {
		var storage = {};
		var serviceRegistry = new mServiceregistry.ServiceRegistry();
		var pluginRegistry = new mPluginregistry.PluginRegistry(serviceRegistry, storage);
		
		assert.equal(pluginRegistry.getPlugins().length, 0);
		assert.equal(serviceRegistry.getServiceReferences().length, 0);		
		
		var promise = pluginRegistry.installPlugin("http://localhost/dav/plugin/xhrPlugin.html").then(function(plugin) {
			return serviceRegistry.getService("xhr");
		}).then(function(service) {
			return service.call("PROPFIND", "test/").then(function(result) {
				assert.ok(result.status === 404);
				return service.call("MKCOL", "test/");
			}).then(function(result) {
				assert.ok(result.status >= 200 && result.status < 300);
				return service.call("PROPFIND", "test/", {depth:1});
			}).then(function(result) {
				assert.ok(result.status >= 200 && result.status < 300);
				return service.call("DELETE", "test/");
			}).then(function(result) {
				assert.ok(result.status >= 200 && result.status < 300);
				return service.call("PROPFIND", "test/");
			}).then(function(result) {
				assert.ok(result.status === 404);			
				pluginRegistry.shutdown();
			});
		});
		return promise;
	};
	

	return tests;
});
