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
	expressSession = require('express-session'),
	passport = require('passport'),
	path = require('path'),
	fs = require('fs'),
	api = require('./lib/api'),
	checkRights = require('./lib/accessRights').checkRights,
	log4js = require('log4js'),
	logger = log4js.getLogger("response");

var LIBS = path.normalize(path.join(__dirname, 'lib/')),
	MINIFIED_ORION_CLIENT = path.normalize(path.join(__dirname, "lib/orion.client")),
	ORION_CLIENT = path.normalize(path.join(__dirname, '../../'));

function handleError(err) {
	throw err;
}

function startServer(options) {
	options = options || {};
	if(options.configParams["additional.modules.path"]){
		var addModulePath = require('app-module-path');
		options.configParams["additional.modules.path"].split(",").forEach(function(modulePath){
			addModulePath.addPath(path.join(__dirname, modulePath));
		});
	}
	options.configParams = options.configParams || {};
	options.maxAge = typeof options.maxAge === "number" ? options.maxAge : undefined;
	var contextPath = options && options.configParams["orion.context.path"] || "";
	if (typeof options.workspaceDir !== "string") {
		throw new Error("workspaceDir is required");
	}
	
	try {
		var app = express();

		options.app = app;
		
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
		
		var additionalEndpoints = options.configParams["additional.endpoint"] ? require(options.configParams["additional.endpoint"]) : [];
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
		if (!options.configParams['orion.single.user'] && options.configParams['orion.metastore.useMongo'] !== false) {
			metastoreFactory = require('./lib/metastore/mongodb/store');
		} else {
			metastoreFactory = require('./lib/metastore/fs/store');
		}
		options.metastore = app.locals.metastore = metastoreFactory(options);
		app.locals.metastore.setup(app);
		options.authenticate = [
			expressSession({
				resave: false,
				saveUninitialized: false,
				secret: 'keyboard cat',
				store: app.locals.sessionStore // TODO by default MemoryStore is not designed for a production environment, as it will leak memory, and will not scale past a single process.
			}),
			passport.initialize(),
			passport.session()
		];
		
		loadEndpoints(false);
		app.use('/metrics', require('./lib/metrics').router(options));
		app.use('/version', require('./lib/version').router(options));
		if (options.configParams.isElectron) app.use('/update', require('./lib/update').router(options));
		loadEndpoints(true);
		app.use(require('./lib/user').router(options));
		app.use('/site', options.authenticate, checkAuthenticated, checkAccessRights, require('./lib/sites')(options));
		app.use('/task', options.authenticate, checkAuthenticated, require('./lib/tasks').router(options));
		app.use('/filesearch', options.authenticate, checkAuthenticated, require('./lib/search')(options));
		app.use('/file*', options.authenticate, checkAuthenticated, checkAccessRights, require('./lib/file')(options));
		app.use('/workspace*', options.authenticate, checkAuthenticated, checkAccessRights, require('./lib/workspace')(options));
		app.use('/gitapi', options.authenticate, checkAuthenticated, require('./lib/git')(options));
		app.use('/cfapi', options.authenticate, checkAuthenticated, require('./lib/cf')(options));
		app.use('/prefs', options.authenticate, checkAuthenticated, require('./lib/prefs').router(options));
		app.use('/xfer', options.authenticate, checkAuthenticated, require('./lib/xfer').router(options));
		if(options.configParams["orion.collab.enabled"]){
			app.use('/sharedWorkspace', options.authenticate, checkAuthenticated, require('./lib/sharedWorkspace').router(options));
		}
		
		// Static files
		app.use('/xterm', express.static(path.join(__dirname, 'node_modules', 'xterm', 'dist')));
		if (fs.existsSync(MINIFIED_ORION_CLIENT)) {
			app.use(express.static(MINIFIED_ORION_CLIENT, {maxAge: options.maxAge, dotfiles: 'allow'}));
		} else {
			var prependStaticAssets = options.configParams["prepend.static.assets"] && options.configParams["prepend.static.assets"].split(",") || [];
			var appendStaticAssets = options.configParams["append.static.assets"] && options.configParams["append.static.assets"].split(",") || [];
			var orionode_static = path.normalize(path.join(LIBS, 'orionode.client/'));
			if(options.configParams["orion.collab.enabled"]){
				appendStaticAssets.push('./bundles/org.eclipse.orion.client.collab/web');
			}
			app.use(require('./lib/orion_static')({ orionClientRoot: ORION_CLIENT, maxAge: options.maxAge, orionode_static: orionode_static, prependStaticAssets: prependStaticAssets, appendStaticAssets: appendStaticAssets}));
		}
		return app;
	} catch (e) {
		handleError(e);
	}
}

module.exports = startServer;