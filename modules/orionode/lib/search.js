/*******************************************************************************
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/
var api = require('./api');
var bodyParser = require('body-parser');
var express = require('express');

module.exports = function(options) {
	var USE_WORKER = options.configParams.isElectron, search;
	if (USE_WORKER) {
		var id = 0;
		var requests = {};
		var searchWorker = new require("tiny-worker")("./lib/searchWorker.js");
		searchWorker.onmessage = function (event) {
			var promise = requests[event.data.id];
			delete requests[event.data.id];
			if (event.data.err) {
				return promise.reject(event.data.err);
			}
			promise.fullfil(event.data.result);
		};
		search = function(originalUrl, workspaceDir, contextPath) {
			return new Promise(function(fullfil, reject) {
				id++;
				requests[id] = {fullfil: fullfil, reject: reject};
				searchWorker.postMessage({id: id, originalUrl: originalUrl, workspaceDir: workspaceDir, contextPath: contextPath});
			});
		};
	} else {
		search = require('./searchWorker');
	}
	return express.Router()
	.use(bodyParser.json())
	.get('*', function(req, res) {
		search(req.originalUrl, req.user.workspaceDir, req.contextPath)
		.then(function(result) {
			res.json(result);
		})
		.catch (function(err) {
			api.writeError(400, res, err);
		});
	});
};
