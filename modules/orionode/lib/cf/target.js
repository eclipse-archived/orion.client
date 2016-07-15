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
var request = require('request');
var orgs = require('./orgs');

module.exports.router = function() {
	
	module.exports.getAccessToken = getAccessToken;
	module.exports.parsebody = parsebody;
	module.exports.computeTarget = computeTarget;

	return express.Router()
	.use(bodyParser.json())
	.get('*', getTarget)
	.post('*', postTarget);
	
	var accessToken;
	
function getTarget(req,res){
	var task = new tasks.Task(res,false,false,0,false);
	var url = req.body.Url;
	var resp = {
		"Type": "Target",
		"Url": url
	};
	task.done({
		HttpCode: 200,
		Code: 0,
		JsonData: resp,
		Message: "OK",
		Severity: "Ok"
	});
}

function postTarget(req,res){
	var task = new tasks.Task(res,false,false,0,false);
	var url = req.body.Url;
	var Password = req.body.Password;
	var Username = req.body.Username;
	// TODO get realy target json
	
	// Try to login here!!
	tryLogin(url,Username,Password)
	.then(function(result){
		// TODO if the result is true, may be should send back the real target.
		var resp = {
			"Type": "Target",
			"Url": url
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

function tryLogin(url, Username, Password){
	return new Promise(function(fulfill) {
		var infoHeader = {
			url: url + '/v2/info',
			headers: {'Accept': 'application/json',	'Content-Type': 'application/json'}
		};
		request(infoHeader, function (error, response, body) {
			fulfill(parsebody(body));
		});
	}).then(function(response){
		var authorizationEndpoint = response.authorization_endpoint;
		return new Promise(function(fulfill, reject) {
			var authorizationHeader = {
				url: authorizationEndpoint + '/oauth/token',
				headers: {'Accept': 'application/json',	'Content-Type': 'application/x-www-form-urlencoded','Authorization':'Basic Y2Y6'},
				form: {'grant_type':'password', 'password': Password, 'username':Username, 'scope':''}
			};
			request.post(authorizationHeader, function (error, response, body) {
				var respondJson = parsebody(body);
				if(!error){
					accessToken = "bearer " + respondJson.access_token;
					return fulfill(true);
				}
				return reject(false);
			});
		});
	});
}

function computeTarget(targetRequest){
	var appTarget = {};
	return orgs.getOrgsRequest(targetRequest)
	.then(function(simpleOrgsArray){
		appTarget = {
			"Type": "Target",
        	"Url": targetRequest.Url
		};
		if(!targetRequest.Org){
			var org = simpleOrgsArray[0];
		}else{
			var aimedOrg = simpleOrgsArray.find(function(org){
				return org.Name === targetRequest.Org || org.Guid === targetRequest.Org;
			});
			org = aimedOrg;
		}
		if(!targetRequest.Space){
			var space = org.Spaces[0];
		}else{
			var aimedSpace = org.Spaces.find(function(space){
				return space.Name === targetRequest.Space || space.Guid === targetRequest.Space;
			});
			space = aimedSpace;
		}
		appTarget.Org = makeJson(org,'Org');
		appTarget.Space = makeJson(space,'Space');
		return appTarget;
	});
	function makeJson(target, type){
		return {
			'Guid': target.Guid,
			'Name': target.Name,
			'Type': type
		};
	}
}

function getAccessToken(task){
	if(!accessToken && task){
		// if the token is null, the following info is for orgs endpoint specificly.
		var resp = {
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
	return accessToken;
}
function parsebody(body){
	return typeof body === 'string' ? JSON.parse(body): body;
}
};