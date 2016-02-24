/*******************************************************************************
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/
var api = require("../api"),
    nodeUrl = require("url");

// Express middleware that consumes the Orion servlet prefix from the request URL.
// Sets the `req.pathSuffix` property to the remainder of the path.
//
// @param root The root servlet prefix (/file, /workspace, etc)
module.exports = function(root) {
	if (!root) { throw "Orion root path required"; }

	return function(req, res, next) {
		var urlObj = req._parsedUrl || nodeUrl.parse(req.url);
		req.pathSuffix = api.rest(root, urlObj.pathname);
		next();
	};
};