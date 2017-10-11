/*******************************************************************************
 * Copyright (c) 2012, 2017 IBM Corporation and others.
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
	log4js = require('log4js'),
	compression = require('compression'),
	path = require('path'),
	util = require('util'),
	argslib = require('./lib/args'),
	api = require('./lib/api');

var logger = log4js.getLogger('server');

// Get the arguments, the workspace directory, and the password file (if configured), then launch the server
var args = argslib.parseArgs(process.argv);

var PORT_LOW = 8082;
var PORT_HIGH = 10082;
var port = args.port || args.p || process.env.PORT || 8081;
var configFile = args.config || args.c || path.join(__dirname, 'orion.conf');

var configParams = argslib.readConfigFileSync(configFile) || {};
var log4jsOptions = configParams["orion.logs.location"] ? {"cwd" : configParams["orion.logs.location"]} : null;

// Patches the fs module to use graceful-fs instead
require('graceful-fs').gracefulify(fs);

function startServer(cb) {
	
	var workspaceArg = args.workspace || args.w;
	var workspaceConfigParam = configParams.workspace;
	var contextPath = configParams["orion.context.path"] || "";
	var listenContextPath = configParams["orion.context.listenPath"] || false;
	var homeDir = os.homedir();
	var workspaceDir;
	if (workspaceArg) {
		// -workspace passed in command line is relative to cwd
		workspaceDir = path.resolve(process.cwd(), workspaceArg);
	} else if (workspaceConfigParam) {
		 // workspace param in orion.conf is relative to the server install dir.
		workspaceDir = path.resolve(__dirname, workspaceConfigParam);
	} else if (configParams.isElectron) {
		workspaceDir =  path.join(homeDir, '.orion', '.workspace');
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
		if (!configParams["orion.cluster"]) {
			// Use this configuration only in none-clustered server.
			log4js.configure(path.join(__dirname, 'config/log4js.json'), log4jsOptions);
		}
		if(configParams.isElectron){
			log4js.loadAppender('file');
			var logPath = path.join(homeDir, '.orion', 'orion.log');
			if(process.platform === 'darwin'){
				logPath = path.join(homeDir, '/Library/Logs/Orion', 'orion.log');
			}else if(process.platform === 'linux'){
				logPath = path.join(homeDir, '/.config', 'orion.log');
			}else if(process.platform === 'win32'){
				logPath = path.join(homeDir, '\AppData\Roaming\Orion', 'orion.log');
			}
			log4js.addAppender(log4js.appenders.file(logPath, null, 5000000));
		}
		if (dev) {
			process.env.OrionDevMode = true;
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
				app.use(listenContextPath ? contextPath : "/", auth(password || configParams.pwd));
			}
			server = require('http-shutdown')(server);
			app.use(compression());
			var orion = require('./index.js')({
				workspaceDir: workspaceDir,
				configParams: configParams,
				maxAge: dev ? 0 : undefined,
				server: server
			});
			app.use(listenContextPath ? contextPath : "/", function(req, res, next){
				req.contextPath = contextPath;
				next();
			}, orion);
			
			if(configParams["orion.proxy.port"] && listenContextPath){
				var httpProxy;
				try {
					httpProxy = require('http-proxy');
					var proxy = httpProxy.createProxyServer({});
					app.use('/', function(req, res, next) {
						proxy.web(req, res, { target: 'http://127.0.0.1:' + configParams["orion.proxy.port"], changeOrigin: true }, function(ex) { next(); } );
					});
				} catch (e) {
					logger.info("WARNING: http-proxy is not installed. Some features will be unavailable. Reason: " + e.message);
				}
			}

			//error handling
			app.use(function(err, req, res, next) { // 'next' has to be here, so that this callback works as a final error handler instead of a normal middleware
				logger.error(req.originalUrl, err);
				if (res.finished) {
					return;
				}
				if (err) {
					res.status(err.status || 500);
				} else {
					res.status(404);
				}
	
				// respond with json
				if (req.accepts('json')) {
					api.writeResponse(null, res, null, { error: err ? err.message : 'Not found' });
					return;
				}
				
				// default to plain-text. send()
				api.writeResponse(null, res, {"Content-Type":'text/plain'}, err ? err.message : 'Not found');
			});

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
					log4js.shutdown(function(){
						process.exit();
					});
				});
				setTimeout(function() {
					api.getOrionEE().emit("close-server");
					logger.error("Could not close connections in time, forcefully shutting down");
					log4js.shutdown(function(){
						process.exit();
					});
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

function start(electron) {
	if (electron) {
		require("./electron").start(startServer, configParams);
	} else {
		startServer();
	}
}

if (configParams["orion.cluster"]) {
	var cluster = require('cluster');
	if (cluster.isMaster) {		
		log4js.configure(path.join(__dirname, 'config/clustered-log4js.json'), log4jsOptions);
		var numCPUs = typeof configParams["orion.cluster"] === "boolean" ? os.cpus().length : configParams["orion.cluster"] >> 0;
		for (var i = 0; i < numCPUs; i++) {
			cluster.fork();
		}
		cluster.on('exit', /** @callback */ function(worker, code, signal) {
			logger.info("Worker " + worker.process.pid + " exited");
		});
		logger.info("Master " + process.pid + " started");
	} else {
		log4js.configure({appenders: [{type: "clustered"}]});
		logger.info("Worker " + process.pid + " started");
		start(false); //TODO electron with cluster?
	}
} else {
	start(process.versions.electron);
}
