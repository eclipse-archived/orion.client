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
var basicAuth = require('basic-auth');

function noop(req, res, next) {
	next();
}

module.exports = function auth(pwd) {
	if (typeof pwd !== 'string' || pwd.length === 0) {
		return noop;
	}
	return function checkAuth(req, res, next) {
		var credentials = basicAuth(req);
		if (!credentials || credentials.pass !== pwd) {
			res.set('WWW-Authenticate', 'Basic realm="example"');
			return res.sendStatus(401);
		}
		return next();
	 };
}