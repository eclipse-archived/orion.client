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

/*global window define document*/

define(['orion/Deferred', 'orion/cfui/cFClient', 'orion/URITemplate', 'orion/serviceregistry', 
        'orion/preferences', 'orion/PageLinks', 'orion/xhr'],
        function(Deferred, CFClient, URITemplate, ServiceRegistry, Preferences, PageLinks, xhr){
	
	var cFService = new CFClient.CFService();
	
	// initialize service registry and EAS services
	var serviceRegistry = new ServiceRegistry.ServiceRegistry();
	
	var temp = document.createElement('a');
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

	// This is code to ensure the first visit to orion works
	// we read settings and wait for the plugin registry to fully startup before continuing
	var preferences = new Preferences.PreferencesService(serviceRegistry);
	
	function DeployService(){
	};
	
	DeployService.prototype = {
			
			constructor: DeployService,
			
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
						var params = launchConf.Params || {};
						
						var target = params.Target || defaultTarget;
						var appName = params.Name;
						var appPath = launchConf.Path;
						
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
					deferred.resolve({UriTemplate: "{+OrionHome}/cfui/deploy.html#" + project.ContentLocation + appPath, 
						Width: "400px", 
						Height: "300px",
						UriTemplateId: "org.eclipse.orion.client.cf.deploy.uritemplate"});
					
//					cFService.pushApp(target, null, decodeURIComponent(project.ContentLocation + appPath)).then(
//						function(result){
//							deferred.resolve({
//								CheckState: true,
//								ToSave: {
//									ConfigurationName: result.App.entity.name + " on " + result.Target.Space.Name + " / " + result.Target.Org.Name,
//									Parameters: {
//										Target: {
//											Url: result.Target.Url,
//											Org: result.Target.Org.Name,
//											Space: result.Target.Space.Name
//										},
//										Name: result.App.entity.name
//									},
//									Url: "http://" + result.Route.entity.host + "." + result.Domain,
//									UrlTitle: result.App.entity.name,
//									Type: "Cloud Foundry",
//									ManageUrl: result.ManageUrl,
//									Path: appPath
//								}
//							});
//						}, function(error){
//							if (error.HttpCode === 404){
//								deferred.resolve({
//									State: "NOT_DEPLOYED",
//									Message: error.Message
//								});
//							} else if (error.JsonData && error.JsonData.error_code) {
//								var err = error.JsonData;
//								if (err.error_code === "CF-InvalidAuthToken"){
//									error.Retry = {
//										parameters: [{id: "user", type: "text", name: "User:"}, {id: "password", type: "password", name: "Password:"}]
//									};
//								} else if (err.error_code === "CF-TargetNotSet"){
//									var cloudSettingsPageUrl = new URITemplate("{+OrionHome}/settings/settings.html#,category=Cloud").expand({OrionHome : PageLinks.getOrionHome()});
//									error.Message = "Set up your Cloud. Go to [Settings](" + cloudSettingsPageUrl + ")."; 
//									deferred.reject(error);
//								}
//								deferred.reject(error);
//							} else {
//								deferred.reject(error);
//							}
//						}
//					);
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
		};
	
	return {
		DeployService: DeployService
	};
});
