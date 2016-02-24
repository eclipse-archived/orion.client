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
var ETag = require("../util/etag"),
    stream = require("stream");

// Middleware that provides the Orion ETag for the request body as `req.etag`.
// This middleware must run after bodyParser.raw()
module.exports = function bodyETagParser() {
	return function(req, res, next) {
		var body = req.body;
		if (!Buffer.isBuffer(body)) {
			next(new Error("Expected request body to be a Buffer"));
			return;
		}

		var etag = ETag();
		var bufstream = new stream.PassThrough();
		bufstream.pipe(etag);
		bufstream.end(body);
		bufstream.on("end", function() {
			req.etag = etag.read();
			next();
		})
	};
};