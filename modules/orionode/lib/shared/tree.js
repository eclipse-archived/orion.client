/*******************************************************************************
 * Copyright (c) 2016, 2017 IBM Corporation and others.
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
var path = require('path');
var express = require('express');
var mime = require('mime');
var sharedUtil = require('./sharedUtil');
var fileUtil = require('../fileUtil');
var fs = require('fs');
var sharedProjects = require('./db/sharedProjects');
var writeError = api.writeError;

module.exports = {};

module.exports.router = function(options) {
	var workspaceRoot = options.options.workspaceDir;
	var sharedRoot = options.root;
	if (!workspaceRoot) { throw new Error('options.options.workspaceDir required'); }
	var xfer = require('../xfer');
	var contextPath = options.options.configParams["orion.context.path"] || "";

	return express.Router()
	.get('/', getSharedWorkspace)
	.get('/file*', ensureAccess, getTree)
	.put('/file*', ensureAccess, putFile)
	.post('/file*', ensureAccess, postFile)
	.delete('/file*', ensureAccess, deleteFile)
	.get('/load/:hubId/*', loadFile)
	.put('/save/:hubId/*', saveFile)
	.get('/session/:hubId', checkSession)
	.get('/xfer/export*', getXfer)
	.post('/xfer/import*', postImportXfer);

	/**
	 * Get shared projects for the user.
	 */
	function getSharedWorkspace(req, res) {
		//if its the base call, return all Projects that are shared with the user
		return sharedUtil.getSharedProjects(req, res, function(projects) {
			var tree = sharedUtil.treeJSON("/", "", 0, true, 0, false);
			var children = tree.Children = [];
			function add(projects) {
				projects.forEach(function(project) {
					children.push(sharedUtil.treeJSON(project.Name, project.Location, 0, true, 0, false));
					if (project.Children) add(project.Children);
				});
			}
			add(projects, tree);
			tree["Projects"] = children.map(function(c) {
				return {
					Id: c.Name,
					Location:  c.Location,
				};
			});
			res.status(200).json(tree);
		});
	}

	function ensureAccess(req, res, next) {
		var project = sharedProjects.getProjectRoot(path.join(workspaceRoot, req.params["0"]));
		var username = req.user.username;

		sharedProjects.getUsersInProject(project)
		.then(function(users) {
			if (!project || !users || !users.some(function(user) {return user == username})) {
				res.writeHead(401, "Not authenticated");
				res.end();
			} else {
				next();
			}
		});
	}

	/**
	 * return files and folders below current folder or retrieve file contents.
	 */
	function getTree(req, res) {
		var tree;
		var filePath = fileUtil.safeFilePath(workspaceRoot, req.params["0"]);
		var fileRoot = req.params["0"];
		var readIfExists = req.headers ? Boolean(req.headers['read-if-exists']).valueOf() : false;
		fileUtil.withStatsAndETag(filePath, function(err, stats, etag) {
			if (err && err.code === 'ENOENT') {
				if(typeof readIfExists === 'boolean' && readIfExists) {
					res.sendStatus(204);
				} else {
					writeError(404, res, 'File not found: ' + filePath);
				}
			} else if (err) {
				writeError(500, res, err);
			} else if (stats.isDirectory()) {
				sharedUtil.getChildren(fileRoot, filePath, req.query.depth ? req.query.depth: 1)
				.then(function(children) {
					// TODO this is basically a File object with 1 more field. Should unify the JSON between workspace.js and file.js
					children.forEach(function(child) {
						child.Id = child.Name;
					});
					location = fileRoot;
					var name = path.win32.basename(filePath);
					tree = sharedUtil.treeJSON(name, location, 0, true, 0, false);
					tree["Children"] = children;
				})
				.then(function() {
					return sharedProjects.getHubID(filePath);
				})
				.then(function(hub){
					if (hub) {
						tree.Attributes = {};
						tree["Attributes"].hubID = hub;
					}
					res.status(200).json(tree);
				})
				.catch(api.writeError.bind(null, 500, res));
			} else if (stats.isFile()) {
				if (req.query.parts === "meta") {
					var name = path.win32.basename(filePath);
					var result = sharedUtil.treeJSON(name, fileRoot, 0, false, 0, false);
					result.ETag = etag;
					sharedProjects.getHubID(filePath)
					.then(function(hub){
						if (hub) {
							result["Attributes"].hubID = hub;
						}
						return res.status(200).json(result);
					});
				} else {
					sharedUtil.getFile(res, filePath, stats, etag);
				}
			}
		});
	}

	/**
	 * For file save.
	 */
	function putFile(req, res) {
		var filepath = fileUtil.safeFilePath(workspaceRoot, req.params["0"]);
		var fileRoot = req.params["0"];
		if (req.params['parts'] === 'meta') {
			// TODO implement put of file attributes
			res.sendStatus(501);
			return;
		}
		function write() {
			var ws = fs.createWriteStream(filepath);
			ws.on('finish', function() {
				fileUtil.withStatsAndETag(filepath, function(error, stats, etag) {
					if (error && error.code === 'ENOENT') {
						res.status(404).end();
						return;
					}
					writeFileMetadata(fileRoot, req, res, filepath, stats, etag);
				});
			});
			ws.on('error', function(err) {
				writeError(500, res, err);
			});
			req.pipe(ws);
		}
		var ifMatchHeader = req.headers['if-match'];
		fileUtil.withETag(filepath, function(error, etag) {
			if (error && error.code === 'ENOENT') {
				res.status(404).end();
			}
			else if (ifMatchHeader && ifMatchHeader !== etag) {
				res.status(412).end();
			}
			else {
				write();
			}
		});
	}

	/**
	 * For file create/move/copy.
	 */
	function postFile(req, res) {
		var rest = req.params["0"].substring(1);
		var diffPatch = req.headers['x-http-method-override'];
		if (diffPatch === "PATCH") {
			handleDiff(req, res, rest, req.body);
			return;
		}
		var name = fileUtil.decodeSlug(req.headers.slug) || req.body && req.body.Name;
		if (!name) {
			writeError(400, res, new Error('Missing Slug header or Name property'));
			return;
		}

		req.user.workspaceDir = workspaceRoot;
		var filepath = path.join(workspaceRoot, rest, name);
		fileUtil.handleFilePOST(null, contextPath + sharedRoot, req, res, filepath);
	}

	/**
	 * For file delete.
	 */
	function deleteFile(req, res) {
		var rest = req.params["0"].substring(1);
		var filepath = fileUtil.safeFilePath(workspaceRoot, rest);
		fileUtil.withStatsAndETag(filepath, function(error, stats, etag) {
			var callback = function(error) {
				if (error) {
					writeError(500, res, error);
					return;
				}
				res.sendStatus(204);
			};
			var ifMatchHeader = req.headers['if-match'];
			if (error && error.code === 'ENOENT') {
				return res.sendStatus(204);
			} else if (error) {
				writeError(500, res, error);
			} else if (ifMatchHeader && ifMatchHeader !== etag) {
				return res.sendStatus(412);
			} else if (stats.isDirectory()) {
				fileUtil.rumRuff(filepath, callback);
			} else {
				fs.unlink(filepath, callback);
			}
		});
	}

	function writeFileMetadata(fileRoot, req, res, filepath, stats, etag) {
		var result;
		return fileJSON(fileRoot, workspaceRoot, filepath, stats)
		.then(function(originalJson){
			result = originalJson;
			if (etag) {
				result.ETag = etag;
				res.setHeader('ETag', etag);
			}
			res.setHeader("Cache-Control", "no-cache");
			api.write(null, res, null, result);
		})
		.catch(api.writeError.bind(null, 500, res));
	};

	function fileJSON(fileRoot, workspaceDir, filepath, stats) {
		var isDir = stats.isDirectory();
		if (!isDir) {
			var wwwpath = api.toURLPath(filepath.substring(workspaceDir.length + 1));
			var name = path.win32.basename(filepath);
			var timeStamp = stats.mtime.getTime(),
			result = sharedUtil.treeJSON(name, fileRoot, timeStamp, isDir, 0, false);
			result.ChildrenLocation = {pathname: result.Location, query: {depth:1}};
			result.ImportLocation = result.Location.replace(/\/sharedWorkspace\/tree\/file/, "/sharedWorkspace/tree/xfer/import").replace(/\/$/, "");
			result.ExportLocation = result.Location.replace(/\/sharedWorkspace\/tree\/file/, "/sharedWorkspace/tree/xfer/export").replace(/\/$/, "") + ".zip";
			return Promise.resolve(result);
		}
	}

	/**
	* Get request from websocket server to load a file. Requires project HUBID and relative file path.
	**/
	function loadFile(req, res) {
		if (req.user) {
			// User access is not allowed. This method is only for the collab server
			writeError(403, res, 'Forbidden');
			return;
		}
		var relativeFilePath = req.params['0'];
		var hubid = req.params['hubId'];

		return sharedProjects.getProjectPathFromHubID(hubid)
		.then(function(filepath) {
			if (!filepath) {
				writeError(404, res, 'Session not found: ' + hubid);
				return;
			}
			// remove project name from path
			filepath = filepath.substring(0, filepath.lastIndexOf(path.sep));
			filepath = path.join(filepath, relativeFilePath);
			req.params['0'] = filepath;
			getTree(req, res);
		});
	}

	function saveFile(req, res) {
		if (req.user) {
			// User access is not allowed. This method is only for the collab server
			writeError(403, res, 'Forbidden');
			return;
		}
		var relativeFilePath = req.params['0'];
		var hubid = req.params['hubId'];

		return sharedProjects.getProjectPathFromHubID(hubid)
		.then(function(filepath) {
			if (!filepath) {
				writeError(404, res, 'Session not found: ' + hubid);
				return;
			}
			//remove project name from path
			filepath = filepath.substring(0, filepath.lastIndexOf(path.sep));
			filepath = path.join(filepath, relativeFilePath);
			req.params['0'] = filepath;
			putFile(req, res);
		});
	}

	function checkSession(req, res) {
		if (req.user) {
			// User access is not allowed. This method is only for the collab server
			writeError(403, res, 'Forbidden');
			return;
		}
		var hubid = req.params['hubId'];
		return sharedProjects.getProjectPathFromHubID(hubid)
		.then(function(filepath) {
			if (!filepath) {
				writeError(404, res, 'Session not found: ' + hubid);
				return;
			} else {
				res.write('{}');
				res.end();
				return;
			}
		});
	}

	/**
	 * Export
	 */
	function getXfer(req, res) {
		var filePath = req.params["0"];
		
		if (path.extname(filePath) !== ".zip") {
			return writeError(400, res, "Export is not a zip");
		}
		
		filePath = fileUtil.safeFilePath(workspaceRoot, filePath.replace(/.zip$/, ""));
		xfer.getXferFrom(req, res, filePath);
	}

	/**
	 * Import
	 */
	function postImportXfer(req, res) {
		var filePath = req.params["0"];
		filePath = fileUtil.safeFilePath(workspaceRoot, filePath);
		xfer.postImportXferTo(req, res, filePath);
	}
};
