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
var git = require('nodegit');
var finder = require('findit');
var express = require('express');
var bodyParser = require('body-parser');

module.exports = {};

module.exports.router = function(options) {
	var fileRoot = options.fileRoot;
	var workspaceDir = options.workspaceDir;
	if (!fileRoot) { throw new Error('options.root is required'); }
	if (!workspaceDir) { throw new Error('options.workspaceDir is required'); }

	return express.Router()
	.use(bodyParser.json())
	.get('*', function(req, res) {
		return getBlame(req, res, req.url.split("?")[0]);
	});
	
function getBlame(req, res, rest) {
	finder(workspaceDir).on('directory', function (dir, stat, stop) {
		git.Repository.open(dir)
		.then(function(repo) {
			git.Blame.file(repo, dir).then(function(blame) {
				var resp = JSON.stringify(blame);
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.setHeader('Content-Length', resp.length);
				res.end(resp);
				return blame;
			});
		});
	});
}
};