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
var api = require('../api'), writeError = api.writeError;
var git = require('nodegit');
var url = require('url');
var mCommit = require('./commit');

function getStash(workspaceDir, fileRoot, req, res, next, rest) {
	var segments = rest.split("/");
	var repoPath = segments[2];
	var fileDir = api.join(fileRoot, repoPath);
	repoPath = api.join(workspaceDir, repoPath);

	var query = url.parse(req.url, true).query;
	var page = Number(query.page) || 1;
	var filter = query.filter;
	var pageSize = Number(query.pageSize) || Number.MAX_SAFE_INTEGER;

	var stashesPromises = [];
	git.Repository.open(repoPath)
	.then(function(repo) {
		return git.Stash.foreach(repo, function(index, message, oid) {
			if (filter && message.indexOf(filter) === -1) return;
			stashesPromises.push(repo.getCommit(oid)
			.then(function(commit) {
				return Promise.all([commit, mCommit.getDiff(repo, commit, fileDir), mCommit.getCommitParents(repo, commit, fileDir)]);
			})
			.then(function(commitAndDiffs) {
				var commit = commitAndDiffs[0];
				var diffs = commitAndDiffs[1];
				var parents = commitAndDiffs[2];
				var stashCommit = mCommit.commitJSON(commit, fileDir, diffs, parents);
				stashCommit["ApplyLocation"] = "/gitapi/stash/" + oid + fileDir;
				stashCommit["DropLocation"] = "/gitapi/stash/" + oid + fileDir;
				stashCommit["Type"] = "StashCommit";
				return stashCommit;
			}));
		});
	})
	.then(function() {
		return Promise.all(stashesPromises);
	})
	.then(function(stashes) {
		var resp = JSON.stringify({
			"Children" : stashes,
			"Location" : "/gitapi/stash" + fileDir,
			"CloneLocation" : "/gitapi/clone" + fileDir,
			"Type" : "StashCommit"
		});
		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Length', resp.length);
		res.end(resp);
	})
	.catch(function(err) {
		writeError(500, res, err.message);
	});
}

function putStash(workspaceDir, fileRoot, req, res, next, rest) {
	var segments = rest.split("/");
	var stashRev = segments[1] === "file" ? "" : segments[1];
	var repoPath = segments[stashRev ? 3: 2];
	repoPath = api.join(workspaceDir, repoPath);

	var repo;
	git.Repository.open(repoPath)
	.then(function(_repo) {
		repo = _repo;
		if (stashRev) {
			var index;
			return git.Stash.foreach(repo, /* @callback */ function(i, message, oid) {
				if (oid.toString() === stashRev) {
					index = i;
				}
			})
			.then(function() {
				return git.Stash.apply(repo, index, git.Stash.APPLY_FLAGS.APPLY_REINSTATE_INDEX);
			});
		}
		return git.Stash.pop(repo, 0, git.Stash.APPLY_FLAGS.APPLY_REINSTATE_INDEX);
	})
	.then(function() {
		res.statusCode = 200;
		res.end();
	})
	.catch(function(err) {
		writeError(404, res, err.message);
	});
}

function deleteStash(workspaceDir, fileRoot, req, res, next, rest) {
	var segments = rest.split("/");
	var stashRev = segments[1] === "file" ? "" : segments[1];
	var repoPath = segments[stashRev ? 3: 2];
	repoPath = api.join(workspaceDir, repoPath);

	var repo;
	git.Repository.open(repoPath)
	.then(function(_repo) {
		repo = _repo;
		var index, all = [];
		return git.Stash.foreach(repo, /* @callback */ function(i, message, oid) {
			if (stashRev) {
				if (oid.toString() === stashRev) {
					index = i;
				}
			} else {
				all.push(git.Stash.drop(repo, index, git.Stash.APPLY_FLAGS.APPLY_REINSTATE_INDEX));				
			} 
		})
		.then(function() {
			if (all.length) return Promise.all(all);
			return git.Stash.drop(repo, index, git.Stash.APPLY_FLAGS.APPLY_REINSTATE_INDEX);
		});
	})
	.then(function() {
		res.statusCode = 200;
		res.end();
	})
	.catch(function(err) {
		writeError(404, res, err.message);
	});
}

function postStash(workspaceDir, fileRoot, req, res, next, rest) {
	var segments = rest.split("/");
	var repoPath = segments[2];
	repoPath = api.join(workspaceDir, repoPath);

	var flags = git.Stash.FLAGS.DEFAULT;
	if (req.body.IncludeUntracked) flags |= git.Stash.FLAGS.INCLUDE_UNTRACKED;
	var message = req.body.IndexMessage || req.body.WorkingDirectoryMessage || "";

	var repo;
	git.Repository.open(repoPath)
	.then(function(_repo) {
		repo = _repo;
		return git.Stash.save(repo, git.Signature.default(repo), message, flags);
	})
	.then(function(oid) {
		res.statusCode = 200;
		res.end();
	})
	.catch(function(err) {
		writeError(404, res, err.message);
	});
}

module.exports = {
	getStash: getStash,
	putStash: putStash,
	deleteStash: deleteStash,
	postStash: postStash
};
