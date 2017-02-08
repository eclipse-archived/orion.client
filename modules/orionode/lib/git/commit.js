/*******************************************************************************
 * Copyright (c) 2012, 2017 IBM Corporation and others.
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
var remotes = require('./remotes');
var branches = require('./branches');
var tasks = require('../tasks');

module.exports = {};

module.exports.router = function(options) {
	var fileRoot = options.fileRoot;
	var gitRoot = options.gitRoot;
	if (!fileRoot) { throw new Error('options.fileRoot is required'); }
	if (!gitRoot) { throw new Error('options.gitRoot is required'); }
	
	module.exports.commitJSON = commitJSON;
	module.exports.getDiff = getDiff;
	module.exports.getCommitParents = getCommitParents;

	return express.Router()
	.use(bodyParser.json())
	.get('/:scope'+ fileRoot + '*', getCommit)
	.put('/:commit'+ fileRoot + '*', putCommit)
	.post('/:commit'+ fileRoot + '*', postCommit);

function commitJSON(commit, fileDir, diffs, parents) {
	return {
		"AuthorEmail": commit.author().email(), 
		"AuthorName": commit.author().name(),
		"AuthorImage": "https://www.gravatar.com/avatar/" + crypto.createHash('md5').update(commit.author().email().toLowerCase()).digest("hex") + "?d=mm",
		"Children":[],
		"CommitterEmail": commit.committer().email(),
		"CommitterName": commit.committer().name(),
		"ContentLocation": gitRoot + "/commit/" + commit.sha() + fileDir + "?parts=body",
		"DiffLocation": gitRoot + "/diff/" + commit.sha() + fileDir,
		"Location": gitRoot + "/commit/" + commit.sha() + fileDir,
		"CloneLocation": gitRoot + "/clone" + fileDir,
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
	var task = new tasks.Task(res,false,false,0,false);
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
	var filterPath;
	var behindCount = 0, aheadCount= 0;
	function filterCommit(commit) {
		if (sha1Filter && commit.sha() !== sha1Filter) return true;
		if (filter && commit.message().toLowerCase().indexOf(filter.toLowerCase()) === -1) return true;
		if (authoFilter && commit.author().toString().toLowerCase().indexOf(authoFilter.toLowerCase()) === -1) return true;
		if (committerFilter && commit.committer().toString().toLowerCase().indexOf(committerFilter.toLowerCase()) === -1) return true;
		if (fromDateFilter && commit.timeMs() < fromDateFilter) return true;
		if (toDateFilter && commit.timeMs() > toDateFilter) return true;
		return false;
	}
	var commits = []	, repo;
	function writeResponse(over) {
		var refs = scope.split("..");
		var toRef, fromRef; 
		if(refs.length === 1){
			toRef = refs[0];
		} else if(refs.length === 2){
			toRef = refs[1];
			fromRef = refs[0];
		}
		
		var resp = {
			"Children": commits,
			"RepositoryPath": filterPath,
			"Type": "Commit",
			"Location":gitRoot + "/commit/" + util.encodeURIComponent(scope) + fileRoot + req.params[0],
			"CloneLocation": gitRoot + "/clone" + fileDir
		};
		if(mergeBase){
			resp["AheadCount"] = aheadCount;
			resp["BehindCount"] = behindCount;
		}
	
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
		
		function generateCorrespondingRefJson(refname){
			return git.Reference.dwim(repo, refname).then(function(reference) {
				if(reference.isRemote()){
					var remoteNameCandidate = reference.shorthand();
					return git.Remote.list(repo)
					.then(function(array) {
						var remoteNameCandidateSegments = remoteNameCandidate.split("/");
						for (var i = 1; i <= remoteNameCandidateSegments.length; i++) {
							var joinedRemotename = remoteNameCandidateSegments.slice(0, i).join("/");
							if(array.some(function(item){
							return item === joinedRemotename;})){
								return joinedRemotename;
							}
						}
					}).then(function(remoteName){
						return Promise.all([repo.getRemote(remoteName), repo.getBranchCommit(reference)]);
					}) 
					.then(function(results){
						return remotes.remoteBranchJSON(reference, results[1], results[0], fileDir);
					});
				}else if(reference.isBranch()){
					var branch = branches.branchJSON(repo, reference, fileDir);
					return branches.getBranchCommit(repo, [branch])
					.then(function(){
						return branches.getBranchRemotes(repo, [branch], fileDir);
					}).then(function(){
						return branch;
					});
				}
			}).catch(function(){
				return null;   // when it's a commit, cannot dwim even
			});
		}
		
		return getCommitRefs(repo, fileDir, commits)
		.then(function(){
			if(fromRef){
				return Promise.resolve(generateCorrespondingRefJson(fromRef))
				.then(function(resultJson){
					if(resultJson){
						resp['fromRef'] = resultJson;
					}
				});
			}
		})
		.then(function(){
			if(toRef){
				return Promise.resolve(generateCorrespondingRefJson(toRef))
				.then(function(resultJson){
					if(resultJson){
						resp['toRef'] = resultJson;
					}
				});
			}
		})
		.then(function() {
			task.done({
				HttpCode: 200,
				Code: 0,
				DetailedMessage: "OK",
				JsonData: resp,
				Message: "OK",
				Severity: "Ok"
			});
		});
	}

	function log(repo, ref) {
		var revWalk = repo.createRevWalk();
		function setupRevWalk(callback) {
			revWalk.sorting(git.Revwalk.SORT.TOPOLOGICAL);
			git.Reference.dwim(repo, ref).then(
				function(reference) {
					return ref =  reference.name();
				},
				function rejected(){
					return;
				}
			)
			.then(function(){
				if (ref.indexOf("..") !== -1) {
						revWalk.pushRange(ref);
				} else {
					try {
						revWalk.push(ref);
					} catch (ex) {
						revWalk.pushRef( ref );
					}
				}
				return;
			}).then(callback);
		}

		setupRevWalk(function() {
			if (filterPath) {
				fileHistoryWalk();
			} else {
				walk();
			}
		});

		var count = 0;
		filterPath = clone.getfileRelativePath(repo,req); 
		function walk() {
			return revWalk.next()
			.then(function(oid) {
				if (!oid) {
					writeResponse(true);
					return;
				}
				return repo.getCommit(oid)
				.then(function(commit) {
					function applyFilter() {
						if (filterCommit(commit) || page && count++ < skipCount) {//skip pages
							return walk();
						}
						return Promise.all([getDiff(repo, commit, fileDir), getCommitParents(repo, commit, fileDir)])
						.then(function(stuff) {
							commits.push(commitJSON(commit, fileDir, stuff[0], stuff[1]));
							if (pageSize && commits.length === pageSize) {//page done
								writeResponse();
								return;
							}
							walk();
						});
					}
					applyFilter();
				});
			})
			.catch(function(error) {
				if (error.errno === git.Error.CODE.ITEROVER) {
					writeResponse(true);
				} else {
					task.done({
						HttpCode: 404,
						Code: 0,
						DetailedMessage: error.message,
						JsonData: {},
						Message: error.message,
						Severity: "Error"
					});
				}
			});
		}

		function fileHistoryWalk() {
			revWalk.getCommitsUntil(function(commit) {
				// iterate through the entire history until we have no more commits
				var parentId = commit.parentId(0);
				return parentId !== null && parentId !== undefined;
			}).then(function(array) {
				setupRevWalk(function() {
					// run a full history walk on the desired file
					revWalk.fileHistoryWalk(filterPath, array.length).then(function(fileCommits) {
						// client trying to skip more commits than that which affects the specified file,
						// respond that we're done and there is nothing left
						if (skipCount >= fileCommits.length) {
							writeResponse(true);
							return;
						}

						// remove the elements that need to be skipped over
						fileCommits.splice(0, skipCount);
						var done = true;
						if (fileCommits.length > pageSize) {
							// we have more commits than the page size, we won't be done
							done = false;
							// remove the extra commits as they don't need to be processed
							fileCommits.splice(pageSize, fileCommits.length - pageSize);
						}
						var fullCommits = [];
						function getFullCommits(fileCommits, idx) {
							repo.getCommit(fileCommits[idx].commit.id()).then(function(c) {
								fullCommits.push(c);

								// when we've retrieved everything, iterate over them
								if (fullCommits.length === fileCommits.length) {
									processCommits(fullCommits, 0);	
								} else {
									// get the full commit of the next commit
									getFullCommits(fileCommits, idx + 1);
								}
							});
						}
						// the commit objects from fileHistoryWalk(*) fail on getTree()
						// which prevents us from grabbing a diff,
						// grab a full commit from the repo using the oid
						getFullCommits(fileCommits, 0);

						function processCommits(fullCommits, idx) {
							var commit = fullCommits[idx];
							return Promise.all(
								[ getDiff(repo, commit, fileDir), getCommitParents(repo, commit, fileDir) ]
							).then(function(stuff) {
								commits.push(commitJSON(commit, fileDir, stuff[0], stuff[1]));
								if (idx === fullCommits.length - 1) {
									// we're at the end, stop iterating
									// and write the response
									writeResponse(done);
									return;
								}
								processCommits(fullCommits, idx + 1);
							});
						}
					});
				});
			});
		}
	}
	
	clone.getRepo(req)
	.then(function(_repo) {
		repo = _repo;
		fileDir = clone.getfileDir(repo,req);
		if (mergeBase) {
			var names = scope.split("..");
			var commit0, commit1,mergeBaseCommitOid;
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
			.then(function(commit) {
				commit1 = commit;
				return git.Merge.base(repo, commit0, commit1).then(function(oid){
					return oid;
				});
			})
			.then(function(oid) {
				mergeBaseCommitOid = oid;
				var revWalkForCounting1 = repo.createRevWalk();
				revWalkForCounting1.sorting(git.Revwalk.SORT.TOPOLOGICAL);
				revWalkForCounting1.pushRange(mergeBaseCommitOid.tostrS() + ".." + commit0.id().tostrS());	//count for incomings
				
				var revWalkForCounting2 = repo.createRevWalk();
				revWalkForCounting2.sorting(git.Revwalk.SORT.TOPOLOGICAL);
				revWalkForCounting2.pushRange(mergeBaseCommitOid.tostrS() + ".." + commit1.id().tostrS()); // count for outgoing
				
				return Promise.all([countCommit(revWalkForCounting1),countCommit(revWalkForCounting2)]);	
			}).then(function(results){
				behindCount = results[0];
				aheadCount = results[1];
				if(mergeBaseCommitOid){
					log(repo, mergeBaseCommitOid.tostrS());
				} else {
					writeResponse(true);
				}
			});
		} else {
			log(repo, scope);
		}
	}).catch(function(err) {
		task.done({
			HttpCode: 400,
			Code: 0,
			DetailedMessage: err.message,
			JsonData: {},
			Message: err.message,
			Severity: "Error"
		});
	});
}

function countCommit(revWalk){
	var MAX_COMMITS_IN_FASTREVWALK = 30000;
	return revWalk.fastWalk(MAX_COMMITS_IN_FASTREVWALK)
	.then(function(commitOids) {
		return commitOids.length;
	});
}

function getCommitParents(repo, commit, fileDir) {
	return commit.getParents()
	.then(function(parents) {
		return parents.map(function(parent) {
			return {
				"Location": gitRoot + "/commit/" + parent.sha() + fileDir,
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
					var id,commit;
					var shortName = ref.replace("refs/tags/", "").replace("refs/remotes/", "").replace("refs/heads/", "");
					if (ref.indexOf("refs/tags/") === 0) {
						var annotated = false;
						return git.Tag.lookup(repo,oid).then(function(tag){
							id = tag.targetId();
							// tag lookup succeeded, it's an annotated tag then
							annotated = true;
						}).catch(function(){
							id = oid.toString();
						})
						.then(function(){
							commit = map[id];
							if (commit) {
								var tags = commit.Tags || (commit.Tags = []);
								tags.push(mTags.tagJSON(fullName, shortName, id, undefined, fileDir, annotated));
							}
							cb();
						});
					} 
					id = oid.toString();
					commit = map[id];
					if (commit) {
						var branches = commit.Branches || (commit.Branches = []);
						branches.push({FullName: ref});
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
				"DiffLocation": gitRoot + "/diff/" + range + fileDir + "/" + path1,
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
			result.NextLocation = gitRoot + "/diff/" + range + fileDir + "?pageSize=" + pageSize + "&page=" + (page + 1);
		}
		return result;
	});
}

function getCommitBody(req, res) {
	var scope = req.params.scope;
	var filePath;
	var theRepo;
	clone.getRepo(req)
	.then(function(repo) {
		theRepo = repo;
		filePath = clone.getfileRelativePath(repo,req);
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
	var contextPathSegCount = req.contextPath.split("/").length - 1;
	segments[3 + contextPathSegCount] = segments[3 + contextPathSegCount] + ".." + util.encodeURIComponent(newCommit);
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
	})
	.then(function() {
		return theRepo.stateCleanup();
	})
	.then(function() {
		res.status(200).json({
			"Result": theRC ? "FAILURE" : "OK"
		});
	})
	.then(function() {
		return git.Reflog.read(theRepo, "HEAD").then(function(reflog) {
			replaceMostRecentRefLogMessageHeaderfromCommit("revert", reflog, theRepo);
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
	.then(function() {
		return git.Reflog.read(theRepo, "HEAD").then(function(reflog) {
			replaceMostRecentRefLogMessageHeaderfromCommit("cherrypick", reflog, theRepo);
		});
	})
	.catch(function(err) {
		if(err.message.indexOf("Cannot create a tree") !== -1){
			res.status(200).json({
				"HeadUpdated": true,
				"Result": "CONFLICTING"
			});
		}else{
			writeError(400, res, err.message);
		}
	});
}

function replaceMostRecentRefLogMessageHeaderfromCommit (toHeader,reflog, repo ){
	var mostRecentReflog = reflog.entryByIndex(0);
	if(mostRecentReflog){
		var targetMessage = mostRecentReflog.message();
		if(/^commit(:\s)/.test(targetMessage)){
			var targetOID = mostRecentReflog.idOld();
			targetMessage = targetMessage.replace(/^commit(:\s)/,  toHeader+"$1");
			reflog.drop(0, 1);
			reflog.append(targetOID, clone.getSignature(repo),targetMessage);
			reflog.write();
		}
	}
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

function merge(req, res, branchToMerge, squash) {
	var repo, head, commit, oid, paths;
	var conflicting = false;
	clone.getRepo(req)
	.then(function(_repo) {
		repo = _repo;
		return repo.getHeadCommit();
	})
	.then(function(_head) {
		head = _head;
		return repo.getReferenceCommit(branchToMerge);
	})
	.then(function(_commit) {
		commit = _commit;
		if (squash) {
			throw new Error("Not implemented yet");
		}
		return repo.mergeBranches("HEAD", branchToMerge)
		.then(function(_oid) {
			oid = _oid;
		})
		.catch(function(index) {
			// the merge failed due to conflicts
			conflicting = true;
			return git.AnnotatedCommit.lookup(repo, commit.id())
			.then(function(annotated) {
				var retCode = git.Merge.merge(repo, annotated, null, null);
				if (retCode === git.Error.CODE.ECONFLICT) {
					// checkout failed due to a conflict
					return getConflictingPaths(repo, head, commit)
					.then(function(conflictingPaths) {
						paths = conflictingPaths;
					});
				} else if (retCode !== git.Error.CODE.OK) {
					throw new Error("Internal merge failure (error code " + retCode + ")");
				}
			});
		});
	})
	.then(function() {
		var mergeResult = "MERGED";
		if (oid && oid.toString() === head.id().toString()) mergeResult = "ALREADY_UP_TO_DATE";
		else if (oid && oid.toString() === commit.id().toString()) mergeResult = "FAST_FORWARD";
		else if (conflicting) mergeResult = "CONFLICTING";
		res.status(200).json({
			"Result": mergeResult,
			"FailingPaths": paths
		});
	})
	.catch(function(err) {
		writeError(400, res, err.message);
	});
}

function getConflictingPaths(repo, head, commit) {
	var tree2;
	var diffPaths = [];
	return commit.getTree()
	.then(function(tree) {
		tree2 = tree;
		// get the common ancestor between HEAD and the other branch
		return Merge.base(repo, head, commit)
		.then(function(ancestor) {
			return ancestor.getTree();
		})
		.catch(function() {
			// failed to find common ancestor, use HEAD tree instead
			return head.getTree();
		});
	})
	.then(function(tree) {
		// diff the two trees
		return git.Diff.treeToTree(repo, tree, tree2, null)
	})
	.then(function(diff) {
		return diff.patches();
	})
	.then(function(patches) {
		// get the path of every modified file
		patches.forEach(function(patch) {
			diffPaths.push(patch.newFile().path());
		});
		return repo.getStatusExt({
			flags: git.Status.OPT.INCLUDE_UNTRACKED |
				git.Status.OPT.RECURSE_UNTRACKED_DIRS
		});
	})
	.then(function(statuses) {
		var paths = {};
		// check what's in the index and wd
		statuses.forEach(function(file) {
			var path = file.path();
			if (file.statusBit() !== 0 && diffPaths.indexOf(path) !== -1) {
				// modified file in the index/wd conflicts with the merge
				paths[path] = "";
			}
		});
		return paths;
	});
}

function createCommit(repo, committerName, committerEmail, authorName, authorEmail, message, amend, insertChangeid){
	var index, oid, author, committer;
	var state = repo.state();
	var mergeRequired = state === git.Repository.STATE.MERGE;
	if (amend && mergeRequired) {
		// libgit2's API doesn't allow this
		throw new Error("Cannot amend a commit to have more merges");
	}
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
		if (authorEmail) {
			author = git.Signature.now(authorName, authorEmail);
		} else {
			author = clone.getSignature(repo);		
		}
		if (committerEmail) {
			committer = git.Signature.now(committerName, committerEmail);
		} else {
			committer = clone.getSignature(repo);
		}	
		if(repo.isEmpty()){
			if(insertChangeid) {
				message = insertChangeId(message, oid, null, author, committer);
			}
			return repo.createCommit('HEAD', author, committer, message, oid, []);
		}
		return git.Reference.nameToId(repo, "HEAD")
		.then(function(head) {
			return repo.getCommit(head);
		})
		.then(function(parent) {				
			if(insertChangeid) {
				message = insertChangeId(message, oid, parent, author, committer);
			}
			if (amend) {
				return parent.amend("HEAD",  author, committer, null, message, oid);
			} else if (mergeRequired) {
				var promises = [ Promise.resolve(parent) ];
				// get merge heads
				return repo.mergeheadForeach(function(oid) {
					promises.push(repo.getCommit(oid));
				})
				.then(function() {
					// wait for all parents to be resolved
					return Promise.all(promises);
				})
				.then(function(parentCommits) {
					// create the merge commit on top of the MERGE_HEAD parents
					return repo.createCommit("HEAD", author, committer, message, oid, parentCommits);
				});
			}
			return repo.createCommit("HEAD", author, committer, message, oid, [parent]);
		});
	})
	.then(function(id) {
		if (mergeRequired) {
			// a merge commit was created, cleanup MERGE_* files in .git/
			var retCode = repo.stateCleanup();
			if (retCode !== git.Error.CODE.OK) {
				throw new Error("Internal merge cleanup failed (error code " + retCode + ")");
			}
		}
		return git.Commit.lookup(repo, id);
	});
}

function tag(req, res, commitId, name, isAnnotated, message) {
	var theRepo, theDiffs, thisCommit, theParents, fileDir;
	clone.getRepo(req)
	.then(function(repo) {
		theRepo = repo;
		fileDir = clone.getfileDir(repo,req);
		return git.Commit.lookup(repo, commitId);
	})
	.then(function(commit) {
		thisCommit = commit;
		if(isAnnotated) {
			var tagger = clone.getSignature(theRepo);
		}
		return isAnnotated ? theRepo.createTag (commit, name, message, tagger) : theRepo.createLightweightTag(commit, name);
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
	var isAnnotated = req.body.Annotated === undefined || req.body.Annotated;
	var message = req.body.Message || "";
	if (tagName) {
		tag(req, res, commit, tagName, isAnnotated, message);
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
	var theDiffs = [];
	
	clone.getRepo(req)
	.then(function(repo) {
		theRepo = repo;
		fileDir = clone.getfileDir(repo,req);
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
		res.status(200).json(commitJSON(thisCommit, fileDir, theDiffs, parents));
	})
	.catch(function(err) {
		writeError(403, res, err.message);
	})
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
