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
var async = require('async');
var mRemotes = require('./remotes');

function branchJSON(repo, ref, fileDir) {
	var fullName = ref.name();
	var shortName = ref.shorthand();
	var branchURL = fullName.split("/").join("%252F");
	var current = !!ref.isHead() || repo.headDetached() && ref.name() === "HEAD";
	return {
		"CloneLocation": "/gitapi/clone"+ fileDir,
		"CommitLocation": "/gitapi/commit/" + branchURL + fileDir,
		"Current": current,
		"Detached": current && !!repo.headDetached(),
		"DiffLocation": "/gitapi/diff/" + shortName + fileDir,
		"FullName": fullName,
		"HeadLocation": "/gitapi/commit/HEAD" + fileDir,
		"Location": "/gitapi/branch/" + branchURL + fileDir,
		"Name": shortName,
		"RemoteLocation": [],
		"TreeLocation": "/gitapi/tree" + fileDir + "/" + branchURL,
		"Type": "Branch"
	};
}

function getBranchCommit(repo, branches, callback) {
	async.each(branches, function(branch, cb) {
		return repo.getReferenceCommit(branch.FullName)
		.then(function(commit) {
			branch["LocalTimeStamp"] = commit.timeMs();
			branch["HeadSHA"] = commit.sha();
			cb();
		})
		.catch(function() {
			cb();
		});
	}, function(err) {
		callback(err);
	});
}

function getBranchRemotes(repo, branches, fileDir, callback) {
	return git.Remote.list(repo)
 	.then(function(remotes) {
		async.each(remotes, function(remote, cb) {
			git.Remote.lookup(repo, remote)
			.then(function(remote) {
				return Promise.all(branches.map(function(branch) {
					return git.Branch.lookup(repo, api.join(remote.name(), branch.Name), git.Branch.BRANCH.REMOTE).then(function(remoteBranch) {
						return repo.getBranchCommit(remoteBranch).then(function(commit) {
							branch["RemoteLocation"].push(mRemotes.remoteJSON(remote, fileDir, [mRemotes.remoteBranchJSON(remoteBranch, commit, remote, fileDir)]));
						});
					}).catch(function() {
						//No remote tracking branch
						branch["RemoteLocation"].push(mRemotes.remoteJSON(remote, fileDir, [mRemotes.remoteBranchJSON(null, null, remote, fileDir, branch)]));
					});
				}));
			})
			.then(function() {
				cb();
			})
			.catch(function(err) {
				cb(err);
			});
		}, callback);
	});
}

function getBranches(workspaceDir, fileRoot, req, res, next, rest) {
	var segments = rest.split("/");
	var hasBranch = segments[1] !== "file";
	var branchName = hasBranch ? segments[1].replace(/%252F/g, '/') : "";
	branchName = branchName.replace("refs/heads/", "");
	var repoPath = segments[branchName ? 3 : 2];
	var fileDir = api.join(fileRoot, repoPath);
	repoPath = api.join(workspaceDir, repoPath);
	var query = url.parse(req.url, true).query;
	var filter = query.filter;
	
	var theRepo;
	if (branchName) {
		var theBranch;
		git.Repository.open(repoPath)
		.then(function(repo) {
			theRepo = repo;
			return git.Branch.lookup(repo, branchName, git.Branch.BRANCH.LOCAL);
		})
		.then(function(ref) {
			theBranch = ref;
			var branch = branchJSON(theRepo, theBranch, fileDir);
			return getBranchCommit(theRepo, [branch], function() {
				return getBranchRemotes(theRepo, [branch], fileDir, function(err) {
					if (err) {
						console.log(err);
						return writeError(500, res);
					}
					var resp = JSON.stringify(branch);
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.setHeader('Content-Length', resp.length);
					res.end(resp);
				});
			});
		})
		.catch(function(err) {
			writeError(500, res, err.message);
		});
		return;
	}
	
	var branches = [], theHead;

	git.Repository.open(repoPath)
	.then(function(repo) {
		theRepo = repo;
		return repo.head();
	})
	.then(function(head) {
		theHead = head;
		return theRepo.getReferences(git.Reference.TYPE.LISTALL);
	})
	.then(function(referenceList) {
		if (theRepo.headDetached()) {
			referenceList.unshift(theHead);
		}
		referenceList.forEach(function(ref) {
			if (ref.isBranch() || theRepo.headDetached() && ref === theHead) {
				if (!filter || ref.shorthand().indexOf(filter) !== -1) {
					branches.push(branchJSON(theRepo, ref, fileDir));
				}
			}
		});
		
		branches.sort(function(a, b) {
			if (a.Current) return -1;
			if (b.Current) return 1;
			return a.LocalTimeStamp < b.LocalTimeStamp ? 1 : a.LocalTimeStamp > b.LocalTimeStamp ? -1 : b.Name.localeCompare(a.Name);
		});

		return getBranchCommit(theRepo, branches, function() {
			return getBranchRemotes(theRepo, branches, fileDir, function(err) {
				if (err) {
					console.log(err);
					return writeError(500, res);
				}
				var resp = JSON.stringify({
					"Children": branches,
					"Type": "Branch"
				});
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.setHeader('Content-Length', resp.length);
				res.end(resp);
			});
		});
	})
	.catch(function(err) {
		writeError(500, res, err.message);
	});
}

function createBranch(workspaceDir, fileRoot, req, res, next, rest) {
	var segments = rest.split("/");
	var repoPath = segments[2];
	var fileDir = api.join(fileRoot, repoPath);
	repoPath = api.join(workspaceDir, repoPath);
	var branchName = req.body.Name;
	var startPoint = req.body.Branch;
	var theRepo, theRef;

	if (!branchName) {
		if (!startPoint) {
			return writeError(400, res, "Branch name must be provided.");
		}
	}
	git.Repository.open(repoPath)
	.then(function(repo) {
		theRepo = repo;
		return startPoint ? git.Reference.lookup(repo, "refs/remotes/" + startPoint) : repo.getCurrentBranch();
	})
	.then(function(reference) {
		theRef = reference;
		return theRepo.getReferenceCommit(reference);
	})
	.then(function(commit) {
		if (!branchName) {
			branchName = theRef.shorthand().split("/").slice(1).join("/");
		}
		return git.Branch.create(theRepo, branchName, commit, 0);
	})
	.then(function(ref) {
		var branch = branchJSON(theRepo, ref, fileDir);
		return getBranchRemotes(theRepo, [branch], fileDir, function(err) {
			if (err) {
				console.log(err);
				return writeError(500, res);
			}
			var resp = JSON.stringify(branch);
			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Content-Length', resp.length);
			res.end(resp);
		});
	})
	.catch(function(err) {
		writeError(500, res, err.message);
	});
}

function deleteBranch(workspaceDir, fileRoot, req, res, next, rest) {
	var segments = rest.split("/");
	var repoPath = segments[3];
	repoPath = api.join(workspaceDir, repoPath);
	var branchName = segments[1].replace(/%252F/g, '/');

	git.Repository.open(repoPath)
	.then(function(repo) {
		return git.Reference.lookup(repo, branchName);
	})
	.then(function(ref) {
		if (git.Branch.delete(ref) === 0) {
			res.statusCode = 200;
			res.end();
		} else {
			writeError(403, res);
		}
	})
	.catch(function() {
		writeError(403, res);
	});
}

module.exports = {
	getBranches: getBranches,
	createBranch: createBranch,
	deleteBranch: deleteBranch
};
