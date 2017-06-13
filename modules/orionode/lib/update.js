/*******************************************************************************
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node */

var express = require('express'),
	electron = require('electron'),
	autoUpdater = require('./autoUpdater.js'),
	bodyParser = require('body-parser'),
	prefs = require('./controllers/prefs'),
	os = require('os'),
	platform = os.platform(),
	arch = os.arch(),
	version = electron.app.getVersion(),
	log4js = require('log4js'),
	tasks = require('./tasks'),
	logger = log4js.getLogger("update");

module.exports = {};
module.exports.router = function(options) {
	var configParams = options.configParams;
	if (!configParams) { throw new Error('options.configParams is required'); }
	var feedURL = configParams["orion.autoUpdater.url"];
	return express.Router()
	.use(bodyParser.json())
	.post('/downloadUpdates', function (req, res) {
		var allPrefs = prefs.readPrefs();
		var updateChannel = allPrefs.user && allPrefs.user.updateChannel && allPrefs.user.updateChannel.name ? allPrefs.user.updateChannel.name : configParams["orion.autoUpdater.defaultChannel"];
		var task = new tasks.Task(res, false, true, 0, true);
		if (platform === "linux") {
			electron.shell.openExternal(feedURL + '/download/channel/' + updateChannel + '/linux');
		} else {
			autoUpdater.setFeedURL(feedURL + '/update/channel/' + updateChannel + '/' + platform + '_' + arch + '/' + version);
			autoUpdater.checkForUpdates();
		}
		autoUpdater.on("update-downloaded", /* @callback */ function(event, releaseNotes, releaseName, releaseDate, updateURL) {
			task.done({
				HttpCode: 200,
				Code: 0,
				DetailedMessage: "OK",
				JsonData: {
					"note": releaseNotes
				},
				Message: "OK",
				Severity: "Ok"
			});
		});
	})
	.get("/resolveNewVersion", function (req, res) {
		var task = new tasks.Task(res, false, true, 0, true);
		if (!feedURL) {
			 task.done({
			 	HttpCode: 200,
			 	Code: 0,
			 	DetailedMessage: "OK",
			 	Message: "OK",
			 	Severity: "Ok"
			 });
		}
		var resolveURL = feedURL + '/api/resolve?platform=' + platform + '&channel=' + req.query.updateChannel;
		autoUpdater.setResolveURL(resolveURL);
		autoUpdater.resolveNewVersion(true);
		autoUpdater.on("update-available-manual", function(newVersion) {
			task.done({
				HttpCode: 200,
				Code: 0,
				JsonData: {"newVersion":newVersion},
				DetailedMessage: "update-available-manual",
				Message: "OK",
				Severity: "Ok"
			});
		});
		autoUpdater.on("update-not-available", function() {
			task.done({
				HttpCode: 204,
				Code: 0,
				DetailedMessage: "update-not-available",
				Message: "OK",
				Severity: "Ok"
			});
		});
		autoUpdater.on("update-error", function(error) {
			logger.error(error);
			task.done({
				HttpCode: 204,
				Code: 0,
				DetailedMessage: "update-error",
				Message: "OK",
				Severity: "Ok"
			});
		});
	});	
};