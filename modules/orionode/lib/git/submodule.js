/*******************************************************************************
 * Copyright (c) 2012, 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node */
var git = require('nodegit');
var api = require('../api'), writeError = api.writeError, writeResponse = api.writeResponse;
var args = require('../args');
var express = require('express');
var bodyParser = require('body-parser');
var clone = require('./clone');
var fileUtil = require('../fileUtil');

module.exports = {};

module.exports.router = function(options) {
	var fileRoot = options.fileRoot;
	if (!fileRoot) { throw new Error('options.fileRoot is required'); }
	
	return express.Router()
	.use(bodyParser.json())
	.put(fileRoot + '*', putSubmodule)
	.post(fileRoot + '*', postSubmodule)
	.delete(fileRoot + '*', deleteSubmodule);

function putSubmodule(req, res) {
	return clone.getRepo(req)
	.then(function(repo) {
		return clone.foreachSubmodule(repo, req.body.Operation, false);
	})
	.then(function() {
		writeResponse(200, res);
	})
	.catch(function(err) {
		return writeError(400, res, err.message);
	});
}
function postSubmodule(req, res) {
	var url = req.body.GitUrl;
	if (!url) {
		return writeError(400, res, "Invalid parameters");
	}
	
	var repo, submodule, subrepo, rest;
	return clone.getRepo(req)
	.then(function(_repo) {
		repo = _repo;
		var path = req.body.Name;
		if (!path) {
			if (req.body.Path) {
				var contextPathSegCount = req.contextPath.split("/").length - 1;
				rest = req.body.Path.split("/").slice(2 + contextPathSegCount).join("/");
				path = fileUtil.getFile(req, rest).path;
			} else if (req.body.Location) {
				path = clone.getUniqueFileName(req.file.path, url.substring(url.lastIndexOf("/") + 1).replace(".git", ""));
			}
			path = path.substring(repo.workdir().length);
		}
		return git.Submodule.addSetup(repo, url, path, 1)
		.then(function() {
			return git.Submodule.lookup(repo, path);
		})
		.then(function(_submodule) {
			submodule = _submodule;
			return submodule.open();
		})
		.then(function(_subrepo) {
			subrepo = _subrepo;
			return subrepo.fetchAll({});
		})
		.then(function() {
			return subrepo.getReferenceCommit("origin/master");
		})
		.then(function(commit) {
			var branch = "master";
			return git.Branch.create(subrepo, branch, commit, 0).then(function() {
				return subrepo.checkoutBranch(branch, {});
			});
		})
		.then(function() {
			return submodule.addFinalize();
		})
		.then(function() {
			writeResponse(200, res);
		});
	}).catch(function(err) {
		writeError(400, res, err.message);
	});
}
function deleteSubmodule(req, res) {
	var subrepo;
	return clone.getRepo(req)
	.then(function(_subrepo) {
		subrepo = _subrepo;
		var file = fileUtil.getFile(req, req.params["0"].split("/").slice(0, -1).join("/"));
		return git.Repository.discover(file.path, 0, file.workspaceDir).then(function(buf) {
			return git.Repository.open(buf.toString());
		});
	})
	.then(function(repo) {
		var submodulePath = subrepo.workdir().substring(repo.workdir().length).slice(0, -1);
		var configFile = api.join(repo.path(), "config");
		return new Promise(function(fulfill, reject) {
			args.readConfigFile(configFile, function(err, config) {
				if (err) return reject(err);
				delete config["submodule"][submodulePath];
				args.writeConfigFile(configFile, config, function(err) {
					if (err) return reject(err);
					configFile = api.join(repo.workdir(), ".gitmodules");
					args.readConfigFile(configFile, function(err, config) {
						if (err) return reject(err);
						delete config["submodule"][submodulePath];
						args.writeConfigFile(configFile, config, function(err) {
							if (err) return reject(err);
							fileUtil.rumRuff(subrepo.path(), function(err) {
								if (err) return reject(err);
								fileUtil.rumRuff(subrepo.workdir(), function(err) {
									if (err) return reject(err);
									var index;
									return repo.refreshIndex()
									.then(function(indexResult) {
										index = indexResult;
										var work = [];
										if (Object.keys(config).length) {
											work.push(index.addByPath(".gitmodules"));
										} else {
											work.push(index.removeByPath(".gitmodules"));
										}
										work.push(index.removeByPath(submodulePath));
										return Promise.all(work);
									})
									.then(function() {
										return index.write();
									})
									.then(function() {
										return index.writeTree();
									})
									.then(function() {
										fulfill();
									}).catch(function(err) {
										reject(err);
									});
								});
							});
							
						});
					});
				});
			});
		});
	})
	.then(function() {
		writeResponse(200, res);
	})
	.catch(function(err) {
		return writeError(400, res, err.message);
	});
}
};