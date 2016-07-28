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
	
	module.exports.getOrgsRequest = getOrgsRequest;

	return express.Router()
	.use(bodyParser.json())
	.get('*', getOrgs);
		
function getOrgs(req, res){
	var task = new tasks.Task(res,false,false,0,false);
	var resp = {};
	var targetRequest = JSON.parse(req.query.Target);
	getOrgsRequest(req.user.username, targetRequest, task)
	.then(function(orgsArray){
		resp = {
			"Orgs" : orgsArray.simpleorgsArray
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

function getOrgsRequest(userId, targetRequest, task){
	var completeOrgsArray = [];
	var simpleorgsArray = [];
	return target.cfRequest('GET', userId, task, targetRequest.Url + '/v2/organizations', {'inline-relations-depth':'1'})
	// TODO In Java code, there is a case that Region is needed, but that value was always assigned as null.
	.then(function(result){
		completeOrgsArray = result.resources;
		return new Promise(function(fulfill,reject){
			if(completeOrgsArray){
				async.each(completeOrgsArray, function(resource, cb) {
					var space = [];
					var orgWithSpace = {};
					return target.cfRequest('GET', userId, null, targetRequest.Url + resource.entity.spaces_url, {'inline-relations-depth':'1'})
					.then(function(spaceJson){	
						if(!spaceJson || spaceJson.total_results < 1){
							cb();
						}
						var spaceResources = spaceJson.resources;
						for(var k = 0; k < spaceResources.length ; k++ ){
							space.push(resourceJson(spaceResources[k],"Space"));
						}
						orgWithSpace = resourceJson(resource,"Org");
						orgWithSpace.Spaces = space;
						resource.Spaces = spaceResources;
						simpleorgsArray.push(orgWithSpace);
						cb();
					});
				}, function(err) {
					if(err){
						return reject(err);
					}			
					fulfill({'simpleorgsArray':simpleorgsArray,'completeOrgsArray':completeOrgsArray});
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
};