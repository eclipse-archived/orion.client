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
var fs = require('fs');
var nodePath = require('path');
var Promise = require('bluebird');
var mkdirp = require('mkdirp');
var mkdirpAsync = Promise.promisify(mkdirp);

/**
 * @param {Array} argv
 * @returns {Object}
 */
exports.parseArgs = function(argv) {
	argv = argv.slice(2); // skip 'node', 'index.js'
	var args = {}, match;
	for (var i=0; i < argv.length; i++) {
		if ((match = /-(\w+)/.exec(argv[i]))) {
			var name = match[1], value = argv[i+1];
			args[name] = value;
		}
	}
	return args;
};

/**
 * @param {Array} Directories to be created. They're created serially to allow subdirs of an earlier entry to appear later in the list.
 */
exports.createDirs = function(dirs, callback) {
	var path = nodePath.join.apply(null, dirs);
	return mkdirpAsync(path, {}).asCallback(callback);
};

/**
 * @param {Function} callback Invoked as function(password), the password is null if the file couldn't be read.
 */
exports.readPasswordFile = function(passwordFile, callback) {
	if (passwordFile) {
		fs.readFile(passwordFile, function(err, data) {
			if (err) { throw err; }
			callback(String.prototype.trim.call(data));
		});
	} else {
		callback(null);
	}
};

/**
 * @param {Function} callback Invoked as function(configObject), the configObject is null if the file couldn't be read.
 */
exports.readConfigFile = function(configFile, callback) {
	if (!configFile) {
		return callback(new Error());
	}
	fs.readFile(configFile, function(err, content) {
		if (err) {
			return callback(err);
		}
		var params = content.toString().split(/\r?\n/);
		var result = {};
		params.forEach(function(pair) {
			if (pair.trim().charAt(0) === '#') {
				return;
			}
			var parsed = /([^=]*)(=?)(.*)/.exec(pair);
			var name = (parsed[1] || "").trim();
			var value = (parsed[3] || "").trim();
			if (value === "true") {
				value = true
			}
			if (value === "false") {
				value = false
			}
			if (name !== "") {
				result[name] = value;
			}
		});
		callback(result);
	});
};
