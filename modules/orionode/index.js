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
	path = require('path'),
	fs = require('fs'),
	api = require('./lib/api'),
	fileUtil = require('./lib/fileUtil'),
	log4js = require('log4js'),
	logger = log4js.getLogger("response");

var LIBS = path.normalize(path.join(__dirname, 'lib/')),
	MINIFIED_ORION_CLIENT = path.normalize(path.join(__dirname, "lib/orion.client")),
	ORION_CLIENT = path.normalize(path.join(__dirname, '../../'));

var POST = 1;
var PUT = 2;
var GET = 4;
var DELETE = 8;
/**
 * uri is req.wholeUri stubstring from req.contextpath
 * methodMask is either POST=1,PUT=2,GET=4,DELETE=8
 */
var checkRights = function (userId, uri, req, res, next, method){
	var	methodMask = getMethod(method || req.method);
	if (uri === "/workspace"){
		return done(true);
	}
	
	// any user can access their site configurations
	if (uri.startsWith("/site")){
		return done(true);
	}
	
	// any user can access their own profile
	if (uri === "/users/" + userId){
		return done(true);
	}
	
	// any user can access tasks
	if (uri.startsWith("/task")){
		return done(true);
	}
	
	// import/export rights depend on access to the file content
	if (uri.startsWith("/xfer/export/") && uri.endsWith(".zip")){
		uri = "/file/" + uri.substring("/xfer/export/".length, uri.length - 4) + '/';
	} else if (uri.startsWith("/xfer/import/")) {
		uri = "/file/" + uri.substring("/xfer/import/".length); //$NON-NLS-1$
		if (!uri.endsWith("/")) //$NON-NLS-1$
			uri += '/';
	}
	
	var store = fileUtil.getMetastore(req);
	store.readUserPreferences(userId, function(err, prefs){
		var userRightArray = prefs.UserRights || [];
		var hasAccess = userRightArray.some(function(userRight){
			if(wildCardMatch(uri, userRight.Uri) && ((methodMask & userRight.Method) === methodMask)){
				return true;
			}
		});
		return done(hasAccess);
	});	
	function done(hasAccess){
		if(hasAccess) {
			next();
		}else {
			api.writeError(403, res, "You are not authorized to access" + uri);
		}
	}
	function wildCardMatch(text, pattern){
		var cards = pattern.split("*");
		if (!pattern.startsWith("*") && !text.startsWith(cards[0])) { //$NON-NLS-1$
			return false;
		}
		if (!pattern.endsWith("*") && !text.endsWith(cards[cards.length - 1])) { //$NON-NLS-1$
			return false;
		}
		return !cards.some(function(card){
			var idx = text.indexOf(card);
			if (idx === -1){
				return true;
			}
			text = text.substring(idx + card.length);
		});
	}
	function getMethod(methodName){
		if(methodName === "POST"){
			return POST;
		}else if(methodName === "PUT"){
			return PUT;
		}else if(methodName === "GET"){
			return GET;
		}else if(methodName === "DELETE"){
			return DELETE;
		}
		return 0;
	}
}
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
			var uri;
			uri = req.baseUrl.substring(req.contextPath.length);
			req.user.checkRights(req.user.username, uri, req, res, next);
		}

		// Configure metastore
		var metastoreFactory;
		if (!options.configParams['orion.single.user'] && options.configParams['orion.metastore.useMongo']) {
			metastoreFactory = require('./lib/metastore/mongodb/store');
		} else {
			metastoreFactory = require('./lib/metastore/fs/store');
		}
		options.metastore = app.locals.metastore = metastoreFactory(options);
		app.locals.metastore.setup(app);

		// Add API routes
		if(options.configParams["additional.endpoint"]){
			var additionalEndpoints = require(options.configParams["additional.endpoint"]);
			additionalEndpoints.forEach(function(additionalEndpoint){
				if(additionalEndpoint.endpoint){
					additionalEndpoint.authenticated ? 
						app.use(additionalEndpoint.endpoint, checkAuthenticated, require(additionalEndpoint.module).router(options))	 : 
						app.use(additionalEndpoint.endpoint, require(additionalEndpoint.module).router(options));
				}else{
					var extraModule = require(additionalEndpoint.module);
					var middleware = extraModule.router ? extraModule.router(options) : extraModule(options);
					if (middleware)	app.use(middleware); // use this module as a middleware 
				}
			});
		}
		if(options.configParams["orion.collab.enabled"]){
			app.use('/sharedWorkspace', require('./lib/sharedWorkspace').router({sharedWorkspaceFileRoot: contextPath + '/sharedWorkspace/tree/file', fileRoot: contextPath + '/file', options: options  }));
		}
		app.use(require('./lib/user').router(options));
		app.use('/site', checkAuthenticated, checkAccessRights, require('./lib/sites')(options));
		app.use('/task', checkAuthenticated, require('./lib/tasks').router({ taskRoot: contextPath + '/task', options: options}));
		app.use('/filesearch', checkAuthenticated, require('./lib/search')(options));
		app.use('/file*', checkAuthenticated, require('./lib/file')({ workspaceRoot: contextPath + '/workspace', fileRoot: contextPath + '/file', options: options }));
		app.use('/workspace*', checkAuthenticated, checkAccessRights, require('./lib/workspace')({ workspaceRoot: contextPath + '/workspace', fileRoot: contextPath + '/file', gitRoot: contextPath + '/gitapi', options: options }));
		/* Note that the file and workspace root for the git middleware should not include the context path to match java implementation */
		app.use('/gitapi', checkAuthenticated, require('./lib/git')({ gitRoot: contextPath + '/gitapi', fileRoot: /*contextPath + */'/file', workspaceRoot: /*contextPath + */'/workspace', options: options}));
		app.use('/cfapi', checkAuthenticated, require('./lib/cf')({ fileRoot: contextPath + '/file', options: options}));
		app.use('/prefs', checkAuthenticated, require('./lib/controllers/prefs').router(options));
		app.use('/xfer', checkAuthenticated, require('./lib/xfer').router({fileRoot: contextPath + '/file', options:options}));
		app.use('/metrics', require('./lib/metrics').router(options));
		app.use('/version', require('./lib/version').router(options));
		if (options.configParams.isElectron) app.use('/update', require('./lib/update').router(options));

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

		//error handling
		app.use(function(err, req, res, next){
			logger.error(req.originalUrl, err);
			res.status(404);
			// respond with html page
//			if (req.accepts('html')) {
//				res.render('404', { url: req.url });
//				return;
//			}

			// respond with json
			if (req.accepts('json')) {
				res.send({ error: 'Not found' });
				return;
			}

			// default to plain-text. send()
			res.type('txt').send('Not found');
		});

		return app;
	} catch (e) {
		handleError(e);
	}
}

module.exports = startServer;