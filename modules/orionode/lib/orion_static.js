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
var mime = connect.mime;
var statik = connect['static'];

/**
 * @param {Object} options Options to be passed to connect/static
 */
exports = module.exports = function(root, options) {
	options = options || {};
	options.maxAge = (1440 * 60000); // 24 hours
	options.hidden = true;
	var dojoRoot = options.dojoRoot;
	if (!root) { throw new Error('orion-static root path required'); }
	if (!dojoRoot) { throw new Error('dojoRoot path required'); }

/* To run the base Orion client code, we need the following resource mappings, in order of priority
 * (ie. an earlier mapping wins over a later one, when both contain a requested path).
 *
 * Web path    File path                                                        Comment
 * ------------------------------------------------------------------------------------------------------------
 *  /          lib/orion.client/bundles/org.eclipse.orion.client.core/web       Orion IDE
 *  /          lib/orion.client/bundles/org.eclipse.orion.client.editor/web     Orion editor
 *  /          lib/orion.client/bundles/org.eclipse.orion.client.core/web/dojo  Orion-specific Dojo fixes
 *  /          lib/dojo/org.dojotoolkit                                         Dojo
 */
	return connect(
		statik(path.resolve(root, './bundles/org.eclipse.orion.client.core/web'), options),
		statik(path.resolve(root, './bundles/org.eclipse.orion.client.editor/web'), options),
		statik(path.resolve(root, './bundles/org.eclipse.orion.client.core/web/dojo'), options),
		statik(path.resolve(dojoRoot, './'), options)
	);
};
