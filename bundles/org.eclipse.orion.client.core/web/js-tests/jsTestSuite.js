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
/*global console TestCase require jstestdriver*/
var requireJSConfig = {
	baseUrl: '/',
	packages: [{
		name: 'dojo',
		location: 'org.dojotoolkit/dojo',
		main: 'lib/main-browser',
		lib: '.'
	}, {
		name: 'dijit',
		location: 'org.dojotoolkit/dijit',
		main: 'lib/main',
		lib: '.'
	}, {
		name: 'dojox',
		location: 'org.dojotoolkit/dojox',
		main: 'lib/main',
		lib: '.'
	}],
	paths: {
		text: 'requirejs/text',
		i18n: 'requirejs/i18n'
	}
};
require(requireJSConfig);

var ORION_TYPE = 'orion test case';
var ORION_UI_TYPE = 'orion ui test case';
function OrionTestCase(uri) {
	return TestCase(uri, null, ORION_TYPE);
}
function OrionUITestCase(uri) {
	return TestCase(uri, null, ORION_UI_TYPE);
}

jstestdriver.pluginRegistrar.register({
	name: 'orion',
	getTestRunsConfigurationFor: function (testCaseInfos, expressions, testRunsConfiguration) {
		for (var i = 0; i < testCaseInfos.length; i++) {
		var type = testCaseInfos[i].getType();
			if (type === ORION_TYPE || type === ORION_UI_TYPE) {
				testRunsConfiguration.push(new jstestdriver.TestRunConfiguration(testCaseInfos[i], []));
			}
		}
		return false;
	},
	runTestConfiguration: function (config, onTestDone, onComplete) {
		var type = config.getTestCaseInfo().getType();
		if (type !== ORION_TYPE && type !== ORION_UI_TYPE) {
			return false;
		}

		var testURI = config.getTestCaseInfo().getTestCaseName();

		require(['dojo', 'orion/serviceregistry', 'orion/pluginregistry', 'dojo/DeferredList'], function (dojo, mServiceregistry, mPluginregistry) {
			var loaderServiceRegistry = new mServiceregistry.ServiceRegistry();
			var loaderPluginRegistry = new mPluginregistry.PluginRegistry(loaderServiceRegistry, {}, type === ORION_UI_TYPE);
			loaderPluginRegistry.installPlugin(testURI).then(function () {
				var references = loaderServiceRegistry.getServiceReferences("orion.test.runner");
				var testRunDeferreds = [];

				for (var i = 0; i < references.length; i++) {
					var service = loaderServiceRegistry.getService(references[i]);
					service.addEventListener("testDone", function (testName, testResult) {
						onTestDone(new jstestdriver.TestResult(testURI, testName, testResult.result ? "passed" : "failed", testResult.message || "", "", testResult.elapsed));
					});
					testRunDeferreds.push(service.run());
				}
				var dl = new dojo.DeferredList(testRunDeferreds, false, false, true);
				dl.then(function () {
					loaderPluginRegistry.shutdown();
					onComplete();
				});
			}, function () {
				onTestDone(new jstestdriver.TestResult(testURI, "", "error", "failed to load test", "", 0));
				loaderPluginRegistry.shutdown();
				onComplete();
			});
		});
		return true;
	}
});

// list your test cases here....
OrionTestCase("/js-tests/commonjs-unittesting/test.html");
OrionTestCase("/js-tests/compare/test.html");
OrionTestCase("/js-tests/serviceRegistry/test.html");
OrionTestCase("/js-tests/preferences/test.html");
OrionTestCase("/js-tests/pluginRegistry/test.html");
OrionTestCase("/js-tests/testRunAsynch/test.html");
OrionTestCase("/js-tests/editor/test.html");
OrionTestCase("/js-tests/textview/test.html");
OrionTestCase("/js-tests/jsContentAssist/test.html");
OrionTestCase("/js-tests/contentTypes/test.html");
//OrionTestCase("/js-tests/searchRendering/test.html");
//OrionUITestCase("/js-tests/textview/test-performance.html");



