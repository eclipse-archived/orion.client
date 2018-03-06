/*******************************************************************************
 * Copyright (c) 2018 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
const fs = require("fs"),
	path = require("path"),
	log4js = require('log4js'),
	logger = log4js.getLogger("user-index");

const UNAME_INDEX_NAME = ".unameIndex",
	EMAIL_INDEX_NAME = ".emailIndex";

let _workspaceDir,
	unameIndex,
	emailIndex;

/**
 * Creates a new user index. It is up to the backing metastore to initialize the index prior to its use.
 * @param {string} workspaceDir The root of the server workspace
 * @since 18.0
 */
function UserIndex(workspaceDir) {
	_workspaceDir = workspaceDir;
	unameIndex = null;
	emailIndex = null;
}
module.exports = UserIndex;

Object.assign(UserIndex.prototype, {
	/**
	 * Read or create the user name and email indexes. If the indexes do not exist, or there was some problem reading them
	 * the user directories are re-scanned to ensure consistency
	 * @returns {Promise} A promise to load the caches. Rejects if the caches could not be loaded
	 */
	getUserIndex: function getUserIndex() {
		return new Promise(function(resolve, reject) {
			if(unameIndex && emailIndex) {
				return resolve();
			}
			return readIndexFiles().then(() => {
				resolve();
			}, function() { 
				resolve(createIndex(this, _workspaceDir));
			}.bind(this)) 
		}.bind(this));
	},
	/**
	 * Returns if the index is ready for use
	 * @returns true if the index has been initialized, false otherwise
	 */
	indexReady: function indexReady() {
		return unameIndex && emailIndex;
	},
	/**
	 * Looks up the user with the givem `userName` in the cache
	 * @returns {Promise} A promise that will resolve to null or the full filesystem path to query for the user metadata
	 */
	getUserByUname: function getUserByUname(userName) {
		return new Promise(function(resolve, reject) {
			if(this.indexReady()) {
				return resolve(unameIndex.get(userName));
			}
			resolve(null);
		}.bind(this));
	},
	/**
	 * Looks up the user with the givem `userEmail` in the cache
	 * @returns {Promise} A promise that will resolve to null or the full filesystem path to query for the user metadata
	 */
	getUserByEmail: function getUserByEmail(userEmail) {
		return new Promise(function(resolve, reject) {
			if(this.indexReady()) {
				const uname = emailIndex.get(userEmail);
				if(uname) {
					return resolve(unameIndex.get(uname));
				}
			}
			resolve(null);
		}.bind(this));
	},
	/**
	 * Returns all users
	 * @returns {[string]} The array of all user names
	 */
	getAllUsers: function getAllUsers() {
		return new Promise(function(resolve, reject) {
			if(this.indexReady()) {
				const users = [];
				for (const entry of unameIndex) {
					users.push(entry[0]);
				}
				return resolve(users);
			}
			resolve([]);
		}.bind(this));
	},
	/**
	 * This function is intended to be called when a metastore implementation creates a user - so that the 
	 * new user can be added to the cache while the file lock is in use
	 * @callback
	 * @param {{?}} userInfo The user information object
	 */
	createUser: function createUser(userInfo) {
		return new Promise(function(resolve, reject) {
			if(this.indexReady()) {
				let u = Object.create(null);
				u.dir = userInfo.properties.location;
				u.email = userInfo.email;
				unameIndex.set(userInfo.username, u);
				emailIndex.set(userInfo.email, userInfo.username);
				return this.flush().then(() => {
					resolve();
				});
			}
			reject(new Error("Failed to create new user in index: "+userInfo.username));
		}.bind(this));
	},
	/**
	 * This function is intended to be called when a metastore implementation deletes a user - so that the 
	 * user can be removed from the cache while the file lock is in use
	 * @callback
	 * @param {{?}} userInfo The user information object
	 */
	deleteUser: function deleteUser(userId) {
		return new Promise(function(resolve, reject) {
			if(this.indexReady()) {
				const id = unameIndex.get(userId);
				if(id) {
					emailIndex.delete(id.email);
					unameIndex.delete(userId);
					return this.flush().then(() => {
						resolve();
					});
				}
			}
			reject(new Error("Failed to delete user from index: "+userId));
		}.bind(this));
	},
	/**
	 * This function is intended to be called when a metastore implementation puts (updates) a user - so that the 
	 * caches can be updated while the file lock is in use
	 * @callback
	 * @param {{?}} userInfo The user information object
	 */
	updateUser: function updateUser(oldInfo, newInfo) {
		return new Promise(function(resolve, reject) {
			if(this.indexReady()) {
				const oldUser = unameIndex.get(oldInfo.username);
				if(oldUser) {
					unameIndex.delete(oldInfo.username);
					emailIndex.delete(oldUser.email);
				}
				let u = Object.create(null);
				u.dir = newInfo.properties.location;
				u.email = newInfo.email;
				unameIndex.set(newInfo.username, u);
				emailIndex.set(newInfo.email, newInfo.username);
				return this.flush().then(() => {
					resolve();
				});
			}
			reject(new Error("Failed to update user in index: "+oldInfo.username));
		}.bind(this));
	},
	/**
	 * Flush the current cache entries to the filesystem
	 */
	flush: function flush() {
		const p = path.join(_workspaceDir, UNAME_INDEX_NAME);
		return fs.writeFileAsync(p, JSON.stringify([...unameIndex], null, '\t')).then(() => {
			const p = path.join(_workspaceDir, EMAIL_INDEX_NAME);
			return fs.writeFileAsync(p, JSON.stringify([...emailIndex], null, '\t'));
		});
	}
});

