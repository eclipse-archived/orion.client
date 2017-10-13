/*******************************************************************************
 * Copyright (c) 2016, 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node */
var express = require("express");
var api = require("../api"), writeError = api.writeError;
var fileUtil = require("../fileUtil");
var bodyParser = require("body-parser");
var target = require("./target");
var tasks = require("../tasks");
var manifests = require("./manifests");
var domains = require("./domains");
var xfer = require("../xfer");
var fs = require("fs");
var path = require("path");
var async = require("async");
var archiver = require("archiver");
var os = require("os");
var Promise = require("bluebird");
var bluebirdfs = Promise.promisifyAll(require("fs"));
var crypto = require("crypto");
var extService = require("./extService");
var LRU = require("lru-cache");

// Caching for already located targets
var appCache = LRU({max: 1000, maxAge: 30000 });

module.exports.router = function(options) {
	var fileRoot = options.fileRoot;
	if (!fileRoot) { throw new Error('options.fileRoot is required'); }
	
	module.exports._getAppwithAppName = _getAppwithAppName;
	module.exports.getServiceGuid = getServiceGuid;
	module.exports.createService = createService;
	
	return express.Router()
	.use(bodyParser.json())
	.get("*", getapps)
	.put("*", putapps);
	
function getapps(req, res){
	var task = new tasks.Task(res,false,false,0,false);
	var encodeName =  req.query.Name;
	var encodedContentLocation =  req.query.ContentLocation;
	var targetRequest = req.query.Target ? JSON.parse(req.query.Target) : null;
	target.computeTarget(req.user.username, target.fullTarget(req,targetRequest))
	 .then(function(appTarget){
		if(encodeName){
			return getAppwithAppName(req.user.username, task,encodeName,appTarget);
		}else if(encodedContentLocation) {
			var manifestLocation = toOrionLocation(req, api.decodeURIComponent(encodedContentLocation));
			if(manifestLocation){
				return manifests.retrieveManifestFile(req, res, manifestLocation)
				.then(function(manifest){
					if(manifest && manifest.applications &&  manifest.applications[0]){
						return getAppwithAppName(req.user.username, task, manifest.applications[0].name, appTarget);
					}			
				});
			}
		}else{
			return getAppwithoutName(req, task, appTarget);
		}
	 }).catch(function(err){
		 target.caughtErrorHandler(task, err);
	 });
}
function respondAppGetRequest(resp,task){
	if(!resp){
		var errorStatus = new Error("Apps can not be found");
		errorStatus.code = "404";
		return Promise.reject(errorStatus);
	}
	task.done({
		HttpCode: 200,
		Code: 0,
		DetailedMessage: "Ok",
		JsonData: resp,
		Message: "Ok",
		Severity: "Ok"
	});
	return Promise.resolve();
}
function getAppwithoutName(req, task, appTarget){
	var appsArray = [];
	target.cfRequest("GET", req.user.username, appTarget.Url + appTarget.Space.entity.apps_url, {"inline-relations-depth":"2"}, null, null, null, appTarget)
	.then(function(result){
		var appResources = result.resources;
		for(var k = 0; k < appResources.length; k++){
			var routeArray = [];
			var routes = appResources[k].entity.routes;
			for(var j = 0; j < routes.length ; j ++){
				routeArray.push({
					"DomainName":routes[j].entity.domain.entity.name,
 					"Guid":routes[j].metadata.guid,
 					"Host":routes[j].entity.host,
 					"Type" : "Route"
				});
			}
			var appJson = {
				"Guid": appResources[k].metadata.guid,
				"Name": appResources[k].entity.name,
				"Routes": routeArray,
				"State": appResources[k].entity.state,
				"Type":	"App"
			};
			appsArray.push(appJson);
		}
		return {
			"Apps" : appsArray
		};
	}).then(function(result){
		return respondAppGetRequest(result,task);
	});
}
function getAppwithAppName(userId, task,encodeName, appTarget){
	return _getAppwithAppName(userId, encodeName, appTarget)
	.then(function(result){
		return respondAppGetRequest(result && result.appJson,task);
	});
}
function _getAppwithAppName(userId, encodeName, appTarget){
	var app = {};
	
	var cacheKey = appTarget.Url + appTarget.Org + appTarget.Space + encodeName;
	if (appCache.get(cacheKey)) {
		return Promise.resolve(appCache.get(cacheKey));
	}
	return target.cfRequest("GET", userId, appTarget.Url + appTarget.Space.entity.apps_url, {"q": "name:"+api.encodeURIComponent(encodeName),"inline-relations-depth":"1"}, null, null, null, appTarget)
	.then(function(result){
		if(!result.resources || result.resources && result.resources.length === 0){
			return null;
		}
		app.appUrl = result.resources[0].metadata.url;
		app.appMetadata = result.resources[0].metadata;
		return target.cfRequest("GET", userId, appTarget.Url + app.appUrl +"/summary", null, null, null, null, appTarget)
		.then(function(result){
			app.summaryJson = result;
			return target.cfRequest("GET", userId, appTarget.Url + app.appUrl +"/instances", null, null, null, null, appTarget);
		}).then(function(result){
			app.instanceJson = result;
			var appJson;
			appJson = app.summaryJson;
			appJson.instances_details = app.instanceJson;
			
			var appInfo = {"appJson":appJson,"app":app};
			appCache.set(cacheKey, appInfo);
			return appInfo;
		});
	});
}
function toOrionLocation(req, location){
	if(location && location.length !== 0 && location.indexOf(fileRoot) === 0){
		var file = fileUtil.getFile(req, location.substring(fileRoot.length));
		return file.path; 
	}
}
function toAppLocation(req,location){
	if(location && location.length !== 0 && location.indexOf(fileRoot) === 0){
		var file = fileUtil.getFile(req, location.substring(fileRoot.length));
		return path.join(file.workspaceDir, location.replace(fileRoot,"").split("/")[2]);
	}
}
function putapps(req, res){
	var theApp = {};
	//theApp's shape 
	//{
		//appName:
		//appGuid:
		//manifest:
		//summaryJson:
		//instanceJson:
		//appDomain:
		//appRoute:
		//appStore:
		//appPackageType:
		//appUrl:
		//appMetadata:
	//}
	var task = new tasks.Task(res,false,false,0,false);
	var targetRequest = req.body.Target;
//	var path = req.baseUrl.split('\\');
//	if(path[1] === 'routes'){
//		// TODO complete the add route case.
//		var appGuid = path[0];
//		var routeGuid = path[2];
//		Promise.all(getRouteGuidbyGuid(req.user.username, routeGuid,appTarget),getAppbyGuid(req.user.username, appGuid, appTarget))
//		.then(function(resultArray){
//			return mapRoute(req.user.username, resultArray[0],appTarget);
//		});
//	}
	var state = req.body.State;
	var appName = req.body.Name;
	var contentLocation = toOrionLocation(req, req.body.ContentLocation);
	theApp.appStore = toAppLocation(req, req.body.ContentLocation);
	var manifestJSON = req.body.Manifest;
	var instrumentationJSON = req.body.Instrumentation;
	var userTimeout = req.body.Timeout &&  req.body.Timeout > 0 ? req.body.Timeout:0;
	var app = null;
	var manifestAppName = null;
	var restart;
	var appTarget;
	return target.computeTarget(req.user.username, target.fullTarget(req,targetRequest))
	 .then(function(resultTarget){
	 	appTarget = resultTarget;
		if(contentLocation && !state){
			var waitFor;
			if(manifestJSON){
				/* check for non-manifest deployment */
				waitFor = Promise.resolve(manifestJSON);
			}else{
				waitFor = manifests.retrieveManifestFile(req, res, contentLocation);
			}
			return waitFor.then(function(result){
				if(result){
					theApp.manifest = result;
					if(result.applications.length > 0 && result.applications[0].name){
						manifestAppName = result.applications[0].name;
					}
				}
			});
		}
	}).then(function(){
		return _getAppwithAppName(req.user.username, appName? appName : manifestAppName, appTarget)
			.then(function(appResult){
				if(appResult && appResult.app){
					theApp.appUrl=appResult.app.appUrl;
					theApp.appMetadata=appResult.app.appMetadata;
					theApp.summaryJson=appResult.app.summaryJson;
					theApp.instanceJson=appResult.app.instanceJson;
					return app = appResult.app;
				}
			});
	}).then(function(){
		instrumentManifest(theApp.manifest,instrumentationJSON);
		theApp.appName = appName ? appName : manifestAppName;
		if(app){
			var waitFor;
			if(state === "Started"){
				waitFor = startApp(req.user.username, userTimeout,appTarget);
			}else if(state === "Stopped"){
				waitFor = stopApp(req.user.username,appTarget);
			}else{
				if(!theApp.manifest){
					var errorStatus = new Error("Failed to handle request for "+ req.originalUrl);
					errorStatus.code = "500";
					return Promise.reject(errorStatus);
				}
			}
			if(waitFor){
				return Promise.resolve(waitFor)
				.then(function(status){
					if(status){
						return respondAppPutRequest(task,status);
					}
					return;
				});
			}
		}
		function instrumentManifest(manifest,instrumentationJSON){
			if(!instrumentationJSON || !manifest.applications){
				return;
			}
			for(var key in instrumentationJSON){
				var value = instrumentationJSON[key];
				for(var j = 0; j < manifest.applications.length ; j++){
					if(key === "memory" && !updateMemory(manifest.applications[j],value)){
						continue;
					}
					manifest.applications[j][key] = value;
				}
			}
		}
		function updateMemory(application, value){
			if(!application.memory) return true;
			var appMemorystring = normalizeMemoryMeasure(application.memory);
			var instrumentationMemory = normalizeMemoryMeasure(value);
			return instrumentationMemory > appMemorystring;
				
		}
		restart = !app ? false : true;
		return pushApp(req, appTarget)
		.then(function(){
			return _getAppwithAppName(req.user.username, theApp.appName, appTarget)
			.then(function(appResult){
				if(appResult.app){
					theApp.appUrl=appResult.app.appUrl;
					theApp.appMetadata=appResult.app.appMetadata;
					theApp.summaryJson=appResult.app.summaryJson;
					theApp.instanceJson=appResult.app.instanceJson;
				}
			});
		})
		.then(function(){
			if(restart){
				return restartApp(req.user.username, appTarget);
			}
			return startApp(req.user.username, -1, appTarget);
		}).then(function(startRespond){
			return respondAppPutRequest(task,startRespond);
		});
	}).catch(function(err){
		target.caughtErrorHandler(task, err);
	});
	
function respondAppPutRequest(task,status){
	var resp;
	var appJson = {
		entity:theApp.summaryJson,
		metadata:theApp.appMetadata	
	};
	if(status === "RUNNING"){
		var DEFAULT_TIMEOUT = 60;
		resp = {
			"App":appJson,
			"DeployedPackage":theApp.appPackageType || "unknown",
			"Domain":theApp.appDomain,
			"Route": theApp.appRoute,
			"Target" : theApp.appTarget,
			"Timeout": theApp.manifest.applications[0].timeout || DEFAULT_TIMEOUT
		};
		
	}else if(status === "STOPPED"){
		resp = appJson;
	}
	task.done({
		HttpCode: 200,
		Code: 0,
		DetailedMessage: "Ok",
		JsonData: resp,
		Message: "Ok",
		Severity: "Ok"
	});
	return Promise.resolve();
}

function startApp(userId, userTimeout ,appTarget){
	var cacheKey = appTarget.Url + appTarget.Org + appTarget.Space + theApp.appName;
	appCache.del(cacheKey);
	
	var DEFAULT_TIMEOUT = 60;
	var MAX_TIMEOUT = 180;
	var body = {"console":true, "state":"STARTED"};
	return target.cfRequest("PUT", userId, appTarget.Url + theApp.appUrl, {"inline-relations-depth":"1"}, JSON.stringify(body), null, null, appTarget)
	.then(function(parsedBody) {
		if (parsedBody.error_code) {
			return parsedBody;
		}
		if(userTimeout < 0 ){
			userTimeout = theApp.manifest.applications[0].timeout ? theApp.manifest.applications[0].timeout : DEFAULT_TIMEOUT;
		}
		var attemptsLeft = Math.min(userTimeout, MAX_TIMEOUT);
		
		function promiseWhile(value) {
			return Promise.resolve(value).then(function() {
				return collectCFRespond()
			.then(function(result){
				if(!result.data[0] && result.attemptsLeft > 0){
					return promiseWhile(result.attemptsLeft);
				}else if(result.data[0] && result.attemptsLeft > 0){
					var instancesNo = Object.keys(result.data).length;
					var runningInstanceNo = 0;
					var flappingInstanceNo = 0;
					for (var key in result.data) {
						if (result.data.hasOwnProperty(key)) {
							if(result.data[key].state === "RUNNING"){
								runningInstanceNo++;
							}else if(result.data[key].state === "FLAPPING"){
								flappingInstanceNo++;
							}
						}
					}
					if (runningInstanceNo === instancesNo) {
						return "RUNNING";
					}
					if (flappingInstanceNo > 0 ) {
						var errorStatus = new Error("An error occurred during application startup, please refresh page.");
						errorStatus.code = "400";
						return Promise.reject(errorStatus);
					}
					return promiseWhile(result.attemptsLeft);
				}else if(result.attemptsLeft === 0 ){
					var errorStatus = new Error("Application startup process timeout, please refresh page.");
					errorStatus.code = "400";
					return Promise.reject(errorStatus);
				}
				});
			});
		}
		function collectCFRespond(){
			return new Promise(function(fulfill, reject){
				setTimeout(function(){
					return target.cfRequest("GET", userId, appTarget.Url + theApp.appUrl + "/instances", null, null, null, null, appTarget)
					.then(function(result){
						fulfill({"data": result,"attemptsLeft": --attemptsLeft});
					})
					.catch(function(err){
						return reject(err);
					});
				}, 2000);
			});
		}
		return promiseWhile(attemptsLeft);
	});
}

function stopApp(userId, appTarget){
	var cacheKey = appTarget.Url + appTarget.Org + appTarget.Space + theApp.appName;
	appCache.del(cacheKey);
	
	var body = {"console":true,"state":"STOPPED"};
	return target.cfRequest("PUT", userId, appTarget.Url + theApp.appUrl, {"inline-relations-depth":"1"}, JSON.stringify(body), null, null, appTarget)
	.then(function(result){
		return "STOPPED";
	});
}
function restartApp(userId, appTarget){
	return stopApp(userId,appTarget) 
	.then(function(){
		return startApp(userId, -1, appTarget);
	});
}
function pushApp(req, appTarget){
	var cacheKey = appTarget.Url + appTarget.Org + appTarget.Space + theApp.appName;
	appCache.del(cacheKey);
	
	var waitFor;
	if(theApp.summaryJson){
		theApp.appGuid = theApp.summaryJson.guid;
		waitFor = updateApp(req,appTarget);
	}else{
		waitFor = createApp(req, appTarget);
	}

	return Promise.resolve(waitFor)
	.then(function(){
		return extService && extService.createExtServices(req, appTarget, theApp);
	})
	.then(function(){
		return bindRoute(req, appTarget);
	})
	.then(function(){
		return uploadBits(req, appTarget);
	})
	.then(function(){
		return bindServices(req, appTarget);
	});
}
function createApp(req, appTarget){
	var stack = theApp.manifest.applications[0].stack;
	var waitForStackGuid;
	if(stack){
		waitForStackGuid = getStackGuidByName(req.user.username, stack, appTarget);
	}
	return Promise.resolve(waitForStackGuid)
	.then(function(stackGuid){
		var body = {
			"space_guid": appTarget.Space.metadata.guid,
			"name":theApp.appName,
			"instances": Number(theApp.manifest.applications[0].instances) || 1,
			"buildPack":theApp.manifest.applications[0].buildpack || null,
			"command":theApp.manifest.applications[0].command,	
			"memory": normalizeMemoryMeasure(theApp.manifest.applications[0].memory),
			"stack_guid":stackGuid,
			"environment_json":theApp.manifest.applications[0].env || {}
		};
		return target.cfRequest("POST", req.user.username, appTarget.Url + "/v2/apps", null, JSON.stringify(body), null, null, appTarget)
		.then(function(result){
			if(result.error_code){
				return handleSimpleErrorStatus(result, "404");
			}
			theApp.appGuid = result.metadata.guid;
			return result;
		});
	});
}
function updateApp(req, appTarget){
	var cacheKey = appTarget.Url + appTarget.Org + appTarget.Space + theApp.appName;
	appCache.del(cacheKey);
	
	var stack = theApp.manifest.applications[0].stack;
	var waitForStackGuid;
	if(stack){
		waitForStackGuid = getStackGuidByName(req.user.username, stack, appTarget);
	}
	return Promise.resolve(waitForStackGuid)
	.then(function(stackGuid){
		var body = {
			"name":theApp.appName,
			"instances":theApp.manifest.applications[0].instances || 1,
			"buildPack":theApp.manifest.applications[0].buildpack || null,
			"command":theApp.manifest.applications[0].command,	
			"memory": normalizeMemoryMeasure(theApp.manifest.applications[0].memory),
			"stack_guid":stackGuid,
			"environment_json":theApp.manifest.applications[0].env || {}
			};
		return target.cfRequest("PUT", req.user.username, appTarget.Url + theApp.appUrl, {"async":"true","inline-relations-depth":"1"}, JSON.stringify(body), null, null, appTarget)	
		.then(function(result){
			return result;
		});
	});
}
function getStackGuidByName(userId, stackname ,appTarget){
	return target.cfRequest("GET", userId, appTarget.Url + "/v2/stacks", {"q":"name:"+ stackname,"inline-relations-depth":"1"})
	.then(function(result){
		return result.resources[0] && result.resources[0].metadata.guid || null;
	});
}
function bindRoute(req, appTarget){
	return domains.getCFdomains(appTarget, req.user.username, targetRequest.Url)
	/* get available domains */
	.then(function(domainArray){
		var appManifestDomain = theApp.manifest.applications[0].domain;
		if (appManifestDomain) {
			/* look if the domain is available */
			for (var k=0 ;k < domainArray.length; k++) {
				var domain = domainArray[k];
				if (appManifestDomain === domain.DomainName) {
					theApp.appDomain = domain;
					break;
				}
			}
			if(!theApp.appDomain){
				var errorStatus = new Error("Failed to find domain " + appManifestDomain + " in target available domains, please check the domain property your manifest.yml file.");
				errorStatus.code = "404";
				return Promise.reject(errorStatus);
			}
		} else {
			/* client has not requested a specific domain, get the first available */
			theApp.appDomain = domainArray[0];
		}
		// validate host
		theApp.manifest.applications[0].host || (theApp.manifest.applications[0].host = manifests.slugify(theApp.manifest.applications[0].name));
	})
	/* find out whether the declared host can be reused */
	.then(function(){
		return target.cfRequest("GET", req.user.username, appTarget.Url + "/v2/routes", 
		{"inline-relations-depth":"1", "q":"host:"+theApp.manifest.applications[0].host + ";domain_guid:" + theApp.appDomain.Guid}, null, null, null, appTarget)
		.then(function(result){
			var resource = result.resources[0];
			var waitForRoute;
			if(resource){
				waitForRoute = Promise.resolve(resource);
			}else{
				/* create a new route */
				waitForRoute = createRoute(req, appTarget);
			}
			/* attach route to application */
			return waitForRoute.then(function(appRoute){
				if(appRoute.error_code){
					return handleSimpleErrorStatus(appRoute, "400");
				}
				theApp.appRoute = appRoute;
				return target.cfRequest("PUT", req.user.username, appTarget.Url + "/v2/apps/" + theApp.appGuid + "/routes/" + appRoute.metadata.guid, null, null, null, null, appTarget);
			});
		});
	});
}
function uploadBits(req, appTarget){
	var cloudAccessToken;
	var archiveredFilePath;
	return target.getAccessToken(req.user.username, appTarget)
	.then(function(token){
		cloudAccessToken = token;
		return archiveTarget(theApp.appStore, req)
		.then(function(filePath){
			theApp.appPackageType = path.extname(filePath).substring(1);
			archiveredFilePath = filePath;
			if(!archiveredFilePath){
				var errorStatus = new Error("Failed to read application content");
				errorStatus.code = "500";
				return Promise.reject(errorStatus);
			}
			
			var uploadFileStream = fs.createReadStream(archiveredFilePath);
			var uploadBitsHeader = {
					method: "PUT",
					url: appTarget.Url + "/v2/apps/" + theApp.appGuid + "/bits?async=true",
					headers: {"Authorization": cloudAccessToken,"Content-Type":"multipart/form-data"},
					formData:{
						"resources":{
							value:  "[]",
							options: {
								contentType: "text/plain"
							}
						},
						"application":{
							value: uploadFileStream,
							options: {
								filename: "application.zip",
								contentType: "application/zip"
							}
						}
					}
				};
			uploadFileStream.on("error", function(err){
				var errorStatus = new Error(err.message);
				errorStatus.code = "500";
				return Promise.reject(errorStatus);
			});
			return target.cfRequest(null, null, null ,null, null, null,uploadBitsHeader);
		}).then(function(requestResult){
			var ATTEMPTACCOUNT = 150;
			var initialValue = {
				"attemptsLeft":ATTEMPTACCOUNT,
				"status":requestResult.entity.status
				};
			return promiseWhile(initialValue)
			.then(function(){
				// TODO in java code this file was deleted in 'failure' case, not necessarily here.
				fs.unlinkSync(archiveredFilePath);
			});
			
			function promiseWhile(value) {
				return Promise.resolve(value).then(function(collectResult) {
					return collectCFRespond(collectResult)
					.then(function(result){
						if(result.status === "finished"){
							// When it's 'finished', return from the whole recursive promise chain.
							return;
						}
						return promiseWhile(result);
					});
				});
			}
			function collectCFRespond(collectResult){
				if(collectResult.status !== "finished" && collectResult.status !== "failure"){
					if(collectResult.status === "failed"){
						var errorStatus = new Error("Upload failed");
						errorStatus.code = "400";
						return Promise.reject(errorStatus);
					}
					if(collectResult.attemptsLeft === 0){
						var errorStatus = new Error("Upload timeout exceeded");
						errorStatus.code = "400";
						return Promise.reject(errorStatus);
					}
					return new Promise(function(fulfill, reject){
						setTimeout(function(){
							return target.cfRequest("GET", req.user.username, appTarget.Url + requestResult.metadata.url, null, null, null, null, appTarget)
							.then(function(result){
								fulfill({
								"attemptsLeft":--initialValue.attemptsLeft,
								"status":result.entity.status
								});			
							})
							.catch(function(err){
								return reject(err);
							});
						}, 2000);
					});
				}else if(collectResult.status === "failure"){
					var errorStatus = new Error("Failed to upload application bits");
					errorStatus.code = "400";
					return Promise.reject(errorStatus);
				}else if(collectResult.status === "finished"){
					return Promise.resolve("finished");
				}
			}
		}).catch(function(err){
			return Promise.reject(err);
		});
	});
}
function bindServices(req, appTarget){
	if(theApp.manifest.applications[0].services){
		return target.cfRequest("GET", req.user.username, appTarget.Url + "/v2/services", {"inline-relations-depth":"1"}, null, null, null, appTarget)
		.then(function(result){
			var manifestService = theApp.manifest.applications[0].services;
			var respondServiceJson = result.resources;
			var version = manifestService && manifestService[0] ? 6 : 2;
			if(version === 2){
				return new Promise(function(fulfill,reject){
					async.each(manifestService, function(service, cb) {
						return getServiceGuid(req.user.username, service, appTarget)
							.then(function(serviceInstanceGUID){
								if(!serviceInstanceGUID){
								/* no service instance bound to the application, create one if possible */
								/* support both 'type' and 'label' fields as service type */
								var serviceType = service.type || service.label;
								var serviceProvider = service.provider;
								var servicePlan = service.plan;
								var servicePlanGuid = findServicePlanGUID(serviceType,serviceProvider,servicePlan);
								function findServicePlanGUID(serviceType,serviceProvider,servicePlan){
									for(var k = 0; k < respondServiceJson.length; k++){
										if(serviceType === respondServiceJson[k].entity.label && serviceProvider === respondServiceJson[k].entity.provider){
											var servicePlans = respondServiceJson[k].entity.service_plans;
											for(var j = 0; j < servicePlans.length ; j++){
												if( servicePlan === servicePlans[j].entity.name){
													return servicePlans[j].metadata.guid;
												}
											}	
										}
									}
								}
								if(!servicePlanGuid) return; // TODO maybe need some more error handling.
								return createService(req.user.username, serviceType, servicePlanGuid, appTarget)
								.then(function(serviceGuid){
									return serviceInstanceGUID = serviceGuid;
								});
							}
							return serviceInstanceGUID;
						}).then(function(serviceInstanceGUID){
							return bindService(req.user.username, serviceInstanceGUID, appTarget);
						}).then(function(){
							return cb();
						})
						.catch(function(err) {
							cb(err);
						});
					}, function(err) {
						if(err){
							return reject(err);
						}
						return fulfill();
					});
				});
			}
			if(version === 6){
				return new Promise(function(fulfill,reject){
					async.each(manifestService, function(service, cb) {
						return getServiceGuid(req.user.username, service, appTarget)
						.then(function(serviceInstanceGUID){
							return bindService(req.user.username, serviceInstanceGUID, appTarget);
						}).then(function(){
							return cb();
						})
						.catch(function(err) {
							cb(err);
						});
					}, function(err) {
						if(err){
							return reject(err);
						}
						return fulfill();
					});
				});
			}
		});
	}
	return;
}
function bindService(userId, serviceGuid, appTarget){
	var body = {
		"app_guid": theApp.appGuid,
		"service_instance_guid": serviceGuid
	};
	return target.cfRequest("POST", userId, appTarget.Url + "/v2/service_bindings", null, JSON.stringify(body), null, null, appTarget);
}
function createRoute(req, appTarget){
	var body = {
		"space_guid": appTarget.Space.metadata.guid,
		"host":theApp.manifest.applications[0].host,
		"domain_guid":theApp.appDomain.Guid
	};
	return target.cfRequest("POST", req.user.username, appTarget.Url + "/v2/routes", {"inline-relations-depth":"1"}, JSON.stringify(body), null, null, appTarget);
}
function getAppbyGuid(userId, appGuid ,appTarget){
	return target.cfRequest("GET", userId, appTarget.Url + "/v2/apps/" + appGuid, null, null, null, null, appTarget)
	.then(function(appJSON){
		return target.cfRequest("GET", userId, theApp.appTarget.Url + appJSON.metadata.url + "/summary", null, null, null, null, appTarget)
		.then(function(result){
			if(result.error_code){
				return handleSimpleErrorStatus(result, "404");
			}
			theApp.summaryJson = result;
			theApp.appGuid = appJSON.metadata.guid;
			theApp.appName = result.name;			
		});
	});
}
function getRouteGuidbyGuid(userId, routeGuid, appTarget){
	return target.cfRequest("GET", userId,appTarget.Url + "/v2/routes/" + routeGuid, null, null, null, null, appTarget)
	.then(function(result){
		if(result.error_code){
			return handleSimpleErrorStatus(result, "404");
		}
		return result.metadata.guid; // TODO this need to test
	});
}
function mapRoute(userId, routeGuid, appTarget){
	return target.cfRequest("PUT", userId, appTarget.Url + "/v2/apps/" + theApp.appGuid + "/routes/" + routeGuid, null, null, null, null, appTarget);
}
} // End of putApp()
function getServiceGuid(userId, service, appTarget){
	return target.cfRequest("GET", userId, appTarget.Url + "/v2/spaces/" + appTarget.Space.metadata.guid + "/service_instances"
	, {"inline-relations-depth":"1","return_user_provided_service_instances":"true","q":"name:"+service}, null, null, null, appTarget)
	.then(function(serviceJson){
		if(serviceJson.error_code){
			return handleSimpleErrorStatus(serviceJson, "404");
		}
		var serviceResources = serviceJson.resources;
		var serviceInstanceGUID;
		// Find service Guid from the response of getting service request.
		for(var k = 0; k < serviceResources.length ; k++ ){
			serviceInstanceGUID = serviceResources[k] && serviceResources[k].metadata && serviceResources[k].metadata.guid;
			if(serviceInstanceGUID) break;
		}
		return serviceInstanceGUID;
	});
}
function createService(userId, serviceName, servicePlanGuid, appTarget){
	var body = {
		"space_guid": appTarget.Space.metadata.guid,
		"name": serviceName,
		"service_plan_guid": servicePlanGuid
	};
	return target.cfRequest("POST", userId, appTarget.Url + "/v2/service_instances", null, JSON.stringify(body), null, null, appTarget)
	.then(function(result){
		if(result.error_code){
			return handleSimpleErrorStatus(result, "404");
		}
		return result.metadata.guid;
	});
}
function normalizeMemoryMeasure(memory){
	if(memory){	
		if (memory.toLowerCase().endsWith("m")) //$NON-NLS-1$
			return Number(memory.substring(0, memory.length - 1));
		if (memory.toLowerCase().endsWith("mb")) //$NON-NLS-1$
			return Number(memory.substring(0, memory.length - 2));
		if (memory.toLowerCase().endsWith("g")) //$NON-NLS-1$
			return 1024 * memory.substring(0, memory.length - 1);
		if (memory.toLowerCase().endsWith("gb")) //$NON-NLS-1$
			return 1024 * memory.substring(0, memory.length - 2);
	}
	/* return default memory value, i.e. 1024 MB */
	return 1024;
}
function archiveTarget (filePath, req){
	var ramdomName = crypto.randomBytes(5).toString("hex") + Date.now();
	var resultFilePath = path.join(xfer.getUploadDir(), ramdomName + ".war");
	return searchAndCopyNearestwarFile(resultFilePath, filePath,filePath)
	.then(function(){
		// If searchAndCopyNearestwarFile fulfill with 'false', it means no .war has been found. so Zip the folder.
		return new Promise(function(fulfill, reject){
			var zip = archiver("zip");
			resultFilePath = path.join(xfer.getUploadDir(), ramdomName + ".zip");
			var output = bluebirdfs.createWriteStream(resultFilePath);
			zip.pipe(output);
			return xfer.write(zip, filePath, filePath)
			.then(function() {
				var eventData = { type: fileUtil.ChangeType.ZIPADD, req: req, zip: zip };
				fileUtil.fireFileModificationEvent(eventData);
			
				zip.finalize();
				zip.on("end", function(){
					return fulfill();
				});
				zip.on("error", function(){
					var errorStatus = new Error("Zipping process went wrong");
					return reject(errorStatus);
				});
			});
		});
	})
	.catch(function(result){
		if(result === "warFound") return; // Assert the .war filed has been copied over.
		return Promise.reject(result);  // keep escalating other rejections.
	})
	.then(function(){
		return resultFilePath;
	});
	
	function searchAndCopyNearestwarFile (targetWarPath, base, filePath) {
		return bluebirdfs.statAsync(filePath)
		.then(function(stats) {
		/*eslint consistent-return:0*/
		if (stats.isDirectory()) {
			if (filePath.substring(filePath.length-1) !== "/") filePath = filePath + "/";
			return bluebirdfs.readdirAsync(filePath)
			.then(function(directoryFiles) {
				var SUBDIR_SEARCH_CONCURRENCY = 1;
				return Promise.map(directoryFiles, function(entry) {
					return searchAndCopyNearestwarFile(targetWarPath ,base, filePath + entry);
				},{ concurrency: SUBDIR_SEARCH_CONCURRENCY});
			});
		}
		if(path.extname(filePath) === ".war"){
			return new Promise(function(fulfill,reject){
				var readenWarfileStream = bluebirdfs.createReadStream(filePath);
				readenWarfileStream.on("error", function(err) {
					reject(err);
				});
				fulfill(readenWarfileStream);
			}).then(function(readenWarfileStream){
				return readenWarfileStream.pipe(bluebirdfs.createWriteStream(targetWarPath));
			}).then(function(){
				// Using this promise to reject the promise chain.
				return Promise.reject("warFound");
			});
		}
		return false; // false means no '.war' has been find
		});
	}
}
function handleSimpleErrorStatus(cfRequestResult, code){
	var errorStatus = new Error(cfRequestResult.description);
	errorStatus.code = code;
	return Promise.reject(errorStatus);
}
};