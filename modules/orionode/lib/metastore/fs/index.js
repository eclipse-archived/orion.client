/*******************************************************************************
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/

var expressSession = require("express-session");
var passport = require("passport");
var LocalStrategy = require("passport-local");

function FsMetastore() {
}
FsMetastore.prototype.setupPassport = function(app) {
	app.use(expressSession({
		resave: false,
		saveUninitialized: false,
		secret: 'keyboard cat',
	}));
	app.use(passport.initialize());
	app.use(passport.session());
	passport.use(new LocalStrategy(function(username, password, callback) {
		callback(null, { UserName: username })
	}));
	// TODO why do we need these
	passport.serializeUser(function(user, callback) {
		callback(null, user.UserName);
	});
	passport.deserializeUser(function(id, callback) {
		callback(null, { UserName: id });
	});
};
FsMetastore.prototype.updateUser = function(id, user, cb) {
	cb(null, user);
}

function Factory() {
	return new FsMetastore();
}

module.exports = Factory;