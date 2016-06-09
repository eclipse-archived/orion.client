/*******************************************************************************
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *		 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node */
var api = require('../api'), writeError = api.writeError;
var git = require('nodegit');
var clone = require('./clone');
var path = require('path');
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');

module.exports = {};

module.exports.router = function(options) {
	var fileRoot = options.fileRoot;
	if (!fileRoot) { throw new Error('options.root is required'); }

	return express.Router()
	.use(bodyParser.json())
	.get('/file*', getIndex)
	.put('/file*', putIndex)
	.post('/file*', postIndex);

function getIndex(req, res) {
	var repo;
	var index;
	var filePath;

	return clone.getRepo(req)
	.then(function(repoResult) {
		repo = repoResult;
		filePath = clone.getfileRelativePath(repo,req);
		return repo;
	})
	.then(function(repo) {
		return repo.refreshIndex();
	})
	.then(function(indexResult) {
		index = indexResult;
		var indexEntry = index.getByPath(filePath);
		return git.Blob.lookup(repo, indexEntry.id);
	})
	.then(function(blob) {
		res.write(blob.toString());
		res.status(200).end();
	})
	.catch(function(err) {
		writeError(404, res, err.message);
	});
}

function putIndex(req, res) {
	var index, repo;
	var filePath; 

	return clone.getRepo(req)
	.then(function(_repo) {
		repo = _repo;
		filePath = clone.getfileRelativePath(repo,req);
		return repo.refreshIndex();
	})
	.then(function(indexResult) {
		index = indexResult;
		function doPath(p) {
			if (fs.existsSync(path.join(repo.workdir(), p))) {
				return index.addByPath(p);
			}
			return index.removeByPath(p);
		}
		if (req.body.Path) {
			return Promise.all(req.body.Path.map(doPath));
		}
		return doPath(filePath);
	})
	.then(function() {
		// this will write both files to the index
		return index.write();
	})
	.then(function() {
		return index.writeTree();
	})
	.then(function() {
		res.status(200).end();
	}).catch(function(err) {
		writeError(404, res, err.message);
	});
}

function postIndex(req, res) {
	var repo;
	var resetType = req.body.Reset;
	var filePath = clone.getfileAbsolutePath(req); 
	
	return clone.getRepo(req)
	.then(function(_repo) {
		repo = _repo;
		return git.AnnotatedCommit.fromRevspec(repo, req.body.Commit || "HEAD");
	})
	.then(function(commit) {
		return repo.getCommit(commit.id());
	})
	.then(function(commit) {
		if (req.body.Path) {
			var paths = req.body.Path;
			if (typeof paths === "string") {
				paths = [paths];
			}
			return git.Reset.default(repo, commit, paths);
		} else if (resetType) {
			var reset_type = git.Reset.TYPE.HARD;
			switch (resetType) {
				case "HARD":
					reset_type = git.Reset.TYPE.HARD;
					break;
				case "MIXED":
					reset_type = git.Reset.TYPE.MIXED;
					break;
				case "SOFT":
					reset_type = git.Reset.TYPE.SOFT;
					break;
			}
			return git.Reset.reset(repo, commit, reset_type, {});
		} 
			
		return git.Reset.default(repo, commit, [filePath]);
	})
	.then(function() {
		res.status(200).end();
	}).catch(function(err) {
		writeError(404, res, err.message);
	});
}
};
