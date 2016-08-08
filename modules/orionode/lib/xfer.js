/*******************************************************************************
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 * IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node */
var api = require('./api'), writeError = api.writeError;
var archiver = require('archiver');
var unzip = require('unzip2');
var request = require('request');
var express = require('express');
var path = require('path');
var os = require('os');
//var Busboy = require('busboy');
var Promise = require('bluebird');
var mkdirp = require('mkdirp');
var fs = Promise.promisifyAll(require('fs'));
var fileUtil = require('./fileUtil');
var crypto = require('crypto');

/**
 * @callback
 */
module.exports = function(options) {
	module.exports.write = write;
	module.exports.getUploadDir = getUploadDir;
	
	var UPLOADS_FOLDER = path.join(options.configParams['orion.single.user'] ?
			path.join(os.homedir(), ".orion") : options.workspaceDir, ".uploads");
	
	mkdirp(UPLOADS_FOLDER, function (err) {
		if (err) console.error(err);
	});

	return express.Router()
	.get('/export*', getXfer)
	.post('/import*', postImportXfer);
	
	
function getOptions(req) {
	return req.get("X-Xfer-Options").split(",");
}
	
function reportTransferFailure(res, err) {
	var message = "File transfer failed";
	if (err.message) {
		message += ": " + err.message;
	}
	return res.status(400).json({
				Severity: "Error",
				HttpCode: 400,
				Code: 0,
				Message: message,
				DetailedMessage: message
	});
}

function postImportXfer(req, res) {
	var filePath = req.params["0"];
	filePath = fileUtil.safeFilePath(req.user.workspaceDir, filePath);
	var xferOptions = getOptions(req);
	if (xferOptions.indexOf("sftp") !== -1) {
		return writeError(500, res, "Not implemented yet.");
	}
	var sourceURL = req.query.source;
	var shouldUnzip = xferOptions.indexOf("raw") === -1;
	var fileName = req.get("Slug");
	if (!fileName) {
		if (sourceURL) {
			fileName = path.basename(sourceURL);
		}
	}
	if (!fileName && !unzip) {
		return writeError(400, res, "Transfer request must indicate target filename");
	}
	function upload(request) {
		var tempFile = path.join(UPLOADS_FOLDER, Date.now() + fileName);
		var ws = fs.createWriteStream(tempFile);
		ws.on('error', function(err) {
			reportTransferFailure(res, err);
		});
		ws.on('finish', function() {
			completeTransfer(req, res, tempFile, filePath, fileName, xferOptions, shouldUnzip);
		});
		request.pipe(ws);
	}
	var length = -1;
	if (!sourceURL) {
		var lengthStr = req.get("X-Xfer-Content-Length") || req.get("Content-Length");
		if (lengthStr) length = Number(lengthStr);
	} else {
		upload(request(sourceURL));
		return;
	}
	if (req.get("Content-Type") === "application/octet-stream") {
		upload(req);
		return;
	}
	writeError(500, res, "Not implemented yet.");
//	var busboy = new Busboy({ headers: req.headers });
//	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
//		console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
//		file.on('data', function(data) {
//			console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
//		});
//		file.on('end', function() {
//			console.log('File [' + fieldname + '] Finished');
//		});
//	});
//	busboy.on('finish', function() {
//		console.log('Done parsing form!');
//		res.writeHead(303, { Connection: 'close', Location: '/' });
//		res.end();
//	});
//	req.pipe(busboy);
}

function excluded(excludes, rootName, outputName) {
	if (rootName === outputName) {
		return false;
	}
	if (excludes.indexOf(path.basename(outputName)) !== -1) {
		return true;
	}
	return excluded(excludes, rootName, path.dirname(outputName));
}

function completeTransfer(req, res, tempFile, filePath, fileName, xferOptions, shouldUnzip) {
	var overwrite = xferOptions.indexOf("overwrite-older") !== -1;
	function overrideError(files) {
		res.status(400).json({
			Severity: "Error",
			HttpCode:400,
			Code: 0,
			Message: "Failed to transfer all files to " + filePath.substring(req.user.workspaceDir.length) + 
				", the following files could not be overwritten: " + files.join(","),
			JsonData: {
				ExistingFiles: files
			}
		});
	}
	if (shouldUnzip) {
		var excludes = (req.query.exclude || "").split(",");
		if (fs.existsSync(path.join(filePath, ".git"))) {
			excludes.push(".git");
		}
		var failed = [];
		fs.createReadStream(tempFile)
		.pipe(unzip.Parse())
		.on('entry', function (entry) {
			var entryName = entry.path;
			var type = entry.type; // 'Directory' or 'File' 
			var outputName = path.join(filePath, entryName);
			if (!excluded(excludes, filePath, outputName)) {
				if (type === "File") {
					if (!overwrite && fs.existsSync(outputName)) {
						failed.push(entryName);
						entry.autodrain();
						return;
					}
					// make sure all sub folders exist
					var subfolderPath = path.join(filePath, path.dirname(entryName));
					if (!fs.existsSync(subfolderPath)) {
						mkdirp.sync(subfolderPath);
					}
					var writeStream = fs.createWriteStream(outputName);
					writeStream.on('error', function(err) {
						reportTransferFailure(res, err);
					});
					entry.pipe(writeStream);
				} else if (type === "Directory") {
					if (!fs.existsSync(outputName)) {
						mkdirp.sync(outputName);
					}
				}
			} else {
				entry.autodrain();
			}
		})
		.on('close', function() {
			fs.unlink(tempFile);
			if (failed.length) {
				return overrideError(failed);
			}
			res.setHeader("Location", "/file" + filePath.substring(req.user.workspaceDir.length));
			res.status(201).end();
		});
	} else {
		var file = path.join(filePath, fileName);
		if (!overwrite && fs.existsSync(file)) {
			return overrideError([fileName]);
		}
		fs.rename(tempFile, file, function(err) {
			if (err) {
				return writeError(400, res, "Transfer failed");
			}
			res.setHeader("Location", "/file" + filePath.substring(req.user.workspaceDir.length));
			res.status(201).end();
		});
	}
}
	
function getXfer(req, res) {
	var filePath = req.params["0"];
	
	if (path.extname(filePath) !== ".zip") {
		return writeError(400, res, "Export is not a zip");
	}
	
	var zip = archiver('zip');
	zip.pipe(res);
	filePath = fileUtil.safeFilePath(req.user.workspaceDir, filePath.replace(/.zip$/, ""));
	write(zip, filePath, filePath)
	.then(function() {
		zip.finalize();
	})
	.catch(function(err) {
		writeError(500, res, err.message);
	});
}

function write (zip, base, filePath) {
	return fs.statAsync(filePath)
	.then(function(stats) {
		/*eslint consistent-return:0*/
		if (stats.isDirectory()) {
			if (filePath.substring(filePath.length-1) !== "/") filePath = filePath + "/";
			return fs.readdirAsync(filePath)
			.then(function(directoryFiles) {
				var SUBDIR_SEARCH_CONCURRENCY = 10;
				return Promise.map(directoryFiles, function(entry) {
					return write(zip, base, filePath + entry);
				},{ concurrency: SUBDIR_SEARCH_CONCURRENCY});
			});
		}
		zip.file(filePath, { name: filePath.substring(base.length).replace(/\\/g, "/") });
	});
}
function getUploadDir(){
	return UPLOADS_FOLDER;
}
};