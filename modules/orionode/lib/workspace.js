/*******************************************************************************
 * Copyright (c) 2012, 2016, 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/
var express = require('express');
var bodyParser = require('body-parser');
var log4js = require('log4js');
var logger = log4js.getLogger('workspace');
var api = require('./api'), writeError = api.writeError, writeResponse = api.writeResponse;
var fileUtil = require('./fileUtil');
var metaUtil = require('./metastore/util/metaUtil');

module.exports = function(options) {
	var fileRoot = options.fileRoot;
	var workspaceRoot = options.workspaceRoot;
	if (!fileRoot) { throw new Error('options.fileRoot is required'); }
	if (!workspaceRoot) { throw new Error('options.workspaceRoot is required'); }
	
	var singleUser = options.options && options.options.configParams["orion.single.user"];
	
	var router = express.Router({mergeParams: true});
	router.use(bodyParser.json());
	router.get('*', getWorkspace);
	router.post('*', postWorkspace);
	router.put('*', putWorkspace);
	router.delete('*', deleteWorkspace);
	return router;

	function getWorkspaceJson(req, workspace) {
		var workspaceJson;
		var workspaceLocation = api.join(workspaceRoot, workspace.id);
		var parentFileLocation = api.join(fileRoot, workspace.id);
		var workspaceDir = fileUtil.getMetastore(req).getWorkspaceDir(workspace.id);
		return fileUtil.getChildren(parentFileLocation, workspaceLocation, workspaceDir, workspaceDir, 1)
		.then(function(children) {
			children.forEach(function(child) {
				child.Id = child.Name;
			});
			var projects = [];
			children.forEach(function(c) {
				if (!c.Directory) return;
				projects.push({
					Id: c.Name,
					Location:  c.Location,
				});
			});
			workspaceJson = {
				Directory: true,
				Id: workspace.id,
				Name: workspace.name,
				Location: workspaceLocation,
				ChildrenLocation: workspaceLocation,
				ContentLocation: parentFileLocation,
				Children: children,
				Projects: projects
			};
			return Promise.all(fileUtil.getDecorators().map(function(decorator) {
				return decorator.decorate(req, {workspaceDir: workspaceDir, workspaceId: workspace.id, path: ""}, workspaceJson);
			}));
		}).then(function() {
			return workspaceJson;
		});
	}
	
	function logAccess(userId) {
		if (userId) {
			logger.info("WorkspaceAccess: " + userId);
		}
	}

	function getWorkspace(req, res) {
		var rest = req.params["0"].substring(1);
		var store = fileUtil.getMetastore(req);
		if (rest === '') {
			var userId = req.user.username;
			logAccess(userId);
			var workspaceJson = {
				Id: userId,
				Name: userId,
				UserName: req.user.fullname || userId
			};
			
			return metaUtil.getWorkspaceMeta(req.user.workspaces, store, workspaceRoot)
			.then(function(workspaceInfos){
				workspaceJson.Workspaces = workspaceInfos || [];
				return api.writeResponse(null, res, null, workspaceJson, true);
			});
		}
		var workspaceId = rest;
		store.getWorkspace(workspaceId, function(err, workspace) {
			if (err) {
				return writeError(400, res, err);
			}
			if (!workspace) {
				return writeError(404, res, "Workspace not found: " + rest);
			}
			getWorkspaceJson(req, workspace).then(function(workspaceJson){
				api.writeResponse(null, res, null, workspaceJson, true);
			});
		});
		
	}

	function postWorkspace(req, res) {
		var rest = req.params["0"].substring(1);
		var store = fileUtil.getMetastore(req), workspaceId;
		if (rest === '') {
			var userId = req.user.username;
			logAccess(userId);
			var workspaceName = req.body && req.body.Name || fileUtil.decodeSlug(req.headers.slug);
			workspaceId = req.body && req.body.Id;
			store.createWorkspace(userId, {name: workspaceName, id: workspaceId}, function(err, workspace) {
				if (err) {
					return writeError(singleUser ? 403 : 400, res, err);
				}
				getWorkspaceJson(req, workspace).then(function(workspaceJson) {
					return api.writeResponse(null, res, null, workspaceJson, true);
				}).catch(function(err) {
					api.writeResponse(400, res, null, err);
				});
			});
		} else {
			var projectName = fileUtil.decodeSlug(req.headers.slug) || req.body && req.body.Name;
			if (!projectName) {
				var err = {Message: 'Missing "Slug" header or "Name" parameter'};
				api.writeResponse(400, res, null, err);
				return;
			}
			workspaceId = rest;
			store.getWorkspace(workspaceId, function(err, workspace) {
				if (err) {
					return writeError(400, res, err);
				}
				if (!workspace) {
					return writeError(404, res, "Workspace not found: " + rest);
				}
				// Create/Move/Rename a project
				var projectLocation = api.join(fileRoot, workspace.id, projectName);
				var file = fileUtil.getFile(req, api.join(workspace.id, projectName));
				req.body.Directory = true;
				// Call the File POST helper to handle the filesystem operation. We inject the Project-specific metadata
				// into the resulting File object.
				fileUtil.handleFilePOST(workspaceRoot, fileRoot, req, res, file, {
					Id: projectName,
					ContentLocation: projectLocation,
					Location: projectLocation
				}, 200);
				store.updateProject && store.updateProject(workspace.id, {projectName:projectName, contentLocation:file.path, originalPath: req.body.Location});
			});
		}
	}

	function putWorkspace(req, res) {
		if (req.body.Location && singleUser) {
			var originalLocation = options.options.workspaceDir;
			options.options.workspaceDir = req.body.Location;
			api.getOrionEE().emit("workspace-changed",[req.body.Location,originalLocation]);
			return writeResponse(200, res);
		}
		return writeError(403, res);
	}

	function deleteWorkspace(req, res) {
		var rest = req.params["0"].substring(1);
		var file = fileUtil.getFile(req, rest);
		var store = fileUtil.getMetastore(req);
		store.deleteWorkspace(file.workspaceId, function(err) {
			if (err) {
				return writeError(singleUser ? 403 : 400, res, err);
			}
			fileUtil.rumRuff(file.workspaceDir, function(err) {
				if (err) {
					return writeError(400, res, err);
				}
				return writeResponse(200, res);
			});
		});
	}
};
