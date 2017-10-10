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
var assert = require("assert"),
	path = require("path"),
	apps = require("../../lib/cf/apps"),
	testData = require("../support/test_data"),
	testHelper = require('../support/testHelper');

var CONTEXT_PATH = testHelper.CONTEXT_PATH,
	WORKSPACE = testHelper.WORKSPACE,
	MEATASTORE =  testHelper.METADATA,
	PREFIX_CF = CONTEXT_PATH + "/cfapi",
	MANIFESTS = "/manifests",
	PREFIX_MANIFESTS = PREFIX_CF + MANIFESTS,
	TASK_PREFIX = CONTEXT_PATH + '/task',
	PREFIX_FILE = CONTEXT_PATH + '/file';

var request = testData.setupOrionServer();

/**
 * Renames the file with the given full /file path to 'manifest.yml' so the endpoint will read it
 * @param {?} request The original request
 * @param {string} filePath The full /file path of the file to rename
 */
function getTestFile(request, filePath) {
	return request()
		.post(path.dirname(filePath))
		.type('json')
		.set('X-Create-Options', "copy,overwrite")
		.set('Slug', 'manifest.yml')
		.send({Location: filePath})
		.expect(function(res) {
			if(res.statusCode !== 200 && res.statusCode !== 201) {
				throw new Error("Test file was not moved successfully");
			}
		});
}

describe("CloudFoundry apps", function() {
	beforeEach(function(done) {
		testData.setUp(WORKSPACE, function() {
			testData.setUpWorkspace(request, function() {
				testData.setUpCF(WORKSPACE, done);
			});
		}, false);
	});
	afterEach("Remove Workspace and Metastore", function(done) {
		testData.tearDown(WORKSPACE, function(){
			testData.tearDown(path.join(MEATASTORE, '.orion'), function(){
				testData.tearDown(MEATASTORE, done);
			});
		});
	});
	it("testBadInstantiate", function() {
		try {
			apps.router({});
		} catch(err) {
			assert.equal("options.fileRoot is required", err.message, "The fileRoot error mesaages are not the same");
		}
	});
	it("testGetApp - name only", function(done) {
		request()
			.get(path.join(PREFIX_CF, "apps"))
			.query({Name: 'myapp'})
			.expect(202)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				request()
					.get(res.body.Location)
					.expect(200)
					.end(function(err, res) {
						testHelper.throwIfError(err);
						assert(res.body.Result, "There should have been a result");
						assert.equal(res.body.Result.HttpCode, 500, "Should have gotten a 500");
						done();
					});
			});
	});
});