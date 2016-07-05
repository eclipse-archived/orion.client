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

module.exports.router = function(options) {

	return express.Router()
	.use(bodyParser.json())
	.get('*', getOrgs);
	
	function getOrgs(req, res){
		var task = new tasks.Task(res,false,false,0,false);
		var resp = {};
		var cloudAccessToken = target.getAccessToken();
		var targetURL = req.query.Target.Url;
		if(cloudAccessToken){
			// if the token exists
			// TODO Need to check if target has Region, need to add region=blabla params as well. 
			var orgsHeader = {
				url: targetURL + '/v2/organizations',
				headers: {'Authorization': cloudAccessToken},
				qs :{'inline-relations-depth':'1'}
			};
			request(orgsHeader, function (error, response, body) {
				
				
			});
		}
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
}