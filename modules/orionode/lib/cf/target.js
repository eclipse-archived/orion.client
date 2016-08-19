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
	module.exports.caughtErrorHandler = caughtErrorHandler;

	return express.Router()
	.use(bodyParser.json())
	.get("*", getTarget)
	.post("*", postTarget);
	
function getTarget(req,res){
	// TODO this end point hasn't been used yet, since wasn't fully implemented yet.
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
	.then(function() {
		task.done({
			BundleId: "unknown",
			HttpCode: 200,
			Code: 0,
			JsonData: {"Type": "Target", "Url": url},
			Message: "OK",
			Severity: "Ok"
		});
	}).catch(function(err){
		caughtErrorHandler(task, err);
	});
}
function tryLogin(url, Username, Password, userId){
	var infoHeader = {
		url: url + "/v2/info",
		headers: {"Accept": "application/json",	"Content-Type": "application/json"}
	};
	return cfRequest(null, null, null, null, null, null, infoHeader)
	.then(function(response){
		var authorizationEndpoint = response.authorization_endpoint;
		return new Promise(function(fulfill, reject) {
			var authorizationHeader = {
				url: authorizationEndpoint + "/oauth/token",
				headers: {"Accept": "application/json",	"Content-Type": "application/x-www-form-urlencoded","Authorization":"Basic Y2Y6"},
				form: {"grant_type": "password", "password": Password, "username": Username, "scope": ""}
			};
			request.post(authorizationHeader, function (error, response, body) {
				var respondJson = parsebody(body);
				if(!error && response.statusCode === 200){
					UseraccessToken[userId] = respondJson.access_token;
					return fulfill();
				}
				return error ? reject({"code": 400, "data":error, "bundleid":"org.eclipse.orion.server.core"}) : 
				reject({"code":response.statusCode,"data": respondJson,"bundleid":"org.eclipse.orion.server.core"});
			});
		});
	});
}
function computeTarget(userId, targetRequest){
	if(targetRequest){
		return orgs.getOrgsRequest(userId, targetRequest)
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
		return Promise.reject({
			"code":500, 
			"message":"Target not set",
			"detailMessage":"Target not set",
			"data":{
				"description": "Target not set",
				"error_code": "CF-TargetNotSet"
			}
		});
	}
}
function getAccessToken(userId){
	return UseraccessToken[userId];
}
function caughtErrorHandler(task, err){
	var errorResponse = {
		HttpCode: err.code || 400,
		Code: 0,
		DetailedMessage: err.detailMessage || err.message,
		JsonData: err.data || {},
		Message: err.message,
		Severity: "Error"
	};
	if(err.bundleid){
		errorResponse.BundleId = err.bundleid;
	}
	task.done(errorResponse);
}
function parsebody(body){
	return typeof body === "string" ? JSON.parse(body): body;
}
function cfRequest (method, userId, url, query, body, headers, requestHeader) {
	return new Promise(function(fulfill, reject) {
		if(!requestHeader){
			var cloudAccessToken = getAccessToken(userId);
			if (!cloudAccessToken) {
				return reject(
					{
						"code":401,
						"message":"Not authenticated",
						"data":{
							"description": "Not authenticated",
							"error_code": "CF-NotAuthenticated"
						}
					}
				);
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