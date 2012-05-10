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
define(["orion/assert", "orion/test", "orion/Deferred", "orion/xhr"], function(assert, mTest, Deferred, xhr) {
	function resolve(result) {
		var d = new Deferred();
		d.resolve.apply(d, Array.prototype.slice.call(arguments));
		return d;
	}
	function reject(err) {
		var d = new Deferred();
		d.resolve.apply(d, Array.prototype.slice.call(arguments));
		return d;
	}

	var tests = {};

	/**
	 * Wraps a test body to ensure a test failure if the promise doesn't resolve. This is convenient for asserting 
	 * that some content assist API method gets called eventually.
	 * @param {Function} func The test body (must return a promise).
	 * @returns {Deferred}
	 */
	function withTimeout(func) {
		return function() {
			var wrapper = new Deferred();
			var inner;
			var innerPromiseFired = false;
			try {
				inner = func();
				setTimeout(function() {
					if (!innerPromiseFired) {
						var testName = '';
						for (testName in tests) {
							if (tests.hasOwnProperty(testName)) {
								if (tests[testName] === func) {
									break;
								}
							}
						}
						wrapper.reject('Timed out: ' + testName);
					}
				}, 3000);
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
			return wrapper;
		};
	}

	tests['test GET resolve'] = withTimeout(function() {
		return xhr('GET', '/').then(resolve, reject);
	});

	tests['test GET reject'] = withTimeout(function() {
		return xhr('GET', '/bogus/url/that/doesnt/exist').then(reject, resolve);
	});

	tests['test GET query params'] = withTimeout(function() {
		return xhr('GET', '/', {
			query: {
				'foo': 3,
				'bar': 'baz'
			}
		}).then(function(result) {
			assert.strictEqual(result.url, '/?foo=3&bar=baz');
		}, reject);
	});

	tests['test GET query params encoding'] = withTimeout(function() {
		return xhr('GET', '/', {
			query: {
				'foo!bar': 31337,
				'baz': 'fizz buzz'
			}
		}).then(function(result) {
			assert.strictEqual(result.url, '/?foo%21bar=31337&baz=fizz%20buzz');
		}, reject);
	});

	tests['test GET query params with fragment'] = withTimeout(function() {
		return xhr('GET', '/#some?junk&we?dont&care?about', {
			query: {
				'foo*bar': 'baz',
				'quux': 'a b'
			}
		}).then(function(result) {
			assert.strictEqual(result.url, '/?foo%2Abar=baz&quux=a%20b#some?junk&we?dont&care?about');
		}, reject);
	});

	tests['test GET query params with existing params and fragment'] = withTimeout(function() {
		return xhr('GET', '/?a%20=b#some?junk&we?dont&care?about', {
			query: {
				'foo*bar': 'baz'
			}
		}).then(function(result) {
			assert.strictEqual(result.url, '/?a%20=b&foo%2Abar=baz#some?junk&we?dont&care?about');
		}, reject);
	});

return tests;
});