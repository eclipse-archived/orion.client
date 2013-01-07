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
 * @param {Number} [options.maxAge]
 */
exports = module.exports = function(options) {
	options = options || {};
	options.maxAge = options.dev ? 0 : (1440 * 60000); // 24 hours
	options.hidden = true;
	var orionClientRoot = options.orionClientRoot;
	if (!orionClientRoot) { throw new Error('orion-static root path required'); }

/* To run the base Orion client code, we need the following resource mappings, in order of priority
 * (ie. an earlier mapping wins over a later one, when both contain a requested path).
 *
 * Web path                  File path                                                        Comment
 * ------------------------------------------------------------------------------------------------------------
 *  /                        lib/orion.client/bundles/org.eclipse.orion.client.core/web       Orion IDE
 *  /                        lib/orion.client/bundles/org.eclipse.orion.client.editor/web     Orion editor
 *  /                        lib/orion.client/bundles/org.eclipse.orion.client.core/web/dojo  Orion-specific Dojo fixes
 *  /org.dojotoolkit/dojo    node_modules/dojo                                                Dojo
 *  /org.dojotoolkit/dijit   node_modules/dijit                                               Dijit
 *  /org.dojotoolkit/dojox   node_modules/dojox                                               Dojox
 */

	// Handle the Orion IDE and Orion editor mappings:
	return connect(
		statik(path.resolve(orionClientRoot, './bundles/org.eclipse.orion.client.core/web'), options),
		statik(path.resolve(orionClientRoot, './bundles/org.eclipse.orion.client.editor/web'), options)
	);
};
