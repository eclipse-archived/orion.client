/*******************************************************************************
 * Copyright (c) 2012, 2017 IBM Corporation and others.
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
	responseTime = require('response-time');

module.exports = {};

module.exports.router = function(options) {
	var configParams = options.configParams;
	if (!configParams) { throw new Error('options.configParams is required'); }

	return express.Router()
		.use(responseTime({digits: 2, header: "X-Metrics-Response-Time", suffix: true}))
		.get('*', /* @callback */ function (req, res) {
			res.setHeader("Cache-Control", "public, max-age=86400, must-revalidate"); 
			return res.status(200).json({
				tid: options.configParams["orion.metrics.google.tid"],
				siteSpeedSampleRate: Math.min(100, Math.max(0, Number(options.configParams["orion.metrics.google.tid"]))) || undefined
			});
		});
};