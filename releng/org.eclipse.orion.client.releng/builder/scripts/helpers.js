/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*
 * Helper script for Orion build-time minification. 
 * Must be executed from an Ant <scriptdef> using Rhino.
 */
/*global Packages orion:true project Project self*/

if (typeof orion === "undefined" || orion === null) {
	orion = {};
}
orion.build = orion.build || {};

(function() {
	// Rough ES5 shims if we are running under an ancient ES3 environment.. like the version of Rhino bundled with Java6
	if (!Array.isArray) {
		Array.isArray = function(a) {
			return Object.prototype.toString.call(a) === '[object Array]';
		};
	}
	if (!Array.prototype.filter) {
		Array.prototype.filter = function(callback/*, thisArg */) {
			var array = Object(this), len = array.length, thisArg = arguments.length > 1 ? arguments[1] : undefined;
			var result = [];
			for (var i=0; i < len; i++) {
				if (i in array) {
					var value = array[i];
					if (callback.call(thisArg, value, i, array))
						result.push(value);
				}
			}
			return result;
		};
	}
	if (!Array.prototype.forEach) {
		Array.prototype.forEach = function(callback/*, thisArg */) {
			var array = Object(this), len = array.length, thisArg = arguments.length > 1 ? arguments[1] : undefined;
			for (var i=0; i < len; i++) {
				if (i in array)
					callback.call(thisArg, array[i], i, array);
			}
		};
	}
	if (!Array.prototype.map) {
		Array.prototype.map = function(callback/*, thisArg*/) {
			var array = Object(this), len = array.length, thisArg = arguments.length > 1 ? arguments[1] : undefined;
			var result = new Array(len);
			for (var i=0; i < len; i++) {
				if (i in array)
					result[i] = callback.call(thisArg, array[i], i, array);
			}
			return result;
		};
	}
	if (!Object.keys) {
		Object.keys = function(o) {
			var a = [], p;
			for (p in o)
				if (Object.prototype.hasOwnProperty.call(o, p))
					a.push(p);
			return a;
		};
	}

	function deserialize(buildFileText) {
		return new Function("var o = " + buildFileText + "; return o;")();
	}
	
	function getBuildObject(path) {
		var file = project.resolveFile(path);
		var scanner = new Packages.java.util.Scanner(file, "UTF-8").useDelimiter("\\Z");
		var text = String(scanner.next());
		scanner.close();
		return deserialize(text);
	}

	/**
	 * Returns bundle info from the build config.
	 * @param {Object} buildObj The build config object
	 * @returns { name: string, web: java.io.File }[] Array of bundle info objects.
	 */
	function getBundles(buildObj) {
		var _self = self;
		var bundles = (buildObj.bundles || []);
		return bundles.map(function(bundle) {
			bundle = project.replaceProperties(bundle);
			var dir = project.resolveFile(bundle + Packages.java.io.File.separator + "web");
			if (!dir.exists() || !dir.isDirectory()) {
				_self.log("Bundle folder " + dir.getPath() + " does not exist", Project.MSG_WARN);
				return null;
			}
			_self.log("Found bundle web folder: " + dir.getPath());
			return { bundle: bundle,  web: dir };
		}).filter(function(b) {
			return !!b;
		});
	}

	orion.build.getBuildObject = getBuildObject;
	orion.build.getBundles = getBundles;
}());
