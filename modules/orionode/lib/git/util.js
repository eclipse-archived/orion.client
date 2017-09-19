/*******************************************************************************
 * Copyright (c) 2016, 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *		 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node */

module.exports = {};

module.exports.encodeURIComponent = function(path) {
	return encodeURIComponent(encodeURIComponent(path));
};

/**
 * @name module.exports.decodeURIComponent
 * @description Helper to properly decode a path.
 * @function
 * @param {string} path The path to decode
 * @returns {string} The decoded path
 */
module.exports.decodeURIComponent = function(path) {
	var result = path;
	try {
		result = decodeURIComponent(result);
		result = decodeURIComponent(result);
	} catch (e) {}
	return result;
};