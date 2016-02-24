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

function remoteBranchJSON(ref, commit, remote, fileDir){
	var rName = ref.name().replace("refs/remotes/", "");
	var segments = rName.split("/");
	var remoteName = segments[0] + "/" + segments.slice(1).join("%252F");
	return {
		"CloneLocation": "/gitapi/clone" + fileDir,
		"CommitLocation": "/gitapi/commit/" + ref.name().replace(/\//g, '%252F') + fileDir,
		"DiffLocation": "/gitapi/diff/" + rName.replace(/\//g, '%252F') + fileDir,
		"FullName": ref.name(),
		"GitUrl": remote.url(),
		"HeadLocation": "/gitapi/commit/HEAD" + fileDir,
		"Id": commit.sha(),
		"IndexLocation": "/gitapi/index" + fileDir,
		"Location": "/gitapi/remote/" + remoteName + fileDir,
		"Name": rName,
		"TreeLocation": "/gitapi/tree" + fileDir + "/" + rName.replace(/\//g, '%252F'),
		"Type": "RemoteTrackingBranch"
	}
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
	}
}

function getRemotes(workspaceDir, fileRoot, req, res, next, rest) {
	var segments = rest.split("/");
	var allRemotes = segments[1] === "file";
	var allRemoteBranches = segments[2] === "file";
	var oneRemoteBranch = segments[3] === "file";
	var query = url.parse(req.url, true).query;
	var filter = query.filter;

	if (allRemotes) {
		var repoPath = segments[2];
		var fileDir = api.join(fileRoot, repoPath);
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
		return;
	}  

	if (allRemoteBranches) {
		var remoteName = segments[1];
		var repoPath = segments[3];
		var fileDir = api.join(fileRoot, repoPath);
		var theRepo, theRemote;
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
					var rName = ref.name().replace("refs/remotes/", "");
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
		var remoteName = segments[1];
		var branchName = segments[2].replace(/%252F/g, '/');
		var repoPath = segments[4];
		var fileDir = api.join(fileRoot, repoPath);
		var theRepo, theRemote, theBranch;
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
		.catch(function(err) {
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
//		remote.setCallbacks({
//			certificateCheck: function() {
//				return 1; // Continues connection even if SSL certificate check fails. 
//			}
//		});

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
	addRemote: addRemote,
	postRemote: postRemote,
	deleteRemote: deleteRemote
};