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
var fileUtil = require('./fileUtil');
var express = require('express');
var log4js = require('log4js');
var logger = log4js.getLogger("git");
var checkRights = require('../index').checkRights;
var api = require('./api');

// Handle optional nodegit dependency
var hasNodegit = true;
try {
	var index = require('./git/index');
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
	var submodule = require('./git/submodule');
	var tree = require('./git/tree');
	var pullrequest = require('./git/pullrequest');
	var GitFileDecorator = require('./git/gitfiledecorator').GitFileDecorator;
} catch (e) {
	hasNodegit = false;
	if (e.code === "MODULE_NOT_FOUND" && e.message.indexOf("nodegit") >= 0) {
		logger.error("nodegit is not installed. Some features will be unavailable.");
	} else {
		logger.error("nodegit failed to load. " + e.message);
	}
}

if (hasNodegit) {
	module.exports = Git;
} else {
	module.exports = Nothing;
}

function Nothing() {
	var router = express.Router();
	router.use(/* @callback */ function(req, res) {
		res.status(404).json({
			Severity: "Error",
			Message: "Nodegit not installed."
		});
	});
	return router;
}

function Git(options) {
	var fileRoot = options.fileRoot;
	var gitRoot = options.gitRoot;
	var workspaceRoot = options.workspaceRoot;
	if (!fileRoot) { throw new Error('options.fileRoot is required'); }
	if (!gitRoot) { throw new Error('options.gitRoot is required'); }
	if (!workspaceRoot) { throw new Error('options.workspaceRoot is required'); }
	
	var router = express.Router();
	
	// General access check logic, which applies to mose of git endpoints, execpt clone, remote and config and also expect tree, which doesn't check at all
	options.checkUserAccess = function(req, res, next){
		var uri = req.url.split("?")[0];
		var uriSegs = uri.split("/");
		if(("/" + uriSegs[2]) === options.fileRoot){
			uriSegs.splice(1, 1);
			uri = uriSegs.join("/");
		}
		req.user.checkRights(req.user.username, uri, req, res, next);
	};
	
	router.use("/clone", clone.router(options));
	router.use("/status", status.router(options));
	router.use("/commit", commit.router(options));
	router.use("/index", index.router(options));
	router.use("/remote", remotes.router(options));
	router.use("/branch", branches.router(options));
	router.use("/config", config.router(options));
	router.use("/tag", tags.router(options));
	router.use("/blame", blame.router(options));
	router.use("/stash", stash.router(options));
	router.use("/diff", diff.router(options));
	router.use("/submodule", submodule.router(options));
	router.use("/tree", tree.router(options));
	router.use("/pullRequest", pullrequest.router(options));
	fileUtil.addDecorator(new GitFileDecorator(options));
	return router;
}
