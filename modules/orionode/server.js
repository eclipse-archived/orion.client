/*******************************************************************************
 * Copyright (c) 2012, 2013, 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node, express, compression*/
var auth = require('./lib/middleware/auth'),
	express = require('express'),
	http = require('http'),
	https = require('https'),
	fs = require('fs'),
	os = require('os'),
	compression = require('compression'),
	path = require('path'),
	socketio = require('socket.io'),
	util = require('util'),
	argslib = require('./lib/args'),
	ttyShell = require('./lib/tty_shell'),
	api = require('./lib/api');

// Get the arguments, the workspace directory, and the password file (if configured), then launch the server
var args = argslib.parseArgs(process.argv);

var PORT_LOW = 8082;
var PORT_HIGH = 10082;
var port = args.port || args.p || process.env.PORT || 8081;
var configFile = args.config || args.c || path.join(__dirname, 'orion.conf');

var configParams = argslib.readConfigFileSync(configFile) || {};

function startServer(cb) {
	
	var workspaceArg = args.workspace || args.w;
	var workspaceConfigParam = configParams.workspace;
	var contextPath = configParams["orion.context.path"] || "";
	var listenContextPath = configParams["orion.context.listenPath"] || false;
	var workspaceDir;
	if (workspaceArg) {
		// -workspace passed in command line is relative to cwd
		workspaceDir = path.resolve(process.cwd(), workspaceArg);
	} else if (workspaceConfigParam) {
		 // workspace param in orion.conf is relative to the server install dir.
		workspaceDir = path.resolve(__dirname, workspaceConfigParam);
	} else if (configParams.isElectron) {
		workspaceDir =  path.join(os.homedir(), '.orion', '.workspace');
	} else {
		workspaceDir = path.join(__dirname, '.workspace');
	}
	configParams.workspace = workspaceDir;
	argslib.createDirs([workspaceDir], function() {
		var passwordFile = args.password || args.pwd;
		var password = argslib.readPasswordFile(passwordFile);
		var dev = Object.prototype.hasOwnProperty.call(args, 'dev');
		var log = Object.prototype.hasOwnProperty.call(args, 'log');
		// init logging
		var log4js = require('log4js');
		log4js.configure(path.join(__dirname, 'config/log4js.json'));
		var logger = log4js.getLogger('server');
		if (dev) {
			logger.info('Development mode: client code will not be cached.');
		}
		if (passwordFile) {
			logger.info(util.format('Using password from file: %s', passwordFile));
		}
		logger.info(util.format('Using workspace: %s', workspaceDir));
		
		var server;
		try {
			// create web server
			var app = express();
			if (configParams["orion.https.key"] && configParams["orion.https.cert"]) {
				server = https.createServer({
					key: fs.readFileSync(configParams["orion.https.key"]),
					cert: fs.readFileSync(configParams["orion.https.cert"])
				}, app);
			} else {
				server = http.createServer(app);
			}

			// Configure middleware
			if (log) {
				app.use(express.logger('tiny'));
			}
			if (password || configParams.pwd) {
				app.use(auth(password || configParams.pwd));
			}
			
			app.use(compression());
			var orion = require('./index.js')({
				workspaceDir: workspaceDir,
				configParams: configParams,
				maxAge: dev ? 0 : undefined,
			});
			app.use(listenContextPath ? contextPath : "/", function(req, res, next){
				req.contextPath = contextPath;
				next();
			}, orion);
			
			server = require('http-shutdown')(server);
			var io = socketio.listen(server, { 'log level': 1, path: (listenContextPath ? contextPath : '' ) + '/socket.io' });
			ttyShell.install({ io: io, app: orion, fileRoot: contextPath + '/file', workspaceDir: workspaceDir });

			server.on('listening', function() {
				configParams.port = port;
				logger.info(util.format('Listening on port %d...', port));
				if (cb) {
					cb();
				}
			});
			server.on('error', function(err) {
				if (err.code === "EADDRINUSE") {
					port = Math.floor(Math.random() * (PORT_HIGH - PORT_LOW) + PORT_LOW);
					server.listen(port);
				}
			});
			server.listen(port);
			
			// this function is called when you want the server to die gracefully
			// i.e. wait for existing connections
			var gracefulShutdown = function() {
				logger.info("Received kill signal, shutting down gracefully.");
				api.getOrionEE().emit("close-socket");
				server.shutdown(function() {
					api.getOrionEE().emit("close-server");// Disconnect Mongoose // Close Search Workers
					logger.info("Closed out remaining connections.");
					process.exit();
				});
				setTimeout(function() {
					api.getOrionEE().emit("close-server");
					logger.error("Could not close connections in time, forcefully shutting down");
					process.exit();
				}, configParams["shutdown.timeout"]);
			};
			// listen for TERM signal .e.g. kill 
			process.on('SIGTERM', gracefulShutdown);
			var stdin = process.openStdin();
			stdin.addListener("data", function(d) {
				if(d.toString().trim() === "shutdown"){
					gracefulShutdown();
				}
			});
		} catch (e) {
			logger.error(e && e.stack);
		}
	});
}

if (process.versions.electron) {
	require("./electron").start(startServer, configParams);
} else {
	startServer();
}