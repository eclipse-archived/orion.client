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
/*global exports:true module require*/
var connect = require('connect');
var path = require('path');
var statik = connect['static'];
var mime = connect.mime;

exports = module.exports = function(root, options) {
	options = options || {};
	options.maxAge = options.dev ? (120 * 60000) : 0; // 2 hrs cache, or no cache in dev mode
	options.hidden = true;
	if (!root) { throw new Error('orionode-static root path required'); }
	if (!options.socketIORoot) { throw new Error('socketIO-client root path required'); }

/* To run the Orionode client code, we need the following resource mapping, plus the mappings required for 'orion_static'.
 * The Orionode client code selectively "overrides" some resource from orion_static to provide its own implementation (eg. defaults.pref)
 *
 * Web path      File path                           Comment
 * -----------------------------------------------------------------------------------
 *   /           lib/orionode.client                 Mounts Orionode's plugin setup, and plugin code.
 *   /socketIO   node_modules/socket.io-client/dist  The socket.io library -- this is an implicit dependency, should try to encapsulate 
 *                                                    into a single middleware.
 */
	return connect()
		.use('/socketIO', statik(path.resolve(options.socketIORoot, './dist/')))
		.use(statik(root, options));
};
