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
var express = require('express');
var bodyParser = require('body-parser');
var clone = require('./clone');

module.exports = {};

module.exports.router = function(options) {
	var fileRoot = options.fileRoot;
	if (!fileRoot) { throw new Error('options.root is required'); }

	return express.Router()
	.use(bodyParser.json())
	.get('/file/*', getBlame);
	
function getBlame(req, res) {
	clone.getRepo(req)
	.then(function(repo) {
		git.Blame.file(repo, req.params["0"]).then(function(blame) {
			res.status(200).json(blame);
			return blame;
		});
	});
}
};