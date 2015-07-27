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
var fs = require('fs');
var async = require('async');

function getBranches(workspaceDir, fileRoot, req, res, next, rest) {
	var repoPath = rest.replace("branch/file/", "");
	var fileDir = repoPath;
	var gitPath;
    repoPath = api.join(workspaceDir, repoPath);

    var theRepo;
	var remotes = [];
	var branches = [];

	git.Repository.open(repoPath)
	.then(function(repo) {
		theRepo = repo;
		return repo.getReferences(null);
	})		
	.then(function(referenceList) {
 		referenceList.forEach(function(ref) {
 			if (ref.isBranch()) {
 				var branchURL = ref.name().split("/").join("%252F");
 				var branchName = ref.name().replace("refs/heads/", "");
 				var isCurrent = ref.isHead() ? true : false;

 				branches.push({
		 			"CloneLocation": "/gitapi/clone/file/"+ fileDir,
		 			"CommitLocation": "/gitapi/commit/" + branchURL + "/file/" + fileDir,
		 			"Current": isCurrent,
		 			"DiffLocation": "/gitapi/diff/" + branchName + "/file/" + fileDir,
		 			"FullName": "refs/heads/" + branchName,
		 			"HeadLocation": "/gitapi/commit/HEAD/file/" + fileDir,
		 			"LocalTimeStamp": 1424471958000, //hardcoded local timestamp
		 			"Location": "/gitapi/branch/" + branchName + "/file/" + fileDir,
		 			"Name": branchName,
		 			"RemoteLocation": [],
		 			"TreeLocation": "/gitapi/tree/file/" + fileDir + "/" + branchName,
		 			"Type": "Branch"
	 			});
 			}
		});

		return git.Remote.list(theRepo);
 	})
 	.then(function(remotes) {
		// It appears that the java server just generates a remote object for each remote that exists,
		// regardless if there is actually a remote tracking branch that exists.
		async.each(remotes, function(remote, cb) {
			git.Remote.lookup(theRepo, remote)
			.then(function(remote) {
				var remoteName = remote.name();

				branches.forEach(function(branch) {
					var remoteBranchName = api.join(remoteName, branch["Name"]);

					branch["RemoteLocation"].push({
				        "Children": [{
				          // "CloneLocation": branch["CloneLocation"],
				          // "CommitLocation": "/gitapi/commit/" + remoteBranchName + "/file/" + fileDir,
				          // "DiffLocation": "/gitapi/diff/" + remoteBranchName + "/file/" + fileDir,
				          "FullName": "refs/remotes/" + remoteName,
				          "GitUrl": remote.url(),
				          // "HeadLocation": "/gitapi/commit/HEAD/" + fileDir,
				          //"Id": id, is listed in wiki, but not in Java server
				          // "IndexLocation": "/gitapi/index/" + fileDir,
				          "Location": "/gitapi/remote/" + remoteBranchName + "/file/" + fileDir,
				          "Name": remoteBranchName,
				          // "TreeLocation": "/gitapi/tree/file/" + fileDir + "/" + remoteBranchName,
				          "Type": "RemoteTrackingBranch"
				        }],
				        "CloneLocation": branch["CloneLocation"],
				        "GitUrl": remote.url(),
				        "IsGerrit": false, //hardcoded
				        "Location": "/gitapi/remote/" + remoteName + "/file/" + fileDir,
				        "Name": remoteName,
				        "Type": "Remote"
					})
				})

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
		console.log(err);
		writeError(500, res);
	});
}

function getBranchMetadata(workspaceDir, fileRoot, req, res, next, rest) {
	var repoPath = rest.replace("branch/", "");
	var branchName = repoPath.substring(0, repoPath.indexOf("/"));
	repoPath = repoPath.substring(repoPath.indexOf("/")+1).replace("file/", "");
	var fileDir = repoPath;
	repoPath = api.join(workspaceDir, repoPath);
	git.Repository.open(repoPath)
	.then(function(repo) {
		git.Branch.lookup(repo, branchName,	git.Branch.BRANCH.LOCAL)
		.then(function(ref) {
			var remotes = [];
			repo.getReferences(git.Reference.TYPE.OID)
			.then(function(referenceList) {
		 		referenceList.forEach(function(ref) {
	 				if (ref.isRemote()) {
						var remoteName = ref.name().replace("refs/remotes/", "");
						remotes.push(remoteName);
					}
	 			});
		 	})
		 	.then(function() {
		 		var remoteLocations = [];

	 			remotes.forEach(function(remote) {
					var nameToMatch = remote.substring(remote.indexOf("/") + 1);
					var remoteURL = remote.split("/").join("%252F");
					var remoteName = remote.substring(0, remote.indexOf("/"));
					if (remoteName === branchName) {
						remoteLocations.push({
					        "Children": [{
					          "CloneLocation": branches[nameToMatch]["CloneLocation"], // FIXME
					          "CommitLocation": "/gitapi/commit/" + remoteURL + "/file/" + fileDir,
					          "DiffLocation": "/gitapi/diff/" + remoteURL + "/file/" + fileDir,
					          "FullName": "refs/remotes/" + remote,
					          "GitUrl": "git@github.com:albertcui/orion.client.git", //hardcoded
					          "HeadLocation": "/gitapi/commit/HEAD/" + fileDir,
					          "Id": "08c41c776f2e9e5dca7fbbbcfe2c8c9c06300998", //hardcoded
					          "IndexLocation": "/gitapi/index/" + fileDir,
					          "Location": "/gitapi/remote/" + remote + "/file/" + fileDir,
					          "Name": "origin/node_git_pages",
					          "TreeLocation": "/gitapi/tree/file/" + fileDir + "/" + remoteURL,
					          "Type": "RemoteTrackingBranch"
					        }],
					        "CloneLocation": "/gitapi/clone/file/" + fileDir,
					        "GitUrl": "git@github.com:albertcui/orion.client.git",
					        "IsGerrit": false, //hardcoded
					        "Location": "/gitapi/remote/" + remoteName + "/" + fileDir,
					        "Name": "origin",
					        "Type": "Remote"
						})
					}
				});

				var branchRes = {
					"CloneLocation": "/gitapi/clone/file/" + fileDir,
					"CommitLocation": "/gitapi/commit/" + branchName + "/file/" + fileDir,
					"Current": git.Branch.isHead(ref) ? true : false,
					"DiffLocation": "/gitapi/diff/" + branchName + "/file/" + fileDir,
					"FullName": ref.name(),
					"HeadLocation": "/gitapi/commit/HEAD/file/" + fileDir,
					"LocalTimeStamp": 1234567890000, //hardcoded
					"Location": "/gitapi/branch/" + branchName + "/file/" + fileDir,
					"Name": branchName,
					"RemoteLocation": remoteLocations,
					"TreeLocation": "/gitapi/tree/file/" + fileDir + "/" + branchName,
					"Type": "Branch"
				}
				
				var resp = JSON.stringify(branchRes);
				
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.setHeader('Content-Length', resp.length);
				res.end(resp);
	 		})

		})
	});
}

function createBranch(workspaceDir, fileRoot, req, res, next, rest) {
	var repoPath = rest.replace("branch/file/", "");
	var fileDir = repoPath;
	var gitPath;
    repoPath = api.join(workspaceDir, repoPath);
	git.Repository.open(repoPath)
	.then(function(repo) {
		repo.getCurrentBranch()
		.then(function(reference) {
			repo.getBranchCommit(reference)
			.then(function(commit) {
				var branchName = req.body.Name;
				var signature = git.Signature.default(repo);
				git.Branch.create(repo, branchName, commit, 0, signature, null)
				.then(function(ref) {
					var resp = JSON.stringify({
						"CloneLocation": "/gitapi/clone/file/" + fileDir,
						"CommitLocation": "/gitapi/commit/" + branchName + "/file/" + fileDir,
						"Current": git.Branch.isHead(ref) ? true : false,
						"DiffLocation": "/gitapi/diff/" + branchName + "/file/" + fileDir,
						"FullName": ref.name(),
						"HeadLocation": "/gitapi/commit/HEAD/file/" + fileDir,
						"LocalTimeStamp": 1234567890000, //hardcoded
						"Location": "/gitapi/branch/" + branchName + "/file/" + fileDir,
						"Name": branchName,
						"RemoteLocation": [],
						"TreeLocation": "/gitapi/tree/file/" + fileDir + "/" + branchName,
						"Type": "Branch"
					});
					
					res.statusCode = 201;
					res.setHeader('Content-Type', 'application/json');
					res.setHeader('Content-Length', resp.length);
					res.end(resp);
				});
			});
		});
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
	getBranchMetadata: getBranchMetadata,
	createBranch: createBranch,
	deleteBranch: deleteBranch
};
