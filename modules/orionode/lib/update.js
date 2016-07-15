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
var express = require('express');
var electron = require('electron');
var bodyParser = require('body-parser');
var os = require('os');
var autoUpdater = electron.autoUpdater;

module.exports = {};
module.exports.router = function(options) {
	var configParams = options.configParams;
	if (!configParams) { console.error('options.configParams is required'); }
	var feedURL = configParams["orion.autoUpdater.url"];
	if (!feedURL) {console.error('autoUpdater feedURL is not specified'); }
	return express.Router()
	.use(bodyParser.json())
	.put('*', /* @callback */ function (req, res) {
		var platform = os.platform() + '_' + os.arch(),
		version = electron.app.getVersion();
		autoUpdater.setFeedURL(feedURL + '/channel/' + req.body.updateChannel + '/' + platform + '/' + version);
		autoUpdater.checkForUpdates();
	});
};