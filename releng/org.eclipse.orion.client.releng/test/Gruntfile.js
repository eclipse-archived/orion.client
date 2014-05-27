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
/*
 * Script for running Orion mocha tests at Sauce Labs. This launches a mini Orion web server (using connect)
 * that hosts the client code. Then Sauce Labs API is called, passing the URLs of test pages on the web
 * server. Sauce loads the URLs in various browsers. This script captures the test results. The caller
 * can request the /testresults URL which will remain open until the tests results are available, then
 * return a zip file containing all results.
 *
 * Each test page needs to use Orion's mocha wrapper (see `sauce.js`) to integrate with this script.
 *
 * The following environment variables are supported:
 * BUILD_ID                optional
 * BUILD_NAME              optional
 * BUILD_TAG               optional
 * SAUCE_USERNAME          required
 * SAUCE_ACCESS_KEY        required
 * QUIT                    optional If set, program quits after tests finish instead of running forever. Default: not set
 *
 * For running the script locally or on a server that is not accessible from the public Internet:
 * TUNNEL                  optional If set, Sauce Tunnel will be established. Default: not set
 *
 * For running the script under CF:
 * VCAP_APP_HOST           optional If set, web server will listen on this hostname.
 * VCAP_APP_PORT           optional If set, web server will listen on this port.
 * VCAP_APPLICATION        optional String containing JSON with the following fields:
 *   application_uris[]    optional The publicly accessible URIs of this application.
 */
