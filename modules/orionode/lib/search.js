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
var prefs = require('./controllers/prefs');
var indexWorker;

module.exports = function(options) {
	var USE_WORKERS = options.configParams.isElectron, search;
	if (USE_WORKERS) {
		var requests = {};
		var WORKER_COUNT = 1;
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
		search = function(originalUrl, workspaceDir, contextPath, userId, indexDir, isElectron, usingIndex) {
			return new Promise(function(fullfil, reject) {
				id++;
				requests[id] = {fullfil: fullfil, reject: reject};
				var worker = searchWorkers[lastWorker++ % searchWorkers.length];
				worker.postMessage({id: id, originalUrl: originalUrl, workspaceDir: workspaceDir, contextPath: contextPath, userId: userId, indexDir: indexDir, isElectron: isElectron, usingIndex: usingIndex});
			});
		};
		 var generalSetting = prefs.readPrefs(options.workspaceDir, !options.configParams['orion.single.user']).user.general;
		 var usingIndex = generalSetting ? generalSetting.settings.generalSettings.filenameSearchPolicy : false;
		 var indexNodeModules = (generalSetting ? generalSetting.settings.generalSettings.filenameSearchNodeModulesPolicy : false) || false;
		 indexWorker = new Worker(path.join(__dirname, "indexWorker.js"));
		 indexWorker.postMessage({type:"startIndex", workspaceDir: options.workspaceDir, inverval:options.configParams["filename.indexing.interval"],indexDir:options.indexDir, userId:"anonymous", indexNodeModules:indexNodeModules});
	} else {
		search = require('./searchWorker').search;
	}
		
	return express.Router()
	.use(bodyParser.json())
	.get('*', function(req, res) {
		var generalSetting = prefs.readPrefs(options.workspaceDir, !options.configParams['orion.single.user']).user.general;
		var usingIndex = (generalSetting ? generalSetting.settings.generalSettings.filenameSearchPolicy : false) || false;
		search(req.originalUrl, req.user.workspaceDir, req.contextPath, req.user.username, options.indexDir, options.configParams.isElectron, usingIndex)
		.then(function(result) {
			res.json(result);
		})
		.catch (function(err) {
			api.writeError(400, res, err);
		});
	});
};

module.exports.changeIndexWorkDir = function(workspaceDir) {
	indexWorker && indexWorker.postMessage({type:"workspaceDirChange", workspaceDir: workspaceDir});
};
