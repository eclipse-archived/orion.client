/*******************************************************************************
 * Copyright (c) 2013 IBM Corporation and others.
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
	MINIFIED_ORION_CLIENT = "lib/orion.client",
	ORION_CLIENT = path.normalize(path.join(__dirname,
		fs.existsSync(path.join(__dirname, MINIFIED_ORION_CLIENT)) ? MINIFIED_ORION_CLIENT : '../../'));

function handleError(err) {
	throw err;
}

function startServer(options) {
	options = options || {};
	options.configParams = options.configParams || {};
	options.maxAge = typeof options.maxAge === "number" ? options.maxAge : undefined;
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
			app.use(require('./lib/user')(options));
		}
		app.use('/site', checkAuthenticated, require('./lib/sites')(options));
		app.use('/task', checkAuthenticated, require('./lib/tasks').router({ root: '/task' }));
		app.use('/filesearch', checkAuthenticated, require('./lib/search')(options));
		app.use('/file*', checkAuthenticated, require('./lib/file')({ root: '/file', options: options }));
		app.use('/workspace*', checkAuthenticated, require('./lib/workspace')({ root: '/workspace', fileRoot: '/file', options: options }));
		app.use('/gitapi', checkAuthenticated, require('./lib/git')({ root: '/gitapi', fileRoot: '/file', options: options}));
		app.use('/cfapi', checkAuthenticated, require('./lib/cf')({ root: '/cfapi',  options: options}));
		app.use('/prefs', checkAuthenticated, require('./lib/controllers/prefs').router(options));
		app.use('/xfer', checkAuthenticated, require('./lib/xfer')(options));
		app.use('/metrics', require('./lib/metrics').router(options));
		app.use('/version', require('./lib/version').router(options));
		if (options.configParams.isElectron) app.use('/update', require('./lib/update').router(options));

		// Static files
		app.use(require('term.js').middleware());
		app.use(require('./lib/orionode_static')(path.normalize(path.join(LIBS, 'orionode.client/'))));
		app.use(require('./lib/orion_static')({ orionClientRoot: ORION_CLIENT, maxAge: options.maxAge }));

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
