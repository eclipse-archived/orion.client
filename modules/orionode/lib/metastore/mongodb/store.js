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
var expressSession = require('express-session'),
	mongoose = require('mongoose'),
	Promise = require('bluebird'),
	passportLocalMongooseEmail = require('passport-local-mongoose-email'),
	MongoStore = require('connect-mongo')(expressSession),
	api = require('../../api'),
	path = require('path'),
	args = require('../../args'),
	passport = require('passport'),
	log4js = require('log4js'),
	logger = log4js.getLogger("mongo-store");

mongoose.Promise = Promise;

var workspaceSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	id: {
		type: String,
		unique: true,
		required: true
	},
	properties: {
		type: mongoose.Schema.Types.Mixed
	}
});
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
	properties: {
		type: mongoose.Schema.Types.Mixed
	},
	workspaces: [
		workspaceSchema
	],
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

var taskSchema = new mongoose.Schema({
	id: {
		type: String,
		required: true,
		unique: true
	},
	username: {
		type: String,
		required: true
	},
	keep: {
		type: Boolean,
		required: true
	},
	lengthComputable: {
		type: Boolean,
		required: true
	},
	type: {
		type: String,
		required: true
	},
	loaded: Number,
	total: Number,
	message: String,
	result: mongoose.Schema.Types.Mixed,
	timestamp: Number,
	expires: Number,
	cancelable: Boolean
	// uriUnqualStrategy: String // TODO needed?
});
var orionTask = mongoose.model("orionTask", taskSchema);

// If `user` has already been fetched from DB, use it, otherwise obtain from findByUsername
function findUser(id, user, callback) {
	if (typeof user.save === 'function') {
		callback(null, user);
	} else {
		orionAccount.findByUsername(id, callback);
	}
}

var SEPARATOR = "-";

function MongoDbMetastore(options) {
	this.options = options;
	mongoose.connect('mongodb://localhost/orion_multitenant');
	api.getOrionEE().on("close-server", function() {
		logger.info("Closing MongoDB");
		if (mongoose && (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2)) {
			mongoose.disconnect();
		}
	});
}
MongoDbMetastore.prototype.setup = function(app) {
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

function encodeWorkspaceId(userId, workspaceName) {
	var workspaceId = workspaceName.replace(/ /g, "").replace(/\#/g, "").replace(/\-/g, "");
	return userId + SEPARATOR + workspaceId;
}

function decodeUserIdFromWorkspaceId(workspaceId) {
	var index = workspaceId.lastIndexOf(SEPARATOR);
	if (index === -1) return null;
	return workspaceId.substring(0, index);
}

function decodeWorkspaceNameFromWorkspaceId(workspaceId) {
	var index = workspaceId.lastIndexOf(SEPARATOR);
	if (index === -1) return null;
	return workspaceId.substring(index + 1);
}

function createWorkspaceDir(workspaceDir, userId, workspaceId, callback) {
	var workspacePath = [workspaceDir, userId.substring(0,2), userId, decodeWorkspaceNameFromWorkspaceId(workspaceId)];
	args.createDirs(workspacePath, callback);
}

Object.assign(MongoDbMetastore.prototype, {
	createWorkspace: function(userId, workspaceData, callback) {
		this.getUser(userId, function(err, user) {
			if (err) {
				return callback(err, null);
			}
			var w = {
				name: workspaceData.name,
				id: encodeWorkspaceId(userId, workspaceData.id || workspaceData.name)
			};
			user.workspaces.push(w);
			user.save(function(err) {
				if (err) {
					return callback(err, null);
				}
				createWorkspaceDir(this.options.workspaceDir, userId, w.id, function(err) {
					if (err) {
						return callback(err, null);
					}
					callback(null, w);
				});
			}.bind(this));
		}.bind(this));
	},
	getWorkspace: function(workspaceId, callback) {
		var userId = decodeUserIdFromWorkspaceId(workspaceId);
		this.getUser(userId, function(err, user) {
			if (err) {
				return callback(err, null);
			}
			var workspace;
			if (user && user.workspaces) {
				user.workspaces.some(function(w) {
					if (w.id === workspaceId) {
						workspace = w;
						return true;
					}
				});
			}
			callback(null, workspace);
		});
	},
	deleteWorkspace: function(workspaceId, callback) {
		var userId = decodeUserIdFromWorkspaceId(workspaceId);
		orionAccount.update(
		  {username: userId},
		  { $pull: {'workspaces': {id: workspaceId}}},
		  callback
		);
	},
	getWorkspaceDir: function(workspaceId) {
		var userId = decodeUserIdFromWorkspaceId(workspaceId);
		return path.join(this.options.workspaceDir, userId.substring(0,2), userId, decodeWorkspaceNameFromWorkspaceId(workspaceId));
	},
	readUserPreferences: function(userId, callback) {
		findUser(userId, userId, function(err, user) {
			if (err) {
				return callback(err);
			}
			callback(null, user.properties);
		});
	},
	updateUserPreferences: function(userId, prefs, callback) {
		findUser(userId, userId, function(err, user) {
			if (err) {
				return callback(err);
			}
			user.properties = prefs;
			user.save(callback);
		});
	},
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
			Object.assign(user, userData);

			// Setting password and authToken are special cases handled by specific methods
			if (typeof userData.password !== 'undefined') {
				user.setPassword(userData.password, function(err, user) {
					if (err) {
						return callback(err);
					}
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
	confirmEmail: function(authToken, callback) {
		orionAccount.verifyEmail(authToken, callback);
	},
	createTask: function(taskObj, callback) {
		taskObj._mongooseTask = new orionTask();
		this.updateTask(taskObj, callback);
	},
	deleteTask: function(id, callback) {
		orionTask.remove({id: id}, callback);
	},
	getTask: function(id, callback) {
		orionTask.find(
			{id: id},
			function(err, mongooseTasks) {
				if (err) {
					callback(err);
				} else {
					callback(null, mongooseTasks[0]);
				}
			});
	},
	getTasksForUser: function(username, callback) {
		orionTask.find({username: username}, callback);
	},	
	updateTask: function(taskObj, callback) {
		var mongooseTask = taskObj._mongooseTask;
		mongooseTask.id = taskObj.id;
		mongooseTask.username = taskObj.username;
		mongooseTask.keep = Boolean(taskObj.keep);
		mongooseTask.lengthComputable = Boolean(taskObj.lengthComputable);
		mongooseTask.type = taskObj.type;

		mongooseTask.loaded = taskObj.loaded;
		mongooseTask.total = taskObj.total;
		mongooseTask.message = taskObj.message;

		mongooseTask.result = taskObj.result;
		mongooseTask.timestamp = taskObj.timestamp;
		if (taskObj.expires) {
			mongooseTask.expires = taskObj.expires;
		}
		mongooseTask.cancelable = Boolean(taskObj.cancelable);
//		if (taskObj.uriUnequalStrategy) {
//			mongooseTask.uriUnequalStrategy = taskObj.uriUnequalStrategy; // TODO needed?
//		}

		mongooseTask.save(callback);
	}
});

module.exports = function(options) {
	return new MongoDbMetastore(options);
};
