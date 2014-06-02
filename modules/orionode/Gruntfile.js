/*jslint node:true*/
var _path = require("path"),
    utilFactory = require("./build/utils");
module.exports = function(grunt) {
	var util = utilFactory(grunt),
	    BADDIR = "This Gruntfile must be run from the modules/orionode folder in the Orion client repository.",
	    SOURCE_GLOB = ["**", "!**/node_modules/**", "!**/built/**", "!**/builder/**", "!**/target/**"],
	    // All paths here are relative to Gruntfile.js
	    configPath = "../../releng/org.eclipse.orion.client.releng/builder/scripts/orion.build.js",
	    clientPath = "../../",
	    staging = "target/staging/",
	    optimized = "target/optimized/";

	var orionBuildConfig = util.loadBuildConfig(configPath),
	    bundles = util.parseBundles(orionBuildConfig, {
			buildDirectory: staging,
			orionClient: clientPath
		});

	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		clientPath: clientPath,
		configPath: configPath,
		staging: staging,
		optimized: optimized,
		nodeBuildConfig: util.filterBuildConfig(orionBuildConfig, "<% requirejsExcludeModules %>"),
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
				src: [staging + "/**" , optimized + "/**", "lib/orion.client/**"]
			}
		},
		copy: {
			// Copy each client {bundle} to lib/orion.client/bundles/{bundle}
			orionclient: {
				files: bundles.map(function(bundle) {
					return {
						expand: true,
						cwd: bundle.path,
						src: SOURCE_GLOB,
						dest: "lib/orion.client/bundles/" + bundle.name + "/"
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
						cwd: "lib/orionode.client/**",
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
					dest: "lib/",
					src: ["**/*.js", "**/*.css", "**/*.html", "**/*.map"], // includes .src.js
					rename: function(dest, src) {
						// Determine the actual destination. This is either a bundle in lib/orion.client/bundles/
						// or the Orionode client code lib/orionode.client/.
						var bundlefile, match;
						if ((match = /(.*)(\.src\.js|\.map)$/.exec(src)) != null) {
							// Source map file; use the associated .js file to decide where we go
							bundlefile = match[1];
						} else {
							bundlefile = src;
						}
						var newDest;
						// Reverse order here so later bundle in list wins over earlier one, if both contain a bundlefile
						grunt.verbose.write("Finding origin bundle for " + src + "... ");
						bundles.slice().reverse().some(function(bundle) {
							if (grunt.file.exists(_path.join(bundle.web, bundlefile))) {
								// This file originated from bundle
								newDest = _path.join(dest, "orion.client/bundles/", bundle.name, "web/", src);
								return true;
							}
						});
						// Check orionode.client last, since it overrides orion.client bundles
						if (grunt.file.exists(_path.join("lib/orionode.client/", bundlefile)))
							newDest = _path.join(dest, "orionode.client/", src);

						if (newDest)
							grunt.verbose.ok();
						else
							grunt.fail.warn("Could not determine origin bundle for " + src + ".");
						return newDest;
					}
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
			},
			orionclient: {
				files: {
					"index.js": "index.js"
				},
				options: {
					replacements: [{
						pattern: /(ORION_CLIENT.+)['""]\.\.\/\.\.\/['"]/,
						replacement: "$1'./lib/orion.client/'"
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

	grunt.registerMultiTask("checkDirs", "Check files/dirs exist", function() {
		this.filesSrc.forEach(function(filepath) {
			grunt.verbose.write("Checking existence of " + filepath + "...");
			if (grunt.file.exists(filepath))
				grunt.verbose.ok();
			else grunt.fatal(BADDIR);
		});
	});

	grunt.registerTask("test", ["simplemocha"]);
	grunt.registerTask("optimize", ["copy:stage", "requirejs", "string-replace", "copy:unstage"]);
	grunt.registerTask("default", ["checkDirs", "clean", "copy:orionclient", "optimize", "test"]);
	grunt.registerTask("nomin",   ["checkDirs", "clean", "copy:orionclient", "string-replace:orionclient", "test"]);
};
