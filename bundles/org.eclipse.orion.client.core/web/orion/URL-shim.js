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
// URL Shim -- see http://http://url.spec.whatwg.org/ and http://dvcs.w3.org/hg/url/raw-file/tip/Overview.html

(function() {
	if (typeof window.URL === "function" && new window.URL("http://www.w3.org").protocol === "http:") {
		return;
	}
	
	var _USERNAME_PASSWORD_RE = /([^:]*):?(.*)/;

	function _createMapIterator(entries, kind) {
		var index = 0;
		return {
			next: function() {
				if (index < entries.length) {
					var entry = entries[index++];
					switch (kind) {
						case "keys":
							return entry[0];
						case "values":
							return entry[1];
						case "keys+values":
							return [entry[0], entry[1]];
						default:
							throw new TypeError();
					}
				}
				throw new Error("Stop Iteration");
			}
		};
	}

	function _checkString(txt) {
		if (typeof txt !== "string") {
			throw new TypeError();
		}
	}

	function _checkValue(value) {
		if (typeof value !== "string" && value !== null) {
			if (typeof value === "undefined") {
				value = null;
			} else {
				throw new TypeError();
			}
		}
		return value;
	}

	// See http://url.spec.whatwg.org/#interface-urlquery
	function URLQuery() {
		Object.defineProperty(this, "_entries", {
			value: [] // array of [key,value]
		});
		Object.defineProperty(this, "_dirty", {
			value: false,
			writable: true
		});
	}

	Object.defineProperties(URLQuery.prototype, {
		_parseSearch: {
			value: function(search) {
				this.clear();
				this._dirty = false;
				if (search) {
					_checkString(search);
					var pairs = search.slice(1).split("&");
					for (var i = 0; i < pairs.length; i++) {
						var pair = pairs[i];
						var parsed = /([^=]*)(=?)(.*)/.exec(pair);
						var name = decodeURIComponent(parsed[1] || "");
						var hasEquals = !!parsed[2];
						var value = hasEquals ? decodeURIComponent(parsed[3] || "") : null;
						this.append(name, value);
					}
				}
			}
		},
		_updateSearch: {
			value: function(anchor) {
				if (this._dirty) {
					this._dirty = false;
					if (this.size === 0) {
						anchor.search = "";
					} else {
						anchor.search = "?" + this._entries.map(function(entry) {
							var pair = encodeURIComponent(entry[0]);
							if (entry[1] !== null) {
								pair += "=" + encodeURIComponent(entry[1]);
							}
							return pair;
						}).join("&");
					}
				}
			}
		},
		get: {
			value: function(key) {
				_checkString(key);
				var result;
				this._entries.some(function(entry) {
					if (entry[0] === key) {
						result = entry[1];
						return true;
					}
				});
				return result;
			},
			enumerable: true
		},
		set: {
			value: function(key, value) {
				_checkString(key);
				value = _checkValue(value);
				var found = false;
				this._dirty = true;
				this._entries.some(function(entry) {
					if (entry[0] === key) {
						found = true;
						entry[1] = value;
						return true;
					}
				});
				if (!found) {
					this._entries.push([key, value]);
				}
			},
			enumerable: true
		},
		has: {
			value: function(key) {
				_checkString(key);
				var found = false;
				this._entries.some(function(entry) {
					if (entry[0] === key) {
						found = true;
						return true;
					}
				});
				return found;
			},
			enumerable: true
		},
		'delete': {
			value: function(key) {
				_checkString(key);
				var found = false;
				for (var i = this._entries.length - 1; i > -1; i--) {
					var entry = this._entries[i];
					if (entry[0] === key) {
						this._dirty = true;
						found = true;
						this._entries.splice(i, 1);
					}
				}
				return found;
			},
			enumerable: true
		},
		clear: {
			value: function() {
				if (this._entries.length !== 0) {
					this._entries.length = 0;
					this._dirty = true;
				}
			},
			enumerable: true
		},
		forEach: {
			value: function(callback, thisArg) {
				var thisMap = this;
				this._entries.forEach(function(entry) {
					callback.call(thisArg, entry[1], entry[0], thisMap);
				});
			},
			enumerable: true
		},
		keys: {
			value: function() {
				return _createMapIterator(this._entries, "keys");
			},
			enumerable: true
		},
		values: {
			value: function() {
				return _createMapIterator(this._entries, "values");
			},
			enumerable: true
		},
		items: {
			value: function() {
				return _createMapIterator(this._entries, "keys+values");
			}
		},
		size: {
			get: function() {
				return this._entries.length;
			},
			enumerable: true
		},
		getAll: {
			value: function(key) {
				_checkString(key);
				var result = [];
				this._entries.forEach(function(entry) {
					if (entry[0] === key) {
						result.push(entry[1]);
					}
				});
				return result;
			},
			enumerable: true
		},
		append: {
			value: function(key, value) {
				_checkString(key);
				value = _checkValue(value);
				this._entries.push([key, value]);
				this._dirty = true;
			},
			enumerable: true
		}
	});
	
	// See http://url.spec.whatwg.org/#api
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
			if (baseAnchor.protocol.length < 2 || !baseAnchor.host) {
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
		Object.defineProperty(this, "query", {
			value: new URLQuery(urlAnchor.search),
			enumerable: true
		});
	}

	Object.defineProperties(URL.prototype, {
		href: {
			get: function() {
				this.query._updateSearch(this._urlAnchor);
				return this._urlAnchor.href;
			},
			set: function(value) {
				_checkString(value);
				this._urlAnchor.href = value;
				this.query._parseSearch(this._urlAnchor.search);
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
				_checkString(value);
				this._urlAnchor.protocol = value;
			},
			enumerable: true
		},
		_userinfo: { // note: not part of spec so not enumerable
			get: function() {
				var re = new RegExp("^" + this._urlAnchor.protocol + "(\\/\\/)(?:([^@]*)?@)?" + this._urlAnchor.host);
				var result = re.exec(this._urlAnchor.href);
				var userinfo = result[2];
				return userinfo || "";
			},
			set: function(value) {
				_checkString(value);
				this.query._updateSearch(this._urlAnchor);
				var re = new RegExp("^" + this._urlAnchor.protocol + "(\\/\\/)(?:([^@]*)?@)?" + this._urlAnchor.host);
				var replacement = this._urlAnchor.protocol + "//" + (value ? value + "@" : "") + this._urlAnchor.host;
				this._urlAnchor.href = this._urlAnchor.href.replace(re, replacement);
			}
		},
		username: {
			get: function() {
				var parsed = _USERNAME_PASSWORD_RE.exec(this._userinfo);
				var username = decodeURIComponent(parsed[1] || "");
				return username;
			},
			set: function(value) {
				_checkString(value);
				var parsed = _USERNAME_PASSWORD_RE.exec(this._userinfo);
				var userpass = [encodeURIComponent(value || "")];
				if (parsed[2] !== null) {
					userpass.push(parsed[2]);
				}
				this._userinfo = userpass.join(":");
			},
			enumerable: true
		},
		password: {
			get: function() {
				var parsed = _USERNAME_PASSWORD_RE.exec(this._userinfo);
				var password = decodeURIComponent(parsed[2] || "");
				return password;
			},
			set: function(value) {
				_checkString(value);
				var parsed = _USERNAME_PASSWORD_RE.exec(this._userinfo);
				var userpass = [parsed[1] || ""];
				if (value) {
					userpass.push(encodeURIComponent(value));
				}
				this._userinfo = userpass.join(":");
			},
			enumerable: true
		},
		host: {
			get: function() {
				return this._urlAnchor.host;
			},
			set: function(value) {
				_checkString(value);
				this._urlAnchor.host = value;
			},
			enumerable: true
		},
		hostname: {
			get: function() {
				return this._urlAnchor.hostname;
			},
			set: function(value) {
				_checkString(value);
				this._urlAnchor.hostname = value;
			},
			enumerable: true
		},
		port: {
			get: function() {
				return this._urlAnchor.port;
			},
			set: function(value) {
				_checkString(value);
				this._urlAnchor.port = value;
			},
			enumerable: true
		},
		pathname: {
			get: function() {
				return this._urlAnchor.pathname;
			},
			set: function(value) {
				_checkString(value);
				this._urlAnchor.pathname = value;
			},
			enumerable: true
		},
		search: {
			get: function() {
				this.query._updateSearch(this._urlAnchor);
				return this._urlAnchor.search;
			},
			set: function(value) {
				_checkString(value);
				this._urlAnchor.search = value;
				this.query._parseSearch(this._urlAnchor.search);
			},
			enumerable: true
		},
		hash: {
			get: function() {
				return this._urlAnchor.hash;
			},
			set: function(value) {
				_checkString(value);
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
}());