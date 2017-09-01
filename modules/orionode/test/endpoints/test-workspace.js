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
	configParams: {
		"orion.single.user": true,
		"orion.single.user.metaLocation": MEATASTORE
	},
	workspaceDir: WORKSPACE
};
var app = express();
	app.locals.metastore = store(options);
	app.locals.metastore.setup(app);
	app.use(PREFIX, workspace({
		workspaceRoot: CONTEXT_PATH + '/workspace', 
		fileRoot: CONTEXT_PATH + '/file', 
		gitRoot: CONTEXT_PATH + '/gitapi',
		options: options
	}));
	app.use(PREFIX_FILE, file({
		workspaceRoot: CONTEXT_PATH + '/workspace', 
		gitRoot: CONTEXT_PATH + '/gitapi', 
		fileRoot: CONTEXT_PATH + '/file',
		options: options
	}));

var request = supertest.bind(null, app);

function byName(a, b) {
	return String.prototype.localeCompare.call(a.Name, b.Name);
}

// Retrieves the 0th Workspace in the list and invoke the callback
function withDefaultWorkspace(callback) {
	request()
		.get(PREFIX + '/' + WORKSPACE_ID)
		.end(function(err, res) {
			testHelper.throwIfError(err);
			callback(res.body);
		});
}

describe("Workspace endpoint", function() {

	beforeEach(function(done) { // testData.setUp.bind(null, parentDir)
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

	/**
	 * From: org.eclipse.orion.server.tests.servlets.workspace.WorkspaceServiceTests.java
	 */
	it("testCreateProject", function(done) {
		withDefaultWorkspace(function(ws) {
			request()
				.post(ws.Location)
				.set('Slug', 'testCreateProject')
				.expect(201)
				.end(done);
		});
	});
	it("testMoveBadRequest", function(done) {
		withDefaultWorkspace(function(ws) {
			request()
				.post(ws.Location)
				.set('Slug', 'testMoveBadRequest')
				.expect(201)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					request()
						.post(ws.Location)
						.type('json')
						.set('Slug', 'testMoveBadRequest23')
						.set('Orion-Version', 1)
						.set('X-Create-Options', "move")
						.send({Location: 'badSourceProject'})
						.expect(403)
						.end(done);
				});
		});
	});
	it("testMoveFolderToProject", function(done) {
		withDefaultWorkspace(function(ws) {
			request()
				.post(ws.Location)
				.set('Slug', 'testMoveFolderToProjectSrc')
				.expect(201)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					testHelper.createDir(request, '/testMoveFolderToProjectSrc', 'testFolder')
						.end(function(err, res) {
							testHelper.throwIfError(err);
							var fLoc = res.body.Location;
							request()
								.post(ws.Location)
								.type('json')
								.set('Slug', 'testMoveFolderToProjectDest')
								.set('Orion-Version', 1)
								.set('X-Create-Options', "move")
								.send({Location: fLoc})
								.expect(201)
								.end(function(err, res) {
									testHelper.throwIfError(err);
									done();
								});
						})
				});
		});
	});
	it("testRenameProject", function(done) {
		var oldProjectLocation = PREFIX_FILE + '/' + WORKSPACE_ID + '/project';
		withDefaultWorkspace(function(workspace) {
			request()
				.post(workspace.Location)
					.set('X-Create-Options', 'move')
					.send({Location: oldProjectLocation, Name: 'project_renamed'})
					.expect(201)
					.end(function(e, res) {
						testHelper.throwIfError(e, "Failed to rename project at " + oldProjectLocation);
						assert.equal(res.body.Name, 'project_renamed');

						// GETting the new ContentLocation should return the project metadata
						request()
							.get(res.body.ContentLocation)
							.expect(200)
							.end(function(err, res) {
								testHelper.throwIfError(err, "Failed to get ContentLocation");

								// and GETting the ChildrenLocation should return the children
								request()
									.get(res.body.ChildrenLocation)
										.expect(200)
										.end(/* @callback */ function(err, res){
											assert.ok(Array.isArray(res.body.Children), "has children");
											var foundFizz = res.body.Children.some(function(child) {
												return child.Name === 'fizz.txt';
											});
											assert.ok(foundFizz, 'fizz.txt was found at the new ContentLocation');
											done();
										});
							});
					});
		});
	});
	it("testMoveProject", function(done) {
		withDefaultWorkspace(function(ws) {
			request()
				.post(ws.Location)
				.set('Slug', 'testMoveProject')
				.expect(201)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					var pLoc = res.body.Location;
					request()
						.post(ws.Location)
						.type('json')
						.set('X-Create-Options', "move")
						.set('Slug', 'testMOVEDProject')
						.send({Location: pLoc})
						.expect(201)
						.end(function(err, res) {
							done();
						});
				});
		});
	});
	it("testMoveProjectToFolder", function(done) {
		withDefaultWorkspace(function(ws) {
			request()
				.post(ws.Location)
				.set('Slug', 'testMoveProjectToFolderSrc')
				.expect(201)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					var pLoc = res.body.Location;
					request()
						.post(ws.Location)
						.set('Slug', 'testMoveProjectToFolderDest')
						.expect(201)
						.end(function(err, res) {
							testHelper.throwIfError(err);
							request()
								.post(ws.Location)
								.type('json')
								.set('X-Create-Options', "move")
								.set('Slug', 'testMoveProjectToFolderSrc')
								.send({Location: pLoc, Name: 'testMoveProjectToFolderSrc'})
								.expect(201)
								.end(function(err, res) {
									testHelper.throwIfError(err);
									//check the project is removed from the projects
									withDefaultWorkspace(function(ws) {
										assert(Array.isArray(ws.Projects));
										assert(!ws.Projects.some(function(p) {
											return p.Name === 'testMoveProjectToFolderSrc';
										}));
										done();
									});
								});
						});
				});
		});
	});
	it("testCopyProjectNonDefaultLocation", function(done) {
		done();
	});
	it.skip("testCopyFolderToProject", function(done) {
		withDefaultWorkspace(function(ws) {
			request()
				.post(ws.Location)
				.set('Slug', 'testCopyFolderToProject')
				.expect(201)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					testHelper.createDir(request, '/testCopyFolderToProject', 'testDir')
						.end(function(err, res) {
							testHelper.throwIfError(err);
							var fLoc = res.body.Location;
							request()
								.post(ws.Location)
								.type('json')
								.set('Slug', 'destinationProject')
								.set('X-Create-Options', "copy")
								.set('Orion-Version', 1)
								.send({Location: fLoc})
								.expect(201)
								.end(function(err, res) {
									testHelper.throwIfError(err);
									done();
								});
						});
				});
		});
		done();
	});
	it("testCopyProject", function(done) {
		withDefaultWorkspace(function(ws) {
			request()
				.post(ws.Location)
				.set('Slug', 'testCopyProject')
				.expect(201)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					done();
					//TODO
				});
		});
	});
	it("testCreateProjectBadName - space", function(done) {
		withDefaultWorkspace(function(ws) {
			request()
				.post(ws.Location)
				.set('Slug', ' ')
				.expect(400)
				.end(done);
		});
	});
	it("testCreateProjectBadName - empty string", function(done) {
		withDefaultWorkspace(function(ws) {
			request()
				.post(ws.Location)
				.set('Slug', '')
				.expect(400)
				.end(done);
		});
	});
	it("testCreateProjectBadName - slash", function(done) {
		withDefaultWorkspace(function(ws) {
			request()
				.post(ws.Location)
				.set('Orion-Version', 1)
				.set('Slug', '/')
				.expect(400)
				.end(done);
		});
	});
	it("testCreateProjectNonDefaultLocation", function(done) {
		withDefaultWorkspace(function(ws) {
			request()
				.post(ws.Location)
				.set('Slug', 'testCreateProjectNonDefaultLocation')
				.set('ContentLocation', MEATASTORE)
				.expect(403)
				.end(done);
		});
	});
	it("testCreateWorkspace", function(done) {
		// This test should only run against multiuser case, and assuming the user is not authenticated, 
		//otherwise used is allowed to create workspace
		request()
			.post(PREFIX)
			.set('Slug', 'whatever')
			.expect(201, done);
	});
	it("testCreateWorkspaceNullName", function(done) {
		request()
			.post(PREFIX)
			.expect(403, done);
	});
	it("testGetWorkspaceMetadata", function(done) {
		withDefaultWorkspace(function(workspace) {
			request()
				.get(workspace.Location)
				.expect(200)
				.end(function(e, res) {
					testHelper.throwIfError(e, "Failed to get metadata from " + workspace.Location);
					assert.ok(res.body.Id);
					assert.equal(res.body.Name, TEST_WORKSPACE_NAME);
					// Orionode doesn't have "projects" so don't check res.body.Projects
					assert.ok(Array.isArray(res.body.Children));
					res.body.Children.sort(byName);
					assert.equal(res.body.Children.length, 1);
					assert.equal(res.body.Children[0].Name, "project");
					assert.equal(res.body.Children[0].Directory, true);
					var childrenLoc = res.body.Children[0].ChildrenLocation;
					assert.ok(childrenLoc);
					// Ensure that GET ChildrenLocation returns the child File objects.. mini /file test
					request()
						.get(childrenLoc)
						.expect(200)
						.end(function(err, res) {
							testHelper.throwIfError(err, "Failed to get ChildrenLocation: " + childrenLoc);
							assert.ok(Array.isArray(res.body.Children));
							res.body.Children.sort(byName);
							assert.equal(res.body.Children.length, 2);
							assert.equal(res.body.Children[0].Name, 'fizz.txt');
							assert.equal(res.body.Children[1].Name, 'my folder');
							done();
						});
				});
		});
	});
	it("testChangeWorkspaceMetadata", function(done) {
		withDefaultWorkspace(function(workspace) {
			request()
				.put(workspace.Location)
				.send({ Name: 'fizz buzz' })
				.expect(403, done);
		});
	});
	it("testGetProjectMetadata", function(done) {
		withDefaultWorkspace(function(ws) {
			request()
				.post(ws.Location)
				.set('Slug', 'testGetProjectMetadata')
				.expect(201)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					request()
						.get(res.body.Location)
						.expect(200)
						.end(function(err, res) {
							testHelper.throwIfError(err);
							assert.equal('testGetProjectMetadata', res.body.Name, "The project name is not the same");
							done();
						})
				});
		});
	});
	it("testDeleteProject", function(done) {
		withDefaultWorkspace(function(ws) {
			request()
				.post(ws.Location)
				.set('Slug', 'testDeleteProject')
				.expect(201)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					var _loc = res.body.Location;
					request()
						.delete(_loc)
						.expect(200)
						.end(function(err, res) {
							testHelper.throwIfError(err);
							//now try to fetch it, should 404
							request()
								.get(_loc)
								.expect(404)
								.end(done);
						});
				});
		});
	});
	it("testDeleteWorkspace", function(done) {
		withDefaultWorkspace(function(workspace) {
			request()
				.del(workspace.Location)
				.expect(403, done);
		});
	});
	it("testGetWorkspaces", function(done) {
		request()
			.get(PREFIX)
			.expect(200)
			.end(function(e, res) {
				testHelper.throwIfError(e, "Failed to get workspace");
				assert.ok(Array.isArray(res.body.Workspaces));
				// In Orionode, we have just a single workspace.
				assert.equal(res.body.Workspaces.length, 1);
				assert.ok(res.body.Workspaces[0].Id);
				assert.ok(res.body.Workspaces[0].Location);
				assert.equal(res.body.Workspaces[0].Location, PREFIX + "/anonymous-OrionContent");
				assert.equal(res.body.Workspaces[0].Name, TEST_WORKSPACE_NAME);
				done();
			});
	});
});