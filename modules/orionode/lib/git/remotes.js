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
var clone = require('./clone');
var express = require('express');
var bodyParser = require('body-parser');

module.exports = {};

module.exports.router = function(options) {
	var fileRoot = options.fileRoot;
	if (!fileRoot) { throw new Error('options.root is required'); }
	
	module.exports.remoteBranchJSON = remoteBranchJSON;
	module.exports.remoteJSON = remoteJSON;

	return express.Router()
	.use(bodyParser.json())
	.get('/file*', getRemotes)
	.get('/:remoteName/file*', getRemotes)
	.get('/:remoteName/:branchName/file*', getRemotes)
	.delete('/:remoteName*', deleteRemote)
	.post('/file*', addRemote)
	.post('/:remoteName/file*', postRemote)
	.post('/:remoteName/:branchName/file*', postRemote);
	
function remoteBranchJSON(remoteBranch, commit, remote, fileDir, branch){
	var fullName, shortName, remoteURL;
	if (remoteBranch) {
		fullName = remoteBranch.name();
		shortName = remoteBranch.shorthand();
		var branchName = shortName.replace(remote.name() + "/", "");
		remoteURL = api.join(encodeURIComponent(remote.name()), encodeURIComponent(branchName));
	} else {// remote branch does not exists
		shortName = api.join(remote.name(), branch.Name);
		fullName = "refs/remotes/" + shortName;
		remoteURL = api.join(encodeURIComponent(remote.name()), encodeURIComponent(branch.Name));
	}
	return {
		"CloneLocation": "/gitapi/clone" + fileDir,
		"CommitLocation": "/gitapi/commit/" + encodeURIComponent(fullName) + fileDir,
		"DiffLocation": "/gitapi/diff/" + encodeURIComponent(shortName) + fileDir,
		"FullName": fullName,
		"GitUrl": remote.url(),
		"HeadLocation": "/gitapi/commit/HEAD" + fileDir,
		"Id": remoteBranch && commit ? commit.sha() : undefined,
		"IndexLocation": "/gitapi/index" + fileDir,
		"Location": "/gitapi/remote/" + remoteURL + fileDir,
		"Name": shortName,
		"TreeLocation": "/gitapi/tree" + fileDir + "/" + encodeURIComponent(shortName),
		"Type": "RemoteTrackingBranch"
	};
}

function remoteJSON(remote, fileDir, branches) {
	var name = remote.name();
	return {
		"CloneLocation": "/gitapi/clone" + fileDir,
		"IsGerrit": false, // should check 
		"GitUrl": remote.url(),
		"Name": name,
		"Location": "/gitapi/remote/" + encodeURIComponent(name) + fileDir,
		"Type": "Remote",
		"Children": branches
	};
}

function getRemotes(req, res) {
	var remoteName = decodeURIComponent(req.params.remoteName || "");
	var branchName = decodeURIComponent(req.params.branchName || "");
	var filter = req.query.filter;

	var fileDir, theRepo, theRemote;
	if (!remoteName && !branchName) {
		var repo;

		return clone.getRepo(req)
		.then(function(r) {
			repo = r;
			fileDir = api.join(fileRoot, repo.workdir().substring(req.user.workspaceDir.length + 1));
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
				res.status(200).json({
					"Children": r,
					"Type": "Remote"
				});
			});
		});
	}

	if (remoteName && !branchName) {
		return clone.getRepo(req)
		.then(function(repo) {
			theRepo = repo;
			fileDir = api.join(fileRoot, repo.workdir().substring(req.user.workspaceDir.length + 1));
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
				res.status(200).json(remoteJSON(theRemote, fileDir, branches));
			});
		});
	} 

	if (remoteName && branchName) {
		var theBranch;
		return clone.getRepo(req)
		.then(function(repo) {
			theRepo = repo;
			fileDir = api.join(fileRoot, repo.workdir().substring(req.user.workspaceDir.length + 1));
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
			res.status(200).json(remoteBranchJSON(theBranch, commit, theRemote, fileDir));
		})
		.catch(function() {
			return writeError(403, res);
		});
	}
	return writeError(404, res);
}

function addRemote(req, res) {
	var fileDir;
	
	if (!req.body.Remote || !req.body.RemoteURI) {
		return writeError(500, res);
	}

	// It appears that the java server does not let you add a remote if
	// it doesn't have a protocol (it seems to check for a colon).
	var parsedUrl = url.parse(req.body.RemoteURI, true);

	if (!parsedUrl.protocol) {
		writeError(403, res);
	}

	return clone.getRepo(req)
	.then(function(repo) {
		fileDir = api.join(fileRoot, repo.workdir().substring(req.user.workspaceDir.length + 1));
		return git.Remote.create(repo, req.body.Remote, req.body.RemoteURI);
	})
	.then(function(remote) {
		res.status(201).json({
			"Location": "/gitapi/remote/" + encodeURIComponent(remote.name()) + fileDir
		});
	})
	.catch(function(err) {
		writeError(403, res, err.message);
	});
}

function postRemote(req, res) {
	if (req.body.Fetch === "true") {
		fetchRemote(req, res, decodeURIComponent(req.params.remoteName), decodeURIComponent(req.params.branchName || ""), req.body.Force);
	} else if (req.body.PushSrcRef) {
		pushRemote(req, res, decodeURIComponent(req.params.remoteName), decodeURIComponent(req.params.branchName || ""), req.body.PushSrcRef, req.body.PushTags, req.body.Force);
	} else {
		writeError(400, res);
	}
}

function fetchRemote(req, res, remote, branch, force) {
	var task = new tasks.Task(res);
	var repo;
	return clone.getRepo(req)
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

function pushRemote(req, res, remote, branch, pushSrcRef, tags, force) {
	var repo;
	var remoteObj;

	var task = new tasks.Task(res, false, false, 0);//TODO start task right away to work around bug in client code

	return clone.getRepo(req)
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

function deleteRemote(req, res) {
	var remoteName = decodeURIComponent(req.params.remoteName);
	return clone.getRepo(req)
	.then(function(repo) {
		return git.Remote.delete(repo, remoteName).then(function(resp) {
			if (!resp) {
				res.status(200).end();
			} else {
				writeError(403, res);
			}
		}).catch(function(error) {
			writeError(500, error);
		});
	});
}
};