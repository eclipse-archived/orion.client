/*******************************************************************************
 * Copyright (c) 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env mocha */
var assert = require("assert"),
	express = require("express"),
	supertest = require("supertest"),
	path = require("path"),
	testdata = require("./support/test_data"),
	middleware = require("../index.js");

var WORKSPACE = path.join(__dirname, ".test_workspace");
var MEATASTORE =  path.join(__dirname, '.test_metadata');

var orion = function(options) {
	// Ensure tests run in 'single user' mode
	var opts = options || {};
	opts.workspaceDir = WORKSPACE;
	opts.configParams = { "orion.single.user": true, "orion.single.user.metaLocation": MEATASTORE};
	return middleware(opts);
};

describe("Orion performance", function() {
	// before(function() {
	// 	testData.setUpWorkspace(WORKSPACE, MEATASTORE);
	// });
	// after("Remove Workspace and Metastore", function(done) {
	// 	 testData.tearDown(WORKSPACE, function(){
	// 		 testData.tearDown(MEATASTORE, done);
	// 	 });
	// });
	/**
	 * From: org.eclipse.orion.server.tests.performance.SimpleServerStressTest.java
	 */
	describe("Simple server stress test", function() {
		it("testCreateProject");
	});
	/**
	 * From: org.eclipse.orion.server.tests.performance.SimpleServerUserStressTest.java
	 */
	describe("Simple server user stress test", function() {
		it("testCreateUsers");
	});
});