/*******************************************************************************
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/
var cors = require("cors"),
    logger = require("../logger")("cors");

/**
 * @param {String[]} options.whitelist List of Origins to allow CORS requests from.
 */
function Cors(options) {
	var whitelist = options.whitelist;
	if (!Array.isArray(whitelist))
		throw new Error("Missing param");

	var origins = Object.create(null);
	whitelist.forEach(function(origin) {
		origins[origin] = true;
	});

	var corsOptions = {
		origin: whitelist.length === 0
			? false // CORS disabled across the board
			: function(origin, callback) {
				var allow = (typeof origins[origin] !== "undefined");
				logger("CORS origin %s, allowed? %s", origin, allow);
				callback(null, allow);
			}
	};
	return cors(corsOptions);
}

module.exports = Cors;
