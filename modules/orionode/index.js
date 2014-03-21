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
var connect = require('connect'),
    path = require('path'),
    AppContext = require('./lib/node_apps').AppContext,
    orionFile = require('./lib/file'),
    orionNode = require('./lib/node'),
    orionWorkspace = require('./lib/workspace'),
    orionNodeStatic = require('./lib/orionode_static'),
    orionStatic = require('./lib/orion_static');

var LIBS = path.normalize(path.join(__dirname, 'lib/')),
    NODE_MODULES = path.normalize(path.join(__dirname, 'node_modules/')),
    ORION_CLIENT = path.normalize(path.join(__dirname, '../../'));

function handleError(err) {
	throw err;
}

function startServer(options) {
	options = options || {};
	var workspaceDir = options.workspaceDir, configParams = options.configParams;
	try {
		var appContext = new AppContext({fileRoot: '/file', workspaceDir: workspaceDir, configParams: configParams});

		var app = connect()
			// static code
			.use(orionNodeStatic(path.normalize(path.join(LIBS, 'orionode.client/')), {
				socketIORoot: path.resolve(NODE_MODULES, 'socket.io-client/')
			}))
			.use(orionStatic({
				orionClientRoot: ORION_CLIENT,
				dev: options.dev
			}))
			// API handlers
			.use(orionFile({
				root: '/file',
				workspaceDir: workspaceDir
			}))
			.use(orionWorkspace({
				root: '/workspace',
				fileRoot: '/file',
				workspaceDir: workspaceDir
			}))
			.use(orionNode({
				appContext: appContext,
				root: '/node'
			}));
		app.appContext = appContext;
		return app;
	} catch (e) {
		handleError(e);
	}
}

module.exports = startServer;
