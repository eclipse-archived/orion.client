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
var path = require('path');
var bodyParser = require('body-parser');
var express = require('express');

module.exports = function(options) {
	var USE_WORKERS = options.configParams.isElectron, search;
	if (USE_WORKERS) {
		var requests = {};
		var WORKER_COUNT = 5;
		var searchWorkers = [];
		var id = 0, lastWorker = 0;
		var Worker = require("tiny-worker");
		for (var i = 0; i < WORKER_COUNT; i++) {
			var searchWorker = new Worker(path.join(__dirname, "searchWorker.js"));
			searchWorker.onmessage = function (event) {
				var promise = requests[event.data.id];
				delete requests[event.data.id];
				if (event.data.err) {
					return promise.reject(event.data.err);
				}
				promise.fullfil(event.data.result);
			};
			searchWorkers.push(searchWorker);
		}
		search = function(originalUrl, workspaceDir, contextPath) {
			return new Promise(function(fullfil, reject) {
				id++;
				requests[id] = {fullfil: fullfil, reject: reject};
				var worker = searchWorkers[lastWorker++ % searchWorkers.length];
				worker.postMessage({id: id, originalUrl: originalUrl, workspaceDir: workspaceDir, contextPath: contextPath});
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
