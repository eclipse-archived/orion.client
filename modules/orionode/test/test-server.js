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
/*eslint-env node, mocha*/
var assert = require("assert");
var express = require("express");
var supertest = require("supertest");
var orionMiddleware = require("../index");
var path = require("path");
var testData = require("./support/test_data");

var WORKSPACE = path.join(__dirname, ".test_workspace");

var orion = function(options) {
	// Ensure tests run in 'single user' mode
	options = options || {};
	options.workspaceDir = WORKSPACE;
	options.configParams = { "orion.single.user": true };
	return orionMiddleware(options);
}

/**
 * @callback
 */
var userMiddleware = function(req, res, next) {
	req.user = {workspaceDir: WORKSPACE};
	next();
};

describe("orion", function() {
	var app, request;
	beforeEach(function(done) {
		app = express();
		request = supertest.bind(null, app);
		testData.setUp(WORKSPACE, done);
	});

	describe("options", function() {
		it("demands workspaceDir", function(done) {
			try {
				assert.throws(orionMiddleware.bind(null));
			} catch (e) {
					done(e);
			}
			done();
		});

		it("accepts cache-max-age", function(done) {
			app.use(userMiddleware)
			.use(orion({
				maxAge: 31337 * 1000 // ms
			}));
			request()
			.get("/index.html")
			.expect("cache-control", /max-age=31337/, done); //seconds
		});
	});

	describe("middleware", function() {
		beforeEach(function() {
			app.use(userMiddleware);
		});

		// Make sure that we can .use() the orion server as an Express middleware
		it("exports #createServer", function(done) {
			app.use(orion({ }));
			request()
			.get("/workspace")
			.expect(200, done);
		});

		// Sanity check to ensure the orion client code is being mounted correctly
		it("finds the orion.client code", function(done) {
			app.use(orion({ }));
			request()
			.get("/index.html")
			.expect(200, done);
		});

		it("works at a non-server-root route", function(done) {
			app.use("/wow/such/orion", orion({ }));
			request()
			.get("/wow/such/orion/index.html")
			.expect(200, done);
		});
	});
});
