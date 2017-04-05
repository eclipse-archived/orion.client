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
exports.tearDown = tearDown;
