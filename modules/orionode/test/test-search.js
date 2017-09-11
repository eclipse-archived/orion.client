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
var express = require("express"),
	supertest = require("supertest"),
	path = require("path"),
	testData = require("./support/test_data"),
	store = require('../lib/metastore/fs/store'),
	testHelper = require('./support/testHelper'),
	workspace = require('../lib/workspace'),
	file = require('../lib/file'),
	search = require("../lib/search");

var CONTEXT_PATH = '',
	PREFIX_WORKSPACE = CONTEXT_PATH + '/workspace', 
	PREFIX_FILE = CONTEXT_PATH + '/file',
	PREFIX = CONTEXT_PATH + '/filesearch',
	WORKSPACE_ID = 'anonymous-OrionContent',
	TEST_WORKSPACE_NAME = '.test_workspace',
	WORKSPACE = path.join(__dirname, TEST_WORKSPACE_NAME),
	MEATASTORE =  path.join(__dirname, '.test_metadata');

var options = {
	workspaceRoot: CONTEXT_PATH + '/workspace', 
	fileRoot: CONTEXT_PATH + '/file', 
	gitRoot: CONTEXT_PATH + '/gitapi',
	configParams: {
		"orion.single.user": true,
		"orion.single.user.metaLocation": MEATASTORE
	},
	workspaceDir: WORKSPACE
	};

var app = express();
	app.locals.metastore = store(options);
	app.locals.metastore.setup(app);
	app.use(PREFIX, search(options));
	app.use(PREFIX_WORKSPACE, workspace(options));
	app.use(PREFIX_FILE, file(options));

testHelper.handleErrors(app);

var request = supertest.bind(null, app);

describe("Orion search", function() {
	beforeEach("Create the default workspace and create metadata", function(done) {
		testData.setUp(WORKSPACE, function() {
			testData.setUpWorkspace(WORKSPACE, MEATASTORE, done);
		}, false);
	});
	afterEach("Remove .test_workspace", function(done) {
		testData.tearDown(testHelper.WORKSPACE, function(){
			testData.tearDown(path.join(MEATASTORE, '.orion'), function() {
				testData.tearDown(MEATASTORE, done)
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