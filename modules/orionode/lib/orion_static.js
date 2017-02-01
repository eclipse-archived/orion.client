/*******************************************************************************
 * Copyright (c) 2012, 2014, 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/
var express = require('express');
var nodePath = require('path');
var mime = require('mime');
//var mime = connect.mime;

//not sure what mime is for
mime.define({
	'application/json': ['pref', 'json']
});

var _24_HOURS = 1440 * 60000;

/**
 * @param {Object} options Options to be passed to static middleware
 * @param {Number} [options.maxAge]
 */
exports = module.exports = function(options) {
	options = options || {};
	options.dotfiles = 'allow';
	options.maxAge = typeof options.maxAge === "number" ? options.maxAge : _24_HOURS;
	var orionClientRoot = options.orionClientRoot;
	if (!orionClientRoot) { throw new Error('orion-static root path required'); }

/* To run the base Orion client code, we need the following resource mappings:
 *
 * Web path                  File path                                                        Comment
 * ------------------------------------------------------------------------------------------------------------
 *  /                        lib/orion.client/bundles/org.eclipse.orion.client.core/web       Orion core
 *  /                        lib/orion.client/bundles/org.eclipse.orion.client.ui/web         Orion IDE
 *  /                        lib/orion.client/bundles/org.eclipse.orion.client.editor/web     Orion editor
 *  ... and so on
 */

	// Handle the Orion IDE and Orion editor mappings:
	var app = express();
	app.use(express.static(options.orionode_static));
	var originalStaticAssets = 
	[	'./bundles/org.eclipse.orion.client.core/web',
		'./bundles/org.eclipse.orion.client.editor/web',
		'./bundles/org.eclipse.orion.client.javascript/web',
		'./bundles/org.eclipse.orion.client.ui/web',
		'./bundles/org.eclipse.orion.client.help/web',
		'./bundles/org.eclipse.orion.client.git/web',
		'./bundles/org.eclipse.orion.client.webtools/web',
		'./bundles/org.eclipse.orion.client.users/web',
		'./bundles/org.eclipse.orion.client.cf/web',
		'./bundles/org.eclipse.orion.client.collab/web'
	];
	var fullStaticAssets = options.prependStaticAssets.concat(originalStaticAssets).concat(options.appendStaticAssets);
	fullStaticAssets = fullStaticAssets.forEach(function(bundlePath) {
		var path = nodePath.resolve(orionClientRoot, bundlePath);
		app.use(express.static(path, options));
	});
	return app;
};
