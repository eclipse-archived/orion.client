/******************************************************************************
 * Copyright (c) 2017 Remy Suen and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     Remy Suen - initial API and implementation
 *****************************************************************************/
/*eslint-env node, mocha, assert, express*/
var assert = require('assert');
var express = require('express');
var supertest = require('supertest');
var tasks = require('../lib/tasks');

var CONTEXT_PATH = '';
var username = "testUser" + Date.now();
var taskIds = [];

var app = express()
.use(/* @callback */ function(req, res, next) {
	req.user = { username: username };
	next();
})
.use(CONTEXT_PATH + '/taskHelper', require('./support/task_helper').router({
	root: '/taskHelper',
	singleUser: true
}))
.use(CONTEXT_PATH + '/task', tasks.router({
	taskRoot: CONTEXT_PATH + '/task',
	singleUser: true
}));

var request = supertest.bind(null, app);

describe("Tasks API", function() {
	beforeEach(function() {
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
	});
}); // describe("Tasks API")
