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
    accessRights = require('../../accessRights'),
    os = require('os');

// Helper functions
var FILENAME_USER_METADATA = "user.json";
var FILENAME_METASTORE = "metastore.json";
var KEY_ORION_DESCRIPTION = "OrionDescription";
var KEY_ORION_VERSION = "OrionVersion";
var WORKSPACE_ID = "anonymous-OrionContent";
var DEFAULT_WORKSPACE_NAME = "Orion Content";
var SERVERWORKSPACE = "${SERVERWORKSPACE}";
var DESCRIPTION_METASTORE = "This JSON file is at the root of the Orion metadata store responsible for persisting user, workspace and project files and metadata.";
var TEMP_TASK_DIRECTORY_NAME = "temp";

// The current version of the Simple Meta Store.
var VERSION = 8;

function getUserRootLocation(options, userId) {
	return options.configParams['orion.single.user'] ? nodePath.join(os.homedir(), '.orion') : nodePath.join.apply(null, metaUtil.readMetaUserFolder(options.workspaceDir, userId));
}

function getUserMetadataFileName(options, user) {
	var userId = typeof user === "string" ? user : user.username;
	var metadataFolder = getUserRootLocation(options, userId);
	return nodePath.join(metadataFolder, FILENAME_USER_METADATA);
}

function getWorkspaceMetadataFileName(options, workspaceId) {
	var userId = metaUtil.decodeUserIdFromWorkspaceId(workspaceId);
	var metadataFolder = getUserRootLocation(options, userId);
	return nodePath.join(metadataFolder, workspaceId + ".json");
}

function getProjectMetadataFileName(options, workspaceId, projectName) {
	var userId = metaUtil.decodeUserIdFromWorkspaceId(workspaceId);
	var metadataFolder = getUserRootLocation(options, userId);
	if (!metaUtil.decodeWorkspaceNameFromWorkspaceId(workspaceId) === DEFAULT_WORKSPACE_NAME) {
		projectName = workspaceId + metaUtil.getSeparator() + projectName;
	}
	return nodePath.join(metadataFolder, projectName + ".json");
}

function getTaskRootLocation(options) {
	return  options.configParams['orion.file.tasks.location'] ? options.configParams['orion.file.tasks.location'] : nodePath.join(options.workspaceDir, '.metadata', '.tasks');
}

function getLockfileName(filename) {
	return filename + '.lock';
}

