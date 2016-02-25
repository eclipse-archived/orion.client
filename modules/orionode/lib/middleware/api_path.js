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
var nodeUrl = require("url");

// Express middleware that consumes the Orion servlet prefix from the request URL.
// Sets `req.contextPath` to the portion of the path preceding the servlet prefix,
// and `req.pathSuffix` property to the portion of the path following the servlet prefix.
//
// @param root The root servlet prefix (/file, /workspace, etc)
module.exports = function(root) {
	if (!root) {
		throw new Error("Orion root path required");
	}

	return function(req, res, next) {
		if (!req._parsedOriginalUrl) {
			req._parsedOriginalUrl = nodeUrl.parse(req.originalUrl);
		}
		var urlObj = req._parsedOriginalUrl;
		var idx = urlObj.pathname.indexOf(root);
		if (idx === -1) {
			req.pathSuffix = req.contextPath = null;
			return next();
		}
		// Split url into: {contextPath}/{root}/{pathSuffix}
		req.contextPath = urlObj.pathname.substr(0, idx);
		var suffix = urlObj.pathname.substr(idx + root.length);
		if (suffix[0] === "/") {
			// TODO: controllers should tolerate pathPuffix with a leading slash, but for now we strip it off
			suffix = suffix.substr(1);
		}
		req.pathSuffix = suffix;

		//console.log("URL:", req.url, "-> suffix:", "'" + req.pathSuffix + "'", "root:", root, "baseUrl:", req.baseUrl, "originalUrl:", req.originalUrl)
		next();
	};
};