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
var path = require('path');
var diff = require("./diff");
var mTags = require("./tags");
var clone = require("./clone");
var git = require('nodegit');
var url = require('url');
var crypto = require('crypto');
var async = require('async');
var express = require('express');
var bodyParser = require('body-parser');
var util = require('./util');

module.exports = {};

module.exports.router = function(options) {
	var fileRoot = options.fileRoot;
	if (!fileRoot) { throw new Error('options.root is required'); }

	module.exports.commitJSON = commitJSON;
	module.exports.getDiff = getDiff;
	module.exports.getCommitParents = getCommitParents;

	return express.Router()
	.use(bodyParser.json())
	.get('/:scope/file*', getCommit)
	.put('/:commit/file*', putCommit)
	.post('/:commit/file*', postCommit);

function commitJSON(commit, fileDir, diffs, parents) {
	return {
		"AuthorEmail": commit.author().email(), 
		"AuthorName": commit.author().name(),
		"AuthorImage": "https://www.gravatar.com/avatar/" + crypto.createHash('md5').update(commit.author().email().toLowerCase()).digest("hex") + "?d=mm",
		"Children":[],
		"CommitterEmail": commit.committer().email(),
		"CommitterName": commit.committer().name(),
		"ContentLocation": "/gitapi/commit/" + commit.sha() + fileDir + "?parts=body",
		"DiffLocation": "/gitapi/diff/" + commit.sha() + fileDir,
		"Location": "/gitapi/commit/" + commit.sha() + fileDir,
		"CloneLocation": "/gitapi/clone" + fileDir,
		"Diffs": diffs,
		"Parents": parents,
		"Message": commit.message(),
		"Name": commit.sha(),
		"Time": commit.timeMs(),
		"Id": commit.sha(),
		"Type": "Commit"
	};
}

function getCommit(req, res) {
	if (req.query.parts === "body") {
		getCommitBody(req, res);
	} else {
		getCommitLog(req, res);
	}
}

function getCommitLog(req, res) {
	var scope = util.decodeURIComponent(req.params.scope);
	var fileDir;

	var query = req.query;
	var page = Number(query.page) || 1;
	var pageSize = Number(query.pageSize) || 20;
	var mergeBase = "true" === query.mergeBase;
	var skipCount = (page-1)*pageSize;
	var filter = query.filter;
	var authoFilter = query.author;
	var committerFilter = query.committer;
	var sha1Filter = query.sha1;
	var fromDateFilter = query.fromDate ? parseInt(query.fromDate, 10) : 0;
	var toDateFilter = query.toDate ? parseInt(query.toDate, 10) : 0;
	var filterPath = path.join(req.user.workspaceDir, req.params["0"]);
	function filterCommit(commit) {
		if (sha1Filter && commit.sha() !== sha1Filter) return true;
		if (filter && commit.message().toLowerCase().indexOf(filter.toLowerCase()) === -1) return true;
		if (authoFilter && commit.author().toString().toLowerCase().indexOf(authoFilter.toLowerCase()) === -1) return true;
		if (committerFilter && commit.committer().toString().toLowerCase().indexOf(committerFilter.toLowerCase()) === -1) return true;
		if (fromDateFilter && commit.timeMs() < fromDateFilter) return true;
		if (toDateFilter && commit.timeMs() > toDateFilter) return true;
		return false;
	}
	function filterCommitPath(diff,filterPath){
		if (!filterPath || !diff) return false;
		for(var n = 0; n < diff.Children.length; n++){
			if(diff.Children[n]["NewPath"].startsWith(filterPath)){
				return false;
			}
		}
		return true;
	}
	var commits = []	, repo;
	function writeResponse(over) {
		var referenceName = scope;
		var resp = {
			"Children": commits,
			"RepositoryPath": "",
			"toRef": {
				"CloneLocation": "/gitapi/clone" + fileDir,
				"CommitLocation": "/gitapi/commit/" + util.encodeURIComponent(referenceName) + fileDir,
				"Current": true,
				"HeadLocation": "/gitapi/commit/HEAD" + fileDir,
				"Location": "/gitapi/branch/" + util.decodeURIComponent(referenceName) + fileDir,
				"Name": referenceName,
				"Type": "Branch"
			}
		};
	
		if (page && !over) {
			var nextLocation = url.parse(req.originalUrl, true);
			nextLocation.query.page = page + 1 + "";
			nextLocation.search = null; //So that query object will be used for format
			nextLocation = url.format(nextLocation);
			resp['NextLocation'] = nextLocation;
		}

		if (page && page > 1) {
			var prevLocation = url.parse(req.originalUrl, true);
			prevLocation.query.page = page - 1 + "";
			prevLocation.search = null;
			prevLocation = url.format(prevLocation);
			resp['PreviousLocation'] = prevLocation;
		}
		
		return getCommitRefs(repo, fileDir, commits)
		.then(function() {
			res.status(200).json(resp);
		});
	}

	function log(repo, ref) {
		var revWalk = repo.createRevWalk();
		revWalk.sorting(git.Revwalk.SORT.TOPOLOGICAL);
		
		if (ref.indexOf("..") !== -1) {
			revWalk.pushRange(ref);
		} else {
			try {
				revWalk.push(ref);
			} catch (ex) {
				revWalk.pushRef(ref);
			}
		}

		var count = 0;
		filterPath = api.toURLPath(filterPath.substring(repo.workdir().length));
		function walk() {
			return revWalk.next()
			.then(function(oid) {
				if (!oid) {
					writeResponse(true);
					return;
				}
				return repo.getCommit(oid)
				.then(function(commit) {
					function applyFilter(diff) {
						if (filterCommit(commit) || filterCommitPath(diff, filterPath) || page && count++ < skipCount) {//skip pages
							return walk();
						}
						return Promise.all([diff || getDiff(repo, commit, fileDir), getCommitParents(repo, commit, fileDir)])
						.then(function(stuff) {
							commits.push(commitJSON(commit, fileDir, stuff[0], stuff[1]));
							if (pageSize && commits.length === pageSize) {//page done
								writeResponse();
								return;
							}
							walk();
						});
					}
					// get diff before filtering by path
					if (filterPath) {
						return getDiff(repo, commit, fileDir).then(applyFilter);
					}
					applyFilter();
				});
			})
			.catch(function(error) {
				if (error.errno === git.Error.CODE.ITEROVER) {
					writeResponse(true);
				} else {
					writeError(404, res, error.message);
				}
			});
		}
		walk();
	}
	
	clone.getRepo(req)
	.then(function(_repo) {
		repo = _repo;
		fileDir = api.join(fileRoot, repo.workdir().substring(req.user.workspaceDir.length + 1));
		if (mergeBase) {
			var names = scope.split("..");
			var commit0;
			repo.getReferenceCommit(names[0])
			.then(function(commit) {
				return commit;
			}).catch(function() {
				return repo.getCommit(names[0]);
			}).then(function(commit) {
				commit0 = commit;
				return repo.getReferenceCommit(names[1]);
			}).catch(function() {
				return repo.getCommit(names[1]);
			})
			.then(function(commit1) {
				git.Merge.base(repo, commit0, commit1).then(function(oid) {
					if (oid) {
						log(repo, oid.tostrS());
					} else {
						writeResponse(true);
					}
				});
			}).catch(function(err) {
				writeError(400, res, err.message);
			});
		} else {
			log(repo, scope);
		}
	}).catch(function(err) {
		writeError(400, res, err.message);
	});
}

function getCommitParents(repo, commit, fileDir) {
	return commit.getParents()
	.then(function(parents) {
		return parents.map(function(parent) {
			return {
				"Location": "/gitapi/commit/" + parent.sha() + fileDir,
				"Name": parent.sha()
			};
		});
	});
}

function getCommitRefs(repo, fileDir, commits) {
	return new Promise(function (fulfill){
		if (!commits.length) return fulfill();
		var map = {};
		commits.forEach(function(commit) {
			map[commit.Id] = commit;
		});
		git.Reference.list(repo)
		.then(function(refList) {
			async.each(refList, function(ref, cb) {
				return git.Reference.nameToId(repo, ref)
				.then(function(oid) {
					var fullName = ref;
					var shortName = ref.replace("refs/tags/", "").replace("refs/remotes/", "").replace("refs/heads/", "");
					var id = oid.toString();
					var commit = map[id];
					if (commit) {
						if (ref.indexOf("refs/tags/") === 0) {
							var tags = commit.Tags || (commit.Tags = []);
							tags.push(mTags.tagJSON(fullName, shortName, id, undefined, fileDir));
						} else {
							var branches = commit.Branches || (commit.Branches = []);
							branches.push({FullName: ref});
						}
					}
					cb();
				})
				.catch(function() {
					// ignore errors looking up commits
					cb();
				});
			}, function() {
				fulfill(map);
			});
		});
	});
}

function getDiff(repo, commit, fileDir) {
	var tree1;
	var tree2;
	var _parent;

	return commit.getTree()
	.then(function(tree) {
		tree2 = tree;
	})
	.then(function() {
		return commit.getParents(1);
	})
	.then(function(parents) {
		return parents && parents[0] ? (_parent = parents[0]).getTree() : null;
	})
	.then(function(tree) {
		tree1 = tree;
	})
	.then(function() {
		return git.Diff.treeToTree(repo, tree1, tree2, null);
	})
	.then(function(diff) {
		return diff.patches();
	})
	.then(function(patches) {
		var range = "";
		if (_parent) range = _parent.id().toString() + "..";
		range += commit.id().toString();
		var page = 1, pageSize = 100;
		var diffs = patches.slice(0, pageSize).map(function(patch) {
			var newFile = patch.newFile();
			var newFilePath = newFile.path();
			var oldFile = patch.oldFile();
			var oldFilePath = oldFile.path();
			var type = diff.changeType(patch);
			var path1 = type !== "Deleted" ? newFilePath : oldFilePath;
			return {
				"ChangeType": type,
				"ContentLocation": fileDir + "/" + path1,
				"DiffLocation": "/gitapi/diff/" + range + fileDir + "/" + path1,
				"NewPath": newFilePath,
				"OldPath": oldFilePath,
				"Type": "Diff"
			};
		});
		var result = {
			"Type": "Diff",
			"Length": patches.length,
			"Children": diffs
		};
		if (patches.length > 100) {
			result.NextLocation = "/gitapi/diff/" + range + fileDir + "?pageSize=" + pageSize + "&page=" + (page + 1);
		}
		return result;
	});
}

function getCommitBody(req, res) {
	var scope = req.params.scope;
	var filePath = path.join(req.user.workspaceDir, req.params["0"]);
	var theRepo;
	clone.getRepo(req)
	.then(function(repo) {
		theRepo = repo;
		filePath = api.toURLPath(filePath.substring(repo.workdir().length));
		return repo.getReferenceCommit(scope);
	})
	.catch(function() {
		return theRepo.getCommit(scope);
	})
	.then(function(commit) {
		return commit.getEntry(filePath);
	})
	.then(function(treeEntry) {
		return treeEntry.getBlob();
	})
	.then(function(blob) {
		var resp = blob.toString();
		res.setHeader('Content-Type', 'application/octect-stream');
		res.setHeader('Content-Length', resp.length);
		res.status(200).end(resp);
	}).catch(function(err) {
		writeError(404, res, err.message);
	});
}

function identifyNewCommitResource(req, res, newCommit) {
	var originalUrl = url.parse(req.originalUrl, true);
	var segments = originalUrl.pathname.split("/");
	segments[3] = segments[3] + ".." + util.encodeURIComponent(newCommit);
	var location = url.format({pathname: segments.join("/"), query: originalUrl.query});
	res.status(200).json({
		"Location": location
	});
}

function revert(req, res, commitToRevert) {
	var theRepo, theCommit, theRC;
	clone.getRepo(req)
	.then(function(repo) {
		theRepo = repo;
		return git.Commit.lookup(repo, commitToRevert);
	})
	.then(function(commit) {
		theCommit = commit;
		return git.Revert(theRepo, commit, new git.RevertOptions());
	})
	.then(function(rc) {
		theRC = rc;
		if (rc) return;
		var msg = 'Revert "' + theCommit.summary() + '"\n\nThis reverts commit ' + theCommit.sha() + '\n';
		return createCommit(theRepo, null, null, theCommit.author().name(), theCommit.author().email(), msg);
		//TODO: Update Reflog to Revert
	})
	.then(function() {
		return theRepo.stateCleanup();
	})
	.then(function() {
		res.status(200).json({
			"Result": theRC ? "FAILURE" : "OK"
		});
	})
	.catch(function(err) {
		writeError(404, res, err.message);
	});
}

function cherryPick(req, res, commitToCherrypick) {
	var theRepo, theCommit, theRC, theHead;
	clone.getRepo(req)
	.then(function(repo) {
		theRepo = repo;
		return git.Reference.nameToId(theRepo, "HEAD");
	})
	.then(function(head) {
		theHead = head;
		return git.Commit.lookup(theRepo, commitToCherrypick);
	})
	.then(function(commit) {
		theCommit = commit;
		return git.Cherrypick.cherrypick(theRepo, commit, {});
	})
	.then(function(rc) {
		theRC = rc;
		if (rc) return;
		return createCommit(theRepo, null, null, theCommit.author().name(), theCommit.author().email(), theCommit.message());
		//TODO: Update Reflog to Cherry-Pick
	})
	.then(function() {
		return theRepo.stateCleanup();
	})
	.then(function() {
		return git.Reference.nameToId(theRepo, "HEAD");
	})
	.then(function(newHead) {
		res.status(200).json({
			"Result": theRC ? "FAILED" : "OK",
			"HeadUpdated": !theRC && theHead !== newHead
		});
	})
	.catch(function(err) {
		writeError(400, res, err.message);
	});
}

function rebase(req, res, commitToRebase, rebaseOperation) {
	var repo, head, commit, oid, paths;
	clone.getRepo(req)
	.then(function(_repo) {
		repo = _repo;
		return repo.getHeadCommit();
	})
	.then(function(_head) {
		head = _head;
		return commitToRebase ? repo.getReferenceCommit(commitToRebase) : head;
	})
	.then(function(_commit) {
		commit = _commit;
		var work;
		switch (rebaseOperation) {
			case "ABORT":
				work = git.Rebase.open(repo, {}).then(function(rebase){
					return rebase.abort();
				});
				break;
				
			case "CONTINUE":
				work = repo.continueRebase();
				break;
				
			case "SKIP":
				throw new Error("Not implemented yet");
				
			default:
				work = repo.rebaseBranches("HEAD", commitToRebase, null, null, null);
		}
		return work
		.then(function(_oid) {
			oid = _oid;
		})
		.catch(function(index) {
			if (rebaseOperation === "ABORT" || !index.entries) {
				throw index;
			}
			paths = {};
			index.entries().forEach(function(entry) {
				if (git.Index.entryIsConflict(entry)) {
					paths[entry.path] = "";
				}
			});
			return git.Checkout.index(repo, index, {
				checkoutStrategy: git.Checkout.STRATEGY.ALLOW_CONFLICTS,
				ourLabel: "HEAD",
				theirLabel: commit.sha()
			});
		});
	})
	.then(function() {
		var rebaseResult = rebaseOperation && paths ? "STOPPED" : "OK";
		if (rebaseOperation !== "ABORT") {
			if (!paths) {
				if (oid && oid.toString() === head.id().toString()) rebaseResult = "UP_TO_DATE";
				else if (oid && oid.toString() === commit.id().toString()) rebaseResult = "FAST_FORWARD";
			} else if (rebaseOperation !== "BEGIN") {
				rebaseResult = "FAILED_UNMERGED_PATHS";
			}
		} else if (rebaseOperation === "ABORT") {
			rebaseResult = "ABORTED";
		}
		res.status(200).json({
			"Result": rebaseResult
		});
	})
	.catch(function(err) {
		writeError(400, res, err.message);
	});

}

function merge(req, res, commitToMerge, squash) {
	var repo, head, commit, oid, paths;
	clone.getRepo(req)
	.then(function(_repo) {
		repo = _repo;
		return repo.getHeadCommit();
	})
	.then(function(_head) {
		head = _head;
		return repo.getReferenceCommit(commitToMerge);
	})
	.then(function(_commit) {
		commit = _commit;
		if (squash) {
			throw new Error("Not implemented yet");
		}
		return repo.mergeBranches("HEAD", commitToMerge)
		.then(function(_oid) {
			oid = _oid;
		})
		.catch(function(index) {
			paths = {};
			index.entries().forEach(function(entry) {
				if (git.Index.entryIsConflict(entry)) {
					paths[entry.path] = "";
				}
			});
			return git.Checkout.index(repo, index, {
				checkoutStrategy: git.Checkout.STRATEGY.ALLOW_CONFLICTS,
				ourLabel: "HEAD",
				theirLabel: commit.sha()
			});
		});
	})
	.then(function() {
		var mergeResult = "MERGED";
		if (!paths) {
			if (oid && oid.toString() === head.id().toString()) mergeResult = "ALREADY_UPDATE";
			else if (oid && oid.toString() === commit.id().toString()) mergeResult = "FAST_FORWARD";
		}
		res.status(200).json({
			"Result": paths ? "CONFLICTING" : mergeResult,
			"FailingPaths": paths
		});
	})
	.catch(function(err) {
		writeError(400, res, err.message);
	});
}

function createCommit(repo, committerName, committerEmail, authorName, authorEmail, message, amend, insertChangeid){
	var index, oid, author, committer;
	return repo.index()
	.then(function(indexResult) {
		index = indexResult;
		return index.read(1);
	})
	.then(function() {
		return index.writeTree();
	})
	.then(function(oidResult) {
		oid = oidResult;
		return git.Reference.nameToId(repo, "HEAD");
	})
	.then(function(head) {
		return repo.getCommit(head);
	})
	.then(function(parent) {
		if (authorEmail) {
			author = git.Signature.now(authorName, authorEmail);
		} else {
			author = git.Signature.default(repo);	
		}
		if (committerEmail) {
			committer = git.Signature.now(committerName, committerEmail);
		} else {
			committer = git.Signature.default(repo);
		}
		if(insertChangeid) {
			message = insertChangeId(message, oid, parent, author ,committer);
		}
		if (amend) {
			return parent.amend("HEAD",  author, committer, null, message, oid);
		}
		return repo.createCommit("HEAD", author, committer, message, oid, [parent]);
	})
	.then(function(id) {
		return git.Commit.lookup(repo, id);
	});
}

function tag(req, res, commitId, name) {
	var theRepo, theDiffs, thisCommit, theParents, fileDir;
	clone.getRepo(req)
	.then(function(repo) {
		theRepo = repo;
		fileDir = api.join(fileRoot, repo.workdir().substring(req.user.workspaceDir.length + 1));
		return git.Commit.lookup(repo, commitId);
	})
	.then(function(commit) {
		thisCommit = commit;
		return theRepo.createLightweightTag(commit, name);
	})
	.then(function() {
		return getDiff(theRepo, thisCommit, fileDir);
	})
	.then(function(diffs){
		theDiffs = diffs;
	})
	.then(function() {
		return getCommitParents(theRepo, thisCommit, fileDir);
	})
	.then(function(parents){
		theParents = parents;
	})
	.catch(function(err) {
		writeError(403, res, err.message);
	})
	.done(function() {
		res.status(200).json(commitJSON(thisCommit, fileDir, theDiffs, theParents));
	});
}

function putCommit(req, res) {
	var commit = util.decodeURIComponent(req.params.commit);
	var tagName = req.body.Name;
	if (tagName) {
		tag(req, res, commit, tagName);
	}
}

function postCommit(req, res) {
	var fileDir;
	if (typeof req.body.Merge === "string") {
		merge(req, res, req.body.Merge, req.body.Squash);
		return;
	}
	if (typeof req.body.Rebase === "string") {
		rebase(req, res, req.body.Rebase, req.body.Operation);
		return;
	}
	if (typeof req.body["Cherry-Pick"] === "string") {
		cherryPick(req, res, req.body["Cherry-Pick"]);
		return;
	}
	if (typeof req.body.Revert === "string") {
		revert(req, res, req.body.Revert);
		return;
	}
	if (typeof req.body.New === "string") {
		identifyNewCommitResource(req, res, req.body.New);
		return;
	}
	
	var commit = util.decodeURIComponent(req.params.commit);
	if (commit !== "HEAD") {
		writeError(404, res, "Needs to be HEAD");
		return;
	}
	
	if (!req.body.Message) {
		writeError(404, res, "Commit message cannot be empty.");
		return;
	}

	// Since ChangeId messagefoot is not showing in the box, so insert Message after empty Checking.
	var isInsertChangeId = req.body.ChangeId;	

	var theRepo, thisCommit;
	var theDiffs = [], theParents;
	
	clone.getRepo(req)
	.then(function(repo) {
		theRepo = repo;
		fileDir = api.join(fileRoot, repo.workdir().substring(req.user.workspaceDir.length + 1));
		return createCommit(repo, req.body.CommitterName, req.body.CommitterEmail, req.body.AuthorName, req.body.AuthorEmail, req.body.Message, req.body.Amend, isInsertChangeId);
	})
	.then(function(commit) {
		thisCommit = commit;
		return getDiff(theRepo, commit, fileDir);
	})
	.then(function(diffs){
		theDiffs = diffs;
	})
	.then(function() {
		return getCommitParents(theRepo, thisCommit, fileDir);
	})
	.then(function(parents){
		theParents = parents;
	})
	.catch(function(err) {
		writeError(403, res, err.message);
	})
	.done(function() {
		res.status(200).json(commitJSON(thisCommit, fileDir, theDiffs, theParents));
	});
}

function generateChangeId(oid, firstParentId, authorId, committerId, message){
	var cleanMessage = clean(message);
	function clean(fullMessage) {
		return fullMessage.//
				replace(/^#.*$\n?/g, "").// //$NON-NLS-1$
				replace(/\n\n\n+/g, "\n").// //$NON-NLS-1$
				replace(/\n*$/g, "").// //$NON-NLS-1$
				replace(/\ndiff --git.*/g, "").// //$NON-NLS-1$
				trim();
	}
	var mergedMessage = ["tree ",oid,"\nparent ",firstParentId,"\nauthor ",authorId,"\ncommitter ",committerId,"\n\n",cleanMessage].join("");	
	var hash = crypto.createHash("sha1");
	hash.update(mergedMessage);
	return hash.digest('hex');
}

function insertChangeId(originalMessage, oid, parent, author ,committer){
	var lines = originalMessage.split("\n"); //$NON-NLS-1$
	// Has ChangeId do nothing, even if changeId is changed, do not replace it.
	if(!existingOfChangeId(lines)) {
		var footerFirstLine = indexOfFirstFooterLine(lines);
		var insertAfter = footerFirstLine;
		for (var i = footerFirstLine; i < lines.length; ++i) {
			if (lines[i].match(/^(Bug|Issue)[a-zA-Z0-9-]*:.*$/)) {
				insertAfter = i + 1;
				continue;
			}
			break;
		}
		
		// Generage ChangeId here only when necessary.
		var firstParentId = parent? parent.parentId(0) : "";
		var hashId = generateChangeId(oid, firstParentId, author.toString(), committer.toString(), originalMessage);
		var changeIdString = "Change-Id: I" + hashId;
		if ( lines.length === 1 ){
			lines.splice(1, 0, "\n"+changeIdString);	
		}else{
			lines.splice(insertAfter, 0, changeIdString);
		}
		originalMessage = lines.join("\n");
 	}
 	return originalMessage;
 	
 	
 	function existingOfChangeId(alllinesArray){
		if (alllinesArray.length === 0)
			return false;
		var inFooter = false;
		for (var m = alllinesArray.length - 1; m >= 0; --m) {
			if (!inFooter && isEmptyLine(alllinesArray[m])){
				// Fine the last not-empty line, or keep finding.
				continue;
			}
			inFooter = true;
			if (alllinesArray[m].match(/^\s*Change-Id: *I[a-f0-9]{40}$/)) {
				return true;
			}
		}
		// Went through all lines but didn't find Change-Id line.
		return false;
 	}
 	
 	function isEmptyLine(line){
		return line.trim().length === 0;
 	}
 		
 	function indexOfFirstFooterLine(lines){
 		var footerFirstLineNum = lines.length;
		for (var l = lines.length - 1; l > 1; --l) {
			if (lines[l].match(/^[a-zA-Z0-9-]+:.*$/)) {
				footerFirstLineNum = l;
				continue;
			}
			if (footerFirstLineNum !== lines.length && lines[l].length === 0){
				break;
			}
			if (footerFirstLineNum !== lines.length
					&& lines[l].match(/^[ \\[].*$/)) {
				footerFirstLineNum = l + 1;
				continue;
			}
			footerFirstLineNum = lines.length;
			break;
		}
		return footerFirstLineNum;
 	}
}
};