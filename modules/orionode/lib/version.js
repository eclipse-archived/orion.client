/*******************************************************************************
 * Copyright (c) 2016, 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node */
var express = require('express'),
	api = require('./api'),
	responseTime = require('response-time'),
	pjson = require('../package.json');

module.exports = {};

var BUILD_ID = "unknown";

module.exports.router = function(options) {
	var configParams = options.configParams;
	if (!configParams) { throw new Error('options.configParams is required'); }

	return express.Router()
		.use(responseTime({digits: 2, header: "X-Version-Response-Time", suffix: true}))
		.get('*', /* @callback */ function (req, res) {
			var buildID = configParams["orion.buildId"] || BUILD_ID;
			if(buildID === "unknown" && pjson && typeof pjson.version === 'string') {
				//for the NPM case we want to return the version published to NPM (from the package.json)
				buildID = pjson.version;
			}
			return api.writeResponse(200, res, null, {
				build: buildID
			});
		});
};