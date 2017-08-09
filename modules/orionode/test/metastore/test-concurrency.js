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
	testdata = require("../support/test_data"),
	middleware = require("../../index.js");

var WORKSPACE = path.join(__dirname, ".test_workspace");

var orion = function(options) {
	// Ensure tests run in 'single user' mode
	var opts = options || {};
	opts.workspaceDir = WORKSPACE;
	opts.configParams = { "orion.single.user": true };
	return middleware(opts);
};

describe("Orion metadata concurrency", function() {
	/**
	 * From: org.eclipse.orion.server.tests.metastore.SimpleMetaStoreWorkspaceProjectListConcurrencyTests.java
	 */
	describe("Simple metastore workspace project list concurrency tests", function() {
		it("testSimpleMetaStoreDeleteProjectConcurrency");
	});
	/**
	 * From: org.eclipse.orion.server.tests.metastore.SimpleMetaStoreWorkspacePropertyConcurrencyTests.java
	 */
	describe("Simple metastore workspace property concurrency tests", function() {
		it("testSimpleMetaStoreCreateWorkspacePropertyConcurrency");
		it("testSimpleMetaStoreDeleteWorkspacePropertyConcurrency");
	});
	/**
	 * From: org.eclipse.orion.server.tests.metastore.SimpleMetaStoreConcurrencyTests.java
	 */
	describe("Simple metastore concurrency tests", function() {
		it("testSimpleMetaStoreCreatePropertyConcurrency");
		it("testSimpleMetaStoreDeletePropertyConcurrency");
	});
	/**
	 * From: org.eclipse.orion.server.tests.metastore.SimpleMetaStoreLiveMigrationConcurrencyTests.java
	 */
	describe("Simple metastore live migration concurrency tests", function() {
		it("testSimpleMetaStoreCreatePropertyConcurrency");
	});
});