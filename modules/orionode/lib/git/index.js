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

function getIndex(workspaceDir, fileRoot, req, res, next, rest) {
	var repo;
	var index;

	var segments = rest.split("/");
	var repoPath = segments[2];
	repoPath = api.join(workspaceDir, repoPath);
	var filePath = segments.slice(3).join("/");

	git.Repository.open(repoPath)
	.then(function(repoResult) {
		repo = repoResult;
		return repo;
	})
	.then(function(repo) {
		return repo.openIndex();
	})
	.then(function(indexResult) {
		index = indexResult;
		return index.read(1);
	})
	.then(function() {
		var indexEntry = index.getByPath(filePath);
		return git.Blob.lookup(repo, indexEntry.id);
	})
	.then(function(blob) {
		res.write(blob.toString());
		res.statusCode = 200;
		res.end();
	})
	.catch(function(err) {
		console.log(err);
		writeError(404, res);
	});
}

function putIndex(workspaceDir, fileRoot, req, res, next, rest) {
	var index;
	var segments = rest.split("/");
	var repoPath = segments[2];
	repoPath = api.join(workspaceDir, repoPath);
	var filePath = segments.slice(3).join("/");

	git.Repository.open(repoPath)
	.then(function(repoResult) {
		return repoResult;
	})
	.then(function(repo) {
		return repo.openIndex();
	})
	.then(function(indexResult) {
		index = indexResult;
		return index.read(1);
	})
	.then(function() {
		if (req.body.Path) {
			req.body.Path.forEach(function(path) {
				index.addByPath(path);
			});
		} else {
			return index.addByPath(filePath);
		}
	})
	.then(function() {
		// this will write both files to the index
		return index.write();
	})
	.then(function() {
		return index.writeTree();
	})
	.done(function(tree) {
		res.statusCode = 200;
		res.end();
	});
}

function postIndex(workspaceDir, fileRoot, req, res, next, rest) {
	var segments = rest.split("/");
	var repoPath = segments[2];
	repoPath = api.join(workspaceDir, repoPath);
	var filePath = segments.slice(3).join("/");
	var repo;
	var resetType = req.body.Reset;
	
	git.Repository.open(repoPath)
	.then(function(_repo) {
		repo = _repo;
		return _repo;
	})
	.then(function(repo) {
		return repo.getReferenceCommit(req.body.Commit || "HEAD")
		.then(function(commit) {
			return commit;
		}).catch(function() {
			return repo.getCommit(req.body.Commit || "HEAD");
		});
	})
	.then(function(commit) {
		return repo.getCommit(commit);
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
	.done(function() {
		res.statusCode = 200;
		res.end();
	});
}

module.exports = {
		putIndex: putIndex,
		postIndex: postIndex,
		getIndex: getIndex
};
