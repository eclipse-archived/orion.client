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

define(["orion/xhr", "orion/plugin", "orion/operation", "orion/Deferred", "domReady!"], function(xhr, PluginProvider, operation, Deferred) {
	var temp = document.createElement('a');
	temp.href = "../mixloginstatic/LoginWindow.html";
	var login = temp.href;
	var headers = {
		name: "Orion Task Management Service",
		version: "1.0",
		description: "This plugin provides access to the tasks a user is currently running or ran recently, and provides management of those tasks.",
		login: login
	};

	var provider = new PluginProvider(headers);

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

	temp.href = "../task";
	var base = makeParentRelative(temp.href);

	// testing that command service handles image-less actions properly
	provider.registerService("orion.core.operation", {
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
			return operation.handle(taskLocation);
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
			var clientDeferred = new Deferred();
			xhr("DELETE", taskLocation, {
				headers: {
					"Orion-Version": "1"
				},
				timeout: 15000
			}).then(function(result) {
				clientDeferred.resolve(result.response ? JSON.parse(result.response) : null);
			}, function(error){
				var errorMessage = error;
				if(error.responseText){
					errorMessage = error.responseText;
					try{
						errorMessage = JSON.parse(error.responseText);
					}catch(e){
						//ignore
					}
				}
				if(errorMessage.Message)
					clientDeferred.reject(errorMessage);
				else
					clientDeferred.reject({Severity: "Error", Message: errorMessage});
			});
			return clientDeferred;
		}
	}, {
		name: "Tasks",
		pattern: base
	});
	provider.connect();
});