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
/*eslint-env node */
var express = require('express'),
    path = require('path'),
    orionFile = require('./lib/file'),
    orionLogin = require('./lib/login'),
    orionWorkspace = require('./lib/workspace'),
    orionGit = require('./lib/git'),
    orionNodeStatic = require('./lib/orionode_static'),
    orionPrefs = require('./lib/controllers/prefs'),
    orionStatic = require('./lib/orion_static'),
    orionTasks = require('./lib/tasks'),
    orionSearch = require('./lib/search'),
    expressSession = require('express-session'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    fs = require('fs'),
    term = require('term.js');

var LIBS = path.normalize(path.join(__dirname, 'lib/')),
    ORION_CLIENT = path.normalize(path.join(__dirname, '../../'));

function handleError(err) {
	throw err;
}

function startServer(options) {
	options = options || {};
	options.maxAge = typeof options.maxAge === "number" ? options.maxAge : undefined;
	var workspaceDir = options.workspaceDir;
	try {
		passport.use(new LocalStrategy(
			function(username, password, done) {
				fs.readFile(path.join(workspaceDir, username, "user.json"), function (error, data) {
					if (error) {
						done(null, false, "Invalid username.");
					}
					var user = JSON.parse(data);
					if (user.password === password) {
						done(null, {id: username});
					} else {
						done(null, false, "Invalid password.");
					}
				});
			}
		));
		passport.serializeUser(function(user, done) {
			done(null, user.id);
		});
		passport.deserializeUser(function(id, done) {
			done(null, {id: id, workspace: path.join("/", id, "OrionContent")});
		});

		var app = express();
		
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({ extended: false }));
		app.use(cookieParser());
		app.use(expressSession({ secret: 'keyboard cat' }));
		app.use(passport.initialize());
		app.use(passport.session());
		
//		app.use(function(req, res, next) {
//			if (!req.user) {
//				var public = [
//					"/mixloginstatic",
//					"/requirejs",
//					"/orion",
//					"/login",
//					"/server-status",
//					"/metrics",
//					"/useremailconfirmation"
//				];
//				if (req.path && req.path !== "/" && !public.some(function(p) {
//					return req.path.indexOf(p) === 0;
//				})) {
//					return res.redirect('/mixloginstatic/LoginWindow.html');
//				}

//				var public = [
//					"/edit",
//					"/git",
//					"/settings",
//					"/console",
//				];
//				if (public.some(function(p) {
//					return req.path.indexOf(p) === 0;
//				})) {
//					return res.redirect('/mixloginstatic/LoginWindow.html');
//				}
//			}
//			next(); 
//		});
		
		app.use(term.middleware());
		app.use(orionNodeStatic(path.normalize(path.join(LIBS, 'orionode.client/'))));
		app.use(orionStatic({
			orionClientRoot: ORION_CLIENT,
			maxAge: options.maxAge
		}));

		// API handlers
		app.use('/login', orionLogin());
		app.post('/logout', function(req, res){
			req.logout();
			res.end();
		});
		app.post('/login/form', passport.authenticate('local', {
			successRedirect: '/edit/edit.html',
			failureRedirect: '/mixloginstatic/LoginWindow.html'
		}));
		
		app.use(function (req, res, next) {
			if (!req.user) {
				res.writeHead(401, "Not authenticated");
				res.end();
				return;
			}
			next();
		});
		
		app.use('/task', orionTasks.orionTasksAPI({
			root: '/task'
		}));
		app.use('/file', orionFile({
			root: '/file',
			workspaceDir: workspaceDir
		}));
		app.use('/workspace', orionWorkspace({
			root: '/workspace',
			fileRoot: '/file',
			workspaceDir: workspaceDir
		}));
		app.use(orionGit({ 
			root: '/gitapi',
			fileRoot: '/file',
			workspaceDir: workspaceDir
		}));
		app.use('/filesearch', orionSearch({
			root: '/filesearch',
			fileRoot: '/file',
			workspaceDir: workspaceDir
		}));
		app.use('/prefs', orionPrefs({
			workspaceDir: workspaceDir
		}));
		return app;
	} catch (e) {
		handleError(e);
	}
}

module.exports = startServer;
