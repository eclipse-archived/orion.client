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
/*eslint-env amd*/
define([
], function() {
	
	/**
	 * @description Returns if the given character is upper case or not considering the locale
	 * @param {String} string A string of at least one char14acter
	 * @return {Boolean} True iff the first character of the given string is uppercase
	 */
	 function isUpperCase(string) {
		if (string.length < 1) {
		return false;
		}
		if (isNaN(string.charCodeAt(0))) {
			return false;
		}
		return string.toLocaleUpperCase().charAt(0) === string.charAt(0);
	}
	
	/**
	 * @description Match ignoring case and checking camel case.
	 * @param {String} prefix
	 * @param {String} target
	 * @returns {Boolean} If the two strings match
	 */
	function looselyMatches(prefix, target) {
		if (typeof prefix !== "string" || typeof target !== "string") {
			return false;
		}

		// Zero length string matches everything.
		if (prefix.length === 0) {
			return true;
		}

		// Exclude a bunch right away
		if (prefix.charAt(0).toLowerCase() !== target.charAt(0).toLowerCase()) {
			return false;
		}

		if (startsWith(target, prefix)) {
			return true;
		}

		var lowerCase = target.toLowerCase();
		if (startsWith(lowerCase, prefix)) {
			return true;
		}
		
		var _prefix = prefix.toLowerCase();
		
		// Test for camel characters in the prefix.
		if (prefix === _prefix) {
			return false;
		}
		//https://bugs.eclipse.org/bugs/show_bug.cgi?id=473777
		if(startsWith(lowerCase, _prefix)) {
			return true;
		}
		var prefixParts = toCamelCaseParts(prefix);
		var targetParts = toCamelCaseParts(target);

		if (prefixParts.length > targetParts.length) {
			return false;
		}

		for (var i = 0; i < prefixParts.length; ++i) {
			if (!startsWith(targetParts[i], prefixParts[i])) {
				return false;
			}
		}

		return true;
	}
	
	/**
	 * @description Returns if the string starts with the given prefix
	 * @param {String} s The string to check
	 * @param {String} pre The prefix 
	 * @returns {Boolean} True if the string starts with the prefix
	 */
	function startsWith(s, pre) {
		return s.slice(0, pre.length) === pre;
	}
	
	/**
	 * @description Convert an input string into parts delimited by upper case characters. Used for camel case matches.
	 * e.g. GroClaL = ['Gro','Cla','L'] to match say 'GroovyClassLoader'.
	 * e.g. mA = ['m','A']
	 * @function
	 * @public
	 * @param {String} str
	 * @return Array.<String>
	 */
	function toCamelCaseParts(str) {
		var parts = [];
		for (var i = str.length - 1; i >= 0; --i) {
			if (isUpperCase(str.charAt(i))) {
				parts.push(str.substring(i));
				str = str.substring(0, i);
			}
		}
		if (str.length !== 0) {
			parts.push(str);
		}
		return parts.reverse();
	}
	
	return {
		isUpperCase: isUpperCase,
		looselyMatches: looselyMatches,
		startsWith: startsWith,
		toCamelCaseParts: toCamelCaseParts
	};
});