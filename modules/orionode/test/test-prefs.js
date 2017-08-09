/*******************************************************************************
 * Copyright (c) 2016, 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node, mocha*/
/*eslint-disable no-undef-expression */
var chai = require('chai'),
    assert = require('assert'),
    express = require('express'),
    nodePath = require('path'),
    PrefsController = require('../lib/controllers/prefs').router,
    Promise = require('bluebird'),
    supertest = require('supertest'),
    testData = require('./support/test_data');

var expect = chai.expect,
    fs = Promise.promisifyAll(require('fs')),
    mkdirpAsync = Promise.promisify(require('mkdirp'));

var CONTEXT_PATH = '';
var PREFS_PREFIX = CONTEXT_PATH + '/prefs';
var WORKSPACE_DIR = nodePath.join(__dirname, '.test_workspace');

var samplePrefData = {
	user: {
		foo: {
			bar: 123,
			qux: 'q'
		},
		foo2: false
	},
	zzz: 1
};

var app = express();
var options = {
	workspaceDir: WORKSPACE_DIR
};
app.locals.metastore = require('../lib/metastore/fs/store')(options);
app.locals.metastore.setup(app);
app.use(PREFS_PREFIX, PrefsController(options));

var request = supertest.bind(null, app);

function setupWorkspace(done) {
	Promise.fromCallback(testData.setUp.bind(null, WORKSPACE_DIR))
	.asCallback(done);
}

function setupPrefs(done) {
	var path = nodePath.join(WORKSPACE_DIR, '.orion', PrefsController.PREF_FILENAME);
	mkdirpAsync(nodePath.dirname(path))
	.then(() => fs.writeFileAsync(path, JSON.stringify(samplePrefData)))
	.asCallback(done);
}

