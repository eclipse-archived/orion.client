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
/*eslint-env node */
var api = require('./api'), writeError = api.writeError;
var archiver = require('archiver');
var express = require('express');
var path = require('path');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var fileUtil = require('./fileUtil');

module.exports = function(options) {

	return express.Router()
	.get('/export*', getXfer);
	
function getXfer(req, res) {
	var filePath = req.params["0"];
	
	if (path.extname(filePath) !== ".zip") {
		return writeError(400, res, "Export is not a zip");
	}
	
	var zip = archiver('zip');

    // Send the file to the page output.
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

var SUBDIR_SEARCH_CONCURRENCY = 10;
function write (zip, base, filePath) {
	return fs.statAsync(filePath)
	.then(function(stats) {
		/*eslint consistent-return:0*/
		if (stats.isDirectory()) {
			if (filePath.substring(filePath.length-1) !== "/") filePath = filePath + "/";

			return fs.readdirAsync(filePath)
			.then(function(directoryFiles) {
				return Promise.map(directoryFiles, function(entry) {
					return write(zip, base, filePath + entry);
				}, { concurrency: SUBDIR_SEARCH_CONCURRENCY });
			});
		}
		zip.file(filePath, { name: filePath.substring(base.length).replace(/\\/g, "/") });
	});
}
};