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

var isWin = /^win/.test(process.platform);
var fs;
if (!isWin) {
	fs = require("fs-ext");
}
var log4js = require("log4js");
var logger = log4js.getLogger("locker");
var nodePath = require("path");
var Promise = require("bluebird");
var mkdirpAsync = Promise.promisify(require("mkdirp"));
var constants = require("constants");

var APPEND = "a+";

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
		return callback(this.lockRelease.bind(this));
	}

	if (this._sharedMode && shared && !this._queue.length) {
		/*
		 * all outstanding locks are shared, as is this one, and no
		 * exclusive lock requests are waiting, so just give it out
		 */
		this._outstandingCount++;
		return callback(this.lockRelease.bind(this));
	}

	/* there's an exclusive lock somewhere in the picture */
	callback.shared = shared;
	this._queue.push(callback);
};

ReentrantLock.prototype.lockRelease = function() {
	this._outstandingCount--;
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
		var callback = this._queue.shift();
		return callback(this.lockRelease.bind(this));
	}

	while (this._queue.length && this._queue[0].shared) {
		this._outstandingCount++;
		var callback = this._queue.shift();
		callback(this.lockRelease.bind(this));
	}
};

var FileLocker = function(pathname, options) {
	this._counter = 0;
	this._fd;
	this._lock = new ReentrantLock();
	this._locking = !isWin;
	this._exclusiveLocksOnly = options && options.configParams && options.configParams.get('orion_exclusive_locks_only') === true;
	this._pathame = pathname;
	this._inactivityTimer;
};

FileLocker.prototype.lock = function(shared) {
	if (this._exclusiveLocksOnly) {
		shared = false;
	}

	var time = Date.now();
	return new Promise(function(resolve, reject) {
		this._lock.lock(shared, function(releaser) {
			this._acquireLock(shared).then(
				function() {
					var acquireTime = Date.now();
					logger.info("get lock time=" + (acquireTime - time) + " shared=" + shared + " path=" + this._pathame + " pid=" + process.pid);
					resolve(function() {
						this._releaseLock().then(
							function() {
								logger.info("release lock time=" + (Date.now() - acquireTime) + " shared=" + shared + " path=" + this._pathame + " pid=" + process.pid);
								releaser();
							}.bind(this),
							function(error) {
								logger.error("An error occurred while releasing lock file: " + this._pathame, error);
								releaser();
							}.bind(this)
						);
					}.bind(this));
				}.bind(this),
				function(error) {
					logger.error("An error occurred while locking file: " + this._pathame, error);
					releaser();
					reject(error);
				}.bind(this)
			);
		}.bind(this));
	}.bind(this));
};

FileLocker.prototype._acquireLock = function(shared) {
	if (!this._locking) {
		return Promise.resolve();
	}
	
	if (this._inactivityTimer) {
		clearTimeout(this._inactivityTimer);
		this._inactivityTimer = null;
	}

	function acquire(resolve, reject) {
		var lock = function() {
			var startTime = Date.now();
			var doit = function() {
				fs.fcntl(this._fd, constants.F_SETLK, shared ? constants.F_RDLCK : constants.F_WRLCK, function(error) {
					if (error && error.code === "EAGAIN") {
						if (Date.now() - startTime <= 60000) { // 1 minute
							setTimeout(doit, 1);
							return;
						}
						error = new Error("Timeout locking " + error);
					}
					if (error) {
						this._closeLockFile();
						return reject(error);
					}
					resolve();
				}.bind(this));
			}.bind(this);
			doit();
		}.bind(this);

		if (!this._fd) {
			var openLockFile = function() {
				fs.open(this._pathame, APPEND, function(error, fd) {
					if (error) {
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
					this._fd = fd;
					fs.chmod(this._pathame, "600", function() {
						//ignore errors
						lock();
					});
				}.bind(this));
			}.bind(this);
			openLockFile();
		} else {
			lock();
		}
	}
	
	var result = this._pendingAcquireLock;
	if (!result) {
		if (this._counter !== 0) {
			result = Promise.resolve();
		} else {
			result = this._pendingAcquireLock = new Promise(acquire.bind(this))
			.then(function() {
				this._pendingAcquireLock = null;
			}.bind(this), function(err) {
				this._pendingAcquireLock = null;
				return Promise.reject(err);
			}.bind(this));
		} 
	}
	return result.then(function() {
		this._counter++;
	}.bind(this));
};


FileLocker.prototype._closeLockFile = function() {
	if (this._inactivityTimer) {
		clearTimeout(this._inactivityTimer);
	}
	this._inactivityTimer = setTimeout(
		function() {
			this._inactivityTimer = null;
			var fd = this._fd;
			this._fd = null;
			if (!fd) return;
			fs.close(fd, function(error) {
				if (error) {
					/* no functional impact beyond possibly leaking a fd */
					logger.warn("Failed to close an inactive lock file: " + fd, error);
				}
			});
		}.bind(this),
		TIMEOUT_INACTIVE
	);
};

FileLocker.prototype._releaseLock = function() {
	if (!this._locking || --this._counter) {
		return this._pendingReleaseLock || Promise.resolve();
	}

	return this._pendingReleaseLock || (this._pendingReleaseLock = new Promise(function(resolve, reject) {
		if (!this._fd) return;
		fs.fcntl(this._fd, constants.F_SETLK, constants.F_UNLCK, function(error) {
			this._closeLockFile();

			if (error) {
				return reject(error);
			}

			resolve();
		}.bind(this));
	}.bind(this))).then(function() {
		this._pendingReleaseLock = null;
	}.bind(this), function(err) {
		this._pendingReleaseLock = null;
		return Promise.reject(err);
	}.bind(this));
};

module.exports = FileLocker;
