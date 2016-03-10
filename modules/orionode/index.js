/*******************************************************************************
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node */
var express = require('express'),
    path = require('path'),
    orionFile = require('./lib/file'),
    orionWorkspace = require('./lib/workspace'),
    orionGit = require('./lib/git'),
    orionNodeStatic = require('./lib/orionode_static'),
    orionPrefs = require('./lib/controllers/prefs'),
    orionStatic = require('./lib/orion_static'),
    orionTasks = require('./lib/tasks'),
    orionSearch = require('./lib/search'),
    orionUser = require('./lib/user'),
   
    term = require('term.js');

var LIBS = path.normalize(path.join(__dirname, 'lib/')),
    ORION_CLIENT = path.normalize(path.join(__dirname, '../../'));

function handleError(err) {
	throw err;
}

function startServer(options) {
	options = options || {};
	options.maxAge = typeof options.maxAge === "number" ? options.maxAge : undefined;
	var workspaceDir = options.workspaceDir;
	
	try {
		var app = express();

		orionUser({app: app, options: options});

		app.use(term.middleware());
		app.use(orionNodeStatic(path.normalize(path.join(LIBS, 'orionode.client/'))));
		app.use(orionStatic({
			orionClientRoot: ORION_CLIENT,
			maxAge: options.maxAge
		}));

		app.use(function (req, res, next) {
			if (!req.user) {
				res.writeHead(401, "Not authenticated");
				res.end();
			} else {
				req.user.workspaceDir = workspaceDir + (req.user.workspace ? "/" + req.user.workspace : "");
			}
			next();
		});
		
		// API handlers
		app.use('/task', orionTasks.orionTasksAPI({
			root: '/task'
		}));
		app.use('/file', orionFile({
			root: '/file'
		}));
		app.use('/workspace', orionWorkspace({
			root: '/workspace',
			fileRoot: '/file'
		}));
		app.use('/gitapi', orionGit({ 
			root: '/gitapi',
			fileRoot: '/file'
		}));
		app.use('/filesearch', orionSearch({
			root: '/filesearch',
			fileRoot: '/file'
		}));
		app.use('/prefs', orionPrefs({
		}));

		//error handling
		app.use(function(req, res){
			res.status(404);

			// respond with html page
			if (req.accepts('html')) {
				//res.render('404', { url: req.url });
				return;
			}

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
