/*******************************************************************************
 * Copyright (c) 2018 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/
var api = require("../api");
var log4js = require("log4js");

function shutdown(code, shutdownTimeout, logger) {
	var _shutdownTimer;
	_shutdownTimer = setTimeout(function() {
		_shutdownTimer = null;
		serverExit(1);
		setTimeout(function() {
			logger.info("Server hard shutdown, exiting: " + process.pid);
			process.exit(2);
		}, shutdownTimeout);
	}, shutdownTimeout);
	function serverExit(code) {
		(code ? logger.warn : logger.info).bind(logger)("Exiting " + process.pid + " with code: " + code + " (code=1 means timeout)");
		function done() {
			if (_shutdownTimer) clearTimeout(_shutdownTimer);
			logger.error("Server shutting down, exiting: " + process.pid + " code: "+ (code || 0));
			log4js.shutdown(function() {
				process.exit(code || 0);
			});
		}
		var data = {
			code: code,
			promises: []
		};
		api.getOrionEE().emit("close-socket", data);
		api.getOrionEE().emit("close-server", data);
		return Promise.all(data.promises).then(done, done);
	}
	serverExit(code);
}

module.exports.shutdown = shutdown;
