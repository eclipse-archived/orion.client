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

define(['require', 'orion/xhr', 'orion/Deferred', 'orion/plugin', 'orion/cfui/cFClient', 'orion/serviceregistry', 
        'orion/preferences', 'orion/URITemplate', 'orion/PageLinks', 'domReady!'],
		function(require, xhr, Deferred, PluginProvider, CFClient, ServiceRegistry, Preferences, URITemplate,
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

	// This is code to ensure the first visit to orion works
	// we read settings and wait for the plugin registry to fully startup before continuing
	var preferences = new Preferences.PreferencesService(serviceRegistry);
	
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
			name: "Settings",
			category: 'Cloud',
			properties: [{
				id: "targetUrl",
				name: "API Url",
				type: "string",
				defaultValue: apiUrl
			}, {
				id: "manageUrl",
				name: "Manage Url",
				type: "string",
				defaultValue: manageUrl
			}]
		}]
	});
	
	/////////////////////////////////////////////////////
	// add CF project deploy action
	/////////////////////////////////////////////////////
	
	provider.registerServiceProvider("orion.project.deploy", {
		
		_getDefaultTarget: function(){
			var deferred = new Deferred();
			preferences.getPreferences('/cm/configurations').then(
				function(settings){
					var cloud = settings.get("org.eclipse.orion.client.cf.settings");
					if (cloud && cloud.targetUrl){
						var target = {};
						target.Url = cloud.targetUrl;
						if (cloud.manageUrl)
							target.ManageUrl = cloud.manageUrl;
						if (cloud.org)
							target.Org = cloud.org;
						if (cloud.space)
							target.Space = cloud.space;
						deferred.resolve(target);
						return;
					}
					
					preferences.getPreferences('/settingsCF', 1).then(
						function(settings){
							var cloud = settings;
							if (cloud && cloud.get("targetUrl")){
								var target = {};
								target.Url = cloud.get("targetUrl");
								if (cloud.get("manageUrl"))
									target.ManageUrl = cloud.get("manageUrl");
								deferred.resolve(target);
								return;
							} else {
								deferred.resolve(null);
							}
						}, function(error){
							deferred.resolve(null);
						}
					);
				}, function(error){
					deferred.resolve(null);
				}
			);
			return deferred;
		},
		
		deploy: function(project, launchConf) {
			var that = this;
			var deferred = new Deferred();
			
			this._getDefaultTarget().then(
				function(defaultTarget){
					var params = launchConf.Params;
					
					var target = (params ? params.Target || defaultTarget : defaultTarget);
					var appName = (params ? params.Name : null);
					var appPath = launchConf.Path;
					
					if(launchConf.user && launchConf.password){
						cFService.login(target.Url, launchConf.user, launchConf.password).then(
							function(result){
								that._deploy(project, target, appName, appPath, deferred);
							}, function(error){
								error.Retry = {
									parameters: [{id: "user", type: "text", name: "User:"}, {id: "password", type: "password", name: "Password:"}]
								};
								deferred.reject(error);
							}
						);
					} else {
						that._deploy(project, target, appName, appPath, deferred);
					}
				}
			);

			return deferred;
		},
		
		_deploy: function(project, target, appName, appPath, deferred) {
			if (target && appName){
				cFService.pushApp(target, appName, decodeURIComponent(project.ContentLocation + appPath)).then(
					function(result){
						deferred.resolve({
							CheckState: true
						});
					}, function(error){
						if (error.HttpCode === 404){
							deferred.resolve({
								State: "NOT_DEPLOYED",
								Message: error.Message
							});
						} else if (error.JsonData && error.JsonData.error_code) {
							var err = error.JsonData;
							if (err.error_code === "CF-InvalidAuthToken"){
								error.Retry = {
									parameters: [{id: "user", type: "text", name: "User:"}, {id: "password", type: "password", name: "Password:"}]
								};
							}
							deferred.reject(error);
						} else {
							deferred.reject(error);
						}
					}
				);
			} else {
//				deferred.resolve({UriTemplate: "{+OrionHome}/cfui/deploy.html#{+Location}", Width: "600px", Height: "400px"});
				cFService.pushApp(target, null, decodeURIComponent(project.ContentLocation + appPath)).then(
					function(result){
						deferred.resolve({
							CheckState: true,
							ToSave: {
								ConfigurationName: result.App.entity.name + " on " + result.Target.Space.Name + " / " + result.Target.Org.Name,
								Parameters: {
									Target: {
										Url: result.Target.Url,
										Org: result.Target.Org.Name,
										Space: result.Target.Space.Name
									},
									Name: result.App.entity.name
								},
								Url: "http://" + result.Route.entity.host + "." + result.Domain,
								ManageUrl: result.ManageUrl,
								Path: appPath
							}
						});
					}, function(error){
						if (error.HttpCode === 404){
							deferred.resolve({
								State: "NOT_DEPLOYED",
								Message: error.Message
							});
						} else if (error.JsonData && error.JsonData.error_code) {
							var err = error.JsonData;
							if (err.error_code === "CF-InvalidAuthToken"){
								error.Retry = {
									parameters: [{id: "user", type: "text", name: "User:"}, {id: "password", type: "password", name: "Password:"}]
								};
							} else if (err.error_code === "CF-TargetNotSet"){
								var cloudSettingsPageUrl = new URITemplate("{+OrionHome}/settings/settings.html#,category=Cloud").expand({OrionHome : PageLinks.getOrionHome()});
								error.Message = "Set up your Cloud. Go to [Settings](" + cloudSettingsPageUrl + ")."; 
								deferred.reject(error);
							}
							deferred.reject(error);
						} else {
							deferred.reject(error);
						}
					}
				);
			}
		},
		
		_retryWithLogin: function(props, func) {
			var that = this;
			var deferred = new Deferred();
			
			if(props.user && props.password){
				cFService.login(props.Target.Url, props.user, props.password).then(
					function(result){
						func(props, deferred);
					}, function(error){
						error.Retry = {
							parameters: [{id: "user", type: "text", name: "User:"}, {id: "password", type: "password", name: "Password:"}]
						};
						deferred.reject(error);
					}
				);
			} else {
				func(props, deferred);
			}
			
			return deferred;
		},
		getLogLocationTemplate: function(props){
			if(props.status && props.status.State === "STARTED"){
				return "{+OrionHome}/cfui/logs.html#{Name,Target*}";
			} else {
				return null;
			}
		},
		getState: function(props) {
			return this._retryWithLogin(props, this._getState);
		},
		
		_getState: function(props, deferred) {
			if (props.Target && props.Name){
				cFService.getApp(props.Target, props.Name).then(
					function(result){
						var app = result;
						deferred.resolve({
							State: (app.running_instances > 0 ? "STARTED": "STOPPED"),
							Message: app.running_instances + " of " + app.instances + " instance(s) running"
						});
					}, function(error){
						if (error.HttpCode === 404){
							deferred.resolve({
								State: "NOT_DEPLOYED",
								Message: error.Message
							});
						} else if (error.JsonData && error.JsonData.error_code) {
							var err = error.JsonData;
							if (err.error_code === "CF-InvalidAuthToken"){
								error.Retry = {
									parameters: [{id: "user", type: "text", name: "User:"}, {id: "password", type: "password", name: "Password:"}]
								};
							}
							deferred.reject(error);
						} else {
							deferred.reject(error);
						}
					}
				);
				return deferred;
			}
		},
		
		start: function(props) {
			return this._retryWithLogin(props, this._start.bind(this));
		},
		
		_start: function(props, deferred) {
			var that = this;
			if (props.Target && props.Name){
				cFService.startApp(props.Target, props.Name).then(
					function(result){
						deferred.resolve(that._prepareAppStateMessage(result));
					}, function(error){
						if (error.HttpCode === 404){
							deferred.resolve({
								State: "NOT_DEPLOYED",
								Message: error.Message
							});
						} else if (error.JsonData && error.JsonData.error_code) {
							var err = error.JsonData;
							if (err.error_code === "CF-InvalidAuthToken"){
								error.Retry = {
									parameters: [{id: "user", type: "text", name: "User:"}, {id: "password", type: "password", name: "Password:"}]
								};
							}
							deferred.reject(error);
						} else {
							deferred.reject(error);
						}
					}
				);
				return deferred;
			}
		},
		
		stop: function(props) {
			return this._retryWithLogin(props, this._stop);
		},
		
		_stop: function (props, deferred) {
			if (props.Target && props.Name){
				cFService.stopApp(props.Target, props.Name).then(
					function(result){
						var app = result.entity;
						deferred.resolve({
							State: (app.state === "STARTED" ? "STARTED" : "STOPPED"),
							Message: "Application is not running"
						});
					}, function(error){
						if (error.HttpCode === 404){
							deferred.resolve({
								State: "NOT_DEPLOYED",
								Message: error.Message
							});
						} else if (error.JsonData && error.JsonData.error_code) {
							var err = error.JsonData;
							if (err.error_code === "CF-InvalidAuthToken"){
								error.Retry = {
									parameters: [{id: "user", type: "text", name: "User:"}, {id: "password", type: "password", name: "Password:"}]
								};
							}
							deferred.reject(error);
						} else {
							deferred.reject(error);
						}
					}
				);
				return deferred;
			}
		},
		
		_prepareAppStateMessage: function(appInstances){
			var instances = 0;
			var runningInstances = 0;
			var flappingInstances = 0;
			for (var key in appInstances) {
				var instance = appInstances[key];
				instances++;
				if (instance.state === "RUNNING")
					runningInstances++;
				else if (instance.state === "FLAPPING")
					flappingInstances++;
			}
			return {
				State: (runningInstances > 0 ? "STARTED": "STOPPED"),
				Message: runningInstances + "/" + instances + " instance(s) running" + (flappingInstances > 0 ? " : " + flappingInstances  + " flapping" : "")
			};
		}
	}, {
		name: "Deploy to Cloud Foundry",
		id: "org.eclipse.orion.client.cf.deploy",
		tooltip: "Deploy application in cloud.",
		validationProperties: [{source: "NoShow" }]
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
