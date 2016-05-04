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
/*eslint no-console:1*/
var api = require('../api'), writeError = api.writeError;
var git = require('nodegit');
var url = require("url");
var path = require("path");
var fs = require('fs');
var args = require('../args');
var async = require('async');
var fileUtil = require('../fileUtil');
var tasks = require('../tasks');
var express = require('express');
var bodyParser = require('body-parser');
var rmdir = require('rimraf');

module.exports = {};

module.exports.router = function(options) {
	var fileRoot = options.fileRoot;
	if (!fileRoot) { throw new Error('options.root is required'); }

	module.exports.getRepo = getRepo;
	module.exports.getClones = getClones;
	module.exports.getRemoteCallbacks = getRemoteCallbacks;
	module.exports.handleRemoteError = handleRemoteError;
	module.exports.foreachSubmodule = foreachSubmodule;

	return express.Router()
	.use(bodyParser.json())
	.get('/workspace*', getClone)
	.get('/file/:rootDir*', getClone)
	.put('/file*', putClone)
	.delete('/file*', deleteClone)
	.post('*', postInit);

function cloneJSON(base, location, giturl, parents, submodules) {
	var result = {
		"BranchLocation": "/gitapi/branch" + location,
		"CommitLocation": "/gitapi/commit" + location,
		"ConfigLocation": "/gitapi/config/clone" + location,
		"ContentLocation": location,
		"DiffLocation": "/gitapi/diff/Default" + location,
		"HeadLocation": "/gitapi/commit/HEAD" + location,
		"IndexLocation": "/gitapi/index" + location,
		"Location": "/gitapi/clone" + location,
		"Name": base,
		"GitUrl": giturl,
		"Children": submodules && submodules.length ? submodules : undefined,
		"Parents": parents && parents.length ? parents : undefined,
		"RemoteLocation": "/gitapi/remote" + location,
		"StashLocation": "/gitapi/stash" + location,
		"StatusLocation": "/gitapi/status" + location,
		"SubmoduleLocation": "/gitapi/submodule" + location,
		"TagLocation": "/gitapi/tag" + location,
		"Type": "Clone"
	};
	if (isGithubURL(giturl)){
		result["PullRequestLocation"] = "/gitapi/pullRequest" + location;
	}
	function isGithubURL(checkUrl){
		var hostname = url.parse(checkUrl)["hostname"];
		return hostname === "github.com";
	}
	return result;
}
	
function getRepo(req) {
	var u = url.parse(req.url, true);
	var restpath = u.pathname.split(fileRoot)[1];
	if (!restpath) return Promise.reject(new Error("Forbidden"));
	var p = path.join(req.user.workspaceDir, restpath);
	while (!fs.existsSync(p)) {
		p = path.dirname(p);
		if (p.length <= req.user.workspaceDir) return Promise.reject(new Error("Forbidden"));
	}
	return git.Repository.discover(p, 0, req.user.workspaceDir).then(function(buf) {
		return git.Repository.open(buf.toString());
	});
}

function getClone(req, res) {
	getClones(req, res, function(repos) {
		res.status(200).json({
			"Children": repos,
			"Type": "Clone"
		});
	});
}

function getClones(req, res, callback) {
	var repos = [];
	
	var rootDir = path.join(req.user.workspaceDir, req.params.rootDir || "");
		
	checkDirectory(rootDir, function(err) {
		if (err) return writeError(403, res, err.message);
		callback(repos);
	});
	
	function pushRepo(repos, repo, base, location, url, parents, cb) {
		Promise.all([url || getURL(repo), getSubmodules(repo, location, parents.slice(0).concat(["/gitapi/clone" + location]))]).then(function(results) {
			var json = cloneJSON(base, location, results[0], parents, results[1]);
			repos.push(json);
			cb(json);
		});
	}
	
	function getSubmodules(repo, location, parents) {
		return new Promise(function(fulfill) {
			var modules = [];
			return repo.getSubmoduleNames()
			.then(function(names) {
				async.each(names, function(name, callback) {
					git.Submodule.lookup(repo, name)
					.then(function(submodule) {
						var status, subrepo;
						var sublocation = api.join(location, submodule.path());
						function done(json, unitialized) {
							json.SubmoduleStatus = {
								Type: unitialized || status & git.Submodule.STATUS.WD_UNINITIALIZED || subrepo.isEmpty() ?
									"UNINITIALIZED" : "INITIALIZED",
								HeadSHA: submodule.headId() ? submodule.headId().toString() : "",
								Path: submodule.path()
							};
							callback();
						}
						git.Submodule.status(repo, submodule.name(), -1)
						.then(function(_status) {
							status = _status;
							return submodule.open();
						})
						.then(function(_subrepo) {
							subrepo = _subrepo;
							pushRepo(modules, subrepo, name, sublocation, submodule.url(), parents, done);
						}).catch(function() {
							var json = cloneJSON(name, sublocation, submodule.url(), parents);
							modules.push(json);
							done(json, true || subrepo.isEmpty());
						});
					}).catch(function() {
						callback();
					});
				}, function() {
					fulfill(modules);
				});
			});
		});
	}
	
	function getURL(repo) {
		return new Promise(function(fulfill) {
			repo.getRemotes()
			.then(function(remotes){
				var url;
				async.each(remotes, function(remote, callback) {
					if (remote === "origin") {
						repo.getRemote(remote)
						.then(function(remote){
							url = remote.url();
							callback();
						}).catch(function() {
							callback();
						});
					} else {
						callback();
					}
				}, function() {
					return fulfill(url);	
				});
			});
		});
	}

	function checkDirectory(dir, cb) {
		//Check if the dir is a directory
		fs.lstat(dir, function(err, stat) {
			if (err || !stat.isDirectory()) return cb(err);
			git.Repository.open(dir)
			.then(function(repo) {
				var base = path.basename(dir);
				var location = api.join(fileRoot, repo.workdir().substring(req.user.workspaceDir.length + 1));
				pushRepo(repos, repo, base, location, null, [], function() { cb(); });
	 		})
			.catch(function() {
				fs.readdir(dir, function(err, files) {
					if (err) {
						return cb(err);
					}
					files = files.map(function(file) {
						return path.join(dir, file);
					});
					async.each(files, checkDirectory, cb);
				});
			});
		});
	}
}

function configRepo(repo, username, email) {
	var configFile = api.join(repo.path(), "config");
	return new Promise(function(fulfill, reject) {
		args.readConfigFile(configFile, function(err, config) {
			if (err) {
				return reject(err);
			}
			var user = config.user || (config.user = {});
			//TODO read user prefs if no username/email is specified -> git/config/userInfo (GitName && GitEmail)
			if (username) {
				user.name = username;
			}
			if (email) {
				user.email = email;
			}
			args.writeConfigFile(configFile, config, function(err) {
				if (err) {
					return reject(err);
				}
				fulfill();
			});
		});
	});
}

function postInit(req, res) {
	if (req.body.GitUrl) {
		postClone(req, res);
	} else {
		var initDir = req.user.workspaceDir + '/' + req.body.Name;
		var theRepo, index, author, committer;

		fs.mkdir(initDir, function(err){
			if (err) {
				return writeError(409, res);
			}

			git.Repository.init(initDir, 0)
			.then(function(repo) {
				theRepo = repo;
				return configRepo(repo, req.body.GitName, req.body.GitMail);
			})
			.then(function(){
				return theRepo.openIndex();
			})
			.then(function(idx) {
				index = idx;
				index.read(1);
			})
			.then(function() {
				return index.writeTree();
			})
			.then(function(oid) {
				author = git.Signature.default(theRepo);	
				committer = git.Signature.default(theRepo);

				// Since we're creating an inital commit, it has no parents. Note that unlike
				// normal we don't get the head either, because there isn't one yet.
				return theRepo.createCommit("HEAD", author, committer, "Initial commit", oid, []);
			})
			.then(function() {
				res.status(201).json({
					"Location": "/gitapi/clone/file/" + req.body.Name
				});
			})
			.catch(function(err){
				console.log(err);
				writeError(403, res);
			});

		});
	}
}

function putClone(req, res) {
	var paths = req.body.Path;
	var branch = req.body.Branch;
	var tag = req.body.Tag;
	var removeUntracked = req.body.RemoveUntracked;
	if ((!paths || !paths.length) && !branch && !tag) {
		return writeError(400, "Invalid parameters");
	}

	var theRepo, theCommit;
	var checkOptions = {
		checkoutStrategy: git.Checkout.STRATEGY.SAFE,
	};
	getRepo(req)
	.then(function(repo) {
		theRepo = repo;
		if (paths) {
			checkOptions.paths = paths;
			checkOptions.checkoutStrategy = git.Checkout.STRATEGY.FORCE;
			var toRemove = [];
			return repo.index()
			.then(function(index) {
				if (!removeUntracked) return;
				paths.forEach(function(path) {
					if (!index.getByPath(path)) toRemove.push(path);
				});
			})
			.then(function() {
				return git.Checkout.head(theRepo, checkOptions);
			})
			.then(function() {
				return Promise.all(toRemove.map(function(p) {
					return new Promise(function(fulfill, reject) {
						var filepath = api.join(repo.workdir(), p);
						fileUtil.withStats(filepath, function(error, stats) {
							if (error) return reject();
							function done(err) {
								if (err) reject();
								fulfill();
							}
							if (stats.isDirectory()) {
								fileUtil.rumRuff(filepath, done);
							} else {
								fs.unlink(filepath, done);
							}
						});
					});
				}));
			});
		} else if (tag && typeof branch === "string") {
			return git.Reference.lookup(theRepo, "refs/tags/" + tag)
			.then(function(reference) {
				return theRepo.getReferenceCommit(reference);
			}).catch(function() {
				return theRepo.getCommit(tag);
			})
			.then(function(commit) {
				theCommit = commit;
				if (branch) {
					return git.Branch.create(theRepo, branch, commit, 0).then(function() {
						return theRepo.checkoutBranch(branch, checkOptions);
					});
				}
			 	return git.Checkout.tree(theRepo, commit, checkOptions).then(function() {
					return theRepo.setHeadDetached(theCommit);
				});
			});
		}
		return theRepo.checkoutBranch(branch, checkOptions);
	})
	.then(function(){
		res.status(200).end();
	})
	.catch(function(err){
		writeError(403, res, err.message);
	});
}

function deleteClone(req, res) {
	var clonePath = req.params["0"];
	rmdir(fileUtil.safeFilePath(req.user.workspaceDir, clonePath), function(err) {
		if (err) return writeError(500, res, err);
		res.status(200).end();
	});
}

function foreachSubmodule(repo, operation, recursive) {
	return repo.getSubmoduleNames()
	.then(function(names) {
		return new Promise(function(fulfill, reject) {
			async.series(names.map(function(name) {
				return function(cb) {
					git.Submodule.lookup(repo, name)
					.then(function(submodule) {
						var op;
						if (operation === "sync") {
							op = submodule.sync();
						} else if (operation === "update") {
							op = submodule.init(1)
							.then(function() {
								return submodule.update(1, new git.SubmoduleUpdateOptions());
							});
						}
						return op
						.then(function() {
							if (recursive) {
								return submodule.open()
								.then(function(subrepo) {
									return foreachSubmodule(subrepo, operation, recursive);
								});
							}
						});
					})
					.then(function() {
						cb();
					})
					.catch(function(err) {
						cb(err);
					});
				};
			}), function(err) {
				if (err) {
					reject(err);
				} else {
					fulfill();
				}
			});
		});
	});
}

function getRemoteCallbacks(creds, task) {
	return {
		certificateCheck: function() {
			return 1; // Continues connection even if SSL certificate check fails. 
		},
		//TODO performance is bad
//		transferProgress: function(progress) {
//			if (!task) return;
//			if (progress.indexedDeltas()) {
//				task.updateProgress("Resolving Deltas", progress.indexedDeltas(), progress.totalDeltas());
//			} else {
//				task.updateProgress("Receiving Objects", progress.receivedObjects(), progress.totalObjects());
//			}
//		},
		credentials: function() {
			if (!creds.GitSshUsername && !creds.GitSshPrivateKey) {
				return git.Cred.defaultNew();
			}
			if (creds.GitSshPrivateKey) {
				var privateKey = creds.GitSshPrivateKey;
				var passphrase = creds.GitSshPassphrase;
				return git.Cred.sshKeyMemoryNew(
					creds.GitSshUsername,
					"",
					privateKey,
					passphrase || ""
				);
			}
			var username = creds.GitSshUsername;
			var password = creds.GitSshPassword;
			// clear username/password to avoid inifinite loop in nodegit
			delete creds.GitSshUsername;
			delete creds.GitSshPassword;
			return git.Cred.userpassPlaintextNew(
				username,
				password
			);
		}
	};
}

function handleRemoteError(task, err, cloneUrl) {
	var u = url.parse(cloneUrl, true);
	var code = 403;
	var jsonData;
	if (err.message && ["credentials", "401"].some(function(s) { return err.message.indexOf(s) !== -1; })) {
		code = 401;
		jsonData = {
			"Host": u.hostname,
			"HumanishName": u.pathname.substring(u.pathname.lastIndexOf("/") + 1).replace(".git", ""),
			"Port": u.port,
			"Scheme": u.protocol.replace(":", ""),
			"Url": cloneUrl,
			"User": u.auth
		};
	}
	task.done({
		HttpCode: code,
		Code: 0,
		JsonData: jsonData,
		DetailedMessage: err.message,
		Message: err.message,
		Severity: "Error"
	});
}

function getUniqueFileName(folder, file) {
	var result, counter = 0, name = file;
	do {
		result = path.join(folder, name);
		name = file + "-" + ++counter;
	} while (fs.existsSync(result));
	return result;
}

function postClone(req, res) {
	var repo;
	var cloneUrl = req.body.GitUrl;
	var dirName = cloneUrl.substring(cloneUrl.lastIndexOf("/") + 1).replace(".git", "");
	var folder = req.user.workspaceDir;
	if (req.body.Path) {
		folder = path.join(folder, req.body.Path.substring(fileRoot.length));
	}
	
	var task = new tasks.Task(res, false, true);
	
	git.Clone.clone(cloneUrl, getUniqueFileName(folder, dirName), {
		fetchOpts: {
			callbacks: getRemoteCallbacks(req.body, task)
		}
	})
	.then(function(_repo) {
		repo = _repo;
		return configRepo(repo, req.body.GitName, req.body.GitMail);
	})
	.then(function(repo) {
		if (req.body.cloneSubmodules) {
			return foreachSubmodule(repo, "update", true);
		}
	})
	.then(function() {
		task.done({
			HttpCode: 200,
			Code: 0,
			DetailedMessage: "OK",
			JsonData: {
				Location: "/gitapi/clone" + fileRoot + "/" + dirName
			},
			Message: "OK",
			Severity: "Ok"
		});
	})
	.catch(function(err) {
		handleRemoteError(task, err, cloneUrl);
	});
}
};
