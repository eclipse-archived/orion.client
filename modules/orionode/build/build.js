/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/**
 * Usage: node build.js [path_to_bundles_folder] [path_to_build.js_file]
 */

/*global __dirname Buffer console process require*/
/*jslint regexp:false laxbreak:true*/

// compat shim for v0.6-0.8 differences
require('../lib/compat');

var async = require('../lib/async');
var child_process = require('child_process');
var dfs = require('deferred-fs'), Deferred = dfs.Deferred;
var path = require('path');

var BUNDLE_WEB_FOLDER = './web/';
var IS_WINDOWS = process.platform === 'win32';

/*
 * Pages that the Node server never uses are listed here. We will skip optimizing them to save time.
 */
var EXCLUDE_PAGES = [
	"index",
	"cFDeployService",
	"deploy",
	"logs",
	"cFPlugin",
	"authenticationPlugin",
	"GerritFilePlugin",
	"GitHubFilePlugin",
	"npmPlugin",
	"preferencesPlugin",
	"sitePlugin",
	"gitBlamePlugin",
	"site",
	"sites",
	"view",
	"taskPlugin",
	"LoginWindow",
	"manageOpenids",
	"gitPlugin",
	"git-log",
	"git-status",
	"git-repository",
	"git-commit",
	"user-list",
	"userservicePlugin",
];

var pathToNode = process.execPath;
var pathToRjs = require.resolve('requirejs');

var pathToOrionClientBundlesFolder = process.argv[2]
	? path.resolve(__dirname, process.argv[2])
	: path.resolve(__dirname, '../../../bundles/');
var pathToBuildFile = process.argv[3]
	? path.resolve(__dirname, process.argv[3])
	: path.resolve(pathToOrionClientBundlesFolder, '../releng/org.eclipse.orion.client.releng/builder/scripts/orion.build.js');
var nodeBuildFile = pathToBuildFile + ".node.js";
var pathToOrionodeClient = path.resolve(__dirname, '../lib/orionode.client/');
var pathToTempDir = path.resolve(__dirname, '.temp');
var pathToOutDir = path.resolve(__dirname, '.temp-optimized');

// Arguments to format() for replacing the property ${buildDirectory} in a string
var bundleFormatArgs = { buildDirectory: path.join(pathToOrionClientBundlesFolder, "../") };

/**
 * Pass varargs to get numbered parameters, or a single object for named parameters.
 * eg. format('${0} dollars and ${1} cents', 3, 50);
 * eg. format('${dollars} dollars and ${cents} cents', {dollars:3, cents:50});
 * @param {String} str String to format.
 * @param {varags|Object} arguments 
 */
function format(str/*, args..*/) {
	var maybeObject = arguments[1];
	var args = (maybeObject !== null && typeof maybeObject === 'object') ? maybeObject : Array.prototype.slice.call(arguments, 1);
	return str.replace(/\$\{([^}]+)\}/g, function(match, param) {
		return args[param];
	});
}

/**
 * @param {Object} [options]
 * @returns {Deferred} Doesn't reject (but perhaps it should -- TODO)
 */
function execCommand(cmd, options, suppressError) {
	options = options || {};
	suppressError = typeof suppressError === 'undefined' ? false : suppressError;
	var d = new Deferred();
	console.log(cmd);
	child_process.exec(cmd, {
		cwd: options.cwd || pathToTempDir,
		stdio: options.stdio || 'inherit'
	}, function (error, stdout, stderr) {
		if (error && !suppressError) {
			console.log(error.stack || error);
		}
		if (stdout) { console.log(stdout); }
		d.resolve();
	});
	return d;
}

function spawn(cmd, args, options) {
	options = options || {};
	var d = new Deferred();
	console.log(cmd + ' ' + args.join(' ') + '');
	var child = child_process.spawn(cmd, args, {
		cwd: options.cwd || pathToTempDir,
		stdio: [process.stdin, process.stdout, process.stderr]
	});
	child.on('exit', function(code) {
		d.resolve();
	});
	return d;
}

function getCopyFileCmd(srcFile, destFile) {
	return IS_WINDOWS ? format('echo f | xcopy /q /y /i "${0}" "${1}"', srcFile, destFile) : format("cp ${0} ${1}", srcFile, destFile);
}

/** @returns {String} command for performing recursive copy of src directory to dest directory. */
function getCopyDirCmd(src, dest) {
	return IS_WINDOWS ? format('xcopy /e /h /q /y /i "${0}" "${1}"', src, dest) : format("cp -R ${0}/* ${1}", src, dest);
}

