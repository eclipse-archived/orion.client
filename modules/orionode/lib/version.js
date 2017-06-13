/*******************************************************************************
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node */
var express = require('express');
var api = require('./api');

module.exports = {};

var BUILD_ID = "unknown";

module.exports.router = function(options) {
	var configParams = options.configParams;
	if (!configParams) { throw new Error('options.configParams is required'); }

	return express.Router()
	.get('*', /* @callback */ function (req, res) {
		var buildID = configParams["orion.buildId"] || BUILD_ID;
		return api.writeResponse(200, res, null, {
			build: buildID
		});
	});
};