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
var api = require('./api');
var crypto = require('crypto');
var writeError = api.writeError;

var MS_EXPIRATION = 86400 * 1000 * 7; /* 7 days */  // TODO should be settable per task by client

var TaskStoreInMemory = function() {
	this._taskList = {};
};

TaskStoreInMemory.prototype = {
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
};

var TaskStoreMongoDB = function() {
	this._mongoose = require("mongoose");
	var taskSchema = new this._mongoose.Schema({
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
		result: this._mongoose.Schema.Types.Mixed,
		timestamp: Number,
		expires: Number,
		cancelable: Boolean
		// uriUnqualStrategy: String // TODO needed?
	});
	
	/* depends on the user module to establish the db connection */
	this._orionTask = this._mongoose.model("orionTask", taskSchema);
};

TaskStoreMongoDB.prototype = {
	createTask: function(taskObj, callback) {
		taskObj._mongooseTask = new this._orionTask();
		this.updateTask(taskObj, callback);
	},
	deleteTask: function(id, callback) {
		this._orionTask.remove({id: id}, callback);
	},
	getTask: function(id, callback) {
		this._orionTask.find(
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
		this._orionTask.find({username: username}, callback);
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
};

var taskCount = 0;
var taskStore;
var taskRoot = "/task";

function orionTasksAPI(options) {
	taskRoot = options.taskRoot;
	if (!taskRoot) { throw new Error('options.taskRoot is required'); }

	if (!taskStore) {
		if (options.singleUser) {
			taskStore = new TaskStoreInMemory();
		} else {
			taskStore = new TaskStoreMongoDB();
		}
	}

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
			res.json(toJSON(task, true));
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
			res.json(toJSON(task, false));
		});
	})
	.delete('/temp/:id', deleteOperation)
	.get('/count', function(req, res/*, next*/) {
		res.json({"count": taskCount});
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
			if (err) {
				return writeError(500, res, err.toString());
			}
			var resp = JSON.stringify(toJSON(this, true));
			this.res.statusCode = 202;
			this.res.setHeader('Content-Type', 'application/json');
			this.res.setHeader('Content-Length', resp.length);
			this.res.end(resp);
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
				if (err) {
					return writeError(500, this.res, err.toString());
				}
				if (this.result.JsonData) {
					res.statusCode = this.result.HttpCode;
					var resp = JSON.stringify(this.result.JsonData);
					this.res.setHeader('Content-Type', 'application/json');
					this.res.setHeader('Content-Length', resp.length);
					this.res.end(resp);
				} else if (this.type === "error") {
					this.res.writeHead(this.result.HttpCode, this.result.Message || "");
					this.res.end();
				}
			}.bind(this));
		} else {
			delete this.res;
			taskStore.updateTask(this, function(err) {
				if (err) {
					return writeError(500, this.res, err.toString());
				}
			}.bind(this));
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
				return writeError(500, this.res, err.toString());
			}
		}.bind(this));
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
			res.status(200).json({});
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
				res.status(200).json(locations);
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
