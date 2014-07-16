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
var async = require('../lib/async');
var fs = require('fs');
var path = require('path');
var dfs = require('deferred-fs'), Deferred = dfs.Deferred;
var PATH_TO_NODE = process.execPath;

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

function _checkNpmPath(config, callback){
	var result = config, npm_path_guess_list = [];
	if(result && result.npm_path){
		var npmPath = result.npm_path;
		if(npmPath.indexOf("./") === 0 || npmPath.indexOf("../") === 0){
			npmPath = path.dirname(PATH_TO_NODE) + "/" + npmPath;
		}
		npm_path_guess_list.push(npmPath);
	}
	if(!result){
		result = {};
	}
	var found = null;
	
	npm_path_guess_list.push(path.dirname(PATH_TO_NODE) + "/" + "../lib/node_modules/npm/bin/npm-cli.js");
	npm_path_guess_list.push(path.dirname(PATH_TO_NODE) + "/" + "./node_modules/npm/bin/npm-cli.js");
    var promises = [];
	npm_path_guess_list.forEach(function(guess) {
		promises.push(function(){
			if(!found){
				return dfs.exists(guess).then(function(exists){
					if(exists){
						found = guess;
					} 
					return found;
				});
			} else {
				return found;
			}
		});
	});
	async.sequence(promises).then(function(existingGuess){
		if(!existingGuess){
			result.npm_path = null;
			var errorMessage = "Could not find npm in the following locations:\n";
			npm_path_guess_list.forEach(function(guess) {
				errorMessage = errorMessage + guess + "\n";
			});
			errorMessage = errorMessage + "Please add or modify the npm_path in the orion.conf file and restart the server.\n";
			console.log(errorMessage);
			errorMessage = errorMessage + "For details refer to [how to config npm path](http://wiki.eclipse.org/Orion/Getting_Started_with_Orion_node#Making_sure_Orionode_can_launch_npm)\n";
			result.npm_error_message = errorMessage;
		} else {
			result.npm_path = existingGuess;
		}
		callback(result);
	});
}

/**
 * @param {Function} callback Invoked as function(configObject), the configObject is null if the file couldn't be read.
 */
exports.readConfigFile = function(configFile, callback) {
	if (configFile) {
		fs.readFile(configFile, function(err, content) {
			if (err) { throw err; }
			var params = content.toString().split(/\r?\n/);
			var result = {};
			params.forEach(function(pair) {
				if (pair.trim().charAt(0) === '#') {
					return;
				}
				var parsed = /([^=]*)(=?)(.*)/.exec(pair);
				var name = (parsed[1] || "").trim();
				var value = (parsed[3] || "").trim();
				if (name !== "") {
					result[name] = value;
				}
			});
			_checkNpmPath(result, callback);
		});
	} else {
		_checkNpmPath(null, callback);
	}
};
