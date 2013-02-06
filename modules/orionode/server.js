/*******************************************************************************
 * Copyright (c) 2012, 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global __dirname console exports process require*/
var path = require('path');
var util = require('util');
var argslib = require('./lib/args');
var startServer = require('./index.js');

// Get the arguments, the workspace directory, and the password file (if configured), then launch the server
var args = argslib.parseArgs(process.argv);
var port = args.port || args.p || 8081;
var workspaceArg = args.workspace || args.w;
var workspaceDir = workspaceArg ? path.resolve(process.cwd(), workspaceArg) : path.join(__dirname, '.workspace');
var config_params = {};
argslib.createDirs([workspaceDir], function(dirs) {
	var passwordFile = args.password || args.pwd;
	argslib.readPasswordFile(passwordFile, function(password) {
		argslib.readConfigFile("./orion.conf", function(configParams) {
			if(configParams){
				config_params = configParams;
			}
			var dev = Object.prototype.hasOwnProperty.call(args, 'dev');
			var log = Object.prototype.hasOwnProperty.call(args, 'log');
			if (dev) {
				console.log('Running in development mode');
			}
			if (passwordFile) {
				console.log(util.format('Using password from file: %s', passwordFile));
			}
			console.log(util.format('Using workspace: %s', workspaceDir));
			console.log(util.format('Listening on port %d...', port));
			startServer({
				port: port,
				workspaceDir: dirs[0],
				passwordFile: passwordFile,
				password: password,
				configParams: config_params,
				dev: dev,
				log: log
			});
		});
	});
});
