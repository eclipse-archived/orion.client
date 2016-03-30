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
var git = require('nodegit');
var url = require('url');
var api = require('../api'), writeError = api.writeError;
var clone = require('./clone');
var fs = require('fs');
var path = require('path');
var mDiff = require('diff');
var request = require('request');
var multiparty = require('multiparty');
var express = require('express');
var bodyParser = require('body-parser');
var util = require('./util');

module.exports = {};

module.exports.router = function(options) {
	var fileRoot = options.fileRoot;
	if (!fileRoot) { throw new Error('options.root is required'); }

	module.exports.changeType = changeType;

	return express.Router()
	.use(bodyParser.json())
	.get('/file*', getDiff)
	.get('/:scope/file*', getDiff)
	.post('/:scope/file*', postDiff);

function getDiff(req, res) {
	var query = req.query;
	var parts = (query.parts || "").split(",");
	var paths = query.Path;
	var scope = util.decodeURIComponent(req.params.scope || "");
	var filePath = path.join(req.user.workspaceDir, req.params["0"]);
	
	var diff, repo;
	return clone.getRepo(req)
	.then(function(r) {
		repo = r;
		filePath = api.toURLPath(filePath.substring(repo.workdir().length));
		var fileDir = api.toURLPath(path.join(fileRoot, repo.workdir().substring(req.user.workspaceDir.length + 1)));
		if (scope.indexOf("..") !== -1) {
			diff = getDiffBetweenTwoCommits(repo, scope.split(".."));
		} else if (scope === "Default") {
			diff = getDiffBetweenWorkingTreeAndHead(repo);
		} else if (scope === "Cached") {
			diff = getDiffBetweenIndexAndHead(repo);
		} else {
			diff = getDiffBetweenWorkingTreeAndHead(repo);
		}
		return diff
		.then(function(diff) {
			processDiff(diff, filePath, paths, fileDir, req, res, parts.indexOf("diff") !== -1, parts.indexOf("uris") !== -1, parts.indexOf("diffs") !== -1, query, scope);
		});
	})
	.catch(function(err) {
		writeError(404, res, err.message);
	});
}

function changeType(patch) {
	if (patch.isAdded()) return "Added";
	if (patch.isDeleted()) return "Removed";
	if (patch.isModified()) return "Changed";
	return "";
}

function getOldLocation(scope, path) {
	if (scope.indexOf("..") !== -1) {
		var commits = scope.split("..");
		return "/gitapi/commit/" + util.encodeURIComponent(commits[0]) + path + "?parts=body";
	} else if (scope === "Cached") {
		return "/gitapi/commit/HEAD" + path + "?parts=body";
	} else if (scope === "Default") {
		return "/gitapi/index" + path;
	}
	return "/gitapi/commit/" + util.encodeURIComponent(scope) + path + "?parts=body";
}

function getNewLocation(scope, path) {
	if (scope.indexOf("..") !== -1) {
		var commits = scope.split("..");
		return "/gitapi/commit/" + util.encodeURIComponent(commits[1]) + path + "?parts=body";
	} else if (scope === "Cached") {
		return "/gitapi/index" + path;
	}
	return path;
}

function getBaseLocation(scope, path) {
	if (scope.indexOf("..") !== -1) {
		var commits = scope.split("..");
		//TODO find merge base
		return "/gitapi/commit/" + util.encodeURIComponent(commits[1]) + path + "?parts=body";
	} else if (scope === "Cached") {
		return "/gitapi/commit/HEAD" + path + "?parts=body";
	}
	return "/gitapi/index" + path;
}

function processDiff(diff, filePath, paths, fileDir, req, res, includeDiff, includeURIs, includeDiffs, query, scope) {
	var page = Number(query.page) || 1;
	var pageSize = Number(query.pageSize) || Number.MAX_SAFE_INTEGER;
	var URIs = [], diffContents = [], diffs = [], patches = [], i;
	diff.patches()
	.then(function(patches) {
		var result = [];
		var start = pageSize * (page - 1);
		var end = Math.min(pageSize + start, patches.length);
		i = start;
		patches.forEach(function(patch, pi) {
			var newFile = patch.newFile();
			var newFilePath = newFile.path();
			var oldFile = patch.oldFile();
			var oldFilePath = oldFile.path();
			if ((!filePath || newFilePath.startsWith(filePath)) && (!paths || paths.indexOf(newFilePath) !== -1)) {
				patches.push(patch);
				
				if (includeURIs) {
					var p = api.toURLPath(path.join(fileDir, newFilePath));
					URIs.push({
						"Base": getBaseLocation(scope, p),
						"CloneLocation": "/gitapi/clone" + fileDir,
						"Location": "/gitapi/diff/" + util.encodeURIComponent(scope) + fileDir + filePath,
						"New": getNewLocation(scope, p),
						"Old": getOldLocation(scope, p),
						"Type": "Diff"
					});
				}
				
				if (includeDiffs && (start <= pi && pi < end)) {
					i = pi;
					var type = changeType(patch);
					var p1 = api.toURLPath(path.join(fileDir, type !== "Deleted" ? newFilePath : oldFilePath));
					diffs.push({
						"ChangeType": type,
						"ContentLocation": p1,
						"DiffLocation": "/gitapi/diff/" + util.encodeURIComponent(scope) + p1,
						"NewPath": newFilePath,
						"OldPath": oldFilePath,
						"Type": "Diff"
					});
				}
		
				if (includeDiff) {
					var buffer = [];
					buffer.push("diff --git a/" + oldFilePath + " b/" + newFilePath + "\n");
					buffer.push("index " + oldFile.id().toString().substring(0, 7) + ".." + newFile.id().toString().substring(0, 7) + " " + newFile.mode().toString(8) + "\n");
					buffer.push("--- a/" + oldFilePath + "\n");
					buffer.push("+++ b/" + newFilePath + "\n"); 
		
					result.push(patch.hunks()
					.then(function(hunks) {
						var lresult = [];
						hunks.forEach(function(hunk) {
							lresult.push(hunk.lines()
							.then(function(lines) {
								buffer.push(hunk.header());
								lines.forEach(function(line) {
									var prefix = " ";
									switch(line.origin()) {
										case git.Diff.LINE.ADDITION:
											prefix = "+";
											break;
										case git.Diff.LINE.DELETION:
											prefix = "-";
											break;
										case git.Diff.LINE.DEL_EOFNL:
											prefix = "\\ No newline at end of file";
											break;
										case git.Diff.LINE.ADD_EOFNL:
											prefix = "\\ No newline at end of file";
											break;
									}
									var content = line.content();
									var index = content.indexOf("\n");
									if (index !== -1) content = content.substring(0, index  + 1); 
									buffer.push(prefix + content);
								});
							}));
						});
						return Promise.all(lresult).then(function() {
							diffContents.push(buffer.join(""));
						});
					}));
				}
			}
		});
		return Promise.all(result);
	})
	.done(function() {
		var body = "";
		if (includeDiff && includeURIs) {
			body += "--BOUNDARY\n";
			body += "Content-Type: application/json\n\n";
			body += JSON.stringify(URIs[0]);
			body += "--BOUNDARY\n";
			body += "Content-Type: plain/text\n\n";
			body += diffContents.join("");
			res.setHeader('Content-Type', 'multipart/related; boundary="BOUNDARY"');
		} else if (includeDiff) {
			body += diffContents.join("");
			res.setHeader("Cache-Control", "no-cache");
			res.setHeader("Content-Disposition", "attachment; filename=\"changes.patch\"");
			res.setHeader('Content-Type', 'plain/text');
		} else if (includeDiffs) {
			var result = {
				"Type": "Diff",
				"Length": patches.length,
				"Children": diffs
			};
			if (i < patches.length) {
				result.NextLocation = "";
			}
			body += JSON.stringify(result);
			res.setHeader('Content-Type', 'application/json');
		} else if (includeURIs) {
			body += JSON.stringify(URIs[0]);
			res.setHeader('Content-Type', 'application/json');
		}
		res.setHeader('Content-Length', body.length);
		return res.status(200).end(body);
	});
}

function getDiffBetweenWorkingTreeAndHead(repo) {
	return git.Diff.indexToWorkdir(repo, null, {
		flags: 
			git.Diff.OPTION.SHOW_UNTRACKED_CONTENT |
			git.Diff.OPTION.INCLUDE_UNTRACKED | 
			git.Diff.OPTION.RECURSE_UNTRACKED_DIRS |
			git.Diff.OPTION.IGNORE_SUBMODULES,
		contextLines: 0
	});
}

function getDiffBetweenIndexAndHead(repo) {
	return repo.head()
	.then(function(ref) {
		return repo.getReferenceCommit(ref);
	})
	.then(function(commit) {
		return commit.getTree();
	})
	.then(function(tree) {
		return git.Diff.treeToWorkdir(repo, tree, null);
	});
}

function getDiffBetweenTwoCommits(repo, commits) {
	var tree1;
	var tree2;

	return repo.getCommit(commits[0])
	.then(function(commit) {
		return commit.getTree();
	})
	.then(function(tree) {
		tree1 = tree;
	})
	.then(function() {
		return repo.getCommit(commits[1]);
	})
	.then(function(commit) {
		return commit.getTree();
	})
	.then(function(tree) {
		tree2 = tree;
	})
	.then(function() {
		return git.Diff.treeToTree(repo, tree1, tree2, null);
	});
}

function applyPatch(req, res) {
	return clone.getRepo(req)
	.then(function(repo) {
		var radio = "", patchUrl = "", file = "";
		var form = new multiparty.Form();
		form.on("part", function(part) {
			if (part.name === "radio") {
				part.on("data", function(d) {
					radio += d;
				});
			}
			if (part.name === "url") {
				part.on("data", function(d) {
					patchUrl += d;
				});
			}
			if (part.name === "uploadedfile") {
				part.on("data", function(d) {
					file += d;
				});
			}
			part.resume();
		});
		form.on("error", function(err) {
			writeError(404, res, err.message);
		})
		form.on('close', function() {
			function apply() {
				mDiff.applyPatches(file, {
					getFile: function(f) {
						return path.join(repo.workdir(), f.split("/").slice(1).join("/")	);
					},
					loadFile: function(index, cb) {
						if (index.oldFileName === "/dev/null") {
							return cb(null, "");
						}
						fs.readFile(this.getFile(index.oldFileName), "utf8", cb);
					},
					patched: function(index, content) {
						if (index.newFileName === "/dev/null") {
							fs.unlink(this.getFile(index.oldFileName));
							return;
						}
						fs.writeFile(this.getFile(index.newFileName), content, "utf8");
					},
					complete: function(err) {
						if (err) return writeError(404, res, err.message);
						res.status(200).json({JsonData: {
							//TODO return apply patch status
						}});
					}
				});
			}
			if (radio === "fileRadio") {
				apply();
			} else if (radio === "urlRadio") {
				request(patchUrl, function (error, response, body) {
					if (!error && response.statusCode == 200) {
						file = body;
						apply();
					} else {
						writeError(404, res, "Fail to fetch url");
					}
				});
			}
		});
		form.parse(req);
	})
	.catch(function(err) {
		writeError(404, res, err.message);
	})
}

function postDiff(req, res) {
	if (req.get('Content-Type').indexOf("multipart") === 0) {
		return applyPatch(req, res);
	}
	var newCommit = req.body.New;
	var originalUrl = url.parse(req.originalUrl, true);
	var segments = originalUrl.pathname.split("/");
	segments[3] = segments[3] + ".." + util.encodeURIComponent(newCommit);
	var location = url.format({pathname: segments.join("/"), query: originalUrl.query});
	res.setHeader('Location', location);
	res.status(200).json({Location: location});
}
};