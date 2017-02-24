/*eslint-env node*/
var _path = require("path"),
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
	    optimized = "target/optimized/";
	    
	var socketioPath =  grunt.file.exists('./node_modules/socket.io/node_modules/socket.io-client') ?
			'../../node_modules/socket.io/node_modules/socket.io-client/socket.io' :
			'../../node_modules/socket.io-client/socket.io';
	    
	var orionBuildConfig = util.loadBuildConfig(configPath),
	    bundles = util.parseBundles(orionBuildConfig, {
			buildDirectory: staging,
			orionClient: clientPath,
			psClient: grunt.option("psClient")
		});
		
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		clientPath: clientPath,
		configPath: configPath,
		staging: staging,
		optimized: optimized,
		nodeBuildConfig: util.filterBuildConfig(orionBuildConfig, "<% requirejsExcludeModules %>", [
			{
				name: "plugins/consolePlugin"
			},
			{
				name: "tty/ttyShell"
			},
		], {
			"socket.io/socket.io": socketioPath,
        	"xterm/xterm": '../../node_modules/xterm/dist/xterm',
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
			}
		},
		simplemocha: {
			options: {
				reporter: "dot"
			},
			all: { src: "test/*.js" }
		}
	});

	// Dynamic configuration
	grunt.config("requirejs.compile.options", util.mixin(grunt.config("nodeBuildConfig"), {
		optimize: "uglify2",
		generateSourceMaps: false, // Turn off source maps to reduce download size
		appDir: staging,
		baseUrl: "./",
		dir: optimized // TODO <% optimized %> ?
	}));

	// Task definitions
	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-requirejs");
	grunt.loadNpmTasks("grunt-simple-mocha");
	grunt.loadNpmTasks("grunt-string-replace");

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

	grunt.registerTask("test", ["simplemocha"]);
	grunt.registerTask("optimize", ["printBuild", "copy:stage", "requirejs", "string-replace", "copy:unstage"]);
	grunt.registerTask("default", ["checkDirs", "clean", "copy:orionserver", "optimize", "test"]);
	grunt.registerTask("notest", ["checkDirs", "clean", "copy:orionserver", "optimize"]);
	grunt.registerTask("nomin",   ["checkDirs", "clean", "copy:orionserver", "string-replace:orionclient", "test"]);
};
