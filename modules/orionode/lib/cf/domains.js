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
var target = require('./target');
var request = require('request');
var tasks = require('../tasks');
var util = require('../git/util');

module.exports.router = function() {

	module.exports.getCFdomains = getCFdomains;

	return express.Router()
		.use(bodyParser.json())
		.get('*', getDomain);

function getDomain(req, res) {
	var task = new tasks.Task(res, false, false, 0, false);
	var targetRequest = JSON.parse(req.query.Target);
	var defaultDomainMode = req.query.Default;
	var domainName = req.query.Name;
	target.computeTarget(req.user.username, targetRequest, task)
	 .then(function(appTarget){
	 	return getCFdomains(appTarget, req.user.username, targetRequest.Url, targetRequest.Org, domainName, defaultDomainMode)
		.then(function(domainArray) {
			var resp = {};
			if (!domainArray) {
				task.done({
					HttpCode: 404,
					Code: 0,
					DetailedMessage: "Domain can not be found",
					JsonData: resp,
					Message: "Domain can not be found",
					Severity: "Error"
				});
			} else {
				resp = {
					"Domains": domainArray
				};
				task.done({
					HttpCode: 200,
					Code: 0,
					DetailedMessage: "Ok",
					JsonData: resp,
					Message: "Ok",
					Severity: "Ok"
				});
			}
		});
	 });
}

// This method can not accept req, because the req something has a body instead of a query.
function getCFdomains(appTarget, UserId, targetUrl, orgName, domainName, defaultDomainMode) {
	var domainArray = [];
	var waitFor;
	if (!defaultDomainMode){
		waitFor = target.cfRequest('GET', UserId, null, targetUrl + appTarget.Org.entity.private_domains_url, 
				domainName ? {'q': "name:" + util.encodeURIComponent(domainName)}: null);
	}else{
		waitFor = Promise.resolve();
	}
	return waitFor
	.then(function(result) {
		return new Promise(function(fulfill) {
			if (defaultDomainMode || !domainName || result.total_results < 1) {
				var qs = domainName ? {
					'q': "name:" + util.encodeURIComponent(domainName)
				} : {
					'page': '1',
					'results-per-page': '1'
				};
				return target.cfRequest('GET', UserId, null, targetUrl + '/v2/shared_domains', qs)
				.then(function(result){
					fulfill(result);
				});
			}
			fulfill(result);
		});
	}).then(function(result) {
		var domainResources = result.resources;
		for (var k = 0; k < domainResources.length; k++) {
			var domainJson = {
				'Guid': domainResources[k].metadata.guid,
				'DomainName': domainResources[k].entity.name,
				'Type': 'Domain'
			};
			domainArray.push(domainJson);
		}
		return domainArray;
	});
}
};