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
var express = require('express');
var api = require('../api'), writeError = api.writeError;
var bodyParser = require('body-parser');
var target = require('./target');
var request = require('request');
var tasks = require('../tasks');
var util = require('../git/util');
var manifests = require('./manifests');
var domains = require('./domains');
var xfer = require('../xfer');
var fs = require('fs');
var path = require('path');
var async = require('async');

module.exports.router = function() {
	var appCache = {};
	
	return express.Router()
	.use(bodyParser.json())
	.get('*', getapps)
	.put('*', putapps);
	
function getapps(req, res){
	var task = new tasks.Task(res,false,false,0,false);
	var encodeName =  req.query.Name;
	var encodedContentLocation =  req.query.ContentLocation;
	target.getAccessToken(req.user.username, task);
	var targetRequest = JSON.parse(req.query.Target);
	target.computeTarget(req.user.username, targetRequest)
	 .then(function(appTarget){
		if(encodeName){
			getAppwithAppName(req.user.username, task,encodeName,appTarget);
		}else if(encodedContentLocation) {
			var manifestLocation = toOrionLocation(req, util.decodeURIComponent(encodedContentLocation));
			if(manifestLocation){
				manifests.retrieveManifestFile(req, res, manifestLocation)
				.then(function(manifest){
					if(manifest && manifest.applications &&  manifest.applications[0]){
						return getAppwithAppName(req.user.username, task, manifest.applications[0].name, appTarget);
					}			
				});
			}
		}else{
			getAppwithoutName(req, task, appTarget);
		}
	 });
}
function respondAppgetRequest(resp,task){
	if(!resp){
		task.done({
			HttpCode: 404,
			Code: 0,
			DetailedMessage: "Apps can not be found",
			JsonData: resp,
			Message: "Apps can not be found",
			Severity: "Error"
		});
	}else{
		task.done({
			HttpCode: 200,
			Code: 0,
			DetailedMessage: "Ok",
			JsonData: resp,
			Message: "Ok",
			Severity: "Ok"
		});
	}
}
function getAppwithoutName(req, task, appTarget){
	var targetRequest = JSON.parse(req.query.Target);
	var appsArray = [];
	var cloudAccessToken = target.getAccessToken(req.user.username, task);
	return new Promise(function(fulfill) {
		var appsUrl = appTarget.Space.entity.apps_url;
		var appsHeader = {
			url: appTarget.Url + appsUrl,
			headers: {'Authorization': cloudAccessToken},
			qs: {"inline-relations-depth":"2"}
		};
		request(appsHeader, function (error, response, body) {
			fulfill(target.parsebody(body));
		});
	}).then(function(result){
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
				'Guid': appResources[k].metadata.guid,
				'Name': appResources[k].entity.name,
				'Routes': routeArray,
				'State': appResources[k].entity.state,
				'Type':	'App'
			};
			appsArray.push(appJson);
		}
		return {
			"Apps" : appsArray
		};
	}).then(function(result){
		respondAppgetRequest(result,task);
	});
}
function getAppwithAppName(userId, task,encodeName, appTarget){
	return _getAppwithAppName(userId, encodeName, appTarget)
	.then(function(result){
		respondAppgetRequest(result,task);
	});
}
function _getAppwithAppName(userId, encodeName, appTarget){
	var cloudAccessToken = target.getAccessToken(userId);
	return new Promise(function(fulfill) {
		var appsUrl = appTarget.Space.entity.apps_url;
		var appsHeader = {
			url: appTarget.Url + appsUrl,
			headers: {'Authorization': cloudAccessToken},
			qs: {"q": "name:"+util.encodeURIComponent(encodeName),"inline-relations-depth":"1"}
		};
		request(appsHeader, function (error, response, body) {
			fulfill(target.parsebody(body));
		});
	}).then(function(result){
		if(!result.resources || result.resources && result.resources.length === 0){
			return null;
		}
		appCache.appUrl = result.resources[0].metadata.url;
		appCache.appMetadata = result.resources[0].metadata;
		return new Promise(function(fulfill) {
			var appsHeader = {
				url: appTarget.Url + appCache.appUrl +'/summary',
				headers: {'Authorization': cloudAccessToken}
			};
			request(appsHeader, function (error, response, body) {
				appCache.summaryJson = target.parsebody(body);
				fulfill();
			});
		}).then(function(){
			return new Promise(function(fulfill) {
				var appsHeader = {
					url: appTarget.Url + appCache.appUrl +'/instances',
					headers: {'Authorization': cloudAccessToken}
				};
				request(appsHeader, function (error, response, body) {
					appCache.instanceJson = target.parsebody(body);
					fulfill();
				});
			});
		}).then(function(){
			var appJson;
			appJson = appCache.summaryJson;
			appJson.instances_details = appCache.instanceJson;
			return appJson;
		});
	});
}
function toOrionLocation(req, location){
	if(location && location.length !== 0 && location.indexOf('/file') === 0){
		return path.join(req.user.workspaceDir, location.substring(5)); 
	}
}
function toAppLocation(req,location){
	if(location && location.length !== 0 && location.indexOf('/file') === 0){
		var foldername = location.split("/")[2];
		return path.join(req.user.workspaceDir, foldername); 
	}
}
function putapps(req, res){
	var task = new tasks.Task(res,false,false,0,false);
	target.getAccessToken(req.user.username, task);
	var targetRequest = req.body.Target;
//	var path = req.baseUrl.split('\\');
//	if(path[1] === 'routes'){
//		// TODO complete the add route case.
//		var appGuid = path[0];
//		var routeGuid = path[2];
//		Promise.all(getRouteGuidbyGuid(req.user.username, routeGuid,task,appTarget),getAppbyGuid(req.user.username, appGuid,task, appTarget))
//		.then(function(resultArray){
//			return mapRoute(req.user.username, resultArray[0],task,appTarget);
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
				waitFor = manifests.retrieveManifestFile(req, res, contentLocation);
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
				return app = appResult;
			});
	}).then(function(){
		if(app){
			var waitFor;
			if(state === 'Started'){
				waitFor = startApp(req.user.username, userTimeout,appTarget);
			}else if(state === 'Stopped'){
				waitFor = stopApp(req.user.username,appTarget);
			}else{
				if(!appCache.manifest){
					res.status(500).end('Failed to handle request for '+ path);
				}
			}
			return Promise.resolve(waitFor)
			.then(function(status){
				if(status){
					return repondAppPutrequest(task,status);
				}
			});
		}
	}).then(function(){
		function instrumentManifest(manifest,instrumentationJSON){
			if(!instrumentationJSON || !manifest.applications){
				return;
			}
			for(var key in instrumentationJSON){
				var value = instrumentationJSON.key;
				for(var j = 0; j < manifest.applications.length ; j++){
					if(key === 'memory' && !updateMemory(manifest.applications[j],value)){
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
		return pushApp(req, res, appTarget);
	}).then(function(){
		return _getAppwithAppName(req.user.username, appCache.appName, appTarget);
	}).then(function(){
		if(restart){
			return restartApp(req.user.username, appTarget);
		}
		return startApp(req.user.username, -1, appTarget);
	}).then(function(startRespond){
		return repondAppPutrequest(task,startRespond);
	}).catch(function(err){
		console.log(err);
		if(err.stack){
			console.log(err.stack);
		}
	});

	
function repondAppPutrequest(task,status){
	return new Promise(function(fulfill,reject){
		var resp;
		var appJson = {
			entity:appCache.summaryJson,
			metadata:appCache.appMetadata	
		};
		if(status === 'RUNNING'){
			var DEFAULT_TIMEOUT = 60;
			resp = {
				"App":appJson,
				"DeployedPackage":appCache.appPackageType || 'unknown',
				"Domain":appCache.appDomain,
				"Route": appCache.appRoute,
				"Target" : appCache.appTarget,
				"Timeout": appCache.manifest.applications[0].timeout || DEFAULT_TIMEOUT
			};
			
		}else if(status === 'STOPPED'){
			resp = appJson;
		}else{
			return reject('Status wrong');
		}
		task.done({
			HttpCode: 200,
			Code: 0,
			DetailedMessage: "Ok",
			JsonData: resp,
			Message: "Ok",
			Severity: "Ok"
		});
		return reject('Finish');
	});
}

function startApp(userId, userTimeout ,appTarget){
	var DEFAULT_TIMEOUT = 60;
	var MAX_TIMEOUT = 180;
	var cloudAccessToken = target.getAccessToken(userId);
	var body = {'console':true, 'state':'STARTED'};
	return new Promise(function(fulfill) {
		var startAppHeader = {
			url: appTarget.Url + appCache.appUrl,
			headers: {'Authorization': cloudAccessToken},
			qs: {"inline-relations-depth":"1"},
			body: JSON.stringify(body)
		};
		request.put(startAppHeader, function (error, response, body) {
			if(!error) fulfill();
		});
	}).then(function(){
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
					}else if(result.data[0]){
						var instancesNo = Object.keys(result.data).length;
						var runningInstanceNo = 0;
						var flappingInstanceNo = 0;
						for (var key in result.data) {
							if (result.data.hasOwnProperty(key)) {
								if(result.data[key].state === 'RUNNING'){
									runningInstanceNo++;
								}else if(result.data[key].state === 'FLAPPING'){
									flappingInstanceNo++;
								}
							}
						}
						if (runningInstanceNo === instancesNo) {
							return "RUNNING";
						}
						if (flappingInstanceNo > 0 ) {
							return 'FLAPPING';
						}
						return promiseWhile(result.attemptsLeft);
					}else if(result.attemptsLeft === 0 ){
						return 'TIMEOUT';
					}
				});
			});
		}
		function collectCFRespond(){
			return new Promise(function(fulfill){
				setTimeout(function(){
					var cfAppStartRespondHeader = {
						url: appTarget.Url + appCache.appUrl + '/instances',
						headers: {'Authorization': cloudAccessToken}
					};
					request(cfAppStartRespondHeader, function (error, response, body) {
						fulfill({'data': target.parsebody(body),'attemptsLeft': --attemptsLeft});
					})
				}, 2000);
			});
		}
		return promiseWhile(attemptsLeft);
	});
}

