/*******************************************************************************
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global __dirname console process require*/
var connect = require('connect');
var mime = connect.mime;
var http = require('http');
var socketio = require('socket.io');
var path = require('path');
var url = require('url');
var util = require('util');
var AppContext = require('./lib/node_apps').AppContext;
var appSocket = require('./lib/node_app_socket');
var argslib = require('./lib/args');
var orionFile = require('./lib/file');
var orionNode = require('./lib/node');
var orionWorkspace = require('./lib/workspace');
var orionNodeStatic = require('./lib/orionode_static');
var orionStatic = require('./lib/orion_static');

var LIBS = path.normalize(path.join(__dirname, 'lib/'));
var NODE_MODULES = path.normalize(path.join(__dirname, 'node_modules/'));

// vroom vroom
http.globalAgent.maxSockets = 25;

mime.define({
	'application/json': ['pref', 'json']
});

function handleError(err) {
	throw err;
}

function noop(req, res, next) { next(); }

function auth(options) {
	if (typeof options.password === 'string') {
		return connect.basicAuth(function(user, pwd) {
			return pwd === options.password;
		});
	}
	return noop;
}

function logger(options) {
	return options.log ? connect.logger('tiny') : noop;
}

function startServer(options) {
	var workspaceDir = options.workspaceDir, tempDir = options.tempDir;
	try {
		var appContext = new AppContext({fileRoot: '/file', workspaceDir: workspaceDir});

		// HTTP server
		var app = connect()
			.use(logger(options))
			.use(connect.urlencoded())
			.use(auth(options))
			.use(connect.json())
			.use(connect.compress())
			// static code
			.use(orionNodeStatic(path.normalize(path.join(LIBS, 'orionode.client/')), {
				socketIORoot: path.resolve(NODE_MODULES, 'socket.io-client/')
			}))
			.use(orionStatic(path.normalize(path.join(LIBS, 'orion.client/')), {
				dojoRoot: path.resolve(LIBS, 'dojo/'),
				dev: options.dev
			}))
			// API handlers
			.use(orionFile({
				root: '/file',
				workspaceDir: workspaceDir,
				tempDir: tempDir
			}))
			.use(orionWorkspace({
				root: '/workspace',
				fileRoot: '/file',
				workspaceDir: workspaceDir,
				tempDir: tempDir
			}))
			.use(orionNode({
				appContext: appContext,
				root: '/node'
			}))
			.listen(options.port);
		// Socket server
		var io = socketio.listen(app, { 'log level': 2 });
		appSocket.install({io: io, appContext: appContext});

		if (options.dev) {
			console.log('Running in development mode');
		}
		if (options.passwordFile) {
			console.log(util.format('Using password from file: %s', options.passwordFile));
		}
		console.log(util.format('Using workspace: %s', workspaceDir));
		console.log(util.format('Listening on port %d...', options.port));
		app.on('error', handleError);
	} catch (e) {
		handleError(e);
	}
}

// Get the arguments, the workspace directory, and the password file (if configured), then launch the server
var args = argslib.parseArgs(process.argv);
var port = args.port || args.p || 8081;
var workspaceArg = args.workspace || args.w;
var workspaceDir = workspaceArg ? path.resolve(process.cwd(), workspaceArg) : path.join(__dirname, '.workspace');
var tempDir = path.join(workspaceDir, '.temp');
argslib.createDirs([workspaceDir, tempDir], function(dirs, tempDir) {
	var passwordFile = args.password || args.pwd;
	argslib.readPasswordFile(passwordFile, function(password) {
		startServer({
			port: port,
			workspaceDir: dirs[0],
			tempDir: dirs[1],
			passwordFile: passwordFile,
			password: password,
			dev: args.hasOwnProperty('dev'),
			log: args.hasOwnProperty('log')
		});
	});
});