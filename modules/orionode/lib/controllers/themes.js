/*******************************************************************************
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     Casey Flynn - Google Inc - adapted from prefs.js
 *******************************************************************************/
/*eslint-env node*/
'use strict'
var api = require('../api'),
    bodyParser = require('body-parser'),
    express = require('express'),
    Debug = require('debug'),
    nodePath = require('path'),
    nodeUrl = require('url'),
    Preference = require('../model/pref'),
    Promise = require('bluebird');

var debug = Debug('orion:themes'),
    fs = Promise.promisifyAll(require('fs'));

module.exports = {};

module.exports.router = ThemeController;

var NOT_EXIST = Preference.NOT_EXIST;
var THEME_FILENAME = ThemeController.PREF_FILENAME = 'themeData.json';
var nextExpireTimeSecond = ThemeController.nextExpireTimeSecond = 0;

// Middleware that serves theme requests.
//
// On first request, theme data is read from disk and is cached for a minimum of 'ttl' seconds,
// after the al expire time, the theme data is read from disk again. This will allow
// updates to themes to be delivered to connected clients without having to restart
// the node server, while also limiting disk reads. In the instance that a disk read has been
// tiggered, but the preferences have not yet been retrieved, the current cached value will be
// returned.
function ThemeController(options) {
	var ttl = options.themettl || 60 * 10; // default 600 seconds - 10 minutes

	var router = express.Router()
	.use(bodyParser.json())
	.use(bodyParser.urlencoded({ extended: false }));

	router.get('*',    wrapAsMiddleware(handleGet));
	router.use(function(err, req, res, next) {
		if (!err) {
			return next();
		}
		if (res.headersSent) {
			// Haeder sent nothing more can be done.
			return next(err);
		}
		return api.writeError(500, res, err);
	});
	return router;

	function getThemesFile() {
		return nodePath.join(__dirname, '..', 'model', THEME_FILENAME);
	}

	// Wraps a promise-returning handler, that needs access to theme data, into an Express middleware.
	function wrapAsMiddleware(handler) {
		return function(req, res, next) {
			debug('%s %s', req.method, req.url);
			return Promise.resolve()
			.then(getThemes.bind(null, req, res))
			.then(handler.bind(null, req, res))
			.catch(next); // next(err)
		};
	}

	// Promised middleware that acquires themeData (either from memory or disk) and stores in `req`.
	function getThemes(req) {
		var app = req.app, themes = app.locals.themes;
		var getPrefs;
		
		if (themes && process.hrtime()[0] < nextExpireTimeSecond ) {
			debug('Using theme data from memory');
			getPrefs = Promise.resolve(themes);
		} else {
			nextExpireTimeSecond = process.hrtime()[0] + ttl;
			//read prefs from disk, set next timeout			
			getPrefs = fs.readFileAsync(getThemesFile(), 'utf8')
			.catchReturn({ code: 'ENOENT' }, null) // Theme data unavailable
			.then(function(contents) {
				if (contents) {
					debug('Read theme file %s from disk (len: %d)', getThemesFile(), contents.length);
				} else {
					debug('No theme file %s exists.', getThemesFile());
				}
				themes = new Preference(contents || null);
				app.locals.themes = themes;
				return themes;
			});
		}
		return getPrefs
		.then(function(themes) {
			var urlObj = req._parsedUrl || nodeUrl.parse(req.url);
			req.themes = themes;
			req.themePath = urlObj.pathname;
			req.themeNode = req.themes.get(req.themePath);
		});
	}

} // ThemeController

function handleGet(req, res) {
	var node = req.themeNode;
	// If pref.js does not contain the setting, the not_exist function is returned.
	if (node === NOT_EXIST || typeof node === 'function') {
			return res.sendStatus(404);
	}
	return res.json(node);
}