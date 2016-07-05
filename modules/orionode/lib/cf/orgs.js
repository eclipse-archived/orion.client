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
var tasks = require('../tasks');
var target = require('./target');
var request = require('request');
var async = require('async');

module.exports.router = function(options) {

	return express.Router()
	.use(bodyParser.json())
	.get('*', getOrgs);
	
	function getOrgs(req, res){
		var task = new tasks.Task(res,false,false,0,false);
		var resp = {};
		var cloudAccessToken = target.getAccessToken();
		var targetURL = JSON.parse(req.query.Target).Url;
		if(!cloudAccessToken){
			// if the token is null, the following info is for orgs endpoint specificly.
			resp = {
		      "description": "Not authenticated",
		      "error_code": "CF-NotAuthenticated"
		    };
			task.done({
				HttpCode: 401,
				Code: 0,
				JsonData: resp,
				Message: "Not authenticated",
				Severity: "Error"
			});
		}
		// if the token exists
		var orgsArray = [];
		new Promise(function(fulfill) {
			var orgsHeader = {
				url: targetURL + '/v2/organizations',
				headers: {'Authorization': cloudAccessToken},
				qs :{'inline-relations-depth':'1'}
				// TODO Need to check if target has Region, need to add region=blabla params as well. 
			};
			request(orgsHeader, function (error, response, body) {
				fulfill(JSON.parse(body));
			});
		}).then(function(result){
			var resources = result.resources;
			return new Promise(function(fulfill,reject){
				async.each(resources, function(resource, cb) {
					var space = [];
					var orgWithSpace = {};
					return new Promise(function(fulfill) {
						var spaceHeader = {
							url: targetURL + resource.entity.spaces_url,
							headers: {'Authorization': cloudAccessToken},
							qs :{'inline-relations-depth':'1'}
						};
						request(spaceHeader, function (error, response, body) {
							fulfill(JSON.parse(body));
						});
					}).then(function(spaceJson){	
						if(spaceJson.total_results < 1){
							// TODO no space needed then I guess.
						}
						var spaceResources = spaceJson.resources;
						for(var k = 0; k < spaceResources.length ; k++ ){
							space.push(resourceJson(spaceResources[k],"Space"));
						}
						orgWithSpace = resourceJson(resource,"Org");
						orgWithSpace.Spaces = space;
						orgsArray.push(orgWithSpace);
						cb();
					});
				}, function(err) {
					if(err){
						return reject(err);
					}
					fulfill();
				});
			});
		}).then(function(){
			resp = {
		      "Orgs" : orgsArray
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

function resourceJson(resource, type){
	return {
		'Guid': resource.metadata.guid,
		'Name': resource.entity.name,
		'Type':	type
	};
}
}