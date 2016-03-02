/*******************************************************************************
 * Copyright (c) 2012 IBM Corporation and others.
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
var writeError = api.writeError;

var taskList = {};

function orionTasksAPI(options) {
	var root = options.root;
	if (!root) { throw new Error('options.root path required'); }

	return express.Router()
	.use(bodyParser.json())
	.param('id', function(req, res, next, value) {
		req.id = value;
		next();
	})
	.get('/id/:id', function(req, res/*, next*/) {
		var id = req.id;
		if (!taskList[id]) return writeError(404, res);
		res.json(taskList[id].toJSON());
	})
	.delete('/id/:id', function(req, res/*, next*/) {
		var id = req.id;
		delete taskList[id];
		res.sendStatus(200);
	});
}

function Task(res, cancelable, lengthComputable, wait) {
	this.id = Date.now();
	this.cancelable = !!cancelable;
	this.lengthComputable = !!lengthComputable;
	this.timestamp = this.id;
	this.total = this.loaded = 0;
	this.type = "loadstart";
	this.res = res;
	if (wait === 0) {
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
		this.started = true;
		taskList[this.id] = this;
		var resp = JSON.stringify(this.toJSON());
		var res = this.res;
		res.statusCode = 202;
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Length', resp.length);
		res.end(resp);
	},
	done: function(result) {
		this.result = result;
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
			var res = this.res;
			if (this.result.JsonData) {
				res.statusCode = this.result.HttpCode;
				var resp = JSON.stringify(this.result.JsonData);
				res.setHeader('Content-Type', 'application/json');
				res.setHeader('Content-Length', resp.length);
				res.end(resp);
			} else if (this.type === "error") {
				res.writeHead(this.result.HttpCode, this.result.Message || "");
				res.end();
			}
		}
		delete this.res;
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
	},
	toJSON: function() {
		var result = {
			lengthComputable: this.lengthComputable,
			cancelable: this.cancelable,
			timestamp: this.timestamp,
			type: this.type
		};
		if (this.lengthComputable) {
			result.loaded = this.loaded;
			result.total = this.total;
			result.message = this.message;
		}
		if (this.result) {
			result.Result = this.result;
		} else {
			// Do not set location so that tasks is deleted
			result.Location = "/task/id/" + this.id;
		}
		return result;
	}
};

module.exports = {
	orionTasksAPI: orionTasksAPI,
	Task: Task,
};