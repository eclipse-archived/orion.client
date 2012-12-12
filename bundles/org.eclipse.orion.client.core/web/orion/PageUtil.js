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
/*global define console window document*/

define(function(){
	function matchResourceParameters(optURIText) {
		optURIText = optURIText || window.location.toString();
		var result = {resource:""};
		var hashIndex = optURIText.indexOf("#"); //$NON-NLS-0$
		if (hashIndex !== -1) {
			var text = optURIText.substring(hashIndex + 1);
			if (text.length !== 0) {
				var params = text.split(","); //$NON-NLS-0$
				result.resource = decodeURIComponent(params[0]);
				for (var i = 1; i < params.length; i++) {
					//We can not use params[i].split("=") here because a param's value may contain "=", which is not encoded.
					var equalIndex = params[i].indexOf("="); //$NON-NLS-0$
					var name, value;
					if(equalIndex !== -1){
						name = decodeURIComponent(params[i].substring(0, equalIndex));
						value = decodeURIComponent(params[i].substring(equalIndex + 1));
					} else {//If there is no "=" defined, we assume that the param only has a name but value is null.
						name = decodeURIComponent(params[i]);
						value = null;
					}
					if (value !== null && name !== "resource") { //$NON-NLS-0$
						result[name] = value;
					}
				}
			}			
		}
		return result;
	}
	
	var httpOrHttps = new RegExp("^http[s]?","i");

	function validateURLScheme(url, optAllowedSchemes) {
		var absoluteURL = url;
		if (url.indexOf("://") === -1) { //$NON-NLS-0$
			var temp = document.createElement('a'); //$NON-NLS-0$
			temp.href = url;
	        absoluteURL = temp.href;
		}
		var match = false;
		if (optAllowedSchemes) {
			match = optAllowedSchemes.some(function(scheme){
				return new RegExp("^" + scheme + ":", "i").test(absoluteURL);
			});
		} else {
			match = httpOrHttps.test(absoluteURL);
		}
		if (match) {
			return url;
		} else {
			console.log("Illegal URL Scheme: '" + url + "'");
			return "";
		}
	}
	return {
		matchResourceParameters: matchResourceParameters,
		validateURLScheme: validateURLScheme	
	};
});