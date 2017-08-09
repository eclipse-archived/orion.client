/*******************************************************************************
 * Copyright (c) 2012, 2017 IBM Corporation and others.
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
var api = require('../api'), writeError = api.writeError, writeResponse = api.writeResponse;
var git = require('nodegit');
var url = require("url");
var path = require("path");
var fs = require('fs');
var args = require('../args');
var async = require('async');
var fileUtil = require('../fileUtil');
var util = require('./util');
var tasks = require('../tasks');
var express = require('express');
var bodyParser = require('body-parser');
var rmdir = require('rimraf');
var credentialsProvider = require('./credentials');

module.exports = {};

module.exports.router = function(options) {
	var fileRoot = options.fileRoot;
	var gitRoot = options.gitRoot;
	var workspaceRoot = options.workspaceRoot;
	if (!fileRoot) { throw new Error('options.fileRoot is required'); }
	if (!gitRoot) { throw new Error('options.gitRoot is required'); }
	if (!workspaceRoot) { throw new Error('options.workspaceRoot is required'); }
	
	/* Note that context path was not included in file and workspace root. */
	var contextPath = options && options.options && options.options.configParams["orion.context.path"] || "";
	
	module.exports.getRepo = getRepo;
	module.exports.getClones = getClones;
	module.exports.getRemoteCallbacks = getRemoteCallbacks;
	module.exports.handleRemoteError = handleRemoteError;
	module.exports.foreachSubmodule = foreachSubmodule;
	module.exports.getRepoByPath = getRepoByPath;
	module.exports.getfileDir = getfileDir;
	module.exports.getfileDirPath = getfileDirPath;
	module.exports.getfileAbsolutePath = getfileAbsolutePath;
	module.exports.getfileRelativePath = getfileRelativePath;
	module.exports.getUniqueFileName = getUniqueFileName;
	module.exports.getSignature = getSignature;
	module.exports.getCommit = getCommit;
	module.exports.postClone = postClone;

	return express.Router()
	.use(bodyParser.json())
	.get(workspaceRoot + '*', getClone)
	.get(fileRoot + '*', getClone)
	.put(fileRoot + '*', putClone)
	.delete(fileRoot + '*', deleteClone)
	.post('*', postInit);

function cloneJSON(base, location, giturl, parents, submodules) {
	var result = {
		"BranchLocation": gitRoot + "/branch" + location,
		"CommitLocation": gitRoot + "/commit" + location,
		"ConfigLocation": gitRoot + "/config/clone" + location,
		"ContentLocation": contextPath + location,
		"DiffLocation": gitRoot + "/diff/Default" + location,
		"HeadLocation": gitRoot + "/commit/HEAD" + location,
		"IndexLocation": gitRoot + "/index" + location,
		"Location": gitRoot + "/clone" + location,
		"Name": base,
		"GitUrl": giturl,
		"Children": submodules && submodules.length ? submodules : undefined,
		"Parents": parents && parents.length ? parents : undefined,
		"RemoteLocation": gitRoot + "/remote" + location,
		"StashLocation": gitRoot + "/stash" + location,
		"StatusLocation": gitRoot + "/status" + location,
		"SubmoduleLocation": gitRoot + "/submodule" + location,
		"TagLocation": gitRoot + "/tag" + location,
		"Type": "Clone"
	};
	if (giturl && isGithubURL(giturl)){
		result["PullRequestLocation"] = gitRoot + "/pullRequest" + location;
	}
	function isGithubURL(checkUrl){
		if (checkUrl.indexOf("@") < checkUrl.indexOf(":")){
 			checkUrl = "ssh://" + checkUrl;
 		}
		var hostname = url.parse(checkUrl)["hostname"];
		return hostname === "github.com";
	}
	return result;
}
	
function getRepoByPath(filePath, workspaceDir) {
	filePath = util.decodeURIComponent(filePath);
	while (!fs.existsSync(filePath)) {
		filePath = path.dirname(filePath);
		if (filePath.length <= workspaceDir.length) return Promise.reject(new Error("Forbidden"));
	}
 	var ceiling = path.dirname(workspaceDir);
	if (!fs.statSync(filePath).isDirectory()) {
		// get the parent folder if pointing at a file
		filePath = path.dirname(filePath);
	}
	return git.Repository.discover(filePath, 0, ceiling).then(function(buf) {
		return git.Repository.open(buf.toString());
	});
}	
	
function getRepo(req) {
	var u = url.parse(req.url, true);
	var restpath = u.pathname.split(fileRoot)[1] || "";
	var file = fileUtil.getFile(req, restpath);
	req.file = file;
	return getRepoByPath(file.path, file.workspaceDir);
}

