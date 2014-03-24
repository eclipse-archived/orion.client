/*******************************************************************************
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global describe it beforeEach*/
/*jslint node:true*/
var assert = require('assert');
var path = require('path');
var testData = require('./support/test_data');

var CONTEXT_PATH = '/orionn';
var PREFIX = CONTEXT_PATH + '/workspace', PREFIX_FILE = CONTEXT_PATH + '/file';
var WORKSPACE = path.join(__dirname, '.test_workspace');
var DEFAULT_WORKSPACE_NAME = 'Orionode Workspace';

var app = testData.createApp()
		.use(CONTEXT_PATH, require('../lib/workspace')({
			root: '/workspace',
			fileRoot: '/file',
			workspaceDir: WORKSPACE
		}))
		.use(CONTEXT_PATH, require('../lib/file')({
			root: '/file',
			workspaceRoot: '/workspace',
			workspaceDir: WORKSPACE
		}));

function byName(a, b) {
	return String.prototype.localeCompare(a.Name, b.Name);
}

// Retrieves the 0th Workspace in the list and invoke the callback
function withDefaultWorkspace(callback) {
	app.request()
	.get(PREFIX)
	.end(function(err, res) {
		assert.ifError(err);
		callback(res.body.Workspaces[0]);
	});
}

/**
 * see http://wiki.eclipse.org/Orion/Server_API/Workspace_API
 */
describe('Workspace API', function() {
	beforeEach(function(done) { // testData.setUp.bind(null, parentDir)
		testData.setUp(WORKSPACE, done);
	});

	/**
	 * http://wiki.eclipse.org/Orion/Server_API/Workspace_API#Actions_on_workspaces
	 */
	describe('workspace', function() {
		it('list workspaces', function(done) {
			app.request()
			.get(PREFIX)
			.expect(200)
			.end(function(e, res) {
				assert.ifError(e);
				assert.ok(Array.isArray(res.body.Workspaces));
				// In Orionode, we have just a single workspace.
				assert.equal(res.body.Workspaces.length, 1);
				assert.ok(res.body.Workspaces[0].Id);
				assert.ok(res.body.Workspaces[0].Location);
				assert.equal(res.body.Workspaces[0].Name, DEFAULT_WORKSPACE_NAME);
				done();
			});
		});
		it('create workspace should fail', function(done) {
			app.request()
			.post(PREFIX)
			.set('Slug', 'whatever')
			.expect(403, done);
		});
		it('get workspace metadata', function(done) {
			withDefaultWorkspace(function(workspace) {
				app.request()
				.get(workspace.Location)
				.expect(200)
				.end(function(e, res) {
					assert.ifError(e);
					assert.ok(res.body.Id);
					assert.equal(res.body.Name, DEFAULT_WORKSPACE_NAME);
					// Orionode doesn't have "projects" so don't check res.body.Projects
					assert.ok(Array.isArray(res.body.Children));
					res.body.Children.sort(byName);
					assert.equal(res.body.Children.length, 1);
					assert.equal(res.body.Children[0].Name, "project");
					assert.equal(res.body.Children[0].Directory, true);
					assert.ok(res.body.Children[0].ChildrenLocation);
					// Ensure that GET ChildrenLocation returns the child File objects.. mini /file test
					app.request()
					.get(res.body.Children[0].ChildrenLocation)
					.expect(200)
					.end(function(err, res) {
						assert.ifError(err);
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
		it('change workspace metadata should fail', function(done) {
			withDefaultWorkspace(function(workspace) {
				app.request()
				.put(workspace.Location)
				.send({ Name: 'fizz buzz' })
				.expect(403, done);
			});
		});
		it('delete workspace should fail', function(done) {
			withDefaultWorkspace(function(workspace) {
				app.request()
				.del(workspace.Location)
				.expect(403, done);
			});
		});
	});
	/**
	 * see http://wiki.eclipse.org/Orion/Server_API/Workspace_API#Actions_on_projects
	 * Most Project actions are unsupported.
	 */
	describe('project', function(done) {
		/**
		 * Rename Project. The Orion UI requires this operation to support rename of top-level folders.
		 */
		it('rename a project should succeed', function(done) {
			var oldProjectLocation = PREFIX_FILE + '/project';
			withDefaultWorkspace(function(workspace) {
				app.request()
				.post(workspace.Location)
				.set('X-Create-Options', 'move')
				.send({Location: oldProjectLocation, Name: 'project_renamed'})
				.expect(200)
				.end(function(e, res) {
					assert.ifError(e);
					assert.equal(res.body.Name, 'project_renamed');

					// GETting the new ContentLocation should return the project metadata
					app.request()
					.get(res.body.ContentLocation)
					.expect(200)
					.end(function(err, res) {
						assert.ifError(err);

						// and GETting the ChildrenLocation should return the children
						app.request()
						.get(res.body.ChildrenLocation)
						.expect(200)
						.end(function(err, res){
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
	});
});