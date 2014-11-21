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
var internalLogger = require("../logger")("auth:spam"),
    jsDAV_Auth_Backend_AbstractBasic = require("jsDAV/lib/DAV/plugins/auth/abstractBasic"),
    sessions = require("client-sessions");

// @returns {Boolean} whether the user has been authenticated (either through client session or Basic).
function isAuthenticated(req) {
	return req.authenticated;
}

/**
 * Adapter for jsDAV Handler API. The auth backends need this.
 */
function Handler(req) {
	this.httpRequest = req;
}
Handler.prototype.handleError = null;
Handler.prototype.getRequestBody = function(enc, stream, force, callback) {
	// jsDAV basic auth backend does not call this so we do not implement it
	callback(new Error("#getRequestBody() not implemented"));
};

var Auth = module.exports = function(options) {
	var password = options.password,
	    realm = options.realm;

	var basicBackend = (function() {
		var MyBasic = jsDAV_Auth_Backend_AbstractBasic.extend({
			validateUserPass: function(username, pwd, cbvalidpass) {
				cbvalidpass(pwd === password);
			},
		});
		return MyBasic.new();
	}());

	// Setup client-side session
	var sessionMiddleware = sessions({
		cookieName: "cfLauncherSession",
		requestKey: "session", // connect-flash requires this key to be "session"
		secret: password,
		duration: 24 * 60 * 60 * 1000,
		activeDuration: 1000 * 60 * 5,
	});

	// Auth middleware combining client-session with Basic
	function authMiddleware(req, res, next) {
		// Check client session first..
		sessionMiddleware(req, res, function(err) {
			if (req.session.loggedIn) {
				// Client-side session exists
				internalLogger("Found client session");
				req.authenticated = true;
				return next();
			}
			// Fall back to basic auth
			basicBackend.authenticate(new Handler(req), realm, function(err, result) {
				if (err && err.type === "NotAuthenticated") {
					// Add the auth header
					internalLogger("%s - NotAuthenticated, setting WWW-Authenticate header: %s", req.url, err.headers["WWW-Authenticate"]);
					res.set(err.headers);
					return next();
				}
				if (err)
					return next(err); // not sure about this
				if (result) {
					internalLogger("%s - authenticated user '%s' using Basic Auth :)", req.url, basicBackend.currentUser);
					req.authenticated = true;
				}
				return next();
			});
		});
	}
	authMiddleware.setClientSession = function(req, value) {
		if (value)
			req.session.loggedIn = true; // Sets the cookie
		else
			req.session.reset();
	};
	authMiddleware.backend = basicBackend;

	return authMiddleware;
};
Auth.isAuthenticated = isAuthenticated;
