/*******************************************************************************
 * Copyright (c) 2013, 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node */
var express = require('express'),
	bodyParser = require('body-parser'),
	expressSession = require('express-session'),
	passport = require('passport'),
	path = require('path'),
	fs = require('fs'),
	api = require('./lib/api'),
	checkRights = require('./lib/accessRights').checkRights,
	socketio = require('socket.io'),
	ttyShell = require('./lib/tty_shell'),
	responseTime = require('response-time');

var LIBS = path.normalize(path.join(__dirname, 'lib/')),
	MINIFIED_ORION_CLIENT = path.normalize(path.join(__dirname, "lib/orion.client")),
	ORION_CLIENT = path.normalize(path.join(__dirname, '../../'));
	
var _24_HOURS = "public, max-age=86400, must-revalidate",
	_12_HOURS = "max-age=43200, must-revalidate",
	_15_MINUTE = "max-age=900, must-revalidate",
	_NO_CACHE = "max-age=0, no-cache, no-store",
	EXT_CACHE_MAPPING = {
		// 24 Hours:
		".gif": _24_HOURS, 
		".jpg": _24_HOURS,
		".png": _24_HOURS, 
		".bmp": _24_HOURS, 
		".tif": _24_HOURS,
		".ico": _24_HOURS,
		
		// 12 Hours:
		".js": _12_HOURS, 
		".css": _12_HOURS,
		
		// 15 Minutes:
		".json": _15_MINUTE, 
		".pref": _15_MINUTE, 
		".woff": _15_MINUTE,
		".ttf": _15_MINUTE,
		
		// No Cache:
		".html": _NO_CACHE, 
	};

