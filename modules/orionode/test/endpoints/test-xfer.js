/*******************************************************************************
 * Copyright (c) 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 * 	   Remy Suen - initial API and implementation
 *******************************************************************************/
/*eslint-env mocha */
var assert = require("assert"),
	express = require("express"),
	supertest = require("supertest"),
	path = require("path"),
	fs = require('fs'),
	metastore = require('../../lib/metastore/fs/store'),
	file = require('../../lib/file'),
	xfer = require("../../lib/xfer.js"),
	testData = require('../support/test_data'),
	testHelper = require('../support/testHelper');

var CONTEXT_PATH = '',
	WORKSPACE = path.join(__dirname, '.test_workspace'),
	WORKSPACE_ID = "orionode",
	XFER_PATH = CONTEXT_PATH + '/xfer',
	IMPORT_PATH = CONTEXT_PATH + '/xfer/import',
	EXPORT_PATH = CONTEXT_PATH + '/xfer/export',
	FILE_PATH = CONTEXT_PATH + '/file',
	PREFIX = FILE_PATH + '/' + WORKSPACE_ID;

var app = express();
app.locals.metastore = metastore({workspaceDir: WORKSPACE});
app.locals.metastore.setup(app);
app.use(XFER_PATH, xfer.router({ fileRoot: FILE_PATH }));
app.use(FILE_PATH + '*', file({fileRoot: FILE_PATH, workspaceRoot: CONTEXT_PATH + '/workspace'}));

var request = supertest.bind(null, app);

