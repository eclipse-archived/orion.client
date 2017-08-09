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

describe("Orion metadata migration", function() {
	/**
	 * From: org.eclipse.orion.server.tests.metastore.SimpleMetaStoreLiveMigrationTests.java
	 */
	describe("Simple metastore live migration tests", function() {
		it("testArchiveInvalidMetaDataFileVersionFour");
		it("testArchiveInvalidMetaDataFileVersionSeven");
		it("testArchiveInvalidMetaDataFileVersionSix");
		it("testArchiveInvalidMetaDataFolderVersionFour");
		it("testProjectMetadataCorruption");
		it("testUserGrowth8WithOneWorkspaceTwoProjectsVersionFour");
		it("testUserMetadataCorruption");
		it("testUserWithBug433443");
		it("testUserWithBug447759");
		it("testUserWithNoWorkspacesNoVersion");
		it("testUserWithNoWorkspacesUsingFramework");
		it("testUserWithNoWorkspacesVersionEight");
		it("testUserWithNoWorkspacesVersionFour");
		it("testUserWithNoWorkspacesVersionSeven");
		it("testUserWithNoWorkspacesVersionSix");
		it("testUserWithOneWorkspaceNoProjectsUsingFramework");
		it("testUserWithOneWorkspaceNoProjectsVersionEight");
		it("testUserWithOneWorkspaceNoProjectsVersionFour");
		it("testUserWithOneWorkspaceNoProjectsVersionSeven");
		it("testUserWithOneWorkspaceNoProjectsVersionSix");
		it("testUserWithOneWorkspaceOneProjectUsingFramework");
		it("testUserWithOneWorkspaceOneProjectVersionEight");
		it("testUserWithOneWorkspaceOneProjectVersionFour");
		it("testUserWithOneWorkspaceOneProjectVersionSeven");
		it("testUserWithOneWorkspaceOneProjectVersionSix");
		it("testUserWithOneWorkspaceTwoProjectsVersionEight");
		it("testUserWithOneWorkspaceTwoProjectsVersionFour");
		it("testUserWithOneWorkspaceTwoProjectsVersionSeven");
		it("testUserWithOneWorkspaceTwoProjectsVersionSix");
		it("testUserWithTwoWorkspacesTwoProjectsVersionFour");
		it("testUserWithTwoWorkspacesTwoProjectsVersionSix");
		it("testWorkspaceMetadataCorruption");
		it("testUserWithOneWorkspaceTwoProjectsVersionFour");
		it("testUserWithOneWorkspaceTwoProjectsVersionFour");
		it("testUserWithOneWorkspaceTwoProjectsVersionFour");
	});
});