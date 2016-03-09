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
/*eslint-env node*/
var auth = require('./lib/middleware/auth'),
	express = require('express'),
	http = require('http'),
	compression = require('compression'),
    path = require('path'),
    socketio = require('socket.io'),
    util = require('util'),
    argslib = require('./lib/args'),
    ttyShell = require('./lib/tty_shell'),
    orion = require('./index.js');

// Get the arguments, the workspace directory, and the password file (if configured), then launch the server
var args = argslib.parseArgs(process.argv);
var port = args.port || args.p || process.env.PORT || 8081;
var configFile = args.config || args.c || path.join(__dirname, 'orion.conf');

argslib.readConfigFile(configFile, function(err, configParams) {
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

	argslib.createDirs([workspaceDir], function() {
		var passwordFile = args.password || args.pwd;
		argslib.readPasswordFile(passwordFile, function(password) {
			var dev = Object.prototype.hasOwnProperty.call(args, 'dev');
			var log = Object.prototype.hasOwnProperty.call(args, 'log');
			if (dev) {
				console.log('Development mode: client code will not be cached.');
			}
			if (passwordFile) {
				console.log(util.format('Using password from file: %s', passwordFile));
			}
			console.log(util.format('Using workspace: %s', workspaceDir));
			console.log(util.format('Listening on port %d...', port));

			var server;
			try {
				// create web server
				var orionMiddleware = orion({
					workspaceDir: workspaceDir,
					configParams: configParams,
					maxAge: (dev ? 0 : undefined),
				});
				
				// add socketIO and app support
				var app = express();
				server = http.createServer(app);
				if (log) {
					app.use(express.logger('tiny'));
				}
				if (password || configParams.pwd) {
					app.use(auth(password || configParams.pwd));
				}
				app.use(compression());
				app.use(orionMiddleware);
				server.listen(port);
				
				var io = socketio.listen(server, { 'log level': 1 });
				ttyShell.install({ io: io, fileRoot: '/file', workspaceDir: workspaceDir });
			} catch (e) {
				console.error(e && e.stack);
			}
			server.on('error', function(err) {
				console.log(err);
			});
		});
	});
});
