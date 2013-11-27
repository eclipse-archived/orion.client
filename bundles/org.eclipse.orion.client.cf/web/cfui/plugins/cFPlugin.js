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

define(["orion/xhr", "orion/Deferred", "orion/plugin", "orion/cfui/cFClient", "domReady!"],

function(xhr, Deferred, PluginProvider, CFClient) {

	var temp = document.createElement('a');
	var login = temp.href;
	
	var headers = {
		name: "Cloud Foundry",
		version: "1.0",
		description: "This plugin integrates with Cloud Foundry.",
		//login: login
	};


	var provider = new PluginProvider(headers);
	var cFService = new CFClient.CFService();

	// cf settings
	var apiUrl = "";
	var manageUrl = "";
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
	
	/////////////////////////////////////////////////////
	// add CF shell commands
	/////////////////////////////////////////////////////

	/** Register parent cf root command **/
	provider.registerServiceProvider(
		"orion.shell.command", null, {
		name: "cfo",
		description: "Commands for interacting with a Cloud Foundry compatible target"
	});
	
	/** Add cf target command **/
	var targetImpl = {
		callback: function(args) {
			if (args.url) {
				return cFService.setTarget(args.url).then(function(result) {
					if (result) {
						return "target: " + result.target;
					} else {
						return "Target not set";
					}
				});
			} else {
				return cFService.getTarget().then(function(result) {
					return "target: " + result.target;
				});
			}
		}
	};
	
	provider.registerServiceProvider(
		"orion.shell.command",
		targetImpl, {
			name: "cfo target",
			description: "Set or display the target cloud, organization, and space",
			parameters: [{
				name: "url",
				type: "string",
				description: "Target URL to switch to",
				defaultValue: null
			}, {
				name: "organization",
				type: "string",
				description: "Organization",
				defaultValue: null
			}, {
				name: "space",
				type: "string",
				description: "Space",
				defaultValue: null
			}]
		}
	);

	provider.connect();
});