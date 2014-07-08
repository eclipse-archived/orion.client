/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env amd, browser*/
define([
	"orion/xhr"
], function(xhr) {
	function PreferencesProvider(location) {
		this.location = location;
	}
	PreferencesProvider.prototype = {
		get: function(name) {
			return xhr("GET", this.location + name, {
				headers: {
					"Orion-Version": "1"
				},
				timeout: 15000,
				log: false
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		},
		put: function(name, data) {
			return xhr("PUT", this.location + name, {
				data: JSON.stringify(data),
				headers: {
					"Orion-Version": "1"
				},
				contentType: "application/json;charset=UTF-8",
				timeout: 15000
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		},
		remove: function(name, key){
			return xhr("DELETE", this.location + name +"?key=" + key, {
				headers: {
					"Orion-Version": "1"
				},
				contentType: "application/json;charset=UTF-8",
				timeout: 15000
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		}
	};
	return PreferencesProvider;
});