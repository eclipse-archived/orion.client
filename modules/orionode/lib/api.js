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
var events = require('events');
var log4js = require('log4js');
var logger = log4js.getLogger("response");
var orionEE;

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
		if (i > 0 && segment[0] === '/') segment = segment.substring(1);
		if (segment[last] === '/') segment = segment.substring(0, last);
		path.push(segment);
	}
	return path.join('/');
}

function toURLPath(p) {
	return p.replace(/\\/g, "/");
}

/**
 * Helper for send a status response
 * @param {Number} code
 * @param {HttpResponse} res
 */
function sendStatus(code, res){
	try{
		setResponseNoCache(res);
		return res.sendStatus(code);
	}catch(err){
		logger.error(res.req.originalUrl , err.message);
		throw err;
	}
}

/**
 * Helper for writing a JSON response.
 * @param {Number} code
 * @param {HttpResponse} res
 * @param {Object} [headers]
 * @param {Object|String} [body] If Object, response will be JSON. If string, response will be text/plain.
 * @param {Boolean} needEncodeLocation
 * @param {Boolean} noCachedStringRes,set to true in case if the response is text/plain, but still need nocache cache-control
 */
function writeResponse(code, res, headers, body, needEncodeLocation, noCachedStringRes) {
	try{
		if (typeof code === 'number') {
			res.status(code);
		}
		if (headers && typeof headers === 'object') {
			Object.keys(headers).forEach(function(header) {
				res.setHeader(header, headers[header]);
			});
		}
		if (typeof body !== 'undefined') {
			if (typeof body === 'object') {
				needEncodeLocation && encodeLocation(body);
				setResponseNoCache(res);			
				return res.json(body);
			}
			if(noCachedStringRes){
				setResponseNoCache(res);
			}
			res.send(body);
		} else {
			setResponseNoCache(res);
			res.end();
		}
	}catch(err){
		logger.error(res.req.originalUrl , err.message);
		throw err;
	}
}

function setResponseNoCache(res){
	res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1.
	res.setHeader("Pragma", "no-cache"); // HTTP 1.1.
	res.setHeader("Expires", "0"); // HTTP 1.1.		
}



var LocationRegex = /Location$/;
var PercentReplaceRegex = /\%/g;
function encodeLocation(obj) {
	for (var p in obj) {
		if (p.match(LocationRegex)) {
			if (Array.isArray(obj[p])) {
				obj[p].forEach(function(o) {
					encodeLocation(o);
				});
			} else if (typeof obj[p] === "object") {
				if(obj[p].pathname){
					obj[p].pathname = obj[p].pathname.replace(PercentReplaceRegex, "%25");
				}
				obj[p] = url.format(obj[p]);
			} else if (obj[p]) {
				obj[p] = url.format({pathname: obj[p].replace(PercentReplaceRegex, "%25")});
			}
		} else if (typeof obj[p] === "object") {
			encodeLocation(obj[p]);
		}
	}
	return obj;
}

/**
 * Helper for writing an error JSON response.
 * @param {Number} code
 * @param {HttpResponse} res
 * @param {String|Error} [msg]
 */
function writeError(code, res, msg) {
	try{
		msg = msg instanceof Error ? msg.message : msg;
		setResponseNoCache(res);
		if (typeof msg === 'string') {
			var err = JSON.stringify({Severity: "Error", Message: msg});
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Content-Length', err.length);
			res.writeHead(code, msg);
			res.end(err);
		} else {
			res.writeHead(code, msg);
			res.end();
		}
	}catch(err){
		logger.error(res.req.originalUrl , err.message);
		throw err;
	}
}

/**
 * @name isValidFileName
 * @description Helper for check file name is valid, doesn't allow slash, backslash inside filename, or empty string or white space as the filename
 * @param {string} fileName
 * @returns {boolean}
 * @since 16.0
 */
function isValidProjectName(fileName) {
	var result;
	result = ['',' ','/'].some(function(value){
		return value === fileName;
	});
	result |= ['/','\\'].some(function(value){
		return fileName.indexOf(value) > -1;
	});
	return !result;
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

var OrionEventEmitter = function(){};
OrionEventEmitter.prototype = new events.EventEmitter;

function getOrionEE(){
	if(!orionEE){
		orionEE = new OrionEventEmitter();
	}
	return orionEE;
}

exports.toURLPath = toURLPath;
exports.pathMatch = pathMatch;
exports.matchHost = matchHost;
exports.rest = rest;
exports.join = join;
exports.writeError = writeError;
exports.writeResponse = writeResponse;
exports.encodeLocation = encodeLocation;
exports.setResponseNoCache = setResponseNoCache;
exports.isValidProjectName = isValidProjectName;
exports.sendStatus = sendStatus;
exports.getOrionEE = getOrionEE;