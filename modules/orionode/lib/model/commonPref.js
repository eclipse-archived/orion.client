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
var debug = require('debug')('orion:prefs');

module.exports = Prefs;

// Sentinel value for nonexistent properties
var NOT_EXIST = Prefs.NOT_EXIST = function notExist() {};

// Represents a preferences tree
// @param {string?} s JSON string
function Prefs(s) {
	this.json = (typeof s === 'string' ? JSON.parse(s) : {})
	this.isModified = false;
}
// @param path - eg. /user/editor/settings
// @returns The node, or NOT_EXIST if the path did not exist.
Prefs.prototype.get = function(path) {
	var root = this.json.Properties;
	var segs = path.split('/');
	var key = path; // substr(1) to strip the leading slash
	var result;
	if (segs[0] === '') {
		result = root;
	} else {
		try{
			var rootKeys = Object.keys(root);
			rootKeys.forEach(function(rootKey){
				if(rootKey.startsWith(key) && !rootKey.startsWith("User")){
					if(typeof result === 'undefined') result = {};
					return result[rootKey.substr(key.length + 1)] = JSON.parse(root[rootKey]);
				}
			});
		}catch(err){
			console.log(err)
		}
	}
	if (result === NOT_EXIST || typeof result === 'undefined'){
		debug('Pref.get(%s) == NOT_EXIST in Java version Prefs either', key);
		return NOT_EXIST;
	}
	if (debug.enabled) {
		debug('Pref.get(%s) == %s', key, JSON.stringify(result).substr(0, 100));
	}
	return naiveClone(result);
};
// Replaces the node at the given path. If node === NOT_EXIST then the node is removed.
Prefs.prototype.set = function(path, node) {
	if (path === '') {
		this.json.Properties = node;
		debug('Prefs.set(%s) := %s', path, JSON.stringify(node));
		return;
	}
	var obj = this.json.Properties;
	if (node === NOT_EXIST) {
		delete obj[path];
	} else {
		var keys = Object.keys(node);
		keys.forEach(function(key){
			obj[path + "/" + key] = typeof node[key] === "string" ? node[key] : JSON.stringify(node[key]);
			debug('Prefs.set(%s) := %s', path + "/" + key, typeof node[key] === "string" ? node[key] : JSON.stringify(node[key]));
		});
	}
	this.isModified = true;
};
Prefs.prototype.delete = function(path) {
	this.set(path, NOT_EXIST);
};
Prefs.prototype.toJSON = function() {
	return JSON.stringify(this.json, null, 2); //pretty-print
};
Prefs.prototype.modified = function() {
	return this.isModified;
};

function naiveClone(o) {
	return JSON.parse(JSON.stringify(o));
}
