/*******************************************************************************
 * Copyright (c) 2012, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/
var connect = require('connect');
var path = require('path');
var mime = connect.mime;
var statik = connect['static'];

mime.define({
	'application/json': ['pref', 'json']
});

var _24_HOURS = 1440 * 60000;

/**
 * @param {Object} options Options to be passed to connect/static
 * @param {Number} [options.maxAge]
 */
exports = module.exports = function(options) {
	options = options || {};
	options.maxAge = typeof options.maxAge === "number" ? options.maxAge : _24_HOURS;
	options.hidden = true;
	var orionClientRoot = options.orionClientRoot;
	if (!orionClientRoot) { throw new Error('orion-static root path required'); }

/* To run the base Orion client code, we need the following resource mappings:
 *
 * Web path                  File path                                                        Comment
 * ------------------------------------------------------------------------------------------------------------
 *  /                        lib/orion.client/bundles/org.eclipse.orion.client.core/web       Orion core
 *  /                        lib/orion.client/bundles/org.eclipse.orion.client.ui/web         Orion IDE
 *  /                        lib/orion.client/bundles/org.eclipse.orion.client.editor/web     Orion editor
 */

	// Handle the Orion IDE and Orion editor mappings:
	return connect(
		statik(path.resolve(orionClientRoot, './bundles/org.eclipse.orion.client.core/web'), options),
		statik(path.resolve(orionClientRoot, './bundles/org.eclipse.orion.client.editor/web'), options),
		statik(path.resolve(orionClientRoot, './bundles/org.eclipse.orion.client.javascript/web'), options),
		statik(path.resolve(orionClientRoot, './bundles/org.eclipse.orion.client.ui/web'), options),
		statik(path.resolve(orionClientRoot, './bundles/org.eclipse.orion.client.help/web'), options),
		statik(path.resolve(orionClientRoot, './bundles/org.eclipse.orion.client.git/web'), options),
		statik(path.resolve(orionClientRoot, './bundles/org.eclipse.orion.client.webtools/web'), options),
		statik(path.resolve(orionClientRoot, './bundles/org.eclipse.orion.client.users/web'), options)
	);
};
