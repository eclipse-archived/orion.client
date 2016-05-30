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
	var root = this.json, segs = path.substr(1).split('/'); // substr(1) to strip the leading slash
	var result;
	if (segs[0] === '') {
		result = root;
	} else {
		result = segs.reduce(function(prev, curr) {
			if (typeof prev !== 'object' || prev === null) {
				return NOT_EXIST;
			}
			return prev[curr];
		}, root);
	}

	if (result === NOT_EXIST || typeof result === 'undefined') {
		debug('Pref.get(%s) == NOT_EXIST', path);
		return NOT_EXIST;
	}
	if (debug.enabled) {
		debug('Pref.get(%s) == %s', path, JSON.stringify(result).substr(0, 200));
	}
	return naiveClone(result);
};
// Replaces the node at the given path. If node === NOT_EXIST then the node is removed.
Prefs.prototype.set = function(path, node) {
	var segs = path.substr(1).split('/'); // substr(1) to strip leading slash
	if (segs[0] === '') {
		this.json = node;
		debug('Prefs.set(%s) := %s', path, JSON.stringify(node));
		return;
	}

	var obj = this.json;
	for (var i = 0; i < segs.length - 1; i++) {
		var propName = segs[i];
		if (typeof obj[propName] !== 'object' || obj[propName] === null) {
			obj[propName] = {};
		}
		obj = obj[propName];
	}
	var finalSeg = segs[segs.length - 1];
	if (node === NOT_EXIST) {
		delete obj[finalSeg];
	} else {
		obj[finalSeg] = node;
	}
	debug('Prefs.set(%s) := %s', path, JSON.stringify(node));
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
