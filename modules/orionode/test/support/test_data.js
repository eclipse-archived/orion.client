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
var child_process = require('child_process');
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var express = require('express');

var supertest = require('supertest');
var CONTEXT_PATH = '';
var configParams = { "orion.single.user": true };
var WORKSPACEDIR = path.join(__dirname, '.test_workspace');

var app = express();
var options = {workspaceDir: WORKSPACEDIR, configParams:configParams};
app.locals.metastore = require('../../lib/metastore/fs/store')(options);
app.locals.metastore.setup(app);
app.use(CONTEXT_PATH + '/workspace*', require('../../lib/workspace')({ workspaceRoot: CONTEXT_PATH + '/workspace', fileRoot: CONTEXT_PATH + '/file', gitRoot: CONTEXT_PATH + '/gitapi', options: options }));
var request = supertest.bind(null, app);
var WORKSPACE = CONTEXT_PATH + '/workspace';

function debug(msg) {
	if (exports.DEBUG) {
		console.log(msg);
	}
}

/**
 * Deletes dir and everything in it.
 */
function tearDown(dir, callback) {
	rimraf(dir, callback);
}

function setUpWorkspace() {
	 request()
	.get('/user')
	.end(function(){
		request()
		.post(WORKSPACE)
		.set('Slug', 'Orion Content')
		.end(function(){
			console.log("Done Creating workspace")
		});
	});
}

/**
 * Creates a workspace directory with a few files and folders.
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
function setUp(dir, callback) {
	debug('Using directory: ' + dir);
	function generateContent() {
		debug('\nCreating content...');
		/*
		mkdir project
		mkdir "project/my folder"
		mkdir "project/my folder/my subfolder"
		echo -n "hello world" > "project/fizz.txt"
		echo -n "buzzzz" > "project/my folder/buzz.txt"
		echo -n "whoa" > "project/my folder/my subfolder/quux.txt"
		*/
		var projectFolder = path.join(dir, "project");
		var myFolder = path.join(projectFolder, "my folder");
		var subfolder = path.join(myFolder, "my subfolder");

		fs.mkdirSync(projectFolder);
		fs.mkdirSync(myFolder);
		fs.mkdirSync(subfolder);
		fs.writeFileSync(path.join(dir, 'workspace.json'), '{}');
		fs.writeFileSync(path.join(projectFolder, "fizz.txt"), "hello world");
		fs.writeFileSync(path.join(myFolder, "buzz.txt"), "buzzzz");
		fs.writeFileSync(path.join(subfolder, "quux.txt"), "whoa");
		callback();
	}
	fs.exists(dir, function(exists) {
		if (exists) {
			debug('\nDirectory exists; cleaning...');
			tearDown(dir, function(err) {
				if (err) {
					debug(err);
					return;
				}
				fs.mkdir(dir, generateContent);
			});
		} else {
			fs.mkdir(dir, generateContent);
		}
	});
}


exports.DEBUG = process.env.DEBUG_TESTS || false;
exports.setUp = setUp;
exports.setUpWorkspace = setUpWorkspace;
exports.tearDown = tearDown;
