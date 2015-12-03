/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation, Inc. and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env amd, mocha, browser*/
/* eslint-disable missing-nls */
define([
'chai/chai',
'js-tests/javascript/testingWorker',
'mocha/mocha' //must stay at the end, not a module
], function(chai, TestWorker) {
	var assert = chai.assert;

	var testworker;
	var defaultPlugins = [
		"node", 
		"requirejs", 
		"doc_comment", 
		"jsdoc", 
		"html", 
		"open_impl",
		"amqp",
		"angular",
		"express",
		"mongodb",
		"mysql",
		"postgres",
		"redis",
		"plugins",
		"refs",
		"eslint"
	];
	
	var defaultDefs = [
		"ecma5", 
		"ecma6", 
		"browser",
		"chai"
	];
	
	function checkServerState(expectedPlugins, expectedDefs, callback) {
		testworker.postMessage({request: "installed_plugins"}, function(plugins) {
			assert(plugins.plugins, "Tern returned no installed plugins");
			expectedPlugins.forEach(function(plugin) {
				assert(plugins.plugins[plugin], "The expected plugin '"+plugin+"' was not loaded"); 
			});
			callback();
		});
	}

	describe('.tern-project Tests', function() {
		this.timeout(20000);
		before('Start the testing worker', function(callback) {
			testworker = TestWorker.instance({callback: callback});
		});
		after("Shut down the testing worker", function() {
			testworker.terminate();
		});
		
		it("non-existent contents", function(callback) {
			testworker.postMessage({request: "start_server", args:{}}, /* @callback */ function(response) {
				assert(response, "We should have gotten a response");
				assert.equal("server_ready", response.state, "The server was not ready");
				checkServerState(defaultPlugins, defaultDefs, callback);
			});
		});
		it("undefined contents", function(callback) {
			testworker.postMessage({request: "start_server", args:{options: undefined}}, /* @callback */ function(response) {
				assert(response, "We should have gotten a response");
				assert.equal("server_ready", response.state, "The server was not ready");
				checkServerState(defaultPlugins, defaultDefs, callback);
			});
		});
		it("null contents", function(callback) {
			testworker.postMessage({request: "start_server", args:{options: null}}, /* @callback */ function(response) {
				assert(response, "We should have gotten a response");
				assert.equal("server_ready", response.state, "The server was not ready");
				checkServerState(defaultPlugins, defaultDefs, callback);
			});
		});
		it("empty plugins contents", function(callback) {
			testworker.postMessage({request: "start_server", args:{options: {plugins: {}}}}, /* @callback */ function(response) {
				assert(response, "We should have gotten a response");
				assert.equal("server_ready", response.state, "The server was not ready");
				checkServerState([], defaultDefs, callback);
			});
		});
		it("empty defs contents", function(callback) {
			testworker.postMessage({request: "start_server", args:{options: {defs: []}}}, /* @callback */ function(response) {
				assert(response, "We should have gotten a response");
				assert.equal("server_ready", response.state, "The server was not ready");
				checkServerState(defaultPlugins, [], callback);
			});
		});
		it("empty defs and plugins contents", function(callback) {
			testworker.postMessage({request: "start_server", args:{options: {defs: [], plugins: {}}}}, /* @callback */ function(response) {
				assert(response, "We should have gotten a response");
				assert.equal("server_ready", response.state, "The server was not ready");
				checkServerState([], [], callback);
			});
		});
		it("unknown def", function(callback) {
			testworker.postMessage({request: "start_server", args:{options: {defs: ["foo"]}}}, /* @callback */ function(response) {
				assert(response, "We should have gotten a response");
				assert.equal("server_ready", response.state, "The server was not ready");
				checkServerState(defaultPlugins, [], callback);
			});
		});
		it("unknown def with known", function(callback) {
			testworker.postMessage({request: "start_server", args:{options: {defs: ["foo", "ecma5"]}}}, /* @callback */ function(response) {
				assert(response, "We should have gotten a response");
				assert.equal("server_ready", response.state, "The server was not ready");
				checkServerState(defaultPlugins, ["ecma5"], callback);
			});
		});
		it("known defs", function(callback) {
			testworker.postMessage({request: "start_server", args:{options: {defs: ["ecma5", "browser"]}}}, /* @callback */ function(response) {
				assert(response, "We should have gotten a response");
				assert.equal("server_ready", response.state, "The server was not ready");
				checkServerState([], ["ecma5", "browser"], callback);
			});
		});
	});
});
