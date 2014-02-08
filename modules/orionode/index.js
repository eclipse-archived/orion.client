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
    orionStatic = require('./lib/orion_static'),
    term = require('term.js'),
    pty = require('pty.js');

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

    // Open Terminal Connection

    var buff = []
      , termsocket
      , terminal;

    terminal = pty.fork(process.env.SHELL || 'sh', [], {
      name: require('fs').existsSync('/usr/share/terminfo/x/xterm-256color')
      ? 'xterm-256color'
      : 'xterm',
         cols: 80,
         rows: 24,
         cwd: process.env.HOME
    });

    terminal.on('data', function(data) {
      return !termsocket
      ? buff.push(data)
      : termsocket.emit('data', data);
    });

    console.log(''
        + 'Created shell h pty master/slave'
        + ' pair (master: %d, pid: %d)',
        terminal.fd, terminal.pid);

		// HTTP server
		var app = connect()
      .use(term.middleware())
			// static code
			.use(orionNodeStatic(path.normalize(path.join(LIBS, 'orionode.client/'))))
			.use(orionStatic({
				orionClientRoot: ORION_CLIENT,
				maxAge: options.maxAge
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
		// Socket server
		//var io = socketio.listen(app, { 'log level': 1 });

    var termio;

    // Terminal Socket
    termio = socketio.listen(app, { 'log level': 1 });

    termio.sockets.on('connection', function(sock) {
      termsocket = sock;

      termsocket.on('data', function(data) {
        terminal.write(data);
      });

      termsocket.on('disconnect', function() {
        termsocket = null;
      });

      while (buff.length) {
        termsocket.emit('data', buff.shift());
      }
    });

	  //appSocket.install({io: io, appContext: appContext});
		appSocket.install({io: termio, appContext: appContext});
		app.on('error', handleError);
		return app;
	} catch (e) {
		handleError(e);
	}
}

module.exports = startServer;
