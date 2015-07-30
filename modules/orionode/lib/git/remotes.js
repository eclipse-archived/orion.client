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
var async = require('async');
var git = require('nodegit');
var url = require('url');
var tasks = require('../tasks');

function getRemotes(workspaceDir, fileRoot, req, res, next, rest) {
	var repoPath = rest.replace("remote/file/", "");
	var fileDir = repoPath;
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
				var name = remote.name();
				r.push({
					"CloneLocation": "/gitapi/clone/file/" + fileDir,
					"IsGerrit": false, // should check 
					"GitUrl": remote.url(),
					"Name": name,
					"Location": "/gitapi/remote/" + name + "/file/" + fileDir,
					"Type": "Remote"
				});
				cb();
			});
		}, function(err) {
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
}

function getRemotesBranches(workspaceDir, fileRoot, req, res, next, rest) {
	var remoteName = rest.replace("remote/", "").substring(0, rest.lastIndexOf("/file/")-"/file/".length-1);
	var repoPath = rest.substring(rest.lastIndexOf("/file/")).replace("/file/","");
	var fileDir = repoPath;
	repoPath = api.join(workspaceDir, repoPath);
	git.Repository.open(repoPath)
	.then(function(repo) {
		repo.getReferences(git.Reference.TYPE.OID)
		.then(function(referenceList) {
			var branches = [];
			async.each(referenceList, iterator, function(err) {
				if (err) {
					return writeError(403, res);
				}
				var resp = JSON.stringify({
					"Children": branches,
					"Location": "/gitapi/remote/" + remoteName + "/file/" + fileDir,
					"Name": remoteName
				});
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.setHeader('Content-Length', resp.length);
				res.end(resp);
			});

			function iterator(ref, callback) {
				if (ref.isRemote()) {
					var rName = ref.name().replace("refs/remotes/", "");
					if (rName.indexOf(remoteName) === 0) {
						repo.getBranchCommit(ref)
						.then(function(commit) {
							branches.push({
								"CommitLocation": "/gitapi/commit/" + commit.sha() + "/file/" + fileDir,
								"Id": commit.sha(),
								"Location": "/gitapi/remote/" + remoteName + "/file/" + fileDir,
								"Name": rName
							});
							callback();
						});
					} else {
						callback();
					}					
				} else {
					callback();
				}
			}
		});
	});
}

function getRemotesBranchDetail(workspaceDir, fileRoot, req, res, next, rest) {
// 	rest = rest.replace("remote/", "");
// 	var split = rest.split("/file/");
// 	var repoPath = api.join(workspaceDir, split[1]);
// 	var remote = split[0];

// 	var resp = JSON.stringify({
// 		"CommitLocation": "/gitapi/commit/" + bbbcc34fe10c2d731e7f97618f4f469c2f763a31 + "/file/" + repoPath,
// 		"HeadLocation": "/gitapi/commit/" + remote + "/file/" + repoPath,
// 		"Id": "bbbcc34fe10c2d731e7f97618f4f469c2f763a31",
// 		"Location": "/gitapi/remote/" + remote + "/file/" + repoPath
// 	});

// 	res.statusCode = 200;
// 	res.setHeader('Content-Type', 'application/json');
// 	res.setHeader('Content-Length', resp.length);
// 	res.end(resp);
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
	rest = rest.replace("remote/", "");
	var split = rest.split("/file/"); //If the branch name is /file/, this is kind of a problem.
	var repoPath = api.join(workspaceDir, split[1]);
	var remote = split[0];

	if (req.body.Fetch) {
		fetchRemote(repoPath, res, remote)
	} else {
		pushRemote(repoPath, req, res, remote)
	}
}

function fetchRemote(repoPath, res, remote) {
	var repo;
	git.Repository.open(repoPath)
	.then(function(r) {
		repo = r;
		return git.Remote.lookup(repo, remote);
	})
	.then(function(remote) {
		remote.setCallbacks({
			certificateCheck: function() {
				return 1; // Continues connection even if SSL certificate check fails. 
			}
		});

		var refSpec = "+refs/heads/*:refs/remotes/" + remote.name() + "/*";

		return remote.fetch(
			[refSpec],
			git.Signature.default(repo),
			"fetch"	
		);
	})
	.then(function(err) {
		if (!err) {
			// This returns when the task completes, so just give it a fake task.
			var resp = JSON.stringify({
				"Id": "11111",
				"Location": "/task/id/THISISAPLACEHOLDER",
				"Message": "Fetching " + remote + "...",
				"PercentComplete": 100,
				"Running": false
			});

			res.statusCode = 201;
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Content-Length', resp.length);
			res.end(resp);
		} else {
			console.log("fetch failed")
			writeError(403, res);
		}
	})
	.catch(function(err) {
		console.log(err);
		writeError(403, res);
	})
}

function pushRemote(repoPath, req, res, remote) {
	var taskID = (new Date).getTime(); // Just use the current time
	var split = remote.split("/"); // remote variable should be [remote]/[branch]
	var remote = split[0];
	var branch = split[1];
	var repo;
	var remoteObj;

	var task = tasks.addTask(taskID, "Pushing " + remote + "...", true, 0);

	var resp = JSON.stringify(task);

	res.statusCode = 202;
	res.setHeader('Content-Type', 'application/json');
	res.setHeader('Content-Length', resp.length);
	res.end(resp);

	git.Repository.open(repoPath)
	.then(function(r) {
		repo = r;
		return git.Remote.lookup(repo, remote);
	})
	.then(function(r) {
		remoteObj = r;
		return repo.getReference(req.body.PushSrcRef);
	})
	.then(function(ref) {

		if (!req.body.GitSshUsername || !req.body.GitSshPassword) {
			throw new Error(remoteObj.url() + ": not authorized");
		}

		remoteObj.setCallbacks({
			certificateCheck: function() {
				return 1; // Continues connection even if SSL certificate check fails. 
			},
			credentials: function() {
				return git.Cred.userpassPlaintextNew(
					req.body.GitSshUsername,
					req.body.GitSshPassword
				);
			}
		});

		var refSpec = ref.name() + ":refs/heads/" + branch;

		if (req.body.Force) refSpec = "+" + refSpec;

		return remoteObj.push(
			[refSpec],
			null,
			repo.defaultSignature(),
			"Push to " + branch
		);
	})
	.then(function(err) {

		if (!err) {
			var parsedUrl = url.parse(remoteObj.url(), true);
			tasks.updateTask(
				taskID, 
				100,
				{
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
					Severity: "OK"
				},
				"loadend"
			);
		} else {
			throw new Error("Push failed.");
		}
	})
	.catch(function(err) {
		console.log(err);
		var parsedUrl = url.parse(remoteObj.url(), true);

		tasks.updateTask(
			taskID, 
			100,
			{
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
			},
			"error"
		);
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
			// Docs claim this resolves 0 on success, but in practice we get undefined
			if (resp === 0 || typeof resp === "undefined") {
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
	getRemotes: getRemotes,
	getRemotesBranches: getRemotesBranches,
	getRemotesBranchDetail: getRemotesBranchDetail,
	addRemote: addRemote,
	postRemote: postRemote,
	deleteRemote: deleteRemote
};