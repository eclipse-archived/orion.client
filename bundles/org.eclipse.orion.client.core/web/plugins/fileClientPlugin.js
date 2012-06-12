/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global window document parent define console eclipse*/

define(["orion/Deferred", "plugins/filePlugin/fileImpl", "domReady!", "orion/plugin"], function(Deferred, FileServiceImpl) {
	function trace(implementation) {
		var method;
		var traced = {};
		for (method in implementation) {
			if (typeof implementation[method] === 'function') {
				traced[method] = function(methodName) {
					return function() {
						console.log(methodName);
						var arg;
						for (arg in arguments) {
							console.log(" [" + arg + "] " + arguments[arg]);
						}
						var result = implementation[methodName].apply(implementation, Array.prototype.slice.call(arguments));
						Deferred.when(result, function(json) {
							console.log(json);
						});
						return result;
					};
				}(method);
			}
		}
		return traced;
	}

	function makeParentRelative(location) {
		try {
			if (window.location.host === parent.location.host && window.location.protocol === parent.location.protocol) {
				return location.substring(parent.location.href.indexOf(parent.location.host) + parent.location.host.length);
			}
		} catch (e) {
			//skip
		}
		return location;
	}

	var provider = new eclipse.PluginProvider();

	var temp = document.createElement('a');
	temp.href = "../file";
	// note global
	var fileBase = makeParentRelative(temp.href);

	temp.href = "../workspace";
	// note global
	var workspaceBase = makeParentRelative(temp.href);

	temp.href = "..";
	var patternBase = makeParentRelative(temp.href);


	var service = new FileServiceImpl(fileBase, workspaceBase);
	//provider.registerServiceProvider("orion.core.file", trace(service), {Name:'Orion Content', top:fileBase, pattern:patternBase});
	provider.registerServiceProvider("orion.core.file", service, {
		NameKey: 'Orion Content',
		nls: 'orion/navigate/nls/messages',
		top: fileBase,
		pattern: patternBase
	});
	service.dispatchEvent = provider.dispatchEvent;
	provider.connect();
});