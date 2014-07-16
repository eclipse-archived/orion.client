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
var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var url = require('url');
var api = require('./api'), write = api.write, writeError = api.writeError;
var fileUtil = require('./fileUtil');
var resource = require('./resource');
var node_apps = require('./node_apps');

function printError(e) {
	console.log('err' + e);
}

function getDecoratedAppJson(req, nodeRoot, appContext, app) {
	var json = app.toJson();
	var requestUrl = url.parse(req.url);
	json.Location = url.format({
		host: req.headers.host,
		pathname: requestUrl.pathname + '/' + app.pid
	});
	if(json.DebugMeta){
		//Here we want to regenerate the debug URL to use the host name from the request.
		json.DebugURL = fileUtil.generateDebugURL(json.DebugMeta, url.parse('http://' + req.headers.host).hostname);
	}
	return json;
}

module.exports = function(options) {
	var nodeRoot = options.root;
	var appContext = options.appContext;
	if (!nodeRoot || !appContext) { throw 'Missing "nodeRoot" or "appContext" parameter'; }

	return resource(nodeRoot, {
		/**
		 * @param {HttpRequest} req
		 * @param {HttpResponse} res
		 * @param {Function} next
		 * @param {String} rest
		 */
		GET: function(req, res, next, rest) {
			var pid = rest;
			if (pid === '') {
				write(200, res, null, {
					Apps: appContext.appTable.apps().map(function(app) {
						return getDecoratedAppJson(req, nodeRoot, appContext, app);
					})
				});
			} else {
				var app = appContext.appTable.get(pid);
				if (!app) {
					writeError(404, res);
					return;
				}
				write(200, res, null, getDecoratedAppJson(req, nodeRoot, appContext, app));
			}
		},
		// POST: No POST for apps -- starting apps is handled by a Web Socket connection
		DELETE: function(req, res, next, rest) {
			if (rest === '') {
				writeError(400, res);
				return;
			}
			var pid = rest, app = appContext.appTable.get(pid);
			if (!app) {
				writeError(404, res);
			} else {
				appContext.stopApp(app);
				write(204, res);
			}
		}
	});
};