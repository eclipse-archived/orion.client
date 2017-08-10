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

function getUserMetadataFileName(options, user) {
	var userId = typeof user === "string" ? user : user.username;
	var prefFolder = getUserRootLocation(options, userId);
	return nodePath.join(prefFolder, USERPREF_FILENAME);
}

function getWorkspaceMetadataFileName(options, workspaceId) {
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
	
	// Workspace Metadata Related
	/**
	 * @public 
	 * @callback
	 */
	createWorkspace: function(userId, workspaceData, callback) {
		if (!userId) {callback(new Error('createWorkspace.userId is null'));}
		if (!workspaceData.name) {callback(new Error('createWorkspace.workspaceData.name is null'));}
		this._readUserMetadata(userId, function(err, metadata){
			if(metadata){
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
				this._updateWorkspaceMetadata(workspaceId, wPref, function(error){
					if(error){
						callback(error, w);
					}else{
						metaUtil.createWorkspaceDir(this.options.workspaceDir, userId, w.id, function(err) {
							if (err) {
								return callback(err, w);
							}
							// TASK: to update workspaceIds in user's metadata
							var userInfo;
							// TODO Check if migration is needed and migrate if so, modulize this task
							userInfo = { // This format is not needed for node server, it's needed to unify metadata with Java server.
								"UniqueId": metadata.UniqueId,
								"UserName": metadata.UserName,
								"FullName": metadata.FullName || "Unnamed User",
								"Properties": metadata.Properties,
								"WorkspaceIds":metadata.WorkspaceIds
							};
							userInfo["WorkspaceIds"].indexOf(workspaceId) === -1 && userInfo["WorkspaceIds"].push(workspaceId);
							this._updateUserMetadata(userId,  userInfo, function(){
								callback(null, w);
							});						
						}.bind(this));
					}
				}.bind(this));
			}else{
				callback(new Error('createWorkspace could not find user with id' + userId + ", user does not exist."));
			}
			
			
			
		}.bind(this));
	},
	getWorkspace: function(workspaceId, callback) {
		if (workspaceId !== WORKSPACE_ID) {
			this._readWorkspaceMetadata(workspaceId, function(err, metadata){
				var workspace = {
					"id": metadata.UniqueId,
					"name": metadata.FullName,
				};
				// TODO Workspace properties is where tabs info goes, implement later
				var propertyKeys = Object.keys(metadata.Properties);
				propertyKeys.forEach(function(propertyKey){
					workspace.Properties[propertyKey] = metadata.Properties[propertyKey];
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
	
	/**
	 * Read workspace preference, which is the properties of workspace metadata
	 */
	readWorkspacePreferences: function(workspaceId, callback) {
		this._readWorkspaceMetadata(workspaceId, function(err, metadata){
			callback(err, metadata && metadata.Properties);			
		});
	},
	
	/**
	 * update workspace preference, which is the properties of workspace metadata
	 */
	updateWorkspacePreferences: function(workspaceId, prefs, callback) {
		this._readWorkspaceMetadata(workspaceId, function(err, metadata){
			metadata.Properties = prefs;
			this._updateWorkspaceMetadata(workspaceId, metadata, function(){
				callback(null, null);
			});
		}.bind(this));
	},
	
	/**
	 * @private
	 * Helper method to read the whole workspace metadata
	 */
	_readWorkspaceMetadata: function(workspaceId, callback) {
		var metadataFile = getWorkspaceMetadataFileName(this.options, workspaceId);
		return fs.readFileAsync(metadataFile, 'utf8')
		.catchReturn({ code: 'ENOENT' }, null) // New prefs file: suppress error
		.then(function(metadata) {
			callback(null, JSON.parse(metadata));
		});
	},
	/**
	 * @private
	 * Helper method to update the whole workspace metadata, use updataWorkspacePreference to update metadata.Properties
	 */
	_updateWorkspaceMetadata: function(workspaceId, metadata, callback) {
		var prefFile = getWorkspaceMetadataFileName(this.options, workspaceId);
		return mkdirpAsync(nodePath.dirname(prefFile)) // create parent folder(s) if necessary
		.then(function() {
			return Promise.using(lock(prefFile), function() {
				// We have the lock until the promise returned by this function fulfills.
				return fs.writeFileAsync(prefFile, JSON.stringify(metadata, null, 2));
			})
			.then(function() {
				callback(null, null);
			});
		});
	},
	
	
	
	// User Metadata Related
	createUser: function(userData, callback) {
		var prefFile = getUserMetadataFileName(this.options, userData.username);
		return mkdirpAsync(nodePath.dirname(prefFile))
		.then(function() {
			var userProperty = {};
//			userData.password && (userProperty.Password = userData.password); //TODO password need to be pbewithmd5anddes encrypted
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
		 	this._updateUserMetadata(userData.username, userJson, function(err, prefs){});
			// TODO Save User info in cache for quick referrence
		}.bind(this)).catch(function(err){
			if(err){
				throw new Error("could not create user: " + userData.username + ", user already exists");
			}
		});
	},
	getUser: function(id, callback) {
		if (id !== USER_NAME) {
			this._readUserMetadata(id, function(err, metadata){
				if(metadata){
					var userInfo;
					// TODO Check if migration is needed and migrate if so
					if(false /** Migragion needed */){
		//				userPrefs = migratedUserPrefs
					}
					userInfo = {
						"username": metadata.UserName,
					};
					metadata.WorkspaceIds && (userInfo.workspaces = metadata.WorkspaceIds.map(function(workspaceId){
						return {
							name: metaUtil.decodeWorkspaceNameFromWorkspaceId(workspaceId),
							id: workspaceId
						};
					}));
	//				var propertieKeys = Object.keys(userPrefs.Properties);
	//				propertieKeys.forEach(function(propertyKey){
	//					userInfo.Properties[propertyKey] = userPrefs.Properties[propertyKey];
	//					// TODO password needs to be handled specifically since it needs to be decrypted. (referrence setProperties line 967)
	//					// TODO handle userPropertyCache (referrence setProperties line 972)
	//				});
					callback(null, userInfo);
				}else{
					callback(null, null);
				}
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
	deleteUser: function(id, callback) {
		callback(new Error("Not implemented"));
	},
	/**
	 * Read user preference, which is the properties of user metadata
	 */
	readUserPreferences: function(user, callback) {
		this._readUserMetadata(user, function(err, metadata){
			callback(null, metadata.Properties);
		});
	},
	
	/**
	 * update user's preference
	 */
	updateUserPreferences: function(user, prefs, callback) {
		this._readUserMetadata(user, function(err, metadata){
			metadata.Properties = prefs;
			this._updateUserMetadata(user, metadata, function(){
				callback(null, null);
			});
		}.bind(this));
	},
	
	/**
	 * @private
	 * Helper method to read the whole user metadata
	 */
	_readUserMetadata: function(user, callback) {
		var metadataFile = getUserMetadataFileName(this.options, user);
		return fs.readFileAsync(metadataFile, 'utf8')
		.catchReturn({ code: 'ENOENT' }, null) // New prefs file: suppress error, use ENOENT to pattern match the error then return null instead
		.then(function(metadata) {
			callback(null, JSON.parse(metadata));
		});
	},
	
	/**
	 * @private
	 * Helper method to read the whole user metadata
	 */
	_updateUserMetadata: function(user, metadata, callback) {
		var prefFile = getUserMetadataFileName(this.options, user);
		return mkdirpAsync(nodePath.dirname(prefFile)) // create parent folder(s) if necessary
		.then(function() {
			return Promise.using(lock(prefFile), function() {
				// We have the lock until the promise returned by this function fulfills.
				return fs.writeFileAsync(prefFile, JSON.stringify(metadata, null, 2));
			})
			.then(function() {
				callback(null, null);
			});
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
	}
});

module.exports = function(options) {
	return new FsMetastore(options);
};
