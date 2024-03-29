/*eslint-env node*/
var _path = require("path"),
	fingerPrintRegistry = require("./build/fingerPrint"),
    utilFactory = require("./build/utils");
module.exports = function(grunt) {
	var util = utilFactory(grunt),
	    BADDIR = "This Gruntfile must be run from the modules/orionode folder in the Orion client repository.",
	    SOURCE_GLOB = ["**", "!**/node_modules/**", "!**/built/**", "!**/builder/**", "!**/target/**"],
	    // All paths here are relative to Gruntfile.js
	    configPath = grunt.option("configPath") || "../../releng/org.eclipse.orion.client.releng/builder/scripts/orion.build.js",
	    extraModules = grunt.option("extraModules") ? grunt.option("extraModules").split(",") : [],
	    clientPath = "../../",
	    staging = "target/staging/",
	    optimized = "target/optimized/",
	    fingerPrint = grunt.option("fingerPrint") || false,
	    generateSourceMaps = grunt.option("generateSourceMaps") || false,
	   // skipTest = grunt.option("skipTest") || false,
	    skipMinify = grunt.option("skipMinify") || false;

	var orionBuildConfig = util.loadBuildConfig(configPath),
	    bundles = util.parseBundles(orionBuildConfig, {
			buildDirectory: staging,
			orionClient: clientPath,
			psClient: grunt.option("psClient")
		}),
		modules =util.parseModules(orionBuildConfig, staging);

	// Register fingerprint multi task
	fingerPrintRegistry(grunt);
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		clientPath: clientPath,
		configPath: configPath,
		staging: staging,
		optimized: optimized,
		fingerPrints:{
			fingerprintModules:['javascript/plugins/ternWorker.js'],
			allMaps:[],
			jsMaps:[]
		},
		karma: {
			options: {
				configFile: 'test/client/karma.conf.js'
			},
			client_unit_tests: {
				singleRun: true
			},
		},
		mocha_istanbul: {
			coverage: {
				src: ['./test', './test/metastore', './test/endpoints'],
				options: {
					coverageFolder: './coverage/server_coverage',
					mochaOptions: ['--exit'],
					reportFormats: ['html', 'lcov']
				},
			},
		},
		makeReport: {
			src: './coverage/**/*.json',
			options: {
				type: ['lcov', 'html', 'text-summary'],
				dir: './coverage/combined/',
				print: 'text-summary',
			},
		},
		nodeBuildConfig: util.filterBuildConfig(orionBuildConfig, "<% requirejsExcludeModules %>", [
			{
				name: "plugins/consolePlugin"
			},
			{
				name: "tty/ttyShell"
			},
			{
				name: "orion/collab/collabClient"
			},
			{
				name: "orion/debug/debugPackage"
			},
			{
				name: "orion/debug/debugDeploymentWizard"
			}
		], {
			"socket.io/socket.io": "../../node_modules/socket.io/client-dist/socket.io",
			"xterm/xterm": '../../node_modules/xterm/lib/xterm',
		}),
		checkDirs: {
			orion: {
				src: ["<%= clientPath %>/bundles", "<%= configPath %>"],
				options: {
					expand: true
				}
			}
		},
		clean: {
			outdirs: {
				src: [staging + "/**" , optimized + "/**", "lib/orion.client/**"].concat(extraModules.map(function(modulePath) {
					return _path.join('lib', _path.basename(modulePath));
				}))
			}
		},
		copy: {
			orionserver: {
				files: extraModules.map(function(modulePath) {
					return {
						expand: true,
						cwd: modulePath,
						dot: true,
						src: SOURCE_GLOB,
						dest: _path.join('lib', _path.basename(modulePath))
					};
				})
			},
			// Copy each client bundle's web folder to staging dir for optimization
			stage: {
				files: bundles.map(function(bundle) {
					return {
						expand: true,
						cwd: bundle.web,
						src: SOURCE_GLOB,
						dest: staging
					};
				}).concat([
					// Copy orionode.client last since it must overwrite some files
					{
						expand: true,
						cwd: "lib/orionode.client",
						src: SOURCE_GLOB,
						dest: staging
					}
				])
			},
			// Copy optimized js files, source maps, and css, back to the bundles they originated from in lib/
			unstage: {
				files: [{
					expand: true,
					cwd: optimized,
					src: SOURCE_GLOB,
					dest: "lib/orion.client",
				}]
			}
		},
		requirejs: {
			compile: {} // .options is set later
		},
		fingerprint: {
			orion: {
				src: modules,
				path: optimized
			}
		},
		"string-replace": {
			// Ensure optimized files use the minified copy of requirejs
			requiremin: {
				files: [{
					expand: true,
					cwd: optimized,
					dest: optimized,
					src: ["**/*.js", "!**/*.src.js", "**/*.html", "!**/node_modules/**"]
				}],
				options: {
					replacements: [{
						pattern: "requirejs/require.js",
						replacement: "requirejs/require.min.js"
					}]
				}
			},
			// Replace file dependancies with fingerprint name throughout all the HTML files, this task will be excuted within finger print task, no need to call explicitely.
			"replacefp-inHTMLs": {
				files: [{
					expand: true,
					cwd: optimized,
					dest: optimized,
					src: ["**/*.html","!**/embeddedEditor/**"]
				}],
				options: {
					replacements: '<%= fingerPrints.allMaps %>'
				}
			},
			// Replace file dependancies with fingerprint name throughout all the JS files, this task will be excuted within finger print task, no need to call explicitely.
			"replacefp-inJSs": {
				files: [{
					expand: true,
					cwd: optimized,
					dest: optimized,
					src: '<%= fingerPrints.fingerprintModules %>'
				}],
				options: {
					replacements: '<%= fingerPrints.jsMaps %>'
				}
			}
		}
	});

	// Dynamic configuration
	grunt.config("requirejs.compile.options", util.mixin(grunt.config("nodeBuildConfig"), {
		optimize: skipMinify ? "none" : "uglify2",
		generateSourceMaps: generateSourceMaps,
		appDir: staging,
		baseUrl: "./",
		dir: optimized
	}));

	// Task definitions
	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-requirejs");
	grunt.loadNpmTasks("grunt-string-replace");
	grunt.loadNpmTasks('grunt-mocha-istanbul');
	grunt.loadNpmTasks('grunt-istanbul');
	grunt.loadNpmTasks('grunt-karma');

	grunt.registerTask("printBuild", function() {
		grunt.log.writeln("Using build file", JSON.stringify(grunt.config("requirejs.compile.options"), null, 2));
	});

	grunt.registerMultiTask("checkDirs", "Check files/dirs exist", function() {
		this.filesSrc.forEach(function(filepath) {
			grunt.verbose.write("Checking existence of " + filepath + "...");
			if (grunt.file.exists(filepath))
				grunt.verbose.ok();
			else grunt.fatal(BADDIR);
		});
	});

	grunt.registerTask("replaceFp", ["string-replace:replacefp-inHTMLs", "string-replace:replacefp-inJSs"]);
	grunt.registerTask("optimize", fingerPrint ?
		["printBuild", "copy:stage", "requirejs", "fingerprint", "string-replace:requiremin", "copy:unstage"]:
		["printBuild", "copy:stage", "requirejs", "string-replace:requiremin", "copy:unstage"]);
	grunt.registerTask("default", ["checkDirs", "clean", "copy:orionserver", "optimize"]);
	grunt.registerTask("server_unit_tests", ["mocha_istanbul:coverage"]);
  grunt.registerTask("client_unit_tests", ["karma:client_unit_tests:start"]);
  grunt.registerTask("combine_reports", ["makeReport"]);
  grunt.registerTask("test_all", ["karma:client_unit_tests:start",
    "mocha_istanbul:coverage", "makeReport"]);
};
