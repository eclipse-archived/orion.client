/*******************************************************************************
 * Copyright (c) 2013, 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node, mocha, assert, express*/
var assert = require('assert');
var express = require('express');
var nodeUtil = require('util');
var path = require('path');
var stream = require('stream');
var supertest = require('supertest');
var testData = require('./support/test_data');

var CONTEXT_PATH = '';
var PREFIX = CONTEXT_PATH + '/file';
var WORKSPACE = path.join(__dirname, '.test_workspace');

var app = express()
.use(/* @callback */ function(req, res, next) {
	req.user = { workspaceDir: WORKSPACE };
	next();
})
.use(PREFIX + "*", require('../lib/file')({root: '/file'}));
var request = supertest.bind(null, app);

function byName(a, b) {
	return String.prototype.localeCompare.call(a.Name, b.Name);
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

// Writeable stream that buffers everything sent to it
function BufStream() {
	this.bufs = [];
	stream.Writable.apply(this, arguments);
}
nodeUtil.inherits(BufStream, stream.Writable);
BufStream.prototype._write = function(chunk, enc, cb) {
	this.bufs.push(Buffer.isBuffer(chunk) ? chunk : new Buffer(chunk, enc));
	cb();
};
BufStream.prototype.data = function() {
	return Buffer.concat(this.bufs);
};

/**
 * Unit test for the file REST API.
 * see http://wiki.eclipse.org/Orion/Server_API/File_API
 */
describe('File API', function() {
	beforeEach(function(done) { // testData.setUp.bind(null, parentDir)
		testData.setUp(WORKSPACE, done);
	});

	/**
	 * http://wiki.eclipse.org/Orion/Server_API/File_API#Actions_on_files
	 */
	describe('files', function() {
		describe('contents', function() {
			it('get file contents', function(done) {
				request()
				.get(PREFIX + '/project/fizz.txt')
				.expect(200, 'hello world', done);
			});
			it('file contents has ETag header', function(done) {
				request()
				.get(PREFIX + '/project/fizz.txt')
				.end(function(err, res) {
					throwIfError(err);
					assert.notEqual(res.headers.etag, null);
					done();
				});
			});
			it('put file contents', function(done) {
				var newContents = 'The time is now ' + Date.now();
				request()
				.put(PREFIX + '/project/fizz.txt')
				.send(newContents)
				.expect(200)
				.end(function(err, res) {
					throwIfError(err);
					var body = res.body;
					assert.equal(body.Directory, false);
					assert.ok(body.ETag, 'has an ETag');
					assert.equal(body.Location, PREFIX + '/project/fizz.txt');
					assert.equal(body.Name, 'fizz.txt');
					done();
				});
			});
			it('put binary file', function(done) {
				var newContents = new Buffer([0x42, 0xff]); // this is an invalid UTF-8 sequence
				request()
				.put(PREFIX + '/project/fizz.raw')
				.type('application/octet-stream')
				.send(newContents)
				.expect(200)
				.end(function(err, res) {
					throwIfError(err, "Failed to PUT");
					var body = res.body;
					assert.ok(body.ETag, 'has an ETag');
					assert.equal(body.Location, PREFIX + '/project/fizz.raw');
					assert.equal(body.Name, 'fizz.raw');

					// GET the file and ensure its contents are what was sent
					var bufStream = new BufStream();
					var req = request()
					.get(body.Location)
					.pipe(bufStream);
					req.on("finish", function() {
						var data = bufStream.data();
						assert.equal(data.length, newContents.length);
						assert.ok(data.equals(newContents), "Buffers are identical");
						done();
					});
					req.on("error", done);
				});
			});
			it('conditionally overwrite contents using If-Match', function(done) {
				var url = PREFIX + '/project/fizz.txt';
				request()
				.get(url)
				.query({ parts: 'meta' })
				.end(function(err, res) {
					throwIfError(err);
					var etag = res.body.ETag;
					assert.notEqual(res.body.ETag, null);
					request()
					.put(url)
					.set('If-Match', etag + '_blort')
					.expect(412)
					.end(/* @callback */ function(err, res) {
						throwIfError(err, "Failed to PUT " + url);
						request(url)
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
					request()
					.post(url)
					.set('X-HTTP-Method-Override', 'PATCH')
					.type('json')
					.send({ diff: [{ start: 0, end: 1, text: "j" }] })
					.expect(200)
					.end(/* @callback */ function(err, res) {
						throwIfError(err);
						request().get(url).expect(200, 'jello world', done);
					});
				});
				it('applies a patch with JSON + charset Content-Type', function(done) {
					var url = PREFIX + '/project/fizz.txt';
					request()
					.post(url)
					.set('X-HTTP-Method-Override', 'PATCH')
					.type('application/json;charset=UTF-8')
					.send({ diff: [{ start: 0, end: 1, text: "j" }] })
					.expect(200)
					.end(/* @callback */ function(err, res) {
						throwIfError(err);
						request().get(url).expect(200, 'jello world', done);
					});
				});
				it('tolerates an empty patch', function(done) {
					var url = PREFIX + '/project/fizz.txt';
					request()
					.post(url)
					.set('X-HTTP-Method-Override', 'PATCH')
					.type('text')
					.send(JSON.stringify({}))
					.expect(200)
					.end(/* @callback */ function(err, res) {
						throwIfError(err);
						done();
					});
				});
				it('gives consistent ETag between POST and GET', function(done) {
					var url = PREFIX + '/project/fizz.txt';
					request()
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
						throwIfError(err);
						var etag = res.headers.etag;
						request()
						.get(url)
						.query({ parts: 'meta' })
						.expect(200)
						.end(function(err, res) {
							throwIfError(err);
							assert.equal(etag, res.headers.etag, "Expect same ETag we got from the POST");
							done();
						});
					});
				});
			});
		});
		describe('metadata', function() {
			it('get file metadata', function(done) {
				request()
				.get(PREFIX + '/project/fizz.txt')
				.query({ parts: 'meta' })
				.expect(200)
				.end(function(err, res) {
					throwIfError(err);
					var body = res.body;
					assert.deepEqual(body.Attributes, {ReadOnly: false, Executable: false});
					assert.equal(body.Directory, false);
					assert.notEqual(body.ETag, null);
					assert.equal(typeof body.LocalTimeStamp, 'number');
					assert.equal(body.Location, PREFIX + '/project/fizz.txt');
					assert.equal(body.Name, 'fizz.txt');
					assert.equal(body.Parents.length, 1);
					assert.deepEqual(body.Parents[0], {
						ChildrenLocation: PREFIX + '/project/?depth=1',
						Location: PREFIX + '/project/',
						Name: 'project'
					});
					done();
				});
			});
			it('file metadata has ETag header', function(done) {
				request()
				.get(PREFIX + '/project/fizz.txt')
				.query({ parts: 'meta' })
				.end(function(err, res) {
					throwIfError(err);
					assert.notEqual(res.headers.etag, null);
					done();
				});
			});
		});
		it('has a correct "Parents" field', function(done) {
			request()
			.get(PREFIX + '/project/my%20folder/my%20subfolder/quux.txt')
			.query({ parts: 'meta' })
			.expect(200)
			.end(function(err, res) {
				throwIfError(err);
				assert.ok(res.body.Parents);
				assert.equal(res.body.Parents.length, 3);
				assert.equal(res.body.Parents[0].ChildrenLocation, PREFIX + '/project/my folder/my subfolder/?depth=1');
				assert.equal(res.body.Parents[0].Location, PREFIX + '/project/my folder/my subfolder/');
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
				request()
				.post(PREFIX + '/project')
				.set('Slug', 'newfile.txt')
				.expect(201)
				.end(function(err, res) {
					throwIfError(err);
					assert.equal(res.body.Name, 'newfile.txt');
					assert.equal(res.body.Directory, false);
					done();
				});
			});
			it('works with "Name" field', function(done) {
				request()
				.post(PREFIX + '/project')
				.send({ Name: 'newfile.txt' })
				.expect(201)
				.end(function(err, res) {
					throwIfError(err);
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
				request()
				.get(PREFIX + '/project/my%20folder')
				.expect(200)
				.end(function(err, res) {
					throwIfError(err);
					var body = res.body;
					assert.equal(body.Children, null, 'Children should be absent');
					assert.equal(body.ChildrenLocation, PREFIX + '/project/my folder/?depth=1');
					assert.equal(body.Directory, true);
					assert.equal(body.Name, 'my folder');
					assert.equal(body.Location, PREFIX + '/project/my folder/');
					done();
				});
			});
			it('has a correct "Parents" field', function(done) {
				request()
				.get(PREFIX + '/project/my%20folder/my%20subfolder')
				.expect(200)
				.end(function(err, res) {
					throwIfError(err);
					assert.ok(res.body.Parents);
					assert.equal(res.body.Parents.length, 2);
					assert.equal(res.body.Parents[0].ChildrenLocation, PREFIX + '/project/my folder/?depth=1');
					assert.equal(res.body.Parents[0].Location, PREFIX + '/project/my folder/');
					assert.equal(res.body.Parents[0].Name, 'my folder');
					assert.equal(res.body.Parents[1].Name, 'project');
					done();
				});
			});
		});

		describe('contents', function() {
			it('get directory contents', function(done) {
				request()
				.get(PREFIX + '/project/my%20folder')
				.query({ depth: 1 })
				.expect(200)
				.end(function(err, res) {
					throwIfError(err);
					var body = res.body;
					assert.equal(body.ChildrenLocation, PREFIX + '/project/my folder/?depth=1');
					assert.equal(Array.isArray(body.Children), true);
					body.Children.sort(byName);
					assert.equal(body.Children.length, 2);
					assert.equal(body.Children[0].Name, 'buzz.txt');
					assert.equal(body.Children[0].Directory, false);
					assert.equal(body.Children[0].Location, PREFIX + '/project/my folder/buzz.txt');
					assert.equal("ChildrenLocation" in body.Children[0], false, "Child file has no ChildrenLocation");
					assert.equal(body.Children[1].Name, 'my subfolder');
					assert.equal(body.Children[1].Directory, true);
					assert.equal(body.Children[1].Location, PREFIX + '/project/my folder/my subfolder/');
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
				request()
				.post(PREFIX + '/project')
				.type('json')
				.set('Slug', 'new directory')
				.send({ Directory: true })
				.expect(201)
				.end(function(err, res) {
					throwIfError(err);
					assert.equal(res.body.Directory, true);
					assert.equal(res.body.Location, PREFIX + '/project/new directory/'); //FIXME
					assert.equal(res.body.Name, 'new directory');
					done();
				});
			});
			it('works with "Name" field', function(done) {
				request()
				.post(PREFIX + '/project')
				.type('json')
				.send({ Name: 'new directory', Directory: true })
				.expect(201)
				.end(function(err, res) {
					throwIfError(err);
					assert.equal(res.body.Directory, true);
					assert.equal(res.body.Location, PREFIX + '/project/new directory/'); // FIXME
					assert.equal(res.body.Name, 'new directory');
					done();
				});
			});
			it('works when a string-typed Directory "true" is provided', function(done) {
				request()
				.post(PREFIX + '/project')
				.type('json')
				.send({ Name: 'new directory', Directory: 'true' })
				.expect(201)
				.end(function(err, res) {
					throwIfError(err);
					assert.equal(res.body.Directory, true);
					assert.equal(res.body.Location, PREFIX + '/project/new directory/'); // FIXME
					assert.equal(res.body.Name, 'new directory');
					done();
				});
			});
			it('works when a string-typed Directory "false" is provided', function(done) {
				request()
				.post(PREFIX + '/project')
				.type('json')
				.set('Slug', 'Not a directory')
				.send({ Directory: "false" })
				.expect(201)
				.end(function(err, res) {
					throwIfError(err);
					assert.equal(res.body.Directory, false);
					assert.equal(res.body.Location, PREFIX + '/project/Not a directory'); //FIXME
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
			request()
			.del(PREFIX + '/project/my%20folder/buzz.txt')
			.expect(204)
			.end(/* @callback */ function(err, res) {
				throwIfError(err, "failed to DELETE file");
				// subsequent requests should 404
				request()
				.get(PREFIX + '/project/my%20folder/buzz.txt')
				.expect(404)
				.end(done);
			});
		});
		it('delete a directory', function(done) {
			request()
			.del(PREFIX + '/project/my%20folder')
			.expect(204)
			.end(/* @callback */ function(err, res) {
				throwIfError(err, "Failed to DELETE folder");
				// the directory is gone:
				request()
				.get(PREFIX + '/project/my%20folder')
				.expect(404)
				.end(/* @callback */ function(err, res) {
					throwIfError(err);
					// and its contents are gone:
					request()
					.get(PREFIX + '/project/my%20folder/buzz.txt')
					.expect(404)
					.end(done);
				});
			});
		});
		it('conditional delete using If-Match', function(done) {
			var url = PREFIX + '/project/fizz.txt';
			request()
			.get(url)
			.query({ parts: 'meta' })
			.end(function(err, res) {
				throwIfError(err, "Failed to get folder");
				var etag = res.body.ETag;
				assert.notEqual(res.body.ETag, null);
				request()
				.del(url)
				.set('If-Match', etag + '_blort')
				.expect(412)
				.end(/* @callback */ function(err, res) {
					throwIfError(err, "Expected precondition to fail");
					request(url)
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
			request()
			.post(PREFIX + '/project/my%20folder')
			.set('Slug', 'copy_of_fizz.txt')
			.set('X-Create-Options', 'copy')
			.send({ Location: PREFIX + '/project/fizz.txt' })
			.expect(201)
			.end(function(err, res) {
				throwIfError(err);
				assert.equal(res.body.Name, 'copy_of_fizz.txt');
				done();
			});
		});
		it('copy a file overwrites when "no-overwrite" is not set', function(done) {
			// cp project/fizz.txt "project/my folder/buzz.txt"
			request()
			.post(PREFIX + '/project/my%20folder')
			.set('Slug', 'buzz.txt')
			.set('X-Create-Options', 'copy')
			.send({ Location: PREFIX + '/project/fizz.txt' })
			.expect(200) // 200 means overwritten
			.end(function(err, res) {
				throwIfError(err, "Failed to overwrite");
				// It's in the expected place:
				assert.equal(res.body.Name, 'buzz.txt');
				assert.equal(res.body.Parents[0].Name, 'my folder');
				// And has the expected contents:
				request()
				.get(res.body.Location)
				.expect(200, 'hello world', done);
			});
		});
		it('copy a directory', function(done) {
					debugger;
			request()
			.post(PREFIX + '/project/')
			.set('Slug', 'copy_of_my_folder')
			.set('X-Create-Options', 'copy')
			.send({ Location: PREFIX + '/project/my folder' })
			.expect(201)
			.end(function(err, res) {
				throwIfError(err);
				// Ensure the copy has the expected children
				assert.ok(res.body.ChildrenLocation);
				request()
				.get(res.body.ChildrenLocation)
				.expect(200)
				.end(function(err, res) {
					throwIfError(err);
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
			request()
			.post(PREFIX + '/project/my%20folder')
			.set('Slug', 'fizz_moved.txt')
			.set('X-Create-Options', 'move')
			.send({ Location: PREFIX + '/project/fizz.txt' })
			.expect(201)
			.end(function(err, res) {
				throwIfError(err);
				assert.equal(res.body.Name, 'fizz_moved.txt');
				done();
			});
		});
		it('move & rename a directory', function(done) {
			// mv "project/my folder/my subfolder/fizz.txt" "project/my folder/fizz_moved.txt"
			request()
			.post(PREFIX + '/project/my%20folder')
			.set('Slug', 'fizz_moved.txt')
			.set('X-Create-Options', 'move')
			.send({ Location: PREFIX + '/project/fizz.txt' })
			.expect(201)
			.end(function(err, res) {
				throwIfError(err);
				assert.equal(res.body.Name, 'fizz_moved.txt');
				done();
			});
		});
	});
});