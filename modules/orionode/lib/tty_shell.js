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
		fileUtil = require('./fileUtil');
var pty;
try {
	pty = require("pty.js");
} catch (e) {
	console.error(e.message);
	console.error("pty.js is not installed. Some features will be unavailable.");
}

exports.install = function(options) {
	var io = options.io, fileRoot = options.fileRoot, workspaceDir = options.workspaceDir;
	if (!io) {
		throw new Error('missing options.io');
	}
	if (!fileRoot) {
		throw new Error('missing optons.fileRoot');
	}
	//TODO use user worspace
	if (!workspaceDir) {
		throw new Error('missing optons.workspaceDir');
	}

	function resolvePath(wwwPath) {
		var filePath = api.rest(fileRoot, wwwPath || "");
		if(!filePath){
			filePath = api.rest(fileRoot, fileRoot);
		}
		return fileUtil.safeFilePath(workspaceDir, filePath);
	}

	io.of('/tty').on('connection', function(sock) {
		sock.on('start', function(cwd) {
			// Handle missing pty.js
			if (!pty) {
				var error = new Error('pty.js is not installed on this server. Terminal cannot be used.');
				console.error(error);
				sock.emit('fail', error.message);
				return;
			}

			var realCWD = resolvePath(cwd);
			var buff = [];
			// Open Terminal Connection
			var terminal = pty.fork(process.env.SHELL || 'sh', [], {
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
	});
};

exports.uninstall = function() {
};