function getfileDir(repo, req) {
	var fileDir;
	var file = req.workspaceDir ? req : req.file;
	if (repo.workdir().slice(0, -1).length === file.workspaceDir.length) {
		fileDir = api.join(fileRoot, file.workspaceId);
	} else {
		fileDir = api.join(fileRoot, file.workspaceId, repo.workdir().substring(file.workspaceDir.length + 1));
	}
	return fileDir;
}

function getfileDirPath(repo, req) {
	var fileDirpath;
	var file = req.workspaceDir ? req : req.file;
	if(repo.workdir().slice(0, -1).length === file.workspaceDir.length){
		fileDirpath = path.join(fileRoot, path.sep);
	}else{
		fileDirpath = path.join(fileRoot, file.workspaceId, repo.workdir().substring(file.workspaceDir.length + 1));
	}
	return fileDirpath;
}

function getfileAbsolutePath(req) {
	return fileUtil.getFile(req, req.params["0"] || "").path;
}

function getfileRelativePath(repo, req) {
	var fileRelativePath = api.toURLPath(getfileAbsolutePath(req).substring(repo.workdir().length));
	return fileRelativePath;
}

function getCommit(repo, refOrCommit) {
	return git.Reference.dwim(repo, refOrCommit).then(function(reference) {
		if (reference.isTag()) {
			return repo.getTagByName(reference.shorthand())
			.then(function(tag){
				return repo.getCommit(tag.targetId());
			})
			.catch(function() {
				return repo.getReferenceCommit(reference);
			});
		}
		return repo.getReferenceCommit(reference);
	})
	.catch(function() {
		return repo.getCommit(refOrCommit);
	});
}

function getClone(req, res) {
	getClones(req, res, function(repos) {
		writeResponse(200, res, null, {
			"Children": repos,
			"Type": "Clone"
		}, true);
	});
}

