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

describe("Site endpoint", function() {
	/**
	 * From: org.eclipse.orion.server.tests.servlets.site.HostingTest.java
	 */
	describe("Hosting tests", function() {
		it("testStartSite");
		it("testStartSiteNoMappings");
		it("testStopSite");
		it("testSiteAccess");
		it("testSiteFileMime");
		it("testDisallowedSiteAccess");
		it("testRemoteProxyRequest");
		it("testRemoteProxyRequestPathEncoding");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.site.SiteHostingService.java
	 */
	describe("Site hosting service tests", function() {
		it("testSiteHostingConfigParsing");
		it("testSiteHostingServiceStart");
		it("testSiteHostingServiceStartHostnameTaken");
		it("testSiteHostingServiceMatchesVirtualHost");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.site.SiteHostingService.java
	 */
	describe("Site tests", function() {
		it("testCreateSite");
		it("testCreateSiteNoName");
		it("testCreateSiteNoWorkspace");
		it("testRetrieveSite");
		it("testUpdateSite");
		it("testDeleteSite");
		it("testDisallowedAccess");
	});
});