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
var express = require('express');
var bodyParser = require('body-parser');
var ETag = require('./util/etag');
var nodePath = require('path');
var api = require('./api');
var fileUtil = require('./fileUtil');
var writeError = api.writeError;
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));

function getParam(req, paramName) {
	return req.query[paramName];
}

function getBoolean(obj, key) {
	var val = obj[key];
	return Object.prototype.hasOwnProperty.call(obj, key) && (val === true || val === 'true');
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


	function makeFile(fileRoot, req, res, destFilepath) {
		var isDirectory = req.body && getBoolean(req.body, 'Directory');

		// Just a regular file write
		return Promise.resolve()
		.then(function() {
			return isDirectory ? (!fs.existsSync(destFilepath) ? fs.mkdirSync(destFilepath) : true) : (fs.writeFileSync(destFilepath, ''));
		})
		.catch(api.writeError.bind(null, 500, res));
	}

	var router = express.Router({mergeParams: true});
	var jsonParser = bodyParser.json();

	/* 
	 * Create local file structure of received URL to be synced.
	*/
	router.get('*', jsonParser, function(req, res) {
		var collabParams = req.params["0"];
		var username = req.query['username'] || '';
		var extraParamsIndex = collabParams.indexOf(req.collabSessionID);
		var rest = collabParams.substring(1, extraParamsIndex !== -1 ? extraParamsIndex : collabParams.length);
		rest = username + "-scratchpad" + "/" + rest;
		var collabSessionID = req.collabSessionID;
		var filepath = getSafeFilePath(req, rest);

		var structure = rest.split("/");

		Promise.map(structure, function(value, index) {
			filepath = getSafeFilePath(req, "/" + structure.slice(0, index+1).join('/'));
			req.body = { 
				Name: value, 
				LocalTimeStamp: '0', 
				Directory: ((index === (structure.length-1)) ? false : true)
			};
			return makeFile(fileRoot, req, res, filepath);
		}).then(function() {
			//redirect to the file with or without collaboration
			if (typeof collabSessionID === 'undefined') {
				res.redirect("/edit/edit.html#/file/" + rest);
			} else {
				res.redirect("/edit/edit.html#/file/" + rest + req.collabSessionID);
			}
		});
	});

	function removeFile(destFilepath, res) {
		return fs.statAsync(destFilepath)
		.then(function(stats) {
			return (stats.isFile() ? fs.unlinkSync(destFilepath) : fs.rmdirSync(destFilepath));
		})
		.catch(function(reason) {
			//We only want to delete a folder if it is empty. If it is not, deleting the file would suffice.
			reason.code != "ENOTEMPTY" ? console.error(reason) : null;
		});
	}

	// DELETE - no request body
	router.delete('*', function(req, res) {
		var rest = req.params["0"].substring(1);
		var filepath = getSafeFilePath(req, rest);

		var structure = rest.split("/");
		p = Promise.resolve();

		for (var i = structure.length; i > 0; i--) {
			filepath = getSafeFilePath(req, "/" + structure.slice(0, i).join('/'));
			p = p.then(removeFile(filepath, res));
		}
		
		p.then(function() {
			res.sendStatus(204);
		});

		return p;
	});

	return router;
};
