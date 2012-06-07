/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define eclipse window parent document*/

define(["orion/xhr", "domReady!", "orion/plugin"], function(xhr) {
	var provider = new eclipse.PluginProvider();

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

	var temp = document.createElement('a');
	temp.href = "../task";
	var base = makeParentRelative(temp.href);

	// testing that command service handles image-less actions properly
	provider.registerServiceProvider("orion.core.operation", {
		getOperations: function(options) {
			return xhr("GET", base, {
				headers: {
					"Orion-Version": "1"
				},
				query: options,
				timeout: options.Longpolling ? 70000 : 15000
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		},
		getOperation: function(taskLocation) {
			return xhr("GET", taskLocation, {
				headers: {
					"Orion-Version": "1"
				},
				timeout: 15000
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		},
		removeCompletedOperations: function() {
			return xhr("DELETE", base, {
				headers: {
					"Orion-Version": "1"
				},
				timeout: 15000
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		},
		removeOperation: function(taskLocation) {
			return xhr("DELETE", taskLocation, {
				headers: {
					"Orion-Version": "1"
				},
				timeout: 15000
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		},
		cancelOperation: function(taskLocation) {
			return xhr("PUT", taskLocation, {
				data: JSON.stringify({
					Cancel: true
				}),
				headers: {
					"Orion-Version": "1"
				},
				timeout: 15000
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		}
	}, {
		name: "Tasks",
		pattern: base
	});
	provider.connect();
});