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
var crypto = require("crypto"),
    fmt = require("util").format,
    jsDAV = require("jsDAV"),
    jsDAV_Auth_Backend_AbstractDigest = require("jsDAV/lib/DAV/plugins/auth/abstractDigest"),
    util = require("../util");
	
function md5(str) {
	return crypto.createHash("md5").update(str).digest("hex");
}

exports.createServer = function(port, password) {
	if (!port || !password)
		throw new Error("Missing required parameter");
	try {
		var auth = jsDAV_Auth_Backend_AbstractDigest.extend({
			/**
			 * Gets the digest (`HA1`) for the given realm and user.
			 * @param {Function} callback Must be invoked as <tt>callback(null, digest)</tt>.
			 */
			getDigestHash: function(realm, username, callback) {
				var str = username + ":" + realm + ":" + password;
				callback(null, md5(str));
			}
		});

		jsDAV.debugMode = true;
		return jsDAV.createServer({
			// Expose the parent directory of the one that cf-launcher is installed in, which should be the
			// target app being debugged
			node: __dirname + "/../../../../",
			authBackend: auth,
			realm: "App files (username is 'vcap')",
		}, port);
	} catch (e) {
		// Workaround for https://github.com/c9/node-gnu-tools/issues/11 on Windows. If jsDAV blew up, just
		// return a no-op server, so cf-launcher will still run (with no DAV support).
		console.error(fmt("Error loading jsDAV. WebDAV features will not be available."));
		util.log(e && e.stack);
		return {
			listen: Function.prototype
		};
	}
};
