/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: 
 *		Felipe Heidrich (IBM Corporation) - initial API and implementation
 *		Silenio Quarti (IBM Corporation) - initial API and implementation
 */

/*global window */

/**
 * Evaluates the definition function and mixes in the returned module with
 * the module specified by <code>moduleName</code>.
 * <p>
 * This function is intented to by used when RequireJS is not available.
 * </p>
 *
 * @param {String[]} deps The array of dependency names.
 * @param {Function} callback The definition function.
 * @param {String} moduleName The mixin module name.
 */
if (!window.define) {
	window.define = function(deps, callback, moduleName) {
		var module = this;
		var split = moduleName.split("/"), i, j;
		for (i = 0; i < split.length; i++) {
			module = module[split[i]] = (module[split[i]] || {});
		}
		var depModules = [], depModule;
		for (j = 0; j < deps.length; j++) {
			depModule = this;
			split = deps[j].split("/");
			for (i = 0; i < split.length - 1; i++) {
				depModule = depModule[split[i]] = (depModule[split[i]] || {});
			}
			depModules.push(depModule);
		}
		var newModule = callback.apply(this, depModules);
		for (var p in newModule) {
			if (newModule.hasOwnProperty(p)) {
				module[p] = newModule[p];
			}
		}
	};
}
