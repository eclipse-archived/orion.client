#!/usr/bin/env node
/*eslint-env node*/
var path = require('path');
var argsLib = require('../lib/args');
var orion = require("../index.js");

// get the current working directory (where "orion" invoked from)
var cwd = process.cwd();

// set up workspace and port
var workspaceDir; 
var port;
var argv = process.argv;

if(argv.length == 2) {
	// if only 2, it's "node /path/to/orion.js" - no args
	workspaceDir = cwd;
	port = 8081;
} else if (argv.length == 3) {
	// if 3, it should be "node /path/to/orion.js workspaceArg"
	workspaceDir = path.resolve(cwd, argv[2]);
	port = 8081;
} else {
	// if more than 3, extra args passed; parse them
	var args = argsLib.parseArgs(process.argv);
	
	// third argument is not a -x, e.g. workspace and then other flags
	// "node /path/to/orion.js workspaceArg ..." so use workspaceArg
	if(!(match = /-(\w+)/.exec(argv[2]))) {
		workspaceDir = path.resolve(cwd, argv[2]);
	} else {
		// otherwise use -workspace, -w, or cwd
		var argsW = null;
		if(args.workspace) {
			argsW = path.resolve(cwd, args.workspace);
		} else if(args.w) {
			argsW = path.resolve(cwd, args.w);
		}
		workspaceDir = argsW || cwd;
	}
	port = args.port || args.p || process.env.PORT || 8081;
}

// set up all parameters for startServer
// only allows user to set workspaceDir and port
var params = {
	port: port,
	workspaceDir: workspaceDir,
	passwordFile: null,
	password: null,
	configParams: {"orion.single.user":true},
	dev: null,
	log: null
};

// Show workspace to the user
console.log("Using workspace: " + params.workspaceDir);

// Try to start the server (any errors thrown will show on console)
orion(params).listen(params.port);

// If successfully start server, show listening message
console.log("Listening on port " + params.port + "...");
