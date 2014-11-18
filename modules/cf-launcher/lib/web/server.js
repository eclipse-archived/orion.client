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
var http = require("http"),
    nodeurl = require("url"),
    isAuthenticated = require("./auth").isAuthenticated,
    createApp = require("./app");

/**
 * @param {String} options.appName
 * @param {String[]} options.appCommand
 * @param {String} options.urlPrefix
 * @param {Number} options.port Port we should listen on.
 */
function startServer(options) {
	var launcherPrefix = options.urlPrefix,
	    port = options.port;

	var result = createApp(options),
	    proxies = result.proxies,
	    proxylogger = result.logger,
	    serverApp = result.serverApp,
	    processManager = result.processManager,
	    authMiddleware = result.authMiddleware;

	var server = http.createServer(serverApp);
	// WebSocket proxy logic. This has to live at the server level: listen to `upgrade` event and proxy incoming
	// WebSocket requests to either inspector, tty, or user app.
	// TODO: clean this up -- there has to be a better way
	server.on("upgrade", function(req, socket, head) {
		var url = req._parsedUrl || nodeurl.parse(req.url),
		    url_str = nodeurl.format(url),
		    segs = url.pathname.split("/").slice(1), rootSegment = segs[0];
		if (rootSegment !== launcherPrefix) {
			proxylogger("ws request %s -> target app", url_str);
			return proxies.target.proxy.ws(req, socket, head); // not for us, send to user app
		}

		// At this point we know the request is for something in the launcher, either inspector or TTY
		var service = segs[1], destinationProxy, destProxyName;
		if (service === "ws") {
			// node-inspector makes a ws connection to "ws://[whatever]/launcher/ws?", which we catch here.
			destProxyName = "node-inspector";
			destinationProxy = proxies.inspector.proxy;
		} else if (service === "tty") {
			// Hack: we have a url like /launcher/tty/socket.io?foo but tty.js is expecting /socket.io?foo
			// so chop off the leading 2 segments and shove the result back into req.url before proxying
			// TODO try http-proxy forward or forwardPath
			proxylogger("ws request %s --> rewrite for tty", url_str);
			url.pathname = "/" + segs.slice(2).join("/");
			req._parsedUrl = url;
			req.url = nodeurl.format(url);
			destProxyName = "tty.js";
			destinationProxy = proxies.tty.proxy;
		}
		// Check login
		// TODO why do we have to call this again? Does `req` not go through the express app?
		authMiddleware(req, {}, function(/*err*/) {
			if (isAuthenticated(req)) {
				proxylogger("  Auth check passed, ws %s --> %s ", req.url, destProxyName);
				return destinationProxy.ws(req, socket, head);
			}
			proxylogger("  Auth check failed, destroying ws socket: %s (%s)", req.url, req.ip);
			return socket.destroy();
		});
	});
	processManager.on("debuggerListening", function() {
		server.emit("initialized");
	});
	server.listen(port);
	return server;
}

module.exports = startServer;