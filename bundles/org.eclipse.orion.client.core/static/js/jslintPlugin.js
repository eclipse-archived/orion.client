/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/**
 * @namespace The global container for eclipse APIs.
 */ 
var eclipse = eclipse || {};

eclipse.JSLintServiceProvider = function() {
};

eclipse.JSLintServiceProvider.prototype = eclipse.ServiceProvider.extend({
	checkSyntax: function(title, contents) {
		JSLINT(contents, {white: false, onevar: false, undef: true, nomen: false, eqeqeq: true, plusplus: false, bitwise: false, regexp: true, newcap: true, immed: true, strict: false});
		var result = JSLINT.data();
		this.dispatchEvent("syntaxChecked", {title: title, result: result}, this.pluginData.services[0].serviceType.id, this.pluginData.services[0].id);
		return result;
	}
});

document.addEventListener("DOMContentLoaded", function() {
	var pluginData = {
		services : [{
			id : "JSLintEditorSyntaxChecker", 
			serviceType : {
				id: "IEditorSyntaxChecker", 
				interfaces : ["checkSyntax"]
			},
			properties: {}
		}]
	};
	var serviceProvider = new eclipse.JSLintServiceProvider();
	var jslintPlugin = new eclipse.Plugin(pluginData, serviceProvider);
	jslintPlugin.start();
}, false);
