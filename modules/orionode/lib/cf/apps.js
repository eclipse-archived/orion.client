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
	.get('*', getapps);
	
	function getapps(req, res){
		var task = new tasks.Task(res,false,false,0,false);
		var targetRequest = JSON.parse(req.query.Target);
		var targetURL = targetRequest.Url;
		var spaceGuid = targetRequest.SpaceId;
		var encodeName =  req.query.Default;
		var encodedContentLocation =  req.query.ContentLocation;
		var cloudAccessToken = target.getAccessToken();
		var appsArray = [];
		new Promise(function(fulfill) {
			var appsUrl = orgs.getSpace(spaceGuid).entity.apps_url;
			if(encodeName){
				var appsHeader = {
					url: targetURL + appsUrl,
					headers: {'Authorization': cloudAccessToken},
					qs: {"q": "name:"+util.encodeURIComponent(encodeName),"inline-relations-depth":"1"}
				};
				request(appsHeader, function (error, response, body) {
					fulfill(JSON.parse(body));
				});
			}else if(encodedContentLocation) {
				// TODO some thing related to parse Manifest. 
			}else{
				var appsHeader = {
					url: targetURL + appsUrl,
					headers: {'Authorization': cloudAccessToken},
					qs: {"inline-relations-depth":"2"}
				};
				request(appsHeader, function (error, response, body) {
					fulfill(JSON.parse(body));
				});
			}
			
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
			return appsArray;
		}).then(function(appsArray){
			var resp = {};
			if(!appsArray){
				task.done({
					HttpCode: 404,
					Code: 0,
					DetailedMessage: "Apps can not be found",
					JsonData: resp,
					Message: "Apps can not be found",
					Severity: "Error"
				});
			}else{
				resp = {
			      "Apps" : appsArray
			    };
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
};