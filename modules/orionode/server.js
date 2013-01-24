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
var statik = connect['static'];
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
var ORION_CLIENT = path.normalize(path.join(__dirname, '../../'));

function handleError(err) {
	throw err;
}

function noop(req, res, next) { next(); }

function auth(options) {
	var pwd = options.password ? options.password : options.configParams.pwd;
	if (typeof pwd === 'string' && pwd.length > 0) {
		return connect.basicAuth(function(user, password) {
			return password === pwd;
		});
	}
	return noop;
}

function logger(options) {
	return options.log ? connect.logger('tiny') : noop;
}

function startServer(options) {
	var workspaceDir = options.workspaceDir, configParams = options.configParams;
	try {
		var appContext = new AppContext({fileRoot: '/file', workspaceDir: workspaceDir, configParams: configParams});

		// HTTP server
		var app = connect()
			.use(logger(options))
			.use(connect.urlencoded())
			.use(auth(options))
			.use(connect.compress())
			// static code
			.use(orionNodeStatic(path.normalize(path.join(LIBS, 'orionode.client/')), {
				socketIORoot: path.resolve(NODE_MODULES, 'socket.io-client/')
			}))
			.use(orionStatic({
				orionClientRoot: ORION_CLIENT,
				dev: options.dev
			}))
			// API handlers
			.use(orionFile({
				root: '/file',
				workspaceDir: workspaceDir
			}))
			.use(orionWorkspace({
				root: '/workspace',
				fileRoot: '/file',
				workspaceDir: workspaceDir
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
var config_params = {};
argslib.createDirs([workspaceDir], function(dirs) {
	var passwordFile = args.password || args.pwd;
	argslib.readPasswordFile(passwordFile, function(password) {
		argslib.readConfigFile("./orion.conf", function(configParams) {
			if(configParams){
				config_params = configParams;
			}
			startServer({
				port: port,
				workspaceDir: dirs[0],
				passwordFile: passwordFile,
				password: password,
				configParams: config_params,
				dev: args.hasOwnProperty('dev'),
				log: args.hasOwnProperty('log')
			});
		});
	});
});
