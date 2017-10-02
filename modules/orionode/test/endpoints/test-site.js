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
var assert = require('assert'),
	express = require('express'),
	path = require('path'),
	fs = require('fs'),
	supertest = require('supertest'),
	store = require('../../lib/metastore/fs/store'),
	testData = require('../support/test_data'),
	testHelper = require('../support/testHelper'),
	sites = require('../../lib/sites');

var CONTEXT_PATH = '',
	MEATASTORE =  path.join(__dirname, '.test_metadata'),
	WORKSPACE_ID = "anonymous-OrionContent",
	configParams = { "orion.single.user": true, "orion.sites.save.running": false, "orion.single.user.metaLocation": MEATASTORE},
	PREFIX = CONTEXT_PATH + '/site/' + WORKSPACE_ID,
	WORKSPACE = path.join(__dirname, '.test_workspace');

var app = express();
var	options = {workspaceDir: WORKSPACE, configParams:configParams};
	app.locals.metastore = store(options);
	options.app = app;
	app.locals.metastore.setup(options);
	app.use(options.authenticate);
	
	app.use(CONTEXT_PATH + '/site', sites({configParams: configParams, workspaceRoot: CONTEXT_PATH + '/workspace'}))
var request = supertest.bind(null, app);

/**
 * @description create a new mapping for a site configuration
 * @param {*} from Where the mapping originates from
 * @param {*} to Where the mapping should point to
 */
function createMapping(from, to) {
	return {Source: from, Target: to};
}

/**
 * @description Creates a group of mappings. The arrays must be the same length, or an excpetion is thrown
 * @param {*} froms The From locations
 * @param {*} tos The To locations
 */
function makeMappings(froms, tos) {
	assert.equal(froms.length, tos.length, "The mapping arrays are not the same length");
	var mappings = [];
	for(var i = 0, len = froms.length; i<len; i++) {
		mappings.push({Source: froms[i], Target: tos[i]});
	}
	return mappings;
}

/**
 * @description Helper method to create a site
 * @param {*} siteName The name of the site
 * @param {*} mappings The resource mappings to use in the site
 * @param {*} hostHint The host hint name
 * @returns {Promise}
 */
function createSite(siteName, mappings, hostHint, workspace) {
	var ws = workspace === undefined ? WORKSPACE_ID : workspace
	var json = {Workspace: ws, HostHint: hostHint, Mappings: mappings};
	return request()
		.post('/site')
		.set('Orion-Version', 1)
		.set('Slug', siteName)
		.type('json')
		.send(json)
}

/**
 * @description Used to update a site or to ping it for status
 * @param {*} uri The location of the running site
 * @param {*} siteName The name of the running site
 * @param {*} mappings The mappings
 * @param {*} hostHint The host hint
 * @param {*} hostingStatus The status object
 * @returns {Promise}
 */
function updateSite(uri, siteName, mappings, hostHint, hostingStatus, user, pw) {
	var json = {Name: siteName, Workspace: WORKSPACE_ID, Mappings: mappings, HostHint: hostHint, HostingStatus: hostingStatus};
	var req = request().put(uri);
	if(user && pw) {
		req.set('Authorization', 'Basic '+ String(user +':'+pw));
	}
	return req
			.set('Orion-Version', 1)
			.type('json')
			.send(json);
}

/**
 * @description Start the site at the given locaiton, optionally with the a username and password
 * @param {*} siteLocation 
 * @param {*} user 
 * @param {*} pw 
 */
function startSite(siteLocation, user, pw) {
	return updateSite(siteLocation, null, null, null, {Status: "started"}, user, pw);
}
/**
 * @description Stop the site at the given locaiton, optionally with the a username and password
 * @param {*} siteLocation 
 * @param {*} user 
 * @param {*} pw 
 */
function stopSite(siteLocation, user, pw) {
	return updateSite(siteLocation, null, null, null, {Status: "stopped"}, user, pw);
}

/**
 * @description Delete the given site
 * @param {*} siteLocation 
 * @param {*} user 
 * @param {*} pw 
 */
