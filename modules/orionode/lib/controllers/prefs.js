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
	fileUtil = require('../fileUtil'),
 	writeResponse = api.writeResponse,
    bodyParser = require('body-parser'),
    express = require('express'),
    Debug = require('debug'),
    nodePath = require('path'),
    nodeUrl = require('url'),
    os = require('os'),
    Preference = require('../model/pref'),
    Promise = require('bluebird');

var debug = Debug('orion:prefs'),
    fs = Promise.promisifyAll(require('fs'));

module.exports = {};

module.exports.readPrefs = readPrefs;
module.exports.writePrefs = writePrefs;
module.exports.router = PrefsController;

var NOT_EXIST = Preference.NOT_EXIST;
var PREF_FILENAME = PrefsController.PREF_FILENAME = 'prefs.json';

// Middleware that serves prefs requests.
//
// https://wiki.eclipse.org/Orion/Server_API/Preference_API
function PrefsController(options) {
	options.configParams = options.configParams || {};

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

	// Wraps a promise-returning handler, that needs access to prefs, into an Express middleware.
	function wrapAsMiddleware(handler) {
		return function(req, res, next) {
			debug('%s %s', req.method, req.url);
			return Promise.resolve()
			.then(acquirePrefs.bind(null, req, res))
			.then(handler.bind(null, req, res))
			.then(function() { //eslint-disable-line consistent-return
				return savePrefs(req, req.prefs);
			})
			.catch(next); // next(err)
		};
	}

	// Promised middleware that acquires prefs from the metastore and stores in `req`.
	function acquirePrefs(req) {
		var store = fileUtil.getMetastore(req);
		return new Promise(function(fulfill) {
			store.readUserPreferences(req.user, function(err, prefs) {
				fulfill(new Preference(prefs || null));
			});
		})
		.then(function(prefs) {
			var urlObj = req._parsedUrl || nodeUrl.parse(req.url);
			req.prefs = prefs;
			req.prefPath = urlObj.pathname;
			req.prefNode = req.prefs.get(req.prefPath);
		});
	}

	// @returns Promise that resolves if prefs were written to the metastore ok, rejects if a problem happened.
	function savePrefs(req, prefs) {
		/*eslint-disable consistent-return*/
		if (!prefs.modified()) {
			debug("savePrefs(): not modified, skip writing");
			return Promise.resolve();
		}
		var store = fileUtil.getMetastore(req);
		return new Promise(function(fulfill, reject) {
			store.updateUserPreferences(req.user, prefs.toJSON(), function(err) {
				if (err) {
					return reject(err);
				}
				fulfill();
			});
		})
		.catch(function(err) {
			debug('savePrefs(): error writing prefs.json', err);
			throw err;
		});
		/*eslint-enable*/
	}

} // PrefsController

function handleGet(req, res) { //eslint-disable-line consistent-return
	var node = req.prefNode;
	var key = req.query.key;
	if (typeof key !== 'string') {
		// No key param - a whole node was requested
		if (node === NOT_EXIST) {
			return writeResponse(200, res, null, {});
		}
		return writeResponse(200, res, null, node);
	}
	// Sending a single property
	var value = node[key];
	if (typeof value === 'undefined') {
		return api.sendStatus(404, res);
	}
	var result = {};
	result[key] = value;
	writeResponse(200, res, null, result);
}

function handlePut(req, res) {
	var prefs = req.prefs, prefPath = req.prefPath;
	var body = req.body;
	if (req.is('json')) {
		// Replace entire pref node
		prefs.set(prefPath, body);
		return api.sendStatus(204, res);
	} else if (req.is('urlencoded')) {
		// Replace a single property
		var key = body.key, value = body.value;
		if (typeof key === 'undefined') {
			return api.sendStatus(400, res);
		}

		var node = req.prefNode === NOT_EXIST ? {} : req.prefNode;
		if (typeof value === 'undefined') {
			delete node[key];
		} else {
			node[key] = value; // FIXME watch out for __proto__ hacks
		}
		prefs.set(prefPath, node);
		return api.sendStatus(204, res);
	}
	return api.sendStatus(400, res);// unknown content type
}

function handleDelete(req, res) { //eslint-disable-line consistent-return
	var prefs = req.prefs, prefPath = req.prefPath, node = req.prefNode;
	if (node === NOT_EXIST) {
		// Deleting a nonexistent node (or some key therein), noop
		return api.sendStatus(204, res);
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
	return api.sendStatus(204, res);
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