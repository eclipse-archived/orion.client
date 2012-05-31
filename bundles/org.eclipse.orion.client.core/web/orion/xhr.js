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
/*global console define XMLHttpRequest*/

/**
 * @name orion.xhr
 * @namespace Provides a promise-based API to {@link XMLHttpRequest}.
 */
define(['orion/Deferred'], function(Deferred) {
	/**
	 * @name orion.xhr.Result
	 * @class Wraps an XHR response.
	 * @property {Object} args Arguments passed to the {@link orion.xhr.xhr} call.
	 * @property {Object|ArrayBuffer|Blob|Document|String} response The <code>response</code> object returned by the XMLHttpRequest.
	 * It is typed according to the <code>responseType</code> passed to the XHR call (by default it is a {@link String}).
	 * @property {String} [responseText] The <code>response</code> returned by the XMLHttpRequest, if it is a {@link String}.
	 * If the <code>response</code> is not a String, this property is <code>null</code>.
	 * @property {Number} status The HTTP status code returned by the XMLHttpRequest.
	 * @property {String} url The URL that the XHR request was made to.
	 * @property {XMLHttpRequest} xhr The underlying XMLHttpRequest object.
	 */

	function encode(value) {
		return encodeURIComponent(value).replace(/[!'()*]/g, function(str) {
			return '%' + str.charCodeAt(0).toString(16).toUpperCase(); //$NON-NLS-0$
		});
	}

	/**
	 * Wrapper for {@link XMLHttpRequest} that returns a promise.
	 * @name xhr
	 * @methodOf orion.xhr
	 * @param {String} method One of 'GET', 'POST', 'PUT', 'DELETE'.
	 * @param {String} url The URL to request.
	 * @param {Object} [options]
	 * @param {Object|ArrayBuffer|Blob|Document} [options.data] The raw data to send as the request body. (Only allowed for POST and PUT).
	 * @param {Object} [options.headers] A map of header names and values to set on the request.
	 * @param {Boolean} [options.log=false] If <code>true</code>, failed requests will be logged to the JavaScript console.
	 * @param {Object} [options.query] A map giving the query parameters to add to the URL.
	 * @param {String} [options.responseType=''] Determines the type of the response object returned. Value must be one of the following:
	 * <ul><li><code>'arraybuffer'</code>
	 * <li><code>'blob'</code>
	 * <li><code>'document'</code>
	 * <li><code>'json'</code>
	 * <li><code>'text'</code>
	 * <li><code>''</code> (same as <code>'text'</code>)</ul>
	 * @param {Number} [options.timeout=0] Timeout in milliseconds. Defaults to 0 (no timeout).
	 * @returns {Deferred} A deferred for the result. The deferred will resolve on 2xx, 3xx status codes or reject on 4xx, 5xx status codes.
	 * In both cases a {@link orion.xhr.Result} is provided to the listener.
	 */
	// TODO: upload progress, user/password
	function _xhr(method, url, options/*, XMLHttpRequestImpl */) {
		options = options || {};
		var xhr = (arguments.length > 3 && typeof arguments[3] === 'object') ? arguments[3] : new XMLHttpRequest(); //$NON-NLS-0$
		var d = new Deferred();
		var headers = options.headers || {};
		var log = options.log || false;
		var data;
		var i;
		if (typeof headers['X-Requested-With'] === 'undefined') { //$NON-NLS-1$ //$NON-NLS-0$
			headers['X-Requested-With'] = 'XMLHttpRequest'; //$NON-NLS-1$ //$NON-NLS-0$
		}
		if (typeof options.query === 'object' && method === 'GET') { //$NON-NLS-1$ //$NON-NLS-0$
			var queryObj = options.query, paramNames = Object.keys(queryObj);
			var queryBuf = [];
			for (i=0; i < paramNames.length; i++) {
				var param = paramNames[i], value = queryObj[param];
				queryBuf.push(encode(param) + '=' + encode(value)); //$NON-NLS-0$
			}
			if (queryBuf.length) {
				var urlComponents = url.split('#'); //$NON-NLS-0$
				urlComponents[0] += (urlComponents[0].indexOf('?') === -1 ? '?' : '&') + queryBuf.join('&'); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				url = urlComponents.join('#'); //$NON-NLS-0$
			}
		}
		if (typeof options.data !== 'undefined' && (method === 'POST' || method === 'PUT')) { //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			data = options.data;
		}
		if (typeof options.responseType === 'string') { //$NON-NLS-0$
			xhr.responseType = options.responseType;
		}
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4) {
				var code = xhr.status, response = xhr.response;
				var result = {
					args: options,
					response: response,
					responseText: typeof response === 'string' ? response : null, //$NON-NLS-0$
					status: code,
					url: url,
					xhr: xhr
				};
				if (200 <= code && code < 400) {
					d.resolve(result);
				} else {
					if (log && console) {
						console.log(new Error(code + ' ' + response.statusText)); //$NON-NLS-0$
					}
					d.reject(result);
				}
			}
		};
		try {
			xhr.open(method, url, true /* async */);
			if (typeof options.timeout === 'number') { //$NON-NLS-0$
				xhr.timeout = options.timeout;
				xhr.addEventListener('timeout', function(e) { //$NON-NLS-0$
					d.reject('Timeout exceeded: ' + e); //$NON-NLS-0$
				});
			}
			var headerNames = Object.keys(headers);
			for (i=0; i < headerNames.length; i++) {
				var headerName = headerNames[i], headerValue = headers[headerName];
				xhr.setRequestHeader(headerName, headerValue);
			}
			xhr.send(data);
		} catch (e) {
			d.reject(e);
		}
		return d;
	}
	return _xhr;
});