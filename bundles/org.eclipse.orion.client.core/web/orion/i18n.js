/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
var eclipse = eclipse || {};

eclipse.I18nMessages = function(bundlePath, locale){
	var urlSegments = bundlePath.split("/");
	var nlsModule = urlSegments[urlSegments.length-1];
	var baseNls = bundlePath.substring(0, bundlePath.length - nlsModule.length);
	locale = locale || navigator.language || navigator.userLanguage;
	
	var messages = {};
	
	messages.formatMessage = function(msg) {
		var args = arguments;
		return msg.replace(/\$\{([^\}]+)\}/g, function(str, index) { return args[(index << 0) + 1]; });
	};
	
	function define(messageBundle){
		for(var key in messageBundle){
			messages[key] = messageBundle[key];
		}
	}
	
	function loadBundle(loc){
		var http = new XMLHttpRequest();
		http.open('GET',  baseNls + loc + "/" + nlsModule + ".js", false);
		http.send();
		if(http.status!=200)
			return false;
		eval(http.responseText);
		return true;
	}
	
	loadBundle("root");
	
	if(locale){
		if(loadBundle(locale)){
			return messages;
		}
		var parts = locale.split("-");
		if(parts.length>1){
			loadBundle(parts[0]);
		}
	}
	
	
	return messages;
};