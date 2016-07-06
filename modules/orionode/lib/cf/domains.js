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
var orgs = require('./orgs');
var target = require('./target');
var request = require('request');
var tasks = require('../tasks');

module.exports.router = function(options) {
	
	return express.Router()
	.use(bodyParser.json())
	.get('*', getDomain);
	
	function getDomain(req, res){
		var task = new tasks.Task(res,false,false,0,false);
		var targetRequest = JSON.parse(req.query.Target);
		var defaultDomainMode = req.query.Default; // TODO This seems not place to get the value or Java code wield!
		
		getCFdomains(targetRequest,null,defaultDomainMode)		
		.then(function(domainArray){
			var resp = {};
			if(!domainArray){
				task.done({
					HttpCode: 404,
					Code: 0,
					DetailedMessage: "Domain can not be found",
					JsonData: resp,
					Message: "Domain can not be found",
					Severity: "Error"
				});
			}else{
				resp = {
			      "Domains" : domainArray
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
	}
	
	function getCFdomains(targetRqeust,domainName, defaultDomainMode){
		var cloudAccessToken = target.getAccessToken();
		var domainArray = [];
		return new Promise(function(fulfill) {
			if(defaultDomainMode){
				var privateDomainURL = orgs.getOrg(targetRqeust.Org).entity.private_domains_url;
				var domainHeader = {
					url:  targetRqeust.Url + privateDomainURL,
					headers: {'Authorization': cloudAccessToken}
					// TODO check domain name specified or not.
				};
				request(domainHeader, function (error, response, body) {
					fulfill(JSON.parse(body));
				});
			}else{
				domainHeader = {
					url:  targetRqeust.Url + '/v2/shared_domains',
					headers: {'Authorization': cloudAccessToken},
					qs :{'page':'1','results-per-page':'1'}
					// TODO check domain name specified or not.
				};
				request(domainHeader, function (error, response, body) {
					fulfill(JSON.parse(body));
				});
			}
		}).then(function(result){
			var domainResources = result.resources;
			for(var k = 0; k < domainResources.length; k++){
				var domainJson = {
					'Guid': domainResources[k].metadata.guid,
					'DomainName': domainResources[k].entity.name,
					'Type':	'Domain'
				};
				domainArray.push(domainJson);
			}
			return domainArray;
		})
	}
};