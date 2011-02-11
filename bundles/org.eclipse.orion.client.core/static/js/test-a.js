/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global dojo */

var orion = orion || {};
orion.Test = (function() {

	function TestResult(status, elapsed, result) {
		this.getStatus = function() {
			return status;
		};
		this.getElapsedTime = function() {
			return elapsed;
		};
		this.getResult = function() {
			return result;
		};
	}

	function _runTest(test) {
		var runResult = new dojo.Deferred();
		var startTime = new Date().getTime();

		function _resolve(pass) {
			return function(result) {
				runResult.callback(new TestResult(pass, new Date().getTime() - startTime, result));
			};
		}

		var testResult = 0;
		try {
			testResult = test();
		} catch (e) {
			var status = (e instanceof orion.Assert.AssertionError) ? "fail" : "error";
			runResult.callback(new TestResult(status, new Date().getTime() - startTime, e));
		}

		dojo.when(testResult, _resolve("pass"), _resolve("fail"));
		return runResult.promise();
	}

	function run(test) {
		var deferred = new dojo.Deferred();
		var testCount = 0;
		var finished = 0;
		var failureCount = 0;

		function _count(testName) {
			return function(testResult) {
				finished++;
				if (testResult instanceof TestResult) {
					//result of running an individual test
					if (testResult.getStatus() !== "pass") {
						failureCount++;
					}
				} else {
					//result of running a sub-suite
					failureCount += testResult;
				}
				if (finished === testCount) {
					deferred.callback(failureCount);
				}
			};
		}

		for (var key in test) {
			if (key.match(/^test/) && key !== "test") {
				if (typeof(test[key]) === "function") {
					testCount++;
					_runTest(test[key]).then(_count(key));
				} else if (typeof(test[key]) === "object") {
					testCount++;
					run(test[key]).then(_count(key));
				}
			}
		}

		return deferred.promise();
	}

	return {
		run: run
	};
}());