describe('Orion preferences tests', function() {
	beforeEach(setupWorkspace);

	/**
	 * Port of Java-specific tests to ensure parity
	 * @since 16.0
	 */
	describe('Core pref tests', function() {
		it('testBug409792', function() {
			return request().put(PREFS_PREFIX + '/testBug409792')
				.type('json')
				.send({ "http://127.0.0.2:8080/plugins/samplePlugin.html": true })
				.expect(204);
		});
		it('testGetSingle', function() {
			return request().get(PREFS_PREFIX + '/user/java?key=Name')
					.expect(404)
					.then(/* @callback */ function(res) {
						return request().put(PREFS_PREFIX + '/user/java')
								.type('json')
								.send({"Name": "Frodo"})
								.expect(204)
								.then(/* @callback */ function(res) {
									return request().get(PREFS_PREFIX + '/user/java?key=Name')
											.expect(200);
								});
					});
		});
		it('testPutSingleString', function() {
			return request().put(PREFS_PREFIX + '/user/java')
					.type('json')
					.send({"Name": "Frodo"})
					.expect(204)
					.then(/* @callback */ function(res) {
						return request().get(PREFS_PREFIX + '/user/java?key=Name')
							.expect(200);
					});
		});
		it('testPutSingleEmpty', function() {
			return request().put(PREFS_PREFIX + '/user/java')
					.type('json')
					.send({"Name": ""})
					.expect(204)
					.then(/* @callback */ function(res) {
						return request().get(PREFS_PREFIX + '/user/java?key=Name')
								.expect(200);
					});
		});
		it('testPutSingleIllegalEncodingChars', function() {
			return request().put(PREFS_PREFIX + '/user/java')
					.type('json')
					.send({"Na=me" : "Fr&do"})
					.expect(204)
					.then(/* @callback */ function(res) {
						return request().get(PREFS_PREFIX + '/user/java?key=Na%3Dme')
								.expect(200)
								.then(function(res) {
									assert(res.text, "There was no text returned in the response");
									var o = JSON.parse(res.text);
									assert(o, "The JSON parse resulted in nothing");
									assert(o["Na=me"], "There is no Na=me entry from the prefs");
									assert.equal(o["Na=me"], "Fr&do", "Na=me did not match Fr&do");
								});
					});
		});
		it('testPutJSON', function() {
			return request().put(PREFS_PREFIX + '/user/java')
					.type('json')
					.send({"properties" : {"foo": true, "bar": false}})
					.expect(204)
					.then(/* @callback */ function(res) {
						return request().get(PREFS_PREFIX + '/user/java?key=properties')
								.expect(200)
								.then(function(res) {
									assert(res.text, "There was no text returned in the response");
									var o = JSON.parse(res.text);
									assert(o, "The JSON parse resulted in nothing");
									assert(o.properties, "There is no property entry from the prefs");
									assert.equal(o.properties.foo, true, "properties.foo did not match what was set");
									assert.equal(o.properties.bar, false, "properties.bar did not match what was set");
								});
					});
		});
		it('testPutNode', function() {
			return request().put(PREFS_PREFIX + '/user/java')
					.type('json')
					.send({"Name" : "Frodo", "Address": "Bag End"})
					.expect(204)
					.then(function() {
						return request().get(PREFS_PREFIX + '/user/java?key=Address')
								.expect(200)
								.then(function(res) {
									assert(res.text, "There was no text in the response");
									var o = JSON.parse(res.text);
									assert(o, "The JSON parse resulted in nothing");
									assert.equal(o["Address"], "Bag End", "The returned address does not match what was set");
									return request().put(PREFS_PREFIX + '/user/java')
											.type('json')
											.send({"Name" : "Barliman", "Occupation": "Barkeep"})
											.expect(204)
											.then(function() {
												return request().get(PREFS_PREFIX + '/user/java')
														.expect(200)
														.then(function(res) {
															assert(res.text, "There was no text returned in the response");
															o = JSON.parse(res.text);
															assert(o, "The JSON parse resulted in nothing");
															assert.equal(o["Name"], "Barliman", "Name should have been updated to Barliman");
															assert(!o["Address"], "Address should have been erased with the disjoint put");
															assert.equal(o["Occupation"], "Barkeep", "Barkeep was not set as Occupation in disjoint put");
														});
											});
								});
					});
		});
		it.skip('testDeleteSingle', function() {
			//skipped in Java tests as well
		});
		it.skip('testDeleteNode', function() {
			//skipped in Java tests as well
		});
		it('testValueWithSpaces', function() {
			return request().put(PREFS_PREFIX + '/user/java')
					.type('json')
					.send({"Name" : "Frodo Baggins"})
					.expect(204)
					.then(function() {
						return request().get(PREFS_PREFIX + '/user/java?key=Name')
								.expect(200)
								.then(function(res) {
									assert(res.text, "There was no text returned in the response");
									var o = JSON.parse(res.text);
									assert(o, "The JSON parse resulted in nothing");
									assert.equal(o["Name"], "Frodo Baggins", "Name should be Frodo Baggins");
								});
				});

		});
		it('testAccessingMetadata - prefs/Users', function() {
			return request().get(PREFS_PREFIX + '/Users')
						.expect(405)
						.then(function() {
							return request().put(PREFS_PREFIX + '/Users')
									.type('json')
									.send({"Name" : "Frodo Baggins"})
									.expect(403);
						});
		});
		it('testAccessingMetadata - prefs/user', function() {
			return request().get(PREFS_PREFIX + '/user')
						.expect(405)
						.then(function() {
							return request().put(PREFS_PREFIX + '/user')
									.type('json')
									.send({"Name" : "Frodo Baggins"})
									.expect(403);
						});
			
		});
		it('testAccessingMetadata - prefs/Workspaces', function() {
			return request().get(PREFS_PREFIX + '/Workspaces')
						.expect(405)
						.then(function() {
							return request().put(PREFS_PREFIX + '/Workspaces')
									.type('json')
									.send({"Name" : "Frodo Baggins"})
									.expect(403);
						});
		});
		it('testAccessingMetadata - prefs/workspace', function() {
			return request().get(PREFS_PREFIX + '/workspace')
						.expect(405)
						.then(function() {
							return request().put(PREFS_PREFIX + '/workspace')
									.type('json')
									.send({"Name" : "Frodo Baggins"})
									.expect(403);
						});
		});
		it('testAccessingMetadata - prefs/Projects', function() {
			return request().get(PREFS_PREFIX + '/Projects')
						.expect(405)
						.then(function() {
							return request().put(PREFS_PREFIX + '/Projects')
									.type('json')
									.send({"Name" : "Frodo Baggins"})
									.expect(403);
						});
		});
		it('testAccessingMetadata - prefs/project', function() {
			return request().get(PREFS_PREFIX + '/project')
						.expect(405)
						.then(function() {
							return request().put(PREFS_PREFIX + '/project')
									.type('json')
									.send({"Name" : "Frodo Baggins"})
									.expect(403);
						});
		});
		it('testGetNode - /prefs/user/<userid>/testprefs');
		it('testGetNode - /prefs/workspace/<workspaceid>/testprefs');
		it('testGetNode - /prefs/project/<workspaceid>/<projectname>/testprefs');
	});
	describe('when NO prefs.json exists', function() {
		describe('and we GET a nonexistent single key', function() {
			it('should receive 404', function() {
				return request().get(PREFS_PREFIX + '/user/a/b/c?key=jsjsijf')
				.expect(404);
			});
		});
		describe('and we GET a nonexistent node', function() {
			it('should receive empty node', function() {
				return request().get(PREFS_PREFIX + '/user/a/b/c')
				.expect(200)
				.then(function(res) {
					expect(res.body).to.deep.equal({ });
				});
			});
		});
	});

	describe('when prefs.json exists', function() {
		beforeEach(setupPrefs);

		describe('and we GET a nonexistent single key', function() {
			it('should receive 404', function() {
				return request().get(PREFS_PREFIX + '/user/a/b/c?key=jsjsijf')
				.expect(404);
			});
		});
		describe('and we GET a nonexistent node', function() {
			it('should receive empty node', function() {
				return request().get(PREFS_PREFIX + '/user/a/b/c')
				.expect(200)
				.then(function(res) {
					expect(res.body).to.deep.equal({ });
				});
			});
		});

		describe('and we GET a single key', function() {
			it('should receive just that property', function() {
				return request().get(PREFS_PREFIX + '/user/foo?key=bar').expect(200)
				.then(function(res) {
					expect(res.body).to.deep.equal({ bar: 123 });
				});
			});
		});
		describe('and we GET a node', function() {
			it('should receive the entire node', function() {
				return request().get(PREFS_PREFIX + '/user/foo').expect(200)
				.then(function(res) {
					expect(res.body).to.deep.equal({ bar: 123, qux: 'q' });
				});
			});
		});

		describe('and we PUT a single key', function() {
			beforeEach(function() {
				return request().put(PREFS_PREFIX + '/user/foo')
				.type('form')
				.send({ key: 'bar' }).send({ value: 'modified' })
				.expect(204);
			});

			it('should update the value', function(finished) {
				// Check the value
				setTimeout(function() {
					request().get(PREFS_PREFIX + '/user/foo').expect(200)
					.then(function(res) {
						expect(res.body).to.deep.equal({ bar: 'modified', qux: 'q' });
						finished();
					});
				}, 10);
			});
		});

		describe('and we PUT an entire node', function() {
			beforeEach(function() {
				return request().put(PREFS_PREFIX + '/user/foo')
				.type('json')
				.send({ howdy: 'partner' })
				.expect(204);
			});

			it('should update the value', function(finished) {
				setTimeout(function() {
					request().get(PREFS_PREFIX + '/user/foo').expect(200)
					.then(function(res) {
						expect(res.body).to.deep.equal({ howdy: 'partner' });
						finished();
					});
				}, 10);
			});
		});

		describe('and we DELETE a single key', function() {
			beforeEach(function() {
				return request().delete(PREFS_PREFIX + '/user/foo?key=bar')
				.expect(204);
			});
			it('should not have the deleted key', function(finished) {
				setTimeout(function() {
					request().get(PREFS_PREFIX + '/user/foo?key=bar')
					.expect(404).end(/* @callback */ function(err, res) {
						assert.ifError(err);
						finished();
					});
				}, 10);
			});
		});

		describe('and we DELETE entire node', function() {
			beforeEach(function() {
				return request().delete(PREFS_PREFIX + '/user/foo')
				.expect(204);
			});

			it('should be empty', function(finished) {
				setTimeout(function() {
					// Node should be empty
					request().get(PREFS_PREFIX + '/user/foo').expect(200)
					.then(function(res) {
						expect(res.body).to.deep.equal({ });
						finished();
					});
				}, 10);
			});
		});

		describe('and we DELETE a non-existent node', function() {
			beforeEach(function() {
				return request().delete(PREFS_PREFIX + '/user/foo/asgjsgkjkjtiwujk')
				.expect(204);
			});
			it('should have no effect', function() {
				return request().get(PREFS_PREFIX + '/').expect(200)
				.then(function(res) {
					expect(res.body).to.deep.equal(samplePrefData);
				});
			});
		});
	});

});