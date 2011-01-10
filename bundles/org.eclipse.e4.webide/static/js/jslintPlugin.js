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

eclipse.JSLintPlugin = function() {
	var pluginData = {
		services : [{
			id : "JSLintEditorSyntaxChecker", 
			serviceType : "IEditorSyntaxChecker",
			properties: {}
		}]
	};
	this._initialize(pluginData);
};

eclipse.JSLintPlugin.prototype = new eclipse.Plugin({});
eclipse.JSLintPlugin.prototype.constructor = eclipse.JSLintPlugin;

eclipse.JSLintPlugin.prototype.checkSyntax = function(title, contents) {
	JSLINT(contents, {white: false, onevar: false, undef: true, nomen: false, eqeqeq: true, plusplus: false, bitwise: false, regexp: true, newcap: true, immed: true, strict: false});
	var result = JSLINT.data();
	this.fireEvent("syntaxChecked", {title: title, result: result}, this.pluginData.services[0].serviceType, this.pluginData.services[0].id);
	return result;
};

document.addEventListener("DOMContentLoaded", function() {
	var jslintPlugin = new eclipse.JSLintPlugin();
	jslintPlugin.start();
}, false);
