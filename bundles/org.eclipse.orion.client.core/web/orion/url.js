/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 (http://www.eclipse.org/legal/epl-v10.html),
 * and the Eclipse Distribution License v1.0
 * (http://www.eclipse.org/org/documents/edl-v10.html).
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define */
define(function() {
	var buildMap = {};
	function jsEscape(text) {
		return (text + '')
			.replace(/([\\'])/g, '\\$&')
			.replace(/[\0]/g, "\\0")
			.replace(/[\b]/g, "\\b")
			.replace(/[\f]/g, "\\f")
			.replace(/[\n]/g, "\\n")
			.replace(/[\r]/g, "\\r")
			.replace(/[\t]/g, "\\t");
	}

	return {
		load: function(name, parentRequire, onLoad, config) {
			var temp = parentRequire.toUrl(name + "._");
			var url = temp.substring(0, temp.length - 2);
			if (config.isBuild) {
				buildMap[name] = url;
			}
			onLoad(url);
		},
		write: function(pluginName, moduleName, write, config) {
			if (moduleName in buildMap) {
				var text = jsEscape(buildMap[moduleName]);
				write("define('" + pluginName + "!" + moduleName + "', function(){return '" + text + "';});\n");
			}
		}
	};
});