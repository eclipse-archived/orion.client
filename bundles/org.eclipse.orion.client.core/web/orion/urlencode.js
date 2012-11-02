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
/*global define escape*/
define([], function() {
	function urlencode(value) {
		return encodeURIComponent(value).replace(/[!'()*]/g, function(str) {
			return '%' + str.charCodeAt(0).toString(16).toUpperCase(); //$NON-NLS-0$
		});
	}

	function x_www_form_urlencode(value) {
		return encodeURIComponent(value).replace(/[!'()*]/g, escape).replace('%20', '+'); //$NON-NLS-0$ //$NON-NLS-1$
	}

	function encodeObject(object, func) {
		object = object || {};
		var paramNames = Object.keys(object);
		var buf = [];
		for (var i=0; i < paramNames.length; i++) {
			var param = paramNames[i], value = object[param];
			buf.push(func(param) + '=' + func(value)); //$NON-NLS-0$
		}
		return buf.join('&'); //$NON-NLS-0$
	}

	return {
		/**
		 * Encodes an object of key-value pairs as a string suitable for the query component of a URI.
		 * @function
		 * @static
		 * @name orion.urlencode.encodeQuery
		 * @param {Object} data The parameters to encode.
		 * @returns {String} The URL-encoded string.
		 */
		encodeQuery: function(params) {
			return encodeObject(params, urlencode);
		},
		/**
		 * Encodes an object of form fields and values as a <code>application/x-www-form-urlencoded</code> string.
		 * @function
		 * @static
		 * @param {Object} data The form data to encode.
		 * @returns {String} The <code>x-www-form-urlencoded</code> string.
		 */
		encodeFormData: function(data) {
			return encodeObject(data, x_www_form_urlencode);
		},
		/**
		 * Returns a URL with the given queryString in its query component.
		 * @name orion.urlencode.appendQuery
		 * @param {String} url The URL.
		 * @param {String} queryString The query string to incorporate into <code>url</code>.
		 * @returns {String} The URL with <code>queryString</code> appended to its query component.
		 * @function
		 * @static
		 */
		appendQuery: function(url, queryString) {
			if (typeof queryString === 'string' && queryString) { //$NON-NLS-0$
				var urlComponents = url.split('#'); //$NON-NLS-0$
				urlComponents[0] += (urlComponents[0].indexOf('?') === -1 ? '?' : '&') + queryString; //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				url = urlComponents.join('#'); //$NON-NLS-0$
			}
			return url;
		}
	};
});