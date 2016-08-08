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
var express = require("express");
var bodyParser = require("body-parser");
var tasks = require("../tasks");
var request = require("request");
var orgs = require("./orgs_spaces");
var UseraccessToken = {};

module.exports.router = function() {
	
	module.exports.getAccessToken = getAccessToken;
	module.exports.parsebody = parsebody;
	module.exports.computeTarget = computeTarget;
	module.exports.cfRequest = cfRequest;

	return express.Router()
	.use(bodyParser.json())
	.get("*", getTarget)
	.post("*", postTarget);
	
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
	// Try to login here!!
	tryLogin(url,Username,Password,req.user.username)
	.then(function(result){
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
function tryLogin(url, Username, Password, userId){
	var infoHeader = {
		url: url + "/v2/info",
		headers: {"Accept": "application/json",	"Content-Type": "application/json"}
	};
	return cfRequest(null, null , null, null, null, null, null, infoHeader)
	.then(function(response){
		var authorizationEndpoint = response.authorization_endpoint;
		return new Promise(function(fulfill, reject) {
			var authorizationHeader = {
				url: authorizationEndpoint + "/oauth/token",
				headers: {"Accept": "application/json",	"Content-Type": "application/x-www-form-urlencoded","Authorization":"Basic Y2Y6"},
				form: {"grant_type": "password", "password": Password, "username": Username, "scope": ""}
			};
			request.post(authorizationHeader, /* @callback */ function (error, response, body) {
				var respondJson = parsebody(body);
				if(!error){
					UseraccessToken[userId] = respondJson.access_token;
					return fulfill(true);
				}
				return reject(false);
			});
		});
	});
}
function computeTarget(userId, targetRequest, task){
	if(targetRequest){
		return orgs.getOrgsRequest(userId, targetRequest, task)
		.then(function(OrgsArray){	
			if(!targetRequest.Org){
				var org = OrgsArray.completeOrgsArray[0];
			}else{
				var aimedOrg = OrgsArray.completeOrgsArray.find(function(org){
					return org.entity.name === targetRequest.Org || org.metadata.guid === targetRequest.Org;
				});
				org = aimedOrg;
			}
			if(!targetRequest.Space){
				var space = org.Spaces[0];
			}else{
				var aimedSpace = org.Spaces.find(function(space){
					return space.entity.name === targetRequest.Space || space.metadata.guid === targetRequest.Space;
				});
				space = aimedSpace;
			}
			delete org.Spaces;
			return  {
				"Type": "Target",
				"Url": targetRequest.Url,
				"Org": org,
				"Space":space
			};
		});
	}
	if(!targetRequest){
		task.done({
			HttpCode: 402,
			Code: 0,
			DetailedMessage: "CF-TargetNotSet",
			JsonData: {},
			Message: "Target not set",
			Severity: "Error"
		});
	}
}
function getAccessToken(userId, task){
	if(!UseraccessToken[userId] && task){
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
	return UseraccessToken[userId];
}
function parsebody(body){
	return typeof body === "string" ? JSON.parse(body): body;
}
function cfRequest (method, userId, task, url, query, body, headers, requestHeader) {
	return new Promise(function(fulfill, reject) {
		if(!requestHeader){
			var cloudAccessToken = getAccessToken(userId, task);
			if (!cloudAccessToken) {
				return;
			}
			headers = headers || {};
			headers.Authorization = cloudAccessToken;
			requestHeader = {};
			requestHeader.url = url;
			requestHeader.headers = headers;
			query && (requestHeader.qs = query);
			body && (requestHeader.body = body);
			requestHeader.method = method;
		}
		if (requestHeader.headers.Authorization) {
			requestHeader.headers.Authorization = "bearer " + requestHeader.headers.Authorization;
		}
		request(requestHeader, /* @callback */ function (error, response, body) {
			if (error) {
				return reject(error);
			}
//			if (response.status) {
//				return reject();
//			}
			if (body instanceof Uint8Array) {
				fulfill(response);
			}
			else {
            	fulfill(parsebody(body));
			}
		});
	});
}
};