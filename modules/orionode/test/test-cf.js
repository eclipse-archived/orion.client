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

var orion = function(options) {
	// Ensure tests run in 'single user' mode
	var opts = options || {};
	opts.workspaceDir = WORKSPACE;
	opts.configParams = { "orion.single.user": true };
	return middleware(opts);
};

describe("Orion cloud foundry", function() {
	/**
	 * From: org.eclipse.orion.server.tests.cf.ManifestParserTest.java
	 */
	describe("Manifest parser tests", function() {
		it("testParserAgainsCorrectManifests");
		it("testParserAgainsIncorrectManifests");
		it("testQuotedManifestProperties");
		it("testTargetBaseManifestProperties");
		it("testManifestGlobalProperties");
		it("testServicesWithSpacesManifest");
	});
	/**
	 * From: org.eclipse.orion.server.tests.cf.ManifestParseTreeTest.java
	 */
	describe("Manifest parse tree tests", function() {
		it("testToJSONAgainsCorrectManifests");
		it("testToJSONAgainsIncorrectManifests");
		it("testFromJSONAgainsCorrectManifests");
	});
	/**
	 * From: org.eclipse.orion.server.tests.cf.ManifestUtilsTest.java
	 */
	describe("Manifest utils tests", function() {
		it("testSingleInheritancePropagation");
		it("testSingleRelativeInheritance");
		it("testFlatSingleRelativeInheritance");
		it("testInnerSingleRelativeInheritance");
		it("testSingleInheritanceOutsideSandbox");
		it("testFlatComplexInheritance");
		it("testInheritanceCycle");
		it("testComplexInheritance");
		it("testEnvInheritance");
	});
	/**
	 * From: org.eclipse.orion.server.tests.cf.PackagerTest.java
	 */
	describe("Manifest packager tests", function() {
		it("testCFIgnoreRules");
		it("testCFIgnoreNegation");
	});
});