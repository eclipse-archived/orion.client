/*eslint-env node */
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
var express = require('express');

var apps = require('./cf/apps');
var cloud = require('./cf/cloud');
var domains = require('./cf/domains');
var info = require('./cf/info');
var logz = require('./cf/logz');
var manifests = require('./cf/manifests');
var orgs = require('./cf/orgs');
var plans = require('./cf/plans');
var routes = require('./cf/routes');
var services = require('./cf/services');
var spaces = require('./cf/spaces');
var stacks = require('./cf/stacks');
var target = require('./cf/target');

module.exports = CF;
function CF(options) {
	var router = express.Router();
	
	router.use("/apps", apps.router(options));
	router.use("/cloud", cloud.router(options));
	router.use("/domains", domains.router(options));
	router.use("/info", info.router(options));
	router.use("/logz", logz.router(options));
	router.use("/manifests", manifests.router(options));
	router.use("/orgs", orgs.router(options));
	router.use("/plans", plans.router(options));
	router.use("/routes", routes.router(options));
	router.use("/services", services.router(options));
	router.use("/spaces", spaces.router(options));
	router.use("/stacks", stacks.router(options));
	router.use("/target", target.router(options));
	return router;
}