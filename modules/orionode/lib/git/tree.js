/*******************************************************************************
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *		 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node */
var api = require('../api'), writeError = api.writeError;
var git = require('nodegit');
var clone = require('./clone');
var path = require('path');
var express = require('express');
var util = require('./util');
var mime = require('mime');

module.exports = {};

module.exports.router = function(options) {
	var fileRoot = options.fileRoot;
	if (!fileRoot) { throw new Error('options.root is required'); }

	return express.Router()
	.get('/', getTree)
	.get('/file*', getTree);
	
function treeJSON(location, name, timestamp, dir, length) {
	location = api.toURLPath(location);
	return {
		Name: name,
		LocalTimeStamp: timestamp,
		Directory: dir,
		Length: length,
		Location: "/gitapi/tree" + location,
		ChildrenLocation: dir ? "/gitapi/tree" + location + "?depth=1": undefined,
		Attributes: {
			ReadOnly: true
		}
	};
}

function getTree(req, res) {
	var repo;
	
	if(clone.isWorkspace(req)){
		if (!req.params["0"]) {
			return clone.getClones(req, res, function(repos) {
				var tree = treeJSON("", "/", 0, true, 0);
				var children = tree.Children = [];
				function add(repos) {
					repos.forEach(function(repo) {
						children.push(treeJSON(repo.ContentLocation, repo.Name, 0, true, 0));
						if (repo.Children) add(repo.Children);
					});
				}
				add(repos, tree);
				res.status(200).json(tree);
			});
		}
	}
	
	var filePath;

	return clone.getRepo(req)
	.then(function(repoResult) {
		repo = repoResult;
		filePath = clone.getfileRelativePath(repo,req);
		return repo;
	})
	.then(function(repo) {
		function shortName(refName) {
			return refName.replace("refs/remotes/", "").replace("refs/heads/", "").replace("refs/tags/", "");
		}
		if (!filePath) {
			var location = fileRoot + (req.params["0"] || "");
			return git.Reference.list(repo)
			.then(function(refs) {
				return refs.map(function(ref) {
					return treeJSON(path.join(location, util.encodeURIComponent(ref)), shortName(ref), 0, true, 0);
				});
			})
			.then(function(children) {
				var tree = treeJSON(location, path.basename(req.params["0"] || ""), 0, true, 0);
				tree.Children = children;
				res.status(200).json(tree);
			});
		}
		var segments = filePath.split("/");
		var ref = util.decodeURIComponent(segments[0]);
		var p = segments.slice(1).join("/");
		return clone.getCommit(repo, ref)
		.then(function(commit) {
			return commit.getTree();
		}).then(function(tree) {
			var repoRoot =  clone.getfileDirPath(repo,req); 
			var refLocation = path.join(repoRoot, util.encodeURIComponent(ref));
			function createParents(data) {
				var parents = [], temp = data, l, end = "/gitapi/tree" + repoRoot;
				while (temp.Location.length > end.length) {
					l = path.dirname(temp.Location).replace(/^\/gitapi\/tree/, "") + "/";
					var dir = treeJSON(l, shortName(util.decodeURIComponent(path.basename(l))), 0, true, 0);
					parents.push(dir);
					temp = dir;
				}
				data.Parents = parents;
			}
			function sendDir(tree) {
				var l = path.join(refLocation, p);
				var result = treeJSON(l, shortName(util.decodeURIComponent(path.basename(l))), 0, true, 0);
				result.Children = tree.entries().map(function(entry) {
					return treeJSON(path.join(refLocation, entry.path()), entry.name(), 0, entry.isDirectory(), 0);
				});
				createParents(result);
				return res.status(200).json(result);
			}
			if (p) {
				return tree.getEntry(p)
				.then(function(entry) {
					if (entry.isFile()) {
						if (req.query.parts === "meta") {
							var result = treeJSON(path.join(refLocation, entry.path()), entry.name(), 0, entry.isDirectory(), 0);
							result.ETag = entry.sha();
							createParents(result);
							return res.status(200).json(result);
						}
						return entry.getBlob()
						.then(function(blob) {
							if(blob.isBinary()){
								var buffer = blob.content();
								var contentType = mime.lookup(entry.path());
								res.setHeader('Content-Type', contentType);
								res.setHeader('Content-Length', buffer.length);
                				res.status(200).end(buffer, 'binary');
							}else{
								var resp = blob.toString();
								res.setHeader('Content-Type', 'application/octect-stream');
								res.setHeader('Content-Length', resp.length);
								res.setHeader("ETag", "\"" + entry.sha() + "\"");
								res.status(200).end(resp);
							}
						});
					}
					return entry.getTree()
					.then(function(tree) {
						sendDir(tree);
					});
				});
			}
			sendDir(tree);
		});
	})
	.catch(function(err) {
		writeError(404, res, err.message);
	});
}

};
