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
var term = require('term.js');
var pty;
try {
	pty = require("pty.js");
} catch (e) {
	console.error(e);
	console.error("pty.js is not installed. Some features will be unavailable.");
}

function emitError(socket, error) {
	socket.emit('error', error && error.stack);
}

/**
 * Forwards events:
 * app 'stdout' -> socket 'stdout'
 * app 'stderr' -> socket 'stderr'
 */
function pipeStreams(app, socket) {
	var proc = app.process;
	// TODO: This forces proc output to be interpreted as UTF-8. Should send binary data to client and let them deal with it
	proc.stdout.setEncoding('utf8');
	proc.stderr.setEncoding('utf8');
	var streamHandler = function(type, data) {
		data = Buffer.isBuffer(data) ? data.toString('base64') : data;
		socket.emit(type, data);
	};
	var stdoutListener = streamHandler.bind(null, 'stdout');
	var stderrListener = streamHandler.bind(null, 'stderr');
	app.on('stdout', stdoutListener);
	app.on('stderr', stderrListener);
	app.on('exit', function() {
		app.removeListener('stdout', stdoutListener);
		app.removeListener('stderr', stderrListener);
	});
}

function checkParamType(args, name, type) {
	if (typeof args[name] !== type) {
		throw new Error('Missing parameter "' + name + '"');
	}
}

exports.install = function(options) {
	var io = options.io, appContext = options.appContext;
	if (!io || !appContext) {
		throw new Error('Missing "io" or "appContext"');
	}
	io.sockets.on('connection', function(socket) {
		var handshakeData = socket.handshake;
		socket.on('npm', function(data) {
			try {
				appContext.startNPM(data.args, data.context).then (function (result) {
					if(result.app){
						pipeStreams(result.app, socket);
						result.app.on('exit', function(c) {
							socket.emit('stopped', result.app.toJson());
						});
						socket.emit('started', result.app.toJson());
					} else if(result.error) {
						socket.emit('stopped', {error: result.error});
					}
				});
			} catch (error) {
				console.log(error && error.stack);
				emitError(socket, error);
			}
		});
		socket.on('start', function(data) {
			try {
				checkParamType(data, 'modulePath', 'string');
				var app = appContext.startApp(data.modulePath, data.args, data.context);
				pipeStreams(app, socket);
				app.on('exit', function(c) {
					socket.emit('stopped', app.toJson());
				});
				socket.emit('started', app.toJson());
			} catch (error) {
				console.log(error && error.stack);
				emitError(socket, error);
			}
		});
		socket.on('debug', function(data) {
			try {
				checkParamType(data, 'modulePath', 'string');
				checkParamType(data, 'port', 'number');
				var app = appContext.debugApp(data.modulePath, data.port, data.args, data.context, handshakeData.headers, handshakeData.url);
				pipeStreams(app, socket);
				app.on('exit', function(c) {
					socket.emit('stopped', app.toJson());
				});
				socket.emit('started', app.toJson());
			} catch (error) {
				console.log(error && error.stack);
				emitError(socket, error);
			}
		});
		socket.on('disconnect', function() {
			// stop piping?
		});
	});
  io.of('/tty').on('connection', function(sock) {
    sock.on('start', function(cwd) {
      // Handle missing pty.js
      if (!pty) {
        var error = new Error('pty.js is not installed on this server. Terminal cannot be used.');
        console.error(error);
        sock.emit('fail', error.message);
        return;
      }

      var realCWD = appContext.getPath(cwd);
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
        termsocket = null;
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
