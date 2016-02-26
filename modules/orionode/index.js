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
/*jslint node:true*/
/*eslint-env node */
var express = require('express'),
	http = require('http'),
    path = require('path'),
    orionFile = require('./lib/file'),
    orionLogin = require('./lib/login'),
    orionWorkspace = require('./lib/workspace'),
    orionGit = require('./lib/git'),
    orionNodeStatic = require('./lib/orionode_static'),
    orionStatic = require('./lib/orion_static'),
    orionTasks = require('./lib/tasks'),
    orionSearch = require('./lib/search'),
    term = require('term.js');

var LIBS = path.normalize(path.join(__dirname, 'lib/')),
    ORION_CLIENT = path.normalize(path.join(__dirname, '../../'));

function handleError(err) {
	throw err;
}

function startServer(options) {
	options = options || {};
	options.maxAge = typeof options.maxAge === "number" ? options.maxAge : undefined;
	var workspaceDir = options.workspaceDir, configParams = options.configParams;
	try {
		//http server
		var app = express();
		var server = http.createServer(app);
		app.use(term.middleware());
		app.use(orionNodeStatic(path.normalize(path.join(LIBS, 'orionode.client/'))))
		app.use(orionStatic({
				orionClientRoot: ORION_CLIENT,
				maxAge: options.maxAge
			}))
		// API handlers
		app.use('/login', orionLogin())
		app.use('/task', orionTasks.orionTasksAPI({
			root: '/task'
		}))
		app.use('/file', orionFile({
			root: '/file',
			workspaceDir: workspaceDir
		}))
		app.use('/workspace', orionWorkspace({
			root: '/workspace',
			fileRoot: '/file',
			workspaceDir: workspaceDir
		}))
		app.use(orionGit({ 
				root: '/gitapi',
				fileRoot: '/file',
				workspaceDir: workspaceDir
			}))
		app.use('/filesearch', orionSearch({
			root: '/filesearch',
			fileRoot: '/file',
			workspaceDir: workspaceDir
		}))
		return app;
	} catch (e) {
		handleError(e);
	}
}

module.exports = startServer;
