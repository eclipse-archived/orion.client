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
	testData = require("./support/test_data"),
	middleware = require("../index.js"),
	manifests = require('../lib/cf/manifests'),
	store = require('../lib/metastore/fs/store'),
	file = require('../lib/file');

var CONTEXT_PATH = "",
	WORKSPACE = path.join(__dirname, ".test_workspace"),
	MEATASTORE =  path.join(__dirname, '.test_metadata'),
	CF = "/cfapi",
	MANIFESTS = "/manifests",
	PREFIX_FILE = CONTEXT_PATH + '/file';

var configParams = {
	"orion.single.user": true, 
	"orion.single.user.metaLocation": MEATASTORE
};

var app = express();
	app.locals.metastore = store({workspaceDir: WORKSPACE, configParams:configParams});
	app.locals.metastore.setup(app);
	app.use(CF+MANIFESTS, manifests.router({ fileRoot: PREFIX_FILE }));
	app.use(PREFIX_FILE + '*', file({fileRoot: PREFIX_FILE, workspaceRoot: CONTEXT_PATH + '/workspace'}));

var request = supertest.bind(null, app);

describe("Orion cloud foundry", function() {
	before(function(done) {
		testData.setUp(WORKSPACE, function() {
			testData.setUpWorkspace(WORKSPACE, MEATASTORE, done);
		});
	});
	after("Remove Workspace and Metastore", function(done) {
		testData.tearDown(WORKSPACE, function(){
			testData.tearDown(path.join(MEATASTORE, '.orion'), function(){
				testData.tearDown(MEATASTORE, done);
			});
		});
	});
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