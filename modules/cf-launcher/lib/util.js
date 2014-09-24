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

utils.checker = function(obj) {
	function fail(prop, type) {
		throw new Error(nodeutil.format("Expected property '%s' to be %s", prop, type));
	}
	var checker = {};
	checker.array = function(prop) {
		if (!Array.isArray(obj[prop]))
			fail(prop, "array");
		return checker;
	};
	checker.string = function(prop) {
		var val = obj[prop];
		if (typeof val !== "string")
			fail(prop, "string");
		return checker;
	};
	checker.optString = function(prop) {
		var val = obj[prop];
		if (typeof val !== "string" && val !== null && typeof val !== "undefined")
			fail(prop, "string or null or undefined");
		return checker;
	};
	// Something coercible to a number
	checker.numbery = function(prop) {
		var val = obj[prop];
		isNaN(Number(val)) && fail(prop, "number");
		return checker;
	};
	return checker;
};

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
 */
utils.log = function(/*message, replacements*/) {
	debug(nodeutil.format.apply(nodeutil, arguments));
};

