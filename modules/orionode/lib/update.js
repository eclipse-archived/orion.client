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
	autoUpdater = electron.autoUpdater,
	bodyParser = require('body-parser'),
	os = require('os'),
	prefs = require('./controllers/prefs');

module.exports = {};
module.exports.router = function(options) {
	var configParams = options.configParams;
	if (!configParams) { throw new Error('options.configParams is required'); }
	
	return express.Router()
	.use(bodyParser.json())
	.put('*', /* @callback */ function (req, res) {
		var feedURL = configParams["orion.autoUpdater.url"];
		if (!feedURL) { 
			console.log('autoUpdater feedURL is required');
		} else {
			var platform = os.platform() + '_' + os.arch(),
				version = electron.app.getVersion(),
				allPrefs = prefs.readPrefs();
		
			allPrefs.user.updateChannel = req.body.updateChannel;
			prefs.writePrefs(allPrefs);
			autoUpdater.setFeedURL(feedURL + '/channel/' + req.body.updateChannel + '/' + platform + '/' + version);
			autoUpdater.checkForUpdates();
		}
	});	
};