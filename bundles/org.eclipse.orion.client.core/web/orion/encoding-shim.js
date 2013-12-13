/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global global self Uint8Array*/
// Encoding Shim -- see http://encoding.spec.whatwg.org/
(function(global) {
	function EncodingError() {
		Error.apply(this, arguments);
	}
	EncodingError.prototype = new Error();
	EncodingError.prototype.constructor = EncodingError;
	EncodingError.prototype.name = 'EncodingError';

	function between(value, min, max) {
		return value >= min && value <= max;
	}

	function verifybetween(value, min, max) {
		if (value >= min && value <= max) {
			return true;
		}
		throw new EncodingError();
	}

	function verify(valid, nothrow) {
		if (valid || nothrow) {
			return valid;
		}
		throw new EncodingError();
	}

	function TextDecoder(label, options) {
		var encoding = label || "utf-8";
		if (encoding !== "utf-8" && encoding !== "utf8" && encoding !== "unicode-1-1-utf-8") {
			throw new TypeError("only utf-8 supported");
		}
		Object.defineProperties(this, {
			encoding: {
				value: encoding,
				enumerable: true
			},
			_fatal: {
				value: options && options.fatal
			},
			_saved: {
				value: [],
				writable: true
			},
			_checkBOM: {
				value: true,
				writable: true
			}
		});
	}
	TextDecoder.prototype.decode = function(input, options) {
		input = (input instanceof Uint8Array) ? input : new Uint8Array(input);
		var first, second, third, fourth, point;
		var stream = options && options.stream;
		var saved = this._saved;
		var savedlen = saved.length;
		var inputlen = input.length;
		var charCodes = [];
		var offset = 0;
		var used = 0;

		if (this._checkBOM && inputlen) {
			if ((savedlen + inputlen) > 2) {
				for (var i = savedlen; i < 3; i++) {
					saved.push(input[offset++]);
				}
				if (saved[0] !== 0xEF || saved[1] !== 0xBB || saved[2] !== 0xBF) {
					offset = 0;
					saved.length = savedlen;
				} else {
					savedlen = saved.length -= 3;
				}
				this._checkBOM = false;
			} else if (stream) {
				while (offset < inputlen) {
					saved.push(input[offset++]);
				}
			}
		}
		while (offset < inputlen) {
			try {
				first = savedlen > 0 ? saved[0] : input[offset++];
				if (first < 0x80) {
					charCodes.push(first);
				} else if (between(first, 0xC2, 0xDF)) {
					if (verify(offset < inputlen, stream)) {
						second = savedlen > 1 ? saved[1] : input[offset++];
					} else break;
					verifybetween(second, 0x80, 0xBF);
					charCodes.push(((first & 0x1F) << 6) | (second & 0x3F));
				} else if (between(first, 0xE0, 0xEF)) {
					if (verify(offset < inputlen, stream)) {
						second = savedlen > 1 ? saved[1] : input[offset++];
					} else break;
					if (first === 0xE0) {
						verifybetween(second, 0xA0, 0xBF);
					} else if (first === 0xED) {
						verifybetween(second, 0x80, 0x9F);
					} else {
						verifybetween(second, 0x80, 0xBF);
					}
					if (verify(offset < inputlen, stream)) {
						third = savedlen > 2 ? saved[2] : input[offset++];
					} else break;
					verifybetween(third, 0x80, 0xBF);
					charCodes.push(((first & 0x0F) << 12) | ((second & 0x3F) << 6) | (third & 0x3F));
				} else if (between(first, 0xF0, 0xF4)) {
					if (verify(offset < inputlen, stream)) {
						second = savedlen > 1 ? saved[1] : input[offset++];
					} else break;
					if (first === 0xF0) {
						verifybetween(second, 0x90, 0xBF);
					} else if (first === 0xF4) {
						verifybetween(second, 0x80, 0x8F);
					} else {
						verifybetween(second, 0x80, 0xBF);
					}
					if (verify(offset < inputlen, stream)) {
						third = savedlen > 2 ? saved[2] : input[offset++];
					} else break;
					verifybetween(third, 0x80, 0xBF);
					if (verify(offset < inputlen, stream)) {
						fourth = input[offset++];
					} else break;
					verifybetween(fourth, 0x80, 0xBF);
					point = (((first & 0x07) << 18) | ((second & 0x3F) << 12) | ((third & 0x3F) << 6) | (fourth & 0x3F)) & 0xFFFF;
					charCodes.push((point >> 10) | 0xD800, (point & 0x3FF) | 0xDC00);
				} else {
					throw new EncodingError();
				}
			} catch (e) {
				if (this._fatal) {
					saved.length = savedlen = 0;
					used = offset;
					this._checkBOM = this._checkBOM || !stream;
					throw e;
				}
				charCodes.push(0xFFFD);
			}
			used = offset;
			if (savedlen) {
				saved.length = savedlen = 0;
			}
		}
		while (used !== offset) {
			saved.push(input[used++]);
		}

		this._checkBOM = this._checkBOM || !stream;
		var result = [];
		for (var begin = 0, len = charCodes.length; begin < len; begin += 0x10000) {
			result.push(String.fromCharCode.apply(null, charCodes.slice(begin, Math.min(len, begin + 0x10000))));
		}
		return result.join("");
	};

	function TextEncoder(utfLabel) {
		var encoding = utfLabel || "utf-8";
		if (encoding !== "utf-8" && encoding !== "utf8" && encoding !== "unicode-1-1-utf-8") {
			throw new TypeError("only utf-8 supported");
		}
		Object.defineProperties(this, {
			encoding: {
				value: encoding,
				enumerable: true
			},
			_saved: {
				value: null,
				writable: true
			}
		});
	}
	TextEncoder.prototype.encode = function(input, options) {
		input = input || "";
		var first, second, point;
		var stream = options && options.stream;
		var utf8 = [];
		var offset = 0;
		var inputlen = input.length;

		while (offset < inputlen) {
			if (this._saved === null) {
				first = input.charCodeAt(offset++);
			} else {
				first = this._saved;
				this._saved = null;
			}
			if (first < 0x80) {
				utf8.push(first);
			} else if (first < 0x800) {
				utf8.push(0xC0 | (first >> 6), 0x80 | (first & 0x3F));
			} else if (first < 0xD800 || first > 0xDBFF) {
				utf8.push(0xE0 | (first >> 12), 0x80 | ((first >> 6) & 0x3F), 0x80 | (first & 0x3F));
			} else {
				if (verify(offset < inputlen, stream)) {
					second = input.charCodeAt(offset++);
				} else {
					this._saved = first;
					break;
				}
				verifybetween(second, 0xDC00, 0xDFFF);
				point = 0x10000 | ((first & 0x03FF) << 10) + (second & 0x03FF);
				utf8.push(0xF0 | (point >> 18), 0x80 | ((point >> 12) & 0x3F), 0x80 | ((point >> 6) & 0x3F), 0x80 | (point & 0x3F));
			}
		}
		return new Uint8Array(utf8)
	};

	global.TextDecoder = global.TextDecoder || TextDecoder;
	global.TextEncoder = global.TextEncoder || TextEncoder;
}((typeof global === "undefined") ? this || self : global));