/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 *******************************************************************************/
/*global window document define login logout localStorage orion alert*/
/*jslint browser:true sub:true*/

define(function() {
	function isSupportedBrowser() {
		var userAgent = navigator.userAgent;
		var isSupported = false;
		var VERSION = 1;
		var browserData = [	{name: 'Chrome/Chromium', regExp: /(?:chrome|crios|chromium)\/(\d+)/i, minVersion: 24},
							{name: 'Firefox', regExp: /firefox\/(\d+)/i, minVersion: 17},
							{name: 'MSIE', regExp: /msie\s(\d+)/i, minVersion: 10},
							{name: 'Safari', regExp: /version\/(\d+).*?safari/i, minVersion: 5} ];

		for (var i = 0; i < browserData.length; i++) {
			var browser = browserData[i];
			var matches = userAgent.match(browser.regExp);
			if (matches && matches[VERSION] >= browser.minVersion) {
				isSupported = true;
				break;
			}
		}		
	
		return isSupported;
	}

	if (!isSupportedBrowser()) {
		alert("Sorry, your browser is not supported.\n\nTo use Orion, the latest version of the Chrome, Firefox, or Safari web browser is recommended.\n");
		throw 'unsupported browser';
	}
	
	return {
		isSupportedBrowser: isSupportedBrowser
	};
});