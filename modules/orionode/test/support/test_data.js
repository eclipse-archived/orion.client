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
/*eslint-env node*/
var child_process = require('child_process');
var fs = require('fs');
var rimraf = require('rimraf');

function debug(msg) {
	if (exports.DEBUG) {
		console.log(msg);
	}
}

function sequential_commands(cwd, commands, callback) {
	commands = Array.prototype.slice.call(commands);
	function next() {
		if (!commands.length) {
			callback();
		} else {
			var command = commands.shift();
			debug('$ ' + command.cmd + ' ' + command.args.join(' '));
			var child = child_process.spawn(command.cmd, command.args, {cwd: cwd, stdio: [null, process.stdout, process.stderr]});//'ignore'});
			child.on('exit', next);
		}
	}
	next();
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
		sequential_commands(dir, [
			{ cmd: 'mkdir', args: ['project'] },
			{ cmd: 'mkdir', args: ['project/my folder'] },
			{ cmd: 'mkdir', args: ['project/my folder/my subfolder'] },
			{ cmd: 'bash',    args: ['-c', 'echo -n "hello world" > "project/fizz.txt"'] },
			{ cmd: 'bash',    args: ['-c', 'echo -n "bzzzz"       > "project/my folder/buzz.txt"'] },
			{ cmd: 'bash',    args: ['-c', 'echo -n "whoa"        > "project/my folder/my subfolder/quux.txt"'] }
		], callback);
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