describe("XFER", function() {
	/**
	 * From: org.eclipse.orion.server.tests.servlets.xfer.TransferTest.java
	 */
	describe("Transfer tests", function() {
		this.timeout(20000);
		beforeEach("set up the test workspace", function(done) {
			testData.setUp(WORKSPACE, done);
		});
		afterEach('Tear down the testworkspace', function(done) {
			testData.tearDown(WORKSPACE, done);
		});
		// Bug 511513 - Export non-existing folder leaks server path
		it('testExport - bug 511513', function(finished) {
			// make sure the folder doesn't actually exist
			assert.equal(fs.existsSync(WORKSPACE + "/donotexist"), false);
			// ask the server to export the non-existent folder
			request()
			.get(EXPORT_PATH + '/' + WORKSPACE_ID + "/donotexist.zip")
			.expect(404)
			.end(function(err, res) {
				assert.ifError(err);
				// message body doesn't include the path
				assert.equal(res.body.Message.indexOf(WORKSPACE), -1);
				finished();
			});
		});
		it("testExportProject", function() {
			return testHelper.createDir(request, '/project', "exportSample")
					.then(/* @callback */ function(res) {
						return testHelper.createFile(request, "/project/exportSample/", "exportTestFile.txt", "This is some contents for initialization")
								.then(/* @callback */ function(res) {
									return request()
										.get(EXPORT_PATH + '/' + WORKSPACE_ID + '/project/exportSample.zip')
										.expect(200);
										//TODO extract and confirm zip?
								});
					});
		});
		it("testImportFromURL", function() {
			var url = 'https://storage.googleapis.com/google-code-archive-downloads/v2/code.google.com/jsdoc-toolkit/jsdoc_toolkit-2.4.0.zip';
			return testHelper.createDir(request, '/project', 'importFromUrlRaw')
					.then(function() {
						return request()
								.post(IMPORT_PATH + '/' + WORKSPACE_ID + '/project/importFromUrlRaw?source=' + encodeURIComponent(url))
								.set('X-Xfer-Options', 'raw')
								.expect(201)
								.then(function(res) {
									assert(res.header.location, "There was no location in the response");
									assert.equal(res.header.location, '/file/orionode/project/importFromUrlRaw', "The file location is not correct");
								});
					});
		});
		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=520782
		 */
		it("testImportFromURLNoHeader", function() {
			var url = 'https://storage.googleapis.com/google-code-archive-downloads/v2/code.google.com/jsdoc-toolkit/jsdoc_toolkit-2.4.0.zip';
			return testHelper.createDir(request, '/project', 'importFromUrlNoHeader')
					.then(function() {
						return request()
								.post(IMPORT_PATH + '/' + WORKSPACE_ID + '/project/importFromUrlNoHeader?source=' + encodeURIComponent(url))
								.expect(201)
								.then(function(res) {
									assert(res.header.location, "There was no location in the response");
									assert.equal(res.header.location, '/file/orionode/project/importFromUrlNoHeader', "The file location is not correct");
								});
					});
		});
		it("testImportAndUnzipFromURL", function() {
			var url = 'https://storage.googleapis.com/google-code-archive-downloads/v2/code.google.com/jsdoc-toolkit/jsdoc_toolkit-2.4.0.zip';
			return testHelper.createDir(request, '/project', 'importFromUrlAutoExtracted')
					.then(function() {
						return request()
								.post(IMPORT_PATH + '/' + WORKSPACE_ID + '/project/importFromUrlAutoExtracted?source=' + encodeURIComponent(url))
								.set('X-Xfer-Options', 'unzip')
								.expect(201)
								.then(function(res) {
									assert(res.header.location, "There was no location in the response");
									assert.equal(res.header.location, '/file/orionode/project/importFromUrlAutoExtracted', "The file location is not correct");
								});
					});
		});
		it("testImportAndUnzipFromNonArchiveURL", function() {
			var url = 'https://wiki.eclipse.org/Orion';
			return testHelper.createDir(request, '/project', 'importFromUrlAutoExtractedNonArchive')
					.then(function() {
						return request()
								.post(IMPORT_PATH + '/' + WORKSPACE_ID + '/project/importFromUrlAutoExtractedNonArchive?source=' + encodeURIComponent(url))
								.set('X-Xfer-Options', 'unzip')
								.expect(400);
					});
		});
		it("testImportFromURLMalformed", function() {
		return testHelper.createDir(request, '/project', 'importMalformedUrl')
					.then(function() {
						return request()
								.post(IMPORT_PATH + '/' + WORKSPACE_ID + '/project/importMalformedUrl?source=pumpkins')
								.set('X-Xfer-Options', 'unzip')
								.expect(400);
					});
		});
		/**
		 * TODO SSQ and MR need to review what is expected here
		 */
		it.skip("testImportAndUnzip", function(done) {
			return testHelper.createDir(request, '/project', 'testImportFile')
				.then(function() {
					var fname = path.dirname(__dirname) + '/testData/importTest/client.zip',
						lngth = -1,
						stats = fs.statSync(fname);
					assert(stats, "Could not get the file information for: "+fname);
					lngth = stats.size;
					request()
							.post(IMPORT_PATH + '/' + WORKSPACE_ID + '/project/testImportFile')
							.set('Content-Type', 'application/octet-stream')
							.set('Content-Length', lngth)
							.set('Slug', 'client.zip')
							.expect(201)
							.then(function(res) {
								var stream = fs.createReadStream(fname);
								stream.pipe(res);
								stream.on('error', function(e) {
									res.end();
								});
								stream.on('end', function() {
									done();
								});
							});
				});
		});
		it.skip("testImportFile", function(done) {
			return testHelper.createDir(request, '/project', 'testImportFile')
					.then(function() {
						var fname = path.dirname(__dirname) + '/testData/importTest/client.zip',
						lngth = -1,
						stats = fs.statSync(fname);
						return request()
								.post(IMPORT_PATH + '/' + WORKSPACE_ID + '/project/testImportFile')
								.set('X-Xfer-Options', 'raw,no-overwrite')
								.set('Content-Type', 'application/octet-stream')
								.set('Slug', 'client.zip')
								.expect(201)
								.then(function(res, req) {
									var stream = fs.createReadStream(fname);
									res.pipe(stream);
									stream.on('error', function(e) {
										res.end();
									});
									stream.on('end', function() {
										done();
									});
								});
					});
		});
		it("testImportEmojiFilenameBad", function() {
			var tempdir = fs.mkdtempSync(WORKSPACE + '/temp'),
				fileName = encodeURIComponent('\ud83d\ude0a\ud83d\udc31\ud83d\udc35.txt'),
				fileContents = 'Emoji characters: \ud83d\ude0a\ud83d\udc31\ud83d\udc35';
			fs.writeFileSync(tempdir+'/'+fileName, fileContents);
			return request()
					.post(IMPORT_PATH + '/' + WORKSPACE_ID + tempdir)
					.set('X-Xfer-Content-Length', fileContents.length)
					.set('X-Xfer-Options', 'raw')
					.set('Slug', fileName)
					.expect(500);
		});
		/**
		 * TODO This test fails 
		 */
		it.skip("testImportEmojiFilename", function() {
			var tempdir = fs.mkdtempSync(WORKSPACE + '/temp'),
				fileName = encodeURIComponent('\ud83d\ude0a\ud83d\udc31\ud83d\udc35.txt'),
				fileContents = 'Emoji characters: \ud83d\ude0a\ud83d\udc31\ud83d\udc35';
			fs.writeFileSync(tempdir+'/'+fileName, fileContents);
			return testHelper.createDir(request, '/project', 'testImportEmojiFilename')
				.then(function() {
					var lgth = -1,
						fname = tempdir+'/'+fileName,
						stats = fs.statSync(fname);
						if(stats) {
							lgth = stats.size;
						}
				return request()
						.post(IMPORT_PATH + '/' + WORKSPACE_ID + '/project/testImportEmojiFilename')
						.set('X-Xfer-Content-Length', lgth)
						.set('X-Xfer-Options', 'raw')
						.set('Slug', fileName)
						.expect(200);
			});
		});
		it.skip("testImportDBCSFilename");
		it.skip("testImportFileMultiPart");
		it.skip("testImportUnzipNonZipFile");
		it.skip("testImportWithPostZeroByteFile");
		it.skip("testImportWithPost");
		it.skip("testImportFilesWithoutOverride");
		it.skip("testImportFilesWithOverride");
		it.skip("testImportAndUnzipWithoutOverride");
		it.skip("testImportAndUnzipWithOverride");
	});
});