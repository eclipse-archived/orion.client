/*******************************************************************************
 * Copyright (c) 2012, 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/
var path = require('path');
var async = require('async');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var argslib = require('../lib/args');
var http = require("http");
var https = require("https");
var args = argslib.parseArgs(process.argv);

if (!(args.host && args.port && args.src)) {
	console.log("Usage: -host <host> -port <port> -password <admin password> -src <source workspace>"); //$NON-NLS-1$
} else {
	createUsers();
}

function getUsers(directory) {
	var users = [];
	return fs.readdirAsync(directory)
	.then(function(groupDirs) {
		return Promise.map(groupDirs, function(_groupDir) {
			if (_groupDir === "metastore.json") return;
			var groupDir = path.join(directory, _groupDir);
			return fs.readdirAsync(groupDir)
			.then(function(userDirs) {
				return Promise.map(userDirs, function(userDir) {
					var userFile = path.join(groupDir, userDir, "user.json"); //$NON-NLS-1$
					return fs.readFileAsync(userFile, 'utf-8') //$NON-NLS-1$
					.then(function(contents) {
						var json = JSON.parse(contents);
						users.push({
							"UserName": json.UserName,
							"FullName": json.FullName,
							"Email": json.Properties.Email,
							"Password": json.Properties.Password,
						});
					})
					.catch(function() {
						//ignore 	
					});
				});
			});
		});
	})
	.then(function() {
		return users.filter(function(u) { return u.UserName === "silenio"; });
	});
}

function login () {
	return new Promise(function(fulfill, reject) {
		var prot = args.host.indexOf("https") === 0 ? https : http; //$NON-NLS-0$
		var req = prot.request({
			host: args.host.substring(args.host.indexOf("://") + 3), //$NON-NLS-1$
			port: args.port,
			path: "/login/form", //$NON-NLS-1$
			method: "POST", //$NON-NLS-1$
			headers: {
				'Content-Type': 'application/json' //$NON-NLS-1$
			}
		}, function(res)
		{
			res.on('end', function() { //$NON-NLS-1$
			debugger;
				fulfill(res.headers.Cookie);
			});
		});
	
		req.on('error', function(err) { //$NON-NLS-1$
		debugger;
			console.log("LOGIN: " + err.message); //$NON-NLS-1$
			reject();
		});
		req.write("username=admin&password=" + args.password); //$NON-NLS-1$
		req.end();
	});
}

function createUsers() {
	return getUsers(args.src)
	.then(function(users) {
		login().then(function(cookie) {
			async.series(users.map(function(user) {
				return function(cb) {
					var prot = args.protocol === "http" ? https : http;
					var req = prot.request({
						host: args.host.substring(args.host.indexOf("://") + 3), //$NON-NLS-1$
						port: args.port,
						path: "/users", //$NON-NLS-1$
						method: "POST", //$NON-NLS-1$
						headers: {
							'Cookie': cookie,
							'Content-Type': 'application/json' //$NON-NLS-1$
						}
					}, function(res)
					{
						res.on('end', function() { //$NON-NLS-1$
							cb();
						});
					});
				
					req.on('error', function(err) { //$NON-NLS-1$
						console.log(err.message);
						cb();
					});
					req.write(user);
					req.end();
				};
			}));
		});
	});
}

