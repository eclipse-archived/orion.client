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
var
    nodePath = require('path'),
    Promise = require('bluebird'),
    Debug = require('debug'),
    fs = Promise.promisifyAll(require('fs')),
    lockFile = Promise.promisifyAll(require('lockfile')),
    mkdirpAsync = Promise.promisify(require('mkdirp')),
    os = require('os');
    
 var debug = Debug('orion:prefs')

// Helper functions
var PREF_FILENAME = 'prefs.json';
var USER_NAME = "anonymous";
var WORKSPACE_ID = "orionode";
function getPrefsFileName(options, user) {
	var prefFolder = options.configParams['orion.single.user'] ? os.homedir() : user.workspaceDir;
	return nodePath.join(prefFolder, '.orion', PREF_FILENAME);
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
			debug("Error unlocking pref file:", error);
		});
	});
}

function FsMetastore(options) {
	this.options = options;
	this._taskList = {};
}
FsMetastore.prototype.setup = function(app) {
	app.use(/* @callback */ function(req, res, next){
		this.getUser("anonymous", function(err, user) {
			req.user = user;
			next();
		});
	}.bind(this));
};
Object.assign(FsMetastore.prototype, {
	createWorkspace: function(userId, workspaceData, callback) {
		callback(new Error("Not implemented"));
	},
	getWorkspace: function(workspaceId, callback) {
		if (workspaceId !== WORKSPACE_ID) {
			return callback(new Error("Not implemented"));
		}
		callback(null, {
			name: nodePath.basename(this.options.workspaceDir),
			id: WORKSPACE_ID
		});
	},
	deleteWorkspace: function(workspaceId, callback) {
		callback(new Error("Not implemented"));
	},
	getWorkspaceDir: function(workspaceId) {
		if (workspaceId !== WORKSPACE_ID) {
			throw new Error("Not implemented");
		}
		return this.options.workspaceDir;
	},
	readUserPreferences: function(userId, callback) {
		var prefFile = getPrefsFileName(this.options, userId);
		return fs.readFileAsync(prefFile, 'utf8')
		.catchReturn({ code: 'ENOENT' }, null) // New prefs file: suppress error
		.then(function(prefs) {
			callback(null, prefs);
		});
	},
	updateUserPreferences: function(userId, prefs, callback) {
		var prefFile = getPrefsFileName(this.options, userId);
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
		callback(new Error("Not implemented"));
	},
	/**
	 * @callback
	 */
	getAllUsers: function(start, rows, callback) {
		this.getUser("anonymous", function(err, user) {
			callback(err, user ? [user] : user);
		});
	},
	getUser: function(id, callback) {
		if (id !== USER_NAME) {
			return callback(new Error("Not implemented"));
		}
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
	}
});

module.exports = function(options) {
	return new FsMetastore(options);
};
