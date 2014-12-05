/*******************************************************************************
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/
var pkg = require("../package.json"),
    debug = require("debug")(pkg.name),
    nodeutil = require("util"),
    utils = exports;

utils.V8_DEBUG_PORT = 5858;

utils.VERBOSE = "VERBOSE" in process.env || "LAUNCHER_VERBOSE" in process.env || false;

// Mix in properties from `source` into  `target`
utils.extend = function(target, source) {
	if (!source || typeof source !== "object")
		return target;
	Object.keys(source).forEach(function(key) {
		target[key] = source[key];
	});
	return target;
};

/**
 * Logs a debug message with printf-style substitution.
 * @deprecated use a specific debugger instead, eg debug("cf-launcher:foo") for some component 'foo'
 */
utils.log = function(/*message, replacements*/) {
	debug(nodeutil.format.apply(nodeutil, arguments));
};

/**
 * Tries to parse an array from JSON from the given value.
 * @param {String} [value]
 * @returns {Array} or null if value did not contain a valid JSON array.
 */
utils.maybeJSONArray = function(value) {
	try {
		value = JSON.parse(value);
	} catch(e) {}
	return Array.isArray(value) ? value : null;
};