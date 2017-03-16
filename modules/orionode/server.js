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
	orion = require('./index.js');
	debugServer = require('../orionode.debug.server');

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
		if (dev) {
			console.log('Development mode: client code will not be cached.');
		}
		if (passwordFile) {
			console.log(util.format('Using password from file: %s', passwordFile));
		}
		console.log(util.format('Using workspace: %s', workspaceDir));
		
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
			app.use(listenContextPath ? contextPath : "/", function(req,res,next){ req.contextPath = contextPath; next();},orion({
				workspaceDir: workspaceDir,
				configParams: configParams,
				maxAge: dev ? 0 : undefined,
			}));
			var io = socketio.listen(server, { 'log level': 1, path: (listenContextPath ? contextPath : '' ) + '/socket.io' });
			ttyShell.install({ io: io, app: app, fileRoot: contextPath + '/file', workspaceDir: workspaceDir });
			debugServer.install({ io: io, app: app, fileRoot: contextPath + '/file', workspaceDir: workspaceDir, listenPath: (listenContextPath ? contextPath : '') });

			//error handling
			app.use(function(req, res){
				res.status(404);

				// respond with html page
				//if (req.accepts('html')) {
				//	res.render('404', { url: req.url });
				//	return;
				//}

				// respond with json
				if (req.accepts('json')) {
					res.send({ error: 'Not found' });
					return;
				}

				// default to plain-text. send()
				res.type('txt').send('Not found');
			});

			server.on('listening', function() {
				configParams.port = port;
				console.log(util.format('Listening on port %d...', port));
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
		} catch (e) {
			console.error(e && e.stack);
		}
	});
}

if (process.versions.electron) {
	require("./electron").start(startServer, configParams);
} else {
	startServer();
}
