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
/*global console exports process require*/
var compat = require('./compat');
var fs = require('fs');
var path = require('path');
var pfs = require('promised-io/fs');
//var PromisedIO = require('promised-io');
var Deferred = require('promised-io').Deferred;

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
	var promises = dirs.map(function(dir) {
		var d = new Deferred();
		fs.exists(dir, function(error, exists) {
			if (!exists) {
				fs.mkdir(dir, function(error) {
					d.resolve(dir);
				});
			} else {
				d.resolve(dir);
			}
		});
		return d;
	});
	var results = [];
	(function next(i) {
		if (i === promises.length) {
			callback(results);
		} else {
			promises[i].then(function(dir) {
				results.push(dir);
				next(i + 1);
			});
		}
	}(0));
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