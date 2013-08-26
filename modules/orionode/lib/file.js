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
/*global Buffer console module process require*/
var compat = require('./compat');
var connect = require('connect');
var fs = require('fs');
var path = require('path');
var url = require('url');
var api = require('./api'), write = api.write, writeError = api.writeError;
var fileUtil = require('./fileUtil'), ETag = fileUtil.ETag;
var resource = require('./resource');

var USER_WRITE_FLAG = parseInt('0200', 8);
var USER_EXECUTE_FLAG = parseInt('0100', 8);

function getParam(req, paramName) {
	var parsedUrl = url.parse(req.url, true);
	return parsedUrl && parsedUrl.query && parsedUrl.query[paramName];
}

/**
 * Copes with Orion server REST API's use of "true" and "false" strings
 */
function parseBoolean(obj) {
	if (typeof obj === 'boolean') {
		return obj;
	} else if (obj === 'false') {
		return false;
	}
	return !!obj;
}

function writeEmptyFilePathError(res, rest) {
	if (rest === '') {
		// I think this is an implementation detail, not API, but emulate the Java Orion server's behavior here anyway.
		writeError(403, res);
		return true;
	}
	return false;
}

/*
 *
 * Module begins here
 *
 */
module.exports = function(options) {
	var fileRoot = options.root;
	var workspaceDir = options.workspaceDir;
	if (!fileRoot) { throw 'options.root is required'; }
	if (!workspaceDir) { throw 'options.workspaceDir is required'; }

	var writeFileMetadata = fileUtil.writeFileMetadata.bind(null, fileRoot);
	var getSafeFilePath = fileUtil.safeFilePath.bind(null, workspaceDir);

	function writeFileContents(res, rest, filepath, stats, etag) {
		if (stats.isDirectory()) {
			//shouldn't happen
			writeError(500, res, "Expected a file not a directory");
		} else {
			var stream = fs.createReadStream(filepath);
			res.setHeader('Content-Length', stats.size);
			res.setHeader('ETag', etag);
			stream.pipe(res);
			stream.on('error', function(e) {
				res.writeHead(500, e.toString());
				res.end();
			});
			stream.on('end', function() {
				res.statusCode = 200;
				res.end();
			});
		}
	}

	/*
	 * Handler begins here
	 */
	return connect()
	.use(connect.json())
	.use(resource(fileRoot, {
		GET: function(req, res, next, rest) {
			if (writeEmptyFilePathError(res, rest)) {
				return;
			}
			var filepath = getSafeFilePath(rest);
			fileUtil.withStatsAndETag(filepath, function(error, stats, etag) {
				if (error && error.code === 'ENOENT') {
					writeError(404, res, 'File not found: ' + rest);
				} else if (error) {
					writeError(500, res, error);
				} else if (stats.isFile() && getParam(req, 'parts') !== 'meta') {
					// GET file contents
					writeFileContents(res, rest, filepath, stats, etag);
				} else {
					// TODO handle depth > 1 for directories
					var includeChildren = (stats.isDirectory() && getParam(req, 'depth') === '1');
					writeFileMetadata(res, rest, filepath, stats, etag, includeChildren);
				}
			});
		},
		PUT: function(req, res, next, rest) {
			if (writeEmptyFilePathError(res, rest)) {
				return;
			}
			var filepath = getSafeFilePath(rest);
			if (getParam(req, 'parts') === 'meta') {
				// TODO implement put of file attributes
				res.statusCode = 501;
				return;
			} else {
				// The ETag for filepath's current contents is computed asynchronously -- so buffer the request body
				// to memory, then write it into the real file once ETag is available.
				var requestBody = new Buffer(0);
				var requestBodyETag = new ETag(req);
				req.on('data', function(data) {
					requestBody = Buffer.concat([requestBody, data]);
				});
				req.on('error', function(e) {
					console.warn(e);
				});
				req.on('end', function(e) {
					var ifMatchHeader = req.headers['if-match'];
					if(!ifMatchHeader){//If etag is not defined, we are writing blob. In this case the file does not exist yet so we need create it.
						fs.writeFile(filepath, requestBody, function(error) {
							if (error) {
								writeError(500, res, error);
								return;
							}
							fs.stat(filepath, function(error, stats) {
								writeFileMetadata(res, rest, filepath, stats, requestBodyETag.getValue() /*the new ETag*/);
							});
						});
					} else {
						fileUtil.withStatsAndETag(filepath, function(error, stats, etag) {
							if (error && error.code === 'ENOENT') {
								res.statusCode = 404;
								res.end();
							} else if (ifMatchHeader && ifMatchHeader !== etag) {
								res.statusCode = 412;
								res.end();
							} else {
								// write buffer into file
								fs.writeFile(filepath, requestBody, function(error) {
									if (error) {
										writeError(500, res, error);
										return;
									}
									writeFileMetadata(res, rest, filepath, stats, requestBodyETag.getValue() /*the new ETag*/);
								});
							}
						});
					}
				});
			}
		},
		POST: function(req, res, next, rest) {
			if (writeEmptyFilePathError(res, rest)) {
				return;
			}
			var name = req.headers.slug || (req.body && req.body.Name);
			if (!name) {
				write(400, res, 'Missing Slug header or Name property');
				return;
			}

			var wwwpath = api.join(rest, encodeURIComponent(name)),
			    filepath = getSafeFilePath(path.join(rest, name));

			fileUtil.handleFilePOST(workspaceDir, fileRoot, req, res, wwwpath, filepath);
		},
		DELETE: function(req, res, next, rest) {
			if (writeEmptyFilePathError(res, rest)) {
				return;
			}
			var filepath = getSafeFilePath(rest);
			fileUtil.withStatsAndETag(filepath, function(error, stats, etag) {
				var ifMatchHeader = req.headers['if-match'];
				if (error && error.code === 'ENOENT') {
					res.statusCode = 204;
					res.end();
				} else if (ifMatchHeader && ifMatchHeader !== etag) {
					write(412, res);
				} else {
					var callback = function(error) {
						if (error) {
							writeError(500, res, error);
							return;
						}
						res.statusCode = 204;
						res.end();
					};
					if (stats.isDirectory()) {
						fileUtil.rumRuff(filepath, callback);
					} else {
						fs.unlink(filepath, callback);
					}
				}
			});
		}
	}));
};

