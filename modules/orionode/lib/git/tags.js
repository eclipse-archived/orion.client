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
var git = require('nodegit');
var async = require('async');
var url = require('url');
var clone = require('./clone');

function tagJSON(ref, commit, fileDir) {
	var fullName = ref.name();
	var shortName = ref.shorthand();
	return {
		"FullName": fullName,
		"Name": shortName,
		"CloneLocation": "/gitapi/clone" + fileDir,
		"CommitLocation": "/gitapi/commit/" + commit.sha() + fileDir,
		"LocalTimeStamp": commit.timeMs(),
		"Location": "/gitapi/tag/" + shortName + fileDir,
		"TagType": "LIGHTWEIGHT",//TODO
		"TreeLocation": "/gitapi/tree" + fileDir + "/" + shortName,
		"Type": "Tag"
	};
}

function getTags(workspaceDir, fileRoot, req, res, next, rest) {
	var segments = rest.split("/");
	var hasTag = segments[1] !== "file";
	var tagName = hasTag ? segments[1] : "";
	var fileDir;
	var query = url.parse(req.url, true).query;
	var page = Number(query.page) || 1;
	var filter = query.filter;
	var pageSize = Number(query.pageSize) || Number.MAX_SAFE_INTEGER;

	var theRepo, theRef;
	var tags = [];
	var count = 0, tagCount = 0;

	if (tagName) {
		return clone.getRepo(segments, workspaceDir)
		.then(function(repo) {
			theRepo = repo;
			fileDir = api.join(fileRoot, repo.workdir().substring(workspaceDir.length + 1));
			return git.Reference.lookup(theRepo, "refs/tags/" + tagName);
		})
		.then(function(ref) {
			theRef = ref;
			return theRepo.getReferenceCommit(ref);
		})
		.then(function(commit) {
			var resp = JSON.stringify(tagJSON(theRef, commit, fileDir));
			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Content-Length', resp.length);
			res.end(resp);
		})
		.catch(function(err) {
			writeError(404, res, err.message);
		});
		return;
	}

	return clone.getRepo(segments, workspaceDir)
	.then(function(repo) {
		theRepo = repo;
		fileDir = api.join(fileRoot, repo.workdir().substring(workspaceDir.length + 1));
		return theRepo.getReferences(git.Reference.TYPE.OID);
	})
	.then(function(refList) {
		async.each(refList, function(ref,callback) {
			if (ref.isTag()) {
				if (!filter || ref.shorthand().indexOf(filter) !== -1) {
					if (!page || count++ >= (page-1)*pageSize && tagCount <= pageSize) {
						tagCount++;
						theRepo.getReferenceCommit(ref)
						.then(function(commit) {
							tags.push(tagJSON(ref, commit, fileDir));
							callback();
						})
						.catch(function() {
							// ignore errors looking up commits
							callback();
						});
						return;
					}
				}
			}
			callback();
		}, function(err) {
			if (err) {
				return writeError(403, res);
			}
			var resp = {
				"Children": tags,
				"Type": "Tag",
			};

			if (page && page*pageSize < count) {
				var nextLocation = url.parse(req.url, true);
				nextLocation.query.page = page + 1 + "";
				nextLocation.search = null; //So that query object will be used for format
				nextLocation = url.format(nextLocation);
				resp['NextLocation'] = nextLocation;
			}

			if (page && page > 1) {
				var prevLocation = url.parse(req.url, true);
				prevLocation.query.page = page - 1 + "";
				prevLocation.search = null;
				prevLocation = url.format(prevLocation);
				resp['PreviousLocation'] = prevLocation;
			}

			resp = JSON.stringify(resp);
			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Content-Length', resp.length);
			res.end(resp);
		});
	});
}

function deleteTags(workspaceDir, fileRoot, req, res, next, rest) {
	var segments = rest.split("/");
	var tagName = segments[1];

	return clone.getRepo(segments, workspaceDir)
	.then(function(repo) {
		return git.Tag.delete(repo, tagName);
	})
	.then(function(resp) {
		if (!resp) {
			res.statusCode = 200;
			res.end();
		} else {
			writeError(403, res);
		} 
	});
}

module.exports = {
	tagJSON: tagJSON,
	getTags: getTags,
	deleteTags: deleteTags
};
