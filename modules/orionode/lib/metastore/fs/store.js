/*******************************************************************************
 * Copyright (c) 2016, 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/
var
    nodePath = require('path'),
    Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    lockFile = Promise.promisifyAll(require('lockfile')),
    mkdirpAsync = Promise.promisify(require('mkdirp')),
    metaUtil = require('../util/metaUtil'),
    os = require('os');

// Helper functions
var USERPREF_FILENAME = 'user.json';
var USER_NAME = "anonymous";
var WORKSPACE_ID = "orionode";
var METASTORE_FILENAME = "metastore.json";
var DESCRIPTION = "This JSON file is at the root of the Orion metadata store responsible for persisting user, workspace and project files and metadata.";

// The current version of the Simple Meta Store.
var VERSION = 8;
function getUserRootLocation(options, userId){
	var rootLocation = options.configParams['orion.single.user'] ? nodePath.join(os.homedir(), '.orion') : nodePath.join.apply(null, metaUtil.readMetaUserFolder(options.workspaceDir, userId));
	return rootLocation;
}

function getUserPrefsFileName(options, user) {
	var userId = typeof user === "string" ? user : user.username;
	var prefFolder = getUserRootLocation(options, userId);
	return nodePath.join(prefFolder, USERPREF_FILENAME);
}

function getWorkspacePrefsFileName(options, workspaceId) {
	var userId = metaUtil.decodeUserIdFromWorkspaceId(workspaceId);
	var prefFolder = getUserRootLocation(options, userId);
	return nodePath.join(prefFolder, workspaceId + ".json");
}

function getLockfileName(prefFileName) {
	return prefFileName + '.lock';
}

// Returns a promise that can be used with Promise.using() to guarantee exclusive
// access to the prefs file.
function lock(prefFile) {
	return lockFile.lockAsync(getLockfileName(prefFile), {
		retries: 3,
		retryWait: 25,
		stale: 5000
	})
	.disposer(function() {
		return lockFile.unlockAsync(getLockfileName(prefFile))
		.catch(function(error) {
			// Rejecting here will crash the process; just warn
		});
	});
}

function FsMetastore(options) {
	this.options = options;
	this._taskList = {};
}
FsMetastore.prototype.setup = function(app) {
	//  Initialize the simple meta store.
	if(!this.options.configParams['orion.single.user'] && !this.options.configParams['orion.metastore.useMongo']){
		// check if the root metastore.json file does not exist, create a new root metastore.json file if not
		fs.readFileAsync(nodePath.join(this.options.workspaceDir, METASTORE_FILENAME),'utf8')
		.then(function(content){
			if(content.version < VERSION){
				fs.writeFileAsync(nodePath.join(this.options.workspaceDir, METASTORE_FILENAME),JSON.stringify({
					"OrionVersion": VERSION,
					"OrionDescription": DESCRIPTION
				}, null, 2));
			}else if(content.version > VERSION) {
				throw new Error("cannot run an old server (version " + VERSION + ") on metadata that is at a newer version (version " + content.version + ")");
			}
		}.bind(this)).catch(function(err){
			// TODO use err.message to make sure the error is file not exsit
			fs.writeFileAsync(nodePath.join(this.options.workspaceDir, METASTORE_FILENAME),JSON.stringify({
				"OrionVersion": VERSION,
				"OrionDescription": DESCRIPTION
			}, null, 2));
		}.bind(this));
	}
	
	// Used to only for single user case (Electron or local debug)
	app.use(/* @callback */ function(req, res, next){
		if(this.options.configParams['orion.single.user']){
			this.getUser("anonymous", function(err, user) {
				req.user = user;
				next();
			});
		}else{
			next();
		}
	}.bind(this));
};
Object.assign(FsMetastore.prototype, {
	/**
	 * @callback
	 */
	createWorkspace: function(userId, workspaceData, callback) {
		if (!userId) {callback(new Error('createWorkspace.userId is null'));}
		if (!workspaceData.name) {callback(new Error('createWorkspace.workspaceData.name is null'));}
		this.readUser(userId, function(err, user){
			var workspaceId = metaUtil.encodeWorkspaceId(userId, workspaceData.id||workspaceData.name);
			// TODO Need to lock the user when creating the workspace and updating the user.
			var w = {
				"name": workspaceData.name,
				"id": workspaceId
			};
			var wPref = {
				"FullName": workspaceData.name,
				"OrionVersion": VERSION,
				"ProjectNames":[],
				"Properties":{},
				"UniqueId":workspaceId,
				"UserId":userId
			};
			this.updateWorkspacePreferences(user.UniqueId, workspaceId, wPref, function(error){
				callback(error, w);
			});
		}.bind(this));
	},
	getWorkspace: function(workspaceId, callback) {
		if (workspaceId !== WORKSPACE_ID) {
			this.readWorkspacePreferences(workspaceId, function(err, prefs){
				var workspacePrefs = JSON.parse(prefs);
				var workspace = {
					"id": workspacePrefs.UniqueId,
					"name": workspacePrefs.FullName,
				};
				// TODO Workspace properties is where tabs info goes, implement later
				var propertyKeys = Object.keys(workspacePrefs.Properties);
				propertyKeys.forEach(function(propertyKey){
					workspace.Properties[propertyKey] = workspacePrefs.Properties[propertyKey];
					// TODO password needs to be handled specifically since it needs to be decrypted. (referrence setProperties line 967)
					// TODO handle userPropertyCache (referrence setProperties line 972)
				});
				callback(null, workspace);
			});
		}else{
			callback(null, {
				name: nodePath.basename(this.options.workspaceDir),
				id: WORKSPACE_ID
			});
		}
	},
	/**
	 * @callback
	 */
	deleteWorkspace: function(workspaceId, callback) {
		callback(new Error("Not implemented"));
	},
	getWorkspaceDir: function(workspaceId) {
		if (workspaceId !== WORKSPACE_ID) {
			var userId = metaUtil.decodeUserIdFromWorkspaceId(workspaceId);
			return nodePath.join.apply(null, metaUtil.getWorkspacePath(this.options.workspaceDir, workspaceId, userId));	
		}
		return this.options.workspaceDir;
	},
	readWorkspacePreferences: function(workspaceId, callback) {
		var prefFile = getWorkspacePrefsFileName(this.options, workspaceId);
		return fs.readFileAsync(prefFile, 'utf8')
		.catchReturn({ code: 'ENOENT' }, null) // New prefs file: suppress error
		.then(function(prefs) {
			callback(null, prefs);
		});
	},
	updateWorkspacePreferences: function(workspaceId, prefs, callback) {
		var prefFile = getWorkspacePrefsFileName(this.options, workspaceId);
		return mkdirpAsync(nodePath.dirname(prefFile)) // create parent folder(s) if necessary
		.then(function() {
			return Promise.using(lock(prefFile), function() {
				// We have the lock until the promise returned by this function fulfills.
				return fs.writeFileAsync(prefFile, prefs);
			})
			.then(function() {
				callback(null, null);
			});
		});
	},
	readUserPreferences: function(user, callback) {
		var prefFile = getUserPrefsFileName(this.options, user);
		return fs.readFileAsync(prefFile, 'utf8')
		.catchReturn({ code: 'ENOENT' }, null) // New prefs file: suppress error, use ENOENT to pattern match the error then return null instead
		.then(function(prefs) {
			callback(null, prefs);
		});
	},
	updateUserPreferences: function(user, prefs, callback) {
		var prefFile = getUserPrefsFileName(this.options, user);
		return mkdirpAsync(nodePath.dirname(prefFile)) // create parent folder(s) if necessary
		.then(function() {
			return Promise.using(lock(prefFile), function() {
				// We have the lock until the promise returned by this function fulfills.
				return fs.writeFileAsync(prefFile, prefs);
			})
			.then(function() {
				callback(null, null);
			});
		});
	},
	/**
	 * @callback
	 */
	createUser: function(userData, callback) {
		var prefFile = getUserPrefsFileName(this.options, userData.username);
		return mkdirpAsync(nodePath.dirname(prefFile))
		.then(function() {
			var userProperty = {};
			userData.password && (userProperty.Password = userData.password);
			userData.oauth && (userProperty.OAuth = userData.oauth);
			userData.email && (userProperty.Email = userData.email);
			userProperty["AccountCreationTimestamp"] = Date.now();
			userProperty["UniqueId"] = userData.username;
			var userJson = {
				"OrionVersion": VERSION,
				"UniqueId": userData.username,
				"UserName": userData.username,
				"FullName": userData.fullname,
				"WorkspaceIds":[],
				"Properties": userProperty
			};
			return fs.writeFileAsync(prefFile, JSON.stringify(userJson, null, 2));
			// TODO Save User info in cache for quick referrence
		}).catch(function(err){
			if(err){
				throw new Error("could not create user: " + userData.username + ", user already exists");
			}
		});
	},
	/**
	 * @callback
	 */
	getAllUsers: function(start, rows, callback) {
		this.getUser("anonymous", function(err, user) {
			callback(err, user ? [user] : user);
		});
	},
	readUser: function(userId, callback){
		this.readUserPreferences(userId, function(err, prefs){
			if(prefs){
				var userPrefs = JSON.parse(prefs);
				var userInfo;
				// TODO Check if migration is needed and migrate if so
				if(false /** Migragion needed */){
	//				userPrefs = migratedUserPrefs
				}
				userInfo = {
					"UniqueId": userPrefs.UniqueId,
					"username": userPrefs.UserName,
					"FullName": userPrefs.FullName || "Unnamed User",
					"Properties": {}
				}; // TODO Translation between Java user.json is needed
				userPrefs.WorkspaceIds && (userInfo.workspaces = userPrefs.WorkspaceIds.map(function(workspaceId){
					return {
						name: metaUtil.decodeWorkspaceNameFromWorkspaceId(workspaceId),
						id: workspaceId
					};
				}));
				var propertieKeys = Object.keys(userPrefs.Properties);
				propertieKeys.forEach(function(propertyKey){
					userInfo.Properties[propertyKey] = userPrefs.Properties[propertyKey];
					// TODO password needs to be handled specifically since it needs to be decrypted. (referrence setProperties line 967)
					// TODO handle userPropertyCache (referrence setProperties line 972)
				});
				callback(null, userInfo);
			}else{
				callback(null, null);
			}
		});
	},
	getUser: function(id, callback) {
		if (id !== USER_NAME) {
			this.readUser(id, function(err, user){
				return callback(null, user);
			});
		}else{
			callback(null, {
				username: USER_NAME, 
				workspaces: [
					{
						name: nodePath.basename(this.options.workspaceDir),
						id: WORKSPACE_ID
					}
				],
				workspaceDir: this.options.workspaceDir
			});
		}
	},
	/**
	 * @callback
	 */
	getUserByEmail: function(email, callback) {
		callback(new Error("Not implemented"));
	},
	/**
	 * @callback
	 */
	getUserByOAuth: function(oauth, callback) {
		callback(new Error("Not implemented"));
	},
	/**
	 * @callback
	 */
	updateUser: function(id, userData, callback) {
		callback(null, userData);
	},
	/**
	 * @callback
	 */
	deleteUser: function(id, callback) {
		callback(new Error("Not implemented"));
	},
	/**
	 * @callback
	 */
	confirmEmail: function(authToken, callback) {
		callback(new Error("Not implemented"));
	},
	createTask: function(taskObj, callback) {
		this._taskList[taskObj.id] = taskObj;
		callback(null);
	},
	deleteTask: function(id, callback) {
		delete this._taskList[id];
		callback(null);
	},
	getTask: function(id, callback) {
		callback(null, this._taskList[id]);
	},
	getTasksForUser: function(username, callback) {
		var result = [];
		Object.keys(this._taskList).forEach(function(id) {
			if (this._taskList[id].username === username) {
				result.push(this._taskList[id]);
			}
		}.bind(this));
		callback(null, result);
	},
	updateTask: function(taskObj, callback) {
		callback(null);
	},
	readPreferences: function(req, callback){
		var scope = req.url.split("/")[1];
		if(scope === "user"){
			this.readUserPreferences(req.user,function(err, prefs){
				callback(err, prefs);
			});
		}else if(scope === "workspace"){
			this.readWorkspacePreferences(req.user.workspaceId,function(err, prefs){
				callback(err, prefs);
			});
		}else if(scope === "project"){
			// TODO implement read project prefs
		}
	},
	updatePreferences: function(req, prefs, callback){
		var scope = req.url.split("/")[1];
		if(scope === "user"){
			this.updateUserPreferences(req.user, prefs, function(err, prefs){
				callback(err, prefs);
			});
		}else if(scope === "workspace"){
			this.updateWorkspacePreferences(req.user.workspaceId, prefs, function(err, prefs){
				callback(err, prefs);
			});
		}else if(scope === "project"){
			// TODO implement update project prefs
		}
	}
});

module.exports = function(options) {
	return new FsMetastore(options);
};
