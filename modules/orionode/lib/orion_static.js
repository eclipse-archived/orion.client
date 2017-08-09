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

//Add custom mime/extension mappings for files with costomized extension, like : pref
mime.define({
	'application/json': ['pref', 'json']
});

var _24_HOURS = "public, max-age=86400, must-revalidate";
var _12_HOURS = "max-age=43200, must-revalidate";
var _15_MINUTE = "max-age=900, must-revalidate";
var _NO_CACHE = "max-age=0, no-cache, no-store";
var EXT_CACHE_MAPPING = {
	// 24 Hours:
	".gif": _24_HOURS, 
	".jpg": _24_HOURS,
	".png": _24_HOURS, 
	".bmp": _24_HOURS, 
	".tif": _24_HOURS,
	".ico": _24_HOURS,
	
	// 12 Hours:
	".js": _12_HOURS, 
	".css": _12_HOURS,
	
	// 15 Minutes:
	".json": _15_MINUTE, 
	".pref": _15_MINUTE, 
	".woff": _15_MINUTE,
	".ttf": _15_MINUTE,
	
	// No Cache:
	".html": _NO_CACHE, 
};


/**
 * @param {Object} options Options to be passed to static middleware
 * @param {Number} [options.maxAge]
 */
exports = module.exports = function(options) {
	options = options || {};
	options.dotfiles = 'allow';
	options.setHeaders = function setMaxAgeAccordingly(res, path, stat){
		var ext = nodePath.extname(path);
		if(nodePath.basename(nodePath.dirname(path)) === "requirejs"){
			res.setHeader("Cache-Control",_24_HOURS);
		}else if(EXT_CACHE_MAPPING[ext]){
			res.setHeader("Cache-Control", EXT_CACHE_MAPPING[ext] );
		}else{
			res.setHeader("Cache-Control", _24_HOURS);
		}
	};
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
		'./bundles/org.eclipse.orion.client.cf/web'
	];
	var fullStaticAssets = options.prependStaticAssets.concat(originalStaticAssets).concat(options.appendStaticAssets);
	fullStaticAssets = fullStaticAssets.forEach(function(bundlePath) {
		var path = nodePath.resolve(orionClientRoot, bundlePath);
		app.use(express.static(path, options));
	});
	return app;
};
