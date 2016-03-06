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
var git = require('nodegit');
var api = require('../api'), writeError = api.writeError;
var express = require('express');
var bodyParser = require('body-parser');
var clone = require('./clone');

module.exports = {};

module.exports.router = function(options) {
	var fileRoot = options.fileRoot;
	var workspaceDir = options.workspaceDir;
	if (!fileRoot) { throw new Error('options.root is required'); }
	if (!workspaceDir) { throw new Error('options.workspaceDir is required'); }

	return express.Router()
	.use(bodyParser.json())
	.put('/file*', putSubmodule)
	.post('/file*', postSubmodule)
	.delete('/file*', deleteSubmodule);

function putSubmodule(req, res) {
	return clone.getRepo(req.urlPath)
	.then(function(repo) {
		return clone.foreachSubmodule(repo, req.body.Operation, false);
	})
	.then(function() {
		res.status(200).end();
	})
	.catch(function(err) {
		return writeError(400, res, err.message);
	});
}
function postSubmodule(req, res) {
	var repo, submodule, subrepo;
	return clone.getRepo(req.urlPath)
	.then(function(_repo) {
		repo = _repo;
		var url = req.body.GitUrl;
		var path = req.body.Name;
		if (!path && url) {
			if (req.body.Path) {
				path = api.join(workspaceDir, req.body.Path.slice(1)).substring(repo.workdir());
			} else if (req.body.Location) {
				//TODO make unique
				path = url.substring(url.lastIndexOf("/") + 1).replace(".git", "");
			}
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
			res.status(200).end();
		});
	}).catch(function(err) {
		writeError(400, res, err.message);
	});
}
function deleteSubmodule(req, res) {
	//TODO submodule delete
	writeError(400, res, "Not implemented");
}
};