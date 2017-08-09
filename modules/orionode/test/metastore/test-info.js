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
/*eslint-env node, mocha*/
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

describe("Orion metadata info API", function() {
	/**
	 * From: org.eclipse.orion.server.tests.metastore.ProjectInfoTests.java
	 */
	describe("Project info tests", function() {
		it("testUniqueId");
		it("testFullName");
		it("testContentLocation");
		it("testProperties");
		it("testUserId");
	});
	/**
	 * From: org.eclipse.orion.server.tests.metastore.UserInfoTests.java
	 */
	describe("User info tests", function() {
		it("testUniqueId");
		it("testFullName");
		it("testUserName");
		it("testProperties");
		it("testWorkspaceIds");
	});
	/**
	 * From: org.eclipse.orion.server.tests.metastore.WorkspaceInfoTests.java
	 */
	describe("Workspace info tests", function() {
		it("testUniqueId");
		it("testUserId");
		it("testFullName");
		it("testProperties");
		it("testProjectNames");
	});
});