function deleteSite(siteLocation, user, pw) {
	var req = request().delete(siteLocation);
	if(user && pw) {
		req.set('Authorization', 'Basic '+ String(user +':'+pw));
	}
	return req
			.set('Orion-Version', 1);
}
/**
 * @description Fetch a site with the given name
 * @param {*} siteName 
 * @param {*} user 
 * @param {*} pw 
 */
function getSite(siteName, user, pw) {
	var req = request().get('/site/'+siteName);
	if(user && password) {
		req.set('Authorization', 'Basic '+ String(user +':'+pw));
	}
	return req.set('Orion-Version', 1);
}

/**
 * @description Fetch all sites
 * @param {*} user 
 * @param {*} pw 
 */
function getAllSites(user, pw) {
	var req = request().get('/site/');
	if(user && password) {
		req.set('Authorization', 'Basic '+ String(user +':'+pw));
	}
	return req.set('Orion-Version', 1);
}
// Like `assert.ifError` but allows the message to be overridden
function throwIfError(cause, message) {
	if (!cause || !cause instanceof Error && Object.prototype.toString.call(cause) !== '[object Error]' && cause !== 'error') {
		return;
	}
	var err = new Error(message + ": " + cause.message);
	err.cause = cause;
	throw err;
}
describe("Site endpoint", function() {
	beforeEach(function(done) { // testData.setUp.bind(null, parentDir)
		testData.setUp(WORKSPACE, function(){
			testData.setUpWorkspace(WORKSPACE, MEATASTORE, done);
		});
	});
	afterEach("Remove .test_workspace", function(done) {
		testData.tearDown(testHelper.WORKSPACE, function(){
			testData.tearDown(path.join(MEATASTORE, '.orion'), function(){
				testData.tearDown(MEATASTORE, done)
			})
		});
	});

	after("Clean up", function(done) {
		//stop and remove all sites
		getAllSites()
			.expect(200)
			.end(function(err, res) {
				assert(res.body, "There should have been a body returned");
				if(Array.isArray(res.body.SiteConfigurations)) {
					var configs = res.body.SiteConfigurations;
					configs.forEach(function(config) {
						if(config.HostingStatus && config.HostingStatus.Status && config.HostingStatus.Status !== "stopped") {
							//we have to stop the site first
							stopSite(config.Location)
								.expect(200)
								.end(function(err, res) {
									throwIfError(err)
									deleteSite(config.Location)
										.expect(200)
										.end(function(err, res) {
											throwIfError(err);
										});
								});
						} else {
							deleteSite(config.Location)
								.expect(200)
								.end(function(err, res) {
									throwIfError(err);
									assert(res.statusCode === 200, "Should have deleted site");
							});
						}
					});
				}
			});
			testData.tearDown(testHelper.WORKSPACE, done);
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.site.SiteHostingService.java
	 */
	describe("Site tests", function() {
		it("testCreateSite", function(done) {
			var mappings = makeMappings(["/"], ["/A/bogusWorkspacePath"]);
			createSite("testCreateSite", mappings, "empty")
				.expect(201)
				.end(function(err, res) {
					throwIfError(err);
					assert(res, 'There should have been a response');
					assert(res.statusCode === 201, "The site should have been created");
					assert(res.body, "There should have been a body result");
					assert(res.body.Location, "There should be a location in the result");
					done();
				}, function reject(err) {
					done(err);
				});
		});
		it("testCreateSiteNoName", function(done) {
			var mappings = makeMappings(["/"], ["/A/bogusWorkspacePath"]);
			createSite(null, mappings, "empty", null)
				.expect(201) //TODO this is spec'd to return 400
				.end(function(err, res) {
					throwIfError(err);
					assert(res, 'There should have been a response');
					assert(res.statusCode === 201, "The site should have been created");
					assert(res.body, "There should have been a body result");
					assert(res.body.Location, "There should be a location in the result");
					done();
				}, function reject(err) {
					done(err);
				});
		});
		it("testCreateSiteNoNameNoMappings", function(done) {
			var mappings = makeMappings(["/"], ["/A/bogusWorkspacePath"]);
			createSite(null, null, "empty", null)
				.expect(201)
				.end(function(err, res) {
					throwIfError(err);
					assert(res, 'There should have been a response');
					assert(res.statusCode === 201, "The site should have been created");
					assert(res.body, "There should have been a body result");
					assert(res.body.Location, "There should be a location in the result");
					done();
				}, function reject(err) {
					done(err);
				});
		});
		it("testCreateSiteNoWorkspace", function(done) {
			var mappings = makeMappings(["/"], ["/A/bogusWorkspacePath"]);
			createSite("testCreateSiteNoWorkspace", mappings, "empty", null)
				.expect(201) //TODO this is spec'd to return 400
				.end(function(err, res) {
					throwIfError(err);
					assert(res, 'There should have been a response');
					assert(res.statusCode === 201, "The site should have been created");
					assert(res.body, "There should have been a body result");
					assert(res.body.Location, "There should be a location in the result");
					done();
				}, function reject(err) {
					done(err);
				});
		});
		it("testRetrieveAllSites", function(done) {
			getAllSites()
				.expect(200)
				.end(function(err, res) {
					throwIfError(err);
					assert(res.body, "There should have been a body returned");
					assert(Array.isArray(res.body.SiteConfigurations), "There should be sites");
					done();
				}, function reject(err) {
					done(err);
				});
		});
		it("testRetrieveSite", function(done) {
			createSite("testRetrieveSite", null, "empty")
				.expect(201)
				.end(function(err, res) {
					throwIfError(err);
					getSite(res.body.Location)
						.expect(200)
						.end(function(err, res)  {
							assert(res.body, "There should have been a body returned");
							done();
						}, function reject(err) {
							done(err);
						});
				});
		});
		it("testUpdateSite", function(done) {
			var mappings = makeMappings(["/"], ["/A/bogusWorkspacePath"]);
			createSite("testUpdateSite", mappings, "empty", null)
				.expect(201) //TODO this is spec'd to return 400
				.end(function(err, res) {
					throwIfError(err);
					request()
						.put(res.body.Location)
						.type('json')
						.send({Name: "renamedSiteName", Mappings: makeMappings(["/"], ["/somethingelse"]), Workspace: "someFakeWorkspace", HostingHint: "nolongerEmpty"})
						.expect(200)
						.end(function(err, res) {
							throwIfError(err);
							done();
						});
				});
		});
		it("testDeleteSite", function(done) {
			createSite("deleteMe", null, "deletable")
				.expect(201)
				.end(function(err, res) {
					throwIfError(err);
					deleteSite(res.body.Location)
					.expect(200)
					.end(function(err, res)  {
						throwIfError(err)
						done();
					});
				});
		});
		it.skip("testDisallowedAccess");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.site.HostingTest.java
	 */
	describe("Hosting tests", function() {
		it.skip("testStartSite", function(done) {
			var mappings = makeMappings(["/"], ["/A/bogusWorkspacePath"]);
			createSite("testStartSite", mappings, "empty")
				.expect(201)
				.end(function(err, res) {
					throwIfError(err);
					startSite(res.body.Location)
						.expect(200)
						.end(function(err, res) {
							throwIfError(err);
							done();
						});
				});
		});
		it.skip("testStartSiteNoMappings", function(done) {
			createSite("testStartSiteNoMappings", null, "empty")
				.expect(201)
				.end(function(err, res) {
					throwIfError(err);
					startSite(res.body.Location)
						.expect(200)
						.end(function(err, res) {
							throwIfError(err);
							done();
						});
				});
		});
		it.skip("testStopSite", function(done) {
			createSite("stop site", null, "empty")
				.expect(201)
				.end(function(err, res) {
					throwIfError(err);
					startSite(res.body.Location)
						.expect(200)
						.end(function(err, res) {
							throwIfError(err);
							stopSite(res.body.Location)
								.expect(200)
								.end(done);
						});
				});
		});
		it("testSiteAccess");
		it("testSiteFileMime");
		it("testDisallowedSiteAccess");
		it("testRemoteProxyRequest");
		it("testRemoteProxyRequestPathEncoding");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.site.SiteHostingService.java
	 */
	describe("Site hosting service tests", function() {
		it("testSiteHostingConfigParsing");
		it("testSiteHostingServiceStart");
		it("testSiteHostingServiceStartHostnameTaken");
		it("testSiteHostingServiceMatchesVirtualHost");
	});
});