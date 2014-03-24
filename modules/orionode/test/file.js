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
/*global describe it beforeEach*/
/*jslint node:true*/
var assert = require('assert');
var path = require('path');
var testData = require('./support/test_data');

var CONTEXT_PATH = '/orion', PREFIX = CONTEXT_PATH + '/file';
var WORKSPACE = path.join(__dirname, '.test_workspace');

var app = testData.createApp()
			.use(CONTEXT_PATH, require('../lib/file')({
				root: '/file',
				workspaceRoot: '/workspace',
				workspaceDir: WORKSPACE
			}));

function byName(a, b) {
	return String.prototype.localeCompare(a.Name, b.Name);
}

/**
 * Unit test for the file REST API.
 * see http://wiki.eclipse.org/Orion/Server_API/File_API
 */
describe('File API', function() {
	beforeEach(function(done) { // testData.setUp.bind(null, parentDir)
		testData.setUp(WORKSPACE, done);
	});

	describe('get /file', function(done) {
		app.request()
			.get(PREFIX)
			.expect(403, function(err, res) {
				assert.ifError(err);
				app.request()
					.get(PREFIX)
					.expect(403, done);
			});
	});

	/**
	 * http://wiki.eclipse.org/Orion/Server_API/File_API#Actions_on_files
	 */
	describe('files', function() {
		describe('contents', function() {
			it('get file contents', function(done) {
				app.request()
				.get(PREFIX + '/project/fizz.txt')
				.expect(200, 'hello world', done);
			});
			it('file contents has ETag header', function(done) {
				app.request()
				.get(PREFIX + '/project/fizz.txt')
				.end(function(err, res) {
					assert.ifError(err);
					assert.notEqual(res.headers.etag, null);
					done();
				});
			});
			it('put file contents', function(done) {
				var newContents = 'The time is now ' + new Date().getTime();
				app.request()
				.put(PREFIX + '/project/fizz.txt')
				.send(newContents)
				.expect(200)
				.end(function(err, res) {
					assert.ifError(err);
					var body = res.body;
					assert.equal(body.Directory, false);
					assert.ok(body.ETag, 'has an ETag');
					assert.equal(body.Location, PREFIX + '/project/fizz.txt');
					assert.equal(body.Name, 'fizz.txt');
					done();
				});
			});
			it('conditionally overwrite contents using If-Match', function(done) {
				var url = PREFIX + '/project/fizz.txt';
				app.request()
				.get(url)
				.query({ parts: 'meta' })
				.end(function(err, res) {
					assert.ifError(err);
					var etag = res.body.ETag;
					assert.notEqual(res.body.ETag, null);
					app.request()
					.put(url)
					.set('If-Match', etag + '_blort')
					.expect(412)
					.end(function(err, res) {
						assert.ifError(err);
						app.request(url)
						.put(url)
						.set('If-Match', etag)
						.expect(200)
						.end(done);
					});
				});
			});
			describe('diff', function() {
				it('applies a patch with JSON Content-Type', function(done) {
					var url = PREFIX + '/project/fizz.txt';
					app.request()
					.post(url)
					.set('X-HTTP-Method-Override', 'PATCH')
					.type('json')
					.send({ diff: [{ start: 0, end: 1, text: "j" }] })
					.expect(200)
					.end(function(err, res) {
						assert.ifError(err);
						app.request().get(url).expect(200, 'jello world', done);
					});
				});
				it('applies a patch with text Content-Type', function(done) {
					var url = PREFIX + '/project/fizz.txt';
					app.request()
					.post(url)
					.set('X-HTTP-Method-Override', 'PATCH')
					.type('text')
					.send(JSON.stringify({ diff: [{ start: 0, end: 1, text: "j" }] }))
					.expect(200)
					.end(function(err, res) {
						assert.ifError(err);
						app.request().get(url).expect(200, 'jello world', done);
					});
				});
				it('tolerates an empty patch', function(done) {
					var url = PREFIX + '/project/fizz.txt';
					app.request()
					.post(url)
					.set('X-HTTP-Method-Override', 'PATCH')
					.type('text')
					.send(JSON.stringify({}))
					.expect(200)
					.end(function(err, res) {
						assert.ifError(err);
						done();
					});
				});
				it('gives consistent ETag between POST and GET', function(done) {
					var url = PREFIX + '/project/fizz.txt';
					app.request()
					.post(url)
					.set('X-HTTP-Method-Override', 'PATCH')
					.type('text')
					.send(JSON.stringify({
						// Change "hello world" to "hello worf"
						diff: [{
							start: 9,
							end: 11,
							text: "f"
						}]
					}))
					.expect(200)
					.end(function(err, res) {
						assert.ifError(err);
						var etag = res.headers.etag;
						app.request()
						.get(url)
						.query({ parts: 'meta' })
						.expect(200)
						.end(function(err, res) {
							assert.ifError(err);
							assert.equal(etag, res.headers.etag, "Expect same ETag we got from the POST");
							done();
						});
					});
				});
			});
		});
		describe('metadata', function() {
			it('get file metadata', function(done) {
				app.request()
				.get(PREFIX + '/project/fizz.txt')
				.query({ parts: 'meta' })
				.expect(200)
				.end(function(err, res) {
					assert.ifError(err);
					var body = res.body;
					assert.deepEqual(body.Attributes, {ReadOnly: false, Executable: false});
					assert.equal(body.Directory, false);
					assert.notEqual(body.ETag, null);
					assert.equal(typeof body.LocalTimeStamp, 'number');
					assert.equal(body.Location, PREFIX + '/project/fizz.txt');
					assert.equal(body.Name, 'fizz.txt');
					assert.equal(body.Parents.length, 1);
					assert.deepEqual(body.Parents[0], {
						ChildrenLocation: PREFIX + '/project?depth=1',
						Location: PREFIX + '/project',
						Name: 'project'
					});
					done();
				});
			});
			it('file metadata has ETag header', function(done) {
				app.request()
				.get(PREFIX + '/project/fizz.txt')
				.query({ parts: 'meta' })
				.end(function(err, res) {
					assert.ifError(err);
					assert.notEqual(res.headers.etag, null);
					done();
				});
			});
		});
		it('has a correct "Parents" field', function(done) {
			app.request()
			.get(PREFIX + '/project/my%20folder/my%20subfolder/quux.txt')
			.query({ parts: 'meta' })
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				assert.ok(res.body.Parents);
				assert.equal(res.body.Parents.length, 3);
				assert.equal(res.body.Parents[0].ChildrenLocation, PREFIX + '/project/my%20folder/my%20subfolder?depth=1');
				assert.equal(res.body.Parents[0].Location, PREFIX + '/project/my%20folder/my%20subfolder');
				assert.equal(res.body.Parents[0].Name, 'my subfolder');
				assert.equal(res.body.Parents[1].Name, 'my folder');
				assert.equal(res.body.Parents[2].Name, 'project');
				done();
			});
		});
		/**
		 * http://wiki.eclipse.org/Orion/Server_API/File_API#Creating_files_and_directories
		 */
		describe('creating', function() {
			it('works with Slug header', function(done) {
				app.request()
				.post(PREFIX + '/project')
				.set('Slug', 'newfile.txt')
				.expect(201)
				.end(function(err, res) {
					assert.ifError(err);
					assert.equal(res.body.Name, 'newfile.txt');
					assert.equal(res.body.Directory, false);
					done();
				});
			});
			it('works with "Name" field', function(done) {
				app.request()
				.post(PREFIX + '/project')
				.send({ Name: 'newfile.txt' })
				.expect(201)
				.end(function(err, res) {
					assert.ifError(err);
					assert.equal(res.body.Name, 'newfile.txt');
					assert.equal(res.body.Directory, false);
					done();
				});
			});
		});
		// Unimplemented features:
		// 'should implement GET file metadata and contents'
		// 'should implement PUT file contents with different HTTP input'
		// 'should implement PUT file metadata'
		// 'should implement PUT metadata and contents'
	});
	/**
	 * http://wiki.eclipse.org/Orion/Server_API/File_API#Actions_on_directories
	 */
	describe('directories', function() {
		describe('metadata', function() {
			it('get directory metadata', function(done) {
				app.request()
				.get(PREFIX + '/project/my%20folder')
				.expect(200)
				.end(function(err, res) {
					assert.ifError(err);
					var body = res.body;
					assert.equal(body.Children, null, 'Children should be absent');
					assert.equal(body.ChildrenLocation, PREFIX + '/project/my%20folder?depth=1');
					assert.equal(body.Directory, true);
					assert.equal(body.Name, 'my folder');
					assert.equal(body.Location, PREFIX + '/project/my%20folder/');
					done();
				});
			});
			it('has a correct "Parents" field', function(done) {
				app.request()
				.get(PREFIX + '/project/my%20folder/my%20subfolder')
				.expect(200)
				.end(function(err, res) {
					assert.ifError(err);
					assert.ok(res.body.Parents);
					assert.equal(res.body.Parents.length, 2);
					assert.equal(res.body.Parents[0].ChildrenLocation, PREFIX + '/project/my%20folder?depth=1');
					assert.equal(res.body.Parents[0].Location, PREFIX + '/project/my%20folder');
					assert.equal(res.body.Parents[0].Name, 'my folder');
					assert.equal(res.body.Parents[1].Name, 'project');
					done();
				});
			});
		});

		describe('contents', function() {
			it('get directory contents', function(done) {
				app.request()
				.get(PREFIX + '/project/my%20folder')
				.query({ depth: 1 })
				.expect(200)
				.end(function(err, res) {
					assert.ifError(err);
					var body = res.body;
					assert.equal(body.ChildrenLocation, PREFIX + '/project/my%20folder?depth=1');
					assert.equal(Array.isArray(body.Children), true);
					body.Children.sort(byName);
					assert.equal(body.Children.length, 2);
					assert.equal(body.Children[0].Name, 'buzz.txt');
					assert.equal(body.Children[0].Directory, false);
					assert.equal(body.Children[0].Location, PREFIX + '/project/my%20folder/buzz.txt');
					assert.equal("ChildrenLocation" in body.Children[0], false, "Child file has no ChildrenLocation");
					assert.equal(body.Children[1].Name, 'my subfolder');
					assert.equal(body.Children[1].Directory, true);
					assert.equal(body.Children[1].Location, PREFIX + '/project/my%20folder/my%20subfolder/');
					assert.equal("ChildrenLocation" in body.Children[1], true, "Child folder has ChildrenLocation"); 
					done();
				});
			});
		});

		/**
		 * http://wiki.eclipse.org/Orion/Server_API/File_API#Creating_files_and_directories
		 */
		describe('creating', function() {
			it('works with Slug header', function(done) {
				app.request()
				.post(PREFIX + '/project')
				.type('json')
				.set('Slug', 'new directory')
				.send({ Directory: true })
				.expect(201)
				.end(function(err, res) {
					assert.ifError(err);
					assert.equal(res.body.Directory, true);
					assert.equal(res.body.Location, PREFIX + '/project/new%20directory/'); //FIXME
					assert.equal(res.body.Name, 'new directory');
					done();
				});
			});
			it('works with "Name" field', function(done) {
				app.request()
				.post(PREFIX + '/project')
				.type('json')
				.send({ Name: 'new directory', Directory: true })
				.expect(201)
				.end(function(err, res) {
					assert.ifError(err);
					assert.equal(res.body.Directory, true);
					assert.equal(res.body.Location, PREFIX + '/project/new%20directory/'); // FIXME
					assert.equal(res.body.Name, 'new directory');
					done();
				});
			});
			it('works when a string-typed Directory "true" is provided', function(done) {
				app.request()
				.post(PREFIX + '/project')
				.type('json')
				.send({ Name: 'new directory', Directory: 'true' })
				.expect(201)
				.end(function(err, res) {
					assert.ifError(err);
					assert.equal(res.body.Directory, true);
					assert.equal(res.body.Location, PREFIX + '/project/new%20directory/'); // FIXME
					assert.equal(res.body.Name, 'new directory');
					done();
				});
			});
			it('works when a string-typed Directory "false" is provided', function(done) {
				app.request()
				.post(PREFIX + '/project')
				.type('json')
				.set('Slug', 'Not a directory')
				.send({ Directory: "false" })
				.expect(201)
				.end(function(err, res) {
					assert.ifError(err);
					assert.equal(res.body.Directory, false);
					assert.equal(res.body.Location, PREFIX + '/project/Not%20a%20directory'); //FIXME
					assert.equal(res.body.Name, 'Not a directory');
					done();
				});
			});
		});
		// Unimplemented features:
		// 'should implement PUT directory metadata'
	});

	/**
	 * http://wiki.eclipse.org/Orion/Server_API/File_API#Copy.2C_move.2C_and_delete
	 */
	describe('delete', function() {
		it('delete a file', function(done) {
			app.request()
			.del(PREFIX + '/project/my%20folder/buzz.txt')
			.expect(204)
			.end(function(err, res) {
				// subsequent requests should 404
				app.request()
				.get(PREFIX + '/project/my%20folder/buzz.txt')
				.expect(404)
				.end(done);
			});
		});
		it('delete a directory', function(done) {
			app.request()
			.del(PREFIX + '/project/my%20folder')
			.expect(204)
			.end(function(err, res) {
				assert.ifError(err);
				// the directory is gone:
				app.request()
				.get(PREFIX + '/project/my%20folder')
				.expect(404)
				.end(function(err, res) {
					assert.ifError(err);
					// and its contents are gone:
					app.request()
					.get(PREFIX + '/project/my%20folder/buzz.txt')
					.expect(404)
					.end(done);
				});
			});
		});
		it('conditional delete using If-Match', function(done) {
			var url = PREFIX + '/project/fizz.txt';
			app.request()
			.get(url)
			.query({ parts: 'meta' })
			.end(function(err, res) {
				assert.ifError(err);
				var etag = res.body.ETag;
				assert.notEqual(res.body.ETag, null);
				app.request()
				.del(url)
				.set('If-Match', etag + '_blort')
				.expect(412)
				.end(function(err, res) {
					assert.ifError(err);
					app.request(url)
					.del(url)
					.set('If-Match', etag)
					.expect(204)
					.end(done);
				});
			});
		});
	});
	/**
	 * http://wiki.eclipse.org/Orion/Server_API/File_API#Copy.2C_move.2C_and_delete
	 * and 
	 * http://wiki.eclipse.org/Orion/Server_API/File_API#Notes_on_POST_method
	 */
	describe('copy', function() {
		it('copy a file', function(done) {
			app.request()
			.post(PREFIX + '/project/my%20folder')
			.set('Slug', 'copy_of_fizz.txt')
			.set('X-Create-Options', 'copy')
			.send({ Location: PREFIX + '/project/fizz.txt' })
			.expect(201)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Name, 'copy_of_fizz.txt');
				done();
			});
		});
		it('copy a file overwrites when "no-overwrite" is not set', function(done) {
			// cp project/fizz.txt "project/my folder/buzz.txt"
			app.request()
			.post(PREFIX + '/project/my%20folder')
			.set('Slug', 'buzz.txt')
			.set('X-Create-Options', 'copy')
			.send({ Location: PREFIX + '/project/fizz.txt' })
			.expect(200) // 200 means overwritten
			.end(function(err, res) {
				assert.ifError(err);
				// It's in the expected place:
				assert.equal(res.body.Name, 'buzz.txt');
				assert.equal(res.body.Parents[0].Name, 'my folder');
				// And has the expected contents:
				app.request()
				.get(res.body.Location)
				.expect(200, 'hello world', done);
			});
		});
		it('copy a directory', function(done) {
			app.request()
			.post(PREFIX + '/project/')
			.set('Slug', 'copy_of_my_folder')
			.set('X-Create-Options', 'copy')
			.send({ Location: PREFIX + '/project/my%20folder' })
			.expect(201)
			.end(function(err, res) {
				assert.ifError(err);
				// Ensure the copy has the expected children
				assert.ok(res.body.ChildrenLocation);
				app.request()
				.get(res.body.ChildrenLocation)
				.expect(200)
				.end(function(err, res) {
					assert.ifError(err);
					res.body.Children.sort(byName);
					assert.equal(res.body.Children[0].Name, 'buzz.txt');
					assert.equal(res.body.Children[1].Name, 'my subfolder');
					done();
				});
			});
		});
	});
	/**
	 * http://wiki.eclipse.org/Orion/Server_API/File_API#Copy.2C_move.2C_and_delete
	 */
	describe('move/rename', function() {
		it('move & rename a file', function(done) {
			// mv "project/my folder/my subfolder/fizz.txt" "project/my folder/fizz_moved.txt"
			app.request()
			.post(PREFIX + '/project/my%20folder')
			.set('Slug', 'fizz_moved.txt')
			.set('X-Create-Options', 'move')
			.send({ Location: PREFIX + '/project/fizz.txt' })
			.expect(201)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Name, 'fizz_moved.txt');
				done();
			});
		});
		it('move & rename a directory', function(done) {
			// mv "project/my folder/my subfolder/fizz.txt" "project/my folder/fizz_moved.txt"
			app.request()
			.post(PREFIX + '/project/my%20folder')
			.set('Slug', 'fizz_moved.txt')
			.set('X-Create-Options', 'move')
			.send({ Location: PREFIX + '/project/fizz.txt' })
			.expect(201)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Name, 'fizz_moved.txt');
				done();
			});
		});
	});
});