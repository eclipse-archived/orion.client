/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
 
/*global AsyncTestCase */
/*global console */

var orion = orion || {};

orion.JSTestAdapter = (function() {
	
	var testLoader = function(test) {
		/* This loader is a single test on the main suite, the loader test
		 * is finished once we have loaded the test plugin and retrieved the list of tests is contains.
		 * Once the all the suite's load tests are done, then the real tests are ready to go.
		 */

		var noop, errback;
		var deferred = new dojo.Deferred();
		var exports = {};
		var suiteRunning = false;
		
		/* This is the TestCase which will hold all the tests for the given test plugin */
		exports.testCase = function() {}; //AsyncTestCase(test);	

		function setup(testSuite) {
			return function() {
				if (!suiteRunning) {
					/* js test driver has called the first test of this test suite, install
					 * the test plugin and start running tests.  As each test finishes, we mark the
					 * corresponding js test driver async test as finished.
					 */
					var loaderServiceRegistry = new eclipse.ServiceRegistry();
					var loaderPluginRegistry = new eclipse.PluginRegistry(loaderServiceRegistry, {});
					loaderPluginRegistry.installPlugin(test).then(
						function() {
							return loaderServiceRegistry.getService("testRunner");
						}
					).then(
						function(service) {
							service.addEventListener("testDone", function(testName, testResult) {
								if (typeof testSuite[testName] !== "undefined") {
									//remove each test from the suite as they finish
									var finishedTest = testSuite[testName];
									delete testSuite[testName];
									if (testSuite.remainingTests() === 0) {
										//when we finish the last test, shutdown the plugin registry before telling
										//jstestdriver that we are done.
										console.log("Shutting down registry for " + test);
										loaderPluginRegistry.shutdown();
									}

									finishedTest.testDone(testResult);
								}
							});
						
							console.log("Launching test suite: " + test);
							service.run();
						}
					);
					
					suiteRunning = true;
				}
			};
		}
		
		exports.loadMethod = function(queue) {
			queue.call("Load test " + test, function(callbacks) {
				noop = callbacks.noop();
				errback = callbacks.addErrback('Error');
				deferred.resolve();
			});
		};
		
		exports.ready = function(testSuite) {
			deferred.then(function() { 
				exports.testCase.prototype.setUp = setup(testSuite);
				var testCaseInfo = new jstestdriver.TestCaseInfo(test, exports.testCase, jstestdriver.TestCaseInfo.ASYNC_TYPE);		
				jstestdriver.testRunner.testRunsConfiguration_.push(testCaseInfo.getDefaultTestRunConfiguration());
				noop(); 
			});
		};
		exports.error = function(e) {
			deferred.then(function(msg) {
				errback(msg);
			}(e));
		};
		return exports;
	};
	
	var asyncTest = function(testName, test) {
		/* This is a single jstestdriver async test case, it is just a placeholder and 
		 * testDone() will be called when the real test is finished
		 */
		var exports = {};
		var noop, errback;
		var deferred = new dojo.Deferred();
		
		exports.testMethod = function (queue) {
			/* jstestdriver calls this method to run the test */
			queue.call("Run test " + testName, function(callbacks) {
				noop = callbacks.noop();
				errback = callbacks.addErrback('Error');
				deferred.resolve( { "noop" : noop , "errback" : errback } );
			});
		};
		
		exports.testDone = function(testResult) {
			/* the real test has completed, mark the jstestdriver test as complete */
			deferred.then( function(callbacks) {
				if (testResult.result) {
					callbacks.noop();
				} else {
					callbacks.errback(testResult.message);
				}
			});
		};
		
		return exports;
	};
	
	
	function _loadTests(fileURI) {	 
		var loader = testLoader(fileURI);
		var testServiceRegistry = new eclipse.ServiceRegistry();
		var testPluginRegistry = new eclipse.PluginRegistry(testServiceRegistry, {});
		
		/* Install the test plugin and get the list of tests it contains */
		testPluginRegistry.installPlugin(fileURI).then(
			function() {
				return testServiceRegistry.getService("testRunner");
			}, 
			function(e) {
				console.log(fileURI + " : error installing plugin : " + e);
				loader.error(e);
			}
		).then(
			function(service) {
				service.list().then( function(testNames) {
					var testName;
					var testSuite = { 
						remainingTests: function() {
							var count = 0;
							for (property in this) {
								if (property.match(/^test.+/)) {
									count++;
								}
							}
							return count;
						}
					};
					
					/* for each test in the suite, hook up an jstestdriver async test */
					for (var i = 0; i < testNames.length; i++) {
						testName = testNames[i];
						testSuite[testName] = asyncTest(testName);
						loader.testCase.prototype[testName] = testSuite[testName].testMethod;
					} 
					console.log(fileURI + " : registered " + testNames.length + " tests" );
					
					/* jstestdriver will clear out the html body when the loader test is finished,
					 * we must shut down the plugin registry nicely, and then reload the test plugin later */
					testPluginRegistry.shutdown();
					
					loader.ready(testSuite);
				});
			}, 
			function(e) {
				console.log(fileURI + " : error gettting testRunner service " + e);
				loader.error(e);
			}
		);
		
		return loader.loadMethod;
	}

	
	function runTests(suiteName, testURIs) {
		//This is a "loader" suite that is intended to block until the
		//tests have been loaded and are ready to run
		var suite = AsyncTestCase(suiteName);
		for (var i = 0; i < testURIs.length; i++) {
			suite.prototype["testLoader " + testURIs[i]] = _loadTests(testURIs[i]);
		}
	}
	return { runTests: runTests };
}());