function section(name) {
	console.log('-------------------------------------------------------\n' + name + '...\n');
}

function getBaseName(modulePath) {
	return modulePath.split("/").pop();
}

function getPageDir(modulePath) {
	var segs = modulePath.split("/");
	segs.pop();
	return segs.length ? segs.join("/") : ".";
}

function build(buildConfig) {
	var filteredModules = buildConfig.modules.slice().filter(function(module) {
		// Filter out modules we don't care about
		var name = module.name;
		if (EXCLUDE_PAGES.indexOf(getBaseName(name)) === -1)
			return true;
		console.log("Skip module: " + name);
		return false;
	});
	var optimizes = filteredModules.map(function(module) {
		var pageDir = getPageDir(module.name), baseName = getBaseName(module.name);
		return {
			pageDir: pageDir,
			name: baseName,
			bundle: format(module.bundle, bundleFormatArgs),
			outPath: path.join(pathToOutDir, pageDir, baseName) + '.js',
			builtFilePath: path.join(pathToOutDir, pageDir, 'built-' + baseName) + '.js',
			htmlFilePath: path.join(pathToOutDir, pageDir, baseName + '.html')
		};
	});
	var cssFiles = optimizes.map(function(op) {
		// Assume {name}.js has a {name}.css
		var tempPath = path.join(op.pageDir, op.name + '.css');
		return {
			bundlePath: path.join(op.bundle, BUNDLE_WEB_FOLDER, tempPath),
			builtFilePath: path.join(pathToOutDir, tempPath)
		};
	});

	/*
	 * Build steps begin here
	 */
	// When debugging, change these to false to skip steps.
	var steps = {
		stage: true,
		optimize: true,
		updateHtml: true,
		updateJS: true,
		copyBack: true
	};
	return dfs.exists(pathToTempDir).then(function(exists) {
		if (exists) {
			section('Removing old temp dir ' + pathToTempDir);
			var buildDir = __dirname;
			var cleanCmd = IS_WINDOWS ? format('del /s /f /q "${0}\\*.*" 1> nul', pathToTempDir) : format('rm -rf ${0}', pathToTempDir);
			return execCommand(cleanCmd, {cwd: buildDir}).then(function() {
				if (IS_WINDOWS) {
					return execCommand(format('rmdir /s /q "${0}"', pathToTempDir), {cwd: buildDir});
				}
			});
		}
	}).then(function() {
		section('Creating temp dir ' + pathToTempDir);
		return dfs.mkdir(pathToTempDir);
	}).then(function() {
		// Copy all required files into the .temp directory for doing the build
		if (steps.stage === false) { return new Deferred().resolve(); }
		section('Staging client code to ' + pathToTempDir);

		console.log('Copying orion.client');

		/* Convert from project layout to WWW layout by copying all the bundles' ./web/ folders into the 
		 * temp dir. This produces the path structure consumable by RequireJS.
		 */
		var bundles = buildConfig.bundles;
		return async.sequence(bundles.map(function(bundle) {
				bundle = format(bundle, bundleFormatArgs);
				return function() {
					var bundleWebFolder = path.resolve(pathToOrionClientBundlesFolder, bundle, BUNDLE_WEB_FOLDER);
					return dfs.exists(bundleWebFolder).then(function(exists) {
						if (exists) {
							return execCommand(getCopyDirCmd(bundleWebFolder, pathToTempDir));
						} else {
							console.log('Bundle has no web/ folder, skip: ' + bundle);
							return;
						}
					});
				};
		}).concat([
			function() {
				// We copy the orionode.client resources last, as they must override anything from orion.client
				console.log('Copying orionode.client');
				return execCommand(getCopyDirCmd(pathToOrionodeClient, pathToTempDir));
			}
		]));
	}).then(function() {
		if (steps.optimize === false) { return new Deferred().resolve(); }
		section('Optimizing app...');

		// Make a copy of the build file with our exclusions applied, then run against the copy
		buildConfig.modules = filteredModules;
		buildConfig.skipDirOptimize = true;
		var text =  "(" + JSON.stringify(buildConfig, null, 4) + ")";
		return dfs.writeFile(nodeBuildFile, text).then(function() {
			console.log("Using modified build file: " + text);
			return spawn(pathToNode, [
				pathToRjs,
				"-o",
				nodeBuildFile,
				"optimize=uglify",
				"appDir=" + pathToTempDir,
				"baseUrl=./",
				"dir=" + pathToOutDir,
			], { cwd: pathToTempDir }).then(function() {
				// App build has finished. Copy each optimized module ${name}.js to its built-${name}.js
				return async.sequence(optimizes.map(function(op) {
					return function() {
						return execCommand(getCopyFileCmd(op.outPath, op.builtFilePath));
					};
				}));
			});
		});
	}).then(function() {
		if (steps.updateHtml === false) { return new Deferred().resolve(); }
		section('Running updateHTML');
		return async.sequence(optimizes.map(function(op) {
			return function() {
				// TODO stat builtFilePath, only perform the replace if builtFile.size > 0
				var name = op.name;
				var builtResult = 'require(["built-' + name + '.js"]);';
				console.log("updateHTML " + op.htmlFilePath);
				return dfs.readFile(op.htmlFilePath, 'utf8').then(function(htmlFile) {
					htmlFile = htmlFile.replace("require(['" + name + ".js']);", builtResult);
					htmlFile = htmlFile.replace('require(["' + name + '.js"]);', builtResult);
					htmlFile = htmlFile.replace("requirejs/require.js", "requirejs/require.min.js");
					return dfs.writeFile(op.htmlFilePath, htmlFile);
				}, function(error) {
					// log and continue
					console.log(error.stack || error);
					console.log('');
				});
			};
		}));
	}).then(function() {
		if (steps.updateJS === false) { return new Deferred().resolve(); }
		section('Running updateJS');
		return async.sequence(optimizes.map(function(op) {
			return function() {
				// Replace define("{pageDir}/{name}" with define("built-{name}.js" in built js files
				// TODO check existence of path.join(pageDir, name) -- skip if the file doesn't exist
				var pageDir = op.pageDir, name = op.name, builtJsFile = op.builtFilePath;
				var buildResult = 'define("built-' + name + '.js"';
				console.log("updateJS " + builtJsFile);
				return dfs.readFile(builtJsFile, 'utf8').then(function(jsFile) {
					jsFile = jsFile.replace("define('" + pageDir + "/" + name + "'", buildResult);
					jsFile = jsFile.replace('define("' + pageDir + '/' + name + '"', buildResult);
					return dfs.writeFile(builtJsFile, jsFile);
				}, function(error) {
					// log and continue
					console.log(error.stack || error);
					console.log('');
				});
			};
		}));
	}).then(function() {
		if (steps.copyBack === false) { return new Deferred().resolve(); }
		// Copy the built files from output directory back to their original locations in the bundles folder
		// TODO: should create a separate 'optimized' source folder to avoid polluting the lib/orion.client/ folder.
		section('Copy built files to ' + pathToOrionClientBundlesFolder);
		return async.sequence(optimizes.map(function(op) {
			return function() {
				var args = {
					builtJsFile: op.builtFilePath,
					htmlFile: op.htmlFilePath,
					originalFolder: path.join(op.bundle, BUNDLE_WEB_FOLDER, op.pageDir)
				};
				if (IS_WINDOWS) {
					return execCommand(format('xcopy /q /y /i ${builtJsFile} ${originalFolder}', args)).then(
							function() {
								return execCommand(format('xcopy /q /y /i ${htmlFile} ${originalFolder}', args));
							});
				} else {
					return execCommand(format("cp ${builtJsFile} ${htmlFile} ${originalFolder}", args));
				}
			};
		})).then(function() {
			section('Copy optimized CSS files to ' + pathToOrionClientBundlesFolder);
			return async.sequence(cssFiles.map(function(cssFile) {
				return function() {
					var optimizedCssPath = cssFile.builtFilePath;
					return dfs.exists(optimizedCssPath).then(function(exists) {
						if (exists) {
							return execCommand(getCopyFileCmd(optimizedCssPath, cssFile.bundlePath));
						}
					});
				};
			}));
		});
	});
}

function parseBuildFile(filepath) {
	return dfs.readFile(filepath, "utf8").then(function(text) {
		return new Function("var b = " + text + "; return b;")();
	});
}

function exitFail(error) {
	if (error) { console.log('An error occurred: ' + (error.stack || error)); }
	process.exit(1);
}

function exitSuccess() { process.exit(0); }

/*
 * The fun starts here
 */
parseBuildFile(pathToBuildFile).then(build).then(
	exitSuccess,
	exitFail);
