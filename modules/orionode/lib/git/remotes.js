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
var args = require('../args');
var async = require('async');
var git = require('nodegit');
var url = require('url');
var tasks = require('../tasks');
var clone = require('./clone');
var mConfig = require('./config');
var express = require('express');
var bodyParser = require('body-parser');
var util = require('./util');

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
	.delete('/:remoteName/file*', deleteRemote)
	.post('/file*', addRemote)
	.post('/:remoteName/file*', postRemote)
	.post('/:remoteName/:branchName/file*', postRemote);
	
function remoteBranchJSON(remoteBranch, commit, remote, fileDir, branch){
	var fullName, shortName, remoteURL;
	if (remoteBranch) {
		fullName = remoteBranch.name();
		shortName = remoteBranch.shorthand();
		var branchName = shortName.replace(remote.name() + "/", "");
		remoteURL = api.join(util.encodeURIComponent(remote.name()), util.encodeURIComponent(branchName));
	} else {// remote branch does not exists
		shortName = api.join(remote.name(), branch.Name);
		fullName = "refs/remotes/" + shortName;
		remoteURL = api.join(util.encodeURIComponent(remote.name()), util.encodeURIComponent(branch.Name));
	}
	return {
		"CloneLocation": "/gitapi/clone" + fileDir,
		"CommitLocation": "/gitapi/commit/" + util.encodeURIComponent(fullName) + fileDir,
		"DiffLocation": "/gitapi/diff/" + util.encodeURIComponent(shortName) + fileDir,
		"FullName": fullName,
		"GitUrl": remote.url(),
		"HeadLocation": "/gitapi/commit/HEAD" + fileDir,
		"Id": remoteBranch && commit ? commit.sha() : undefined,
		"IndexLocation": "/gitapi/index" + fileDir,
		"Location": "/gitapi/remote/" + remoteURL + fileDir,
		"Name": shortName,
		"TreeLocation": "/gitapi/tree" + fileDir + "/" + util.encodeURIComponent(shortName),
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
		"Location": "/gitapi/remote/" + util.encodeURIComponent(name) + fileDir,
		"Type": "Remote",
		"Children": branches
	};
}

