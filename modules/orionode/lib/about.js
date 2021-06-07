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

var XHTML_1 = "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Strict//EN\" \"https://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd\">\n<html xmlns=\"https://www.w3.org/1999/xhtml\">\n<head>\n<title>",
	XHTML_2 = "</title>\n <style type = \"text/css\"> td { padding-right : 10px; }</style></head>\n<body>\n",
	XHTML_3 = "</body>\n</html>",
	BUILD_ID = "unknown";
	
class About {
	/**
	 * @description Create a new instance of the class
	 */
	constructor() {
	}
	/**
	 * @description Create an express Router for handling /about
	 * @param {?} options The map of options. Must contain the configParams property
	 * @returns {Router} A new express router for handling /about
	 * @throws {Error} If options.configParams is not defined
	 * @since 17.0
	 */
	createRouter(options) {
		var configParams = options.configParams;
		if (!configParams) {
			throw new Error('options.configParams is required'); 
		}
		return express.Router()
			.use(responseTime({digits: 2, header: "X-About-Response-Time", suffix: true}))
			.get('*', /* @callback */ function (req, res) {
				var about = String(XHTML_1).concat("About").concat(XHTML_2);
				about = about.concat(XHTML_3);
				res.contentType('html');
				return api.writeResponse(200, res, null, about);
			});
	}
}
/**
 * API callback to load the router
 * @param {{?}} options 
 */
module.exports.router = function router(options) {
	return new About().createRouter(options);
};
