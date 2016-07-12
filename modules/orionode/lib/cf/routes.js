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
var domains = require('./domains');
var orgs = require('./orgs');
var target = require('./target');
var request = require('request');
var tasks = require('../tasks');

module.exports.router = function(options) {

	return express.Router()
	.use(bodyParser.json())
	.get('*', getroutes)
	.put('*', putroutes);
	
function getroutes(req, res){
	var task = new tasks.Task(res,false,false,0,false);
	var targetRequest = JSON.parse(req.query.Target);
	var RouteJsonRequest = req.query.Route && JSON.parse(req.query.Route);
	var globalCheck = req.query.GlobalCheck;
	var targetURL = targetRequest.Url;
	var spaceGuid = targetRequest.SpaceId;
	var cloudAccessToken = target.getAccessToken();
	var routesArray = [];
	var orphaned = false; // TODO this is hard coded for now!
	new Promise(function(fulfill) {
		if(RouteJsonRequest){
			if(globalCheck && globalCheck === "true"){
				// TODO special case to handle
			}
			// TODO special case to handle
		}
		var routesUrl = orgs.getSpace(spaceGuid).entity.routes_url;
		var orgsHeader = {
			url: targetURL + routesUrl,
			headers: {'Authorization': cloudAccessToken},
			qs :{'inline-relations-depth':'1'}
		};
		request(orgsHeader, function (error, response, body) {
			fulfill(target.parsebody(body));
		});
	}).then(function(result){
		var routesResources = result.resources;
		for(var k = 0; k < routesResources.length; k++){
			if(!orphaned || routesResources.entity.apps.length === 0 ){
				var appArray = [];
				var apps = routesResources[k].entity.apps;
				for(var j = 0; j < apps.length ; j ++){
					appArray.push({
	 					"Guid":apps[j].metadata.guid,
						"Name":apps[j].entity.name,
	 					"State":apps[j].entity.state,
	 					"Type" : "App"
					});
				}
				var routeJson = {
					'Apps' : appArray,
					'DomainName': routesResources[k].entity.domain.entity.name,
					'Guid': routesResources[k].metadata.guid,
					'Host': routesResources[k].entity.host,
					'Type':	'Route'
				};
				routesArray.push(routeJson);
			}
		}
	}).then(function(){
		var resp = {
	      "Routes" : routesArray
	    };
	    task.done({
			HttpCode: 200,
			Code: 0,
			DetailedMessage: "OK",
			JsonData: resp,
			Message: "OK",
			Severity: "Ok"
		});
});
}
	
function putroutes(){
	
}
};