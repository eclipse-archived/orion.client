/*******************************************************************************
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/
var fmt = require("util").format,
    jsDAV = require("jsDAV"),
    pkgName = require("../../package.json").name;

function isDebugMode() {
	// Determine if debug flag `cf-launcher:*` or `cf-launcher:webdav` is set
	var debugFlags = (process.env.DEBUG || "").split(/\s*,\s*/);
	return debugFlags.indexOf(pkgName + ":*") !== -1 || debugFlags.indexOf(pkgName + ":webdav") !== -1;
}

exports.createServer = function(options) {
	var port = options.port,
	    launcherPassword = options.password,
	    backend = options.authBackend,
	    realm = options.realm;

	if (!port || !launcherPassword || !backend || !realm)
		throw new Error("Missing required parameter");
	try {
		jsDAV.debugMode = isDebugMode();
		return jsDAV.createServer({
			// Expose the parent directory of the one that cf-launcher is installed in, which should be the
			// target app being debugged
			node: __dirname + "/../../../../",
			realm: realm,
			authBackend: backend,
		}, port);
	} catch (e) {
		// Workaround for https://github.com/c9/node-gnu-tools/issues/11 on Windows. If jsDAV blew up, just
		// return a no-op server, so cf-launcher will still run (with no DAV support).
		console.error(fmt("**** Could not load jsDAV, WebDAV features will not be available: %s", e.message));
		return {
			listen: Function.prototype
		};
	}
};