function stopApp(userId, appTarget){
	var cloudAccessToken = target.getAccessToken(userId);
	var body = {'console':true,'state':'STOPPED'};
	return new Promise(function(fulfill) {
		var startAppHeader = {
			url: appTarget.Url + appCache.appUrl,
			headers: {'Authorization': cloudAccessToken},
			qs: {"inline-relations-depth":"1"},
			body: JSON.stringify(body)
		};
		request.put(startAppHeader, function (error, response, body) {
			if(!error) fulfill('STOPPED');
		});
	});
}
function restartApp(userId, appTarget){
	return stopApp(userId,appTarget) 
	.then(function(){
		return startApp(userId, -1, appTarget);
	});
}
function pushApp(req, res, appTarget){
	var waitFor;
	if(appCache.summaryJson){
		appCache.appGuid = appCache.summaryJson.guid;
		waitFor = updateApp(req, res, appTarget);
	}else{
		waitFor = createApp(req, res, appTarget)
	}
	// TODO one missing step to: look up available environment extension services
	return Promise.resolve(waitFor).then(function(){
		return bindRoute(req, res, appTarget);
	})
	.then(function(){
		return uploadBits(req, res, appTarget);
	})
	.then(function(){
		return bindServices(req, res, appTarget);
	});
}
function createApp(req, res, appTarget){
	var stack = appCache.manifest.applications[0].stack;
	var waitForStackGuid;
	if(stack){
		waitForStackGuid = getStackGuidByName(req.user.username, stack, appTarget);
	}
	return Promise.resolve(waitForStackGuid)
	.then(function(stackGuid){
		var cloudAccessToken = target.getAccessToken(req.user.username);
		var body = {
			'space_guid': appTarget.Space.metadata.guid,
			'name':appCache.appName,
			'instances':appCache.manifest.applications[0].instances || 1,
			'buildPack':appCache.manifest.applications[0].buildpack || null,
			'command':appCache.manifest.applications[0].command,	
			'memory': normalizeMemoryMeasure(appCache.manifest.applications[0].memory),
			'stack_guid':stackGuid,
			'environment_json':appCache.manifest.applications[0].env || {}
		};
		return new Promise(function(fulfill) {
			var createAppHeader = {
				url: appTarget.Url + '/v2/apps',
				headers: {'Authorization': cloudAccessToken},
				body : JSON.stringify(body)
			};
			request.post(createAppHeader, function (error, response, body) {
				if(!error) fulfill(target.parsebody(body));
			});
		}).then(function(result){
			appCache.appGuid = result.metadata.guid;
			return result;
		});
	});
}
function updateApp(req, res, appTarget){
	var stack = appCache.manifest.applications[0].stack;
	var waitForStackGuid;
	if(stack){
		waitForStackGuid = getStackGuidByName(req.user.username, stack, appTarget);
	}
	return Promise.resolve(waitForStackGuid)
	.then(function(stackGuid){
		var cloudAccessToken = target.getAccessToken(req.user.username);
		var body = {
			'name':appCache.appName,
			'instances':appCache.manifest.applications[0].instances || 1,
			'buildPack':appCache.manifest.applications[0].buildpack || null,
			'command':appCache.manifest.applications[0].command,	
			'memory': normalizeMemoryMeasure(appCache.manifest.applications[0].memory),
			'stack_guid':stackGuid,
			'environment_json':appCache.manifest.applications[0].env || {}
			};
		return new Promise(function(fulfill) {
			var createAppHeader = {
				url: appTarget.Url + appCache.appUrl,
				headers: {'Authorization': cloudAccessToken},
				qs:{'async':'true','inline-relations-depth':'1'},
				body : JSON.stringify(body)
			};
			request.put(createAppHeader, function (error, response, body) {
				if(!error) fulfill(target.parsebody(body));
			});
		}).then(function(result){
			return result;
		});
	});
}
function getStackGuidByName(userId, stackname ,appTarget){
	var cloudAccessToken = target.getAccessToken(userId);
	return new Promise(function(fulfill) {
		var getStackBynameHeader = {
			url: appTarget.Url + '/v2/stacks',
			headers: {'Authorization': cloudAccessToken},
			qs:{'q':'name:'+ stackname,'inline-relations-depth':'1'},
		};
		request(getStackBynameHeader, function (error, response, body) {
			if(!error) fulfill(target.parsebody(body).resources[0] && target.parsebody(body).resources[0].metadata.guid || null);
		});
	});
}
function bindRoute(req, res, appTarget){
	var targetRequest = req.body.Target;
	var cloudAccessToken = target.getAccessToken(req.user.username);
	return domains.getCFdomains(appTarget, req.user.username, targetRequest.Url, targetRequest.Org)
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
			appCache.appDomain = domains.get(0);
		}
	})
	/* find out whether the declared host can be reused */
	.then(function(){
		return new Promise(function(fulfill) {
			var findrouteHeader = {
				url: appTarget.Url + '/v2/routes',
				headers: {'Authorization': cloudAccessToken},
				qs: {"inline-relations-depth":"1", 'q':'host:'+appCache.manifest.applications[0].host + ';domain_guid:' + appCache.appDomain.Guid},
			};
			request(findrouteHeader, function (error, response, body) {
				var bodyJson = target.parsebody(body);
				if(!error) fulfill(bodyJson.resources[0]);
			});
		}).then(function(result){
			var waitForRoute;
			if(result){
				waitForRoute = Promise.resolve(result);
			}else{
				/* create a new route */
				waitForRoute = createRoute(req, res, appTarget);
			}
			/* attach route to application */
			return waitForRoute.then(function(appRoute){
				return new Promise(function(fulfill) {
					appCache.appRoute = appRoute;
					var attachrouteHeader = {
						url: appTarget.Url + '/v2/apps/' + appCache.appGuid + '/routes/' + appRoute.metadata.guid,
						headers: {'Authorization': cloudAccessToken}
					};
					request.put(attachrouteHeader, function (error, response, body) {
						if(!error) fulfill(target.parsebody(body));
					});
				});
			});
		});
	}).catch(function(err){
		writeError(500, res, err);
	});
}
function uploadBits(req, res, appTarget){
	var cloudAccessToken = target.getAccessToken(req.user.username);
	var archiveredFilePath;
	return xfer.archiveTarget(appCache.appStore)
	.then(function(filePath){
		appCache.appPackageType = path.extname(filePath).substring(1);
		archiveredFilePath = filePath;
		if(!archiveredFilePath){
			writeError(500, res, 'Failed to read application content');
		}
		return new Promise(function(fulfill) {
			var uploadBitsHeader = {
				method: 'PUT',
				uri: appTarget.Url + '/v2/apps/' + appCache.appGuid + "/bits?async=true",
				headers: {'Authorization': cloudAccessToken,'Content-Type':'multipart/form-data'},
				formData:{
					'resources':{
						value:  '[]',
						options: {
							contentType: 'text/plain'
						}
					},
					'application':{
						value:  fs.readFileSync(archiveredFilePath),
						options: {
							filename: 'application.zip',
							contentType: 'application/zip'
						}
					}
				}
			};
			request(uploadBitsHeader, function (error, response, body) {
				if(!error) fulfill(target.parsebody(body));
			});
		});
	}).then(function(result){
		var ATTEMPTACCOUNT = 150;
		var initialValue = {
			'attemptsLeft':ATTEMPTACCOUNT,
			'status':result.entity.status
			};
		return promiseWhile(initialValue)
			.catch(function(feedBack){
				// TODO in java code this file was deleted in 'failure' case, not necessarily here.
				fs.unlinkSync(archiveredFilePath);
			});
		
		function promiseWhile(value) {
			return Promise.resolve(value).then(checkUploadrespond).then(function() {
				return collectCFRespond()
				.then(function(result){
					return promiseWhile(result);
				});
			});
		}
		function checkUploadrespond(result){
			return new Promise(function(fulfill,reject){
				if(result.status !== 'finished' && result.status !== 'failure'){
					if(result.status === 'failed'){
						writeError(400, res, 'Upload failed');
						reject('failure');
					}
					if(result.attemptsLeft === 0){
						writeError(400, res, 'Upload timeout exceeded');
						reject('failure');
					}
					fulfill();
				}else if(result.status === 'failure'){
					writeError(400, res, 'Failed to upload application bits');
					reject('failure');
				}else if(result.status === 'finished'){
					reject('finished');
				}
			});
		}
		function collectCFRespond(){
			return new Promise(function(fulfill){
				setTimeout(function(){
					var uploadRespondHeader = {
						url: appTarget.Url + result.metadata.url,
						headers: {'Authorization': cloudAccessToken}
					};
					request(uploadRespondHeader, function (error, response, body) {
						var bodyJson = target.parsebody(body);
						fulfill(
							{
							'attemptsLeft':--initialValue.attemptsLeft,
							'status':bodyJson.entity.status
							}
						);
					})
				}, 2000);
			});
		}
	});
}
function bindServices(req, res, appTarget){ // TODO need test case!!
	var cloudAccessToken = target.getAccessToken(req.user.username);
	if(appCache.manifest.applications[0].services){
		return new Promise(function(fulfill) {
			var fetchServiceHeader = {
				url: appTarget.Url + '/v2/services',
				headers: {'Authorization': cloudAccessToken},
				qs: {"inline-relations-depth":"1"},
			};
			request(fetchServiceHeader, function (error, response, body) {
				if(!error) fulfill(target.parsebody(body));
			});
		}).then(function(result){
			var manifestService = appCache.manifest.applications[0].services;
			var respondServiceJson = result.resources;
			var version = manifestService && manifestService[0] ? 6 : 2;
			if(version === 2){
				return new Promise(function(fulfill,reject){
					async.each(manifestService, function(service, cb) {
						return getServiceGuid(req.user.username, service)
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
							return bindService(req.user.username, serviceInstanceGUID);
						}).then(function(){
							cb();
						});
					}, function(err) {
						if(err){
							return reject(err);
						}
						fulfill();
					});
				});
			}
			if(version === 6){
				return new Promise(function(fulfill,reject){
					async.each(manifestService, function(service, cb) {
						return getServiceGuid(req.user.username, service)
						.then(function(serviceInstanceGUID){
							return bindService(req.user.username, serviceInstanceGUID);
						}).then(function(){
							cb();
						});
					}, function(err) {
						if(err){
							return reject(err);
						}
						fulfill();
					});
				});
			}
		});
	}
	return;
}
function getServiceGuid(userId, service, appTarget){
	return new Promise(function(fulfill) {
		var cloudAccessToken = target.getAccessToken(userId);
		var getServiceheader = {
			url: appTarget.Url + '/v2/spaces/' + appTarget.Space.metadata.guid + '/service_instances',
			headers: {'Authorization': cloudAccessToken},
			qs :{'inline-relations-depth':'1','return_user_provided_service_instances':'true','q':'name:'+service.label}
		};
		request(getServiceheader, function (error, response, body) {
			fulfill(target.parsebody(body));
		});
	}).then(function(serviceJson){	
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
function createService(userId, serviceName, servicePlanGuid,appTarget){
	var cloudAccessToken = target.getAccessToken(userId);
	var body = {
		'space_guid': appTarget.Space.matadata.guid,
		'name': serviceName,
		'service_plan_guid': servicePlanGuid
	};
	return new Promise(function(fulfill) {
		var createServerHeader = {
			url: appTarget.Url + '/v2/service_instances',
			headers: {'Authorization': cloudAccessToken},
			body:JSON.stringify(body)
		};
		request.post(createServerHeader, function (error, response, body) {
			if(!error) fulfill(target.parsebody(body).metadata.guid);
		});
	});
}
function bindService(userId, serviceGuid, appTarget){
	var cloudAccessToken = target.getAccessToken(userId);
	var body = {
		'app_guid': appCache.appGuid,
		'service_instance_guid': serviceGuid
	};
	return new Promise(function(fulfill) {
		var createServerHeader = {
			url: appTarget.Url + '/v2/service_bindings',
			headers: {'Authorization': cloudAccessToken},
			body:JSON.stringify(body)
		};
		request.post(createServerHeader, function (error, response, body) {
			if(!error) fulfill();
		});
	});
}
function createRoute(req, res, appTarget){
	var cloudAccessToken = target.getAccessToken(req.user.username);
	var body = {
		'space_guid': appTarget.Space.metadata.guid,
		'host':appCache.manifest.applications[0].host || slugify(appCache.appName),
		'domain_guid':appCache.appDomain.Guid
	};
	return new Promise(function(fulfill) {
		var findrouteHeader = {
			url: appTarget.Url + '/v2/routes',
			headers: {'Authorization': cloudAccessToken},
			qs: {"inline-relations-depth":"1"},
			body:JSON.stringify(body)
		};
		request.post(findrouteHeader, function (error, response, body) {
			if(!error) fulfill(target.parsebody(body));
		});
	});
}
function getAppbyGuid(userId, appGuid, task ,appTarget){
	var cloudAccessToken = target.getAccessToken(userId, task);
	return new Promise(function(fulfill) {
		var getAppbyGuideHeader = {
			url: appTarget.Url + '/v2/apps/' + appGuid,
			headers: {'Authorization': cloudAccessToken}
		};
		request(getAppbyGuideHeader, function (error, response, body) {
			if(!error) fulfill(target.parsebody(body));
		});
	}).then(function(appJSON){
		return new Promise(function(fulfill) {
			var getSummaryHeader = {
				url: appCache.appTarget.Url + appJSON.metadata.url + '/summary',
				headers: {'Authorization': cloudAccessToken}
			};
			request(getSummaryHeader, function (error, response, body) {
				if(!error) {
					var summaryJSON = target.parsebody(body);
					appCache.summaryJson = summaryJSON;
					appCache.appGuid = appJSON.metadata.guid;
					appCache.appName = summaryJSON.name;
					fulfill();
				}
			});
		});
	});
}
function getRouteGuidbyGuid(userId, routeGuid, task, appTarget){
	var cloudAccessToken = target.getAccessToken(userId, task);
	return new Promise(function(fulfill) {
		var getRoutebyGuidHeader = {
			url: appTarget.Url + '/v2/routes/' + routeGuid,
			headers: {'Authorization': cloudAccessToken}
		};
		request(getRoutebyGuidHeader, function (error, response, body) {
			if(!error) fulfill(target.parsebody(body).metadata.guid);// TODO this need to test
		});
	});
}
function mapRoute(userId, routeGuid, task, appTarget){
	var cloudAccessToken = target.getAccessToken(userId, task);
	return new Promise(function(fulfill) {
		var attachRouteHeader = {
			url: appTarget.Url + '/v2/apps/' + appCache.appGuid + '/routes/' + routeGuid,
			headers: {'Authorization': cloudAccessToken}
		};
		request.put(attachRouteHeader, function (error, response, body) {
			if(!error) fulfill();
		});
	});
}
function getAppCache(){
	return appCache;
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
}
}
function normalizeMemoryMeasure(memory){
	if (memory.toLowerCase().endsWith("m")) //$NON-NLS-1$
		return 1 * memory.substring(0, memory.length - 1);
	if (memory.toLowerCase().endsWith("mb")) //$NON-NLS-1$
		return 1 * memory.substring(0, memory.length() - 2);
	if (memory.toLowerCase().endsWith("g")) //$NON-NLS-1$
		return 1024 * memory.substring(0, memory.length() - 1);
	if (memory.toLowerCase().endsWith("gb")) //$NON-NLS-1$
		return 1024 * memory.substring(0, memory.length() - 2);
	/* return default memory value, i.e. 1024 MB */
	return 1024;
}
function slugify(inputString){
	return inputString.toString().toLowerCase()
	.replace(/\s+/g, '-')		// Replace spaces with -
	.replace(/[^\w\-]+/g, '')	// Remove all non-word chars
	.replace(/\-\-+/g, '-')		// Replace multiple - with single -
	.replace(/^-+/, '')			// Trim - from start of text
	.replace(/-+$/, '');			// Trim - from end of text
}
};