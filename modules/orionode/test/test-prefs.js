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
app.use(/* @callback */ function(req, res, next) {
	req.user = { workspaceDir: WORKSPACE_DIR };
	next();
})
.use(PREFS_PREFIX, PrefsController({
	configParams: {
		'orion.single.user': false, // use workspaceDir from req.user
	},
	ttl: 50, // flush after 50 ms
}));

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

describe('prefs', function() {
	beforeEach(setupWorkspace);

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
					.expect(404).end(function(err, res) {
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