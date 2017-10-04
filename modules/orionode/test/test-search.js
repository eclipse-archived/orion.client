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
var	path = require("path"),
	testData = require("./support/test_data"),
	testHelper = require('./support/testHelper');

var CONTEXT_PATH = testHelper.CONTEXT_PATH,
	WORKSPACE = testHelper.WORKSPACE,
	METADATA =  testHelper.METADATA,
	WORKSPACE_ID = testHelper.WORKSPACE_ID,
	PREFIX_WORKSPACE = CONTEXT_PATH + '/workspace';
	
var request = testData.setupOrionServer();

describe("Orion search", function() {
	beforeEach("Create the default workspace and create metadata", function(done) {
		testData.setUp(WORKSPACE, function() {
			testData.setUpWorkspace(request, done);
		}, false);
	});
	afterEach("Remove .test_workspace", function(done) {
		testData.tearDown(testHelper.WORKSPACE, function(){
			testData.tearDown(path.join(METADATA, '.orion'), function() {
				testData.tearDown(METADATA, done);
			});
		});
	});
	//search query shape
	//filesearch?
		//sort=Path
	/**
	 * From: org.eclipse.orion.server.tests.search.SearchTest.java
	 */
	describe("search tests", function() {
		it("testUnknownTerm", function(done) {
			testHelper.withWorkspace(request, PREFIX_WORKSPACE, WORKSPACE_ID)
				.end(function(err, res) {
					done() //TODO
				});
		});
		it("testUnknownTermMixedTail");
		it("testUnknownTermMixedMid");
		it("testPartialWord");
		it("testWordConcatenation");
		it("testHTMLTag");
		it("testSearchNonAlphaNumeric");
		it("testPhraseSearch");
		it("testSearchInProjectWithURLName");
		it("testPhraseDifferentCase");
		it("testSingleWord");
		it("testPathWithDBCS");
		it("testFileWithDBCS");
		it("testSearchDBCS");
		it("testPathWithSpaces");
		it("testFilenameSearch");
		it("testRegExSearch");
		it("testCaseSensitive");
	});
});