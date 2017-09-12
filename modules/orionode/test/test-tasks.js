/******************************************************************************
 * Copyright (c) 2017 Remy Suen and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     Remy Suen - initial API and implementation
 *     IBM Corporation Inc. - additional tests
 *****************************************************************************/
/*eslint-env node, mocha, assert, express*/
var assert = require('assert'),
	express = require('express'),
	supertest = require('supertest'),
	tasks = require('../lib/tasks'),
	path = require("path"),
	testData = require("./support/test_data"),
	testHelper = require("./support/testHelper"),
	store = require('../lib/metastore/fs/store'),
	taskHelper = require('./support/task_helper');

var CONTEXT_PATH = '',
	MEATASTORE =  path.join(__dirname, '.test_metadata'),
	WORKSPACE = path.join(__dirname, '.test_workspace'),
	taskIds = [],
	configParams = {
		"orion.single.user": true,
		"orion.single.user.metaLocation": MEATASTORE
	};

var app = express();
	app.locals.metastore = store({workspaceDir: WORKSPACE, configParams: configParams});
	app.locals.metastore.setup(app);
	app.use(CONTEXT_PATH + '/taskHelper', taskHelper.router({
		root: '/taskHelper',
		metastore: app.locals.metastore
	}))
	.use(CONTEXT_PATH + '/task', tasks.router({
		taskRoot: CONTEXT_PATH + '/task',
		metastore: app.locals.metastore
	}));

var request = supertest.bind(null, app);

describe("Tasks API", function() {
	beforeEach(function(done) {
		//clean up done tasks before each test
		request()
			.del(CONTEXT_PATH + "/task")
			.expect(200)
			.end(function(err, res) {
				testData.setUp(WORKSPACE, function(){
					testData.setUpWorkspace(WORKSPACE, MEATASTORE, done);
				}, false);
		});
	});
	afterEach("Remove Workspace and Metastore", function(done) {
		testData.tearDown(WORKSPACE, function(){
			testData.tearDown(path.join(MEATASTORE, '.orion'), function(){
				testData.tearDown(MEATASTORE, done)
			})
		});
	});
	/**
	 * From: org.eclipse.orion.server.tests.tasks.TaskStoreTest.java
	 */
	describe("task store tests", function() {
		it("testRead", function(done) {
			request()
				.put(CONTEXT_PATH + "/taskHelper")
				.end(function(err, res) {
					assert.ifError(err);
					var taskLoc = res.body.Location;
					//now fetch it
					request()
						.get(taskLoc)
						.expect(200)
						.end(function(err, res) {
							testHelper.throwIfError(err);
							assert(res.body && res.body.type === "loadstart", "We should have been able to fetch the created task.")
							//mark the task done so it will be removed
							request()
								.post(path.join(CONTEXT_PATH, '/taskHelper', path.basename(taskLoc)))
								.expect(200)
								.end(done)
						});
				});
		});
		it("readAllTasksTest", function(done) {
			//create a couple of tasks
			request()
				.put(CONTEXT_PATH + "/taskHelper")
				.end(function(err, res) {
					assert.ifError(err);
					//mark it done
					var taskLoc1 = res.body.Location;
					//create a second task
					request()
						.put(CONTEXT_PATH + "/taskHelper")
						.end(function(err, res) {
							assert.ifError(err);
							var taskLoc2 = res.body.Location;
									//ask for all of them
							request()
								.get('/task/count')
								.expect(200)
								.end(function(err, res) {
									testHelper.throwIfError(err);
									assert(res && res.body, "We should have gotten a response");
									assert.equal(res.body.count, 2, "Got the wrong number of tasks back");
									//mark the tasks done
									request()
										.post(path.join(CONTEXT_PATH, '/taskHelper', path.basename(taskLoc1)))
										.expect(200)
										.end(function(err, res) {
											testHelper.throwIfError(err);
											request()
												.post(path.join(CONTEXT_PATH, '/taskHelper', path.basename(taskLoc2)))
												.expect(200)
												.end(done)
										});
								});
						});
				});
		});
	});
	describe('delete all completed tasks', function(done) {
		it('no tasks at all', function(finished) {
			// delete all the tasks
			request()
				.del(CONTEXT_PATH + "/task")
				.expect(200)
				.end(function(err, res) {
					assert.ifError(err);
					// there were no tasks to begin with
					assert.equal(res.body.length, 0);
					finished();
				});
		});

		it('one running task', function(finished) {
			// create a task
			request()
				.put(CONTEXT_PATH + "/taskHelper")
				.end(function(err, res) {
					assert.ifError(err);
					var location = res.body.Location;
					// delete all completed tasks
					request()
						.del(CONTEXT_PATH + "/task")
						.expect(200)
						.end(function(err, res) {
							assert.ifError(err);
							// original task incomplete, still alive
							assert.equal(res.body.length, 1);
							assert.equal(res.body[0], location);

							// mark test task as completed
							request()
								.post(CONTEXT_PATH + "/taskHelper/" + location.substr(5))
								.expect(200)
								.end(function(err, res) {
									assert.ifError(err);

									// delete all completed tasks
									request()
										.del(CONTEXT_PATH + "/task")
										.expect(200)
										.end(function(err, res) {
											assert.ifError(err);
											// marked test task should not exist anymore
											assert.equal(res.body.length, 0);
											finished();
										});
								});
						});
				});
		});

		it('one running task, one completed', function(finished) {
			// spawn a running task
			request()
				.put(CONTEXT_PATH + "/taskHelper")
				.end(function(err, res) {
					assert.ifError(err);
					var location = res.body.Location;
					taskIds.push(location);
					// spawn a second running task
					request()
						.put(CONTEXT_PATH + "/taskHelper")
						.end(function(err, res) {
							assert.ifError(err);
							var location2 = res.body.Location;
							taskIds.push(location2);
							// mark the first one as completed
							request()
								.post(CONTEXT_PATH + "/taskHelper/" + location.substr(5))
								.expect(200)
								.end(function(err, res) {
									assert.ifError(err);
									// check that the second running task is still there after deletion
									request()
										.del(CONTEXT_PATH + "/task")
										.expect(200)
										.end(function(err, res) {
											assert.ifError(err);
											assert.equal(res.body.length, 1);
											assert.equal(res.body[0], location2);
											finished();
										});
								});
						});
				});
		});

		it('one running task, one canceled', function(finished) {
			// spawn a running task
			request()
				.put(CONTEXT_PATH + "/taskHelper")
				.end(function(err, res) {
					assert.ifError(err);
					var location = res.body.Location;
					taskIds.push(location);
					// spawn a second running task
					request()
						.put(CONTEXT_PATH + "/taskHelper")
						.end(function(err, res) {
							assert.ifError(err);
							var location2 = res.body.Location;
							taskIds.push(location2);
							// mark the first one as completed
							request()
								.post(CONTEXT_PATH + "/taskHelper/" + location.substr(5))
								.expect(200)
								.end(function(err, res) {
									assert.ifError(err);
									// check that the second running task is still there after deletion
									request()
										.put(CONTEXT_PATH + location2)
										.send({"abort": true})
										.expect(200)
										.end(function(err, res) {
											request()
											.get(location2)
											.expect(200)
											.end(function(err, res) {
												testHelper.throwIfError(err);
												assert(res.body && res.body.type === "abort", "We should have been able to fetch the created task.")
												finished();
											});
										});
								});
						});
				});
		});
	});
});
