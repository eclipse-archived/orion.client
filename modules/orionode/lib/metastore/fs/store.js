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
    mkdirpAsync = Promise.promisify(require('mkdirp')),
    metaUtil = require('../util/metaUtil'),
    accessRights = require('../../accessRights'),
    os = require('os'),
    fileLocker = require('../../util/fileLocker');

// Helper functions
var FILENAME_METASTORE = "metastore.json";
var FILENAME_TASKS_TEMP_DIR = "temp";
var FILENAME_USER_METADATA = "user.json";
var KEY_ORION_DESCRIPTION = "OrionDescription";
var KEY_ORION_VERSION = "OrionVersion";
var WORKSPACE_ID = "anonymous-OrionContent";
var DEFAULT_WORKSPACE_NAME = "OrionContent";
var SERVERWORKSPACE = "${SERVERWORKSPACE}";
var DESCRIPTION_METASTORE = "This JSON file is at the root of the Orion metadata store responsible for persisting user, workspace and project files and metadata.";

// The current version of the Simple Meta Store.
var VERSION = 8;

function getUserRootLocation(options, userId) {
	return options.configParams['orion.single.user'] ? nodePath.join(options.configParams['orion.single.user.metaLocation'] || os.homedir(), '.orion') : nodePath.join.apply(null, metaUtil.readMetaUserFolder(options.workspaceDir, userId));
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

function getWorkspaceFolderName(options, workspaceId) {
	var workspaceName = metaUtil.decodeWorkspaceNameFromWorkspaceId(workspaceId);
	var userId = metaUtil.decodeUserIdFromWorkspaceId(workspaceId);
	var metadataFolder = getUserRootLocation(options, userId);
	return nodePath.join(metadataFolder, workspaceName);
}

function getProjectMetadataFileName(options, workspaceId, projectName) {
	var userId = metaUtil.decodeUserIdFromWorkspaceId(workspaceId);
	var metadataFolder = getUserRootLocation(options, userId);
	if (metaUtil.decodeWorkspaceNameFromWorkspaceId(workspaceId) !== DEFAULT_WORKSPACE_NAME) {
		projectName = workspaceId + metaUtil.getSeparator() + projectName;
	}
	return nodePath.join(metadataFolder, projectName + ".json");
}

function getTaskRootLocation(options) {
	return options.configParams['orion.file.tasks.location'] || nodePath.join(options.workspaceDir, '.metadata', '.tasks');
}

function FsMetastore(options) {
	this._options = options;
	this._taskList = {};
	this._lockMap = {};
	this._isSingleUser = options.configParams['orion.single.user'];
}

FsMetastore.prototype.lock = function(userId, shared) {
	var promise = new Promise(function(resolve, reject) {
		var locker = this._lockMap[userId];
		if (!locker) {
			var filePath;
			if (this._isSingleUser) {
				filePath = nodePath.join(this._options.configParams['orion.single.user.metaLocation'] || os.homedir(), '.orion');
			} else {
				var userPrefix = userId.substring(0, Math.min(2, userId.length));
				filePath = nodePath.join(this._options.workspaceDir, userPrefix);
				filePath = nodePath.join(filePath, userId);
			}
			filePath = nodePath.join(filePath, ".lock");
			locker = new fileLocker(filePath);
			this._lockMap[userId] = locker;
		}
		locker.lock(shared).then(resolve, reject);
	}.bind(this));
	return promise.disposer(function(releaser) {
		return releaser();
	});
};

FsMetastore.prototype.setup = function(options) {
	if (!this._isSingleUser) {
		/* verify that existing metadata in this workspace will be usable by this server */
		var path = nodePath.join(this._options.workspaceDir, FILENAME_METASTORE);
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
					mkdirpAsync(nodePath.dirname(path)).then(function(){
						fs.writeFileAsync(path, JSON.stringify(obj, null, 2)).then(
							null,
							function(error) {
								throw new Error("Failed to write the metadata file for the new workspace at: " + path, error);
							}
						);
					});
				} else {
					throw new Error("Failed to access the workspace metadata at: " + path, error);
				}
			}
		);
	}

	// Used only for single user case (Electron or local debug)
	options.authenticate = [function(req, res, next) {
		if (this._isSingleUser) {
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
	}.bind(this)];
};

