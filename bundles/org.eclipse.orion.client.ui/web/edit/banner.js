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
define(['i18n!orion/nls/messages', 'orion/webui/littlelib', 'text!orion/banner/banner.html'], function(messages, lib, template) {
//(function() {
	if (!document.getElementById("banner")) {
		var _parent = document.body;
		var range = document.createRange();
		range.selectNode(_parent);
		var headerFragment = range.createContextualFragment(template);
		// do the i18n string substitutions
		lib.processTextNodes(headerFragment, messages);

		if (_parent.firstChild) {
			_parent.insertBefore(headerFragment, _parent.firstChild);
		} else {
			_parent.appendChild(headerFragment);
		}
	}
	var jazzhuburl = window.location;
	if (!document.getElementById("navbar.js") && !document.getElementById("navbar.css")) {
		var _navbarScript = new URL("/api/v1/composition/js/header/navbar.js", jazzhuburl);
		var _navbarStylesheet = new URL("/api/v1/composition/css/header/navbar.css", jazzhuburl);
		var link = document.createElement("link");
		link.id =  "navbar.css";
		link.setAttribute("rel", "stylesheet");
		link.setAttribute("type", "text/css");
		link.setAttribute("href", _navbarStylesheet.href);
		link.onload = function() {
			var script = document.createElement("script");
			script.id =  "navbar.js";
			script.type = "text/javascript";
			script.src = _navbarScript.href;
			document.getElementsByTagName('head')[0].appendChild(script);
		};
		document.getElementsByTagName("head")[0].appendChild(link);
	}
});
//})();
