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

define(['i18n!cfui/nls/messages','require', 'orion/xhr', 'orion/Deferred', 'orion/plugin', 'orion/cfui/cFClient', 'orion/serviceregistry', 
        'orion/preferences', 'orion/URITemplate', 'orion/PageLinks', 'domReady!'],
		function(messages,require, xhr, Deferred, PluginProvider, CFClient, ServiceRegistry, Preferences, URITemplate,
			PageLinks) {

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

	// Add "Deploy" category to hamburger
//	provider.registerService("orion.page.link.category", null, {
//		id: "deploy",
//		nameKey: "Deploy",
//		nls: "orion/edit/nls/messages",
//		imageClass: "core-sprite-deploy",
//		order: 60
//	});

	// initialize service registry and EAS services
	var serviceRegistry = new ServiceRegistry.ServiceRegistry();
	
	temp.href = "../../prefs/user";
	var location = temp.href;
	
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
	
	var service = new PreferencesProvider(location);
	serviceRegistry.registerService("orion.core.preference.provider", service, {});

	// cf settings
	var apiUrl = "";
	var manageUrl = "";
	provider.registerService("orion.core.setting", null, {
		settings: [{
			pid: "org.eclipse.orion.client.cf.settings",
			name: messages['Settings'],
			category: messages['Cloud'],
			properties: [{
				id: "targetUrl",
				name: messages['API URL'],
				type: "string",
				defaultValue: apiUrl
			}, {
				id: "manageUrl",
				name: messages['Manage URL'],
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
				return cFService.setTarget(args.url, args.org, args.space).then(function(result) {
					if (result) {
						return "target: " + result.Url;
					} else {
						return "Target not set";
					}
				});
			} else {
				return cFService.getTarget().then(function(result) {
					return "target: " + result.Url;
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
				name: "org",
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
	
	/** Add cf info command **/
	var infoImpl = {
		callback: function(args) {
			return cFService.getInfo().then(function(result) {
				var value = result.description + 
					"\nversion: " + result.version +
					"\nsupport: " + result.support;
				
				if (result.user) {
					value += "\n\nuser: " + result.user;
				}
				
				return value;
			});
		}
	};
	
	provider.registerServiceProvider(
		"orion.shell.command",
		infoImpl, {
			name: "cfo info",
			description: "Display information on the current target, user, etc."
		}
	);
	
	/** Add cf login command **/
	var loginImpl = {
		callback: function(args) {
			return cFService.login(null, args.username, args.password,
				args.org, args.space).then(function(result) {
					return "Logged in";
				}
			);
		}
	};
	
	provider.registerServiceProvider(
		"orion.shell.command",
		loginImpl, {
			name: "cfo login",
			description: "Log user in",
			parameters: [{
				name: "username",
				type: "string",
				description: "Username",
				defaultValue: null
			}, {
				name: "password",
				type: "string",
				description: "Password",
				defaultValue: null
			}, {
				name: "org",
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

	/** Add cf logout command **/
	var logoutImpl = {
		callback: function(args) {
			return cFService.logout().then(function(result) {
				return "Logged out";
			});
		}
	};
	
	provider.registerServiceProvider(
		"orion.shell.command",
		logoutImpl, {
			name: "cfo logout",
			description: "Log user out"
		}
	);
	
	/** Add cf apps command **/
	function describeApp(app) {
		var name = app.name;
		var strResult = "\n" + name + "\t";
		if (name.length <= 4) {
			strResult += "\t";
		}
		strResult += app.state + "\t";
		var runningInstances = app.runningInstances;
		if (!runningInstances) {
			runningInstances = 0;
		}
		var mem = app.memory;
		strResult += runningInstances + " x " + mem + "M\t";
		var url = app.urls[0];
		strResult += "\t[" + url + "](http://" + url + ")";
		return strResult;
	}
	
	var appsImpl = {
		callback: function(args) {
			return cFService.getApps().then(function(result) {
				result = result.apps;
				
				if (!result || result.length === 0) {
					return "No applications.";
				}
				var strResult = "\nname\tstate\tinstances\tmemory\tdisk\turls\n";
				result.forEach(function(app) {
					strResult += describeApp(app);
				});
				return strResult;
			});
		}
	};
	
	provider.registerServiceProvider(
		"orion.shell.command",
		appsImpl, {
			name: "cfo apps",
			description: "List all apps in the target space"
		}
	);

	/** Add cf app command **/
	function describeAppVerbose(app) {
		var name = app.name;
		var strResult = "\n" + name + ": ";
		var runningInstances = app.runningInstances;
		var instances = app.instances;
		if (!runningInstances) {
			runningInstances = 0;
		}
		var percentage = runningInstances / instances * 100;
		strResult += percentage + "%\n\tplatform: ";
		strResult += "\n\tusage: " + app.memory + "M x ";
		strResult += runningInstances + " instance(s)";
		strResult += "\n\turls:";
		
		if (app.urls)
			app.urls.forEach(function(url) {
				strResult += "\n\t\t[" + url + "](http://" + url + ")";
			});
		/**if (app.services && app.services.length > 0) {
			strResult += "\n\tservices:";
			app.services.forEach(function(service) {
				strResult += "\n\t\t" + service;
			});
		}**/
		return strResult;
	}
	
	var appImpl = {
		callback: function(args, context) {
			return cFService.getApp(null, args.app, context.cwd).then(function(result) {
				if (!result) {
					return "Application not found";
				}
				return describeAppVerbose(result);
			});
		}
	};
	
	provider.registerServiceProvider(
		"orion.shell.command",
		appImpl, {
			name: "cfo app",
			description: "Display health and status for app",
			parameters: [{
				name: "app",
				type: "string",
				description: "Application to show information for",
				defaultValue: null
			}]
		}
	);
	
	/** Add cf push command **/
	var pushImpl = {
		callback: function(args, context) {
			return cFService.pushApp(null, args.app, decodeURIComponent(context.cwd)).then(function(result) {
				if (!result || !result.applications) {
					return "Application not found";
				}
				var strResult = "";
				result.applications.forEach(function(item) {
					var uri = item.uris[0];
					strResult += "\nApplication " + item.name + " ready at: [" + uri + "](http://" + uri + ")";
				});
				return strResult;
			});
		}
	};
	
	provider.registerServiceProvider(
		"orion.shell.command",
		pushImpl, {
			name: "cfo push",
			description: "Push a new app or sync changes to an existing app",
			parameters: [{
				name: "app",
				type: "string",
				description: "Application to push",
				defaultValue: null
			}]
		}
	);
	
	/** Add cf start command **/
	var startImpl = {
		callback: function(args, context) {
			return cFService.startApp(null, args.app, context.cwd).then(function(result) {
				if (!result || !result.entity) {
					return "Application not found";
				}
				var app = result.entity;
				if (app.state === "STARTED"){
					return "Application " + app.name + " started";
				} else {
					return "Problems while starting application " + app.name;
				}
			});
		}
	};
	
	provider.registerServiceProvider(
		"orion.shell.command",
		startImpl, {
			name: "cfo start",
			description: "Start an application",
			parameters: [{
				name: "app",
				type: "string",
				description: "Application to start",
				defaultValue: null
			}]
		}
	);

	/** Add cf stop command **/
	var stopImpl = {
		callback: function(args, context) {
			return cFService.stopApp(null, args.app, context.cwd).then(function(result) {
				if (!result || !result.entity) {
					return "Application not found";
				}
				var app = result.entity;
				if (app.state === "STOPPED"){
					return "Application " + app.name + " stopped";
				} else {
					return "Problems while stopping application " + app.name;
				}
			});
		}
	};
	
	provider.registerServiceProvider(
		"orion.shell.command",
		stopImpl, {
			name: "cfo stop",
			description: "Stop an application",
			parameters: [{
				name: "app",
				type: "string",
				description: "Application to stop",
				defaultValue: null
			}]
		}
	);
	
	/** Add cf delete command **/
	/** var deleteImpl = {
		callback: function(args, context) {
			return cFService.deleteApp(args.app, context.cwd).then(function(result) {
				if (!result || !result.applications) {
					return "No applications found";
				}
				var strResult = "";
				result.applications.forEach(function(item) {
					strResult += "\nDeleted " + item.name;
				});
				return strResult;
			});
		}
	};
	
	provider.registerServiceProvider(
		"orion.shell.command",
		deleteImpl, {
			name: "cfo delete",
			description: "Delete an application",
			parameters: [{
				name: "app",
				type: "string",
				description: "Application to delete",
				defaultValue: null
			}]
		}
	); **/

	provider.connect();
});
