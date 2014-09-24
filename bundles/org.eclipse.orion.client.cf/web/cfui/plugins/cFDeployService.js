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

/*eslint-env browser,amd*/

define(['orion/bootstrap', 'orion/Deferred', 'orion/cfui/cFClient', 'cfui/cfUtil', 'orion/URITemplate', 'orion/serviceregistry', 
        'orion/preferences', 'orion/PageLinks', 'orion/xhr'],
        function(mBootstrap, Deferred, CFClient, mCfUtil, URITemplate, ServiceRegistry, mPreferences, PageLinks, xhr){
	
	var deferred = new Deferred();
	mBootstrap.startup().then(function(core){
		
		var cFService = new CFClient.CFService();
		var serviceRegistry = core.serviceRegistry;
		
		var temp = document.createElement('a');
		temp.href = "../../prefs/user";
		var location = temp.href;
		
		/* register hacked pref service */
		var temp = document.createElement('a');
		temp.href = "../prefs/user";
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
		var preferences = new mPreferences.PreferencesService(serviceRegistry);
		
		function DeployService(){};
		DeployService.prototype = {
				
			constructor: DeployService,
				
			_getTargets: function(){
				return mCfUtil.getTargets(preferences);
			},
			
			getDeployProgressMessage: function(project, launchConf){
				var message = "Deploying application to Cloud Foundry: ";
				if(launchConf.Name){
					return message + " " + launchConf.Name;
				}
				var params = launchConf.Params || {};
				var appName = params.Name;
				if(!appName){
					var manifestFolder = params.AppPath || "";
					manifestFolder = manifestFolder.substring(0, manifestFolder.lastIndexOf("/")+1);
					appName = "application from /" + manifestFolder + "manifest.yml";
				}
				
				message += appName;
				
				if(params.Target){
					message += " on " + params.Target.Space + " / " + params.Target.Org;
				}
				
				return message;
			},
			
			deploy: function(project, launchConf) {
				var that = this;
				var deferred = new Deferred();

				var params = launchConf.Params || {};
				var target = params.Target;
				if (!target && params.url){
					target = {};
					target.Url = params.url;
				}
				var appName = params.Name;
				var appPath = launchConf.Path;
				
				/* TODO: Move to server side */
				if(launchConf.ManageUrl){
					var manageURL = new URL(launchConf.ManageUrl);
					target.ManageUrl = manageURL.origin;
				}
				
				if(params.user && params.password){
					cFService.login(target.Url, params.user, params.password).then(
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

				return deferred;
			},
				
			_deploy: function(project, target, appName, appPath, deferred) {
				if (target && appName){
					cFService.pushApp(target, appName, decodeURIComponent(project.ContentLocation + appPath)).then(
						function(result){
							
							var editLocation = new URL("../edit/edit.html#" + project.ContentLocation, window.location.href);
							deferred.resolve(mCfUtil.prepareLaunchConfigurationContent(result, appPath, editLocation));
							
						}, function(error){
							if (error.HttpCode === 404){
								deferred.resolve({
									State: "NOT_DEPLOYED",
									Message: error.Message
								});
							} else if (error.JsonData && error.JsonData.error_code) {
								var err = error.JsonData;
								if (err.error_code === "CF-InvalidAuthToken" || err.error_code === "CF-NotAuthenticated"){
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
					
					/* find out if any deployment wizards are plugged in */
					var wizardReferences = serviceRegistry.getServiceReferences("orion.project.deploy.wizard");
					if(wizardReferences.length === 0){
						
						/* old-style interactive deploy */
						deferred.resolve({UriTemplate: "{+OrionHome}/cfui/deployInteractive.html#" + encodeURIComponent(JSON.stringify({ContentLocation: project.ContentLocation, AppPath: appPath})), 
							Width: "400px", 
							Height: "350px",
							UriTemplateId: "org.eclipse.orion.client.cf.deploy.uritemplate"});
						
					} else {
						
						/* figure out which deployment plan & wizard to use */
						var relativeFilePath = new URL(project.ContentLocation).href;
						var orionHomeUrl = new URL(PageLinks.getOrionHome());
						
						if(relativeFilePath.indexOf(orionHomeUrl.origin) === 0)
							relativeFilePath = relativeFilePath.substring(orionHomeUrl.origin.length);
						
						if(relativeFilePath.indexOf(orionHomeUrl.pathname) === 0)
							relativeFilePath = relativeFilePath.substring(orionHomeUrl.pathname.length);
						
						cFService.getDeploymentPlans(relativeFilePath).then(function(resp){
							var plans = resp.Children;
							
							/* find feasible deployments */
							var feasibleDeployments = [];
							plans.forEach(function(plan){
								var wizard = wizardReferences.find(function(ref){
									return ref.getProperty("id") === plan.Wizard;
								});
								
								if(wizard){
									feasibleDeployments.push({
										wizard : serviceRegistry.getService(wizard),
										plan : plan
									});
								}
							});
							
							var nonGenerics = feasibleDeployments.filter(function(deployment){
								return deployment.plan.ApplicationType !== "generic";
							});
							
							/* single deployment scenario */
							if(feasibleDeployments.length === 1){
								var deployment = feasibleDeployments[0];
								deployment.wizard.getInitializationParameters().then(function(initParams){
									deferred.resolve({
										UriTemplate : initParams.LocationTemplate + "#" + encodeURIComponent(JSON.stringify({
											ContentLocation: project.ContentLocation,
											AppPath: appPath,
											Plan: deployment.plan
										})),
										Width : initParams.Width,
										Height : initParams.Height,
										UriTemplateId: "org.eclipse.orion.client.cf.deploy.uritemplate"
									});
								});
							} else if(nonGenerics.length === 1) {
								
								if(nonGenerics[0].plan.Required.length === 0){
									/* multiple deployment scenarios, but a single non-generic */
									var deployment = nonGenerics[0];
									deployment.wizard.getInitializationParameters().then(function(initParams){
										deferred.resolve({
											UriTemplate : initParams.LocationTemplate + "#" + encodeURIComponent(JSON.stringify({
												ContentLocation: project.ContentLocation,
												AppPath: appPath,
												Plan: deployment.plan
											})),
											Width : initParams.Width,
											Height : initParams.Height,
											UriTemplateId: "org.eclipse.orion.client.cf.deploy.uritemplate"
										});
									});
								} else {
									/* TODO: Support this case in wizards */
									var generic = feasibleDeployments.find(function(deployment){
										return deployment.plan.ApplicationType === "generic";
									});
									
									deployment.wizard.getInitializationParameters().then(function(initParams){
										deferred.resolve({
											UriTemplate : initParams.LocationTemplate + "#" + encodeURIComponent(JSON.stringify({
												ContentLocation: project.ContentLocation,
												AppPath: appPath,
												Plan: deployment.plan
											})),
											Width : initParams.Width,
											Height : initParams.Height,
											UriTemplateId: "org.eclipse.orion.client.cf.deploy.uritemplate"
										});
									});
								}
							} else {
								
								/* old-style interactive deploy */
								deferred.resolve({UriTemplate: "{+OrionHome}/cfui/deployInteractive.html#" + encodeURIComponent(JSON.stringify({ContentLocation: project.ContentLocation, AppPath: appPath})), 
									Width: "400px", 
									Height: "350px",
									UriTemplateId: "org.eclipse.orion.client.cf.deploy.uritemplate"});
							}
						});
					}
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
								if (err.error_code === "CF-InvalidAuthToken" || err.error_code === "CF-NotAuthenticated"){
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
					cFService.startApp(props.Target, props.Name, undefined, props.Timeout).then(
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
								if (err.error_code === "CF-InvalidAuthToken" || err.error_code === "CF-NotAuthenticated"){
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
								if (err.error_code === "CF-InvalidAuthToken" || err.error_code === "CF-NotAuthenticated"){
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
		};
		
		deferred.resolve({
			DeployService: DeployService
		});
	});
	
	return deferred;
});
