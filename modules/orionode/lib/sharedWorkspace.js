/*******************************************************************************
 * Copyright (c) 2016, 2017 IBM Corporation and others.
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
var tree = require('./shared/tree');
var sharedUtil = require('./shared/sharedUtil');
var sharedDecorator = require('./shared/sharedDecorator').sharedDecorator;
var jwt = require('jsonwebtoken');

module.exports.router = function(options, extraOptions) {

	/**
	 * This method ensures that the websocket trying to retrieve and save content is authenticated.
	 * We allow two different authentication methods: JWT for the collab server and user token for users.
	 */
	function checkCollabAuthenticated(req, res, next) {
		if (req.user) {
			req.user.workspaceDir = options.workspaceDir + (req.user.workspace ? "/" + req.user.workspace : "");
			next();
		} else if (req.headers['authorization'] && checkCollabServerToken(req.headers['authorization'])){
			next();
		} else {
			res.writeHead(401, "Not authenticated");
			res.end();
		}
	}

	/**
	 * Check the JWT token for collab server
	 */
	function checkCollabServerToken(authorization) {
		if (authorization.substr(0, 7) !== "Bearer ") {
			return false;
		}
		try {
			var decoded = jwt.verify(authorization.substr(7), options.configParams["orion.jwt.secret"]);
			return true;
		} catch (ex) {
			return false;
		}
	}

	extraOptions.options = options;
	var contextPath = options && options.configParams["orion.context.path"] || "";
	var fileRoot = extraOptions.fileRoot;
	if (!fileRoot) { throw new Error('extraOptions.root path required'); }
	extraOptions.fileRoot = contextPath + fileRoot;
	
	var router = express.Router();

	router.use("/tree", tree.router(extraOptions));
	router.use("/project", require('./shared/db/sharedProjects')(extraOptions));
	router.use("/user", require('./shared/db/userProjects')(extraOptions));
	fileUtil.addDecorator(sharedDecorator);
	sharedUtil(extraOptions);
	return [checkCollabAuthenticated, router];
}
