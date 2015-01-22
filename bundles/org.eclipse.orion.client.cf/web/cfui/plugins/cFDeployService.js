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
/*global URL confirm*/
define(['i18n!cfui/nls/messages', 'orion/bootstrap', 'orion/Deferred', 'orion/cfui/cFClient',
	'cfui/cfUtil', 'orion/fileClient', 'orion/URITemplate', 'orion/preferences', 'orion/PageLinks',
	'orion/xhr', 'orion/i18nUtil', 'orion/projectClient'],

function(messages, mBootstrap, Deferred, CFClient, mCfUtil, mFileClient, URITemplate, 
		mPreferences, PageLinks, xhr, i18nUtil, mProjectClient) {

	function PreferencesProvider(location) {
		this.location = location;
	}

	PreferencesProvider.prototype = {
		get: function(name) {
			return xhr("GET", this.location + name, { //$NON-NLS-0$
				headers: {
					"Orion-Version": "1" //$NON-NLS-0$ //$NON-NLS-1$
				},
				timeout: 15000,
				log: false
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		},
		put: function(name, data) {
			return xhr("PUT", this.location + name, { //$NON-NLS-0$
				data: JSON.stringify(data),
				headers: {
					"Orion-Version": "1" //$NON-NLS-0$ //$NON-NLS-1$
				},
				contentType: "application/json;charset=UTF-8", //$NON-NLS-0$
				timeout: 15000
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		},
		remove: function(name, key) {
			return xhr("DELETE", this.location + name + "?key=" + key, { //$NON-NLS-0$ //$NON-NLS-1$
				headers: {
					"Orion-Version": "1" //$NON-NLS-0$ //$NON-NLS-1$
				},
				contentType: "application/json;charset=UTF-8", //$NON-NLS-0$
				timeout: 15000
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		}
	};

	var serviceRegistry;
	var fileClient;
	var cFService;
	var preferences;
	var projectClient;

	var init = mBootstrap.startup().then(function(core) {
		serviceRegistry = core.serviceRegistry;
		fileClient = new mFileClient.FileClient(serviceRegistry);

		cFService = new CFClient.CFService();

		/* register hacked pref service */
		var temp = document.createElement('a'); //$NON-NLS-0$
		temp.href = "../prefs/user"; //$NON-NLS-0$
		var location = temp.href;


		var service = new PreferencesProvider(location);
		serviceRegistry.registerService("orion.core.preference.provider", service, {}); //$NON-NLS-0$
		preferences = new mPreferences.PreferencesService(serviceRegistry);

		/* used to interact with launch configurations */
		projectClient = new mProjectClient.ProjectClient(serviceRegistry, fileClient);
	});

	function DeployService() {}
	DeployService.prototype = {

		constructor: DeployService,

		_getTargets: function() {
			return mCfUtil.getTargets(preferences);
		},

		getDeployProgressMessage: function(project, launchConf) {
			var message = messages["deployingApplicationToCloudFoundry:"];
			if (launchConf.ConfigurationName) {
				return message + " " + launchConf.ConfigurationName; //$NON-NLS-0$
			}
			var params = launchConf.Parameters || {};
			var appName = params.Name;
			if (!appName) {
				var manifestFolder = params.AppPath || "";
				manifestFolder = manifestFolder.substring(0, manifestFolder.lastIndexOf("/") + 1); //$NON-NLS-0$
				appName = messages["applicationFrom/"] + manifestFolder + "manifest.yml"; //$NON-NLS-0$
			}

			message += appName;

			if (params.Target) {
				message += messages["on"] + params.Target.Space + " / " + params.Target.Org; //$NON-NLS-0$
			}

			return message;
		},

		_getAdditionalLaunchConfigurations: function(launchConf, project, rawFile) {
			var deferred = new Deferred();
			projectClient.getLaunchConfigurationsDir(project).then(function(launchConfDir) {

				if (!launchConfDir) {

					deferred.resolve(null);

				} else if (launchConfDir.Children) {
					var sharedConfigurationName = projectClient.normalizeFileName(launchConf.ConfigurationName || launchConf.Name, ".yml");

					var launchConfigurationEntries = launchConfDir.Children;
					for (var i = 0; i < launchConfigurationEntries.length; ++i) {
						var lc = launchConfigurationEntries[i];

						if (lc.Name === sharedConfigurationName) {

							if (rawFile) deferred.resolve(lc);
							else cFService.getManifestInfo(lc.Location, true).then(function(manifest) {
								deferred.resolve(manifest.Contents);
							}, deferred.reject);

							return deferred;
						}
					}

					deferred.resolve(null);

				} else {
					var func = arguments.callee.bind(this);
					fileClient.fetchChildren(launchConfDir.ChildrenLocation).then(function(children) {
						launchConfDir.Children = children;
						func(launchConfDir);
					}.bind(this), deferred.reject);
				}

			}, deferred.reject);

			return deferred;
		},

		deleteAdditionalLaunchConfiguration: function(project, launchConf) {
			var deferred = new Deferred();

			/* delete the additional manifest file if present */
			this._getAdditionalLaunchConfigurations(launchConf, project, true).then(function(manifest) {
				fileClient.deleteFile(manifest.Location).then(deferred.resolve, deferred.reject);
			});

			return deferred;
		},

		_findManifest: function(location){
			var deferred = new Deferred();

			fileClient.fetchChildren(location).then(function(children){

				var manifests = children.filter(function(child) {
					return child.Name === "manifest.yml"; //$NON-NLS-0$
				});

				if(manifests.length === 0)
					deferred.resolve(null);
				else
					deferred.resolve(manifests[0]);

			}, deferred.reject);

			return deferred;
		},

		deploy: function(project, launchConf) {
			var that = this;
			var deferred = new Deferred();

			var params = launchConf.Parameters || {};
			var target = params.Target;
			if (!target && params.url) {
				target = {};
				target.Url = params.url;
			}

			var appName = params.Name;
			var appPath = launchConf.Path;

			if (params.user && params.password) {
				cFService.login(target.Url, params.user, params.password).then(

				function() {
					that._deploy(project, target, appName, appPath, deferred, launchConf, params);
				}, function(error) {

					/* default cf error message decoration */
					error = mCfUtil.defaultDecorateError(error, target);
					deferred.reject(error);
				});
			} else {
				that._deploy(project, target, appName, appPath, deferred, launchConf, params);
			}

			return deferred;
		},

		/* determines the deployment paths using the selected folder and project location. */
		_getDeploymentPaths: function(project, relativeFilePath, appPath){
			var deferred = new Deferred();
			var self = this;

			if(project.ContentLocation === relativeFilePath){
				/* use the project root as deployment path */
				deferred.resolve({
					path: relativeFilePath,
					appPath: appPath
				});

				return deferred;
			}

			/* check if there's a manifest in the selected sub-folder */
			self._findManifest(relativeFilePath).then(function(manifest){

				if(manifest !== null)
					/* use the sub-folder manifest */
					deferred.resolve({
						path: relativeFilePath,
						appPath: appPath
					});
				else
					/* use the project as deployment path */
					deferred.resolve({
						path: project.ContentLocation,
						appPath: "" /* Note that the appPath has to be updated as well */
					});

			}, deferred.reject);

			return deferred;
		},

		_deploy: function(project, target, appName, appPath, deferred, launchConf, launchConfParams) {
			if (target && appName) {

				var errorHandler = function(error) {

					/* default cf error message decoration */
					error = mCfUtil.defaultDecorateError(error, target);
					if (error.HttpCode === 404) deferred.resolve(error);
					else deferred.reject(error);
				};

				var self = this;
				this._getAdditionalLaunchConfigurations(launchConf, project).then(function(manifest) {
					var func = arguments.callee.bind(this);

					if (manifest === null) {
						/* could not find the launch configuration manifest, get the main manifest.yml if present */
						self._findManifest(project.ContentLocation).then(function(manifest) {

							if (manifest === null) {

								/* the deployment will not succeed anyway */
								deferred.reject({
									State: "NOT_DEPLOYED", //$NON-NLS-0$
									Severity: "Error", //$NON-NLS-0$
									Message: messages["Could not find the launch configuration manifest"]
								});

							} else {

								cFService.getManifestInfo(manifest.Location, true).then(function(manifest) {
									func(manifest.Contents);
								}, deferred.reject);

								/* Uncomment to re-enable confirmation */
								/*if(confirm(messages["Would you like to use the top-level project manifest"])){
									cFService.getManifestInfo(manifests[0].Location, true).then(function(manifest){
										func(manifest.Contents);
									}, deferred.reject);
								} else {
									deferred.reject({
										State: "NOT_DEPLOYED", //$NON-NLS-0$
										Severity: "Warning", //$NON-NLS-0$
										Message: messages["Cancelled"]
									});
								}*/
							}
						}.bind(this), errorHandler);
					} else {
						var devMode = launchConfParams.DevMode;
						var appPackager;
						var instrumentation;
						if (devMode && devMode.On) {
							appPackager = devMode.Packager;
							instrumentation = devMode.Instrumentation;
						}

						cFService.pushApp(target, appName, decodeURIComponent(project.ContentLocation + appPath), manifest, false, appPackager, instrumentation).then(function(result) {

							var expandedURL = new URITemplate("{+OrionHome}/edit/edit.html#{,ContentLocation}").expand({ //$NON-NLS-0$
								OrionHome: PageLinks.getOrionHome(),
								ContentLocation: project.ContentLocation,
							});

							var editLocation = new URL(expandedURL);
							var additionalConfiguration = {
								Manifest: manifest,
								DevMode: devMode
							};

							mCfUtil.prepareLaunchConfigurationContent(result, appPath, editLocation, project.ContentLocation, fileClient, additionalConfiguration).then(
							deferred.resolve, deferred.reject);
						}, errorHandler);
					}
				}, errorHandler);

			} else {

				/* Note, that there's at least one deployment wizard present */
				var wizardReferences = serviceRegistry.getServiceReferences("orion.project.deploy.wizard"); //$NON-NLS-0$

				/* figure out which deployment plan & wizard to use */
				var relativeFilePath = new URL(project.ContentLocation + appPath).href;
				var orionHomeUrl = new URL(PageLinks.getOrionHome());
				
				if (relativeFilePath.indexOf(orionHomeUrl.origin) === 0) relativeFilePath = relativeFilePath.substring(orionHomeUrl.origin.length);

				this._getDeploymentPaths(project, relativeFilePath, appPath).then(function(paths){

					if (relativeFilePath.indexOf(orionHomeUrl.pathname) === 0) relativeFilePath = relativeFilePath.substring(orionHomeUrl.pathname.length);
					
					/* update paths according to the current policy */
					var path = paths.path;
					appPath = paths.appPath;

					cFService.getDeploymentPlans(path).then(function(resp) {
						var plans = resp.Children;

						/* find feasible deployments */
						var feasibleDeployments = [];
						plans.forEach(function(plan) {

							var wizard;
							wizardReferences.forEach(function(ref) {
								if (ref.getProperty("id") === plan.Wizard && !wizard) //$NON-NLS-0$
								wizard = ref;
							});

							if (wizard) {
								feasibleDeployments.push({
									wizard: serviceRegistry.getService(wizard),
									plan: plan
								});
							}
						});

						var nonGenerics = feasibleDeployments.filter(function(deployment) {
							return deployment.plan.ApplicationType !== "generic"; //$NON-NLS-0$
						});

						/* single deployment scenario */
						if (feasibleDeployments.length === 1) {
							var deployment = feasibleDeployments[0];
							deployment.wizard.getInitializationParameters().then(function(initParams) {
								deferred.resolve({
									UriTemplate: initParams.LocationTemplate + "#" + encodeURIComponent(JSON.stringify({ //$NON-NLS-0$
										ContentLocation: project.ContentLocation,
										AppPath: appPath,
										Plan: deployment.plan
									})),
									Width: initParams.Width,
									Height: initParams.Height,
									UriTemplateId: "org.eclipse.orion.client.cf.deploy.uritemplate" //$NON-NLS-0$
								});
							});
						} else {

							if (nonGenerics[0].plan.Required.length === 0) {
								/* multiple deployment scenarios, but a single non-generic */
								var deployment = nonGenerics[0];
								deployment.wizard.getInitializationParameters().then(function(initParams) {
									deferred.resolve({
										UriTemplate: initParams.LocationTemplate + "#" + encodeURIComponent(JSON.stringify({ //$NON-NLS-0$
											ContentLocation: project.ContentLocation,
											AppPath: appPath,
											Plan: deployment.plan
										})),
										Width: initParams.Width,
										Height: initParams.Height,
										UriTemplateId: "org.eclipse.orion.client.cf.deploy.uritemplate" //$NON-NLS-0$
									});
								});
							} else {
								/* TODO: Support this case in wizards */
								var generic;
								feasibleDeployments.forEach(function(deployment) {
									if (deployment.plan.ApplicationType === "generic" && !generic) //$NON-NLS-0$
									generic = deployment;
								});

								var deployment = generic;
								deployment.wizard.getInitializationParameters().then(function(initParams) {
									deferred.resolve({
										UriTemplate: initParams.LocationTemplate + "#" + encodeURIComponent(JSON.stringify({ //$NON-NLS-0$
											ContentLocation: project.ContentLocation,
											AppPath: appPath,
											Plan: deployment.plan
										})),
										Width: initParams.Width,
										Height: initParams.Height,
										UriTemplateId: "org.eclipse.orion.client.cf.deploy.uritemplate" //$NON-NLS-0$
									});
								});
							}
						}
					});

				}, deferred.reject);
			}
		},

		_retryWithLogin: function(props, func) {
			var deferred = new Deferred();

			if (props.user && props.password) {
				cFService.login(props.Target.Url, props.user, props.password).then(

				function() {
					func(props, deferred);
				}, function(error) {
					error.Retry = {
						parameters: [{
							id: "user", //$NON-NLS-0$
							type: "text", //$NON-NLS-0$
							name: messages["user:"]
						}, {
							id: "password", //$NON-NLS-0$
							type: "password", //$NON-NLS-0$
							name: messages["password:"]
						}]
					};
					deferred.reject(error);
				});
			} else {
				func(props, deferred);
			}

			return deferred;
		},

		getState: function(launchConf) {
			var params = launchConf.Params || {};
			return this._retryWithLogin(params, this._getStateCF.bind(this));
		},

		_getStateCF: function(params, deferred) {
			var that = this;
			
			if (params.Target && params.Name) {
				cFService.getApp(params.Target, params.Name).then(
					function(result) {
						var app = result;
						var appState = {
							State: (app.running_instances > 0 ? "STARTED" : "STOPPED"), //$NON-NLS-0$//$NON-NLS-1$
							Message: i18nUtil.formatMessage(messages["${0}of${1}instance(s)Running"], app.running_instances, app.instances)
						}
						
						that._getRoutes(params.Target, params.Name).then(
							function(routes){
								if (routes.length > 0)
									appState.Url = "https://" + routes[0].host + "." + routes[0].domain.name;
								
								deferred.resolve(appState);
							}, function(error){
								deferred.resolve(appState);
							}
						);
					}, function(error) {
						/* default cf error message decoration */
						error = mCfUtil.defaultDecorateError(error, params.Target);
						if (error.HttpCode === 404) deferred.resolve(error);
						else deferred.reject(error);
					}
				);
				return deferred;
			}
		},
		
		_getRoutes: function(target, name){
			return cFService.getApp(target, name).then(
				function(result) {
					return result.routes;
				}
			);
		},

		start: function(launchConf) {
			var params = launchConf.Params || {};
			return this._retryWithLogin(params, this._startCF.bind(this));
		},

		_startCF: function(params, deferred) {
			var that = this;
			if (params.Target && params.Name) {
				cFService.startApp(params.Target, params.Name, undefined, params.Timeout).then(

				function(result) {
					deferred.resolve(that._prepareAppStateMessage(result));
				}, function(error) {

					/* default cf error message decoration */
					error = mCfUtil.defaultDecorateError(error, params.Target);
					if (error.HttpCode === 404) deferred.resolve(error);
					else deferred.reject(error);
				});
				return deferred;
			}
		},

		stop: function(launchConf) {
			var params = launchConf.Params || {};
			return this._retryWithLogin(params, this._stopCF);
		},

		_stopCF: function(params, deferred) {
			if (params.Target && params.Name) {
				cFService.stopApp(params.Target, params.Name).then(

				function(result) {
					if (result.state) {
						deferred.resolve({
							State: (result.state !== "stop" ? "STARTED" : "STOPPED"), //$NON-NLS-0$//$NON-NLS-1$
							Message: "Application in debug mode [" + result.state + "]"
						});
						return;
					}

					var app = result.entity;
					deferred.resolve({
						State: (app.state === "STARTED" ? "STARTED" : "STOPPED"), //$NON-NLS-0$//$NON-NLS-1$ //$NON-NLS-2$
						Message: messages["applicationIsNotRunning"]
					});
				}, function(error) {

					/* default cf error message decoration */
					error = mCfUtil.defaultDecorateError(error, params.Target);
					if (error.HttpCode === 404) deferred.resolve(error);
					else deferred.reject(error);
				});
				return deferred;
			}
		},

		_prepareAppStateMessage: function(appInstances) {
			if (appInstances.state) {
				return {
					State: (appInstances.state !== "stop" ? "STARTED" : "STOPPED"), //$NON-NLS-0$//$NON-NLS-1$
					Message: "Application in debug mode"
				};
			}
			var instances = 0;
			var runningInstances = 0;
			var flappingInstances = 0;
			for (var key in appInstances) {
				var instance = appInstances[key];
				instances++;
				if (instance.state === "RUNNING") //$NON-NLS-0$
				runningInstances++;
				else if (instance.state === "FLAPPING") //$NON-NLS-0$
				flappingInstances++;
			}
			return {
				State: (runningInstances > 0 ? "STARTED" : "STOPPED"), //$NON-NLS-0$ //$NON-NLS-1$
				Message: flappingInstances > 0 ? i18nUtil.formatMessage(messages["${0}/${1}Instance(s)Running,${2}Flapping"], runningInstances, instances, flappingInstances) : i18nUtil.formatMessage(messages["${0}/${1}Instance(s)Running"], runningInstances, instances)
			};
		}
	};

	function createDeferredMethod(instance, method) {
		return function() {
			var args = arguments;
			return init.then(function() {
				return instance[method].apply(instance, Array.prototype.slice.call(args));
			});
		};
	}

	function CFDeployService() {
		var deployService = new DeployService();
		var method;
		for (method in deployService) {
			if (typeof deployService[method] === 'function') { //$NON-NLS-0$
				this[method] = createDeferredMethod(deployService, method);
			}
		}
	}
	return CFDeployService;
});
