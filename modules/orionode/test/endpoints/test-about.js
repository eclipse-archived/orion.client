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
var	assert = require('assert'),
testData = require("../support/test_data"),
testHelper = require('../support/testHelper');

var CONTEXT_PATH = testHelper.CONTEXT_PATH,
    PREFIX = CONTEXT_PATH + '/about';

var request = testData.setupOrionServer();

describe("About endpoint", function() {
    it("testAbout", function(done) {
        request()
            .get(PREFIX)
            .expect(200)
            .end(function(err, res) {
                testHelper.throwIfError(err);
                assert(res.body, "There sould be a body in the response.");
                done();
            });
    });
    it("testAbout/about", function(done) {
        request()
            .get(PREFIX+PREFIX)
            .expect(200)
            .end(function(err, res) {
                testHelper.throwIfError(err);
                assert(res.body, "There sould be a body in the response.");
                done();
            });
    });
    it("testAbout.html", function(done) {
        request()
            .get(PREFIX+'.html')
            .expect(404, done);
    });
    it("testAbout/about.html", function(done) {
        request()
            .get(PREFIX+PREFIX+'/html')
            .expect(200)
            .end(function(err, res) {
                testHelper.throwIfError(err);
                assert(res.body, "There sould be a body in the response.");
                done();
            });
    });
});
