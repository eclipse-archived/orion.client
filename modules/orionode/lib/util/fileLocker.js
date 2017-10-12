/*******************************************************************************
 * Copyright (c) 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/
var fs = require("fs-ext");
var log4js = require("log4js");
var logger = log4js.getLogger("server");
var nodePath = require("path");
var Promise = require("bluebird");
var mkdirpAsync = Promise.promisify(require("mkdirp"));

var APPEND = "a+";
var EXCLUSIVE = "ex";
var SHARED = "sh";
var UNLOCK = "un";

var TIMEOUT_INACTIVE = 3 * 1000; /* 3s */
if(process.env.OrionDevMode === "true" ){
	TIMEOUT_INACTIVE = 10000 * 1000;
}

var ReentrantLock = function() {
	this._queue = [];
	this._outstandingCount = 0;
	this._sharedMode = false;
};

ReentrantLock.prototype.lock = function(shared, callback) {
	if (!this._outstandingCount) {
		/* no locks are currently out there, so just give it out */
		this._sharedMode = shared;
		this._outstandingCount++;
// console.log("1_outstandingCount: " + this._outstandingCount + " shared: " + shared);
		return callback(this.lockRelease.bind(this));
	}

	if (this._sharedMode && shared && !this._queue.length) {
		/*
		 * all outstanding locks are shared, as is this one, and no
		 * exclusive lock requests are waiting, so just give it out
		 */
		this._outstandingCount++;
// console.log("2_outstandingCount: " + this._outstandingCount + " shared: " + shared);
		return callback(this.lockRelease.bind(this));
	}

	/* there's an exclusive lock somewhere in the picture */
	callback.shared = shared;
	this._queue.push(callback);
};

ReentrantLock.prototype.lockRelease = function() {
	this._outstandingCount--;
// console.log("3_outstandingCount: " + this._outstandingCount + " mode:   " + this._sharedMode);
	if (this._outstandingCount) {
		/* there are more shared locks to be returned before considering handing out new ones */
		return;
	}

	if (!this._queue.length) {
		/* nobody else waiting for a lock */
		return;
	}

	this._sharedMode = this._queue[0].shared;
	if (!this._sharedMode) {
		this._outstandingCount++;
// console.log("4_outstandingCount: " + this._outstandingCount + " mode:   " + this._sharedMode);
		var callback = this._queue.shift();
		return callback(this.lockRelease.bind(this));
	}

	while (this._queue.length && this._queue[0].shared) {
		this._outstandingCount++;
// console.log("5_outstandingCount: " + this._outstandingCount + " mode:   " + this._sharedMode);
		var callback = this._queue.shift();
		callback(this.lockRelease.bind(this));
	}
};

var FileLocker = function(pathname) {
	this._counter = 0;
	this._fd;
	this._lock = new ReentrantLock();
	this._locking = true;
	this._pathame = pathname;
	this._inactivityTimer;
};

FileLocker.prototype.lock = function(shared) {
	return new Promise(function(resolve, reject) {
		this._lock.lock(shared, function(releaser) {
			this._acquireLock(shared).then(
				function() {
					resolve(function() {
//						return new Promise(function(resolve, reject) {
							this._releaseLock().then(
								function() {
									releaser();
//									resolve();
								}
//								reject
							);
//						}.bind(this));
					}.bind(this));
				}.bind(this),
				function(error) {
// console.log("error 1");
					logger.error("An error occurred while locking file: " + this._pathame, error);
					reject(error);
				}.bind(this)
			);
		}.bind(this));
	}.bind(this));
};

FileLocker.prototype._acquireLock = function(shared) {
	return new Promise(function(resolve, reject) {
// console.log("acquireLock: " + this._counter);
		if (!this._locking || this._counter++) {
			return resolve();
		}

		var lock = function() {
			if (this._inactivityTimer) {
				clearTimeout(this._inactivityTimer);
				this._inactivityTimer = null;
			}

			fs.flock(this._fd, shared ? SHARED : EXCLUSIVE, function(error) {
				if (error) {
// console.log("error 3");
					return reject(error);
				}

// console.log("acquired");
				resolve();
			});
		}.bind(this);

		if (!this._fd) {
			var openLockFile = function() {
				fs.open(this._pathame, APPEND, function(error, fd) {
					if (error) {
// console.log("error 2");
	 					if (error.code === "ENOENT") {
	 						var dirPath = nodePath.dirname(this._pathame);
							return mkdirpAsync(dirPath).then(
								function() {
									openLockFile();
								},
								reject
							);
	 					}
						return reject(error);
					}
					
					/* verify that there were not multiple concurrent opens occurring */
					if (!this._fd) {
						this._fd = fd; /* typical case */
// console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>opened, fd set to: " + fd);
					} else {
// console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++redundant!");
						/* this is a redundant fd so close it */
						fs.close(fd, function(error) {
							/* no functional impact beyond possibly leaking a fd */
							logger.warn("Failed to close a redundant fd: " + fd, error);
						});
					}
					lock();
				}.bind(this));
			}.bind(this);
			openLockFile();
		} else {
			lock();
		}
	}.bind(this));
};

FileLocker.prototype._releaseLock = function() {
	return new Promise(function(resolve, reject) {
// console.log("releaseLock: " + this._counter);
		if (!this._locking || --this._counter) {
			return resolve();
		}

		fs.flock(this._fd, UNLOCK, function(error) {
			if (this._inactivityTimer) {
				clearTimeout(this._inactivityTimer);
			}
			this._inactivityTimer = setTimeout(
				function() {
					fs.close(this._fd, function(error) {
						if (error) {
// console.log("error 5");
							/* no functional impact beyond possibly leaking a fd */
							logger.warn("Failed to close an inactive lock file: " + this._fd, error);
						}
						this._fd = null;
// console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<closed, fd set to null");
					}.bind(this));
				}.bind(this),
				TIMEOUT_INACTIVE
			);

			if (error) {
// console.log("error 4");
				return reject(error);
			}
// console.log("released");

			resolve();
		}.bind(this));
	}.bind(this));
};

module.exports = FileLocker;
