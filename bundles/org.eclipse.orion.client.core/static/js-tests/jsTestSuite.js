/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

/*global orion require*/

require({
	baseUrl: '',
	packages: [
		{
	      name: 'dojo',
	      location: '/org.dojotoolkit/dojo',
	      main: 'lib/main-browser',
	      lib: '.'
	    }
	],
	paths: {
		orion: '/js',
		text: '/requirejs/text',
		i18n: '/requirejs/i18n'
	}
});

/* Have one jstestdriver test that can wait for requirejs */
var BootstrapTest = AsyncTestCase("bootstrap");
BootstrapTest.prototype.testBootstrap = function(queue) {
	queue.call("Bootstrapping asyncTestWrapper ", function(callbacks) {
		var noop = callbacks.noop();
	
		require(['orion/asyncTestWrapper'], function(orion) {
			var loaderSuite = orion.JSTestAdapter.runTests("All Tests", [
				"http://localhost:8080/js-tests/commonjs-unittesting/test.html",
				"http://localhost:8080/js-tests/compare/test.html",
				"http://localhost:8080/js-tests/serviceRegistry/test.html",
				"http://localhost:8080/js-tests/preferences/test.html",
				"http://localhost:8080/js-tests/pluginRegistry/test.html",
				"http://localhost:8080/js-tests/testRunAsynch/test.html",
				"http://localhost:8080/js-tests/textMateStyler/test.html"
			]);
		
			var testCaseInfo = new jstestdriver.TestCaseInfo("Bootstrap", loaderSuite, jstestdriver.TestCaseInfo.ASYNC_TYPE);		
			jstestdriver.testRunner.testRunsConfiguration_.push(testCaseInfo.getDefaultTestRunConfiguration());
			
			noop();
		});
	});
};

