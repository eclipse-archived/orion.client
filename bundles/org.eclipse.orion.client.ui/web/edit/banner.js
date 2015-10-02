/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd*/
//define([/*'text!jconfig/jazzhuburl'*/], function(jazzhuburl) {
(function() {
	jazzhuburl = window.location;
	
	var _navbarScript = new URL("/api/v1/composition/js/header/navbar.js", jazzhuburl);
	var _navbarStylesheet = new URL("/api/v1/composition/css/header/navbar.css", jazzhuburl);

	function _loadStylesheet(stylesheetURL, id) {
		var link = document.createElement("link");
		link.setAttribute("rel", "stylesheet");
		link.setAttribute("type", "text/css");
		link.setAttribute("href", stylesheetURL.href);
		if (id) {
			link.setAttribute("id", id);
		}
		document.getElementsByTagName("head")[0].appendChild(link);
	}

	function _loadScript(scriptURL, id) {
		var script = document.createElement("script");
		if (id) {
			script.id = id;
		}
		script.type = "text/javascript";
		script.src = scriptURL.href;
		document.getElementsByTagName('head')[0].appendChild(script);
	}
	
	var addBanner = !document.getElementById("navbar.js");
	if (addBanner) {
		_loadStylesheet(_navbarStylesheet, "navbar.css");
		_loadScript(_navbarScript, "navbar.js");
	}
//});
})();
