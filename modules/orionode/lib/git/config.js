/*******************************************************************************
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node */
/*globals configs:true val:true*/
var api = require('../api'), writeError = api.writeError;
var git = require('nodegit');
var ini = require('ini');
var fs = require('fs');

function getAConfig(workspaceDir, fileRoot, req, res, next, rest) {
	var restOfTheUrl = rest.replace("config/", "");
	var index = restOfTheUrl.indexOf("/");
	var key = restOfTheUrl.substring(0, index);
	var repoPath = restOfTheUrl.substring(index+1).replace("clone/file/", "");
	repoPath = api.join(workspaceDir, repoPath);
	git.Repository.open(repoPath)
	.then(function(repo) {
		if (repo) {
			fs.readFile(api.join(repoPath, ".git/config"), {encoding:'utf-8'}, function(err, config){
				config = ini.parse(config);
				val = undefined;
				findInPath(config, "", key);
				var resp = JSON.stringify({
					"Key": key,
					"Location": "/gitapi/" + rest,
					"Value": val
				});
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
	var repoPath = rest.replace("config/clone/file/", "");
	var location = api.join(fileRoot, repoPath);
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
					"CloneLocation": "/gitapi/clone"+location,
					"Location": "/gitapi/config/clone"+location,
					"Type": "Config"
				});
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.setHeader('Content-Length', resp.length);
				res.end(resp);

				function getFullPath(config, prefix) {
					 if (typeof config !== "object") {
					 	configs.push({
							"CloneLocation": "/gitapi/clone" + location,
							"Location": "/gitapi/config/"+ prefix +"/clone"+location, // FIXME
							"Key": prefix,
							"Value": [config],
							"Type": "Config"
						});
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

function postConfig(workspaceDir, fileRoot, req, res, next, rest) {
	var repoPath = rest.replace("config/clone/file/", "");
	var oldPath = repoPath;
	repoPath = api.join(workspaceDir, repoPath);
	git.Repository.open(repoPath)
	.then(function(repo) {
		if (repo) {
			repo.config().then(function(config) {
				var resp = config.setString(req.body.Key, req.body.Value);
				if (resp === 0) {
					resp = JSON.stringify({
						"Key": req.body.Key,
						"Location": "/gitapi/config/"+req.body.Key+"/clone/file/"+oldPath,
						"Value": req.body.Value
					});
					res.statusCode = 201;
					res.setHeader('Content-Type', 'application/json');
					res.setHeader('Content-Length', resp.length);
					res.end(resp);
				}
				else {
					writeError(403, res);
				}
			});
		}
	});
}

function putConfig(workspaceDir, fileRoot, req, res, next, rest) {
	var restOfTheUrl = rest.replace("config/", "");
	var index = restOfTheUrl.indexOf("/");
	var key = restOfTheUrl.substring(0, index);
	var repoPath = restOfTheUrl.substring(index+1).replace("clone/file/", "");
	var oldPath = repoPath;
	repoPath = api.join(workspaceDir, repoPath);
	git.Repository.open(repoPath)
	.then(function(repo) {
		if (!repo) {
			return writeError(500, res);
		}
		var values = req.body.Value;
		if (!values) {
			return writeError(400, res, "Config entry value must be provided");
		} else if (!Array.isArray(values)) {
			return writeError(400, res, "Config entry value must be array");
		} else if (values.length > 1) {
			// TODO implement lists once nodegit provides better multivar support
			return writeError(501, res, "Multivar config entries are not implemented");
		}
		var newValue = values[0];
		return repo.config().then(function(config) {
			return config.setString(key, newValue)
			.then(function(resp) {
				if (resp !== 0 && typeof resp !== "undefined") {
					writeError(403, res);
					return;
				}
				resp = JSON.stringify({
					"Key": key,
					"Location": "/gitapi/config/"+key+"/clone/file/"+oldPath,
					"Value": req.body.Value
				});
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.setHeader('Content-Length', resp.length);
				res.end(resp);
			})
			.catch(writeError.bind(null, 500, res));
		});
	});
}

module.exports = {
	getConfig: getConfig, 
	getAConfig: getAConfig,
	putConfig: putConfig,
	postConfig: postConfig
};