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
/*jslint node:true*/
var connect = require('connect'),
    path = require('path'),
    socketio = require('socket.io'),
    util = require('util'),
    appSocket = require('./lib/node_app_socket'),
    argslib = require('./lib/args'),
    orion = require('./index.js');

function noop(req, res, next) { next(); }

function auth(pwd) {
	if (typeof pwd === 'string' && pwd.length > 0) {
		return connect.basicAuth(function(user, password) {
			return password === pwd;
		});
	}
	return noop;
}

// Get the arguments, the workspace directory, and the password file (if configured), then launch the server
var args = argslib.parseArgs(process.argv);
var port = args.port || args.p || 8081;

argslib.readConfigFile(path.join(__dirname, 'orion.conf'), function(configParams) {
	configParams = configParams || {};

	var workspaceArg = args.workspace || args.w;
	var workspaceConfigParam = configParams.workspace;
	var workspaceDir;
	if (workspaceArg) {
		// -workspace passed in command line is relative to cwd
		workspaceDir = path.resolve(process.cwd(), workspaceArg);
	} else if (workspaceConfigParam) {
		 // workspace param in orion.conf is relative to the server install dir.
		workspaceDir = path.resolve(__dirname, workspaceConfigParam);
	} else {
		workspaceDir = path.join(__dirname, '.workspace');
	}

	argslib.createDirs([workspaceDir], function(dirs) {
		var passwordFile = args.password || args.pwd;
		argslib.readPasswordFile(passwordFile, function(password) {
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

			// create web server
			var orionMiddleware = orion({
				workspaceDir: dirs[0],
				configParams: configParams,
				dev: dev,
				log: log
			}), appContext = orionMiddleware.appContext;
			var server = connect()
				.use(log ? connect.logger('tiny') : noop)
				.use(auth(password || configParams.pwd))
				.use(connect.compress())
				.use(orionMiddleware)
				.listen(port);

			// add socketIO and app support
			var io = socketio.listen(server, { 'log level': 1 });
			appSocket.install({ io: io, appContext: appContext });
			server.on('error', function(err) {
				console.log(err);
			});
		});
	});
});
