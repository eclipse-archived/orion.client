/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
 
/*global jstestdriver AsyncTestCase fail*/
/*global eclipse console dojo define*/



define( ['dojo', 'orion/serviceregistry', 'orion/pluginregistry', 'dojo/DeferredList' ], function(dojo, mServiceregistry, mPluginregistry){
var orion = orion || {};

orion.JSTestAdapter = (function() {
	
	var testLoader = function(test) {
		/* This loader is a single test on the main suite, the loader test
		 * is finished once we have loaded the test plugin and retrieved the list of tests it contains.
		 * Once the all the suite's load tests are done, then the real tests are ready to go.
		 */

		var noop, errback;
		var deferred = new dojo.Deferred();
		var exports = {};
		var testSuite = {};
		
		/* This is the TestCase which will hold all the tests for the given test plugin */
		exports.testCase = function() {}; //AsyncTestCase(test);	
		
		function _launch(queue) {
			/* The entire test service is run in the queue for the first jstestdriver test
			   This is because in between jstestdriver tests, the html body is cleared and we lose the 
			   service registry.
			 */
			for (var property in testSuite) {
				if (property.match(/^test.+/)) {
					testSuite[property].testMethod(queue);
				}
			}
			
			/* After the tests, the registry must be cleaned up */
			var shutdown = new dojo.Deferred();
			queue.call("Shutdown " + test, function(callbacks) {
				shutdown.resolve(callbacks.noop());
			});
			
			var loaderServiceRegistry = new mServiceregistry.ServiceRegistry();
			var loaderPluginRegistry = new mPluginregistry.PluginRegistry(loaderServiceRegistry, {});
			loaderPluginRegistry.installPlugin(test).then(function() {
				var service = loaderServiceRegistry.getService("orion.test.runner");
				service.addEventListener("testDone", function(testName, testResult) {
					if (typeof testSuite[testName] !== "undefined") {
						testSuite[testName].testDone(testResult);
					}
				});
				service.addEventListener("runDone", function(runName, obj) {
					if (!runName) {
						shutdown.then(function(noop) {
							loaderPluginRegistry.shutdown();
							noop();
						});
					}
				});
					
				console.log("Launching test suite: " + test);
				service.run();
			});
		}
		
		var first = true;
		function _test(testName) {
			return function(queue) {
				if (first) {
					_launch(queue);
					first = false;
				}
	
				queue.call("Results: " + testName, function(callbacks) {
					/* At this point, all tests are finished, we are just reporting results */
					if (testSuite[testName].testResult.result !== true) {
						fail(testSuite[testName].testResult.message);
					}
				});
			};
		}
			
		/* Loading the test methods, #ready is called once we have the set of tests to run 
		   #error is called if there is a problem loading the test plugin */
		exports.loadMethod = function(queue) {
			queue.call("Load test " + test, function(callbacks) {
				noop = callbacks.noop();
				errback = callbacks.addErrback('Error');
				deferred.resolve();
			});
		};
		
		exports.ready = function(suite) {
			deferred.then(function() { 
				testSuite = suite;
							
				for(var testName in suite) {
					if(suite.hasOwnProperty(testName)) {
						exports.testCase.prototype[testName] = _test(testName);
					}
				}
				
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
		
		exports.testName = test;
		
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
			this.testResult = testResult;
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
		var testServiceRegistry = new mServiceregistry.ServiceRegistry();
		var testPluginRegistry = new mPluginregistry.PluginRegistry(testServiceRegistry, {});
		var deferred = new dojo.Deferred();
		
		/* Install the test plugin and get the list of tests it contains */
		testPluginRegistry.installPlugin(fileURI).then(
			function() {
				var service =  testServiceRegistry.getService("orion.test.runner");
				service.list().then( function(testNames) {
					var testName;
					var testSuite = {};
					
					/* for each test in the suite, hook up an jstestdriver async test */
					for (var i = 0; i < testNames.length; i++) {
						testName = testNames[i];
						testSuite[testName] = asyncTest(testName);
					} 
					console.log(fileURI + " : registered " + testNames.length + " tests" );
					
					/* jstestdriver will clear out the html body when the loader test is finished,
					 * we must shut down the plugin registry nicely, and then reload the test plugin later */
					testPluginRegistry.shutdown();
					
					loader.ready(testSuite);
					deferred.resolve(loader);
				});
			}, 
			function(e) {
				console.log(fileURI + " : error getting orion.test.runner service " + e);
				loader.error(e);
				deferred.resolve( { 
					testName: fileURI, 
					loadMethod: function() { 
						throw e; 
					} 
				});
				return e;
			}
		);
		
		return deferred.promise;
	}

	
	function runTests(suiteName, testURIs) {
		var ready = new dojo.Deferred();

		var loaders = [];
		for (var i = 0; i < testURIs.length; i++) {
			loaders.push(_loadTests(testURIs[i]));
		}
		
		new dojo.DeferredList(loaders, false, false, true).then(function(results) {
			var suite = new AsyncTestCase(suiteName);
			for(var i = 0; i < results.length; i++) {
				var test = results[i][1];		
				if (typeof test.testName !== "undefined") {
					suite.prototype["testLoader " + test.testName] = test.loadMethod;
				}
			}

			var testCaseInfo = new jstestdriver.TestCaseInfo(suiteName, suite, jstestdriver.TestCaseInfo.ASYNC_TYPE);		
			jstestdriver.testRunner.testRunsConfiguration_.push(testCaseInfo.getDefaultTestRunConfiguration());

			ready.resolve();
		});
		
		return ready.promise;
	}
	return { runTests: runTests };
}());

return orion;
});
