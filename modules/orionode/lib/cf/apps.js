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
var bodyParser = require('body-parser');
var orgs = require('./orgs');
var target = require('./target');
var request = require('request');
var tasks = require('../tasks');
var util = require('../git/util');

module.exports.router = function(options) {
	
	return express.Router()
	.use(bodyParser.json())
	.get('*', getapps)
	.put('*', putapps);
	
	function getapps(req, res){
		var task = new tasks.Task(res,false,false,0,false);
		var targetRequest = JSON.parse(req.query.Target);
		var encodeName =  req.query.Name;
		var encodedContentLocation =  req.query.ContentLocation;
		var waitFor;
		if(encodeName){
			waitFor = getAppwithAppName(targetRequest,encodeName);
		}else if(encodedContentLocation) {
			// TODO some thing related to parse Manifest. 
		}else{
			waitFor = getAppwithoutName(targetRequest);
		}
		waitFor.then(function(resp){
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
		});
	}
	
	function getAppwithoutName(targetrequest){
		var appsArray = [];
		var cloudAccessToken = target.getAccessToken();
		return new Promise(function(fulfill) {
			var appsUrl = orgs.getSpace(targetrequest.SpaceId).entity.apps_url;
			var appsHeader = {
				url: targetrequest.Url + appsUrl,
				headers: {'Authorization': cloudAccessToken},
				qs: {"inline-relations-depth":"2"}
			};
			request(appsHeader, function (error, response, body) {
				fulfill(JSON.parse(body));
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
		});
	}
	
	function getAppwithAppName(targetrequest,encodeName){
		var cloudAccessToken = target.getAccessToken();
		return new Promise(function(fulfill) {
			var appsUrl = orgs.getSpace("",targetrequest.Space).entity.apps_url;
			var appsHeader = {
				url: targetrequest.Url + appsUrl,
				headers: {'Authorization': cloudAccessToken},
				qs: {"q": "name:"+util.encodeURIComponent(encodeName),"inline-relations-depth":"1"}
			};
			request(appsHeader, function (error, response, body) {
				fulfill(JSON.parse(body));
			});
		}).then(function(result){
			if(!result.resource || result.resource && result.resource.length === 0){
				return null;
			}
			var appJson = result.resources[0].metadata;
			var summaryJson,instanceJson;
			return new Promise(function(fulfill) {
				var appsHeader = {
					url: targetrequest.Url + appJson.url +'/summary',
					headers: {'Authorization': cloudAccessToken}
				};
				request(appsHeader, function (error, response, body) {
					summaryJson = JSON.parse(body);
				});
			}).then(function(){
				var appsHeader = {
					url: targetrequest.Url + appJson.url +'/instances',
					headers: {'Authorization': cloudAccessToken}
				};
				request(appsHeader, function (error, response, body) {
					instanceJson = JSON.parse(body);
				});
			}).then(function(){
				var detail;
				// TODO Can not get this step yet, need to implement put request first.
				return {'instances_details' : detail};
			});
		});
	}
	
	function putapps(req, res){
		
	}
};