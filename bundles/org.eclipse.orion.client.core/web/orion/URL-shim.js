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
/*global document window*/
// URL Shim -- see http://dvcs.w3.org/hg/url/raw-file/tip/Overview.html

(function() {
	if (typeof window.URL === "function" && new window.URL("http://www.w3.org").protocol === "http:") {
		return;
	}

	function URL(url, base) {
		url = url || "";
		if (typeof url !== "string") {
			throw new TypeError("url");
		}

		base = base ? base.href || base : "";
		if (typeof base !== "string") {
			throw new TypeError("base");
		}

		var doc = document.implementation.createHTMLDocument("");
		if (base) {
			var baseAnchor = doc.createElement("a");
			baseAnchor.href = base;
			if (baseAnchor.protocol.length < 2) {
				throw new Error("InvalidStateError");
			}
			var baseElement = doc.createElement("base");
			baseElement.href = baseAnchor.href;
			doc.head.appendChild(baseElement);
		}

		var urlAnchor = doc.createElement("a");
		urlAnchor.href = url;
		doc.body.appendChild(urlAnchor);
		Object.defineProperty(this, "_urlAnchor", {
			value: urlAnchor
		});
	}

	Object.defineProperties(URL.prototype, {
		toString: {
			value: function() {
				return this._urlAnchor.href;
			},
			enumerable: false
		},
		href: {
			get: function() {
				return this._urlAnchor.href;
			},
			set: function(value) {
				this._urlAnchor.href = value;
			},
			enumerable: true
		},
		origin: {
			get: function() {
				if (this._urlAnchor.protocol.length > 1 && this._urlAnchor.host) {
					return this._urlAnchor.protocol + "//" + this._urlAnchor.host;
				}
				return "";
			},
			enumerable: true
		},
		protocol: {
			get: function() {
				return this._urlAnchor.protocol;
			},
			set: function(value) {
				this._urlAnchor.protocol = value;
			},
			enumerable: true
		},
		host: {
			get: function() {
				return this._urlAnchor.host;
			},
			set: function(value) {
				this._urlAnchor.host = value;
			},
			enumerable: true
		},
		hostname: {
			get: function() {
				return this._urlAnchor.hostname;
			},
			set: function(value) {
				this._urlAnchor.hostname = value;
			},
			enumerable: true
		},
		port: {
			get: function() {
				return this._urlAnchor.port;
			},
			set: function(value) {
				this._urlAnchor.port = value;
			},
			enumerable: true
		},
		pathname: {
			get: function() {
				return this._urlAnchor.pathname;
			},
			set: function(value) {
				this._urlAnchor.pathname = value;
			},
			enumerable: true
		},
		search: {
			get: function() {
				return this._urlAnchor.search;
			},
			set: function(value) {
				this._urlAnchor.search = value;
			},
			enumerable: true
		},
		hash: {
			get: function() {
				return this._urlAnchor.hash;
			},
			set: function(value) {
				this._urlAnchor.hash = value;
			},
			enumerable: true
		}
	});

	if (window.URL.createObjectURL) {
		Object.defineProperty(URL, "createObjectURL", {
			value: window.URL.createObjectURL.bind(window.URL),
			enumerable: false
		});

		Object.defineProperty(URL, "revokeObjectURL", {
			value: window.URL.revokeObjectURL.bind(window.URL),
			enumerable: false
		});
	}
	window.URL = URL;
	return URL;
}());