// Returns a promise that can be used with Promise.using() to guarantee exclusive
// access to the file.
function lock(filename) {
	return lockFile.lockAsync(getLockfileName(filename), {
		retries: 3,
		retryWait: 25,
		stale: 5000
	})
	.disposer(function() {
		return lockFile.unlockAsync(getLockfileName(filename))
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
	if (!this.options.configParams['orion.single.user']) {
		/* verify that existing metadata in this workspace will be usable by this server */
		var path = nodePath.join(this.options.workspaceDir, FILENAME_METASTORE);
		fs.readFileAsync(path, 'utf8').then(
			function(content) {
				var json = JSON.parse(content);
				var metaVersion = parseInt(json[KEY_ORION_VERSION], 10);
				if (metaVersion < VERSION) {
					/* this is fine, user metadata will be migrated when they next log in */
					var obj = {};
					obj[KEY_ORION_VERSION] = VERSION;
					obj[KEY_ORION_DESCRIPTION] = DESCRIPTION_METASTORE;
					fs.writeFileAsync(path, JSON.stringify(obj, null, 2)).then(
						null,
						function(error) {
							throw new Error("Failed to update the metadata file for the workspace at: " + path, error);
						}
					);
				} else if (metaVersion > VERSION) {
					throw new Error("Cannot run an older server (metadata version " + VERSION + ") on a workspace accessed by a newer server (metadata version " + metaVersion + ")");
				} else if (isNaN(metaVersion)) {
					throw new Error("Invalid metadata version ('" + metaVersion + "') read from " + path);
				}
			},
			function(error) {
				if (error.code === "ENOENT") {
					/* brand new workspace */
					var obj = {};
					obj[KEY_ORION_VERSION] = VERSION;
					obj[KEY_ORION_DESCRIPTION] = DESCRIPTION_METASTORE;
					fs.writeFileAsync(path, JSON.stringify(obj, null, 2)).then(
						null,
						function(error) {
							throw new Error("Failed to write the metadata file for the new workspace at: " + path, error);
						}
					);
				} else {
					throw new Error("Failed to access the workspace metadata at: " + path, error);
				}
			}
		);
	}

	// Used only for single user case (Electron or local debug)
	app.use(/* @callback */ function(req, res, next) {
		if (this.options.configParams['orion.single.user']) {
			this.getUser("anonymous", function(err, user) {
				if (err) {
					throw new Error("Failed to get 'anonymous' user's metadata");
				}
				if (!user) {
					this.createUser({
						username: "anonymous",
						fullname: "anonymous",
						email: "anonymous",
						password: "default",
						properties: {}
					}, /** @callback */ function(err, user) {
						// TODO can err possibly happen in this context?
						req.user = user;
						next();
					});
				} else {
					req.user = user;
					next();
				}
			}.bind(this));
		} else {
			next();
		}
	}.bind(this));
};

Object.assign(FsMetastore.prototype, {
	
	createWorkspace: function(userId, workspaceData, callback) {
		if (!userId) {
			return callback(new Error('createWorkspace.userId is null'));
		}
		if (!workspaceData.name) {
			return callback(new Error('createWorkspace.workspaceData.name is null'));
		}

		this._readUserMetadata(userId, function(error, metadata) {
			if (error) {
				return callback(error);
			}

			if (metadata) {
				var workspaceId = metaUtil.encodeWorkspaceId(userId, workspaceData.id || workspaceData.name);
				var workspaceObj = {
					"name": workspaceData.name,
					"id": workspaceId
				};
				var data = {
					"FullName": workspaceData.name,
					"OrionVersion": VERSION,
					"ProjectNames": [],
					"Properties": {},
					"UniqueId": workspaceId,
					"UserId": userId
				};
				this._updateWorkspaceMetadata(workspaceId, data, function(error) {
					if (error) {
						return callback(error);
					}
	
					metaUtil.createWorkspaceDir(this.options.workspaceDir, userId, workspaceObj.id, function(error) {
						if (error) {
							return callback(error);
						}
	
						// TASK: to update workspaceIds in user's metadata
						metadata["WorkspaceIds"].indexOf(workspaceId) === -1 && metadata["WorkspaceIds"].push(workspaceId);
						var workspaceUserRights = accessRights.createWorkspaceAccess(workspaceId);
						metadata["Properties"]["UserRights"] = metadata["Properties"]["UserRights"].concat(workspaceUserRights);
						this._updateUserMetadata(userId,  metadata, function(error) {
							error ? callback(error) : callback(null, workspaceObj);
						});						
					}.bind(this));
				}.bind(this));
			} else {
				callback(new Error("createWorkspace could not find user with id '" + userId + "'."));
			}
		}.bind(this));
	},

	getWorkspace: function(workspaceId, callback) {
		if (workspaceId !== WORKSPACE_ID) {
			this._readWorkspaceMetadata(workspaceId, function(error, metadata) {
				if (error) {
					return callback(error);
				}

				var workspace = {
					"id": metadata.UniqueId,
					"name": metadata.FullName,
					"properties": {}
				};
				// TODO Workspace properties is where tabs info goes, implement later
				var propertyKeys = Object.keys(metadata.Properties);
				propertyKeys.forEach(function(propertyKey) {
					workspace.properties[propertyKey] = metadata.Properties[propertyKey];
					// TODO password needs to be handled specifically since it needs to be decrypted. (referrence setProperties line 967)
					// TODO handle userPropertyCache (referrence setProperties line 972)
				});
				callback(null, workspace);
			});
		} else {
			// TODO this should be merged into upper logic
			callback(null, {
				name: nodePath.basename(this.options.workspaceDir),
				id: WORKSPACE_ID
			});
		}
	},

	/** @callback */
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
	 * update workspace data, which is the properties of workspace metadata
	 */
	updateWorkspace: function(workspaceId, workspacedata, callback) {
		this._readWorkspaceMetadata(workspaceId, function(error, metadata) {
			if (error) {
				return callback(error);
			}

			metadata.Properties = workspacedata.properties;
			this._updateWorkspaceMetadata(workspaceId, metadata, function(error) {
				if (error) {
					return callback(error);
				}

				callback();
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
			.catchReturn({ code: 'ENOENT' }, null) // New file: suppress error
			.then(
				function(metadata) {
					var parsedJson;
					try {
						parsedJson = JSON.parse(metadata);
					} catch(err) {
						parsedJson = metadata;
					}
					callback(null, parsedJson);
				},
				callback /* error case */
			);
	},

	/**
	 * @private
	 * Helper method to update the whole workspace metadata
	 */
	_updateWorkspaceMetadata: function(workspaceId, metadata, callback) {
		var metadataPath = getWorkspaceMetadataFileName(this.options, workspaceId);
		return mkdirpAsync(nodePath.dirname(metadataPath)).then( // create parent folder(s) if necessary
			function() {
				return Promise.using(lock(metadataPath), function() {
					// We have the lock until the promise returned by this function fulfills.
					return fs.writeFileAsync(metadataPath, JSON.stringify(metadata, null, 2));
				}).then(
					callback,
					callback /* error case */
				);
			},
			callback /* error case */
		);
	},

	createUser: function(userData, callback) {
		var metadataPath = getUserMetadataFileName(this.options, userData.username);
		return mkdirpAsync(nodePath.dirname(metadataPath)).then(
			function() {
				var userProperty = {};
	//			userData.password && (userProperty.Password = userData.password); //TODO password need to be pbewithmd5anddes encrypted
				userData.oauth && (userProperty.OAuth = userData.oauth);
				userData.email && (userProperty.Email = userData.email);
				userProperty["AccountCreationTimestamp"] = Date.now();
				userProperty["UniqueId"] = userData.username;
				
				// give the user access to their own user profile
				userProperty["UserRights"] = accessRights.createUserAccess(userData.username);
				userProperty["UserRightsVersion"] = accessRights.getCurrentVersion();
				var userJson = {
					"OrionVersion": VERSION,
					"UniqueId": userData.username,
					"UserName": userData.username,
					"FullName": userData.fullname,
					"WorkspaceIds":[],
					"Properties": userProperty
				};
			 	return this._updateUserMetadata(userData.username, userJson, function(error) {
					error ? callback(error) : callback(); // TODO successful case needs to return user data including isAuthenticated, username, email, authToken for user.js
				});
				// TODO Save User info in cache for quick referrence
			}.bind(this),
			callback /* error case */
		);
	},

	getUser: function(id, callback) {
		function serverUserMetadata(metadata) {
			var metadataToServe = {
				username: metadata.UserName,
				email: metadata.Properties.Email,
				fullname: metadata.FullName,
				oauth: metadata.Properties.OAuth,
				properties: metadata.Properties,
				login_timestamp: new Date(parseInt(metadata.Properties.LastLoginTimestamp, 10)),
				disk_usage: metadata.Properties.DiskUsage,
				disk_usage_timestamp: new Date(parseInt(metadata.Properties.DiskUsageTimestamp, 10)),
				created_at:  new Date(parseInt(metadata.Properties.AccountCreationTimestamp, 10))
			};
			metadata.WorkspaceIds && (metadataToServe.workspaces = metadata.WorkspaceIds.map(
				function(workspaceId) {
					return {
						name: metaUtil.decodeWorkspaceNameFromWorkspaceId(workspaceId),
						id: workspaceId
					};
				}
			));
			return metadataToServe;
		}

		this._readUserMetadata(id, function(error, metadata) {
			if (error) {
				return callback(error);
			}

			// TODO Check if migration is needed and migrate if so
			if (metadata) {
				var metadataToServe = serverUserMetadata(metadata);
				// TODO password needs to be handled specifically since it needs to be decrypted. (referrence setProperties line 967)				
				// TODO handle userPropertyCache (referrence setProperties line 972)
				callback(null,  metadataToServe);
			} else {
				callback(); /* indicates that there was not an error and the user does not exist */
			}
		});
	},
	
	/** @callback */
	updateUser: function(id, userData, callback) {
		this._readUserMetadata(id, function(error, metadata) {
			if (error) {
				return callback(error);
			}
			
			// userData.properties contains all the properties, not only the ones that are changed, 
			// because of locking, it's safe to say the properties hasn't been changed by other operations
			metadata.Properties = userData.properties;
			// update other userData 
			userData.fullname && (metadata.FullName = userData.fullname);
			userData.password && (metadata.Properties.Password = userData.password);  // TODO need to encrypt password
			userData.email && (metadata.Properties.Email = userData.email);
			userData.login_timestamp && (metadata.Properties.LastLoginTimestamp = userData.login_timestamp.getTime());
			userData.username && (metadata.UserName = userData.username);

			// TODO update isAuthenticated

			this._updateUserMetadata(id, metadata, function(error) {
				if (error) {
					return callback(error);
				}
				callback(); // TODO needs to return user data with name, email and authToken for user.sendEmail method.
			});
		}.bind(this));
	},

	/** @callback */
	deleteUser: function(id, callback) {
		callback(new Error("Not implemented"));
	},
	
	/**
	 * @private
	 * Helper method to read the whole user metadata
	 */
	_readUserMetadata: function(user, callback) {
		var metadataFile = getUserMetadataFileName(this.options, user);
		return fs.readFileAsync(metadataFile, 'utf8')
			.catchReturn({ code: 'ENOENT' }, null) // New file: suppress error, use ENOENT to pattern match the error then return null instead
			.then(
				function(metadata) {
					var parsedJson;
					try {
						parsedJson = JSON.parse(metadata);
					} catch(err) {
						parsedJson = metadata;
					}
					callback(null, parsedJson);
				},
				callback /* error case */
			);
	},
	
	/**
	 * @private
	 * Helper method to read the whole user metadata
	 */
	_updateUserMetadata: function(user, metadata, callback) {
		var metadataFile = getUserMetadataFileName(this.options, user);
		return mkdirpAsync(nodePath.dirname(metadataFile)).then( // create parent folder(s) if necessary
			function() {
				return Promise.using(lock(metadataFile), function() {
					// We have the lock until the promise returned by this function fulfills.
					return fs.writeFileAsync(metadataFile, JSON.stringify(metadata, null, 2));
				}).then(callback);
			},
			callback /* error case */
		);
	},

	/** @callback */
	getAllUsers: function(start, rows, callback) {
		this.getUser("anonymous", function(err, user) {
			callback(err, user ? [user] : user);
		});
	},
	
	/** @callback */
	getUserByEmail: function(email, callback) {
		callback(new Error("Not implemented"));
	},

	/** @callback */
	getUserByOAuth: function(oauth, callback) {
		callback(new Error("Not implemented"));
	},
	
	/** @callback */
	confirmEmail: function(authToken, callback) {
		callback(new Error("Not implemented"));
	},
	
	updateProject: function(workspaceId, projectInfo) {
		this._readWorkspaceMetadata(workspaceId, function(error, metadata) {
			if (error) {
				throw new Error("updateProject failed to read workspace metadata for: " + workspaceId, error);
			}
			
			if (projectInfo.originalPath) { // originalPath is in the format of "[ContextPath] (optional) + /file + [workspaceId] + /[originalName]/"
				var segs = projectInfo.originalPath.split("/");
				var oldProjectName = projectInfo.originalPath.endsWith("/") ? segs[segs.length - 2] : segs[segs.length - 1];
				var index = metadata.ProjectNames.indexOf(oldProjectName);
				index !== -1 && metadata.ProjectNames.splice(index, 1);
				this.deleteProject(workspaceId, oldProjectName);
			}
			if (projectInfo.projectName) {
				var projectJson = {
					"OrionVersion": metadata.OrionVersion,
					"UniqueId": projectInfo.projectName,
					"WorkspaceId": workspaceId,
					"FullName": projectInfo.projectName,
					"Properties": {}
				};
	
				if (projectInfo.contentLocation.startsWith(this.options.workspaceDir)) {
					projectJson["ContentLocation"] = SERVERWORKSPACE + projectInfo.contentLocation.substr(this.options.workspaceDir.length);
				} else {
					projectJson["ContentLocation"] = projectInfo.contentLocation;
				}
				metadata.ProjectNames.indexOf(projectInfo.projectName) === -1 && metadata.ProjectNames.push(projectInfo.projectName);
			}
			this._updateWorkspaceMetadata(workspaceId, metadata, function(error) {
				if (error) {
					throw new Error("updateProject failed to write workspace metadata for: " + workspaceId, error);
				}

				if (projectInfo.projectName) {
					this._updateProjectMetadata(workspaceId, projectInfo.projectName, projectJson, function(){});
				}
			}.bind(this));
		}.bind(this));
	},	
	
	deleteProject: function(workspaceId, projectName) {
		var metaFile = getProjectMetadataFileName(this.options, workspaceId, projectName);
		return fs.unlinkAsync(metaFile).catchReturn({ code: 'ENOENT' }, null); // New file: suppress error
	},
	/**
	 * @private
	 * Helper method to update the whole workspace metadata
	 */
	_updateProjectMetadata: function(workspaceId, projectName, metadata, callback) {
		var metaFile = getProjectMetadataFileName(this.options, workspaceId, projectName);
		return mkdirpAsync(nodePath.dirname(metaFile)).then( // create parent folder(s) if necessary
			function() {
				return Promise.using(lock(metaFile), function() {
					// We have the lock until the promise returned by this function fulfills.
					return fs.writeFileAsync(metaFile, JSON.stringify(metadata, null, 2));
				}).then(callback);
			},
			callback /* error case */
		);
	},
	
	getUserTasksDirectory: function(username){
		return new Buffer(username).toString('base64');
	},
	
	getUserName: function(userTaskDirName){
		return new Buffer(userTaskDirName,'base64').toString('utf8');
	},

	createTask: function(taskObj, callback) {
		if (this.options.configParams['orion.single.user']) {
			this._taskList[taskObj.id] = taskObj;
			callback(null);
		} else {
			this.updateTask(taskObj, callback);
		}
	},
	deleteTask: function(taskObj, taskMeta, callback) {
		if (this.options.configParams['orion.single.user']) {
			delete this._taskList[taskObj.id];
			callback(null);
		} else {
			var taskRoot = nodePath.join(getTaskRootLocation(this.options), this.getUserTasksDirectory(taskMeta.username));
			var taskDir = taskMeta.keep ? taskRoot : nodePath.join(taskRoot, TEMP_TASK_DIRECTORY_NAME);
			return fs.statAsync(taskDir).then(
				function(stat) {
					if(stat.isDirectory()) {
						// path does not exist
				        var taskFile = nodePath.join(taskDir, taskMeta.id);
				        return fs.unlinkAsync(taskFile)
				        .then(function(err){
				        	callback(err);
				        });
				    }else{
						callback(null)
					}
				},
				callback /* error case */
			);
		}
	},
	getTask: function(taskMeta, callback) {
		if (this.options.configParams['orion.single.user']) {
			callback(null, this._taskList[taskMeta.id]);
		} else {
			var taskRoot = nodePath.join(getTaskRootLocation(this.options), this.getUserTasksDirectory(taskMeta.username));
			var taskDir = taskMeta.keep ? taskRoot : nodePath.join(taskRoot, TEMP_TASK_DIRECTORY_NAME);
			var taskFile = nodePath.join(taskDir, taskMeta.id);
			return fs.readFileAsync(taskFile, 'utf8')
			.catchReturn({ code: 'ENOENT' }, null) // New file: suppress error
			.then(
				function(metadata) {
					var parsedJson;
					try {
						parsedJson = JSON.parse(metadata);
					} catch(err) {
						parsedJson = metadata;
					}
					callback(null, parsedJson);
				},
				callback /* error case */
			);
		}
	},
	getTasksForUser: function(username, callback) {
		if (this.options.configParams['orion.single.user']) {
			var result = [];
			Object.keys(this._taskList).forEach(function(id) {
				if (this._taskList[id].username === username) {
					result.push(this._taskList[id]);
				}
			}.bind(this));
			callback(null, result);
		} else {
			// won't return temp tasks
			var taskRoot = nodePath.join(getTaskRootLocation(this.options), this.getUserTasksDirectory(username));
			return fs.readdirAsync(taskRoot)
			.then(function(err, files){
				if (err) {
					callback(err);
				}
				var fileReadPromises;
				files.forEach(function(filename){
					if(filename !== TEMP_TASK_DIRECTORY_NAME){
						fileReadPromises.push(fs.readFileAsync(nodePath.join(taskRoot, filename)).then(function(metadata){
							var parsedJson;
							try {
								parsedJson = JSON.parse(metadata);
							} catch(err) {
								parsedJson = metadata;
							}
							parsedJson.id = filename; // TODO remove this hack maybe
							return parsedJson;
						}));					
					}
				});
				return Promise.all(fileReadPromises)
				.then(function(fileContents){
					callback(null, fileContents);
				});
			});
		}
	},
	updateTask: function(taskObj, callback) {
		if (this.options.configParams['orion.single.user']) {
			callback(null);
		} else {
			var taskRoot = nodePath.join(getTaskRootLocation(this.options), this.getUserTasksDirectory(taskObj.username));
			var taskDir = taskObj.keep ? taskRoot : nodePath.join(taskRoot, TEMP_TASK_DIRECTORY_NAME);
			return mkdirpAsync(taskDir).then( // create parent folder(s) if necessary
				function() {
					var taskFile = nodePath.join(taskDir, taskObj.id);
					return fs.writeFileAsync(taskFile, JSON.stringify(taskObj.toJSON(taskObj, true), null, 2))
					.then(function(){
						callback(null);
					}, callback);
				},
				callback /* error case */
			);
		}
	}
});

module.exports = function(options) {
	return new FsMetastore(options);
};
