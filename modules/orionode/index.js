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
var connect = require('connect'),
    path = require('path'),
    AppContext = require('./lib/node_apps').AppContext,
    orionFile = require('./lib/file'),
    orionNode = require('./lib/node'),
    orionWorkspace = require('./lib/workspace'),
    orionGit = require('./lib/git'),
    orionNodeStatic = require('./lib/orionode_static'),
    orionStatic = require('./lib/orion_static'),
    orionTasks = require('./lib/tasks'),
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
		var appContext = new AppContext({fileRoot: '/file', workspaceDir: workspaceDir, configParams: configParams});

		// HTTP server
		var app = connect()
      .use(term.middleware())
			// static code
			.use(orionNodeStatic(path.normalize(path.join(LIBS, 'orionode.client/'))))
			.use(orionStatic({
				orionClientRoot: ORION_CLIENT,
				maxAge: options.maxAge
			}))
            .use(function(req, res, next) {

                // Fake login response
                if (req.url === "/login" && req.method === "POST") {
                    console.log("login")
                    return res.end(JSON.stringify({
                        "EmailConfirmed": false,
                        "FullName": "anonymous",
                        "HasPassword": true,
                        "LastLoginTimestamp": "1416865840208",
                        "Location": "/workspace/orionode",
                        "UserName": "anonymous"
                    }))
                }

                next();
            })
            .use(orionTasks.orionTasksAPI({
                root: '/task'
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
			.use(orionGit({ 
				root: '/gitapi',
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
