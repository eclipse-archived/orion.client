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

eclipse.UpperProvider = function() {
};

eclipse.UpperProvider.prototype = eclipse.ServiceProvider.extend({
	info : function() {
		return {
			name : "UPPERCASE",
			img : "/favicon.ico",
			key : [ "u", true ]
		};
	},
	run : function(text) {
		return text.toUpperCase();
	}
});


document.addEventListener("DOMContentLoaded", function() {
	var pluginData = {
		services : [{
			id : "UpperCaseEditorAction", 
			serviceType : {
				id: "editorAction", 
				interfaces : ["info","run"]
			},
			properties: {}
		}]
	};
	var serviceProvider = new eclipse.UpperProvider();
	var upperPlugin = new eclipse.Plugin(pluginData, serviceProvider);
	upperPlugin.start();
}, false);
