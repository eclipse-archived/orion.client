/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global window document define setTimeout*/

define(["orion/xhr", "orion/Deferred", "orion/plugin", "domReady!"],

function(xhr, Deferred, PluginProvider) {

	var temp = document.createElement('a');
	var login = temp.href;
	
	var headers = {
		name: "Cloud Foundry",
		version: "1.0",
		description: "This plugin integrates with Cloud Foundry.",
		//login: login
	};


	var provider = new PluginProvider(headers);

	// cf settings
	var apiUrl = "";
	var aceUrl = "";
	provider.registerService("orion.core.setting", null, {
		settings: [{
			pid: "org.eclipse.orion.client.cf.settings",
			name: "Settings",
			category: 'Cloud Foundry',
			properties: [{
				id: "org.eclipse.orion.client.cf.settings.apiurl",
				name: "API Url",
				type: "string",
				defaultValue: apiUrl
			}, {
				id: "org.eclipse.orion.client.cf.settings.manageurl",
				name: "ACE / Manage Url",
				type: "string",
				defaultValue: manageUrl
			}]
		}]
	});

	provider.connect();
});