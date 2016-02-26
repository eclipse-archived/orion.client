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
var git = require('nodegit');
var ini = require('ini');
var fs = require('fs');

function configJSON(key, value, fileDir) {
	return {
		"Key": key,
		"CloneLocation": "/gitapi/clone" + fileDir,
		"Location": "/gitapi/config/" + key + "/clone" + fileDir,
		"Value": [value]
	};
}

function getAConfig(workspaceDir, fileRoot, req, res, next, rest) {
	var segments = rest.split("/");
	var key = segments[1];
	var repoPath = segments[4];
	var fileDir = api.join(fileRoot, repoPath);
	repoPath = api.join(workspaceDir, repoPath);
	git.Repository.open(repoPath)
	.then(function(repo) {
		if (repo) {
			fs.readFile(api.join(repoPath, ".git/config"), {encoding:'utf-8'}, function(err, config){
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
	});
}

function getConfig(workspaceDir, fileRoot, req, res, next, rest) {
	var segments = rest.split("/");
	var repoPath = segments[3];
	var fileDir = api.join(fileRoot, repoPath);
	repoPath = api.join(workspaceDir, repoPath);
	git.Repository.open(repoPath)
	.then(function(repo) {
		if (repo) {
			fs.readFile(api.join(repoPath, ".git/config"), {encoding:'utf-8'}, function(err, config){
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
						configs.push(configJSON(prefix, config, fileDir));
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
	});
}

function setString(repoPath, fileDir, req, res, key) {
	var value = req.body.Value;
	git.Repository.open(repoPath)
	.then(function(repo) {
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

function postConfig(workspaceDir, fileRoot, req, res, next, rest) {
	var segments = rest.split("/");
	var repoPath = segments[3];
	var fileDir = api.join(fileRoot, repoPath);
	repoPath = api.join(workspaceDir, repoPath);
	setString(repoPath, fileDir, req, res, req.body.Key);
}

function putConfig(workspaceDir, fileRoot, req, res, next, rest) {
	var segments = rest.split("/");
	var key = segments[1];
	var repoPath = segments[4];
	var fileDir = api.join(fileRoot, repoPath);
	repoPath = api.join(workspaceDir, repoPath);
	
	var values = req.body.Value;
	if (!values) {
		return writeError(400, res, "Config entry value must be provided");
	} else if (!Array.isArray(values)) {
		return writeError(400, res, "Config entry value must be array");
	} else if (values.length > 1) {
		// TODO implement lists once nodegit provides better multivar support
		return writeError(501, res, "Multivar config entries are not implemented");
	}
		
	setString(repoPath, fileDir, req, res, key);
}

module.exports = {
	getConfig: getConfig, 
	getAConfig: getAConfig,
	putConfig: putConfig,
	postConfig: postConfig
};