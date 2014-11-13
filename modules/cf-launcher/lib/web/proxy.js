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
    proxylogger = require("../logger")("proxy");

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
 * @param {Object} setup A map of <tt>name</tt> to <tt>{Object}</tt>, the value is passed to 
 * httpProxy.createProxyServer().
 * @returns {Object} A map of <tt>name</tt> to {@link ProxyConfig}
 */
ProxyManager.prototype.createProxies = function(setup) {
	var that = this;
	var result = Object.create(null);
	Object.keys(setup).forEach(function(name) {
		var config = setup[name] || {},
		    port = that.nextPort++;

		config.target = config.target || {};
		config.target.hostname = "127.0.0.1"; // localhost
		config.target.port = port;
		var proxy = new httpProxy.createProxyServer(config);
		proxy.on("error", function(err, socket, res) {
			proxylogger("Error proxying to %s: %s", name, err);
			if (res.writeHead)
				res.send(500, nodeutil.format(PROXY_ERR, name));
			else if (socket.close)
				socket.close();
		});
		result[name] = {
			port: port,
			proxy: proxy,
		};
		proxylogger("Creating proxy config: %s --proxy--> port :%s ", name, port);
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