function getRemotes(req, res) {
	var remoteName = util.decodeURIComponent(req.params.remoteName || "");
	var branchName = util.decodeURIComponent(req.params.branchName || "");
	var filter = req.query.filter;

	var fileDir, theRepo, theRemote;
	if (!remoteName && !branchName) {
		var repo;

		return clone.getRepo(req)
		.then(function(r) {
			repo = r;
			fileDir = clone.getfileDir(repo,req); 
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
			fileDir = clone.getfileDir(repo,req); 
			return repo.getRemote(remoteName);
		})
		.then(function(remote) {
			theRemote = remote;
			return git.Reference.list(theRepo);
		})
		.then(function(referenceList) {
			referenceList = referenceList.filter(function(ref) {
				if (ref.indexOf("refs/remotes/") === 0) {
					var shortname = ref.replace("refs/remotes/", "");
					if (shortname.indexOf(remoteName) === 0 && (!filter || shortname.indexOf(filter) !== -1)) {
						return true;
					}
				}
			});
			return Promise.all(referenceList.map(function(ref) {
				return git.Reference.lookup(theRepo, ref);
			}))
			.then(function(referenceList) {
				var branches = [];
				async.each(referenceList, function(ref, callback) {
					theRepo.getBranchCommit(ref)
					.then(function(commit) {
						branches.push(remoteBranchJSON(ref, commit, theRemote, fileDir));
						callback();
					}).catch(function(err) {
						callback(err);
					});
				}, function(err) {
					if (err) {
						return writeError(403, res);
					}
					res.status(200).json(remoteJSON(theRemote, fileDir, branches));
				});
			});
		});
	} 

	if (remoteName && branchName) {
		var theBranch;
		return clone.getRepo(req)
		.then(function(repo) {
			theRepo = repo;
			fileDir = clone.getfileDir(repo,req); 
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
	var fileDir, repo;
	
	if (!req.body.Remote || !req.body.RemoteURI) {
		return writeError(500, res);
	}

	return clone.getRepo(req)
	.then(function(_repo) {
		repo = _repo;
		fileDir = clone.getfileDir(repo,req); 
		return git.Remote.create(repo, req.body.Remote, req.body.RemoteURI);
	})
	.then(function(remote) {
		var remoteName = remote ? remote.name() : req.body.Remote;
		var configFile = api.join(repo.path(), "config");
		function done () {
			res.status(201).json({
				"Location": "/gitapi/remote/" + util.encodeURIComponent(remoteName) + fileDir
			});
		}
		args.readConfigFile(configFile, function(err, config) {
			if (err) {
				return done();
			}
			var remoteConfig = config.remote[remoteName] || (config.remote[remoteName] = {});
			if (!remoteConfig.url) {
				remoteConfig.url = req.body.RemoteURI;
			}
			if (!remoteConfig.fetch) remoteConfig.fetch = [];
			if (!Array.isArray(remoteConfig.fetch)) remoteConfig.fetch = [remoteConfig.fetch];
			if (req.body.IsGerrit) {
				remoteConfig.fetch.push("+refs/heads/*:refs/remotes/%s/for/*".replace(/%s/g, remoteName));
				remoteConfig.fetch.push("+refs/changes/*:refs/remotes/%s/*".replace(/%s/g, remoteName));
			} else {
				if (req.body.FetchRefSpec) {
					remoteConfig.fetch.push(req.body.FetchRefSpec);
				}
			}
			if (req.body.PushURI) {
				remoteConfig.pushurl = req.body.PushURI;
			}
			if (!remoteConfig.push) remoteConfig.push = [];
			if (!Array.isArray(remoteConfig.push)) remoteConfig.push = [remoteConfig.push];
			if (req.body.PushRefSpec) {
				remoteConfig.push.push(req.body.PushRefSpec);
			}
			args.writeConfigFile(configFile, config, function(err) {
				if (err) {
					// ignore errors
				}
				done();
			});
		});
	})
	.catch(function(err) {
		writeError(403, res, err.message);
	});
}

function postRemote(req, res) {
	if (req.body.Fetch === "true") {
		fetchRemote(req, res, util.decodeURIComponent(req.params.remoteName), util.decodeURIComponent(req.params.branchName || ""), req.body.Force);
	} else if (typeof req.body.PushSrcRef === "string") {
		pushRemote(req, res, util.decodeURIComponent(req.params.remoteName), util.decodeURIComponent(req.params.branchName || ""), req.body.PushSrcRef, req.body.PushTags, req.body.Force);
	} else {
		writeError(400, res);
	}
}

function fetchRemote(req, res, remote, branch, force) {
	var remoteObj;
	var task = new tasks.Task(res, false, true, 0, true);
	var repo;
	return clone.getRepo(req)
	.then(function(r) {
		repo = r;
		return git.Remote.lookup(repo, remote);
	})
	.then(function(r) {
		remoteObj = r;
		var refSpec = null;
		if (branch) {
			var remoteBranch = branch;
			if (branch.indexOf("for/") === 0) {
				remoteBranch = branch.substr(4);
			}
			refSpec = "refs/heads/" + remoteBranch + ":refs/remotes/" + remoteObj.name() + "/" + branch;
			if (force) refSpec = "+" + refSpec;
		}
		
		return remoteObj.fetch(
			refSpec ? [refSpec] : null,
			{
				callbacks: clone.getRemoteCallbacks(req.body, task),
				downloadTags: 3     // 3 = C.GIT_REMOTE_DOWNLOAD_TAGS_ALL (libgit2 const) 
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
		clone.handleRemoteError(task, err, remoteObj.url());
	});
}

function pushRemote(req, res, remote, branch, pushSrcRef, tags, force) {
	var repo;
	var remoteObj;
	
	//TODO disable pushing tags
	tags = false;
	
	var task = new tasks.Task(res, false, true, 0 ,true);	
	return clone.getRepo(req)
	.then(function(r) {
		repo = r;
		var work = [git.Remote.lookup(repo, remote)];
		if (tags) work.push(git.Reference.list(repo));
		return Promise.all(work);
	})
	.then(function(r) {
		remoteObj = r[0];
		var pushToGerrit = branch.indexOf("for/") === 0;
		var refSpec = pushSrcRef + ":" + (pushToGerrit ? "refs/" : "refs/heads/") + branch;
		if (force) refSpec = "+" + refSpec;
		var refSpecs = [];
		refSpecs.push(refSpec);
		if(tags){
			r[1].forEach(function(ref) {
				if (ref.indexOf("refs/tags/") === 0) {
					refSpecs.push(ref + ":" + ref);
				}			
			});
		}
		return remoteObj.push(
			refSpecs, {callbacks: clone.getRemoteCallbacks(req.body, task)}
		);
	})
	.then(function(err) {
		if (!err) {
			task.done({
				HttpCode: 200,
				Code: 0,
				DetailedMessage: "OK",
				Message: "OK",
				JsonData: {
					Message: "",
					Severity: "Ok",
					Updates: [{
						LocalName: req.body.PushSrcRef,
						RemoteName: remote + "/" + branch,
						Result: "UP_TO_DATE"
					}]
				},
				Severity: "Ok"
			});
		} else {
			throw new Error("Push failed.");
		}
	})
	.catch(function(err) {
		clone.handleRemoteError(task, err, remoteObj.url());
	});
}

function deleteRemote(req, res) {
	var remoteName = util.decodeURIComponent(req.params.remoteName);
	clone.getRepo(req)
	.then(function(repo) {
		var configFile = api.join(repo.path(), "config");
		args.readConfigFile(configFile, function(err, config) {
			if (err) {
				return writeError(403, res, err.message);
			}
			if (config.remote && config.remote[remoteName]) {
				delete config.remote[remoteName];
				args.writeConfigFile(configFile, config, function(err) {
					if (err) {
						return writeError(403, res, err.message);
					}
					res.status(200).end();
				});
			}
		});
	})
	.catch(function(err) {
		return writeError(400, res, err.message);
	});
}
};
