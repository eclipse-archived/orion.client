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

module.exports.router = function() {
	
	module.exports.getOrg = getOrg;
	module.exports.getSpace = getSpace;
	module.exports.getOrgsRequest = getOrgsRequest;
	
	var completeOrgsArray = [];
	var completeSpaceArray = [];

	return express.Router()
	.use(bodyParser.json())
	.get('*', getOrgs);
		
function getOrgs(req, res){
	completeOrgsArray = [];
	completeSpaceArray = [];
	var task = new tasks.Task(res,false,false,0,false);
	var resp = {};
	var cloudAccessToken = target.getAccessToken(task);
	var targetRequest = JSON.parse(req.query.Target);
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
	getOrgsRequest(targetRequest)
	.then(function(simpleorgsArray){
		resp = {
			"Orgs" : simpleorgsArray
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

function getOrgsRequest(targetRequest){
	// if the token exists
	var simpleorgsArray = [];
	var cloudAccessToken = target.getAccessToken();
	return new Promise(function(fulfill) {
		var orgsHeader = {
			url: targetRequest.Url + '/v2/organizations',
			headers: {'Authorization': cloudAccessToken},
			qs :{'inline-relations-depth':'1'}
			// TODO Need to check if target has Region, need to add region=blabla params as well. 
		};
		request(orgsHeader, function (error, response, body) {
			fulfill(target.parsebody(body));
		});
	}).then(function(result){
		completeOrgsArray = result.resources;
		return new Promise(function(fulfill,reject){
			if(completeOrgsArray){
				async.each(completeOrgsArray, function(resource, cb) {
					var space = [];
					var orgWithSpace = {};
					return new Promise(function(fulfill) {
						var spaceHeader = {
							url: targetRequest.Url + resource.entity.spaces_url,
							headers: {'Authorization': cloudAccessToken},
							qs :{'inline-relations-depth':'1'}
						};
						request(spaceHeader, function (error, response, body) {
							fulfill(target.parsebody(body));
						});
					}).then(function(spaceJson){	
						if(spaceJson.total_results < 1){
							// TODO no space needed then I guess.
						}
						var spaceResources = spaceJson.resources;
						completeSpaceArray.push(spaceResources);
						for(var k = 0; k < spaceResources.length ; k++ ){
							space.push(resourceJson(spaceResources[k],"Space"));
						}
						orgWithSpace = resourceJson(resource,"Org");
						orgWithSpace.Spaces = space;
						simpleorgsArray.push(orgWithSpace);
						cb();
					});
				}, function(err) {
					if(err){
						return reject(err);
					}
					fulfill(simpleorgsArray);
				});
			}
		});
	});
}

function resourceJson(resource, type){
	return {
		'Guid': resource.metadata.guid,
		'Name': resource.entity.name,
		'Type': type
	};
}
function getOrg(name){
	return completeOrgsArray.find(function(org){
		return org.entity.name === name;
	});
}
function getSpace(guid,name){
	var neededSpace;
	completeSpaceArray.some(function(spaces){
		return spaces.some(function(space){
			if(guid && space.metadata.guid === guid){
				neededSpace = space;
				return true;
			}
			if(name && space.entity.name === name){
				neededSpace = space;
				return true;
			}
		})
	});
	return neededSpace;
}
};