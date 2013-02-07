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
/*global __dirname console require describe it beforeEach*/
var assert = require('assert');
var mocha = require('mocha');
var request = require('supertest');

var connect = require('connect');
var testData = require('./support/test_data');
var path = require('path');

var PREFIX = '/workspace', PREFIX_FILE = '/file';
var WORKSPACE = path.join(__dirname, '.test_workspace');
var DEFAULT_WORKSPACE_NAME = 'Orionode Workspace';

var app = testData.createApp()
		.use(require('../lib/workspace')({
			root: PREFIX,
			fileRoot: PREFIX_FILE,
			workspaceDir: WORKSPACE
		}))
		.use(require('../lib/file')({
			root: PREFIX_FILE,
			workspaceRoot: PREFIX,
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
	 * Orionode does not support "Projects" so we're ignoring this:
	 * http://wiki.eclipse.org/Orion/Server_API/Workspace_API#Actions_on_projects
	 */
});