module.exports = function(grunt) {
	var orionClient = __dirname + "/",
		packageRoot = __dirname + "/";
	var _path = require("path"),
	    _url = require("url"),
	    archiver = require("archiver"),
	    Q = require("q"),
	    zlib = require("zlib"),
	    util = require(orionClient + "modules/orionode/build/utils")(grunt);
	var config = util.loadBuildConfig(orionClient + "/releng/org.eclipse.orion.client.releng/builder/scripts/orion.build.js"),
	    bundles = util.parseBundles(config, { orionClient: orionClient }),
	    pkg = grunt.file.readJSON(packageRoot + "package.json"),
	    results = packageRoot + pkg.results, // dirs provided in package.json are relative to package.json
	    env = process.env,
	    vcap_app = getJSON(env.VCAP_APPLICATION);
	// Track the tests that have finished so far
	var testFilenames = [];
	var testPromises = {
		index: 0,
		deferreds: (function() {
			var a = [], testCount = pkg.browsers.length * pkg.urls.length;
			for (var i=0; i < testCount; i++)
				a.push(Q.defer());
			return a;
		}()),
		next: function() {
			return this.deferreds[this.index++] || null;
		}
	};
	var allTests = Q.allSettled(testPromises.deferreds.map(function(d) { return d.promise; }));

	grunt.initConfig({
		pkg: pkg,
		buildId: env.BUILD_ID || new Date().toISOString(),
		protocol: "http",
		hostname: env.VCAP_APP_HOST || "127.0.0.1",
		port: env.VCAP_APP_PORT || 9999,
		appHostname: (vcap_app && vcap_app.application_uris && vcap_app.application_uris[0]) || "127.0.0.1",
		appPort: "TUNNEL" in env ? 9999 : 80,
		tunnel: "TUNNEL" in env,
		quit: "QUIT" in env,
		connect: {
			server: {
				options: {
					protocol: "<%= protocol %>",
					hostname: "<%= hostname %>",
					port: "<%= port %>",
					base: bundles.map(function(bundle) { return bundle.web; }),
					middleware: function(connect, options, middlewares) {
						// Inject logger and compress at the top of the middleware stack
						middlewares.splice(0, 0, connect.logger(), connect.compress());
						// And /testresults at the bottom
						middlewares.push(testResultsMiddleware);
						return middlewares;
					}
				}
			}
		},
		// Dynamically downloads a gzip library for use by sauce.js in browser.
		// TODO remove this task once we get a library shipped with Orion
		curl: {
			long: {
				src: "https://raw.githubusercontent.com/nodeca/pako/master/dist/pako.js",
				dest: _path.join(orionClient, "bundles/org.eclipse.orion.client.core/web/pako/pako.js")
			}
		},
		"saucelabs-mocha": {
			all: {
				options: {
					// `urls` is set later
					tunneled: "<%= tunnel %>",
					tunnelTimeout: 10,
					build: pkg.buildId,
					browsers: pkg.browsers,
					testname: env.BUILD_NAME || "mocha client",
					tags: [env.BUILD_TAG || "master"],
					onTestComplete: onTestComplete
				}
			}
		},
	});

	// Load dependencies
	Object.keys(pkg.dependencies).forEach(function(key) {
		if (key !== "grunt-cli" && /^grunt-/.test(key)) {
			grunt.loadNpmTasks(key);
		}
	});

	// Configure tasks
	grunt.config("saucelabs-mocha.all.options.urls", pkg.urls.map(function(url) {
		return _url.format({
			protocol: grunt.config.get("protocol"),
			hostname: grunt.config.get("appHostname"),
			port: grunt.config.get("appPort"),
			pathname: url
		});
	}));

	// Register tasks
	grunt.registerTask("check", "Check prerequisites", function() {
		grunt.verbose.subhead("Checking environment vars...");
		!(env.SAUCE_USERNAME)   && grunt.fatal("Required environment variable not set: SAUCE_USERNAME");
		!(env.SAUCE_ACCESS_KEY) && grunt.fatal("Required environment variable not set: SAUCE_ACCESS_KEY");
		grunt.verbose.write("OK");
		grunt.verbose.write("Checking package.json...");
		!(pkg.results) && grunt.fatal("Required property `results` not found in package.json");
		!(pkg.browsers) && grunt.fatal("Required property `browsers` not found in package.json");
		grunt.verbose.write("OK");
	});
	// Workaround for https://github.com/axemclion/grunt-saucelabs/issues/116
	grunt.registerTask("wait", "Wait for exit", function() {
		var done = this.async();
		allTests.then(function() {
			if (grunt.config.get("quit")) {
				grunt.verbose.writeln("'wait' task exiting...");
				done();
			} else {
				grunt.verbose.writeln("waiting forever...");
			}
		});
	});
	grunt.registerTask("server", ["curl", "connect"]);
	grunt.registerTask("sauce", ["check", "saucelabs-mocha", "wait"]);
	grunt.registerTask("test", ["server", "sauce"]);
	grunt.registerTask("default", "test");

	/**
	 * Fixes up the <testsuite> name
	 * @param {String} xml The xunit test result
	 * @returns {String} The test result with platform info and test URL prepended onto the testsuite name
	 */
	function nicerName(xml, sauceResult, testUrl) {
		return xml.replace(/<testsuite\s+name="([^"]+)"/, function(match, oldName) {
			var newName = oldName + " - " + testUrl + " - " + sauceResult.platform.join(" ");
			return "<testsuite name=\"" + newName + "\"";
		});
	}

	/**
	 * Called per browser, per test page, after a test job is complete.
	 * @param {Object} sauceResults The job result object returned from Sauce Labs.
	 */
	function onTestComplete(sauceResult) {
		//var done = this.async(); // TODO
		grunt.verbose.writeln("onTestComplete #" + testPromises.index);
		var deferred = testPromises.next();
		try {
			grunt.verbose.write("Got test result: ");
			grunt.verbose.oklns(JSON.stringify(sauceResult));
			var mochaResult = sauceResult.result,
			   id = sauceResult.id,
			   testurl = mochaResult.url || "",
			   gzippedXml = mochaResult.xunit,
			   filename = "TEST-" + testurl.replace(/[^A-Za-z0-9_\-]/g, "_") + "_" + id + ".xml";
			if (/experienced an error/.test(sauceResult.message))
				throw new Error(sauceResult.message);
			if (!testurl)
				throw new Error("Test " + id + " did not return its url. Ensure it is using sauce.js");
			if (!gzippedXml)
				throw new Error("Test " + testurl + " did not return an xunit result. Ensure it is using sauce.js.");
			grunt.verbose.write("Inflating compressed xunit result...");
			zlib.gunzip(new Buffer(gzippedXml, "base64"), function(err, buffer) {
				if (err) {
					grunt.warn(err);
					deferred.reject(err);
				}
				grunt.verbose.ok();
				var xunitReport = buffer.toString("utf8");
				grunt.verbose.write("Replacing xunit testsuite name" + "...");
				xunitReport = nicerName(xunitReport, sauceResult, testurl);
				grunt.verbose.ok();

				grunt.file.write(_path.join(results, filename), xunitReport);
				testFilenames.push(filename);
				grunt.verbose.ok();
				deferred.resolve();
			});
		} catch (e) {
			grunt.warn(e);
			deferred.reject(e);
		}
	}

	// Middleware for delivering all test results as a zip.
	function testResultsMiddleware(req, res, next) {
		if (req.url !== "/testresults" || req.method !== "GET")
			return next();
		// Keep the connection open until all the test results have come in
		allTests.then(function() {
			grunt.verbose.writeln("Sending result zip...");
			res.setHeader("Content-Type", "application/x-zip");
			res.setHeader("Content-Disposition", "attachment; filename=tests-" + grunt.config.get("buildId") + ".zip;");
			var archive = archiver("zip");
			archive.on("error", grunt.warn);
			archive.pipe(res);
			archive.bulk([
				{ expand: true, cwd: results, src: testFilenames }
			]);
			archive.finalize();
			res.on("close", grunt.warn.bind(grunt));
			res.on("finish", function() {
				grunt.verbose.writeln("Sent result zip (" + archive.pointer() + " bytes)");
			});
		}).catch(grunt.warn).done();
	}

	function getJSON(str) {
		try {
			return JSON.parse(str);
		} catch (e) {
			return null;
		}
	}
};