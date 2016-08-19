/*******************************************************************************
 * Copyright (c) 2016 IBM Corporation and others.
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
var bodyParser = require("body-parser");
var target = require("./target");
var tasks = require("../tasks");
var util = require("../git/util");
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

module.exports.router = function() {
	
	module.exports._getAppwithAppName = _getAppwithAppName;
	
	return express.Router()
	.use(bodyParser.json())
	.get("*", getapps)
	.put("*", putapps);
	
function getapps(req, res){
	var task = new tasks.Task(res,false,false,0,false);
	var encodeName =  req.query.Name;
	var encodedContentLocation =  req.query.ContentLocation;
	var targetRequest = req.query.Target ? JSON.parse(req.query.Target) : null;
	target.computeTarget(req.user.username, targetRequest)
	 .then(function(appTarget){
		if(encodeName){
			return getAppwithAppName(req.user.username, task,encodeName,appTarget);
		}else if(encodedContentLocation) {
			var manifestLocation = toOrionLocation(req, util.decodeURIComponent(encodedContentLocation));
			if(manifestLocation){
				return manifests.retrieveManifestFile(req, manifestLocation)
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
		return Promise.reject({"code":404, "message":"Apps can not be found"});
	}
	task.done({
		HttpCode: 200,
		Code: 0,
		DetailedMessage: "Ok",
		JsonData: resp,
		Message: "Ok",
		Severity: "Ok"
	});
}
function getAppwithoutName(req, task, appTarget){
	var appsArray = [];
	target.cfRequest("GET", req.user.username, appTarget.Url + appTarget.Space.entity.apps_url, {"inline-relations-depth":"2"})
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
	return target.cfRequest("GET", userId, appTarget.Url + appTarget.Space.entity.apps_url, {"q": "name:"+util.encodeURIComponent(encodeName),"inline-relations-depth":"1"})
	.then(function(result){
		if(!result.resources || result.resources && result.resources.length === 0){
			return null;
		}
		app.appUrl = result.resources[0].metadata.url;
		app.appMetadata = result.resources[0].metadata;
		return target.cfRequest("GET", userId, appTarget.Url + app.appUrl +"/summary")
		.then(function(result){
			app.summaryJson = result;
			return target.cfRequest("GET", userId, appTarget.Url + app.appUrl +"/instances");
		}).then(function(result){
			app.instanceJson = result;
			var appJson;
			appJson = app.summaryJson;
			appJson.instances_details = app.instanceJson;
			return {"appJson":appJson,"app":app};
		});
	});
}
function toOrionLocation(req, location){
	if(location && location.length !== 0 && location.indexOf("/file") === 0){
		return path.join(req.user.workspaceDir, location.substring(5)); 
	}
}
function toAppLocation(req,location){
	if(location && location.length !== 0 && location.indexOf("/file") === 0){
		var foldername = location.split("/")[2];
		return path.join(req.user.workspaceDir, foldername); 
	}
}
function putapps(req, res){
	var appCache = {};
	//appCache's shape 
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
	appCache.appStore = toAppLocation(req, req.body.ContentLocation);
//	var packagerName = req.body.Packager; // TODO in java code, there is acually only one zip approach regardless this value.
	var manifestJSON = req.body.Manifest;
	var instrumentationJSON = req.body.Instrumentation;
	var userTimeout = req.body.Timeout &&  req.body.Timeout > 0 ? req.body.Timeout:0;
	var app = null;
	var manifestAppName = null;
	var restart;
	var appTarget;
	return target.computeTarget(req.user.username, targetRequest)
	 .then(function(resultTarget){
	 	appTarget = resultTarget;
		if(contentLocation && !state){
			var waitFor;
			if(manifestJSON){
				/* check for non-manifest deployment */
				waitFor = Promise.resolve(manifestJSON);
			}else{
				waitFor = manifests.retrieveManifestFile(req, contentLocation);
			}
			return waitFor.then(function(result){
				if(result){
					appCache.manifest = result;
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
					appCache.appUrl=appResult.app.appUrl;
					appCache.appMetadata=appResult.app.appMetadata;
					appCache.summaryJson=appResult.app.summaryJson;
					appCache.instanceJson=appResult.app.instanceJson;
					return app = appResult.app;
				}
			});
	}).then(function(){
		if(app){
			var waitFor;
			if(state === "Started"){
				waitFor = startApp(req.user.username, userTimeout,appTarget);
			}else if(state === "Stopped"){
				waitFor = stopApp(req.user.username,appTarget);
			}else{
				if(!appCache.manifest){
					return Promise.reject({"code":500, "message":"Failed to handle request for "+ path});
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
		instrumentManifest(appCache.manifest,instrumentationJSON);
		appCache.appName = appName ? appName : manifestAppName;
		return pushApp(req, appTarget)
		.then(function(){
			return _getAppwithAppName(req.user.username, appCache.appName, appTarget)
			.then(function(appResult){
				if(appResult.app){
					appCache.appUrl=appResult.app.appUrl;
					appCache.appMetadata=appResult.app.appMetadata;
					appCache.summaryJson=appResult.app.summaryJson;
					appCache.instanceJson=appResult.app.instanceJson;
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
		entity:appCache.summaryJson,
		metadata:appCache.appMetadata	
	};
	if (status.error_code) {
		return Promise.reject({"code":400, "message": status.description,"bundleid":"org.eclipse.orion.server.core","data":status});
	}
	if(status === "RUNNING"){
		var DEFAULT_TIMEOUT = 60;
		resp = {
			"App":appJson,
			"DeployedPackage":appCache.appPackageType || "unknown",
			"Domain":appCache.appDomain,
			"Route": appCache.appRoute,
			"Target" : appCache.appTarget,
			"Timeout": appCache.manifest.applications[0].timeout || DEFAULT_TIMEOUT
		};
		
	}else if(status === "STOPPED"){
		resp = appJson;
	}else{
		return Promise.reject({"code":400, "message":"Status wrong"});
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
	var DEFAULT_TIMEOUT = 60;
	var MAX_TIMEOUT = 180;
	var body = {"console":true, "state":"STARTED"};
	return target.cfRequest("PUT", userId, appTarget.Url + appCache.appUrl, {"inline-relations-depth":"1"}, JSON.stringify(body))
	.then(function(parsedBody) {
		if (parsedBody.error_code) {
			return parsedBody;
		}
		if(userTimeout < 0 ){
			userTimeout = appCache.manifest.applications[0].timeout ? appCache.manifest.applications[0].timeout : DEFAULT_TIMEOUT;
		}
		var attemptsLeft = Math.min(userTimeout, MAX_TIMEOUT) / 2;
		
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
						return "FLAPPING";
					}
					return promiseWhile(result.attemptsLeft);
				}else if(result.attemptsLeft === 0 ){
					return "TIMEOUT";
				}
				});
			});
		}
		function collectCFRespond(){
			return new Promise(function(fulfill, reject){
				setTimeout(function(){
					return target.cfRequest("GET", userId, appTarget.Url + appCache.appUrl + "/instances")
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
	var body = {"console":true,"state":"STOPPED"};
	return target.cfRequest("PUT", userId, appTarget.Url + appCache.appUrl, {"inline-relations-depth":"1"}, JSON.stringify(body))
	.then(function(){
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
	var waitFor;
	if(appCache.summaryJson){
		appCache.appGuid = appCache.summaryJson.guid;
		waitFor = updateApp(req,appTarget);
	}else{
		waitFor = createApp(req, appTarget);
	}
	// TODO one missing step to: look up available environment extension services
	return Promise.resolve(waitFor).then(function(){
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
	var stack = appCache.manifest.applications[0].stack;
	var waitForStackGuid;
	if(stack){
		waitForStackGuid = getStackGuidByName(req.user.username, stack, appTarget);
	}
	return Promise.resolve(waitForStackGuid)
	.then(function(stackGuid){
		var body = {
			"space_guid": appTarget.Space.metadata.guid,
			"name":appCache.appName,
			"instances":appCache.manifest.applications[0].instances || 1,
			"buildPack":appCache.manifest.applications[0].buildpack || null,
			"command":appCache.manifest.applications[0].command,	
			"memory": normalizeMemoryMeasure(appCache.manifest.applications[0].memory),
			"stack_guid":stackGuid,
			"environment_json":appCache.manifest.applications[0].env || {}
		};
		return target.cfRequest("POST", req.user.username, appTarget.Url + "/v2/apps", null, JSON.stringify(body))
		.then(function(result){
			appCache.appGuid = result.metadata.guid;
			return result;
		});
	});
}
function updateApp(req, appTarget){
	var stack = appCache.manifest.applications[0].stack;
	var waitForStackGuid;
	if(stack){
		waitForStackGuid = getStackGuidByName(req.user.username, stack, appTarget);
	}
	return Promise.resolve(waitForStackGuid)
	.then(function(stackGuid){
		var body = {
			"name":appCache.appName,
			"instances":appCache.manifest.applications[0].instances || 1,
			"buildPack":appCache.manifest.applications[0].buildpack || null,
			"command":appCache.manifest.applications[0].command,	
			"memory": normalizeMemoryMeasure(appCache.manifest.applications[0].memory),
			"stack_guid":stackGuid,
			"environment_json":appCache.manifest.applications[0].env || {}
			};
		return target.cfRequest("PUT", req.user.username, appTarget.Url + appCache.appUrl, {"async":"true","inline-relations-depth":"1"}, JSON.stringify(body))	
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
		var appManifestDomain = appCache.manifest.applications[0].domain;
		if (appManifestDomain) {
			/* look if the domain is available */
			for (var k=0 ;k < domainArray.length; k++) {
				var domain = domainArray[k];
				if (appManifestDomain === domain.DomainName) {
					appCache.appDomain = domain;
					break;
				}
			}
		} else {
			/* client has not requested a specific domain, get the first available */
			appCache.appDomain = domainArray[0];
		}
	})
	/* find out whether the declared host can be reused */
	.then(function(){
		return target.cfRequest("GET", req.user.username, appTarget.Url + "/v2/routes", 
		{"inline-relations-depth":"1", "q":"host:"+appCache.manifest.applications[0].host + ";domain_guid:" + appCache.appDomain.Guid})
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
				if(appRoute.error_code === "CF-RouteHostTaken"){
					return Promise.reject({"code":400, "message":appRoute.description});
				}
				appCache.appRoute = appRoute;
				return target.cfRequest("PUT", req.user.username, appTarget.Url + "/v2/apps/" + appCache.appGuid + "/routes/" + appRoute.metadata.guid);
			});
		});
	});
}
function uploadBits(req, appTarget){
	var cloudAccessToken = target.getAccessToken(req.user.username);
	var archiveredFilePath;
	return archiveTarget(appCache.appStore)
	.then(function(filePath){
		appCache.appPackageType = path.extname(filePath).substring(1);
		archiveredFilePath = filePath;
		if(!archiveredFilePath){
			return Promise.reject({"code":500, "message":"Failed to read application content"});
		}
		var uploadFileStream = fs.createReadStream(archiveredFilePath);
		var uploadBitsHeader = {
				method: "PUT",
				url: appTarget.Url + "/v2/apps/" + appCache.appGuid + "/bits?async=true",
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
			return Promise.reject({"code":500, "message":err.message});
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
					return Promise.reject({"code":400, "message":"Upload failed"});
				}
				if(collectResult.attemptsLeft === 0){
					return Promise.reject({"code":400, "message":"Upload timeout exceeded"});
				}
				return new Promise(function(fulfill, reject){
					setTimeout(function(){
						return target.cfRequest("GET", req.user.username, appTarget.Url + requestResult.metadata.url)
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
				return Promise.reject({"code":400, "message":"Failed to upload application bits"});
			}else if(collectResult.status === "finished"){
				return Promise.resolve("finished");
			}
		}
	});
}
function bindServices(req, appTarget){
	if(appCache.manifest.applications[0].services){
		return target.cfRequest("GET", req.user.username, appTarget.Url + "/v2/services", {"inline-relations-depth":"1"})
		.then(function(result){
			var manifestService = appCache.manifest.applications[0].services;
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
											var servicePlans = respondServiceJson[k].entity.servicePlans;
											for(var j = 0; j < servicePlans.length ; j++){
												if( servicePlan === servicePlans[j].entity.name){
													return servicePlans[j].metadata.guid;
												}
											}	
										}
									}
								}
								if(!servicePlanGuid) return; // TODO maybe need some more error handling.
								return createService(req.user.username, service.label, servicePlanGuid, appTarget)
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
							return reject({"message":err.message});
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
							return reject({"message":err.message});
						}
						return fulfill();
					});
				});
			}
		});
	}
	return;
}
function getServiceGuid(userId, service, appTarget){
	return target.cfRequest("GET", userId, appTarget.Url + "/v2/spaces/" + appTarget.Space.metadata.guid + "/service_instances"
	, {"inline-relations-depth":"1","return_user_provided_service_instances":"true","q":"name:"+service})
	.then(function(serviceJson){	
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
		"space_guid": appTarget.Space.matadata.guid,
		"name": serviceName,
		"service_plan_guid": servicePlanGuid
	};
	return target.cfRequest("POST", userId, appTarget.Url + "/v2/service_instances", null, JSON.stringify(body))
	.then(function(result){
		return result.metadata.guid;
	});
}
function bindService(userId, serviceGuid, appTarget){
	var body = {
		"app_guid": appCache.appGuid,
		"service_instance_guid": serviceGuid
	};
	return target.cfRequest("POST", userId, appTarget.Url + "/v2/service_bindings", null, JSON.stringify(body));
}
function createRoute(req, appTarget){
	var body = {
		"space_guid": appTarget.Space.metadata.guid,
		"host":appCache.manifest.applications[0].host,
		"domain_guid":appCache.appDomain.Guid
	};
	return target.cfRequest("POST", req.user.username, appTarget.Url + "/v2/routes", {"inline-relations-depth":"1"}, JSON.stringify(body));
}
function getAppbyGuid(userId, appGuid ,appTarget){
	return target.cfRequest("GET", userId, appTarget.Url + "/v2/apps/" + appGuid)
	.then(function(appJSON){
		return target.cfRequest("GET", userId, appCache.appTarget.Url + appJSON.metadata.url + "/summary")
		.then(function(result){
			appCache.summaryJson = result;
			appCache.appGuid = appJSON.metadata.guid;
			appCache.appName = result.name;			
		});
	});
}
function getRouteGuidbyGuid(userId, routeGuid, appTarget){
	return target.cfRequest("GET", userId,appTarget.Url + "/v2/routes/" + routeGuid)
	.then(function(result){
		return result.metadata.guid; // TODO this need to test
	});
}
function mapRoute(userId, routeGuid, appTarget){
	return target.cfRequest("PUT", userId, appTarget.Url + "/v2/apps/" + appCache.appGuid + "/routes/" + routeGuid);
}
} // End of putApp()
function normalizeMemoryMeasure(memory){
	if (memory.toLowerCase().endsWith("m")) //$NON-NLS-1$
		return Number(memory.substring(0, memory.length - 1));
	if (memory.toLowerCase().endsWith("mb")) //$NON-NLS-1$
		return Number(memory.substring(0, memory.length() - 2));
	if (memory.toLowerCase().endsWith("g")) //$NON-NLS-1$
		return 1024 * memory.substring(0, memory.length() - 1);
	if (memory.toLowerCase().endsWith("gb")) //$NON-NLS-1$
		return 1024 * memory.substring(0, memory.length() - 2);
	/* return default memory value, i.e. 1024 MB */
	return 1024;
}
function archiveTarget (filePath){
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
				zip.finalize();
				zip.on("end", function(){
			        return fulfill();
			    });
			    zip.on("error", function(){
			        return reject({"message":"Zipping process went wrong"});
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
};