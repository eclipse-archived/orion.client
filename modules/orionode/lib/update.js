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
	allPrefs = prefs.readPrefs();

module.exports = {};
module.exports.router = function(options) {
	var configParams = options.configParams;
	if (!configParams) { throw new Error('options.configParams is required'); }
	var feedURL = configParams["orion.autoUpdater.url"];
	return express.Router()
	.use(bodyParser.json())
	.post('/downloadUpdates', function (req, res) {
		if (platform === "linux") {
			electron.shell.openExternal(feedURL + '/download/channel/' + allPrefs.user.updateChannel + '/linux');
			res.status(200).end();
		} else {
			autoUpdater.setFeedURL(feedURL + '/update/channel/' + allPrefs.user.updateChannel + '/' + platform + '_' + arch + '/' + version);
			autoUpdater.checkForUpdates();
			res.status(200).end();
		}
	})
	.get("/resolveNewVersion", function (req, res) {
		if (!feedURL) {
			return res.status(400).end();
		}
		allPrefs.user.updateChannel = req.query.updateChannel;
		prefs.writePrefs(allPrefs);
		var resolveURL = feedURL + '/api/resolve?platform=' + platform + '&channel=' + allPrefs.user.updateChannel;
		autoUpdater.setResolveURL(resolveURL);
		autoUpdater.resolveNewVersion(true);
		autoUpdater.on("update-available-manual", function(newVersion) {
			res.status(200).end(newVersion); // OK
		});
		autoUpdater.on("update-not-available", function() {
			res.status(204).end(); // no content
		});
		autoUpdater.on("update-error", function(error) {
			console.log(error);
			res.status(400).end(); // client error
		})
	});	
};