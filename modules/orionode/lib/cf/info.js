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

module.exports.router = function(options) {

	module.exports.getInfo = getInfo;

	return express.Router()
	.use(bodyParser.json())
	.get('*', getInfo);

	function getInfo(req, res) {
		var accessToken = target.getAccessToken();
		var infoURL = JSON.parse(req.query.Target).Url + "/v2/info";

		return new Promise(function(fulfill) {
			var infoHeader = {
				url: infoURL,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application.json',
					'Authorization': accessToken
				}
			};

			request(infoHeader, function(error, response, body) {
				if (error) {
					Promise.reject(error);
				}
				else {
					fulfill(JSON.parse(body));
				}
			});
		});
	}
};