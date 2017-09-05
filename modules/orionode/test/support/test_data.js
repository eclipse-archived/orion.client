/*******************************************************************************
 * Copyright (c) 2013, 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/
var path = require('path'),
	fs = require('fs'),
	rimraf = require('rimraf'),
	express = require('express'),
	workspace = require('../../lib/workspace'),
	supertest = require('supertest'),
	store = require('../../lib/metastore/fs/store'),
	CONTEXT_PATH = '';

function debug(msg) {
	if (exports.DEBUG) {
		console.log(msg);
	}
}

/**
 * Deletes dir and everything in it.
 * @param {string} dir The directory to delete
 * @param {fn} callback The function to call when the deletion is done
 */
exports.tearDown = tearDown = function tearDown(dir, callback) {
	rimraf(dir, callback);
};

/**
 * Sets up the workspace metadata 
 * @param {string} workspace The workspace path
 * @param {?} metastore The backing metastore
 * @param {?} params The params to use
 */
exports.setUpWorkspace = function setUpWorkspace(wsDir, metastore, done) {
	var app = express();
	var options = { workspaceDir: wsDir,
					configParams: { 
						"orion.single.user": true, 
						"orion.single.user.metaLocation": metastore
					} , 
					workspaceRoot: CONTEXT_PATH + '/workspace', 
					fileRoot: CONTEXT_PATH + '/file', 
					gitRoot: CONTEXT_PATH + '/gitapi'
				 };
	app.locals.metastore = store(options);
	app.locals.metastore.setup(app);
	app.use(CONTEXT_PATH + '/workspace*', workspace(options));
	var request = supertest.bind(null, app);
	
	request()
		.post(CONTEXT_PATH + '/workspace')
		.set('Slug', 'Orion Content')
		.expect(200)
		.end(done);
};

/**
 * Synchronously creates a workspace directory with a few files and folders.
 * Uses POSIX shell commands, so on Windows this must be run from within a Cygwin or MinGW shell. CMD.EXE will not work.
 <pre>
   dir
   |---project/
   |-----fizz.txt
   |-----my folder/
   |-------buzz.txt
   |-------my subfolder/
 </pre>
 */
exports.setUp = function setUp(dir, callback, wsjson) {
	debug('Using directory: ' + dir);
	function generateContent() {
		debug('\nCreating content...');
		var projectFolder = path.join(dir, "project");
		var myFolder = path.join(projectFolder, "my folder");
		var subfolder = path.join(myFolder, "my subfolder");

		fs.mkdirSync(projectFolder);
		fs.mkdirSync(myFolder);
		fs.mkdirSync(subfolder);
		if(wsjson || wsjson === undefined) {
			fs.writeFileSync(path.join(dir, 'workspace.json'), '{}');
		}
		fs.writeFileSync(path.join(projectFolder, "fizz.txt"), "hello world");
		fs.writeFileSync(path.join(myFolder, "buzz.txt"), "buzzzz");
		fs.writeFileSync(path.join(subfolder, "quux.txt"), "whoa");
		callback();
	}
	if(fs.existsSync(dir)) {
		debug('\nDirectory exists; cleaning...');
		tearDown(dir, function(err) {
			if (err) {
				debug(err);
				return;
			}
			fs.mkdirSync(dir);
			generateContent();
		});
	} else {
		fs.mkdirSync(dir);
		generateContent();
	}
}

exports.DEBUG = process.env.DEBUG_TESTS || false;
