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
var orgs = require('./orgs');
var target = require('./target');
var request = require('request');
var tasks = require('../tasks');
var util = require('../git/util');
var manifests = require('./manifests');
var domains = require('./domains');
var xfer = require('../xfer');
var fs = require('fs');
var path = require('path');

module.exports.router = function(options) {
	var appCache = {};
	
	module.exports.getAppCache = getAppCache;
	return express.Router()
	.use(bodyParser.json())
	.get('*', getapps)
	.put('*', putapps);
	
	function getapps(req, res){
		var targetRequest = JSON.parse(req.query.Target);
		var encodeName =  req.query.Name;
		var encodedContentLocation =  req.query.ContentLocation;
		if(encodeName){
			 getAppwithAppName(req, res);
		}else if(encodedContentLocation) {
			// TODO some thing related to parse Manifest. 
		}else{
			 getAppwithoutName(req, res);
		}
	}
	
	function respondAppgetRequest(resp){
		var task = new tasks.Task(res,false,false,0,false);
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
	
	function getAppwithoutName(req, res){
		var targetRequest = JSON.parse(req.query.Target);
		var appsArray = [];
		var cloudAccessToken = target.getAccessToken();
		return new Promise(function(fulfill) {
			var appsUrl = orgs.getSpace(targetRequest.SpaceId).entity.apps_url;
			var appsHeader = {
				url: targetRequest.Url + appsUrl,
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
		}).then(respondAppgetRequest);
	}
	
	function getAppwithAppName(req, res){
		var targetRequest = JSON.parse(req.query.Target);
		var encodeName =  req.query.Name;
		return _getAppwithAppName(targetRequest,encodeName);
	}
	
	function _getAppwithAppName(targetRequest,encodeName){
		var cloudAccessToken = target.getAccessToken();
		return new Promise(function(fulfill) {
			var appsUrl = orgs.getSpace("",targetRequest.Space).entity.apps_url;
			var appsHeader = {
				url: targetRequest.Url + appsUrl,
				headers: {'Authorization': cloudAccessToken},
				qs: {"q": "name:"+util.encodeURIComponent(encodeName),"inline-relations-depth":"1"}
			};
			request(appsHeader, function (error, response, body) {
				fulfill(target.parsebody(body));
			});
		}).then(function(result){
			if(!result.resource || result.resource && result.resource.length === 0){
				return null;
			}
			var appJson = result.resources[0].metadata;
			return new Promise(function(fulfill) {
				var appsHeader = {
					url: targetRequest.Url + appJson.url +'/summary',
					headers: {'Authorization': cloudAccessToken}
				};
				request(appsHeader, function (error, response, body) {
					appCache.summaryJson = target.parsebody(body);
				});
			}).then(function(){
				return new Promise(function(fulfill) {
					var appsHeader = {
						url: targetRequest.Url + appJson.url +'/instances',
						headers: {'Authorization': cloudAccessToken}
					};
					request(appsHeader, function (error, response, body) {
						appCache.instanceJson = target.parsebody(body);
						fulfill();
					});
				});
			}).then(function(){
				appJson.instances_details = appCache.instanceJson;
				return appJson;
			}).then(respondAppgetRequest);
		});
	}
	
	function putapps(req, res){
		var task = new tasks.Task(res,false,false,0,false);
		var targetRequest = req.body.Target;
//		var path = req.baseUrl.split('\\');
//		if(path[1] === 'routes'){
//			// TODO complete the add route case.
//			var appGuid = path[0];
//			var routeGuid = path[2];
//		}
		var state = req.body.State;
		var appName = req.body.Name;
		var contentLocation = toOrionLocation(req, req.body.ContentLocation);
		appCache.appStore = contentLocation.replace('\manifest.yml','');  // TODO need a better way to get the target folder.
		function toOrionLocation(req, location){
			if(location && location.length !== 0 && location.indexOf('/file') === 0){
				return path.join(req.user.workspaceDir, location.substring(5)); 
			}
		}
		/* custom packager details */
		var packagerName = req.body.Packager;
		/* non-manifest deployments using a .json representation */
		var manifestJSON = req.body.Manifest;
		var instrumentationJSON = req.body.Instrumentation;
		/* default application startup is one minute */
		var userTimeout = req.body.Timeout &&  req.body.Timeout > 0 ? req.body.Timeout:0;
		
		var app = null;
		
		/* parse the application manifest */
		var manifestAppName = null;
		
		Promise.resolve()
		.then(function(){
			if(contentLocation && !state){
				var waitFor;
				if(manifestJSON){
					/* check for non-manifest deployment */
					waitFor = Promise.resolve(manifestJSON);
				}else{
					waitFor = manifests.retrieveManifestFile(req, res);
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
			return _getAppwithAppName(targetRequest,appName? appName : manifestAppName)
				.then(function(appResult){
					return app = appResult;
				});
		}).then(function(){
			if(app){
				// This part if for the case that app has already uploaded.
				if(state === 'Started'){
					return startApp(targetRequest,app,userTimeout);
				}else if(state === 'Stopped'){
					// TODO do stop
				}else{
					if(!appCache.manifest){
						res.status(500).end('Failed to handle request for '+ path);
					}
				}
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
			var restart =true;
			if(!app){
				// Why app can be null here? is that possible?
				restart = false;
			}
			instrumentManifest(appCache.manifest,instrumentationJSON);
			appCache.appName = appName ? appName : manifestAppName;
			/* determine deployment packager */
			var packager;
			// TODO currently hard code packager to null; Need to implement for real
//			packager = getDeploymentPackager(packagerName);
			return pushApp(req, res);
			
			// TODO getApprespond again!
		});
	}
	
	function startApp(targetRequest,app,userTimeout){
		var DEFAULT_TIMEOUT = 60;
		var MAX_TIMEOUT = 180;
		var cloudAccessToken = target.getAccessToken();
		var body = {'console':'true','state':'STARTED'}
		return new Promise(function(fulfill) {
			var startAppHeader = {
				url: targetRequest.Url + app.url,
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
			    		if(!result.data && result.attemptsLeft > 0){
				            return promiseWhile(result.attemptsLeft);
						}else if(result.data){
							var instancesNo = result.data.length();
							var runningInstanceNo = 0;
							var flappingInstanceNo = 0;
							result.data.forEach(function(eachOne){
								if(eachOne.state === 'RUNNING'){
									runningInstanceNo++;
								}else if(eachOne.state === 'FLAPPING'){
									flappingInstanceNo++;
								}
								if (runningInstanceNo === instancesNo) {
									return null;
								}
								if (flappingInstanceNo > 0 ) {
									// TODO error respond
									return null;
								}
							});
						}else if(result.attemptsLeft === 0 ){
							// TODO error respond
							return null;
						}
			    	});
			    });
			}
			function collectCFRespond(){
				return new Promise(function(fulfill){
					setTimeout(function(){
						var cfAppStartRespondHeader = {
							url: targetRequest.Url + '/instances',
							headers: {'Authorization': cloudAccessToken}
						};
						request(cfAppStartRespondHeader, function (error, response, body) {
							if(error) fulfill({'attemptsLeft':--attemptsLeft});
							fulfill({'data': target.parsebody(body)});
						})
					}, 2000);
				});
			}
			return promiseWhile(attemptsLeft);
		});
	}
	
	function pushApp(req, res){
		var waitFor;
		if(appCache.summaryJson){
			waitFor = updateApp(req, res);
		}else{
			waitFor = createApp(req, res)
		}
		// TODO one missing step to: look up available environment extension services
		/* set up the application route */
		var respondAppJson;
		var domainName;
		return waitFor.then(function(respondJson){
			respondAppJson = respondJson;
			return bindRoute(req, res);
		})
		/* upload application contents */
		.then(function(respondJson){
			domainName = respondJson;
			return uploadBits(req, res);
		})
		/* bind application specific services */
		.then(function(){
			return bindServices(req, res);
		})
		/* craft command result */
		.then(function(){
			var DEFAULT_TIMEOUT = 60;
			var result = {
				'Target' : JSON.parse(req.query.Target),
				// TODO handld target manageUrl if target has one
				'App' : respondAppJson,
				'Domain': appCache.appDomain,
				'Route': appCache.appRoute,
				'Timeout': appCache.manifest.applications[0].timeout || DEFAULT_TIMEOUT,
				'DeployedPackage': appCache.appPackageType || 'unknown'
			};
			return result;
		});
	}
	function createApp(req, res){
		var targetRequest = req.body.Target;
		// TODO handle stack!  get correct stack_guid;
		var cloudAccessToken = target.getAccessToken();
		var body = {
			'space_guid': orgs.getSpace("",targetRequest.Space).metadata.guid,
			'name':appCache.appName,
			'instances':appCache.manifest.applications[0].instances || 1,
			'buildPack':appCache.manifest.applications[0].buildpack || null,
			'command':appCache.manifest.applications[0].command,	
			'memory': normalizeMemoryMeasure(appCache.manifest.applications[0].memory),
			'stack_guid':null,
			'environment_json':appCache.manifest.applications[0].env || {}
			};
		return new Promise(function(fulfill) {
			var createAppHeader = {
				url: targetRequest.Url + '/v2/apps',
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
	}
	function updateApp(req, res){
		var targetRequest = req.body.Target;
		
	}
	function bindRoute(req, res){
		var targetRequest = req.body.Target;
		var cloudAccessToken = target.getAccessToken();
		return domains.getCFdomains(targetRequest)
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
				// TODO maybe need to assert that appCache.appDomain != null;
			} else {
				/* client has not requested a specific domain, get the first available */
				appCache.appDomain = domains.get(0);
			}
		})
		/* find out whether the declared host can be reused */
		.then(function(){
			return new Promise(function(fulfill) {
				var findrouteHeader = {
					url: targetRequest.Url + '/v2/routes',
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
				}
				/* create a new route */
				waitForRoute = createRoute(req, res);
				/* attach route to application */
				return waitForRoute.then(function(appRoute){
					return new Promise(function(fulfill) {
						appCache.appRoute = appRoute;
						var attachrouteHeader = {
							url: targetRequest.Url + '/v2/apps/' + appCache.appGuid + '/routes/' + appRoute.metadata.guid,
							headers: {'Authorization': cloudAccessToken}
						};
						request.put(attachrouteHeader, function (error, response, body) {
							if(!error) fulfill(target.parsebody(body));
						});
					});
				});
			});
		});
	}
	function uploadBits(req, res){
		var targetRequest = req.body.Target;
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
					uri: targetRequest.Url + '/v2/apps/' + appCache.appGuid + "/bits",
					headers: {'Authorization': cloudAccessToken},
					qs : {'async':'true'},
					multipart :[
						{
							'content-type': 'text/plain',
							body: JSON.stringify({
								name:'resources',
								value:'[]'
							})
						},
						{
							'content-type': 'application/octet-stream',
							body: fs.createReadStream(archiveredFilePath)
						}
					]
				};
				console.log(uploadBitsHeader);
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
							url: targetRequest.Url + result.metadata.url,
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

	function bindServices(req, res){
		var targetRequest = req.body.Target;
		if(appCache.manifest.applications[0].services){
			// TODO do bind service.
		}
	}
	function createRoute(req, res){
		var targetRequest = req.body.Target;
		var cloudAccessToken = target.getAccessToken();
		var body = {
			'space_guid': orgs.getSpace("",targetRequest.Space).metadata.guid,
			'host':appCache.manifest.applications[0].host || slugify(appCache.appName),
			'domain_guid':appCache.appDomain.Guid
		};
		return new Promise(function(fulfill) {
			var findrouteHeader = {
				url: targetRequest.Url + '/v2/routes',
				headers: {'Authorization': cloudAccessToken},
				qs: {"inline-relations-depth":"1"},
				body:JSON.stringify(body)
			};
			request.post(findrouteHeader, function (error, response, body) {
				if(!error) fulfill(target.parsebody(body));
			});
		});
		
	}
	function getAppCache(){
		return appCache;
// 		appCache's shape 
//		{
//			appName:
//			appGuid:
//			manifest:
//			summaryJson:
//			instanceJson:
//			appDomain:
//			appRoute:
//			appStore:
//			appPackageType:
//		}
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
		    .replace(/\s+/g, '-')           // Replace spaces with -
		    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
		    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
		    .replace(/^-+/, '')             // Trim - from start of text
		    .replace(/-+$/, '');            // Trim - from end of text
	}
};