/**
 * Try to read the index files from the workspace metadata
 * @returns {Promise} A promise to read the files. The promise is rejected if the files fail to read or fail to parse
 */
function readIndexFiles() {
	return new Promise(function(resolve, reject) {
		fs.readFile(path.join(_workspaceDir, UNAME_INDEX_NAME), "utf8", (err, contents) => {
			if(err || typeof contents !== 'string') {
				reject();
			}
			try {
				unameIndex = new Map(JSON.parse(contents));
				fs.readFile(path.join(_workspaceDir, UNAME_INDEX_NAME), "utf8", (err, contents) => {
					if(err || typeof contents !== 'string') {
						unameIndex = null; //reset it
						reject();
					}
					emailIndex = new Map(JSON.parse(contents));
					resolve();
				});
			} catch(err) {
				unameIndex = null;
				emailIndex = null;
				return reject();
			}
		});
	});
}

function createIndex(cache) {
	return fs.readdirAsync(_workspaceDir).then(dirs => {
		unameIndex = new Map();
		emailIndex = new Map();
		return Promise.all(dirs.map((f) => {
			const d = path.join(_workspaceDir, f);
			return fs.statAsync(d).then(stat => {
				if(stat.isDirectory() && !f.startsWith('.')) {
					return readUser(cache, d);
				}
			});
		}));
	}).then(() => {
		return;
	});
}

function readUser(cache, dir) {
	return fs.readdirAsync(dir).then(dirs => {
		return Promise.all(dirs.map((f) => {
			const d = path.join(dir, f);
			return fs.statAsync(d).then(stat => {
				if(stat.isDirectory()) {
					console.log("Directory: "+d);
					const ujson = path.join(d, 'user.json');
					return fs.readFileAsync(ujson).then(contents => {
						try {
							const user = JSON.parse(contents),
								u = Object.create(null);
							u.dir = d;
							if(user.Properties && user.Properties.Email) {
								u.email = user.Properties.Email;
								emailIndex.set(user.Properties.Email, user.UserName);
							}
							unameIndex.set(user.UserName, u);
							return cache.flush();
						} catch (perr) {
							//ignore, keep going
							logger.error("Failed to parse user metadata: "+ perr.message);
						}
					}, (err) => {console.log("Failed to read: "+ujson+" ERROR: "+err.message)});
				}
			});
		}));
	}).then(() => {
		return;
	});
}