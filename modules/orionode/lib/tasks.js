/*******************************************************************************
 * Copyright (c) 2012, 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/
var express = require('express');
var bodyParser = require('body-parser');
var api = require('./api'), writeError = api.writeError, writeResponse = api.writeResponse;
var crypto = require('crypto');
var log4js = require('log4js');
var logger = log4js.getLogger("tasks");

var MS_EXPIRATION = 86400 * 1000 * 7; /* 7 days */  // TODO should be settable per task by client

var taskCount = 0;
var taskStore;
var taskRoot = "/task";

function orionTasksAPI(options) {
	taskRoot = options.taskRoot;
	if (!taskRoot) { throw new Error('options.taskRoot is required'); }
	taskStore = options.options && options.options.metastore;
	if (!taskStore) { throw new Error('options.options.metastore is required'); }

	return express.Router()
	.use(bodyParser.json())
	.param('id', function(req, res, next, value) {
		req.id = value;
		next();
	})
	.get('/id/:id', function(req, res/*, next*/) {
		taskStore.getTask(req.id, function(err, task) {
			if (err) {
				return writeError(500, res, err.toString());
			}
			if (!task || task.username !== req.user.username) {
				return writeError(404, res);
			}
			writeResponse(200, res, null, toJSON(task, true));
		});
	})
	.delete('', deleteAllOperations)
	.delete('/id/:id', deleteOperation)
	.get('/temp/:id', function(req, res/*, next*/) {
		taskStore.getTask(req.id, function(err, task) {
			if (err) {
				return writeError(500, res, err.toString());
			}
			if (!task || task.username !== req.user.username) {
				return writeError(404, res);
			}
			writeResponse(200, res, null, toJSON(task, false));
		});
	})
	.delete('/temp/:id', deleteOperation)
	.get('/count', function(req, res/*, next*/) {
		writeResponse(200, res, null, {"count": taskCount});
	});
}

function Task(res, cancelable, lengthComputable, wait, keep) {
	this.timestamp = Date.now();
	this.expires = this.timestamp + MS_EXPIRATION;
	this.id = crypto.randomBytes(5).toString('hex') + this.timestamp;
	this.cancelable = Boolean(cancelable);
	this.lengthComputable = Boolean(lengthComputable);
	this.keep = Boolean(keep);
	this.total = this.loaded = 0;
	this.type = "loadstart";
	this.username = res.req.user.username;
	this.res = res;

	//TODO temporarily disabled timeout to work around client bug.
	if (true || wait === 0) {
		this.start();
	} else {
		this.timeout = setTimeout(function() {
			delete this.timeout;
			this.start();
		}.bind(this), typeof wait === "number" ? wait : 100);
	}
}
Task.prototype = {
	start: function() {
		if (!this.isRunning()) return;
		taskCount++;
		this.started = true;
		taskStore.createTask(this, function(err) {
			var res = this.res;
			if (res.finished) {
				return;
			}
			if (err) {
				writeError(500, res, err.toString());
			} else {
				var resp = JSON.stringify(toJSON(this, true));
				api.writeResponse(202, res, {
					'Content-Type': 'application/json',
					'Content-Length': resp.length
				}, resp, null, true);
			}
		}.bind(this));
	},
	done: function(result) {
		if (this.result) return;
		this.result = result;
		taskCount--;

		switch (result.Severity) {
			case "Ok":
			case "Info":
				this.type = "loadend";
				break;
			case "Error":
			case "Warning":
				this.type = "error";
				break;
			default:
				this.type = "abort";
		}
		if (!this.started) {
			if (this.timeout) {
				clearTimeout(this.timeout);
				delete this.timeout;
			}
			taskStore.updateTask(this, function(err) {
				var res = this.res;
				if (res.finished) {
					return;
				}
				if (err) {
					writeError(500, res, err.toString());
				} else {
					if (this.result.JsonData) {
						res.statusCode = this.result.HttpCode;
						var resp = JSON.stringify(api.encodeLocation(this.result.JsonData));
						api.writeResponse(this.result.HttpCode, res, {
							'Content-Type': 'application/json',
							'Content-Length': resp.length
						}, resp, null, true);
					} else if (this.type === "error") {
						api.writeError(this.result.HttpCode, res, this.result.Message || "");
					}
				}
			}.bind(this));
		} else {
			taskStore.updateTask(this, function(err) {
				if (err) {
					logger.error(err.toString());
				}
			});
		}
	},
	isRunning: function() {
		return this.type !== "error" && this.type !== "abort";
	},
	updateProgress: function(message, loaded, total) {
		if (!this.lengthComputable) return;
		this.type = "progress";
		if (typeof message === "string") this.message = message;
		if (typeof loaded === "number") this.loaded = loaded;
		if (typeof total === "number") this.total = total;
		taskStore.updateTask(this, function(err) {
			if (err) {
				logger.error(err.toString());
			}
		});
	},
};

function deleteOperation(req, res/*, next*/) {
	taskStore.getTask(req.id, function(err, task) {
		if (err) {
			return writeError(500, res, err.toString());
		}
		if (!task || task.username !== req.user.username) {
			return writeError(404, res, "Task does not exist: " + req.id);
		}
		taskStore.deleteTask(req.id, function(err) {
			if (err) {
				return writeError(500, res, err.toString());
			}
			writeResponse(200, res, null, {});
		});
	});
}

/**
 * Deletes all completed operations that the user sending the request had created.
 */
function deleteAllOperations(req, res) {
	taskStore.getTasksForUser(req.user.username, function(err, tasks) {
		if (err) {
			return writeError(500, res, err.toString());
		}
		var locations = [];
		var doneCount = 0;
		var done = function() {
			if (!tasks.length || ++doneCount === tasks.length) {
				writeResponse(200, res, null, locations);
			}
		};
		if (!tasks.length) {
			done();
			return;
		}
		tasks.forEach(function(task) {
			if (task.result) {
				taskStore.deleteTask(task.id, done); /* task is completed */
			} else {
				locations.push(toJSON(task, true).Location);
				done();
			}
		});
	});
}

function toJSON(task, isWriteLocation) {
	var result = {
		lengthComputable: task.lengthComputable,
		cancelable: task.cancelable,
		expires: task.expires,
		timestamp: task.timestamp,
		type: task.type
	};
	if (task.lengthComputable) {
		result.loaded = task.loaded;
		result.total = task.total;
		result.message = task.message;
	}
	if (task.result) {
		result.Result = task.result;
	}
	if (task.keep && isWriteLocation) {
		// Do not set location so that tasks is deleted
		result.Location = taskRoot + "/id/" + task.id;
	} else if (isWriteLocation) {
		result.Location = taskRoot + "/temp/" + task.id;
	}
	return result;
}
	
module.exports = {
	router: orionTasksAPI,
	Task: Task,
};
