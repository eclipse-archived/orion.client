/*******************************************************************************
 * Copyright (c) 2013, 2018 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/
let express = require('express'),
	bodyParser = require('body-parser'),
	expressSession = require('express-session'),
	passport = require('passport'),
	path = require('path'),
	fs = require('fs'),
	api = require('./lib/api'),
	checkRights = require('./lib/accessRights').checkRights,
	socketio = require('socket.io'),
	ttyShell = require('./lib/tty_shell'),
	responseTime = require('response-time'),
	log4js = require('log4js'),
	//lsregistry = require("./lib/lsRegistry"),
	addModulePath = require('app-module-path');

const LIBS = path.normalize(path.join(__dirname, 'lib/'));
const MINIFIED_ORION_CLIENT = path.normalize(path.join(__dirname, "lib/orion.client"));
const ORION_CLIENT = path.normalize(path.join(__dirname, '../../'));

const _24_HOURS = "public, max-age=86400, must-revalidate";
const _12_HOURS = "max-age=43200, must-revalidate";
const _15_MINUTE = "max-age=900, must-revalidate";
const _NO_CACHE = "max-age=0, no-cache, no-store";
const EXT_CACHE_MAPPING = {
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

let workspaceDir = "";
const logger = log4js.getLogger('index');

/**
 * Check if the request is authenticated
 * @param {XmlHttpRequest} req The original request
 * @param {XmlHttpResponse} res The orginal response
 * @param {fn} next The function to advance the Express queue
 */
function checkAuthenticated(req, res, next) {
	if (!req.user) {
		api.writeError(401, res, "Not authenticated");
	} else {
		req.user.workspaceDir = workspaceDir + (req.user.workspace ? "/" + req.user.workspace : "");
		req.user.checkRights = checkRights;
		next();
	}
}

/**
 * Check the access rights of the request against the requested resource
 * @param {XmlHttpRequest} req The original request
 * @param {XmlHttpResponse} res The orginal response
 * @param {fn} next The function to advance the Express queue
 */
function checkAccessRights(req, res, next) {
	const uri = (typeof req.contextPath === "string" && req.baseUrl.substring(req.contextPath.length)) || req.baseUrl;
	req.user.checkRights(req.user.username, uri, req, res, next);
}

/**
 * Tries to load the router from an endpoint
 * @param {{?}} endpoint The metadata for the endpoint to load
 * @param {{?}[]} args The arguments to pass to the express app use call
 * @param {{?}} options The map of options from the server load
 */
function tryLoadRouter(endpoint, args, options) {
	const conditional = endpoint.hasOwnProperty("ifProp");
	if (conditional && options.configParams.get(endpoint.ifProp) || !conditional) {
		try {
			const mod = require(endpoint.module);
			let fn = null;
			if (typeof mod.router === 'function') {
				fn = mod.router;
			} else if(typeof mod === 'function') {
				fn = mod;
			} else {
				logger.log("Endpoint did not provide the API 'router' function: " + JSON.stringify(endpoint, null, '\t'));
				return;
			}
			if(fn) {
				const router = fn(options);
				if (!router) {
					return; //endpoint does not want to take part in routing, quit
				}
				args.push(router);
				options.app.use.apply(options.app, args);
			}
			
		} catch (err) {
			logger.log("Failed to load module: " + err.message);
		}
	}
}

/**
 * Function that loads endpoints from the configuration file
 * @param {{?}[]} endpoints The array of endpoints
 * @param {{?}} options The map of options
 * @param {bool} auth If we should be loading endpoints that require authentication
 */
function loadEndpoints(endpoints, options, auth) {
	if (Array.isArray(endpoints)) {
		endpoints.forEach(function(endpoint) {
			if (auth !== Boolean(endpoint.authenticated)) {
				//after endpoints refactored, remove this check
				return;
			}
			const args = [];
			if (typeof endpoint.endpoint === 'string') {
				args.push(endpoint.endpoint);
			}
			if (endpoint.authenticated) {
				args.push(options.authenticate);
				args.push(checkAuthenticated);
			}
			if (endpoint.checkAccess) {
				args.push(checkAccessRights);
			}
			tryLoadRouter(endpoint, args, options);
		});
	}
}

/**
 * Load any language servers mapped to the server config
 * @param {{?}[]} servers The array of language server metadata
 * @param {socketio} io The backing socket.IO library
 * @param {{?}} options The map of server configuration options
 * @since 18.0
 */
