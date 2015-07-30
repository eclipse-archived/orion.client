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
/*eslint-env node*/

var connect = require('connect');
var api = require('./api');
var fileUtil = require('./fileUtil');
var resource = require('./resource');
var rmdir = require('rimraf');
var url = require('url');
var redirect = require('connect-redirection');
var writeError = api.writeError;

// Handle optional nodegit dependency
var hasNodegit = true;
try {
	var add = require('./git/add');
	var clone = require('./git/clone');
	var remotes = require('./git/remotes');
	var branches = require('./git/branches');
	var status = require('./git/status');
	var config = require('./git/config');
	var commit = require('./git/commit');
	var tags = require('./git/tags');
	var stash = require('./git/stash');
	var blame = require('./git/blame');
	var diff = require('./git/diff');
} catch (e) {
	if (e.code === "MODULE_NOT_FOUND" && e.message.indexOf("nodegit") >= 0) {
		hasNodegit = false;
	}
}

if (hasNodegit) {
	module.exports = Git;
} else {
	module.exports = Nothing;
}

function Nothing(/*req, res, next*/) {
	return connect();
}

function Git(options) {
	var workspaceRoot = options.root;
	var workspaceDir = options.workspaceDir;
	var fileRoot = options.fileRoot;
	if (!workspaceRoot) { throw new Error('options.root path required'); }
	return connect()
	.use(connect.json())
	.use(redirect())
	.use(resource(workspaceRoot, {
		GET: function(req, res, next, rest) {
			var query = url.parse(req.url, true).query;
			var diffOnly, uriOnly;
			if (rest === '') {
				writeError(400, res);
			} else if (rest.indexOf("clone/workspace/") === 0) {
				clone.getClone(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("remote/file/") === 0) {
				remotes.getRemotes(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("remote/") === 0 ) {
				var remote = rest.replace("remote/", "").substring(0, rest.lastIndexOf("/file/")-"/file/".length-1);
				if (remote.indexOf("/") === -1) {
					remotes.getRemotesBranches(workspaceDir, fileRoot, req, res, next, rest);
				}
				else {
					remotes.getRemotesBranchDetail(workspaceDir, fileRoot, req, res, next, rest);
				}
			} else if (rest.indexOf("branch/file/")===0) {
				branches.getBranches(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("branch/")===0) {
				branches.getBranchMetadata(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("status/file/") === 0) {
				status.getStatus(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("config/clone/file/") === 0) {
				config.getConfig(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("config/") === 0) {
				config.getAConfig(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("index/file/") === 0) {
				// I think this is working, but I'm not 100%, leave it out for now.
				add.getFileIndex(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("tag/file/") === 0) {
				tags.getTags(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("stash/file") === 0) {
				stash.getStash(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("blame/") === 0) {
				blame.getBlame(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("commit/") === 0) {
				commit.getCommit(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("diff/Default/file/") === 0) {
				diffOnly = query.parts === 'diff';
				uriOnly = query.parts === 'uris';

				diff.getDiffBetweenWorkingTreeAndHead(workspaceDir, fileRoot, req, res, next, rest, diffOnly, uriOnly);
			} else if (rest.indexOf("diff/Cached/file/") === 0) {
				diffOnly = query.parts === 'diff';
				uriOnly = query.parts === 'uris';

				diff.getDiffBetweenIndexAndHead(workspaceDir, fileRoot, req, res, next, rest, diffOnly, uriOnly);
			} else if (rest.indexOf("diff/") === 0) {
				diffOnly = query.parts === 'diff';
				uriOnly = query.parts === 'uris';

				diff.getDiffBetweenTwoCommits(workspaceDir, fileRoot, req, res, next, rest, diffOnly, uriOnly);
			} else {
				writeError(403, res);
			}
		},
		POST: function(req, res, next, rest) {
			if (rest.indexOf("clone/") === 0){
				clone.postInit(workspaceDir, fileRoot, req, res, next, rest);
			} else if(rest.indexOf("index/") === 0) {
				add.postStage(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("config/") === 0) {
				config.postConfig(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("commit/") === 0) {
				commit.postCommit(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("branch/") === 0) {
				branches.createBranch(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("diff/") === 0) {
				diff.getDiffLocation(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("remote/file/") === 0) {
				remotes.addRemote(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("remote/") === 0) {
				remotes.postRemote(workspaceDir, fileRoot, req, res, next, rest);
			} else {	
				writeError(403, res);
			}
		},
		PUT: function(req, res, next, rest) {
			if (rest.indexOf("index/") === 0) {
				add.putStage(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("config/") === 0) {
				config.putConfig(workspaceDir, fileRoot, req, res, next, rest);
			} else {
				// Would 501 be more appropriate?
				writeError(403, res);
			}
		},
		DELETE: function(req, res, next, rest) {
			if(rest.indexOf("clone/file/") === 0) {
				var configPath = rest.replace("clone/file", "");
				rmdir(fileUtil.safeFilePath(workspaceDir, configPath), function(err) {
					if (err) return writeError(500, res, err)
					res.statusCode = 200;
					res.end();
				});
			} else if (rest.indexOf("tag/") === 0) {
				tags.deleteTags(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("branch/") === 0) {
				branches.deleteBranch(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("remote/") === 0) {
				remotes.deleteRemote(workspaceDir, fileRoot, req, res, next, rest);
			} else {
				writeError(403, res);
			}
		}
	}));
};
