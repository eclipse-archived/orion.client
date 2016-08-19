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
var target = require("./target");
var tasks = require("../tasks");
var async = require("async");

module.exports.router = function() {

	return express.Router()
		.use(bodyParser.json())
		.get("*", getService);

	function getService(req, res) {
		var task = new tasks.Task(res, false, false, 0, false);
		var targetRequest = JSON.parse(req.query.Target);
		var targetURL = targetRequest.Url;
		var spaceGuid = targetRequest.SpaceId;
		if (spaceGuid && targetURL) {
			var serviceUrl = "/v2/spaces/" + spaceGuid + "/service_instances";
			var fullService = [];
			function promiseWhile(doRequest, value) {
				return Promise.resolve(value).then(doRequest).then(function(result) {
					return collectServiceInfo(result)
						.then(function() {
							if (result && result.next_url) {
								serviceUrl = result.next_url;
								return promiseWhile(doRequest, serviceUrl);
							}
							return null;
						});
				});
			}
			function doRequest(serviceUrl) {
				return target.cfRequest("GET", req.user.username, targetURL + serviceUrl, {
					"inline-relations-depth": "1",
					"return_user_provided_service_instances": "true"
				});
			}
			function collectServiceInfo(result) {
				var serviceResources = result && result.resources;
				if (serviceResources) {
					return new Promise(function(fulfill, reject) {
						async.each(serviceResources, function(resource, cb) {
							var isBindable = true;
							if (resource.entity.service_plan) {
								var serviceEntity = resource.entity.service_plan.entity;
								var serviceGuid = serviceEntity.service_guid;
								return getCFService(req.user.username, targetURL, serviceGuid)
								.then(function(singleServiceresult) {
									isBindable = singleServiceresult.entity.bindable;
								}).then(function() {
									if (isBindable) {
										var ServiceJson = {
											"Name": resource.entity.name,
											"Type": "Service"
										};
										fullService.push(ServiceJson);
									}
									cb();
								}).catch(function(err){
									cb(err);
								});
							}
						}, function(err) {
							if (err) {
								return reject({"message":err.message});
							}
							fulfill();
						});
					});
				}
				return Promise.resolve();
			}
			
			promiseWhile(doRequest, serviceUrl)
			.then(function() {
				return fullService;
			}).then(function(fullService) {
				var resp = {
					"Children": fullService
				};
				task.done({
					HttpCode: 200,
					Code: 0,
					DetailedMessage: "OK",
					JsonData: resp,
					Message: "OK",
					Severity: "Ok"
				});
			}).catch(function(err) {
				target.caughtErrorHandler(task, err);
			});
		}else{
			task.done({
				HttpCode: 500,
				Code: 0,
				JsonData: {
					"description": "Target not set",
					"error_code": "CF-TargetNotSet"
				},
				DetailedMessage: "Target not set",
				Message: "Target not set",
				Severity: "Error"
			});
		}
	}

	function getCFService(userId, targetURL, serviceGuid) {
		return target.cfRequest("GET", userId, targetURL + "/v2/services/" + serviceGuid);
	}
};