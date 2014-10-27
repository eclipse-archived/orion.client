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

define(['i18n!cfui/nls/messages', 'orion/bootstrap', 'orion/Deferred', 'orion/cfui/cFClient', 'cfui/cfUtil', 'orion/URITemplate', 'orion/serviceregistry', 
        'orion/preferences', 'orion/PageLinks', 'orion/xhr', 'orion/i18nUtil'],
        function(messages, mBootstrap, Deferred, CFClient, mCfUtil, URITemplate, ServiceRegistry, mPreferences, PageLinks, xhr, i18Util){
	
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
				var message = messages["deployingApplicationToCloudFoundry:"];
				if(launchConf.ConfigurationName){
					return message + " " + launchConf.ConfigurationName;
				}
				var params = launchConf.Parameters || {};
				var appName = params.Name;
				if(!appName){
					var manifestFolder = params.AppPath || "";
					manifestFolder = manifestFolder.substring(0, manifestFolder.lastIndexOf("/")+1);
					appName = messages["applicationFrom/"] + manifestFolder + "manifest.yml";
				}
				
				message += appName;
				
				if(params.Target){
					message += messages["on"] + params.Target.Space + " / " + params.Target.Org;
				}
				
				return message;
			},
			
			deploy: function(project, launchConf) {
				var that = this;
				var deferred = new Deferred();

				var params = launchConf.Parameters || {};
				var target = params.Target;
				if (!target && params.url){
					target = {};
					target.Url = params.url;
				}
				var appName = params.Name;
				var appPath = launchConf.Path;
				
				if(params.user && params.password){
					cFService.login(target.Url, params.user, params.password).then(
						function(result){
							that._deploy(project, target, appName, appPath, deferred);
						}, function(error){
							error.Retry = {
								parameters: [{id: "user", type: "text", name: messages["user:"]}, {id: "password", type: "password", name: messages["password:"]}]
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
							mCfUtil.prepareLaunchConfigurationContent(result, appPath, editLocation, project.ContentLocation).then(
								function(launchConfigurationContent){
									deferred.resolve(launchConfigurationContent);
								}, function(error){
									deferred.reject(error);
								}
							);
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
										parameters: [{id: "user", type: "text", name: messages["user:"]}, {id: "password", type: "password", name: messages["password:"]}]
									};
								}
								deferred.reject(error);
							} else {
								deferred.reject(error);
							}
						}
					);
				} else {
					
					/* Note, that there's at least one deployment wizard present */
					var wizardReferences = serviceRegistry.getServiceReferences("orion.project.deploy.wizard");
						
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
								
							var wizard;
							wizardReferences.forEach(function(ref){
								if(ref.getProperty("id") === plan.Wizard && !wizard)
									wizard = ref;
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
						} else {
								
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
								var generic;
								feasibleDeployments.forEach(function(deployment){
									if(deployment.plan.ApplicationType === "generic" && !generic)
										generic = deployment;
								});
								
								var deployment = generic;
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
						}
					});
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
								parameters: [{id: "user", type: "text", name: messages["user:"]}, {id: "password", type: "password", name: messages["password:"]}]
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
								Message: app.running_instances + messages["of"] + app.instances + messages["instance(s)Running"]
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
										parameters: [{id: "user", type: "text", name: messages["user:"]}, {id: "password", type: "password", name: messages["password:"]}]
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
										parameters: [{id: "user", type: "text", name: messages["user:"]}, {id: "password", type: "password", name: messages["password:"]}]
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
								Message: messages["applicationIsNotRunning"]
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
										parameters: [{id: "user", type: "text", name: messages["user:"]}, {id: "password", type: "password", name: messages["password:"]}]
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
					Message: flappingInstances > 0 ?  i18Util.formatMessage(messages["${0}/${1}Instance(s)Running,${2}Flapping"], runningInstances, instances, flappingInstances) : i18Util.formatMessage(messages["${0}/${1}Instance(s)Running"], runningInstances, instances)
				};
			}
		};
		
		deferred.resolve({
			DeployService: DeployService
		});
	});
	
	return deferred;
});