Object.assign(FsMetastore.prototype, {
	
	createWorkspace: function(userId, workspaceData, callback) {
		if (!userId) {
			return callback(new Error('createWorkspace.userId is null'));
		}
		if (!workspaceData.name) {
			return callback(new Error('createWorkspace.workspaceData.name is null'));
		}

		Promise.using(this.lock(userId, false), function() {
			return new Promise(function(resolve, reject) {
				this._readUserMetadata(userId, function(error, metadata) {
					if (error) {
						return reject(error);
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
								return reject(error);
							}
							function updateUserWorkspaceAccessRight(){
								// Update workspaceIds in user's metadata only if it's new
								if(metadata["WorkspaceIds"].indexOf(workspaceId) === -1){
									metadata["WorkspaceIds"].push(workspaceId);
									var workspaceUserRights = accessRights.createWorkspaceAccess(workspaceId);
									metadata["Properties"]["UserRights"] = metadata["Properties"]["UserRights"].concat(workspaceUserRights);
									this._updateUserMetadata(userId,  metadata, function(error) {
										if (error) {
											return reject(error);
										}
										resolve(workspaceObj);
									});						
								} else {
									resolve(workspaceObj);
								}
							}
							if (this._isSingleUser) {
								updateUserWorkspaceAccessRight.call(this);
							} else {
								metaUtil.createWorkspaceDir(this._options.workspaceDir, userId, workspaceObj.id, function(error) {
									if (error) {
										return reject(error);
									}
									updateUserWorkspaceAccessRight.call(this);
								}.bind(this));
							}
						}.bind(this));
					} else {
						reject(new Error("createWorkspace could not find user with id '" + userId + "'."));
					}
				}.bind(this));
			}.bind(this));
		}.bind(this)).then(
			function(result) {
				callback(null, result);
			},
			callback /* error case */
		);
	},

	getWorkspace: function(workspaceId, callback) {
		if (workspaceId !== WORKSPACE_ID) {
			var userId = metaUtil.decodeUserIdFromWorkspaceId(workspaceId);
			Promise.using(this.lock(userId, true), function() {
				return new Promise(function(resolve, reject) {
					this._readWorkspaceMetadata(workspaceId, function(error, metadata) {
						if (error) {
							return reject(error);
						}
						if (!metadata) {
							return resolve(null);
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
						});
						return resolve(workspace);
					});
				}.bind(this));
			}.bind(this)).then(
				function(result) {
					callback(null, result);
				},
				callback /* error case */
			);
		} else {
			// TODO this should be merged into upper logic
			callback(null, {
				name: nodePath.basename(this._options.workspaceDir),
				id: WORKSPACE_ID
			});
		}
	},

	/** @callback */
	deleteWorkspace: function(workspaceId, callback) {
		var userId = metaUtil.decodeUserIdFromWorkspaceId(workspaceId);
		Promise.using(this.lock(userId, false), function() {
			return new Promise(function(resolve, reject) {
				this._readWorkspaceMetadata(workspaceId, function(error, metadata) {
					if (error) {
						return reject(error);
					}
					var projectsToDelete = metadata.ProjectNames;
					projectsToDelete.forEach(function(projectname){
						var metaFile = getProjectMetadataFileName(this._options, workspaceId, projectname);
						fs.unlinkAsync(metaFile).catchReturn({ code: 'ENOENT' }, null);
					}.bind(this));
					this._readUserMetadata(userId, function(error, metadata) {
						if (error) {
							return reject(error);
						}
						var index = -1;
						if (metadata && metadata.WorkspaceIds) {
							index = metadata.WorkspaceIds.indexOf(workspaceId);
						}
						index !== -1 && metadata.WorkspaceIds.splice(index, 1);
						metadata.Properties["UserRights"] = accessRights.removeWorkspaceAccess(metadata.Properties["UserRights"],workspaceId);
						this._updateUserMetadata(userId,  metadata, function(error) {
							if (error) {
								return reject(error);
							}
							fs.unlinkAsync(getWorkspaceMetadataFileName(this._options, workspaceId)).catchReturn({ code: 'ENOENT' }, null)
							.then(resolve, reject);
						}.bind(this));				
					}.bind(this));
				}.bind(this));
			}.bind(this));
		}.bind(this)).then(
			function(result) {
				callback(null, result);
			},
			callback /* error case */
		);
	},

	getWorkspaceDir: function(workspaceId) {
		if (workspaceId !== WORKSPACE_ID) {
			var userId = metaUtil.decodeUserIdFromWorkspaceId(workspaceId);
			return nodePath.join.apply(null, metaUtil.getWorkspacePath(this._options.workspaceDir, workspaceId, userId));	
		}
		return this._options.workspaceDir;
	},
	
	/**
	 * update workspace data, which is the properties of workspace metadata
	 */
	updateWorkspace: function(workspaceId, workspacedata, callback) {
		var userId = metaUtil.decodeUserIdFromWorkspaceId(workspaceId);
		Promise.using(this.lock(userId, false), function() {
			return new Promise(function(resolve, reject) {
				this._readWorkspaceMetadata(workspaceId, function(error, metadata) {
					if (error) {
						return reject(error);
					}
					metadata.Properties = workspacedata.properties;
					this._updateWorkspaceMetadata(workspaceId, metadata, function(error) {
						if (error) {
							return reject(error);
						}
						resolve();
					});
				}.bind(this));
			}.bind(this));
		}.bind(this)).then(
			function(result) {
				callback(null, result);
			},
			callback /* error case */
		);
	},
	
	/**
	 * @private
	 * Helper method to read the whole workspace metadata
	 */
	_readWorkspaceMetadata: function(workspaceId, callback) {
		var metadataFile = getWorkspaceMetadataFileName(this._options, workspaceId);
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
		var metadataPath = getWorkspaceMetadataFileName(this._options, workspaceId);
		return mkdirpAsync(nodePath.dirname(metadataPath)).then( // create parent folder(s) if necessary
			function() {
				fs.writeFileAsync(metadataPath, JSON.stringify(metadata, null, 2)).then(callback, callback);
			},
			callback /* error case */
		);
	},

	createUser: function(userData, callback) {
		var metadataPath = getUserMetadataFileName(this._options, userData.username);
		Promise.using(this.lock(userData.username, false), function() {
			return new Promise(function(resolve, reject) {
				mkdirpAsync(nodePath.dirname(metadataPath)).then(
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
					 	this._updateUserMetadata(userData.username, userJson, function(error) {
							if (error) {
								return reject(error);
							}
							resolve({
								username: userData.username,
								email: userData.email,
								fullname: userData.username,
								oauth: userData.oauth,
								properties: userProperty,
								workspaces:[]
							}); // TODO successful case needs to return user data including isAuthenticated, username, email, authToken for user.js
						});
					}.bind(this),
					reject /* error case */
				);
			}.bind(this));
		}.bind(this)).then(
			function(result) {
				callback(null, result);
			},
			callback /* error case */
		);
	},

	getUser: function(id, callback) {
		Promise.using(this.lock(id, true), function() {
			return new Promise(function(resolve, reject) {
				this._readUserMetadata(id, function(error, metadata) {
					if (error) {
						return reject(error);
					}
					// TODO Check if migration is needed and migrate if so
					if (metadata) {
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
						// TODO password needs to be handled specifically since it needs to be decrypted. (referrence setProperties line 967)				
						metadataToServe.workspaces = metadata.WorkspaceIds || [];
						return resolve(metadataToServe);
					}
					resolve(); /* indicates that there was not an error and the user does not exist */
				});
			}.bind(this));
		}.bind(this)).then(
			function(result) {
				callback(null, result);
			},
			callback /* error case */
		);
	},

	/** @callback */
	updateUser: function(id, userData, callback) {
		Promise.using(this.lock(id, false), function() {
			return new Promise(function(resolve, reject) {
				this._readUserMetadata(id, function(error, metadata) {
					if (error) {
						return reject(error);
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
							return reject(error);
						}
						resolve(); // TODO needs to return user data with name, email and authToken for user.sendEmail method.
					});
				}.bind(this));
			}.bind(this));
		}.bind(this)).then(
			function(result) {
				callback(null, result);
			},
			callback /* error case */
		);
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
		var metadataFile = getUserMetadataFileName(this._options, user);
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
		var metadataFile = getUserMetadataFileName(this._options, user);
		return mkdirpAsync(nodePath.dirname(metadataFile)).then( // create parent folder(s) if necessary
			function() {
				fs.writeFileAsync(metadataFile, JSON.stringify(metadata, null, 2)).then(callback);
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
	
	createRenameDeleteProject: function(workspaceId, projectInfo) {
		if (!workspaceId) {
			return Promise.reject(new Error('workspace id is null'));
		}
		var userId = metaUtil.decodeUserIdFromWorkspaceId(workspaceId);
		return Promise.using(this.lock(userId, false), function() {
			return new Promise(function(resolve, reject) {
				this._readWorkspaceMetadata(workspaceId, function(error, metadata) {
					if (error) {
						reject(new Error("createRenameDeleteProject failed to read workspace metadata for: " + workspaceId, error));
					}
					var projectJson = {
						"OrionVersion": metadata.OrionVersion,
						"UniqueId": projectInfo.projectName,
						"WorkspaceId": workspaceId,
						"FullName": projectInfo.projectName,
						"Properties": {}
					};
					if (projectInfo.projectName){
						if (projectInfo.contentLocation.startsWith(this._options.workspaceDir)) {
							projectJson["ContentLocation"] = SERVERWORKSPACE + projectInfo.contentLocation.substr(this._options.workspaceDir.length);
						} else {
							projectJson["ContentLocation"] = projectInfo.contentLocation;
						}
						this._createProjectMetadata(workspaceId, projectInfo.projectName, projectJson, function(error) {
							if (error) {
								return reject(error);
							}
							if (projectInfo.originalPath) { // originalPath is in the format of "[ContextPath] (optional) + /file + [workspaceId] + /[originalName]/"
								deleteProjectMetafile.call(this);
							}
							if(metadata) {
								metadata.ProjectNames.indexOf(projectInfo.projectName) === -1 && metadata.ProjectNames.push(projectInfo.projectName);
								this._updateWorkspaceMetadata(workspaceId, metadata, function(error) {
									if (error) {
										reject(new Error("createRenameDeleteProject failed to write workspace metadata for: " + workspaceId, error));
									}
									resolve();
								});
							}
						}.bind(this));
					} else if (projectInfo.originalPath) {
						deleteProjectMetafile.call(this);
						this._updateWorkspaceMetadata(workspaceId, metadata, function(error) {
							if (error) {
								reject(new Error("createRenameDeleteProject failed to write workspace metadata for: " + workspaceId, error));
							}
							resolve();
						});
					} else {
						resolve(); // This shouldn't happen
					}
					function deleteProjectMetafile(){
						// Delete the old project metadata json file, and update workspace metadata Projectnames
						var segs = projectInfo.originalPath.split("/");
						var oldProjectName = projectInfo.originalPath.endsWith("/") ? segs[segs.length - 2] : segs[segs.length - 1];
						var index = metadata && metadata.ProjectNames.indexOf(oldProjectName) || -1;
						index !== -1 && metadata.ProjectNames.splice(index, 1);
						var metaFile = getProjectMetadataFileName(this._options, workspaceId, oldProjectName);
						fs.unlinkAsync(metaFile).catchReturn({ code: 'ENOENT' }, null);
					}
				}.bind(this));
			}.bind(this));
		}.bind(this));
	},

	/**
	 * @private
	 * Helper method to update the whole workspace metadata
	 */
	_createProjectMetadata: function(workspaceId, projectName, metadata, callback) {
		var metaFile = getProjectMetadataFileName(this._options, workspaceId, projectName);
		return mkdirpAsync(nodePath.dirname(metaFile)).then( // create parent folder(s) if necessary
			function() {
				fs.statAsync(metaFile)
				.then(function(stat){
					if (stat.isFile()) {
						var errorStatus = new Error(String("Failed to create or rename project: ").concat(projectName));
						errorStatus.code = 500;
						callback(errorStatus);
					}
				}).catch(function(){
					fs.writeFileAsync(metaFile, JSON.stringify(metadata, null, 2)).then(callback, callback);
				});
			},
			callback /* error case */
		);
	},

	getUserTasksDirectory: function(username) {
		return new Buffer(username).toString('base64');
	},

	getUserName: function(userTaskDirName) {
		return new Buffer(userTaskDirName,'base64').toString('utf8');
	},

	createTask: function(taskObj, callback) {
		if (this._isSingleUser) {
			this._taskList[taskObj.id] = taskObj;
			return callback(null);
		}

		this.updateTask(taskObj, callback);
	},

	deleteTask: function(taskMeta, callback) {
		if (this._isSingleUser) {
			delete this._taskList[taskMeta.id];
			return callback(null);
		}

		var taskRoot = nodePath.join(getTaskRootLocation(this._options), this.getUserTasksDirectory(taskMeta.username));
		var taskDir = taskMeta.keep ? taskRoot : nodePath.join(taskRoot, FILENAME_TASKS_TEMP_DIR);

		Promise.using(this.lock(taskMeta.username, false), function() {
			return new Promise(function(resolve, reject) {
				fs.statAsync(taskDir).then(
					function(stat) {
						if (stat.isDirectory()) {
					        var taskFile = nodePath.join(taskDir, taskMeta.id);
					        fs.unlinkAsync(taskFile).then(resolve, reject);
					    } else {
							resolve(); // path does not exist
						}
					},
					reject /* error case */
				);	
			});
		}).then(callback, callback /* error case */ );

	},

	getTask: function(taskMeta, callback) {
		if (this._isSingleUser) {
			return callback(null, this._taskList[taskMeta.id]);
		}

		var taskRoot = nodePath.join(getTaskRootLocation(this._options), this.getUserTasksDirectory(taskMeta.username));
		var taskDir = taskMeta.keep ? taskRoot : nodePath.join(taskRoot, FILENAME_TASKS_TEMP_DIR);
		var taskFile = nodePath.join(taskDir, taskMeta.id);

		Promise.using(this.lock(taskMeta.username, true), function() {
			return new Promise(function(resolve, reject) {
				fs.readFileAsync(taskFile, 'utf8')
					.catchReturn({ code: 'ENOENT' }, null) // New file: suppress error
					.then(
						function(metadata) {
							var parsedJson;
							try {
								parsedJson = JSON.parse(metadata);
							} catch (err) {
								parsedJson = metadata;
							}
							resolve(parsedJson);
						},
						reject /* error case */
					);
			});
		}).then(
			function(result) {
				callback(null, result);
			},
			callback /* error case */
		);
	},

	getTasksForUser: function(username, callback) {
		if (this._isSingleUser) {
			var result = [];
			Object.keys(this._taskList).forEach(function(id) {
				if (this._taskList[id].username === username) {
					result.push(this._taskList[id]);
				}
			}.bind(this));
			return callback(null, result);
		}

		// won't return temp tasks
		var taskRoot = nodePath.join(getTaskRootLocation(this._options), this.getUserTasksDirectory(username));
		
		Promise.using(this.lock(username, true), function() {
			return new Promise(function(resolve, reject) {
				return fs.readdirAsync(taskRoot).then(
					function(files) {
						var fileReadPromises = [];
						files.forEach(function(filename) {
							if (filename !== FILENAME_TASKS_TEMP_DIR && !filename.startsWith(".")) {
								fileReadPromises.push(fs.readFileAsync(nodePath.join(taskRoot, filename)).then(function(metadata) {
									var parsedJson;
									try {
										parsedJson = JSON.parse(metadata);
									} catch (err) {
										parsedJson = metadata;
									}
									parsedJson.id = filename; // id is needed for taskDelete operation
									return parsedJson;
								}));					
							}
						});
						return Promise.all(fileReadPromises).then(resolve);
					},
					reject
				);
			});
		}).then(
			function(result) {
				callback(null, result);
			},
			callback /* error case */
		);
	},

	updateTask: function(taskObj, callback) {
		if (this._isSingleUser) {
			return callback(null);
		}

		var taskRoot = nodePath.join(getTaskRootLocation(this._options), this.getUserTasksDirectory(taskObj.username));
		var taskDir = taskObj.keep ? taskRoot : nodePath.join(taskRoot, FILENAME_TASKS_TEMP_DIR);

		Promise.using(this.lock(taskObj.username, false), function() {
			return new Promise(function(resolve, reject) {
				mkdirpAsync(taskDir).then( // create parent folder(s) if necessary
					function() {
						var taskFile = nodePath.join(taskDir, taskObj.id);
						return fs.writeFileAsync(taskFile, JSON.stringify(taskObj.toJSON(taskObj, true), null, 2)).then(resolve, reject);
					},
					reject /* error case */
				);
			});
		}).then(
			function(result) {
				callback(null, result);
			},
			callback /* error case */
		);
	}
});

module.exports = function(options) {
	return new FsMetastore(options);
};