function getClones(req, res, callback) {
	var repos = [];
	
	var rest = req.params["0"].substring(1);
	var file = fileUtil.getFile(req, rest);
	var rootDir = file.path;
		
	checkDirectory(rootDir, function(err) {
		if (err) return writeError(403, res, err.message);
		callback(repos);
	});
	
	function pushRepo(repos, repo, base, location, url, parents, cb) {
		Promise.all([url || getURL(repo), getSubmodules(repo, location, parents.slice(0).concat([gitRoot + "/clone" + location]))]).then(function(results) {
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
				var location = getfileDir(repo, file);
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

function getClonePath(req) {
	var workspacePath = req.body.Location;
	var filePath = req.body.Path;
	if (filePath && filePath.split("/").length < 3) {
		filePath = undefined;
	}
	var file, rest;
	var contextPathSegCount = (req.contextPath || "").split("/").length - 1;
	if (filePath) {
		rest = filePath.split("/").slice(2 + contextPathSegCount).join("/");
		file = fileUtil.getFile(req, rest);
	} else if (workspacePath) {
		rest = workspacePath.split("/").slice(2).join("/");
		file = fileUtil.getFile(req, rest);
		if (file) {
			var cloneName = req.body.Name;
			var cloneUrl = req.body.GitUrl;
			if (!cloneName && cloneUrl) {
				if (cloneUrl.charAt(cloneUrl.length - 1) === "/") {
					cloneUrl = cloneUrl.slice(0, -1);
				}	
				cloneName = cloneUrl.substring(cloneUrl.lastIndexOf("/") + 1).replace(".git", "");
			}
			if (!cloneName) return null;
			file.path = getUniqueFileName(file.path, cloneName);
		}
	}
	return file;
}

function postInit(req, res) {
	if (req.body.GitUrl) {
		postClone(req, res);
	} else {
		var file = getClonePath(req);
		if (!file) {
			return writeError(400, res, "Invalid parameters");
		}
		
		var theRepo, index, author, committer;

		fs.mkdir(file.path, function(err) {
			if (err && err.code !== "EEXIST") {
				return writeError(400, res);
			}

			git.Repository.init(file.path, 0)
			.then(function(repo) {
				theRepo = repo;
				return configRepo(repo, req.body.GitName, req.body.GitMail);
			})
			.then(function(){
				return theRepo.refreshIndex();
			})
			.then(function(idx) {
				index = idx;
				return index.writeTree();
			})
			.then(function(oid) {
				author = getSignature(theRepo);	
				committer = getSignature(theRepo);	

				// Since we're creating an inital commit, it has no parents. Note that unlike
				// normal we don't get the head either, because there isn't one yet.
				return theRepo.createCommit("HEAD", author, committer, "Initial commit", oid, []);
			})
			.then(function() {
				writeResponse(201, res, null, {
					"Location": gitRoot + "/clone" + fileRoot + "/" + file.workspaceId + api.toURLPath(file.path.substring(file.workspaceDir.length))
				}, true);
			})
			.catch(function(err){
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
		return writeError(400, res, "Invalid parameters");
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
				return reference.peel(git.Object.TYPE.COMMIT);
			}).then(function(oid) {
				return theRepo.getCommit(oid);
			}).catch(function(err) {
				return theRepo.getTagByName(tag)
				.then(function(tag) {
					return tag.targetId();
				})
				.then(function(commitOid){
					return theRepo.getCommit(commitOid);
				}).catch(function(){
					return theRepo.getCommit(tag);
				});
			})
			.then(function(commit) {
				theCommit = commit;
				if (branch) {
					return git.Branch.create(theRepo, branch, commit, 0).then(function() {
						return theRepo.checkoutBranch("refs/heads/" + branch, checkOptions);
					});
				}
			 	return git.Checkout.tree(theRepo, commit, checkOptions).then(function() {
					return theRepo.setHeadDetached(theCommit);
				});
			});
		}
		return theRepo.checkoutBranch("refs/heads/" + branch, checkOptions);
	})
	.then(function(){
		writeResponse(200, res);
	})
	.catch(function(err){
		writeError(403, res, err.message);
	});
}

function deleteClone(req, res) {
	var rest = req.params["0"];
	var file = fileUtil.getFile(req, rest);
	rmdir(file.path, function(err) {
		if (err) return writeError(500, res, err);
		writeResponse(200, res);
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

function getRemoteCallbacks(req, task) {
	return {
		certificateCheck: function() {
			return 1; // Continues connection even if SSL certificate check fails. 
		},
		transferProgress: function(progress) {
			if (!task) return;
			if (progress.indexedDeltas()) {
				task.updateProgress("Resolving deltas", progress.indexedDeltas(), progress.totalDeltas());
			} else {
				task.updateProgress("Receiving objects", progress.receivedObjects(), progress.totalObjects());
			}
		},
		/**
		 * @callback
		 */
		credentials: function(gitUrl, urlUsername) {
			var creds = req.body;
			if (creds.GitSshPrivateKey) {
				var privateKey = creds.GitSshPrivateKey;
				var passphrase = creds.GitSshPassphrase;
				return git.Cred.sshKeyMemoryNew(
					creds.GitSshUsername || urlUsername,
					"",
					privateKey,
					passphrase || ""
				);
			}

			var username = creds.GitSshUsername || urlUsername;
			var password = creds.GitSshPassword;
			if (username && password) {
				/* clear username/password to avoid inifinite loop in nodegit */
				delete creds.GitSshUsername;
				delete creds.GitSshPassword;
				return git.Cred.userpassPlaintextNew(
					username,
					password || ""
				);
			}

			return new Promise(function(resolve, reject) {
				credentialsProvider.getCredentials(gitUrl, req.user.username).then(
					function(result) {
						resolve(result);
					},
					function(error) {
						resolve(git.Cred.defaultNew());
					}
				);
			});
		}
	};
}

function handleRemoteError(task, err, cloneUrl) {
	var fullCloneUrl;
	if (cloneUrl.indexOf("://") !== -1){
		fullCloneUrl = cloneUrl;
	} else if (cloneUrl.indexOf("@") < cloneUrl.indexOf(":")){
		fullCloneUrl = "ssh://" + cloneUrl;
	}
	var u = url.parse(fullCloneUrl, true);
	var code = 403;
	var jsonData;
	if (err.message && ["credentials", "authentication", "401"].some(function(s) { return err.message.indexOf(s) !== -1; })) {
		code = 401;
		jsonData = {
			"Host": u.hostname,
			"HumanishName": u.pathname.substring(u.pathname.lastIndexOf("/") + 1).replace(".git", ""),
			"Port": u.port,
			"Scheme": u.protocol && u.protocol.replace(":", ""),
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
	
	var file = getClonePath(req);
	if (!file) {
		return writeError(400, res, "Invalid parameters");
	}
	
	var task = new tasks.Task(res, false, true, 0, true);
	
	return git.Clone.clone(cloneUrl, file.path, {
		fetchOpts: {
			callbacks: getRemoteCallbacks(req, task)
		}
	})
	.then(function(_repo) {
		repo = _repo;
		return configRepo(repo, req.body.GitName, req.body.GitMail);
	})
	.then(function() {
		// default to true if parameter not set
		if (req.body.cloneSubmodules === undefined || req.body.cloneSubmodules === null || req.body.cloneSubmodules) {
			return foreachSubmodule(repo, "update", true);
		}
	})
	.then(function() {
		task.done({
			HttpCode: 200,
			Code: 0,
			DetailedMessage: "OK",
			JsonData: {
				Location: gitRoot + "/clone" + fileRoot + "/" + file.workspaceId + api.toURLPath(file.path.substring(file.workspaceDir.length))
			},
			Message: "OK",
			Severity: "Ok"
		});
	})
	.catch(function(err) {
		handleRemoteError(task, err, cloneUrl);
	});
}

function getSignature(repo){
	return git.Signature.default(repo) || git.Signature.now("unknown","unknown@example.com");
}
};
