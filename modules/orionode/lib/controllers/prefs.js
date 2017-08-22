/*******************************************************************************
 * Copyright (c) 2016, 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/
'use strict';
var api = require('../api'),
	fileUtil = require('../fileUtil'),
 	writeResponse = api.writeResponse,
    bodyParser = require('body-parser'),
    express = require('express'),
    nodePath = require('path'),
    nodeUrl = require('url'),
    os = require('os'),
    Horizontal_Prefs = require('../model/hirizontal_pref'),
    Preference = require('../model/pref'),
    Promise = require('bluebird');

    var fs = Promise.promisifyAll(require('fs'));

module.exports = {};

module.exports.readElectronPrefs = readElectronPrefs;
module.exports.writeElectronPrefs = writeElectronPrefs;
module.exports.router = PrefsController;

var isMongo;  // determines if what acquire by thie controller is java version prefs(fs prefs storage) or property expanded preferrence(mongo prefs storage). 
var NOT_EXIST;
var MODEL;
var PREF_FILENAME = PrefsController.PREF_FILENAME = 'user.json';

// Middleware that serves prefs requests.
//
// https://wiki.eclipse.org/Orion/Server_API/Preference_API
function PrefsController(options) {
	options.configParams = options.configParams || {};
	isMongo = options.configParams["orion.metastore.useMongo"];
	if(isMongo){
		MODEL = Preference;
	}else{
		MODEL = Horizontal_Prefs;
	}
	NOT_EXIST = MODEL.NOT_EXIST;

	var router = express.Router()
	.use(bodyParser.json())
	.use(bodyParser.urlencoded({ extended: false }));

	router.get('*',    wrapAsMiddleware(handleGet, true));
	router.put('*',    wrapAsMiddleware(handlePut, false));
	router.delete('*', wrapAsMiddleware(handleDelete, false));
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
			return Promise.resolve()
			.then(acquire.bind(null, req, res))
			.then(handler.bind(null, req, res))
			.then(function() { //eslint-disable-line consistent-return
				return save(req, req.prefs);
			})
			.catch(next); // next(err)
		};
	}

	// Promised middleware that acquires prefs from the metastore and stores in `req`.
	function acquire(req) {
		return new Promise(function(fulfill, reject) {
			read(req, function(err, scope, prefs){
				if (err) {
					return reject(err);
				}
				if (scope === "user") {
					fulfill(new MODEL(prefs || null));
				}
				// TODO wrap workspace preference
			});
		})
		.then(function(prefs) {
			var urlObj = req._parsedUrl || nodeUrl.parse(req.url);
			req.prefs = prefs;
			req.prefPath = urlObj.pathname.split("/").slice(2).join("/");
			req.prefNode = req.prefs.get(req.prefPath);
		});
	}

	// @returns Promise that resolves if prefs were written to the metastore ok, rejects if a problem happened.
	function save(req, prefs) {
		/*eslint-disable consistent-return*/
		if (!prefs.modified()) {
			return Promise.resolve();
		}
		return new Promise(function(fulfill, reject) {
			update(req, prefs.getJson(), function(err){
				if (err) {
					return reject(err);
				}
				fulfill();
			});
		})
		.catch(function(err) {
			throw err;
		});
		/*eslint-enable*/
	}
	
	function read(req, callback){
		var scope = req.url.split("/")[1];
		var store = fileUtil.getMetastore(req);
		if (scope === "user"){
			store.getUser(req.user.username, function(err, data) {
				callback(err, scope, data ? data.properties : null);
			});
		} else if (scope === "workspace") {
			store.getWorkspace(req.user.workspaceId, function(err, data) {
				callback(err, scope, data ? data.properties : null);
			});
		} else if (scope === "project") {
			// TODO implement read project prefs
		}
	}
	
	function update(req, prefs, callback){
		var scope = req.url.split("/")[1];
		var store = fileUtil.getMetastore(req);
		if(scope === "user"){
			store.updateUser(req.user.username, {properties:prefs}, function(err){
				callback(err);
			});
		}else if(scope === "workspace"){
			store.updateWorkspace(req.user.workspaceId, {properties:prefs}, function(err){
				callback(err);
			});
		}else if(scope === "project"){
			// TODO implement update project prefs
		}
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

function readElectronPrefs(){
	try {
		var content = fs.readFileSync(getElectronPrefsFileName(),'utf8');
		return JSON.parse(content);
	} catch (e) {}
	return {};
}

function writeElectronPrefs(contents){
//	fs.writeFileSync(getElectronPrefsFileName(), JSON.stringify(contents, null, 2), 'utf8');
}