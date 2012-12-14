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
var fs = require('fs');
var path = require('path');
var url = require('url');
var api = require('./api'), write = api.write, writeError = api.writeError;
var fileUtil = require('./fileUtil'), ETag = fileUtil.ETag;
var resource = require('./resource');

var USER_WRITE_FLAG = parseInt('0200', 8);
var USER_EXECUTE_FLAG = parseInt('0100', 8);

function getPartsParam(req) {
	var parsedUrl = url.parse(req.url, true);
	return parsedUrl && parsedUrl.query.parts;
}

function parseBoolean(strOrBool) {
	return typeof strOrBool === 'boolean' ? strOrBool : (strOrBool === 'false' ? false : true);
}

function writeEmptyFilePathError(res, rest) {
	if (rest === '') {
		// I think this is an implementation detail, not API, but emulate the Java Orion server's behavior here anyway.
		writeError(403, res);
	}
}

/*
 *
 * Module begins here
 *
 */
module.exports = function(options) {
	var fileRoot = options.root;
	var workspaceDir = options.workspaceDir;
	var tempDir = options.tempDir;
	if (!fileRoot) { throw 'options.root is required'; }

	function getSafeFilePath(rest) {
		return fileUtil.safeFilePath(workspaceDir, rest);
	}

	/** @returns {String} Path to a file in the temp dir that hopefully doesn't already exist. */
	function getTempFile(filepath) {
		var filename = new Buffer([process.pid, new Date().getTime(), filepath].join('/')).toString('base64');
		return path.join(tempDir, filename);
	}

	function getParents(filepath, wwwpath) {
		var segs = wwwpath.split('/');
		segs.pop();
		var loc = fileRoot;
		var parents = [];
		for (var i=0; i < segs.length; i++) {
			var seg = segs[i];
			loc = api.join(loc, seg);
			parents.push({
				Name: seg,
				ChildrenLocation: loc + '?depth=1', 
				Location: loc
			});
		}
		return parents.reverse();
	}

	function getContents(req, res, next, rest, filepath) {
		fs.exists(filepath, function(exists) {
			if (!exists) {
				res.setHeader('Content-Type', 'application/json');
				res.writeHead(404);
				res.end(JSON.stringify({Message: 'File not found: ' + rest}));
			} else {
				fs.stat(filepath, function(error, stats) {
					if (stats.isDirectory()) {
						// TODO ?depth parameter
						fileUtil.getChildren(filepath, api.join(fileRoot, rest)/*this dir*/, null/*omit nothing*/, function(children) {
							var name = path.basename(filepath);
							if (name[name.length-1] === path.sep) {
								name = name.substring(0, name.length-1);
							}
							var childrenJSON = JSON.stringify(children);
							var folder = JSON.stringify({
								Attributes: {},
								Children: children,
								Directory: true,
								ChildrenLocation: api.join(fileRoot, rest) + '?depth=1',
								LocalTimeStamp: stats.mtime.getTime(),
								Location: api.join(fileRoot, rest),
								Name: name,
								Parents: getParents(filepath, rest)
								
							});
							res.setHeader('Content-Type', 'application/json');
							res.setHeader('Content-Length', folder.length);
							res.end(folder);
						});
					} else {
						var stream = fs.createReadStream(filepath);
						res.setHeader('Content-Length', stats.size);
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
				});
			}
		});
	}

	function writeFileMetadata(res, rest, filepath, stats, etag) {
		var metaObj = {
			Name: path.basename(filepath),
			Location: api.join(fileRoot, rest),
			Directory: stats.isDirectory(),
			LocalTimeStamp: stats.mtime.getTime(),
			Parents: getParents(filepath, rest),
			ChildrenLocation: api.join(fileRoot, rest, '?depth=1'),
			//Charset: "UTF-8",
			Attributes: {
				// TODO fix this
				ReadOnly: false,//!(stats.mode & USER_WRITE_FLAG === USER_WRITE_FLAG),
				Executable: false//!(stats.mode & USER_EXECUTE_FLAG === USER_EXECUTE_FLAG)
			}
		};
		if (etag) {
			metaObj.ETag = etag;
		}
		var meta = JSON.stringify(metaObj);
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Length', meta.length);
		res.end(meta);
	}

	/*
	 * Handler begins here
	 */
	return resource(fileRoot, {
		GET: function(req, res, next, rest) {
			if (writeEmptyFilePathError(res, rest)) {
				return;
			}
			var filepath = getSafeFilePath(rest);
			if (getPartsParam(req) === 'meta') {
				// GET metadata
				fileUtil.withStatsAndETag(filepath, function(error, stats, etag) {
					if (error) {
						res.statusCode = 500;
						res.end({Message: error && error.toString()});
						return;
					}
					writeFileMetadata(res, rest, filepath, stats, etag);
				});
			} else {
				// GET file contents
				getContents(req, res, next, rest, filepath);
			}
		},
		PUT: function(req, res, next, rest) {
			if (writeEmptyFilePathError(res, rest)) {
				return;
			}
			var filepath = getSafeFilePath(rest);
			if (getPartsParam(req) === 'meta') {
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
					var etagHeader = req.headers['if-match'];
					fileUtil.withStatsAndETag(filepath, function(error, stats, etag) {
						if (error && error.code === 'ENOENT') {
							res.statusCode = 404;
							res.end();
						} else if (etagHeader && etagHeader !== etag) {
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
				});
			}
		},
		POST: function(req, res, next, rest) {
			function checkXCreateOptions(opts) {
				return opts.indexOf('copy') === -1 || opts.indexOf('move') === -1;
			}
			if (writeEmptyFilePathError(res, rest)) {
				return;
			}
			var name = req.headers.slug || (req.body && req.body.Name);
			if (!name) {
				write(400, res, 'Missing Slug header or Name property');
				return;
			}
			var destFilepath = getSafeFilePath(path.join(rest, name));
			fs.exists(destFilepath, function(destExists) {
				function writeCreatedFile(error) {
					if (error) {
						writeError(500, res, error);
						return;
					} else if (req.body) {
						// var fileAtts = req.body.Attributes;
						// TODO: maybe set ReadOnly and Executable based on fileAtts
					}
					// serialize the file metadata and we're done
					fileUtil.withStats(destFilepath, function(error, stats) {
						if (error) {
							writeError(500, res, error);
							return;
						}
						writeFileMetadata(res, rest, destFilepath, stats, null);
					});
				}
				function createFile() {
					if (req.body && parseBoolean(req.body.Directory) ) {
						fs.mkdir(destFilepath, writeCreatedFile);
					} else {
						fs.writeFile(destFilepath, '', writeCreatedFile);
					}
				}
				function doCopyOrMove(isCopy) {
					var sourceUrl = req.body.Location;
					if (!sourceUrl) {
						writeError(400, res, 'Missing Location property in request body');
						return;
					}
					var sourceFilepath = getSafeFilePath(api.rest(fileRoot, api.matchHost(req, sourceUrl)));
					fs.exists(sourceFilepath, function(sourceExists) {
						if (!sourceExists) {
							write(404, res, null, 'File not found: ' + sourceUrl);
							return;
						}
						if (isCopy) {
							fileUtil.copy(sourceFilepath, destFilepath, writeCreatedFile);
						} else {
							fs.rename(sourceFilepath, destFilepath, writeCreatedFile);
						}
					});
				}
				var xCreateOptions = req.headers['x-create-options'] || [];
				if (!checkXCreateOptions(xCreateOptions)) {
					write(400, res, null, 'Illegal combination of X-Create-Options.');
					return;
				}
				if (xCreateOptions.indexOf('no-overwrite') !== -1 && destExists) {
					res.setHeader('Content-Type', 'application/json');
					res.statusCode = 412;
					res.end(JSON.stringify({Message: 'A file or folder with the same name already exists at this location.'}));
					return;
				} 
				var isCopy;
				if ((isCopy = xCreateOptions.indexOf('copy') !== -1) || (xCreateOptions.indexOf('move') !== -1)) {
					doCopyOrMove(isCopy);
				} else {
					if (destExists) {
						fs.unlink(destFilepath, createFile);
					} else {
						createFile();
					}
				}
			});
		},
		DELETE: function(req, res, next, rest) {
			if (writeEmptyFilePathError(res, rest)) {
				return;
			}
			var filepath = getSafeFilePath(rest);
			fileUtil.withStatsAndETag(filepath, function(error, stats, etag) {
				var etagHeader = req.headers['if-match'];
				if (error && error.code === 'ENOENT') {
					res.statusCode = 204;
					res.end();
				} else if (etagHeader && etag !== etag) {
					write(214, res);
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
	});
};
