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
	path = require("path"),
	middleware = require("../index.js"),
	testData = require('./support/test_data'),
	testHelper = require('./support/testHelper');


var WORKSPACE = testHelper.WORKSPACE;
var MEATADATA =  testHelper.MEATADATA;

var request = testData.setupOrionServer();

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