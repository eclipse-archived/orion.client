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
var httpProxy = require("http-proxy"),
    nodeutil = require("util"),
    util = require("../util");

var PROXY_ERR = "Error proxying to %s. Check application logs.";

/**
 * Manages a set of <tt>http-proxy</tt> proxy servers targeting different ports on localhost.
 * @name ProxyManager
 * @class
 * @param {Number} basePort
 */
function ProxyManager(basePort) {
	this.nextPort = basePort + 1;
}
/**
 * @param {Object} setup A map of <tt>name</tt> to <tt>{ port: Number?, ws: Boolean? }</tt>.
 * @returns {Object} A map of <tt>name</tt> to {@link ProxyConfig}
 */
ProxyManager.prototype.createProxies = function(setup) {
	var that = this;
	var result = Object.create(null);
	Object.keys(setup).forEach(function(name) {
		var config = setup[name] || {},
		    port = (typeof config.port === "number" ? config.port : that.nextPort++);

		var proxy = new httpProxy.createProxyServer({
			target: {
				hostname: "localhost",
				port: port,
				ws: !!(config.ws),
			}
		});
		proxy.on("error", function(err, socket, res) {
			util.log("Error proxying to %s: %s", name, err);
			if (res.writeHead)
				res.send(500, nodeutil.format(PROXY_ERR, name));
			else if (socket.close)
				socket.close();
		});
		result[name] = {
			port: port,
			proxy: proxy,
		};
	});
	return result;
};

/**
 * @name ProxyConfig
 * @class
 * @property {Number} port The target port of the proxy.
 * @property {Proxy} The underlying proxy server returned by <tt>http-proxy</tt>.
 */

module.exports = ProxyManager;
