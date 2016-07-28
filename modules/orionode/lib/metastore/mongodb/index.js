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
/*eslint-disable consistent-return*/
var expressSession = require('express-session');
var mongoose = require('mongoose');
var passportLocalMongooseEmail = require('passport-local-mongoose-email');
var MongoStore = require('connect-mongo')(expressSession);
var passport = require('passport');

var orionAccountSchema = new mongoose.Schema({
	username: {
		type: String,
		unique: true,
		required: true
	},
	email: {
		type: String,
		required: true,
		unique: true
	},
	fullname: {
		type: String
	},
	oauth: {
		type: String
	},
	workspace: {
		type: String
	},
	login_timestamp: {
		type: Date
	},
	disk_usage: {
		type: String
	},
	disk_usage_timestamp: {
		type: Date
	},
	created_at: {
		type: Date,
		"default": Date.now
	}
});
orionAccountSchema.plugin(passportLocalMongooseEmail);
var orionAccount = mongoose.model('orionAccount', orionAccountSchema);

// If `user` has already been fetched from DB, use it, otherwise obtain from findByUsername
function findUser(id, user, callback) {
	if (typeof user.save === 'function') {
		callback(null, user);
	} else {
		orionAccount.findByUsername(id, callback);
	}
}

function MongoDbMetastore() {
	mongoose.connect('mongodb://localhost/orion_multitenant');
}
MongoDbMetastore.prototype.setupPassport = function(app) {
	app.use(expressSession({
		resave: false,
		saveUninitialized: false,
		secret: 'keyboard cat',
		store: new MongoStore({ mongooseConnection: mongoose.connection })
	}));
	app.use(passport.initialize());
	app.use(passport.session());
	passport.use(orionAccount.createStrategy());
	passport.serializeUser(orionAccount.serializeUser());
	passport.deserializeUser(orionAccount.deserializeUser());
};
// Users
Object.assign(MongoDbMetastore.prototype, {
	createUser: function(userData, callback) {
		var password = userData.password;
		delete userData.password;
		orionAccount.register(new orionAccount(userData), password, function(err, user){
			if (err) {
				return callback(err);
			}
			callback(null, user);
		});
	},
	getAllUsers: function(start, rows, callback) {
		orionAccount.find({}, function(err, users) {
			if (err) {
				return callback(err);
			}
			return callback(null, users);
		});
	},
	getUser: function(id, callback) {
		orionAccount.findByUsername(id, callback);
	},
	getUserByEmail: function(email, callback) {
		orionAccount.find({ email: email }, function(err, user) {
			if (err) {
				return callback(err);
			}
			callback(null, user[0]);
		});
	},
	// returns the user with the given oauth token
	getUserByOAuth: function(oauth, callback) {
		orionAccount.find({oauth: new RegExp("^" + oauth + "$", "m")}, function(err, user) {
			if (err) {
				return callback(err);
			}
			if (user && user.length) {
				return callback(null, user[0]);
			}
			return callback(null, null);
		});
	},
	// @param userData either a plain object or an already-parsed mongoose DB object
	updateUser: function(id, userData, callback) {
		findUser(id, userData, function(err, user) {
			if (err) {
				return callback(err);
			}
			// mixin new properties
			// TODO what happens if userData has functions??
			Object.assign(user, userData);

			// Setting password and authToken are special cases handled by specific methods
			if (typeof userData.password !== 'undefined') {
				user.setPassword(userData.password, function(err, user) {
					if (err) {
						return callback(err);
					}
					//Object.assign(user, userData) // TODO
					delete userData.password;
					user.save(callback);
				});
			} else if (typeof userData.authToken !== 'undefined') {
				// NOTE this ignores the provided auth token and generates a new one internally
				userData.setAuthToken(function(err, user) {
					if (err) {
						return callback(err);
					}
					user.save(callback);
				});
			} else {
				user.save(callback);
			}
		});
	},
	deleteUser: function(id, callback) {
		orionAccount.remove({username: id}, callback);
	},
	// @param {function(err?, user)} callback
	confirmEmail: function(authToken, callback) {
		orionAccount.verifyEmail(authToken, callback);
	},
});

function Factory() {
	return new MongoDbMetastore();
}

module.exports = Factory;