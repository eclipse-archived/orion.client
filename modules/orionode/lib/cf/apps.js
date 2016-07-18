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
var orgs = require('./orgs_spaces');
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
	
	module.exports.getAppCache = getAppCache;
	return express.Router()
	.use(bodyParser.json())
	.get('*', getapps)
	.put('*', putapps);
	
function getapps(req, res){
	var task = new tasks.Task(res,false,false,0,false);
	var encodeName =  req.query.Name;
	var encodedContentLocation =  req.query.ContentLocation;
	target.getAccessToken(task);
	var targetRequest = JSON.parse(req.query.Target);
	target.computeTarget(targetRequest)
	 .then(function(target){
	 	appCache.appTarget = target;
		if(encodeName){
			getAppwithAppName(task,encodeName);
		}else if(encodedContentLocation) {
			var manifestLocation = toOrionLocation(req, util.decodeURIComponent(encodedContentLocation));
			if(manifestLocation){
				manifests.retrieveManifestFile(req, res, manifestLocation)
				.then(function(manifest){
					if(manifest && manifest.applications &&  manifest.applications[0]){
						return getAppwithAppName(task, manifest.applications[0].name);
					}			
				});
			}
		}else{
			getAppwithoutName(req, task);
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
function getAppwithoutName(req, task){
	var targetRequest = JSON.parse(req.query.Target);
	var appsArray = [];
	var cloudAccessToken = target.getAccessToken(task);
	return new Promise(function(fulfill) {
		var appsUrl = orgs.getSpace(targetRequest.SpaceId).entity.apps_url;
		var appsHeader = {
			url: appCache.appTarget.Url + appsUrl,
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
function getAppwithAppName(task,encodeName){
	return _getAppwithAppName(encodeName)
	.then(function(result){
		respondAppgetRequest(result,task);
	});
}
function _getAppwithAppName(encodeName){
	var cloudAccessToken = target.getAccessToken();
	return new Promise(function(fulfill) {
		var appsUrl = orgs.getSpace("",appCache.appTarget.Space.Name).entity.apps_url;
		var appsHeader = {
			url: appCache.appTarget.Url + appsUrl,
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
				url: appCache.appTarget.Url + appCache.appUrl +'/summary',
				headers: {'Authorization': cloudAccessToken}
			};
			request(appsHeader, function (error, response, body) {
				appCache.summaryJson = target.parsebody(body);
				fulfill();
			});
		}).then(function(){
			return new Promise(function(fulfill) {
				var appsHeader = {
					url: appCache.appTarget.Url + appCache.appUrl +'/instances',
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
	target.getAccessToken(task);
	var targetRequest = req.body.Target;
//	var path = req.baseUrl.split('\\');
//	if(path[1] === 'routes'){
//		// TODO complete the add route case.
//		var appGuid = path[0];
//		var routeGuid = path[2];
//		Promise.all(getRouteGuidbyGuid(routeGuid,task),getAppbyGuid(appGuid,task))
//		.then(function(resultArray){
//			return mapRoute(resultArray[0],task);
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
	
	return target.computeTarget(targetRequest)
	 .then(function(target){
	 	appCache.appTarget = target;
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
		return _getAppwithAppName(appName? appName : manifestAppName)
			.then(function(appResult){
				return app = appResult;
			});
	}).then(function(){
		if(app){
			var waitFor;
			if(state === 'Started'){
				waitFor = startApp(userTimeout);
			}else if(state === 'Stopped'){
				waitFor = stopApp();
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
		return pushApp(req, res);
	}).then(function(){
		return _getAppwithAppName(appCache.appName);
	}).then(function(){
		if(restart){
			return restartApp();
		}
		return startApp(-1);
	}).then(function(startRespond){
		return repondAppPutrequest(task,startRespond);
	}).catch(function(err){
		console.log(err);
		if(err.stack){
			console.log(err.stack);
		}
	});
}
	
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

function startApp(userTimeout){
	var DEFAULT_TIMEOUT = 60;
	var MAX_TIMEOUT = 180;
	var cloudAccessToken = target.getAccessToken();
	var body = {'console':true, 'state':'STARTED'};
	return new Promise(function(fulfill) {
		var startAppHeader = {
			url: appCache.appTarget.Url + appCache.appUrl,
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
						url: appCache.appTarget.Url + appCache.appUrl + '/instances',
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

function stopApp(){
	var cloudAccessToken = target.getAccessToken();
	var body = {'console':true,'state':'STOPPED'};
	return new Promise(function(fulfill) {
		var startAppHeader = {
			url: appCache.appTarget.Url + appCache.appUrl,
			headers: {'Authorization': cloudAccessToken},
			qs: {"inline-relations-depth":"1"},
			body: JSON.stringify(body)
		};
		request.put(startAppHeader, function (error, response, body) {
			if(!error) fulfill('STOPPED');
		});
	});
}
function restartApp(){
	return stopApp()
	.then(function(){
		return startApp(-1);
	});
}
function pushApp(req, res){
	var waitFor;
	if(appCache.summaryJson){
		appCache.appGuid = appCache.summaryJson.guid;
		waitFor = updateApp(req, res);
	}else{
		waitFor = createApp(req, res)
	}
	// TODO one missing step to: look up available environment extension services
	return Promise.resolve(waitFor).then(function(){
		return bindRoute(req, res);
	})
	.then(function(){
		return uploadBits(req, res);
	})
	.then(function(){
		return bindServices(req, res);
	});
}
function createApp(req, res){
	var stack = appCache.manifest.applications[0].stack;
	var waitForStackGuid;
	if(stack){
		waitForStackGuid = getStackGuidByName(stack);
	}
	return Promise.resolve(waitForStackGuid)
	.then(function(stackGuid){
		var cloudAccessToken = target.getAccessToken();
		var body = {
			'space_guid': orgs.getSpace("",appCache.appTarget.Space.Name).metadata.guid,
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
				url: appCache.appTarget.Url + '/v2/apps',
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
function updateApp(req, res){
	var stack = appCache.manifest.applications[0].stack;
	var waitForStackGuid;
	if(stack){
		waitForStackGuid = getStackGuidByName(stack);
	}
	return Promise.resolve(waitForStackGuid)
	.then(function(stackGuid){
		var cloudAccessToken = target.getAccessToken();
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
				url: appCache.appTarget.Url + appCache.appUrl,
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
function getStackGuidByName(stackname){
	var cloudAccessToken = target.getAccessToken();
	return new Promise(function(fulfill) {
		var getStackBynameHeader = {
			url: appCache.appTarget.Url + '/v2/stacks',
			headers: {'Authorization': cloudAccessToken},
			qs:{'q':'name:'+ stackname,'inline-relations-depth':'1'},
		};
		request(getStackBynameHeader, function (error, response, body) {
			if(!error) fulfill(target.parsebody(body).resources[0] && target.parsebody(body).resources[0].metadata.guid || null);
		});
	});
}
function bindRoute(req, res){
	var targetRequest = req.body.Target;
	var cloudAccessToken = target.getAccessToken();
	return domains.getCFdomains(targetRequest.Url, targetRequest.Org)
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
				url: appCache.appTarget.Url + '/v2/routes',
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
				waitForRoute = createRoute(req, res);
			}
			/* attach route to application */
			return waitForRoute.then(function(appRoute){
				return new Promise(function(fulfill) {
					appCache.appRoute = appRoute;
					var attachrouteHeader = {
						url: appCache.appTarget.Url + '/v2/apps/' + appCache.appGuid + '/routes/' + appRoute.metadata.guid,
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
function uploadBits(req, res){
	var cloudAccessToken = target.getAccessToken();
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
				uri: appCache.appTarget.Url + '/v2/apps/' + appCache.appGuid + "/bits?async=true",
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
						url: appCache.appTarget.Url + result.metadata.url,
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
function bindServices(req, res){ // TODO need test case!!
	var cloudAccessToken = target.getAccessToken();
	if(appCache.manifest.applications[0].services){
		return new Promise(function(fulfill) {
			var fetchServiceHeader = {
				url: appCache.appTarget.Url + '/v2/services',
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
						return getServiceGuid(service)
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
								return createService(service.label, servicePlanGuid)
								.then(function(serviceGuid){
									return serviceInstanceGUID = serviceGuid;
								});
							}
							return serviceInstanceGUID;
						}).then(function(serviceInstanceGUID){
							return bindService(serviceInstanceGUID);
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
						return getServiceGuid(service)
						.then(function(serviceInstanceGUID){
							return bindService(serviceInstanceGUID);
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
function getServiceGuid(service){
	return new Promise(function(fulfill) {
		var cloudAccessToken = target.getAccessToken();
		var getServiceheader = {
			url: appCache.appTarget.Url + '/v2/spaces/' + appCache.appTarget.Space.Guid + '/service_instances',
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
function createService(serviceName, servicePlanGuid){
	var cloudAccessToken = target.getAccessToken();
	var body = {
		'space_guid': appCache.appTarget.Space.Guid,
		'name': serviceName,
		'service_plan_guid': servicePlanGuid
	};
	return new Promise(function(fulfill) {
		var createServerHeader = {
			url: appCache.appTarget.Url + '/v2/service_instances',
			headers: {'Authorization': cloudAccessToken},
			body:JSON.stringify(body)
		};
		request.post(createServerHeader, function (error, response, body) {
			if(!error) fulfill(target.parsebody(body).metadata.guid);
		});
	});
}
function bindService(serviceGuid){
	var cloudAccessToken = target.getAccessToken();
	var body = {
		'app_guid': appCache.appGuid,
		'service_instance_guid': serviceGuid
	};
	return new Promise(function(fulfill) {
		var createServerHeader = {
			url: appCache.appTarget.Url + '/v2/service_bindings',
			headers: {'Authorization': cloudAccessToken},
			body:JSON.stringify(body)
		};
		request.post(createServerHeader, function (error, response, body) {
			if(!error) fulfill();
		});
	});
}
function createRoute(req, res){
	var cloudAccessToken = target.getAccessToken();
	var body = {
		'space_guid': orgs.getSpace("", appCache.appTarget.Space.Name).metadata.guid,
		'host':appCache.manifest.applications[0].host || slugify(appCache.appName),
		'domain_guid':appCache.appDomain.Guid
	};
	return new Promise(function(fulfill) {
		var findrouteHeader = {
			url: appCache.appTarget.Url + '/v2/routes',
			headers: {'Authorization': cloudAccessToken},
			qs: {"inline-relations-depth":"1"},
			body:JSON.stringify(body)
		};
		request.post(findrouteHeader, function (error, response, body) {
			if(!error) fulfill(target.parsebody(body));
		});
	});
}
function getAppbyGuid(appGuid, task){
	var cloudAccessToken = target.getAccessToken(task);
	return new Promise(function(fulfill) {
		var getAppbyGuideHeader = {
			url: appCache.appTarget.Url + '/v2/apps/' + appGuid,
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
function getRouteGuidbyGuid(routeGuid, task){
	var cloudAccessToken = target.getAccessToken(task);
	return new Promise(function(fulfill) {
		var getRoutebyGuidHeader = {
			url: appCache.appTarget.Url + '/v2/routes/' + routeGuid,
			headers: {'Authorization': cloudAccessToken}
		};
		request(getRoutebyGuidHeader, function (error, response, body) {
			if(!error) fulfill(target.parsebody(body).metadata.guid);// TODO this need to test
		});
	});
}
function mapRoute(routeGuid, task){
	var cloudAccessToken = target.getAccessToken(task);
	return new Promise(function(fulfill) {
		var attachRouteHeader = {
			url: appCache.appTarget.Url + '/v2/apps/' + appCache.appGuid + '/routes/' + routeGuid,
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
//appTarget:
//}
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