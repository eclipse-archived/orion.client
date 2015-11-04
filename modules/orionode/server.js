/*******************************************************************************
 * Copyright (c) 2012, 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/
var express = require('express'),
	http = require('http'),
	compression = require('compression'),
    path = require('path'),
    socketio = require('socket.io'),
    util = require('util'),
    appSocket = require('./lib/node_app_socket'),
    argslib = require('./lib/args'),
    orion = require('./index.js'),
    basicAuth = require('basic-auth');

function noop(req, res, next) { next(); }

//might need to add a username argument too. 
/*function auth(pwd) {
	return function(req,res,next){
		function unauthorized(res) {
			//redirect to login page
			return next();
		};
		
		var user = basicAuth(req)
		if(!user || !user.name || !user.pass)
		{
			return unauthorized(res);
		}
		
		//need to change to do proper check
		if (user.name === 'some username' && user.pass === 'some password') {
	    	return next();
	  	}else
	  	{
	  		//redirect to login page
	  	}
  		return noop();
  	}
}*/

function auth(pwd) {
    if (typeof pwd === 'string' && pwd.length > 0) {
        return function checkAuth(req, res, next) {
            var credentials = basicAuth(req);
            if (!credentials || credentials.pass !== pwd ) {
                res.statusCode = 401;
                res.setHeader('WWW-Authenticate', 'Basic realm="example"');
                res.end('Access denied');
             }
             return next();
         };
    }
    return noop;
}

// Get the arguments, the workspace directory, and the password file (if configured), then launch the server
var args = argslib.parseArgs(process.argv);
var port = args.port || args.p || 8081;
var configFile = args.config || args.c || path.join(__dirname, 'orion.conf');

argslib.readConfigFile(configFile, function(configParams) {
	configParams = configParams || {};

	var workspaceArg = args.workspace || args.w;
	var workspaceConfigParam = configParams.workspace;
	var workspaceDir;
	if (workspaceArg) {
		// -workspace passed in command line is relative to cwd
		workspaceDir = path.resolve(process.cwd(), workspaceArg);
	} else if (workspaceConfigParam) {
		 // workspace param in orion.conf is relative to the server install dir.
		workspaceDir = path.resolve(__dirname, workspaceConfigParam);
	} else {
		workspaceDir = path.join(__dirname, '.workspace');
	}

	argslib.createDirs([workspaceDir], function(dirs) {
		var passwordFile = args.password || args.pwd;
		argslib.readPasswordFile(passwordFile, function(password) {
			var dev = Object.prototype.hasOwnProperty.call(args, 'dev');
			var log = Object.prototype.hasOwnProperty.call(args, 'log');
			if (dev) {
				console.log('Development mode: client code will not be cached.');
			}
			if (passwordFile) {
				console.log(util.format('Using password from file: %s', passwordFile));
			}
			console.log(util.format('Using workspace: %s', workspaceDir));
			console.log(util.format('Listening on port %d...', port));

			// create web server
			var orionMiddleware = orion({
				workspaceDir: dirs[0],
				configParams: configParams,
				maxAge: (dev ? 0 : undefined),
			}), appContext = orionMiddleware.appContext;
			
			// add socketIO and app support
			var app = express();
			var server = http.createServer(app);
			app.use(log ? express.logger('tiny') : noop);
			app.use(auth(password || configParams.pwd));
			app.use(compression());
			app.use(orionMiddleware);
			server.listen(port);
			
			
			var io = socketio.listen(server, { 'log level': 1 });
			appSocket.install({ io: io, appContext: appContext });
			server.on('error', function(err) {
				console.log(err);
			});
		});
	});
});
