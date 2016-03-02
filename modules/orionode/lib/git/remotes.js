/*******************************************************************************
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node */
var api = require('../api'), writeError = api.writeError;
var async = require('async');
var git = require('nodegit');
var url = require('url');
var tasks = require('../tasks');

function remoteBranchJSON(remoteBranch, commit, remote, fileDir, branch){
	var fullName, shortName;
	if (remoteBranch) {
		fullName = remoteBranch.name();
		shortName = remoteBranch.shorthand();
	} else {// remote branch does not exists
		shortName = api.join(remote.name(), branch.Name);
		fullName = "refs/remotes/" + shortName;
	}
	var segments = shortName.split("/");
	var remoteURL = segments[0] + "/" + segments.slice(1).join("%252F");
	return {
		"CloneLocation": "/gitapi/clone" + fileDir,
		"CommitLocation": "/gitapi/commit/" + fullName.replace(/\//g, '%252F') + fileDir,
		"DiffLocation": "/gitapi/diff/" + shortName.replace(/\//g, '%252F') + fileDir,
		"FullName": fullName,
		"GitUrl": remote.url(),
		"HeadLocation": "/gitapi/commit/HEAD" + fileDir,
		"Id": remoteBranch && commit ? commit.sha() : undefined,
		"IndexLocation": "/gitapi/index" + fileDir,
		"Location": "/gitapi/remote/" + remoteURL + fileDir,
		"Name": shortName,
		"TreeLocation": "/gitapi/tree" + fileDir + "/" + shortName.replace(/\//g, '%252F'),
		"Type": "RemoteTrackingBranch"
	};
}

function remoteJSON(remote, fileDir, branches) {
	var name = remote.name();
	return {
		"CloneLocation": "/gitapi/clone/" + fileDir,
		"IsGerrit": false, // should check 
		"GitUrl": remote.url(),
		"Name": name,
		"Location": "/gitapi/remote/" + name + fileDir,
		"Type": "Remote",
		"Children": branches
	};
}

function getRemotes(workspaceDir, fileRoot, req, res, next, rest) {
	var segments = rest.split("/");
	var allRemotes = segments[1] === "file";
	var allRemoteBranches = segments[2] === "file";
	var oneRemoteBranch = segments[3] === "file";
	var query = url.parse(req.url, true).query;
	var filter = query.filter;

	var repoPath, fileDir, theRepo, theRemote, remoteName;
	if (allRemotes) {
		repoPath = segments[2];
		fileDir = api.join(fileRoot, repoPath);
		repoPath = api.join(workspaceDir, repoPath);
		var repo;

		git.Repository.open(repoPath)
		.then(function(r) {
			repo = r;
			return git.Remote.list(r);
		})
		.then(function(remotes){
			var r = [];
			async.each(remotes, function(remote, cb) {
				git.Remote.lookup(repo, remote)
				.then(function(remote){
					r.push(remoteJSON(remote, fileDir));
					cb();
				});
			}, function() {
				var resp = JSON.stringify({
					"Children": r,
					"Type": "Remote"
				});
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.setHeader('Content-Length', resp.length);
				res.end(resp);
			});
		});
		return;
	}

	if (allRemoteBranches) {
		remoteName = segments[1];
		repoPath = segments[3];
		fileDir = api.join(fileRoot, repoPath);
		repoPath = api.join(workspaceDir, repoPath);
		git.Repository.open(repoPath)
		.then(function(repo) {
			theRepo = repo;
			return repo.getRemote(remoteName);
		})
		.then(function(remote) {
			theRemote = remote;
			return theRepo.getReferences(git.Reference.TYPE.OID);
		})
		.then(function(referenceList) {
			var branches = [];
			async.each(referenceList, function(ref,callback) {
				if (ref.isRemote()) {
					var rName = ref.shorthand();
					if (rName.indexOf(remoteName) === 0 && (!filter || rName.indexOf(filter) !== -1)) {
						theRepo.getBranchCommit(ref)
						.then(function(commit) {
							branches.push(remoteBranchJSON(ref, commit, theRemote, fileDir));
							callback();
						});
					} else {
						callback(); 
					}
				} else {
					callback();
				}

			}, function(err) {
				if (err) {
					return writeError(403, res);
				}
				var resp = JSON.stringify(remoteJSON(theRemote, fileDir, branches));
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.setHeader('Content-Length', resp.length);
				res.end(resp);
			});
		});
		return;
	} 

	if (oneRemoteBranch) {
		remoteName = segments[1];
		var branchName = segments[2].replace(/%252F/g, '/');
		repoPath = segments[4];
		fileDir = api.join(fileRoot, repoPath);
		var theBranch;
		repoPath = api.join(workspaceDir, repoPath);
		git.Repository.open(repoPath)
		.then(function(repo) {
			theRepo = repo;
			return repo.getRemote(remoteName);
		})
		.then(function(remote) {
			theRemote = remote;
			return theRepo.getReference("refs/remotes/" + remoteName + "/" + branchName);
		})
		.then(function(branch) {
			theBranch = branch;
			return theRepo.getBranchCommit(branch);
		})
		.then(function(commit) {
			var resp = JSON.stringify(remoteBranchJSON(theBranch, commit, theRemote, fileDir));
			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Content-Length', resp.length);
			res.end(resp);
		
		})
		.catch(function() {
			return writeError(403, res);
		});
		return;
	}
	return writeError(404, res);
}

function addRemote(workspaceDir, fileRoot, req, res, next, rest) {
	var repoPath = rest.replace("remote/file/", "");
	var fileDir = repoPath;
	repoPath = api.join(workspaceDir, repoPath);
	
	if (!req.body.Remote || !req.body.RemoteURI) {
		return writeError(500, res);
	}

	// It appears that the java server does not let you add a remote if
	// it doesn't have a protocol (it seems to check for a colon).
	var parsedUrl = url.parse(req.body.RemoteURI, true);

	if (!parsedUrl.protocol) {
		writeError(403, res);
	}

	git.Repository.open(repoPath)
	.then(function(repo) {
		return git.Remote.create(repo, req.body.Remote, req.body.RemoteURI);
	})
	.then(function(remote) {
		var resp = JSON.stringify({
			"Location": "/gitapi/remote/" + remote.name() + "/file/" + fileDir
		});
		res.statusCode = 201;
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Length', resp.length);
		res.end(resp);
	})
	.catch(function(err) {
		console.log(err);
		writeError(403, res);
	});
}

function postRemote(workspaceDir, fileRoot, req, res, next, rest) {
	var segments = rest.split("/");
	var repoPath = segments[2] === "file" ? segments[3] : segments[4];
	repoPath = api.join(workspaceDir, repoPath);
	var remote = segments[1];
	var branch = segments[2] === "file" ? "" : segments[2];

	if (req.body.Fetch) {
		fetchRemote(repoPath, req, res, rest, remote, branch, req.body.Force);
	} else if (req.body.PushSrcRef) {
		pushRemote(repoPath, req, res, rest, remote, branch, req.body.PushSrcRef, req.body.PushTags, req.body.Force);
	} else {
		writeError(400, res);
	}
}

function fetchRemote(repoPath, req, res, rest, remote, branch, force) {
	var task = new tasks.Task(res);
	var repo;
	git.Repository.open(repoPath)
	.then(function(r) {
		repo = r;
		return git.Remote.lookup(repo, remote);
	})
	.then(function(remote) {
		var refSpec = null;
		if (branch) {
			var remoteBranch = branch;
			if (branch.indexOf("for/") === 0) {
				remoteBranch = branch.substr(4);
			}
			refSpec = "refs/heads/" + remoteBranch + ":refs/remotes/" + remote.name() + "/" + branch;
			if (force) refSpec = "+" + refSpec;
		}
		
		return remote.fetch(
			refSpec ? [refSpec] : null,
			{callbacks:
				{
					certificateCheck: function() {
						return 1;
					}
				}
			},
			"fetch"	
		);
	})
	.then(function(err) {
		if (!err) {
			task.done({
				HttpCode: 200,
				Code: 0,
				DetailedMessage: "OK",
				Message: "OK",
				Severity: "Ok"
			});
		} else {
			throw err;
		}
	})
	.catch(function(err) {
		task.done({
			HttpCode: 403,
			Code: 0,
			Message: err.message,
			Severity: "Error"
		});
	});
}

function pushRemote(repoPath, req, res, rest, remote, branch, pushSrcRef, tags, force) {
	var repo;
	var remoteObj;

	var task = new tasks.Task(res);

	git.Repository.open(repoPath)
	.then(function(r) {
		repo = r;
		return git.Remote.lookup(repo, remote);
	})
	.then(function(r) {
		remoteObj = r;
		return repo.getReference(pushSrcRef);
	})
	.then(function(ref) {

		if (!req.body.GitSshUsername || !req.body.GitSshPassword) {
			throw new Error(remoteObj.url() + ": not authorized");
		}

		var pushToGerrit = branch.indexOf("for/") === 0;
		var refSpec = ref.name() + ":" + (pushToGerrit ? "refs/" : "refs/heads/") + branch;

		if (force) refSpec = "+" + refSpec;

		return remoteObj.push(
			tags && false ? [refSpec, "refs/tags/*:refs/tags/*"] : [refSpec],
			{callbacks: {
				certificateCheck: function() {
					return 1; // Continues connection even if SSL certificate check fails. 
				},
				credentials: function() {
					return git.Cred.userpassPlaintextNew(
						req.body.GitSshUsername,
						req.body.GitSshPassword
					);
				}
			}}
		);
	})
	.then(function(err) {
		if (!err) {
			var parsedUrl = url.parse(remoteObj.url(), true);
			task.done({
				HttpCode: 200,
				Code: 0,
				DetailedMessage: "OK",
				JsonData: {
					"Host": parsedUrl.host,
					"Scheme": parsedUrl.protocol.replace(":", ""),
					"Url": remoteObj.url(),
					"HumanishName": parsedUrl.pathname.substring(parsedUrl.pathname.lastIndexOf("/") + 1).replace(".git", ""),
					"Message": "",
					"Severity": "Normal",
					Updates: [{
						LocalName: req.body.PushSrcRef,
						RemoteName: remote + "/" + branch,
						Result: "UP_TO_DATE"
					}]
				},
				Message: "OK",
				Severity: "Ok"
			});
		} else {
			throw new Error("Push failed.");
		}
	})
	.catch(function(err) {
		var parsedUrl = url.parse(remoteObj.url(), true);
		task.done({
			HttpCode: 401,
			Code: 0,
			DetailedMessage: err.message,
			JsonData: {
				"Host": parsedUrl.host,
				"Scheme": parsedUrl.protocol.replace(":", ""),
				"Url": remoteObj.url(),
				"HumanishName": parsedUrl.pathname.substring(parsedUrl.pathname.lastIndexOf("/") + 1).replace(".git", "")
			},
			Message: err.message,
			Severity: "Error"
		});
	});
}

function deleteRemote(workspaceDir, fileRoot, req, res, next, rest) {
	rest = rest.replace("remote/", "");
	var split = rest.split("/file/");
	var repoPath = api.join(workspaceDir, split[1]);
	var remoteName = split[0];
	return git.Repository.open(repoPath)
	.then(function(repo) {
		return git.Remote.delete(repo, remoteName).then(function(resp) {
			if (!resp) {
				res.statusCode = 200;
				res.end();
			} else {
				writeError(403, res);
			}
		}).catch(function(error) {
			writeError(500, error);
		});
	});
}

module.exports = {
	remoteBranchJSON: remoteBranchJSON,
	remoteJSON: remoteJSON,
	getRemotes: getRemotes,
	addRemote: addRemote,
	postRemote: postRemote,
	deleteRemote: deleteRemote
};