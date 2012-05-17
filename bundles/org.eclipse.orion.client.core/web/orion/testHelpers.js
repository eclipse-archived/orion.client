/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define setTimeout*/
define(['orion/Deferred'], function(Deferred) {
	var DEFAULT_TIMEOUT = 3000;
	/**
	 * @name orion.test.makeTimeoutable
	 * Wraps a function into a timeout-able function. This is convenient for constructing a testcase function that fails
	 * if an an expected promise never calls back.
	 * @param {Function} func The test body function to be executed (must return a promise).
	 * @param {Number} [optTimeout=3000] How long to wait for a response before rejecting.
	 * @returns {Function} A testcase function. When executed, it returns a promise that rejects if <code>func()</code>'s
	 * promise does not call back within the specified amount of time.
	 */
	function getTimeoutable(func, optTimeout) {
		var timeout = typeof optTimeout === 'number' ? optTimeout : DEFAULT_TIMEOUT;
		return function() {
			var wrapper = new Deferred();
			var inner;
			var innerPromiseFired = false;
			try {
				inner = func();
				setTimeout(function() {
					if (!innerPromiseFired) {
						wrapper.reject('Timed out');
					}
				}, timeout);
				inner.then(
					function(result) {
						innerPromiseFired = true;
						wrapper.resolve(result);
					}, function(err) {
						innerPromiseFired = true;
						wrapper.reject(err);
					});
			} catch (e) {
				wrapper.reject(e);
			}
		};
	}
	return {
		getTimeoutable: getTimeoutable
	};
});