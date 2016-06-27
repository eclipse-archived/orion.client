/*******************************************************************************
 * Copyright (c) 2012, 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/
var express = require('express');
var bodyParser = require('body-parser');
var ETag = require('./util/etag');
var fs = require('fs');
var nodePath = require('path');
var api = require('./api');
var fileUtil = require('./fileUtil');
var writeError = api.writeError;

function getParam(req, paramName) {
	return req.query[paramName];
}

module.exports = function(options) {
	var fileRoot = options.root;
	if (!fileRoot) { throw new Error('options.root is required'); }

	var writeFileMetadata = function() {
		var args = Array.prototype.slice.call(arguments, 0);
		var originalFileUrl = fileRoot;
		return fileUtil.writeFileMetadata.apply(null, [originalFileUrl].concat(args));
	};
	var getSafeFilePath = function(req, rest) {
		return fileUtil.safeFilePath(req.user.workspaceDir, rest);
	};

	function writeFileContents(res, filepath, stats, etag) {
		if (stats.isDirectory()) {
			//shouldn't happen
			writeError(500, res, "Expected a file not a directory");
		} else {
			var stream = fs.createReadStream(filepath);
			res.setHeader("Cache-Control", "no-cache");
			res.setHeader('Content-Length', stats.size);
			res.setHeader('ETag', etag);
			res.setHeader('Accept-Patch', 'application/json-patch; charset=UTF-8');
			stream.pipe(res);
			stream.on('error', function(e) {
				// FIXME this is wrong, headers have likely been committed at this point
				res.writeHead(500, e.toString());
				res.end();
			});
			stream.on('end', res.end.bind(res));
		}
	}

	function handleDiff(req, res, rest, body) {
		var diffs = body.diff || [];
		var contents = body.contents;
		var patchPath = getSafeFilePath(req, rest);
		fs.exists(patchPath, function(destExists) {
			if (destExists) {
				fs.readFile(patchPath, function (error, data) {
					if (error) {
						writeError(500, res, error);
						return;
					}
					try {
						var newContents = data.toString();
						if (newContents.length > 0) {
							var code = newContents.charCodeAt(0);
							if (code === 0xFEFF || code === 0xFFFE) {
								newContents = newContents.substring(1);
							}
						}
						var buffer = {
							_text: [newContents], 
							replaceText: function (text, start, end) {
								var offset = 0, chunk = 0, length;
								while (chunk<this._text.length) {
									length = this._text[chunk].length; 
									if (start <= offset + length) { break; }
									offset += length;
									chunk++;
								}
								var firstOffset = offset;
								var firstChunk = chunk;
								while (chunk<this._text.length) {
									length = this._text[chunk].length; 
									if (end <= offset + length) { break; }
									offset += length;
									chunk++;
								}
								var lastOffset = offset;
								var lastChunk = chunk;
								var firstText = this._text[firstChunk];
								var lastText = this._text[lastChunk];
								var beforeText = firstText.substring(0, start - firstOffset);
								var afterText = lastText.substring(end - lastOffset);
								var params = [firstChunk, lastChunk - firstChunk + 1];
								if (beforeText) { params.push(beforeText); }
								if (text) { params.push(text); }
								if (afterText) { params.push(afterText); }
								Array.prototype.splice.apply(this._text, params);
								if (this._text.length === 0) { this._text = [""]; }
							},
							getText: function() {
								return this._text.join("");									
							}
						};
						for (var i=0; i<diffs.length; i++) {
							var change = diffs[i];
							buffer.replaceText(change.text, change.start, change.end);
						}
						newContents = buffer.getText();
					} catch (ex) {
						writeError(500, res, ex);
						return;
					}

					var failed = false;
					if (contents) {
						if (newContents !== contents) {
							failed = true;
							newContents = contents;
						}
					}
					fs.writeFile(patchPath, newContents, function(err) {
						if (err) {
							writeError(500, res, error);
							return;
						}
						if (failed) {
							writeError(406, res, new Error('Bad file diffs. Please paste this content in a bug report: \u00A0\u00A0 \t' + JSON.stringify(body)));
							return;
						}
						fs.stat(patchPath, function(error, stats) {
							if (err) {
								writeError(500, res, error);
								return;
							}
							writeFileMetadata(req, res, patchPath, stats, ETag.fromString(newContents) /*the new ETag*/);
						});
					});
					
				});
			} else {
				writeError(500, res, 'Destination does not exist.');
			}
		});
	}

	var router = express.Router({mergeParams: true});
	var jsonParser = bodyParser.json();
	router.get('*', jsonParser, function(req, res) {
		var rest = req.params["0"].substring(1),
			readIfExists = req.headers ? Boolean(req.headers['read-if-exists']).valueOf() : false,
			filepath = getSafeFilePath(req, rest);
		fileUtil.withStatsAndETag(filepath, function(error, stats, etag) {
			if (error && error.code === 'ENOENT') {
				if(typeof readIfExists === 'boolean' && readIfExists) {
					res.sendStatus(204);
				} else {
					writeError(404, res, 'File not found: ' + rest);
				}
			} else if (error) {
				writeError(500, res, error);
			} else if (stats.isFile() && getParam(req, 'parts') !== 'meta') {
				// GET file contents
				writeFileContents(res, filepath, stats, etag);
			} else {
				var depth = stats.isDirectory() && Number(getParam(req, 'depth')) || 0;
				writeFileMetadata(req, res, filepath, stats, etag, depth);
			}
		});
	});

	router.put('*', function(req, res) {
		var rest = req.params["0"].substring(1);
		var filepath = getSafeFilePath(req, rest);
		if (getParam(req, 'parts') === 'meta') {
			// TODO implement put of file attributes
			res.sendStatus(501);
			return;
		}
		function write() {
			var ws = fs.createWriteStream(filepath);
			ws.on('finish', function() {
				fileUtil.withStatsAndETag(filepath, function(error, stats, etag) {
					if (error && error.code === 'ENOENT') {
						res.status(404).end();
						return;
					}
					writeFileMetadata(req, res, filepath, stats, etag);
				});
			});
			ws.on('error', function(err) {
				writeError(500, res, err);
			});
			req.pipe(ws);
		}
		var ifMatchHeader = req.headers['if-match'];
		if (!ifMatchHeader) {
			return write();
		}
		fileUtil.withETag(filepath, function(error, etag) {
			if (error && error.code === 'ENOENT') {
				res.status(404).end();
			} else if (ifMatchHeader && ifMatchHeader !== etag) {
				res.status(412).end();
			} else {
				write();
			}
		});
	});

	// POST - parse json body
	router.post('*', jsonParser, function(req, res) {
		var rest = req.params["0"].substring(1);
		var diffPatch = req.headers['x-http-method-override'];
		if (diffPatch === "PATCH") {
			handleDiff(req, res, rest, req.body);
			return;
		}
		var name = fileUtil.decodeSlug(req.headers.slug) || req.body && req.body.Name;
		if (!name) {
			writeError(400, res, new Error('Missing Slug header or Name property'));
			return;
		}

		var filepath = getSafeFilePath(req, nodePath.join(rest, name));
		fileUtil.handleFilePOST(fileRoot, req, res, filepath);
	});

	// DELETE - no request body
	router.delete('*', function(req, res) {
		var rest = req.params["0"].substring(1);
		var filepath = getSafeFilePath(req, rest);
		fileUtil.withStatsAndETag(filepath, function(error, stats, etag) {
			var ifMatchHeader = req.headers['if-match'];
			if (error && error.code === 'ENOENT') {
				return res.sendStatus(204);
			} else if (ifMatchHeader && ifMatchHeader !== etag) {
				return res.sendStatus(412);
			}
			var callback = function(error) {
				if (error) {
					writeError(500, res, error);
					return;
				}
				res.sendStatus(204);
			};
			if (stats.isDirectory()) {
				fileUtil.rumRuff(filepath, callback);
			} else {
				fs.unlink(filepath, callback);
			}
		});
	});

	return router;
};
