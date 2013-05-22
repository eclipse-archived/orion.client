/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 *******************************************************************************/
/*global window document define login logout localStorage orion */
/*jslint browser:true sub:true*/

function isSupportedBrowser() {
	var userAgent = navigator.userAgent;
	var isSupported = false;
	var browserData = {
		'Chrome': {
			regExp: /chrome\/(\d+)/i,
			minVersion: 24
		},
		'Firefox': {
			regExp: /firefox\/(\d+)/i,
			minVersion: 4
		},
		'MSIE': {
			regExp: /msie\s(\d+)/i,
			minVersion: 10
		},
		'Safari': {
			regExp: /version\/(\d+).*?safari/i,
			minVersion: 5
		}
	};

	for (var browser in browserData) {
		var matches = userAgent.match(browserData[browser].regExp);
		if (matches) {
			if (matches[1] >= browserData[browser].minVersion) {
				isSupported = true;
			}
		}
	}

	return isSupported;
}
