/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd*/
/*global requirejs*/
define(['require', 'orion/Deferred'], function(require, Deferred) {

	var messageBundleDeffereds = {};

	/**
	 * Performs string substitution. Can be invoked in 2 ways:
	 *
	 * i) vargs giving numbered substition values:
	 *   formatMessage("${0} is ${1}", "foo", "bar")  // "foo is bar"
	 *
	 * ii) a map giving the substitutions:
	 *   formatMessage("${thing} is ${1}", {1: "bar", thing: "foo"})  // "foo is bar"
	 */
	function formatMessage(msg) {
		var pattern = /\$\{([^\}]+)\}/g, args = arguments;
		if (args.length === 2 && args[1] && typeof args[1] === "object") {
			return msg.replace(pattern, function(str, key) {
				return args[1][key];
			});
		}
		return msg.replace(pattern, function(str, index) {
			return args[(index << 0) + 1];
		});
	}

	function bundleKey(name) {
		var userLocale = typeof navigator !== "undefined" ? (navigator.language || navigator.userLanguage) : null;
		if(userLocale) {
			return 'orion/messageBundle/' + userLocale.toLowerCase() + "/" + name;
		}
		return 'orion/messageBundle/' + name;
	}

	function getCachedMessageBundle(name) {
		var item = localStorage.getItem(bundleKey(name));
		if (item) {
			var bundle = JSON.parse(item);
			if (bundle._expires && bundle._expires > new Date().getTime()) {
				delete bundle._expires;
				return bundle;
			}
		}
		return null;
	}

	function setCachedMessageBundle(name, bundle) {
		bundle._expires = new Date().getTime() + 1000 * 900; //15 minutes
		localStorage.setItem(bundleKey(name), JSON.stringify(bundle));
		delete bundle._expires;
	}

	function getMessageBundle(name) {
		if (messageBundleDeffereds[name]) {
			return messageBundleDeffereds[name];
		}

		var d = new Deferred();
		messageBundleDeffereds[name] = d;

		var cached = getCachedMessageBundle(name);
		if (cached) {
				d.resolve(cached);
				return d;
		}

		// Wrapper for require() that normalizes away the IE quirk of never calling `errback`,
		// see https://bugs.eclipse.org/bugs/show_bug.cgi?id=428797
		function _require(deps, callback, errback) {
			require(deps, function(bundle) {
				if (typeof bundle === "undefined") { // IE
					errback(new Error(name));
				} else {
					callback.apply(null, Array.prototype.slice.call(arguments));
				}
			}, errback);
		}

		function _resolveMessageBundle(/*bundle*/) {
			require(['i18n!' + name], function(bundle) { //$NON-NLS-0$
				if (bundle) {
					setCachedMessageBundle(name, bundle);
				}
				d.resolve(bundle);
			});
		}

		function _rejectMessageBundle(error) {
			d.reject(error);
		}

		try {
			// First try to require `name` directly in case it's a bundle that ships with Orion
			_require([name], _resolveMessageBundle, function(/*error*/) {
				// Failed; fallback to orion/i18n to check the service registry for this bundle.
				// But first unload `name` from the loader, so orion/i18n can start fresh.
				requirejs.undef(name);
				_require(['orion/i18n!' + name], _resolveMessageBundle, _rejectMessageBundle); //$NON-NLS-0$
			});
		} catch (ignore) {
			// TODO require() never throws so this probably never runs
			_require(['orion/i18n!' + name], _resolveMessageBundle, _rejectMessageBundle); //$NON-NLS-0$
		}
		return d;
	}
	return {
		getMessageBundle: getMessageBundle,
		formatMessage: formatMessage
	};
});