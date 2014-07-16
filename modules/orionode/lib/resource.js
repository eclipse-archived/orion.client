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
var url = require('url');
var util = require('util');
var api = require('./api');

module.exports = function(root, handler) {
	if (!root) { throw 'Orion file root path required'; }
	if (!handler) { throw 'handler object required'; }

	return function(req, res, next) {
		var path = url.parse(req.url).pathname;
		var rest;
		if ((rest = api.rest(root, path)) !== null) {
			var methodFunc = handler[req.method];
			if (typeof methodFunc === 'function') {
				methodFunc(req, res, next, rest);
			} else {
				var error = JSON.stringify({Message: util.format('Unhandled method %s for %s', req.method, path)});
				res.setHeader('Content-Length', error.length);
				res.setHeader('Content-Type', 'application/json');
				res.writeHead(501);
				res.end(error);
			}
		} else {
			next();
		}
	};
};
