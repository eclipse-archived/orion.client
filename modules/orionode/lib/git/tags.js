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
var express = require('express');
var bodyParser = require('body-parser');
var util = require('./util');

module.exports = {};

module.exports.router = function(options) {
	var fileRoot = options.fileRoot;
	if (!fileRoot) { throw new Error('options.root is required'); }
	
	module.exports.tagJSON = tagJSON;

	return express.Router()
	.use(bodyParser.json())
	.get('/file*', getTags)
	.get('/:tagName*', getTags)
	.delete('/:tagName*', deleteTag);

function tagJSON(fullName, shortName, sha, timestamp, fileDir) {
	return {
		"FullName": fullName,
		"Name": shortName,
		"CloneLocation": "/gitapi/clone" + fileDir,
		"CommitLocation": "/gitapi/commit/" + sha + fileDir,
		"LocalTimeStamp": timestamp,
		"Location": "/gitapi/tag/" + util.encodeURIComponent(shortName) + fileDir,
		"TagType": "LIGHTWEIGHT",
		"TreeLocation": "/gitapi/tree" + fileDir + "/" + util.encodeURIComponent(shortName),
		"Type": "Tag"
	};
}

function getTagCommit(repo, ref) {
	return repo.getReferenceCommit(ref)
	.catch(function() {
		return repo.getTagByName(ref.shorthand())
		.then(function(tag){
			return repo.getCommit(tag.targetId());
		});
	});
}

function getTags(req, res) {
	var tagName = util.decodeURIComponent(req.params.tagName || "");
	var fileDir;
	var query = req.query;
	var page = Number(query.page) || 1;
	var filter = query.filter;
	var pageSize = Number(query.pageSize) || Number.MAX_SAFE_INTEGER;

	var theRepo, theRef;
	var tags = [];
	var count = 0, tagCount = 0;

	if (tagName) {
		return clone.getRepo(req)
		.then(function(repo) {
			theRepo = repo;
			fileDir = clone.getfileDir(repo,req);
			return git.Reference.lookup(theRepo, "refs/tags/" + tagName);
		})
		.then(function(ref) {
			theRef = ref;
			return getTagCommit(theRepo, ref);
		})
		.then(function(commit) {
			res.status(200).json(tagJSON(theRef.name(), theRef.shorthand(), commit.sha(), commit.timeMs(), fileDir));
		})
		.catch(function(err) {
			writeError(404, res, err.message);
		});
	}

	return clone.getRepo(req)
	.then(function(repo) {
		theRepo = repo;
		fileDir = clone.getfileDir(repo,req);
		return git.Reference.list(theRepo);
	})
	.then(function(referenceList) {
		referenceList = referenceList.filter(function(ref) {
			if (ref.indexOf("refs/tags/") === 0) {
				var shortname = ref.replace("refs/tags/", "");
				if (!filter || shortname.indexOf(filter) !== -1) {
					if (!page || count++ >= (page-1)*pageSize && tagCount <= pageSize) {
						tagCount++;
						return true;
					}
				}
			}
		});
		return Promise.all(referenceList.map(function(ref) {
			return git.Reference.lookup(theRepo, ref);
		}))
		.then(function(referenceList) {
			async.each(referenceList, function(ref,callback) {
				getTagCommit(theRepo, ref)
				.then(function(commit) {
					tags.push(tagJSON(ref.name(), ref.shorthand(), commit.sha(), commit.timeMs(), fileDir));
					callback();
				})
				.catch(function() {
					// ignore errors looking up commits
					tags.push(tagJSON(ref.name(), ref.shorthand(), ref.target().toString(), 0, fileDir));
					callback();
				});
			}, function(err) {
				if (err) {
					return writeError(403, res);
				}
				var resp = {
					"Children": tags,
					"Type": "Tag",
				};
	
				if (page && page*pageSize < count) {
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
	
				res.status(200).json(resp);
			});
		});
	})
	.catch(function(err) {
		writeError(403, res, err.message);
	});
}

function deleteTag(req, res) {
	var tagName = util.decodeURIComponent(req.params.tagName);
	return clone.getRepo(req)
	.then(function(repo) {
		return git.Tag.delete(repo, tagName);
	})
	.then(function(resp) {
		if (!resp) {
			res.status(200).end();
		} else {
			writeError(403, res);
		} 
	})
	.catch(function(err) {
		writeError(403, res, err.message);
	});
}
};
