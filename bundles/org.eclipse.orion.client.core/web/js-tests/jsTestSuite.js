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

/*global orion require jstestdriver AsyncTestCase*/

	require({
		  baseUrl: '..',
		  packages: [
		    {
		      name: 'dojo',
		      location: 'org.dojotoolkit/dojo',
		      main: 'lib/main-browser',
		      lib: '.'
		    },
		    {
		      name: 'dijit',
		      location: 'org.dojotoolkit/dijit',
		      main: 'lib/main',
		      lib: '.'
		    },
		    {
		      name: 'dojox',
		      location: 'org.dojotoolkit/dojox',
		      main: 'lib/main',
		      lib: '.'
		    }		    
		  ],
		  paths: {
			  text: 'requirejs/text',
			  i18n: 'requirejs/i18n',	    
		  }
		});

/* Have one jstestdriver test that can wait for requirejs */
var BootstrapTest = AsyncTestCase("bootstrap");
BootstrapTest.prototype.testBootstrap = function(queue) {
	queue.call("Bootstrapping asyncTestWrapper ", function(callbacks) {
		var noop = callbacks.noop();
		var errback = callbacks.addErrback("Failed bootstrapping tests.");
		require(['orion/asyncTestWrapper'], function(orion) {
			orion.JSTestAdapter.runTests("All Tests", [
				"/js-tests/commonjs-unittesting/test.html",
				"/js-tests/compare/test.html",
				"/js-tests/serviceRegistry/test.html",
				"/js-tests/preferences/test.html",
				"/js-tests/pluginRegistry/test.html",
				"/js-tests/testRunAsynch/test.html",
				"/js-tests/editor/test-editor.html"
			]).then(noop, errback);
		});
	});
};

