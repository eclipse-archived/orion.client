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
var path = require('path');
var testData = require('./support/test_data');

var WORKSPACE = path.join(__dirname, '.test_workspace');

var orion = require('../');

describe('orionode', function() {
	var app;
	beforeEach(function(done) {
		app = testData.createApp();
		testData.setUp(WORKSPACE, done);
	});

	// Make sure that we can .use() the orion server as a connect module.
	it('exports #createServer', function(done) {
		app.use(orion({
			workspaceDir: WORKSPACE
		}))
		.request()
		.get('/file/project/fizz.txt')
		.expect(200, 'hello world', done);
	});

	// Sanity check to ensure the orion client code is being mounted correctly
	it('finds the orion.client code', function(done) {
		app.use(orion({
			workspaceDir: WORKSPACE
		}))
		.request()
		.get('/index.html')
		.expect(200)
		.end(function(err, res) {
			assert.ifError(err);
			done();
		});
	});

	// TODO: Ensure server respects command line args passed to it
//	it('respects -w argument', function(done) {
//		
//	});

});