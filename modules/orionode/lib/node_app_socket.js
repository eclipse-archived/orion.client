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
};

exports.uninstall = function() {
};