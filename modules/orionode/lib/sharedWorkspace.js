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

module.exports = function(options) {
	var fileRoot = options.fileRoot;
	if (!fileRoot) { throw new Error('options.root path required'); }
	
	var router = express.Router();

	router.use("/tree", tree.router(options));
	router.use("/project", require('./shared/db/sharedProjects')(options));
	router.use("/user", require('./shared/db/userProjects')(options));
	fileUtil.addDecorator(sharedDecorator);
	sharedUtil(options);
	return router;
}