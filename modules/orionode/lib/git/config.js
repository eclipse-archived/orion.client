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
/*eslint-env node */
/*globals configs:true val:true*/
var api = require('../api'), writeError = api.writeError;
var args = require('../args');
var clone = require('./clone');
var express = require('express');
var bodyParser = require('body-parser');
var util = require('./util');

module.exports = {};

module.exports.router = function(options) {
	var fileRoot = options.fileRoot;
	if (!fileRoot) { throw new Error('options.root is required'); }

	return express.Router()
	.use(bodyParser.json())
	.get('/clone/file*', getConfig)
	.get('/:key/clone/file*', getAConfig)
	.delete('/:key/clone/file*', deleteConfig)
	.put('/:key/clone/file*', putConfig)
	.post('/clone/file*', postConfig);

function configJSON(key, value, fileDir) {
	return {
		"Key": key,
		"CloneLocation": "/gitapi/clone" + fileDir,
		"Location": "/gitapi/config/" + util.encodeURIComponent(key) + "/clone" + fileDir,
		"Value": Array.isArray(value) ? value : [value]
	};
}

function getAConfig(req, res) {
	var key = util.decodeURIComponent(req.params.key);
	clone.getRepo(req)
	.then(function(repo) {
		var fileDir = clone.getfileDir(repo,req);
		var configFile = api.join(repo.path(), "config");
		args.readConfigFile(configFile, function(err, config) {
			if (err) {
				return writeError(400, res, err.message);
			}
			var segments = key.split(".");
			var section = segments[0];
			var name = segments[segments.length - 1];
			var value;
			if (segments.length > 2) {
				var subsection = segments.slice(1, segments.length - 1).join(".");
				value = config[section] && config[section][subsection] && config[section][subsection][name];
			} else {
				value = config[section] && config[section][name];
			}
			if (value !== undefined) {
				res.status(200).json(configJSON(key, value, fileDir));
			} else {
				writeError(404, res, "There is no config entry with key provided");
			}
		});
	})
	.catch(function(err) {
		writeError(404, res, err.message);
	});	
}

function getConfig(req, res) {
	var filter = req.query.filter;
	clone.getRepo(req)
	.then(function(repo) {
		var fileDir = clone.getfileDir(repo,req);
		var configFile = api.join(repo.path(), "config");
		args.readConfigFile(configFile, function(err, config) {
			if (err) {
				return writeError(400, res, err.message);
			}
			configs = [];

			getFullPath(config, "");

			res.status(200).json({
				"Children": configs,
				"CloneLocation": "/gitapi/clone" + fileDir,
				"Location": "/gitapi/config/clone"+ fileDir,
				"Type": "Config"
			});

			function getFullPath(config, prefix) {
				if (typeof config !== "object" || Array.isArray(config)) {
					if (!filter || prefix.indexOf(filter) !== -1) {
						configs.push(configJSON(prefix, config, fileDir));
					}
				} else {
					for (var property in config) {
						if (config.hasOwnProperty(property)) {
							getFullPath(config[property], prefix === "" ? property : prefix + "." + property);
						}
					}
				}
			}
		});
	})
	.catch(function(err) {
		writeError(404, res, err.message);
	});
}
	
function updateConfig(req, res, key, value, callback) {
	var fileDir;
	clone.getRepo(req)
	.then(function(repo) {
		fileDir = clone.getfileDir(repo,req);
		var configFile = api.join(repo.path(), "config");
		args.readConfigFile(configFile, function(err, config) {
			if (err) {
				return writeError(400, res, err.message);
			}
			var segments = key.split(".");
			var section = segments[0];
			var subsection;
			if (segments.length > 2) {
				subsection = segments.slice(1, segments.length - 1).join(".");
			}
			var name = segments[segments.length - 1];
			var result = callback(config, section, subsection, name, value);
			if (result.status === 200 || result.status === 201) {
				args.writeConfigFile(configFile, config, function(err) {
					if (err) {
						return writeError(400, res, err.message);
					}
					if (result.value) {
						var resp = configJSON(key, result.value, fileDir);
						res.setHeader("Location", resp.Location);
						res.status(result.status).json(resp);
					} else {
						res.status(result.status).end();
					}
				});
			} else {
				writeError(result.status, res);
			}
		});
	})
	.catch(function(err) {
		writeError(404, res, err.message);
	});
}

function postConfig(req, res) {
	updateConfig(req, res, req.body.Key, req.body.Value, function(config, section, subsection, name, value) {
		var bucket;
		if (!config[section]) config[section] = {};
		if (subsection) {
			if (!config[section][subsection]) config[section][subsection] = {};
			bucket = config[section][subsection];
		} else {
			bucket = config[section];
		}
		var current = bucket[name];
		if (current) {
			if (!Array.isArray(current)) current = [current];
			current.push(value);
		} else {
			current = value;
		}
		bucket[name] = current;
		return {status: 201, value: current};
	});
}

function putConfig(req, res) {
	var value = req.body.Value;
	if (!value) {
		return writeError(400, res, "Config entry value must be provided");
	}
	updateConfig(req, res, req.params.key, req.body.Value, function(config, section, subsection, name, value) {
		var bucket;
		if (!config[section]) config[section] = {};
		if (subsection) {
			if (!config[section][subsection]) config[section][subsection] = {};
			bucket = config[section][subsection];
		} else {
			bucket = config[section];
		}
		bucket[name] = value;
		return {status: 200, value: value};
	});
}

function deleteConfig(req, res) {
	updateConfig(req, res, req.params.key, null, function(config, section, subsection, name) {
		var bucket;
		if (config[section]) {
			if (subsection) {
				bucket = config[section][subsection];
			} else {
				bucket = config[section];
			}
		}
		if (bucket && bucket[name]) {
			if (req.query.index) {
				bucket[name].splice(Number(req.query.index), 1);
			} else {
				delete bucket[name];
			}
			return {status: 200};
		}
		return {status: 404};
	});
}

};
