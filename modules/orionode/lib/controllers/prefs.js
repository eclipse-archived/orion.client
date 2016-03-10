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
'use strict'
var api = require('../api'),
    bodyParser = require('body-parser'),
    express = require('express'),
    Debug = require('debug'),
    nodePath = require('path'),
    nodeUrl = require('url'),
    Preference = require('../model/pref'),
    Promise = require('bluebird');

var debug = Debug('orion:prefs'),
    fs = Promise.promisifyAll(require('fs'));

module.exports = PrefsController;

var NOT_EXIST = Preference.NOT_EXIST;
var PREF_FILENAME = PrefsController.PREF_FILENAME = 'prefs.json';

// Middleware that serves prefs requests.
//
// The strategy is to parse prefs from prefs.json, then cache in `app.locals` until no prefs
// requests have occurred for `ttl` ms. After that, prefs are flushed to disk and the
// cache is cleared.
//
// This avoids needless file I/O and makes a best-effort attempt to pick up external
// edits made to prefs.json without restarting the server. Note however that external edits
// made during the `ttl` interval will be overwritten by the server on the next flush.
//
// https://wiki.eclipse.org/Orion/Server_API/Preference_API
function PrefsController(options) {
	var ttl = options.ttl || 5000; // default is 5 seconds

	var router = express.Router()
	.use(bodyParser.json())
	.use(bodyParser.urlencoded({ extended: false }));

	router.get('*',    wrapAsMiddleware(handleGet));
	router.put('*',    wrapAsMiddleware(handlePut));
	router.delete('*', wrapAsMiddleware(handleDelete));
	router.use(function(err, req, res, next) {
		if (!err) {
			return next();
		}
		if (res.headersSent) {
			// already committed, can't do anything useful so delegate back to express
			return next(err);
		}
		return api.writeError(500, res, err);
	});
	return router;

	// Helper functions

	// Wraps a promise-returning handler, that needs access to prefs, into an Express middleware.
	function wrapAsMiddleware(handler) {
		return function(req, res, next) {
			debug('%s %s', req.method, req.url);
			return Promise.resolve()
			.then(acquirePrefs.bind(null, req, res))
			.then(handler.bind(null, req, res))
			.then(next.bind(null, null))
			.catch(next) // next(err)
		};
	}

	// Promised middleware that acquires prefs (either from memory or disk) and stores in `req`.
	function acquirePrefs(req) {
		var app = req.app, prefs = app.locals.prefs;
		var getPrefs;
		var prefFile = nodePath.join(req.user.workspaceDir, PREF_FILENAME);
		if (prefs) {
			debug('Using prefs from memory');
			scheduleFlush(app, prefFile);
			getPrefs = Promise.resolve(prefs);
		} else {
			getPrefs = fs.readFileAsync(prefFile, 'utf8')
			.catch(function(err) {
				if (err.code === 'ENOENT') {
					return; // New prefs file: suppress error
				}
				throw err;
			})
			.then(function(contents) {
				if (contents) {
					debug('Read pref file from disk (len: %d)', contents.length);
				} else {
					debug('No pref file exists, creating new');
				}
				app.locals.prefs = new Preference(contents || null);
				scheduleFlush(app, prefFile);
			});
		}
		return getPrefs
		.then(function() {
			var urlObj = req._parsedUrl || nodeUrl.parse(req.url);
			req.prefs = app.locals.prefs;
			req.prefPath = urlObj.pathname;
			req.prefNode = req.prefs.get(req.prefPath);
		});
	}

	function scheduleFlush(app, prefFile) {
		var prefs = app.locals.prefs;
		if (!prefs) {
			debug('scheduleFlush(): WARNING, no prefs to flush'); // should never hpapen
			return;
		}
		// Reset the clock
		clearTimeout(prefs.timerId);
		prefs.timerId = setTimeout(flushJob.bind(null, app, prefFile), ttl);
	}

	// Deletes the cache and writes prefs back to disk if they were changed.
	function flushJob(app, prefFile) {
		var prefs = app.locals.prefs;
		if (!prefs) {
			debug('flushJob(): WARNING: no pref data to write'); // should never happen
			return;
		}

		app.locals.prefs = null;
		if (!prefs.modified()) {
			debug('flushJob(): skipped writing prefs.json (no changes were made)');
			return;
		}
		fs.writeFileAsync(prefFile, prefs.toJSON())
		.then(function() {
			debug('flushJob(): wrote prefs.json');
		})
		.catch(function(err) {
			debug('flushJob(): error writing prefs.json', err);
		});
	}
} // PrefsController

function handleGet(req, res) { //eslint-disable-line consistent-return
	var node = req.prefNode;
	var key = req.query.key;
	if (typeof key !== 'string') {
		// No key param - a whole node was requested
		if (node === NOT_EXIST) {
			return res.json({});
		}
		return res.json(node);
	}
	// Sending a single property
	var value = node[key];
	if (typeof value === 'undefined') {
		return res.sendStatus(404);
	}
	var result = {};
	result[key] = value;
	res.json(result);
}

function handlePut(req, res) {
	var prefs = req.prefs, prefPath = req.prefPath;
	var body = req.body;
	if (req.is('json')) {
		// Replace entire pref node
		prefs.set(prefPath, body);
		return res.sendStatus(204);
	} else if (req.is('urlencoded')) {
		// Replace a single property
		var key = body.key, value = body.value;
		if (typeof key === 'undefined') {
			return res.sendStatus(400);
		}

		var node = req.prefNode === NOT_EXIST ? {} : req.prefNode;
		if (typeof value === 'undefined') {
			delete node[key];
		} else {
			node[key] = value; // FIXME watch out for __proto__ hacks
		}
		prefs.set(prefPath, node);
		return res.sendStatus(204);
	}
	return res.sendStatus(400); // unknown content type
}

function handleDelete(req, res) { //eslint-disable-line consistent-return
	var prefs = req.prefs, prefPath = req.prefPath, node = req.prefNode;
	if (node === NOT_EXIST) {
		// Deleting a nonexistent node (or some key therein), noop
		return res.sendStatus(204);
	}
	var key = req.params.key;
	if (typeof key === 'string') {
		// Delete a single key
		delete node[key];
		prefs.set(prefPath, node);
	} else {
		// Delete entire node
		prefs.delete(prefPath);
	}
	res.sendStatus(204);
}