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
	fs = require('fs');

var LIBS = path.normalize(path.join(__dirname, 'lib/')),
	MINIFIED_ORION_CLIENT = path.normalize(path.join(__dirname, "lib/orion.client")),
	ORION_CLIENT = path.normalize(path.join(__dirname, '../../'));

function handleError(err) {
	throw err;
}

function startServer(options) {
	if(options.configParams["additional.modules.path"]){
		var addModulePath = require('app-module-path');
		options.configParams["additional.modules.path"].split(",").forEach(function(modulePath){
			addModulePath.addPath(path.join(__dirname, modulePath));
		});
	}
	options = options || {};
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
				res.writeHead(401, "Not authenticated");
				res.end();
			} else {
				req.user.workspaceDir = options.workspaceDir + (req.user.workspace ? "/" + req.user.workspace : "");
				next();
			}
		}

		// API handlers
		if (options.configParams["orion.single.user"]) {
			app.use(/* @callback */ function(req, res, next){
				req.user = {username: "anonymous"};
				next();
			});
			app.post('/login', function(req, res) {
				if (!req.user) {
					return res.status(200).end();
				}
				return res.status(200).json({UserName: req.user.username});
			});
		} else {
			app.use(require(options.configParams["login.module"] || "./lib/user").router(options));
		}
		app.use('/site', checkAuthenticated, require('./lib/sites')(options));
		app.use('/task', checkAuthenticated, require('./lib/tasks').router({ taskRoot: contextPath + '/task', singleUser: options.configParams["orion.single.user"]}));
		app.use('/filesearch', checkAuthenticated, require('./lib/search')(options));
		app.use('/file*', checkAuthenticated, require('./lib/file')({ gitRoot: contextPath + '/gitapi', fileRoot: contextPath + '/file', options: options }));
		app.use('/workspace*', checkAuthenticated, require('./lib/workspace')({ workspaceRoot: contextPath + '/workspace', fileRoot: contextPath + '/file', gitRoot: contextPath + '/gitapi', options: options }));
		app.use('/gitapi', checkAuthenticated, require('./lib/git')({ gitRoot: contextPath + '/gitapi', fileRoot: contextPath + '/file', workspaceRoot: contextPath + '/workspace', options: options}));
		app.use('/cfapi', checkAuthenticated, require('./lib/cf')({ fileRoot: contextPath + '/file', options: options}));
		app.use('/prefs', checkAuthenticated, require('./lib/controllers/prefs').router(options));
		app.use('/xfer', checkAuthenticated, require('./lib/xfer')({fileRoot: contextPath + '/file', options:options}));
		app.use('/metrics', require('./lib/metrics').router(options));
		app.use('/version', require('./lib/version').router(options));
		if(options.configParams["additional.endpoint"]){
			var additionalEndpoints = require(options.configParams["additional.endpoint"]);
			additionalEndpoints.forEach(function(additionalEndpoint){
				additionalEndpoint.authenticated ? app.use(additionalEndpoint.endpoint, checkAuthenticated, require(additionalEndpoint.module).router(options))
					: app.use(additionalEndpoint.endpoint, require(additionalEndpoint.module).router(options));
			});
		}
		if (options.configParams.isElectron) app.use('/update', require('./lib/update').router(options));

		// Static files
		app.use('/xterm', express.static(path.join(__dirname, 'node_modules', 'xterm', 'dist')));
		if (fs.existsSync(MINIFIED_ORION_CLIENT)) {
			app.use(express.static(MINIFIED_ORION_CLIENT, {maxAge: options.maxAge, dotfiles: 'allow'}));
		} else {
			var prependStaticAssets = options.configParams["prepend.static.assets"] && options.configParams["prepend.static.assets"].split(",") || [];
			var appendStaticAssets = options.configParams["append.static.assets"] && options.configParams["append.static.assets"].split(",") || [];
			var orionode_static = path.normalize(path.join(LIBS, 'orionode.client/'));
			app.use(require('./lib/orion_static')({ orionClientRoot: ORION_CLIENT, maxAge: options.maxAge, orionode_static: orionode_static, prependStaticAssets: prependStaticAssets, appendStaticAssets: appendStaticAssets}));
		}

		//error handling
		app.use(function(req, res){
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
