/*******************************************************************************
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/
var url = require('url');

/*
 * Sadly, the Orion client code expects http://orionserver/file and http://orionserver/file/ 
 * to both point to the File API. That's what this helper is for.
 */
function pathMatch(root, path) {
	var len = root.length;
	if (root[len-1] === '/') {
		root = root.substring(0, --len - 1);
	}
	return path.substring(0, len) === root && (path.length <= len || path[len] === '/');
}

/*
 * Returns the tail of the path after root has been matched.
 */
function rest(root, path) {
	if (!pathMatch(root, path)) {
		return null;
	}
	var tail = path.substring(root.length);
	return tail[0] === '/' ? tail.substring(1) : tail;
}

/*
 * Joins a bunch of junk into a path, like the path component of a URL.
 */
function join(/*varags*/) {
	var segs = Array.prototype.slice.call(arguments);
	var path = [];
	for (var i=0; i < segs.length; i++) {
		var segment = segs[i];
		// This is kind of cheesy: avoid double-slashes
		var last = segment.length-1;
		path.push(segment[last] === '/' ? segment.substring(0, last) : segment);
//		path.push(segment);
	}
	return path.join('/');
}

/**
 * Helper for writing a JSON response.
 * @param {Number} code
 * @param {HttpResponse} res
 * @param {Object} [headers]
 * @param {Object|String} [body] If Object, response will be JSON. If string, response will be text/plain.
 */
function write(code, res, headers, body) {
	if (typeof code === 'number') {
		res.statusCode = code;
	}
	if (headers && typeof headers === 'object') {
		Object.keys(headers).forEach(function(header) {
			res.setHeader(header, headers[header]);
		});
	}
	if (typeof body !== 'undefined') {
		var contentType = typeof body === 'object' ? 'application/json' : 'text/plain';
		body = typeof body === 'object' ? body = JSON.stringify(body) : body;
		res.setHeader('Content-Type', contentType);
		res.setHeader('Content-Length', body.length);
		res.end(body);
	} else {
		res.end();
	}
}

/**
 * Helper for writing an error JSON response.
 * @param {Number} code
 * @param {HttpResponse} res
 * @param {String|Error} [msg]
 */
function writeError(code, res, msg) {
	msg = msg instanceof Error ? msg.message : msg;
	if (typeof msg === 'string') {
		var err = JSON.stringify({Error: msg, Message: msg});
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Length', err.length);
		res.writeHead(code, msg);
		res.end(err);
	} else {
		res.writeHead(code, msg);
		res.end();
	}
}

/**
 * Util for stripping host names from URLs on this server. If aUrl indicates a resource on this host (as given by the request's Host header),
 * returns the URL with this server's host removed. Otherwise, returns aUrl unmodified.
 * <p>
 * eg. matchHost({ host: 'foo.com:8081' }, 'http://foo.com/file/fizz.txt') returns '/file/fizz.txt'<br>
 * eg. matchHost({ host: 'foo.com:8081' }, 'http://bar.com/action?frob=quux') returns 'http://bar.com/action?frob=quux'
 * </p.
 * @param {HttpRequest}
 * @param {String} url
 * @returns {String} The resulting URL
 */
function matchHost(req, aUrl) {
	var thisServer = {
		host: req.headers.host
	};
	var parsedUrl = url.parse(aUrl);
	if (parsedUrl.host === thisServer.host) {
		parsedUrl.host = '';
		return url.format(parsedUrl);
	}
	return aUrl;
}

exports.pathMatch = pathMatch;
exports.matchHost = matchHost;
exports.rest = rest;
exports.join = join;
exports.writeError = writeError;
exports.write = write;