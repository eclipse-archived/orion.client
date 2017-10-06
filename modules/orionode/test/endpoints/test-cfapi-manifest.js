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
	testData = require("../support/test_data"),
	testHelper = require('../support/testHelper');

var CONTEXT_PATH = testHelper.CONTEXT_PATH,
	WORKSPACE = testHelper.WORKSPACE,
	MEATASTORE =  testHelper.METADATA,
	PREFIX_CF = "/cfapi",
	MANIFESTS = "/manifests",
	PREFIX_MANIFESTS = CONTEXT_PATH + PREFIX_CF + MANIFESTS,
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

describe("CloudFoundry manifest", function() {
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
	/**
	 * From: org.eclipse.orion.server.tests.cf.ManifestParserTest.java
	 */
	describe("Manifest parser tests", function() {
		it("testSimpleTwoApps", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					var wLoc = res.body.Location;
					request()
						.get(path.join(res.body.ContentLocation, "cftests", "simpleTwoApps.yml"))
						.expect(200)
						.query({parts: 'meta'})
						.end(function(err, res) {
							testHelper.throwIfError(err);
							var fLoc = res.body.Location;
							getTestFile(request, fLoc)
							.end(function(err, res) {
								testHelper.throwIfError(err);
								request()
									.get(path.join(PREFIX_MANIFESTS, res.body.Location))
									.query({Strict: true})
									.expect(200)
									.end(function(err, res) {
										testHelper.throwIfError(err);
										assert(res.body.Contents);
										assert.equal(res.body.Type, "Manifest", "The manifest should have been parsed as type 'Manifest'")
										done();
									});
							});
						})
				});
		});
		it("testSimpleGlobalProps", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					var wLoc = res.body.Location;
					request()
						.get(path.join(res.body.ContentLocation, "cftests", "simpleGlobalProps.yml"))
						.expect(200)
						.query({parts: 'meta'})
						.end(function(err, res) {
							testHelper.throwIfError(err);
							var fLoc = res.body.Location;
							getTestFile(request, fLoc)
							.end(function(err, res) {
								testHelper.throwIfError(err);
								request()
									.get(path.join(PREFIX_MANIFESTS, res.body.Location))
									.query({Strict: true})
									.expect(200)
									.end(function(err, res) {
										testHelper.throwIfError(err);
										assert(res.body.Contents);
										assert.equal(res.body.Type, "Manifest", "The manifest should have been parsed as type 'Manifest'")
										done();
									});
							});
						})
				});
		});
		it("testAppCustomConfig", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					var wLoc = res.body.Location;
					request()
						.get(path.join(res.body.ContentLocation, "cftests", "appCustomConfig.yml"))
						.expect(200)
						.query({parts: 'meta'})
						.end(function(err, res) {
							testHelper.throwIfError(err);
							var fLoc = res.body.Location;
							getTestFile(request, fLoc)
							.end(function(err, res) {
								testHelper.throwIfError(err);
								request()
									.get(path.join(PREFIX_MANIFESTS, res.body.Location))
									.query({Strict: true})
									.expect(200)
									.end(function(err, res) {
										testHelper.throwIfError(err);
										assert(res.body.Contents);
										assert.equal(res.body.Type, "Manifest", "The manifest should have been parsed as type 'Manifest'")
										done();
									});
							});
						})
				});
		});
		it("testGlobalAndInherit", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					var wLoc = res.body.Location;
					request()
						.get(path.join(res.body.ContentLocation, "cftests", "globalAndInherit.yml"))
						.expect(200)
						.query({parts: 'meta'})
						.end(function(err, res) {
							testHelper.throwIfError(err);
							var fLoc = res.body.Location;
							getTestFile(request, fLoc)
							.end(function(err, res) {
								testHelper.throwIfError(err);
								request()
									.get(path.join(PREFIX_MANIFESTS, res.body.Location))
									.query({Strict: true})
									.expect(200)
									.end(function(err, res) {
										testHelper.throwIfError(err);
										assert(res.body.Contents);
										assert.equal(res.body.Type, "Manifest", "The manifest should have been parsed as type 'Manifest'")
										done();
									});
							});
						})
				});
		});
		it("testSimpleGlobals", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					var wLoc = res.body.Location;
					request()
						.get(path.join(res.body.ContentLocation, "cftests", "simpleGlobal.yml"))
						.expect(200)
						.query({parts: 'meta'})
						.end(function(err, res) {
							testHelper.throwIfError(err);
							var fLoc = res.body.Location;
							getTestFile(request, fLoc)
							.end(function(err, res) {
								testHelper.throwIfError(err);
								request()
									.get(path.join(PREFIX_MANIFESTS, res.body.Location))
									.query({Strict: true})
									.expect(200)
									.end(function(err, res) {
										testHelper.throwIfError(err);
										assert(res.body.Contents);
										assert.equal(res.body.Type, "Manifest", "The manifest should have been parsed as type 'Manifest'")
										done();
									});
							});
						})
				});
		});
		it("testAppsWithNestedServices", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					var wLoc = res.body.Location;
					request()
						.get(path.join(res.body.ContentLocation, "cftests", "appsNestedServices.yml"))
						.expect(200)
						.query({parts: 'meta'})
						.end(function(err, res) {
							testHelper.throwIfError(err);
							var fLoc = res.body.Location;
							getTestFile(request, fLoc)
								.end(function(err, res) {
									testHelper.throwIfError(err);
									request()
										.get(path.join(PREFIX_MANIFESTS, res.body.Location))
										.query({Strict: true})
										.expect(200)
										.end(function(err, res) {
											testHelper.throwIfError(err);
											assert(res.body.Contents);
											assert.equal(res.body.Type, "Manifest", "The manifest should have been parsed as type 'Manifest'")
											done();
										});
								});
						})
				});
		});
		it("testMultiAppsWithNestedServices", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					var wLoc = res.body.Location;
					request()
						.get(path.join(res.body.ContentLocation, "cftests", "multiAppsNestedServices.yml"))
						.expect(200)
						.query({parts: 'meta'})
						.end(function(err, res) {
							testHelper.throwIfError(err);
							var fLoc = res.body.Location;
							getTestFile(request, fLoc)
							.end(function(err, res) {
								testHelper.throwIfError(err);
								request()
									.get(path.join(PREFIX_MANIFESTS, res.body.Location))
									.query({Strict: true})
									.expect(200)
									.end(function(err, res) {
										testHelper.throwIfError(err);
										assert(res.body.Contents);
										assert.equal(res.body.Type, "Manifest", "The manifest should have been parsed as type 'Manifest'")
										done();
									});
							});
						})
				});
		});
		it("testComplexEnvAndApps", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					var wLoc = res.body.Location;
					request()
						.get(path.join(res.body.ContentLocation, "cftests", "complexEnvAndApps.yml"))
						.expect(200)
						.query({parts: 'meta'})
						.end(function(err, res) {
							testHelper.throwIfError(err);
							var fLoc = res.body.Location;
							getTestFile(request, fLoc)
							.end(function(err, res) {
								testHelper.throwIfError(err);
								request()
									.get(path.join(PREFIX_MANIFESTS, res.body.Location))
									.query({Strict: true})
									.expect(200)
									.end(function(err, res) {
										testHelper.throwIfError(err);
										assert(res.body.Contents);
										assert.equal(res.body.Type, "Manifest", "The manifest should have been parsed as type 'Manifest'")
										done();
									});
							});
						})
				});
		});
		it("testInheritWithMultisections", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					var wLoc = res.body.Location;
					request()
						.get(path.join(res.body.ContentLocation, "cftests", "inheritMultiSection.yml"))
						.expect(200)
						.query({parts: 'meta'})
						.end(function(err, res) {
							testHelper.throwIfError(err);
							var fLoc = res.body.Location;
							getTestFile(request, fLoc)
							.end(function(err, res) {
								testHelper.throwIfError(err);
								request()
									.get(path.join(PREFIX_MANIFESTS, res.body.Location))
									.query({Strict: true})
									.expect(200)
									.end(function(err, res) {
										testHelper.throwIfError(err);
										assert(res.body.Contents);
										assert.equal(res.body.Type, "Manifest", "The manifest should have been parsed as type 'Manifest'")
										done();
									});
							});
						})
				});
		});
		it("testMultiEntriesWithComments", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					var wLoc = res.body.Location;
					request()
						.get(path.join(res.body.ContentLocation, "cftests", "multiNestedComments.yml"))
						.expect(200)
						.query({parts: 'meta'})
						.end(function(err, res) {
							testHelper.throwIfError(err);
							var fLoc = res.body.Location;
							getTestFile(request, fLoc)
							.end(function(err, res) {
								testHelper.throwIfError(err);
								request()
									.get(path.join(PREFIX_MANIFESTS, res.body.Location))
									.query({Strict: true})
									.expect(200)
									.end(function(err, res) {
										testHelper.throwIfError(err);
										assert(res.body.Contents);
										assert.equal(res.body.Type, "Manifest", "The manifest should have been parsed as type 'Manifest'")
										done();
									});
							});
						})
				});
		});
		it("testArgReplace", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					var wLoc = res.body.Location;
					request()
						.get(path.join(res.body.ContentLocation, "cftests", "argReplace.yml"))
						.expect(200)
						.query({parts: 'meta'})
						.end(function(err, res) {
							testHelper.throwIfError(err);
							var fLoc = res.body.Location;
							getTestFile(request, fLoc)
							.end(function(err, res) {
								testHelper.throwIfError(err);
								request()
									.get(path.join(PREFIX_MANIFESTS, res.body.Location))
									.query({Strict: true})
									.expect(200)
									.end(function(err, res) {
										testHelper.throwIfError(err);
										assert(res.body.Contents);
										assert.equal(res.body.Type, "Manifest", "The manifest should have been parsed as type 'Manifest'")
										done();
									});
							});
						})
				});
		});
		it("testLongCommandString", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					var wLoc = res.body.Location;
					request()
						.get(path.join(res.body.ContentLocation, "cftests", "longCommand.yml"))
						.expect(200)
						.query({parts: 'meta'})
						.end(function(err, res) {
							testHelper.throwIfError(err);
							var fLoc = res.body.Location;
							getTestFile(request, fLoc)
							.end(function(err, res) {
								testHelper.throwIfError(err);
								request()
									.get(path.join(PREFIX_MANIFESTS, res.body.Location))
									.query({Strict: true})
									.expect(200)
									.end(function(err, res) {
										testHelper.throwIfError(err);
										assert(res.body.Contents);
										assert.equal(res.body.Type, "Manifest", "The manifest should have been parsed as type 'Manifest'")
										done();
									});
							});
						})
				});
		});
		it("testMultiNestingNoSpacing", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					var wLoc = res.body.Location;
					request()
						.get(path.join(res.body.ContentLocation, "cftests", "multiNestingNoSpacing.yml"))
						.expect(200)
						.query({parts: 'meta'})
						.end(function(err, res) {
							testHelper.throwIfError(err);
							var fLoc = res.body.Location;
							getTestFile(request, fLoc)
							.end(function(err, res) {
								testHelper.throwIfError(err);
								request()
									.get(path.join(PREFIX_MANIFESTS, res.body.Location))
									.query({Strict: true})
									.expect(200)
									.end(function(err, res) {
										testHelper.throwIfError(err);
										assert(res.body.Contents);
										assert.equal(res.body.Type, "Manifest", "The manifest should have been parsed as type 'Manifest'")
										done();
									});
							});
						})
				});
		});
		it("testMultiNestingWithMultiComments", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					var wLoc = res.body.Location;
					request()
						.get(path.join(res.body.ContentLocation, "cftests", "multiNestingComments.yml"))
						.expect(200)
						.query({parts: 'meta'})
						.end(function(err, res) {
							testHelper.throwIfError(err);
							var fLoc = res.body.Location;
							getTestFile(request, fLoc)
							.end(function(err, res) {
								testHelper.throwIfError(err);
								request()
									.get(path.join(PREFIX_MANIFESTS, res.body.Location))
									.query({Strict: true})
									.expect(200)
									.end(function(err, res) {
										testHelper.throwIfError(err);
										assert(res.body.Contents);
										assert.equal(res.body.Type, "Manifest", "The manifest should have been parsed as type 'Manifest'")
										done();
									});
							});
						})
				});
		});
		it("testParseNoFileAtRoot", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					var wLoc = res.body.Location;
					request()
						.get(path.join(res.body.ContentLocation, "cftests", "simpleTwoApps.yml"))
						.expect(200)
						.query({parts: 'meta'})
						.end(function(err, res) {
							testHelper.throwIfError(err);
							var fLoc = res.body.Location;
							request()
								.get(path.join(PREFIX_MANIFESTS, 'foobar'))
								.query({Strict: true})
								.expect(403)
								.end(done);
						})
				});
		});
		it("testParseNoFileWithBareFilePath", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					var wLoc = res.body.Location;
					request()
						.get(path.join(res.body.ContentLocation, "cftests", "simpleTwoApps.yml"))
						.expect(200)
						.query({parts: 'meta'})
						.end(function(err, res) {
							testHelper.throwIfError(err);
							var fLoc = res.body.Location;
							request()
								.get(path.join(PREFIX_MANIFESTS, PREFIX_FILE, 'foobar'))
								.query({Strict: true})
								.expect(403)
								.end(done);
						})
				});
		});
		/**
		 * This should likely return a 404 since the file does not exist
		 */
		it.skip("testParseNoFileWithProjectFilePath", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
				.end(function(err, res) {
					testHelper.throwIfError(err);
					var wLoc = res.body.Location;
					request()
						.get(path.join(res.body.ContentLocation, "cftests", "simpleTwoApps.yml"))
						.expect(200)
						.query({parts: 'meta'})
						.end(function(err, res) {
							testHelper.throwIfError(err);
							var fLoc = res.body.Location;
							request()
								.get(path.join(PREFIX_MANIFESTS, PREFIX_FILE, WORKSPACE_ID, "cftests", 'foobar'))
								.query({Strict: true})
								.expect(404)
								.end(done);
						})
				});
		});
		it("testQuotedManifestProperties", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				var wLoc = res.body.Location;
				request()
					.get(path.join(res.body.ContentLocation, "cftests", "quotedPropertiesManifest.yml"))
					.expect(200)
					.query({parts: 'meta'})
					.end(function(err, res) {
						testHelper.throwIfError(err);
						var fLoc = res.body.Location;
						getTestFile(request, fLoc)
						.end(function(err, res) {
							testHelper.throwIfError(err);
							request()
								.get(path.join(PREFIX_MANIFESTS, res.body.Location))
								.query({Strict: true})
								.expect(200)
								.end(function(err, res) {
									testHelper.throwIfError(err);
									assert(res.body.Contents);
									assert.equal(res.body.Type, "Manifest", "The manifest should have been parsed as type 'Manifest'")
									done();
								});
						});
					})
			});
		});
		it("testTargetBaseManifestProperties", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				var wLoc = res.body.Location;
				request()
					.get(path.join(res.body.ContentLocation, "cftests", "targetBaseManifest.yml"))
					.expect(200)
					.query({parts: 'meta'})
					.end(function(err, res) {
						testHelper.throwIfError(err);
						var fLoc = res.body.Location;
						getTestFile(request, fLoc)
						.end(function(err, res) {
							testHelper.throwIfError(err);
							request()
								.get(path.join(PREFIX_MANIFESTS, res.body.Location))
								.query({Strict: true})
								.expect(200)
								.end(function(err, res) {
									testHelper.throwIfError(err);
									assert(res.body.Contents);
									assert.equal(res.body.Type, "Manifest", "The manifest should have been parsed as type 'Manifest'")
									done();
								});
						});
					})
			});
		});
		it("testServicesWithSpacesManifest", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				var wLoc = res.body.Location;
				request()
					.get(path.join(res.body.ContentLocation, "cftests", "servicesWithSpaces.yml"))
					.expect(200)
					.query({parts: 'meta'})
					.end(function(err, res) {
						testHelper.throwIfError(err);
						var fLoc = res.body.Location;
						getTestFile(request, fLoc)
						.end(function(err, res) {
							testHelper.throwIfError(err);
							request()
								.get(path.join(PREFIX_MANIFESTS, res.body.Location))
								.query({Strict: true})
								.expect(200)
								.end(function(err, res) {
									testHelper.throwIfError(err);
									assert(res.body.Contents);
									assert.equal(res.body.Type, "Manifest", "The manifest should have been parsed as type 'Manifest'")
									done();
								});
						});
					})
			});
		});
		it("testMissingPropertyName", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				var wLoc = res.body.Location;
				request()
					.get(path.join(res.body.ContentLocation, "cftests", "missingPropertyName.yml"))
					.expect(200)
					.query({parts: 'meta'})
					.end(function(err, res) {
						testHelper.throwIfError(err);
						var fLoc = res.body.Location;
						getTestFile(request, fLoc)
						.end(function(err, res) {
							testHelper.throwIfError(err);
							request()
								.get(path.join(PREFIX_MANIFESTS, res.body.Location))
								.query({Strict: true})
								.expect(400)
								.end(function(err, res) {
									assert(res.body.Location);
									assert(res.body.Location.startsWith(TASK_PREFIX));
									done();
								});
						});
					})
			});
		});
		it("testMissingPropertyValue", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				var wLoc = res.body.Location;
				request()
					.get(path.join(res.body.ContentLocation, "cftests", "missingPropertyValue.yml"))
					.expect(200)
					.query({parts: 'meta'})
					.end(function(err, res) {
						testHelper.throwIfError(err);
						var fLoc = res.body.Location;
						getTestFile(request, fLoc)
						.end(function(err, res) {
							testHelper.throwIfError(err);
							request()
								.get(path.join(PREFIX_MANIFESTS, res.body.Location))
								.query({Strict: true})
								.expect(202)
								.end(function(err, res) {
									testHelper.throwIfError(err);
									assert(res.body.Location);
									assert(res.body.Location.startsWith(TASK_PREFIX));
									done();
								});
						});
					})
			});
		});
		it("testBadPropertyShape", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				var wLoc = res.body.Location;
				request()
					.get(path.join(res.body.ContentLocation, "cftests", "badPropertyShape.yml"))
					.expect(200)
					.query({parts: 'meta'})
					.end(function(err, res) {
						testHelper.throwIfError(err);
						var fLoc = res.body.Location;
						getTestFile(request, fLoc)
						.end(function(err, res) {
							testHelper.throwIfError(err);
							request()
								.get(path.join(PREFIX_MANIFESTS, res.body.Location))
								.query({Strict: true})
								.expect(202)
								.end(function(err, res) {
									testHelper.throwIfError(err);
									assert(res.body.Location);
									assert(res.body.Location.startsWith(TASK_PREFIX));
									done();
								});
						});
					})
			});
		});
		it("testBadIndent", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				var wLoc = res.body.Location;
				request()
					.get(path.join(res.body.ContentLocation, "cftests", "badIndent.yml"))
					.expect(200)
					.query({parts: 'meta'})
					.end(function(err, res) {
						testHelper.throwIfError(err);
						var fLoc = res.body.Location;
						getTestFile(request, fLoc)
						.end(function(err, res) {
							testHelper.throwIfError(err);
							request()
								.get(path.join(PREFIX_MANIFESTS, res.body.Location))
								.query({Strict: true})
								.expect(202)
								.end(function(err, res) {
									testHelper.throwIfError(err);
									assert(res.body.Location);
									assert(res.body.Location.startsWith(TASK_PREFIX));
									done();
								});
						});
					})
			});
		});
		/**
		 * Even though this is asking the endpoint for a file that does not exist (using the /file endpoint)
		 * we get back 200, due to the fact that we generate a default manifest for the user if there isn't one.
		 */
		it("testNonExistentFile", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				var wLoc = res.body.Location;
				request()
					.get(path.join(res.body.ContentLocation, "cftests", "foo.yml"))
					.expect(404)
					.query({parts: 'meta'})
					.end(function(err, res) {
						testHelper.throwIfError(err);
						var fLoc = res.body.Location;
						request()
							.get(path.join(PREFIX_MANIFESTS, '/cftests/foo.yml')) // no /file endpoint, 403 is returned
							.query({Strict: true})
							.expect(403)
							.end(done);
					})
			});
		});
		it("testNonExistentFileWithFileRoute", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				var wLoc = res.body.Location,
					wCL = res.body.ContentLocation;
				request()
					.get(path.join(wCL, "cftests", "foo.yml"))
					.expect(404)
					.query({parts: 'meta'})
					.end(function(err, res) {
						testHelper.throwIfError(err);
						var fLoc = res.body.Location;
						request()
							.get(path.join(PREFIX_MANIFESTS, wCL, 'cftests', 'foo.yml'))
							.query({Strict: true})
							.expect(404)
							.end(done);
					})
			});
		});
		it("testNonExistentFileWithFileRouteNonStrict", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				var wLoc = res.body.Location,
					wCL = res.body.ContentLocation;
				request()
					.get(path.join(wCL, "cftests", "foo.yml"))
					.expect(404)
					.query({parts: 'meta'})
					.end(function(err, res) {
						testHelper.throwIfError(err);
						var fLoc = res.body.Location;
						request()
							.get(path.join(PREFIX_MANIFESTS, wCL, 'cftests', 'foo.yml'))
							//.query({Strict: true}) non-strict should look for a manifest.yml in the directory
							.expect(200)
							.end(done);
					})
			});
		});
		it("testEmptyFilePath", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				var wLoc = res.body.Location;
				request()
					.get(path.join(res.body.ContentLocation, "cftests", "foo.yml"))
					.expect(404)
					.query({parts: 'meta'})
					.end(function(err, res) {
						testHelper.throwIfError(err);
						var fLoc = res.body.Location;
						request()
							.get(path.join(PREFIX_MANIFESTS, ''))
							.query({Strict: true})
							.expect(403)
							.end(done);
					})
			});
		});
		it("testUndefinedFilePath", function(done) {
			testHelper.withWorkspace(request, testHelper.WORKSPACE_PATH, testHelper.WORKSPACE_ID)
			.end(function(err, res) {
				testHelper.throwIfError(err);
				var wLoc = res.body.Location;
				request()
					.get(path.join(res.body.ContentLocation, "cftests", "foo.yml"))
					.expect(404)
					.query({parts: 'meta'})
					.end(function(err, res) {
						testHelper.throwIfError(err);
						var fLoc = res.body.Location;
						request()
							.get(PREFIX_MANIFESTS)
							.query({Strict: true})
							.expect(403)
							.end(done);
					})
			});
		});
		/**
		 * TODO - this relies on the ManifestTransformator in Java, which we don't have in node
		 */
		it.skip("testManifestGlobalProperties");
	});
	/**
	 * TODO
	 */
	describe("Manifest utils tests", function() {
		it("testSingleInheritancePropagation");
		it("testSingleRelativeInheritance");
		it("testFlatSingleRelativeInheritance");
		it("testInnerSingleRelativeInheritance");
		it("testSingleInheritanceOutsideSandbox");
		it("testFlatComplexInheritance");
		it("testInheritanceCycle");
		it("testComplexInheritance");
		it("testEnvInheritance");
	});
});