function startServer(options) {
	options = options || {};
	options.configParams = options.configParams || require("nconf");
	if(options.configParams.get("additional.modules.path")){
		var addModulePath = require('app-module-path');
		options.configParams.get("additional.modules.path").split(",").forEach(function(modulePath){
			addModulePath.addPath(path.join(__dirname, modulePath));
		});
	}
	
	options.maxAge = typeof options.maxAge === "number" ? options.maxAge : undefined;
	var contextPath = options.configParams.get("orion.context.path") || "";
	var listenContextPath = options.configParams.get("orion.context.listenPath") || false;
	if (typeof options.workspaceDir !== "string") {
		throw new Error("workspaceDir is required");
	}
	
	var app = express();

	options.app = app;
	
	app.use(bodyParser.json({limit:"10mb"}));
	app.use(bodyParser.urlencoded({ extended: false, limit:"10mb" }));
	app.use(responseTime({digits: 2, header: "X-Total-Response-Time", suffix: true}));
	
	Object.assign(options, {
		sharedWorkspaceFileRoot: contextPath + '/sharedWorkspace/tree/file',
		taskRoot: contextPath + '/task',
		workspaceRoot: contextPath + '/workspace',
		fileRoot: contextPath + '/file',
		gitRoot: contextPath + '/gitapi'
	});
	
	function checkAuthenticated(req, res, next) {
		if (!req.user) {
			api.writeError(401, res, "Not authenticated");
		} else {
			req.user.workspaceDir = options.workspaceDir + (req.user.workspace ? "/" + req.user.workspace : "");
			req.user.checkRights = checkRights;
			next();
		}
	}
	
	function checkAccessRights(req, res, next) {
		var uri = (typeof req.contextPath === "string" && req.baseUrl.substring(req.contextPath.length)) || req.baseUrl;
		req.user.checkRights(req.user.username, uri, req, res, next);
	}
	
	var additionalEndpoints = options.configParams.get("additional.endpoint") ? require(options.configParams.get("additional.endpoint")) : [];
	function loadEndpoints(authenticated) {
		additionalEndpoints.forEach(function(additionalEndpoint) {
			if (authenticated !== Boolean(additionalEndpoint.authenticated)) return;
			if (additionalEndpoint.endpoint){
				additionalEndpoint.authenticated ? 
					app.use(additionalEndpoint.endpoint, options.authenticate, checkAuthenticated, require(additionalEndpoint.module).router(options))	 : 
					app.use(additionalEndpoint.endpoint, require(additionalEndpoint.module).router(options));
			} else {
				var extraModule = require(additionalEndpoint.module);
				var middleware = extraModule.router ? extraModule.router(options) : extraModule(options);
				if (middleware)	app.use(middleware); // use this module as a middleware 
			}
		});
	}

	// Configure metastore
	var metastoreFactory;
	if (!options.configParams.get("orion.single.user") && options.configParams.get("orion.metastore.useMongo") !== false) {
		metastoreFactory = require('./lib/metastore/mongodb/store');
	} else {
		metastoreFactory = require('./lib/metastore/fs/store');
	}
	options.metastore = app.locals.metastore = metastoreFactory(options);
	app.locals.metastore.setup(options);
	options.authenticate = [
		expressSession({
			resave: false,
			saveUninitialized: false,
			secret: 'keyboard cat',
			store: options.sessionStore // TODO by default MemoryStore is not designed for a production environment, as it will leak memory, and will not scale past a single process.
		}),
		passport.initialize(),
		passport.session()
	].concat(options.authenticate || []);
	
	loadEndpoints(false);
	let CloudFoundry = require('./lib/cf').CloudFoundry;
	app.use('/metrics', require('./lib/metrics').router(options));
	app.use('/version', require('./lib/version').router(options));
	let About = require('./lib/about').About;
	app.use('/about', new About().createRouter(options));
	loadEndpoints(true);
	app.use(require('./lib/user').router(options));
	app.use('/site', options.authenticate, checkAuthenticated, checkAccessRights, require('./lib/sites')(options));
	app.use('/task', options.authenticate, checkAuthenticated, require('./lib/tasks').router(options));
	app.use('/filesearch', options.authenticate, checkAuthenticated, require('./lib/search')(options));
	app.use('/file*', options.authenticate, checkAuthenticated, checkAccessRights, require('./lib/file')(options));
	app.use('/workspace*', options.authenticate, checkAuthenticated, checkAccessRights, require('./lib/workspace')(options));
	app.use('/gitapi', options.authenticate, checkAuthenticated, require('./lib/git')(options));
	app.use('/cfapi', options.authenticate, checkAuthenticated, new CloudFoundry().createRouter(options));
	app.use('/prefs', options.authenticate, checkAuthenticated, require('./lib/prefs').router(options));
	app.use('/xfer', options.authenticate, checkAuthenticated, require('./lib/xfer').router(options));
	if (options.configParams.get("isElectron")) {
		app.use('/update', options.authenticate, checkAuthenticated, require('./lib/update').router(options));
	}
	if(options.configParams.get("orion.collab.enabled")) {
		app.use('/sharedWorkspace', options.authenticate, checkAuthenticated, require('./lib/sharedWorkspace').router(options));
	}
	
	var io = socketio.listen(options.server, { 'log level': 1, path: (listenContextPath ? contextPath : '' ) + '/socket.io' });
	ttyShell.install(options, io);
	if (options.configParams.get("orion.debug.enabled")) {
		var debugServer = require(options.configParams.get("debug.server.module"));
		debugServer.install(options, io);
	}
	
	// Static files
	app.use('/xterm', express.static(path.join(__dirname, 'node_modules', 'xterm', 'dist')));
	
	var staticCacheOption;
	if(typeof options.maxAge !== "undefined" ) {
		// It's dev time
		staticCacheOption = {
			maxAge: options.maxAge
		};
	} else {
		staticCacheOption = {
			/**
			 * @callback
			 */
			setHeaders: function(res, urlPath, stat){
				var ext = path.extname(urlPath);
				if(path.basename(path.dirname(urlPath)) === "requirejs"){
					res.setHeader("Cache-Control",_24_HOURS);
				}else if(EXT_CACHE_MAPPING[ext]){
					res.setHeader("Cache-Control", EXT_CACHE_MAPPING[ext] );
				}else{
					res.setHeader("Cache-Control", _24_HOURS);
				}
			}
		};
	}
	if (fs.existsSync(MINIFIED_ORION_CLIENT)) {
		app.use(express.static(MINIFIED_ORION_CLIENT, Object.assign({dotfiles: 'allow'}, staticCacheOption)));
	} else {
		var prependStaticAssets = (options.configParams.get("prepend.static.assets") || "").split(",");
		var appendStaticAssets = (options.configParams.get("append.static.assets") || "").split(",");
		var orionode_static = path.normalize(path.join(LIBS, 'orionode.client/'));
		if(options.configParams.get("orion.collab.enabled")) {
			appendStaticAssets.push('./bundles/org.eclipse.orion.client.collab/web');
		}
		app.use(require('./lib/orion_static')(Object.assign({orionClientRoot: ORION_CLIENT, orionode_static: orionode_static, prependStaticAssets: prependStaticAssets, appendStaticAssets: appendStaticAssets}, staticCacheOption)));
	}
	return app;
}

module.exports = startServer;