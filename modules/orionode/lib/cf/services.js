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
var orgs = require('./orgs_spaces');
var target = require('./target');
var request = require('request');
var tasks = require('../tasks');
var async = require('async');

module.exports.router = function() {
	
	return express.Router()
	.use(bodyParser.json())
	.get('*', getService);
	
function getService(req, res){
	var task = new tasks.Task(res,false,false,0,false);
	var targetRequest = JSON.parse(req.query.Target);
	var targetURL = targetRequest.Url;
	var spaceGuid = targetRequest.SpaceId;
	var cloudAccessToken = target.getAccessToken(req.user.username, task);
	new Promise(function(fulfill) {
		var serviceUrl = '/v2/spaces/' + spaceGuid + '/service_instances';
		var fullService = [];
		function promiseWhile(doRequest, value) {
			return Promise.resolve(value).then(doRequest).then(function(result) {
				return collectServiceInfo(result)
				.then(function(){
					if(result.next_url){
						serviceUrl = result.next_url;				
						return promiseWhile(doRequest, serviceUrl);
					}
					return null;
				});
			});
		}
		function doRequest(serviceUrl){
			var servicesHeader = {
				url: targetURL + serviceUrl,
				headers: {'Authorization': cloudAccessToken},
				qs :{'inline-relations-depth':'1','return_user_provided_service_instances':'true'}
			};
			return new Promise(function(fulfill) {
				request(servicesHeader, function (error, response, body) {
					fulfill(target.parsebody(body));
				});
			});
		}
		function collectServiceInfo(result){
			var serviceResources = result.resources;
			return new Promise(function(fulfill , reject){
				async.each(serviceResources, function(resource, cb) {
					var isBindable = true;
					if(resource.entity.service_plan){
						var serviceEntity = resource.entity.service_plan.entity;
						var serviceGuid = serviceEntity.service_guid;
						return getCFService(req.user.username, targetURL,serviceGuid)
						.then(function(singleServiceresult){
							isBindable = singleServiceresult.entity.bindable;				
						}).then(function(){
							if(isBindable){
								var ServiceJson = {
									'Name': resource.entity.name,
									'Type':	'Service'
								};
								fullService.push(ServiceJson);
							}
							cb();
						});
					}
				}, function(err) {
					if(err){
						return reject(err);
					}
					fulfill();
				});
			});
		}
		return promiseWhile(doRequest,serviceUrl)
		.then(function(){
			fulfill(fullService);
		});
	}).then(function(fullService){
		var resp = {
			"Children" : fullService
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

function getCFService(userId, targetURL,serviceGuid){
	var cloudAccessToken = target.getAccessToken(userId);
	return new Promise(function(fulfill) {
		var serviceHeader = {
			url: targetURL + '/v2/services/' + serviceGuid,
			headers: {'Authorization': cloudAccessToken}
		};
		request(serviceHeader, function (error, response, body) {
			fulfill(target.parsebody(body));
		});
	});
}
};