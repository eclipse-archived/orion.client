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
    debug = require("debug"),
    nodeutil = require("util"),
    format = nodeutil.format;

/**
 * @returns {Function} the log function for the given subcomponent of cf-launcher
 * The returned function supports `util.format` arguments
 */
module.exports = function(component) {
	var suffix = "";
	if (component)
		suffix = ":" + component;
	var debugFn = debug(pkg.name + suffix);
	return function(/*args.*/) {
		return debugFn.call(debugFn, format.apply(nodeutil, arguments));
	};
};
