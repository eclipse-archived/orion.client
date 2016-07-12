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
/*eslint-env node, rimraf*/
/*eslint-disable no-sync*/
var path = require('path');
var cp = require('child_process');
var rimraf = require('rimraf');
var api = require('./api');

function fork(modulePath, args, options, callback) {
    var callbackCalled = false;
    var resolve = function (result) {
        if (callbackCalled) {
            return;
        }
        callbackCalled = true;
        callback(null, result);
    };
    var reject = function (err) {
        if (callbackCalled) {
            return;
        }
        callbackCalled = true;
        callback(err, null);
    };

    var childProcess = cp.spawn(modulePath, args, {
        silent: true,
        cwd: options.cwd,
        env: null,
        execArgv: options.execArgv
    });
    childProcess.once('error', function (err) {
        reject(err);
    });
    childProcess.once('exit', function (err) {
        reject(err);
    });
    resolve(childProcess);
}

var DEBUG = true;
function runJavaServer(){
	return new Promise(function(resolve, reject){
			var child = 'java';
			var params = [];
			var workspacePath = path.resolve( __dirname,"../server/tmp_ws");
			rimraf(workspacePath, function(error) {
				//TODO handle error
				if(DEBUG){
					params.push('-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=1044');
				}
				params.push("-Dlog.level=ALL");
				params.push('-Declipse.application=org.jboss.tools.vscode.java.id1');
				params.push('-Dosgi.bundles.defaultStartLevel=4');
				params.push('-Declipse.product=org.jboss.tools.vscode.java.product');
				if(DEBUG)
					params.push('-Dlog.protocol=true');
			
				params.push('-jar'); params.push(path.resolve( __dirname ,'../server/plugins/org.eclipse.equinox.launcher_1.3.200.v20160318-1642.jar'));
				//select configuration directory according to OS
				var configDir = 'config_win';
				if ( process.platform === 'darwin' ){
					configDir = 'config_mac';
				}else if(process.platform === 'linux'){
					configDir = 'config_linux';
				}
				params.push('-configuration');
				params.push(path.resolve( __dirname ,'../server', configDir));
				params.push('-data');
				params.push(workspacePath);
				
				fork(child,params,{}, function(err, result){
					if(err) reject(err);
					if(result) resolve(result);
				});
			});
	});
}

function parseMessage(arr) {
	try {
		var headerRegex = /([^:]*):\s?([^\r]*)/gi;
		var message = Object.create(null);
		message.headers = Object.create(null);
		for(var i = 0, len = arr.length; i < len; i++) {
			if(arr[i] === 13) {
				if(i+3 < len && arr[i+1] === 10 && arr[i+2] === 13 && arr[i+3] === 10) {
					var s = arr.toString("utf8", 0, i+4);
					var heads;
					while((heads = headerRegex.exec(s)) !== null) {
						message.headers[heads[1]] = heads[2];
					}
					break;
				}
			}			
		}
		if(i+3 < arr.length && message.headers['Content-Length']) {
			var c = arr.toString("utf8", i+4, i+4+Number(message.headers['Content-Length']));
			message.content = JSON.parse(c);
		}
		if (!Object.keys(message.headers).length) {
			
			return null;
		}
		return message;
	}
	catch(err) {
		console.log(err);
	}
	return null;
}

exports.install = function(options) {
	var io = options.io;
	if (!io) {
		throw new Error('missing options.io');
	}

	io.of('/languageServer').on('connection', function(sock) {
		sock.on('start', /* @callback */ function(cwd) {
			runJavaServer().then(function(child) {
				var workspaceUrl = "file:///" + options.workspaceDir.replace(/\\/g, "/");
				child.stdout.on('data', function(data) {
					var m = parseMessage(data);
					if (m) {
						if (m.content && m.content.params && m.content.params.uri) {
							var s = m.content.params.uri.slice(workspaceUrl.length);
							m.content.params.uri = api.join('/file', s.charAt(0) === '/' ? s.slice(1) : s);
						}
						sock.emit('data', m.content);
					}
				});
				child.on('error', function(err) {
					console.log(err.toString());
				});
				// Set up communication paths
				sock.on('data', function(data) {
					var textDocument = data.params && data.params.textDocument && data.params.textDocument;
					if (textDocument && textDocument.uri) {
						textDocument.uri = workspaceUrl + textDocument.uri.replace(/^\/file/, '');
					}
					var s = JSON.stringify(data);
					child.stdin.write("Content-Length: " + s.length + "\r\n\r\n" + s);
				});
	
				sock.on('disconnect', function() {
					if(child.connected) {
						child.disconnect();
					} else {
						child.kill();
					}
					sock = null;
				});
				sock.emit('Java process ready');
			});
			sock.emit('ready', JSON.stringify({workspaceDir: options.workspaceDir, processId: process.pid}));
		});
	});
};

exports.uninstall = function() {
};
