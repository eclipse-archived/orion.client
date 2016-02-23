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

function branchJSON(ref, fileDir) {
	var branchURL = ref.name().split("/").join("%252F");
	var branchName = ref.name().replace("refs/heads/", "");
	var isCurrent = ref.isHead() ? true : false;

	return {
		"CloneLocation": "/gitapi/clone"+ fileDir,
		"CommitLocation": "/gitapi/commit/" + branchURL + fileDir,
		"Current": isCurrent,
		"DiffLocation": "/gitapi/diff/" + branchName + fileDir,
		"FullName": "refs/heads/" + branchName,
		"HeadLocation": "/gitapi/commit/HEAD" + fileDir,
		"LocalTimeStamp": 1424471958000, //hardcoded local timestamp
		"Location": "/gitapi/branch/" + branchURL + fileDir,
		"Name": branchName,
		"RemoteLocation": [],
		"TreeLocation": "/gitapi/tree" + fileDir + "/" + branchURL,
		"Type": "Branch"
	};
}

function remoteJSON(remote, branch, fileDir) {
	var remoteName = remote.name();
	var remoteBranchName = api.join(remoteName, branch["Name"]);
	var remoteBranchUrl = remoteBranchName.split("/").join("%252F");
	var fullName = "refs/remotes/" + remoteBranchName;
	return {
        "Children": [{
          "CloneLocation": "gitapi/clone" + fileDir,
          "CommitLocation": "/gitapi/commit/" + fullName.split("/").join("%252F") + fileDir,
          "DiffLocation": "/gitapi/diff/" + remoteBranchUrl + fileDir,
          "FullName": fullName,
          "GitUrl": remote.url(),
          "HeadLocation": "/gitapi/commit/HEAD" + fileDir,
          "Id": fullName, //For now
          "IndexLocation": "/gitapi/index" + fileDir,
          "Location": "/gitapi/remote/" + remoteBranchName + fileDir,
          "Name": remoteBranchName,
          "TreeLocation": "/gitapi/tree" + fileDir + "/" + remoteBranchUrl,
          "Type": "RemoteTrackingBranch"
        }],
        "CloneLocation": "gitapi/clone" + fileDir,
        "GitUrl": remote.url(),
        "IsGerrit": false, //hardcoded
        "Location": "/gitapi/remote/" + remoteName + fileDir,
        "Name": remoteName,
        "Type": "Remote"
	};
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
			return git.Remote.list(theRepo);
 		})
 		.then(function(remotes) {
 			var branch = branchJSON(theBranch, fileDir);
			async.each(remotes, function(remote, cb) {
				git.Remote.lookup(theRepo, remote)
				.then(function(remote) {
					branch["RemoteLocation"].push(remoteJSON(remote, branch, fileDir));
					cb();
				})
				.catch(function(err) {
					cb(err);
				});
			}, function(err) {
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
		return;
	}
	
	var branches = [];

	git.Repository.open(repoPath)
	.then(function(repo) {
		theRepo = repo;
		return repo.getReferences(git.Reference.TYPE.LISTALL);
	})		
	.then(function(referenceList) {
 		referenceList.forEach(function(ref) {
 			if (ref.isBranch()) {
 				if (!filter || ref.name().replace("refs/heads/", "").indexOf(filter) !== -1) {
 					branches.push(branchJSON(ref, fileDir));
 				}
 			}
		});
		
		branches.sort(function(a, b) {
			if (a.Current) return -1;
			if (b.Current) return 1;
			return a.LocalTimeStamp < b.LocalTimeStamp ? 1 : a.LocalTimeStamp > b.LocalTimeStamp ? -1 : b.Name.localeCompare(a.Name);
		});

		return git.Remote.list(theRepo);
 	})
 	.then(function(remotes) {
		async.each(remotes, function(remote, cb) {
			git.Remote.lookup(theRepo, remote)
			.then(function(remote) {
				branches.forEach(function(branch) {
					branch["RemoteLocation"].push(remoteJSON(remote, branch, fileDir));
				});
				cb();
			})
			.catch(function(err) {
				cb(err);
			});
		}, function(err) {
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
		var resp = JSON.stringify(branchJSON(ref, fileDir));
		res.statusCode = 201;
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Length', resp.length);
		res.end(resp);
	})
	.catch(function(err) {
		writeError(500, res, err.message);
	});
}

function deleteBranch(workspaceDir, fileRoot, req, res, next, rest) {
	var repoPath = rest.replace("branch/", "");
	var branchName = repoPath.substring(0, repoPath.indexOf("/"));
	repoPath = repoPath.substring(repoPath.indexOf("/")+1).replace("file/", "");
	repoPath = api.join(workspaceDir, repoPath);
	git.Repository.open(repoPath)
	.then(function(repo) {
		git.Branch.lookup(repo, branchName,	git.Branch.BRANCH.ALL)
		.then(function(ref) {
			if (git.Branch.delete(ref) === 0) {
				res.statusCode = 200;
				res.end();
			} else {
				writeError(403, res);
		    } 
		})
		.catch(function(reasonForFailure) {
			writeError(403, res);
		});
	});
}

module.exports = {
	getBranches: getBranches,
	createBranch: createBranch,
	deleteBranch: deleteBranch
};
