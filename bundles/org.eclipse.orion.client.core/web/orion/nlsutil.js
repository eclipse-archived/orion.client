/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/
define([], function() {
	
	function urlExists(url)
	{
		var http = new XMLHttpRequest();
		http.open('GET', url, false);
		http.send();
		return http.status!=404;
	}
	
	function getNlsBundle(bundlePath){
		var ret= {root:true};
		var locale;
		var baseUrl = "";
		try{
			locale = require.s.contexts._.config.locale;
			baseUrl = require.s.contexts._.config.baseUrl;
		}catch(e){}
		locale = locale ||	navigator.language || navigator.userLanguage;
		if(locale){
			locale = locale.toLowerCase();
			var parts = locale.split("-");
			var urlSegments = bundlePath.split("/");
			var nlsModule = urlSegments[urlSegments.length-1];
			var baseNls = bundlePath.substring(0, bundlePath.length - nlsModule.length);
			if(urlExists(baseUrl + baseNls + locale + "/" + nlsModule + ".js")){
				ret[locale] = true;
			} else if(parts.length>1){
				if(urlExists(baseUrl + baseNls + parts[0] + "/" + nlsModule + ".js")){
					ret[parts[0]] = true;
				}
			}
		}
		return ret;
	}
	
	//return module exports
	return {
		getNlsBundle: getNlsBundle
	};
});