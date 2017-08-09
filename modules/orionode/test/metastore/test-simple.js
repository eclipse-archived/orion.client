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

describe("Orion simple metastore", function() {
	var app, request;
	beforeEach(function(done) {
		app = express();
		request = supertest.bind(null, app);
		testdata.setUp(WORKSPACE, done);
	});
	
	/**
	 * From: org.eclipse.orion.server.tests.metastore.SimpleMetaStoreTests.java
	 */
	describe("Simple metastore tests", function() {
		it("testArchiveEmptyOrganizationalFolder");
		it("testArchiveInvalidMetaDataFileInOrganizationalFolder");
		it("testArchiveInvalidMetaDataFileInServerWorkspaceRoot");
		it("testArchiveInvalidMetaDataFolderInOrganizationalFolder");
		it("testArchiveInvalidMetaDataFileInServerWorkspaceRoot");
		it("testArchiveInvalidMetaDataFolderInOrganizationalFolder");
		it("testArchiveInvalidMetaDataFolderInServerWorkspaceRoot");
		it("testCreateProjectNamedOrionContent");
		it("testCreateProjectNamedUser");
		it("testCreateProjectNamedUserDashOrionContent");
		it("testCreateProjectNamedWorkspace");
		it("testCreateProjectUsingFileAPI");
		it("testCreateProjectWithAnInvalidWorkspaceId");
		it("testCreateProjectWithBarInName");
		it("testCreateProjectWithDuplicateProjectName");
		it("testCreateProjectWithEmojiChactersInName");
		it("testCreateProjectWithNoWorkspaceId");
		it("testCreateProjectWithURLAsName");
		it("testCreateSecondWorkspace");
		it("testCreateSimpleProject");
		it("testCreateSimpleUser");
		it("testCreateSimpleWorkspace");
		it("testCreateTwoWorkspacesWithSameName");
		it("testCreateUserWithNoUserName");
		it("testCreateWorkspaceWithAnInvalidUserId");
		it("testCreateWorkspaceWithNoUserId");
		it("testCreateWorkspaceWithNoWorkspaceName");
		it("testDeleteSimpleProject");
		it("testDeleteSimpleUser");
		it("testDeleteSimpleWorkspace");
		it("testDeleteUserByUniqueIdProperty");
		it("testEncodedProjectContentLocation");
		it("testGetDefaultContentLocation");
		it("testGetUserHome");
		it("testGetUserHomeWithNullArgument");
		it("testGetWorkspaceContentLocation");
		it("testMoveProjectLinked");
		it("testMoveProjectWithBarInProjectName");
		it("testMoveSimpleProject");
		it("testMoveUser");
		it("testReadAllUsers");
		it("testReadCorruptedProjectJson");
		it("testReadCorruptedUserJson");
		it("testReadCorruptedWorkspaceJson");
		it("testReadProject");
		it("testReadProjectThatDoesNotExist");
		it("testReadProjectWithWorkspaceThatDoesNotExist");
		it("testReadUser");
		it("testReadUserByEmailConfirmationProperty");
		it("testReadUserByPasswordResetIdProperty");
		it("testReadUserByDiskUsageAndTimestampProperty");
		it("testReadUserByBlockedProperty");
		it("testReadUserByEmailProperty");
		it("testReadUserByOauthProperty");
		it("testReadUserByOpenidProperty");
		it("testReadUserByPasswordProperty");
		it("testReadUserByUserNameProperty");
		it("testReadUserThatDoesNotExist");
		it("testReadWorkspace");
		it("testReadWorkspaceSpecifyNullWorkspaceId");
		it("testReadWorkspaceThatDoesNotExist");
		it("testUpdateProject");
		it("testUpdateUser");
		it("testUpdateWorkspace");
	});
	/**
	 * From: org.eclipse.orion.server.tests.metastore.SimpleMetaStoreUserPropertyCacheTests.java
	 */
	describe("Simple metastore user property cache tests", function() {
		it("testAddUserProperty");
		it("testDeleteUser");
		it("testDeleteUserProperty");
		it("testNoUserProperty");
		it("testUpdateUserProperty");
	});
});
