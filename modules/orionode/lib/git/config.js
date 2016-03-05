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
var ini = require('ini');
var fs = require('fs');
var clone = require('./clone');
var express = require('express');
var bodyParser = require('body-parser');

module.exports = {};

module.exports.router = function(options) {
	var fileRoot = options.fileRoot;
	var workspaceDir = options.workspaceDir;
	if (!fileRoot) { throw new Error('options.root is required'); }
	if (!workspaceDir) { throw new Error('options.workspaceDir is required'); }

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
		"Location": "/gitapi/config/" + key + "/clone" + fileDir,
		"Value": [value]
	};
}

function getAConfig(req, res) {
	var key = req.params.key;
	clone.getRepo(req.urlPath)
	.then(function(repo) {
		if (repo) {
			var fileDir = api.join(fileRoot, repo.workdir().substring(workspaceDir.length + 1));
			fs.readFile(api.join(repo.path(), "config"), {encoding:'utf-8'}, function(err, config){
				config = ini.parse(config);
				val = undefined;
				findInPath(config, "", key);
				var resp = JSON.stringify(configJSON(key, val, fileDir));
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.setHeader('Content-Length', resp.length);
				res.end(resp);
			});

			function findInPath(config, prefix, key) {
				if (typeof config !== "object") {
					if (prefix === key) {
						val = config;
					}
				} else {
					for (var property in config) {
						if (config.hasOwnProperty(property)) {
							// ini gives reply as 'branch "origin"', remove the ", add period
							var path = property.split('"').join("").replace(" ", ".");
							findInPath(config[property], prefix === "" ? path : prefix + "." + path, key);
						}
					}
				}
			}
		}
		else {
			writeError(403, res);
		}
	})
	.catch(function(err) {
		writeError(404, res, err.message);
	});
}

function getConfig(req, res) {
	var filter = req.query.filter;
	clone.getRepo(req.urlPath)
	.then(function(repo) {
		if (repo) {
			var fileDir = api.join(fileRoot, repo.workdir().substring(workspaceDir.length + 1));
			fs.readFile(api.join(repo.path(), "config"), {encoding:'utf-8'}, function(err, config){
				config = ini.parse(config);
				configs = [];

				getFullPath(config, "");

				var resp = JSON.stringify({
					"Children": configs,
					"CloneLocation": "/gitapi/clone" + fileDir,
					"Location": "/gitapi/config/clone"+ fileDir,
					"Type": "Config"
				});
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.setHeader('Content-Length', resp.length);
				res.end(resp);

				function getFullPath(config, prefix) {
					if (typeof config !== "object") {
						if (!filter || prefix.indexOf(filter) !== -1) {
							configs.push(configJSON(prefix, config, fileDir));
						}
					} else {
						for (var property in config) {
							if (config.hasOwnProperty(property)) {
								// ini gives reply as 'branch "origin"', remove the ", add period
								var path = property.split('"').join("").replace(" ", ".");
								getFullPath(config[property], prefix === "" ? path : prefix + "." + path);
							}
						}
					}
				}
			});
		}
		else {
			writeError(403, res);
		}
	})
	.catch(function(err) {
		writeError(404, res, err.message);
	});
}

function setString(req, res, key, value) {
	var fileDir;
	clone.getRepo(req.urlPath)
	.then(function(repo) {
		fileDir = api.join(fileRoot, repo.workdir().substring(workspaceDir.length + 1));
		return repo.config();
	})
	.then(function(config) {
		return config.setString(key, Array.isArray(value) ? value[0] : value);
	})
	.then(function(rc) {
		var resp = JSON.stringify(configJSON(key, value, fileDir));
		res.statusCode = rc ? 400 : 201;
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Length', resp.length);
		res.end(resp);
	})
	.catch(function(err) {
		writeError(500, res, err.message);
	});
}

function postConfig(req, res) {
	setString(req, res, req.body.Key, req.body.Value);
}

function putConfig(req, res) {
	var values = req.body.Value;
	if (!values) {
		return writeError(400, res, "Config entry value must be provided");
	} else if (!Array.isArray(values)) {
		return writeError(400, res, "Config entry value must be array");
	} else if (values.length > 1) {
		// TODO implement lists once nodegit provides better multivar support
		return writeError(501, res, "Multivar config entries are not implemented");
	}
		
	setString(req, res, req.params.key, req.body.Value);
}

function deleteConfig(req, res) {
	//TODO - delete config
	setString(req, res, req.params.key, "");
}
};