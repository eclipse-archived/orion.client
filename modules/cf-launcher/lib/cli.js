/*******************************************************************************
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/
var cfenv = require("cfenv"),
    minimist = require("minimist"),
    startServer = require("./web/app"),
    util = require("./util");

var USAGE = "\n\nUsage: cf-launcher [options] -- COMMAND";

/**
 * @param {String} args Command-line arguments passed to launcher (should not include "node", "cf-launcher.js").
 */
exports.run = function(args) {
	var argv = minimist(args);
	var command = argv._; // args following the "--" if present, otherwise all args, eg. ["node", "userapp.js"]
	var appenv = cfenv.getAppEnv();
	var password = argv.password || process.env.LAUNCHER_PASSWORD || null;
	var urlPrefix = argv.urlprefix || "launcher";

	if (!command.length)
		throw new Error("Missing required argument: COMMAND." + USAGE);
	if (!password && !appenv.isLocal)
		throw new Error("Missing required argument: password. (A password must be provided when running in the cloud.)" + USAGE);

	util.log("Starting cf-launcher...");
	var srv = startServer({
		appCommand: command,
		appName:    appenv.name, // name of the user app
		urlPrefix:  urlPrefix,
		password:   password,
		port:       appenv.port,
		debugPort:  util.port(appenv.port + 1),
		appPort:    util.port(appenv.port + 2),
	});
	srv.once("initialized", function() {
		util.log("Visit %s to start debugging your app.",  appenv.url + "/" + urlPrefix);
	});
};
