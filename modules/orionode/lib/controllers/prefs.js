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
    os = require('os'),
    Preference = require('../model/pref'),
    Promise = require('bluebird');

var debug = Debug('orion:prefs'),
    fs = Promise.promisifyAll(require('fs')),
    lockFile = Promise.promisifyAll(require('lockfile')),
    mkdirpAsync = Promise.promisify(require('mkdirp'));

module.exports = {};

module.exports.readPrefs = readPrefs;
module.exports.writePrefs = writePrefs;
module.exports.router = PrefsController;

var NOT_EXIST = Preference.NOT_EXIST;
var PREF_FILENAME = PrefsController.PREF_FILENAME = 'prefs.json';

// Middleware that serves prefs requests.
//
// The strategy is to parse prefs from prefs.json, then cache in `app.locals` until no prefs
// requests have occurred for `ttl` ms. After that, prefs are flushed to disk and the
// cache is cleared. This strategy is only used in single user mode.
//
// This avoids needless file I/O and makes a best-effort attempt to pick up external
// edits made to prefs.json without restarting the server. Note however that external edits
// made during the `ttl` interval will be overwritten by the server on the next flush.
//
// https://wiki.eclipse.org/Orion/Server_API/Preference_API
function PrefsController(options) {
	options.configParams = options.configParams || {};
	var ttl = options.ttl || 5000; // default is 5 seconds
	var useCache = options.configParams['orion.single.user'];

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
	function getPrefsFileName(req) {
		var prefFolder = options.configParams['orion.single.user'] ? os.homedir() : req.user.workspaceDir;
		return nodePath.join(prefFolder, '.orion', PREF_FILENAME);
	}

	function getLockfileName(prefFileName) {
		return prefFileName + '.lock';
	}

	// Wraps a promise-returning handler, that needs access to prefs, into an Express middleware.
	function wrapAsMiddleware(handler) {
		return function(req, res, next) {
			debug('%s %s', req.method, req.url);
			return Promise.resolve()
			.then(acquirePrefs.bind(null, req, res))
			.then(handler.bind(null, req, res))
			.then(function() { //eslint-disable-line consistent-return
				if (!useCache) {
					return savePrefs(req.prefs, req.prefFile);
				}
				if(options.configParams.isElectron){
					return savePrefs(req.prefs, req.prefFile);
				}
			})
			.catch(next); // next(err)
		};
	}

	// Promised middleware that acquires prefs (either from memory or disk) and stores in `req`.
	function acquirePrefs(req) {
		var app = req.app, prefs = app.locals.prefs;
		var getPrefs;
		var prefFile = req.prefFile = getPrefsFileName(req);
		if (prefs) {
			debug('Using prefs from memory');
			scheduleFlush(app, prefFile);
			getPrefs = Promise.resolve(prefs);
		} else {
			getPrefs = fs.readFileAsync(prefFile, 'utf8')
			.catchReturn({ code: 'ENOENT' }, null) // New prefs file: suppress error
			.then(function(contents) {
				if (contents) {
					debug('Read pref file %s from disk (len: %d)', prefFile, contents.length);
				} else {
					debug('No pref file %s exists, creating new', prefFile);
				}
				prefs = new Preference(contents || null);
				if (useCache) {
					app.locals.prefs = prefs;
					scheduleFlush(app, prefFile);
				}
				return prefs;
			});
		}
		return getPrefs
		.then(function(prefs) {
			var urlObj = req._parsedUrl || nodeUrl.parse(req.url);
			req.prefs = prefs;
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
		savePrefs(prefs, prefFile)
		.catch(function() {
			// Suppress 'unhandled rejection' errors
		})
	}

	// Writes prefs to disk
	// @returns Promise that resolves if prefs were written ok, rejects if a problem happened.
	function savePrefs(prefs, prefFile) {
		/*eslint-disable consistent-return*/
		if (!prefs.modified()) {
			debug("savePrefs(): not modified, skip writing");
			return Promise.resolve();
		}
		return mkdirpAsync(nodePath.dirname(prefFile)) // create parent folder(s) if necessary
		.then(function() {
			return Promise.using(lock(prefFile), function() {
				// We have the lock until the promise returned by this function fulfills.
				return fs.writeFileAsync(prefFile, prefs.toJSON());
			})
			.then(debug.bind(null, 'savePrefs(): wrote prefs.json'))
		})
		.catch(function(err) {
			debug('savePrefs(): error writing prefs.json', err);
			throw err;
		});
		/*eslint-enable*/
	}

	// Returns a promise that can be used with Promise.using() to guarantee exclusive
	// access to the prefs file.
	function lock(prefFile) {
		return lockFile.lockAsync(getLockfileName(prefFile), {
			retries: 3,
			retryWait: 25,
		})
		.disposer(function() {
			return lockFile.unlockAsync(getLockfileName(prefFile))
			.catch(function(error) {
				// Rejecting here will crash the process; just warn
				debug("Error unlocking pref file:", error);
			})
		})
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

function getElectronPrefsFileName(){
	return nodePath.join(os.homedir(), '.orion', PREF_FILENAME);
}

function readPrefs(){
	try {
		var content = fs.readFileSync(getElectronPrefsFileName(),'utf8');
		return JSON.parse(content);
	} catch (e) {}
	return {};
}

function writePrefs(contents){
	fs.writeFileSync(getElectronPrefsFileName(), JSON.stringify(contents, null, 2), 'utf8');
}