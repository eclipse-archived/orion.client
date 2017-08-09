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

describe("File endpoint", function() {
	/**
	 * From: org.eclipse.orion.server.tests.servlets.files.CoreFilesTest.java
	 */
	describe("core tests", function() {
		it("testCopyFileInvalidSource");
		it("testCopyFileNoOverwrite");
		it("testListenerCopyFile");
		it("testCopyFileOverwrite");
		it("testCreateDirectory");
		it("testListenerCreateDirectory");
		it("testCreateEmptyFile");
		it("testCreateFileEncodedName");
		it("testCreateFileEncodedNameSlug");
		it("testCreateFileDBCSName");
		it("testCreateFileOverwrite");
		it("testCreateTopLevelFile");
		it("testCreateWorkspaceLevelFolder");
		it("testReadWorkspaceJsonTopLevelFile");
		it("testDeleteEmptyDir");
		it("testListenerDeleteEmptyDir");
		it("testDeleteFile");
		it("testListenerDeleteFile");
		it("testDeleteNonEmptyDirectory");
		it("testListenerDeleteNonEmptyDirectory");
		it("testDirectoryDepth");
		it("testDirectoryWithSpaces");
		it("testGenericFileHandler");
		it("testGetForbiddenFiles");
		it("testMoveFileNoOverwrite");
		it("testListenerMoveFileNoOverwrite");
		it("testRenameFileChangeCase");
		it("testMoveFileOverwrite");
		it("testReadDirectory");
		it("testReadDirectoryChildren");
		it("testReadFileContents");
		it("testFolderWithIPv6Name");
		it("testReadFileMetadata");
		it("testListenerWriteFile");
		it.skip("testWriteFileFromURL");
		it.skip("testWriteImageFromURL");
		it("testWriteFileInvalidUTF8");
		it("testGzippedResponseCharset");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.files.AdvancedFilesTest.java
	 */
	describe("advanced tests", function() {
		it("testETagDeletedFile");
		it("testETagPutNotMatch");
		it.skip("testETagHandling");
		it("testGetNonExistingFile");
		it("testMetadataHandling");
		it("testPatchEmptyFile");
		it("testListenerMetadataHandling");
	});
});