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
var orgs = require('./orgs_spaces');
var target = require('./target');
var request = require('request');
var tasks = require('../tasks');
var util = require('../git/util');

module.exports.router = function() {

	return express.Router()
		.use(bodyParser.json())
		.get('*', getroutes)
		.put('*', putroutes);

	function getroutes(req, res) {
		var task = new tasks.Task(res, false, false, 0, false);
		var targetRequest = JSON.parse(req.query.Target);
		var RouteJsonRequest = req.query.Route && JSON.parse(req.query.Route);
		var globalCheck = req.query.GlobalCheck;
		var waitForGetRouteJson;
		if (RouteJsonRequest) {
			if (globalCheck && globalCheck === "true") {
				// TODO need to test the following two cases.
				waitForGetRouteJson = checkRouteRequest(req.user.username,targetRequest, RouteJsonRequest.DomainName, RouteJsonRequest.Host);
			}
			waitForGetRouteJson = getRouteRequest(req.user.username, targetRequest, RouteJsonRequest.DomainName, RouteJsonRequest.Host);
		}
		waitForGetRouteJson = getRouteRequest(req.user.username, targetRequest, false);
		Promise.resolve(waitForGetRouteJson)
			.then(function(routes) {
				var resp = {
					"Routes": routes
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
	function checkRouteRequest(userId, targetRequest, domainName, host) {
		var cloudAccessToken = target.getAccessToken(userId);
		return domains.getCFdomains(userId, targetRequest.Url, targetRequest.Org, domainName)
		.then(function(domains) {
			return new Promise(function(fulfill) {
				var domainGuid = domains[0].metadata.guid;
				var checkRouteHeader = {
					url: targetRequest.Url + '/v2/routes/reserved/domain/' + domainGuid + '/host/' + host,
					headers: {
						'Authorization': cloudAccessToken
					}
				};
				request(checkRouteHeader, function(error, response, body) {
					fulfill(target.parsebody(body));
				});
			});
		});
	}
	function getRouteRequest(userId, targetRequest) {
		var cloudAccessToken = target.getAccessToken(userId);
		var routesArray = [];
		if (arguments.length === 4) {
			var domainName = arguments[2];
			var host = arguments[3];
		} else if (arguments.length === 3) {
			var orphaned = arguments[2];
		}
		return new Promise(function(fulfill) {
				if (domainName && host) {
					return domains.getCFdomains(userId, targetRequest.Url, targetRequest.Org, domainName)
						.then(function(domains) {
							var domainGuid = domains[0].metadata.guid;
							fulfill({
								url: targetRequest.Url + '/v2/routes',
								headers: {
									'Authorization': cloudAccessToken
								},
								qs: {
									'inline-relations-depth': '1',
									'q': util.encodeURIComponent('host:' + host + ';domain_guid' + domainGuid)
								}
							});
						});
				}
				var routesUrl = orgs.getSpace(targetRequest.SpaceId).entity.routes_url;
				fulfill({
					url: targetRequest.Url + routesUrl,
					headers: {
						'Authorization': cloudAccessToken
					},
					qs: {
						'inline-relations-depth': '1'
					}
				});
			})
			.then(function(getRouteHeader) {
				return new Promise(function(fulfill) {
					request(getRouteHeader, function(error, response, body) {
						fulfill(target.parsebody(body));
					});
				});
			}).then(function(result) {
				var routesResources = result.resources;
				for (var k = 0; k < routesResources.length; k++) {
					if (!orphaned || routesResources.entity.apps.length === 0) {
						var appArray = [];
						var apps = routesResources[k].entity.apps;
						for (var j = 0; j < apps.length; j++) {
							appArray.push({
								"Guid": apps[j].metadata.guid,
								"Name": apps[j].entity.name,
								"State": apps[j].entity.state,
								"Type": "App"
							});
						}
						var routeJson = {
							'Apps': appArray,
							'DomainName': routesResources[k].entity.domain.entity.name,
							'Guid': routesResources[k].metadata.guid,
							'Host': routesResources[k].entity.host,
							'Type': 'Route'
						};
						routesArray.push(routeJson);
					}
				}
				return routesArray;
			});
	}

	function putroutes() {

	}
};