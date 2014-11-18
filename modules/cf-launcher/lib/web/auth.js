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
var crypto = require("crypto"),
    internalLogger = require("../logger")("auth:spam"),
    jsDAV_Auth_Backend_AbstractDigest = require("jsDAV/lib/DAV/plugins/auth/abstractDigest"),
    sessions = require("client-sessions");

// @returns {Boolean} whether the user has been authenticated (either through client session or digest).
function isAuthenticated(req) {
	return req.authenticated;
}

function md5(str) {
	return crypto.createHash("md5").update(str).digest("hex");
}

// Adapter for jsDAV Handler API
function Handler(req) {
	this.httpRequest = req;
}
Handler.prototype.handleError = null;
Handler.prototype.getRequestBody = function(enc, stream, force, callback) {
	// TODO this is only needed for QOP_OPINT which nobody uses
	callback(new Error("#getRequestBody() not implemented"));
};

var Auth = module.exports = function(options) {
	var password = options.password,
	    realm = options.realm;

	var digestBackend = (function() {
		var MyDigest = jsDAV_Auth_Backend_AbstractDigest.extend({
			initialize: function() {
				jsDAV_Auth_Backend_AbstractDigest.initialize.call(this);
			},
			/**
			 * Gets the digest (`HA1`) for the given realm and user.
			 * @param {Function} callback Must be invoked as <tt>callback(null, digest)</tt>.
			 */
			getDigestHash: function(realm, username, callback) {
				var str = username + ":" + realm + ":" + password;
				callback(null, md5(str));
			}
		});
		return MyDigest.new();
	}());

	// Setup client-side session
	var sessionMiddleware = sessions({
		cookieName: "cfLauncherSession",
		requestKey: "session", // connect-flash requires this key to be "session"
		secret: password,
		duration: 24 * 60 * 60 * 1000,
		activeDuration: 1000 * 60 * 5,
	});

	// Auth middleware combining client-session with digest
	function authMiddleware(req, res, next) {
		// Check client session first..
		sessionMiddleware(req, res, function(err) {
			if (req.session.loggedIn) {
				// Client-side session exists
				internalLogger("Found client session");
				req.authenticated = true;
				return next();
			}
			// Fall back to digest auth
			digestBackend.authenticate(new Handler(req), realm, function(err, result) {
				if (err && err.type === "NotAuthenticated") {
					internalLogger("%s - NotAuthenticated, setting WWW-Auth header: %s", req.url, err.headers["WWW-Authenticate"]);
					res.set(err.headers);
					return next();
				}
				if (err)
					return next(err); // not sure about this
				if (result) {
					internalLogger("%s - authenticated using Digest, user: %s :)", req.url, digestBackend.getUsername());
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
	authMiddleware.digestBackend = digestBackend;

	return authMiddleware;
};
Auth.isAuthenticated = isAuthenticated;
