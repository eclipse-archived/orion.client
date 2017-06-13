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
var api = require('../api'), writeError = api.writeError, writeResponse = api.writeResponse;
var git = require('nodegit');
var mCommit = require('./commit');
var clone = require('./clone');
var express = require('express');
var bodyParser = require('body-parser');

module.exports = {};

module.exports.router = function(options) {
	var fileRoot = options.fileRoot;
	var gitRoot = options.gitRoot;
	if (!fileRoot) { throw new Error('options.fileRoot is required'); }
	if (!gitRoot) { throw new Error('options.gitRoot is required'); }
	
	return express.Router()
	.use(bodyParser.json())
	.get('*', getStash)
	.delete(fileRoot + '*', deleteStash)
	.delete('/:stashRev*', deleteStash)
	.put(fileRoot + '*', putStash)
	.put('/:stashRev*', putStash)
	.post('*', postStash);

function getStash(req, res) {
	var query = req.query;
	var filter = query.filter;
	var page = Number(query.page) || 1;
	var pageSize = Number(query.pageSize) || Number.MAX_SAFE_INTEGER;
	var fileDir;
	var stashesPromises = [];
	return clone.getRepo(req)
	.then(function(repo) {
		fileDir = clone.getfileDir(repo,req);
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
				stashCommit["ApplyLocation"] = gitRoot + "/stash/" + oid + fileDir;
				stashCommit["DropLocation"] = gitRoot + "/stash/" + oid + fileDir;
				stashCommit["Type"] = "StashCommit";
				return stashCommit;
			}));
		});
	})
	.then(function() {
		return Promise.all(stashesPromises);
	})
	.then(function(stashes) {
		writeResponse(200, res, null, {
			"Children" : stashes,
			"Location" : gitRoot + "/stash" + fileDir,
			"CloneLocation" : gitRoot + "/clone" + fileDir,
			"Type" : "StashCommit"
		}, true);
	})
	.catch(function(err) {
		writeError(500, res, err.message);
	});
}

function putStash(req, res) {
	var stashRev = req.params.stashRev;
	var repo;
	return clone.getRepo(req)
	.then(function(_repo) {
		repo = _repo;
		if (stashRev) {
			var empty = true;
			var index = -1;
			return git.Stash.foreach(repo, /* @callback */ function(i, message, oid) {
				empty = false;
				if (oid.toString() === stashRev) {
					index = i;
				}
			})
			.then(function() {
				if (empty) {
					return "Failed to apply stashed changes due to an empty stash.";
				} else if (index === -1) {
					return "Invalid stash reference " + stashRev + ".";
				}
				return git.Stash.apply(repo, index, git.Stash.APPLY_FLAGS.APPLY_REINSTATE_INDEX)
				.then(function() {
					return null;
				});
			});
		}
		return git.Stash.pop(repo, 0, git.Stash.APPLY_FLAGS.APPLY_REINSTATE_INDEX)
		.then(function() {
			return null;
		});
	})
	.then(function(message) {
		if (message === null) {
			res.status(200).end();
		} else {
			writeError(400, res, message);
		}
	})
	.catch(function(err) {
		if (err.message === "Reference 'refs/stash' not found"){
			writeError(400, res, "Failed to apply stashed changes due to an empty stash.");
		}
		writeError(404, res, err.message);
	});
}

function deleteStash(req, res) {
	var stashRev = req.params.stashRev;
	var repo;
	return clone.getRepo(req)
	.then(function(_repo) {
		repo = _repo;
		var index = -1, all = [];
		var empty = true;
		return git.Stash.foreach(repo, /* @callback */ function(i, message, oid) {
			empty = false;
			if (stashRev) {
				if (oid.toString() === stashRev) {
					index = i;
				}
			} else {
				all.push(git.Stash.drop(repo, i));
			} 
		})
		.then(function() {
			if (empty) {
				return "Failed to drop stashed changes due to an empty stash.";
			} else if (stashRev) {
				if (index === -1) {
					return "Invalid stash reference " + stashRev + ".";
				} else {
					return git.Stash.drop(repo, index).then(function() {
						return null;
					});
				}
			} else {
				return Promise.all(all).then(function() {
					return null;
				});
			}
		});
	})
	.then(function(message) {
		if (message === null) {
			res.status(200).end();
		} else {
			writeError(400, res, message);
		}
	})
	.catch(function(err) {
		writeError(404, res, err.message);
	});
}

function postStash(req, res) {
	var flags = git.Stash.FLAGS.DEFAULT;
	if (req.body.IncludeUntracked) flags |= git.Stash.FLAGS.INCLUDE_UNTRACKED;
	var message = req.body.IndexMessage || req.body.WorkingDirectoryMessage || "";

	var repo;
	return clone.getRepo(req)
	.then(function(_repo) {
		repo = _repo;
		return git.Stash.save(repo, clone.getSignature(repo), message, flags);
	})
	.then(function() {
		res.status(200).end();
	})
	.catch(function(err) {
		writeError(404, res, err.message);
	});
}
};
