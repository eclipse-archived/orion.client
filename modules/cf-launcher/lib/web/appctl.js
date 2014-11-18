/*******************************************************************************
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/
var express = require("express");

/**
 * Middleware to manage applications with a REST API.
 * Requires: body-parser
 * @param {ProcessManager} processManager
 * @param {String} appName Name of the user app
 */
function appman(processManager, userAppName) {
	var router = new express.Router();

	router.param("appName", function(req, res, next, name) {
		req.app = processManager.get(name);
		next();
	});

	router.all("/", function(req, res, next) {
		// Redirect requests for the root to the default app
		// Code 307 prevents clients from changing the method to GET upon following the redirect.
		res.redirect(307 /*temporary*/, userAppName);
	});

	router.route("/:appName")
	.all(function(req, res, next) {
		if (req.app)
			next();
		else res.send(404);
	})
	.get(function(req, res/*, next*/) {
		var app = req.app;
		sendApp(res, app);
	})
	.put(function(req, res/*, next*/) {
		var body = req.body, app = req.app;
		var sendUpdatedApp = function() {
			sendApp(res, processManager.get(app.name));
		};
		if (typeof body.state !== "string") {
			sendUpdatedApp();
			return;
		}
		processManager.changeState(app.name, body.state, function(err) {
			if (err) {
				senderror(res, err);
				return;
			}
			sendUpdatedApp();
		});
	});
	return router;
}

function toJSON(app) {
	return {
		name: app.name,
		label: app.label || app.name,
		state: app.state,
		tail: app.getTail() || []
	};
}

function sendApp(res, app) {
	res.json(toJSON(app));
}

function senderror(res, err) {
	res.json(500, { error: err.toString() });
}

module.exports = appman;
