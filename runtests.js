/*******************************************************************************
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*jslint node:true*/
/**
 * Performs the programatic equivalent of running `grunt --force --verbose` from the command line.
 * Need this for CF where running grunt from the command line has.. issues
 */
try {
	var grunt = require("grunt");

	// Grunt finds Gruntfile.js automatically

	var tasklist = [];
	grunt.tasks(tasklist, {
		force: true,
		stack: true,
		verbose: true,
		"no-color": !!(process.env.VCAP_APPLICATION) // CF logs can't deal with color codes
	});
} catch(e) {
	// Uncaught exceptions are getting swallowed in CF env, need to log explicitly
	console.log(e && e.stack);
}
