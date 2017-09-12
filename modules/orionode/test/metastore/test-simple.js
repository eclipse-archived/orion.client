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
var assert = require('assert'),
	express = require('express'),
	path = require('path'),
	supertest = require('supertest'),
	testData = require('../support/test_data'),
	store = require('../../lib/metastore/fs/store'),
	testHelper = require('../support/testHelper'),
	workspace = require('../../lib/workspace'),
	file = require('../../lib/file');

var CONTEXT_PATH = '',
	PREFIX = CONTEXT_PATH + '/workspace', 
	PREFIX_FILE = CONTEXT_PATH + '/file',
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
	app.use(PREFIX, workspace(options));
	app.use(PREFIX_FILE, file(options));

testHelper.handleErrors(app);

var request = supertest.bind(null, app);

describe("Orion metastore", function() {
	beforeEach("Create the default workspace and create metadata", function(done) { // testData.setUp.bind(null, parentDir)
		testData.setUp(WORKSPACE, function(){
			testData.setUpWorkspace(WORKSPACE, MEATASTORE, done);
		}, false);
	});
	afterEach("Remove .test_workspace", function(done) {
		testData.tearDown(testHelper.WORKSPACE, function(){
			testData.tearDown(path.join(MEATASTORE, '.orion'), function(){
				testData.tearDown(MEATASTORE, done)
			})
		});
	});
	
	it.skip("testArchiveEmptyOrganizationalFolder");
	it.skip("testArchiveInvalidMetaDataFileInOrganizationalFolder");
	it.skip("testArchiveInvalidMetaDataFileInServerWorkspaceRoot");
	it.skip("testArchiveInvalidMetaDataFolderInOrganizationalFolder");
	it.skip("testArchiveInvalidMetaDataFileInServerWorkspaceRoot");
	it.skip("testArchiveInvalidMetaDataFolderInOrganizationalFolder");
	it.skip("testArchiveInvalidMetaDataFolderInServerWorkspaceRoot");
	it.skip("testCreateProjectNamed - anonymous-OrionContent", function(done) {
		testHelper.withWorkspace(request, PREFIX, WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				assert(res.body, "There must be a workspace");
				request()
					.post(res.body.Location)
					.set('Slug', 'anonymous-OrionContent')
					.expect(400)
					.end(done);
			});
	});
	it("testCreateProjectNamed - OrionContent", function(done) {
		testHelper.withWorkspace(request, PREFIX, WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				assert(res.body, "There must be a workspace");
				request()
					.post(res.body.Location)
					.set('Slug', 'OrionContent')
					.expect(201)
					.end(done);
			});
	});
	it("testCreateProjectNamed - user", function(done) {
		testHelper.withWorkspace(request, PREFIX, WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				assert(res.body, "There must be a workspace");
				request()
					.post(res.body.Location)
					.set('Slug', 'user')
					.expect(500)
					.end(done);
			});
	});
	it("testCreateProjectNamed - Orion Content", function(done) {
		testHelper.withWorkspace(request, PREFIX, WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				assert(res.body, "There must be a workspace");
				request()
					.post(res.body.Location)
					.set('Slug', 'Orion Content')
					.expect(201)
					.end(done);
			});
	});
	it("testCreateProjectUsingFileAPI", function(done) {
		testHelper.withWorkspace(request, PREFIX, WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				assert(res.body, "There must be a workspace");
				request()
					.post(res.body.Location)
					.set('Slug', 'testCreateProjectUsingFileAPI')
					.expect(201)
					.end(done);
			});
	});
	it("testCreateProjectWithAnInvalidWorkspaceId", function(done) {
		testHelper.withWorkspace(request, PREFIX, WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				assert(res.body, "There must be a workspace");
				request()
					.post(PREFIX + '/77')
					.set('Slug', 'testCreateProjectWithAnInvalidWorkspaceId')
					.expect(400)
					.end(done);
			});
	});
	it("testCreateProjectWithBarInName", function(done) {
		testHelper.withWorkspace(request, PREFIX, WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				assert(res.body, "There must be a workspace");
				request()
					.post(res.body.Location)
					.set('Slug', 'testCreateProjectWith|InName')
					.expect(201)
					.end(done);
			});
	});
	it("testCreateProjectWithDuplicateProjectName", function(done) {
		testHelper.withWorkspace(request, PREFIX, WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				assert(res.body, "There must be a workspace");
				var ws = res.body.Location;
				request()
					.post(ws)
					.set('Slug', 'testCreateProjectWithDuplicateProjectName')
					.expect(201)
					.end(function(err, res) {
						testHelper.throwIfError(err);
						request()
							.post(ws)
							.set('Slug', 'testCreateProjectWithDuplicateProjectName')
							.expect(500)  // _createProjectMetadata will happen first to check duplication, and 500 will be sent back
							.end(done);
					});
			});
	});
	it("testCreateProjectWithEmojiChactersInName", function(done) {
		var emoji = encodeURIComponent("Project \ud83d\ude0a\ud83d\udc31\ud83d\udc35");
		testHelper.withWorkspace(request, PREFIX, WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				assert(res.body, "There must be a workspace");
				request()
					.post(res.body.Location)
					.set("Content-Type","text/html; charset=UTF-8")
					.set('Slug', emoji)
					.expect(201)
					.end(done);
			});
	});
	it.skip("testCreateProjectWithNoWorkspaceId", function(done) {
		// Skip because there's no way to test create Project without workspace ID throught Server Rest APIs(Java eqivalent test is call method directely)
		request()
			.post(PREFIX)
			.set('Slug', 'testCreateProjectWithNoWorkspaceId')
			.expect(400)
			.end(done);
	});
	it("testCreateProjectWithURLAsName", function(done) {
		testHelper.withWorkspace(request, PREFIX, WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				assert(res.body, "There must be a workspace");
				request()
					.post(res.body.Location)
					.set('Slug', 'http://orion.eclipse.org/')
					.expect(400)
					.end(done);
			});
	});
	it("testCreateSecondWorkspace", function(done) {
		request()
			.post(PREFIX)
			.type('json')
			.send({Name: 'Orion sandbox'})
			.set('Slug', 'Orion sandbox')
			.expect(201)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				testHelper.withWorkspace(request, PREFIX, res.body.Name)
					.end(done);
			});
	});
	it("testCreateTwoWorkspacesWithSameName", function(done) {
		testHelper.withWorkspace(request, PREFIX, WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				request()
					.post(PREFIX)
					.set('Slug', 'Orion ws')
					.expect(201)
					.end(function(err, res) {
						testHelper.throwIfError(err);
						request()
							.post(PREFIX)
							.set('Slug', 'Orion ws')
							.expect(201)
							.end(done);
					});
			});
	});
	it.skip("testCreateWorkspaceWithAnInvalidUserId");
	it.skip("testCreateWorkspaceWithNoUserId");
	it("testCreateWorkspaceWithNoWorkspaceName", function(done) {
		request()
			.post(PREFIX)
			//.set('Slug', 'Orion workspace test')
			.expect(400)
			.end(done);
	});
	it("testDeleteSimpleProject", function(done) {
		testHelper.withWorkspace(request, PREFIX, WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				request()
					.post(res.body.Location)
					.type('json')
					.send({Name: 'testDeleteSimpleProject'})
					.expect(201)
					.end(function(err, res) {
						testHelper.throwIfError(err);
						var pLoc = res.body.Location;
						request()
							.delete(pLoc)
							.expect(204)
							.end(function(err, res) {
								testHelper.throwIfError(err);
								request()
									.get(pLoc)
									.expect(404)
									.end(done);
							});
					});
			});
	});
	it("testDeleteSimpleWorkspace", function(done) {
		request()
			.post(PREFIX)
			.set('Slug', 'Orion sandbox')
			.expect(201)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				testHelper.withWorkspace(request, PREFIX, res.body.Id)
					.end(function(err, res) {
						testHelper.throwIfError(err);
						var wLoc = res.body.Location;
						request()
							.delete(wLoc)
							.expect(204)
							.end(function(err, res) {
								testHelper.throwIfError(err);
								request()
									.get(wLoc)
									.expect(404)
									.end(done);
							});
					});
			});
	});
	it("testGetWorkspaces", function(done) {
		request()
			.get(PREFIX)
			.expect(200)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				assert(Array.isArray(res.body.Workspaces), "There must be a Workspaces array");
				done();
			});
	});
	it("testMoveProjectWithBarInProjectName", function(done) {
		testHelper.withWorkspace(request, PREFIX, WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				var ws = res.body.Location;
				request()
					.post(ws)
					.type('json')
					.send({Name: 'testMoveProjectWith|InProjectName'})
					.expect(201)
					.end(function(err, res) {
						testHelper.throwIfError(err);
						var pLoc = res.body.Location;
						request()
							.post(ws)
							.type('json')
							.set('X-Create-Options', "move")
							.set('Slug', 'testMoveProjectWith|InProjectNameMOVED')
							.send({Location: pLoc})
							.expect(201)
							.end(function(err, res) {
								testHelper.throwIfError(err);
								request()
									.get(res.body.Location)
									.expect(200)
									.end(done);
							});
					});
			});
	});
	it("testMoveSimpleProject", function(done) {
		testHelper.withWorkspace(request, PREFIX, WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				var ws = res.body.Location;
				request()
					.post(ws)
					.type('json')
					.send({Name: 'testMoveSimpleProject'})
					.expect(201)
					.end(function(err, res) {
						testHelper.throwIfError(err);
						var pLoc = res.body.Location;
						request()
							.post(ws)
							.type('json')
							.set('X-Create-Options', "move")
							.set('Slug', 'testMoveSimpleProjectMOVED')
							.send({Location: pLoc})
							.expect(201)
							.end(function(err, res) {
								request()
									.get(res.body.Location)
									.expect(200)
									.end(done);
							});
					});
			});
	});
	it.skip("testMoveProjectLinked");
	it.skip("testReadCorruptedProjectJson");
	it.skip("testReadCorruptedUserJson");
	it.skip("testReadCorruptedWorkspaceJson");
	it("testReadProject", function(done) {
		testHelper.withWorkspace(request, PREFIX, WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				request()
					.post(res.body.Location)
					.type('json')
					.send({Name: 'testReadProject'})
					.expect(201)
					.end(function(err, res) {
						testHelper.throwIfError(err);
						request()
							.get(res.body.Location)
							.expect(200)
							.end(function(err, res) {
								assert(res.body && res.body.Name === 'testReadProject', "The new project was not found after creation")
								done();
							});
					});
			})
	});
	it("testReadProjectThatDoesNotExist", function(done) {
		testHelper.withWorkspace(request, PREFIX, WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				request()
					.get(path.join(res.body.Location, '/projectThatDoesNotExist'))
					.expect(404)
					.end(done);
			});
	});
	it("testReadProjectWithWorkspaceThatDoesNotExist", function(done) {
		testHelper.withWorkspace(request, PREFIX, WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				request()
					.get(path.join(path.dirname(res.body.Location), '/77', '/someProject'))
					.expect(404)
					.end(done);
			});
	});
	it("testReadWorkspace", function(done) {
		testHelper.withWorkspace(request, PREFIX, WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				assert(res.body && res.body.Location, "There should be a body in the response with a Location");
				done();
			});
	});
	it("testReadWorkspaceThatDoesNotExist", function(done) {
		request()
			.get(PREFIX + '/wsThatDoesNotExist')
			.expect(404)
			.end(done);
	});
	it.skip("testUpdateProject");
	it.skip("testUpdateWorkspace");
});
