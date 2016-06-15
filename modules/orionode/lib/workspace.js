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
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var path = require('path');
var util = require('util');
var api = require('./api');
var fileUtil = require('./fileUtil');
var writeError = api.writeError;

module.exports = function(options) {
	var workspaceRoot = options.root;
	var fileRoot = options.fileRoot;
	if (!workspaceRoot) {
		throw new Error('options.root path required');
	}

	var workspaceId = 'orionode';

	/**
	 * @returns {String} The URL of the workspace middleware, with context path.
	 */
	function originalWorkspaceRoot(req) {
		return workspaceRoot;
	}
	function originalFileRoot(req) {
		return fileRoot;
	}
	function makeProjectContentLocation(req, projectName) {
		return api.join(originalFileRoot(req), projectName);
	}
	function makeProjectLocation(req, projectName) {
		return api.join(fileRoot, projectName);
	}

	var router = express.Router({mergeParams: true});
	router.use(bodyParser.json());

	router.get('*', function(req, res) {
		var rest = req.params["0"].substring(1);
		var workspaceRootUrl = originalWorkspaceRoot(req);
		var workspaceName = path.basename(req.user.workspaceDir);
		if (rest === '') {
			// http://wiki.eclipse.org/Orion/Server_API/Workspace_API#Getting_the_list_of_available_workspaces
			fileUtil.withStats(req.user.workspaceDir, function(err, stats) {
				if (err) {
					api.writeError(500, res, "Could not open the workspace directory");
					return;
				}
				api.write(null, res, null, {
					Id: 'anonymous',
					Name: 'anonymous',
					UserName: 'anonymous',
					Workspaces: [{
						Id: workspaceId,
						LastModified: stats.mtime.getTime(),
						Location: api.join(workspaceRootUrl, workspaceId),
						Name: workspaceName
					}]
				});
			});
		} else if (rest === workspaceId) {
			var parentFileLocation = originalFileRoot(req);
			var workspaceJson;
			fileUtil.getChildren(fileRoot, req.user.workspaceDir, req.user.workspaceDir, 1)
			.then(function(children) {
				// TODO this is basically a File object with 1 more field. Should unify the JSON between workspace.js and file.js
				var location = api.join(workspaceRootUrl, workspaceId);
				children.forEach(function(child) {
					child.Id = child.Name;
				});
				workspaceJson = {
					Directory: true,
					Id: workspaceId,
					Name: workspaceName,
					Location: location,
					ChildrenLocation: location,
					Children: children,
					Projects: children.map(function(c) {
						return {
							Id: c.Name,
							Location:  api.join(parentFileLocation, c.Name),
						};
					})
				};
				return Promise.all(fileUtil.getDecorators().map(function(decorator){
					return decorator(workspaceRoot, req, "", workspaceJson);			
					})
				);
			})
			.then(function(){
				api.write(null, res, null, workspaceJson);
			})
			.catch(api.writeError.bind(null, 500, res));
		} else {
			res.statusCode = 400;
			res.end(util.format('workspace not found: %s', rest));
		}
	});

	router.post('*', function(req, res) {
		var rest = req.params["0"].substring(1);
		var err;
		if (rest === '') {
			// Create workspace. unsupported
			err = {Message: 'Unsupported operation: create workspace'};
			res.status(403).json(err);
		} else if (rest === workspaceId) {
			var projectName = fileUtil.decodeSlug(req.headers.slug) || req.body && req.body.Name;
			if (!projectName) {
				err = {Message: 'Missing "Slug" header or "Name" parameter'};
				res.status(400).json(err);
				return;
			}
			// Move/Rename a project
			var location = req.body && req.body.Location;
			if (location) {
				var filepath = fileUtil.safeFilePath(req.user.workspaceDir, projectName);
				// Call the File POST helper to handle the filesystem operation. We inject the Project-specific metadata
				// into the resulting File object.
				fileUtil.handleFilePOST(fileRoot, req, res, filepath, {
					Id: projectName,
					ContentLocation: makeProjectContentLocation(req, projectName),
					Location: makeProjectLocation(req, projectName)
				}, /*renaming a project is always 200 status*/ 200);
				return;
			}
			// Create a project
			fs.mkdir(fileUtil.safeFilePath(req.user.workspaceDir, projectName), parseInt('0755', 8), function(error) {
				if (error) {
					err = {Message: error};
					res.status(400).json(err);
				} else {
					api.write(201, res, null, {
						Id: projectName,
						ContentLocation: makeProjectContentLocation(req, projectName), // Important
						Location: makeProjectLocation(req, projectName) // not important
					});
				}
			});
		}
	});

	router.put('*', function(req, res) {
		if (req.body.Location && options.options.configParams["orion.single.user"]) {
			options.options.workspaceDir = req.body.Location;
			return res.status(200).end();
		}
		writeError(403, res);
	});

	router.delete('*', /* @callback */ function(req, res) {
		// Would 501 be more appropriate?
		writeError(403, res);
	});

	return router;
};