function loadLanguageServers(servers, io, options) {
	if (Array.isArray(servers) && options.configParams.get('orion.single.user')) {
		const rootPath = path.join(__dirname, "language_servers");
		if (!fs.existsSync(rootPath)) {
			logger.log("'language_servers' folder does not exist. Stopped loading language servers.");
			return;
		}
		addModulePath.addPath(rootPath);
		servers.forEach(function(ls) {
			if (typeof ls.dirName !== "string") {
				logger.log("Language server metadata is missing 'dirName' property: " + JSON.stringify(ls, null, '\t'));
				return;
			}
			const lsPath = path.join(rootPath, ls.dirName);
			if (!fs.existsSync(lsPath)) {
				logger.log("Language server folder does not exist: " + lsPath);
				return;
			}
			addModulePath.addPath(lsPath);
			try {
				const server = require(lsPath);
				if (server && typeof server.createServer === 'function') {
					// lsregistry.installServer(server.createServer(), { 
					// 		io: io, 
					// 		workspaceDir: workspaceDir,
					// 		IN_PORT: 8123,
					// 		OUT_PORT: 8124
					// 	});
				} else {
					logger.log("Tried to install language server '" + lsPath + "' - but it has no createServer function");
				}
			} catch (err) {
				logger.log("Failed to load language server: " + err);
			}
		});
	}
}

/**
 * Starts the server with the given options
 * @param {{?}} options The map of options to star the server with
 */
module.exports = function startServer(options) {
	options = options || {};
	options.configParams = options.configParams || require("nconf");
	if (options.configParams.get("additional.modules.path")) {
		options.configParams.get("additional.modules.path").split(",").forEach(function(modulePath) {
			addModulePath.addPath(path.join(__dirname, modulePath));
		});
	}
	options.maxAge = typeof options.maxAge === "number" ? options.maxAge : undefined;
	const contextPath = options.configParams.get("orion.context.path") || "",
		listenContextPath = options.configParams.get("orion.context.listenPath") || false;
	if (typeof options.workspaceDir !== "string") {
		throw new Error("workspaceDir is required");
	}
	workspaceDir = options.workspaceDir;
	const app = express();
	options.app = app;
	app.use(bodyParser.json({
		limit: "10mb"
	}));
	app.use(bodyParser.urlencoded({
		extended: false,
		limit: "10mb"
	}));
	app.use(responseTime({
		digits: 2,
		header: "X-Total-Response-Time",
		suffix: true
	}));

	Object.assign(options, {
		sharedWorkspaceFileRoot: contextPath + '/sharedWorkspace/tree/file',
		taskRoot: contextPath + '/task',
		workspaceRoot: contextPath + '/workspace',
		fileRoot: contextPath + '/file',
		gitRoot: contextPath + '/gitapi'
	});

	// Configure metastore
	let metastoreFactory;
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
	const additionalEndpoints = options.configParams.get("additional.endpoint") ? require(options.configParams.get("additional.endpoint")) : [];
	const serverconf = options.configParams.get("orion.server.config") ? require(options.configParams.get("orion.server.config")) : [];
	let endpoints = Array.isArray(additionalEndpoints) ? additionalEndpoints : [];
	if(Array.isArray(serverconf.endpoints)) {
		endpoints = endpoints.concat(serverconf.endpoints);
	}
	loadEndpoints(endpoints, options, false);
	loadEndpoints(endpoints, options, true);
	const io = socketio.listen(options.server, {
		'log level': 1,
		path: (listenContextPath ? contextPath : '') + '/socket.io'
	});
	if (serverconf && Array.isArray(serverconf.languages)) {
		loadLanguageServers(serverconf.languages, io);
	}
	ttyShell.install(options, io);
	if (options.configParams.get("orion.debug.enabled")) {
		const debugServer = require(options.configParams.get("debug.server.module"));
		debugServer.install(options, io);
	}
	// Static files
	app.use('/xterm', express.static(path.join(path.dirname(path.dirname(require.resolve("xterm"))), 'dist')));

	let staticCacheOption;
	if (typeof options.maxAge !== "undefined") {
		// It's dev time
		staticCacheOption = {
			maxAge: options.maxAge
		};
	} else {
		staticCacheOption = {
			/**
			 * @callback
			 */
			setHeaders: function(res, urlPath, stat) {
				const ext = path.extname(urlPath);
				if (path.basename(path.dirname(urlPath)) === "requirejs") {
					res.setHeader("Cache-Control", _24_HOURS);
				} else if (EXT_CACHE_MAPPING[ext]) {
					res.setHeader("Cache-Control", EXT_CACHE_MAPPING[ext]);
				} else {
					res.setHeader("Cache-Control", _24_HOURS);
				}
			}
		};
	}
	if (fs.existsSync(MINIFIED_ORION_CLIENT)) {
		app.use(express.static(MINIFIED_ORION_CLIENT, Object.assign({
			dotfiles: 'allow'
		}, staticCacheOption)));
	} else {
		const prependStaticAssets = (options.configParams.get("prepend.static.assets") || "").split(","),
			appendStaticAssets = (options.configParams.get("append.static.assets") || "").split(","),
			orionode_static = path.normalize(path.join(LIBS, 'orionode.client/'));
		if (options.configParams.get("orion.collab.enabled")) {
			appendStaticAssets.push('./bundles/org.eclipse.orion.client.collab/web');
		}
		app.use(require('./lib/orion_static')(Object.assign({
			orionClientRoot: ORION_CLIENT,
			orionode_static: orionode_static,
			prependStaticAssets: prependStaticAssets,
			appendStaticAssets: appendStaticAssets
		}, staticCacheOption)));
	}
	return app;
};