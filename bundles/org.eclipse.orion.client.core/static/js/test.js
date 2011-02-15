/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
var orion = orion || {};
orion.Test = (function(assert) {
	var exports = {};
	var AssertionError = assert.AssertionError;

	function _run(obj) {
		var failures = 0;

		for ( var property in obj) {
			if (property.match(/^test.+/)) {
				var test = obj[property];
				if (typeof test === "function") {
					try {
						test();
						if (orion.Test.DEBUG) {
							console.debug(property + " PASSED");
						}
					} catch (e) {
						failures++;
						if (e instanceof AssertionError) {
							console.log(property + " FAILED - " + e.toString());
						} else {
							console.error(property + " FAILED - " + e);
						}
					}
				} else if (typeof test === "object") {
					failures += _run(test);
				}
			}
		}
		return failures;
	}

	exports.run = function(obj) {
		if (!obj || typeof obj !== "object")
			throw Error("not a test object");

		return _run(obj);
	};

	function _runAsynch(obj) {
		var failures = 0;
		var deferredCount = 1;
		var result = new dojo.Deferred();

		for ( var property in obj) {
			if (property.match(/^test.+/)) {
				var test = obj[property];
				if (typeof test === "function") {
					try {
						var testResult = test();
						if (testResult && typeof testResult.then === "function") {
							deferredCount++;
							testResult.then(function(property) {
								return function () {
									if (orion.Test.DEBUG) {
										console.debug(property + " PASSED");
									}
								};
							}(property), function(property) {
								return function(e) {
									failures++;
									e.log = false;
									if (e instanceof AssertionError) {
										console.log(property + " FAILED - " + e.toString());
									} else {
										console.error(property + " FAILED - " + e);
									}
									return true;
								};
							}(property)).then(function() {
								deferredCount--;
								if (deferredCount===0) {
									result.resolve(failures);
								}
							});
						} else {
							if (orion.Test.DEBUG) {
								console.debug(property + " PASSED");
							}
						}
					} catch (e) {
						failures++;
						if (e instanceof AssertionError) {
							console.log(property + " FAILED - " + e.toString());
						} else {
							console.error(property + " FAILED - " + e);
						}
					}
				} else if (typeof test === "object") {
					failures += _run(test);
				}
			}
		}
		deferredCount--;
		if (deferredCount===0) {
			result.resolve(failures);
		}
		return result;
	}

	exports.runAsynch = function(obj) {
		if (!obj || typeof obj !== "object")
			throw Error("not a test object");

		return _runAsynch(obj).promise;
	};

	return exports;
}(orion.Assert));