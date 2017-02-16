/*******************************************************************************
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/
/*eslint-disable no-sync*/
var api = require('./api'),
	fileUtil = require('./fileUtil'),
	fs = require('fs'),
	http = require('http'),
	path = require('path');
var pty;
try {
	pty = require("node-pty");
} catch (e) {
	console.error(e.message);
	console.error("node-pty is not installed. Some features will be unavailable.");
}

exports.install = function(options) {
	var io = options.io, fileRoot = options.fileRoot, workspaceDir = options.workspaceDir, app = options.app;
	if (!io) {
		throw new Error('missing options.io');
	}
	if (!fileRoot) {
		throw new Error('missing optons.fileRoot');
	}
	if (!workspaceDir) {
		throw new Error('missing optons.workspaceDir');
	}

	function resolvePath(userWorkspaceDir, wwwPath, callback) {
		var filePath = api.rest(fileRoot, wwwPath || "");
		if(!filePath){
			filePath = api.rest(fileRoot, fileRoot);
		}
		// Check if the cwd passed in exists. If not, fall back to the user's
		// workspace dir
		var cwd = fileUtil.safeFilePath(userWorkspaceDir, filePath);
		fs.stat(cwd, function(err, stats) {
			if (err || !stats.isDirectory()) {
				cwd = userWorkspaceDir;
			}
			callback(cwd);
		});
	}

	io.of('/tty').on('connection', function(sock) {

		// Get the user's workspace dir
		var userWorkspaceDir = workspaceDir;
		// Pass the handshake request to express so as to get session variables
		// with a dummy response that won't send any actual data back to the
		// client. Notice that we uses app.handle here which is actually a
		// private API.
		// See: https://github.com/HenningM/express-ws
		var startCalled = false;
		var userGot = false;
		var passedCwd = "";
		var req = sock.request;
		var res = new http.ServerResponse(sock.request);
		app.handle(req, res);

		res.end = function() {
			userGot = true;
			if (startCalled) {
				onStart(passedCwd);
			}
		};

		sock.once('start', function(cwd) {
			startCalled = true;
			passedCwd = cwd;
			if (userGot) {
				onStart(passedCwd);
			}
		});

		function onStart(cwd) {
			// Handle missing node-pty
			if (!pty) {
				var error = new Error('node-pty is not installed on this server. Terminal cannot be used.');
				console.error(error);
				sock.emit('fail', error.message);
				return;
			}

			if (!req.user) {
				// Not authenticated
				sock.emit('fail', 'Not authenticated.');
				return;
			}

			if (req.user.workspace) {
				userWorkspaceDir = path.join(userWorkspaceDir, req.user.workspace);
			}
			resolvePath(userWorkspaceDir, cwd, function(realCWD) {
				var buff = [];
				// Open Terminal Connection
				var shell = process.platform === 'win32' ? 'powershell.exe' : (process.env.SHELL || 'sh');
				var terminal = pty.fork(shell, [], {
					name: require('fs').existsSync('/usr/share/terminfo/x/xterm-256color')
					? 'xterm-256color'
					: 'xterm',
						cols: 80,
						rows: 24,
						cwd: realCWD
				});

				terminal.on('data', function(data) {
					return !sock
					? buff.push(data)
					: sock.emit('data', data);
				});

				console.log('Created new %s (fd: %d, pid: %d)',
					process.env.SHELL || 'sh',
					terminal.fd, 
					terminal.pid);

				// Set up communication paths
				sock.on('data', function(data) {
					terminal.write(data);
				});

				// Set up resize path
				sock.on('resize', function(cols, rows) {
					terminal.resize(cols, rows);
				});

				sock.on('disconnect', function() {
					terminal.destroy()
					// termsocket = null;
				});

				while (buff.length) {
					sock.emit('data', buff.shift());
				}

				sock.emit('ready');
			});
		};
	});
};

exports.uninstall = function() {
};
