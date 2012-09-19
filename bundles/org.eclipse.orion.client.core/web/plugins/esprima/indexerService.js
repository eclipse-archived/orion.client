/*******************************************************************************
 * @license
 * Copyright (c) 2012 VMware, Inc. All Rights Reserved.
 * THIS FILE IS PROVIDED UNDER THE TERMS OF THE ECLIPSE PUBLIC LICENSE
 * ("AGREEMENT"). ANY USE, REPRODUCTION OR DISTRIBUTION OF THIS FILE
 * CONSTITUTES RECIPIENTS ACCEPTANCE OF THE AGREEMENT.
 * You can obtain a current copy of the Eclipse Public License from
 * http://www.opensource.org/licenses/eclipse-1.0.php
 *
 * Contributors:
 *     Andrew Eisenberg (VMware) - initial API and implementation
 ******************************************************************************/

/*global define require FileReader window Worker XMLHttpRequest ActiveXObject setTimeout localStorage rigelLogger */

/**
 * this module defines the indexing service
 * and provides two operations:
 *   retrieveSummaries(file)  grabs the summaries for files that depend on the file file passed in
 *   performIndex(file)   calculates the dependencies of the file and updates the summaries of all of these dependencies
 */
define(["plugins/esprima/esprimaJsContentAssist", "fileapi", "servlets/jsdepend-client"], function() {
	var mEsprimaContentAssist = require('plugins/esprima/esprimaJsContentAssist');
	var jsdepend = require('servlets/jsdepend-client');
	
	
	// webworkers exist
	var worker;
	if (this.window && this.window.Worker) {
		// comment this line out if you want to run w/o webworkers
		worker = new Worker('scripts/plugins/esprima/indexerWorker.js');
	}

	
	// for each file, there are 4 things put in local storage:
	// <file-name>-deps : dependency list for file
	// <file-name>-deps-ts : timestamp for dependency list  (not sure if this is necessary)
	// <file-name>-summary : summary for file
	// <file-name>-summary-ts : timestamp for summary

	// TODO FiXADE should be a call to the server to get the server time
	function generateTimeStamp() {
		return new Date().getTime();
	}

	function getDependencies(fileName, statusFn, callback) {
		// ask server for dependencies, but for now, just hard code
		// dependency = { path : { path to file }, name { module name }, kind : { global, AMD } }
//		jsdepend.getDependencies(fileName, callback, 
		jsdepend.getTransitiveDependencies(fileName, callback, 
			function (error) {
				statusFn(error);
				callback([]);
			}
		);
	}	

	/**
	 * gets the text of the given file, parses it and stores the file summary in local storage
	 * @param file a url of the file to summarize
	 */
	function createSummary(dependency, indexer, persistFn, statusFn) {
		var file = dependency.path;
		if (file) {
			jsdepend.getContents(file, function (contents) {
					var esprimaContentAssistant = new mEsprimaContentAssist.EsprimaJavaScriptContentAssistProvider(indexer, indexer.jslint);
					var structure = esprimaContentAssistant.computeSummary(contents, file);
					var textStructure = JSON.stringify(structure);
					var ts = generateTimeStamp();
					statusFn("Persisting summary of " + file);
					
					persistFn(file + "-summary", textStructure);
					persistFn(file + "-summary-ts", ts);
				},
				function (err) {
					statusFn("Warning: " + err + " when getting " + file);
				}
			);
		}
	}
	
	/**
	 * caches the dependency list for a single file
	 */
	function cacheDeps(fileName, deps, persistFn) {
		persistFn(fileName + "-deps", JSON.stringify(deps));
		persistFn(fileName + "-deps-ts", generateTimeStamp());
	}
	
	/**
	 * checks the dependency list to see which summaries need updating.
	 * FIXADE : this is currently a stub method and always assumes that everything needs updating
	 */
	function checkCache(deps, retrieveFn) {
		var needsUpdating = [];
		for (var i = 0; i < deps.length; i++) {
			if (!deps[i].path) {
				// could not resolve dependency
				continue;
			}
			var tsCache = retrieveFn(deps[i].path + "-summary-ts");
			var tsDep = deps[i].timestamp;
			// only update the local cache if it 
			// older than what the server has
			if (!tsCache || !tsDep || tsCache < tsDep) {
				needsUpdating.push(deps[i]);
			}
		} 
		return needsUpdating;
	}
	
	
	
	// anything over 2 days old is considered stale	
	var twoDays = 1000 * 60 * 60 * 24 * 2;
	function isStale(val, currentTime) {
		var ts = parseInt(val, 10);
		if (ts) {
			return (currentTime - ts) > twoDays;
		} else {
			return true;
		}
	}

	/**
	 * Manages the local storage produced by this class.
	 * OK to access local storage directly since this function will never be called from a webworker
	 */
	var purgeStaleStorage = function() {
		var len = localStorage.length;
		var keysToPurge = [];
		var currentTime = generateTimeStamp();
		for (var i = 0; i < len; i++) {
			var key = localStorage.key(i);
			if (key.indexOf('-ts') === key.length - '-ts'.length && isStale(localStorage[key], currentTime)) {
				keysToPurge.push(key);
				var otherKey = key.substring(0, key.length-'-ts'.length);
				if (localStorage[otherKey]) {
					keysToPurge.push(otherKey);
				}
			}
		}
	
		rigelLogger.debug("Purging from local storage:\n" + keysToPurge, "INDEXER");
		for (i = 0; i < keysToPurge.length; i++) {
			localStorage.removeItem(keysToPurge[i]);
		}
	};
	
	
	
	/**
	 * Creates a new indexer.
	 * Since the indexer can be called as part of a webworker, we cannot access local storage directly
	 * The webworker must use a callback to access the console or local storage. Hence the following parameters:
	 * 
	 * @param persistFn is a function that takes a key and a value as arguments 
	 * and persists them.
	 * @param retreiveFn is a function that takes a key and returns a value from storage
	 * @param statusFn is a function that accepts status messages
	 */
	function Indexer(persistFn, retrieveFn, statusFn) {
	
		if (!persistFn) {
			persistFn = function(key, value) { localStorage[key] = value; };
		}
		if (!retrieveFn) {
			retrieveFn = function(key) { return localStorage[key]; };
		}
		if (!statusFn) {
			statusFn = function(msg) { rigelLogger.debug(msg, "INDEXER"); };
		}
		
		// private instance variable
		var indexTargetFile;
		
		/**
		 * retrieves the summaries for all dependencies in the global scope
		 */
		this.retrieveGlobalSummaries = function() {
			if (!indexTargetFile) {
				return { };
			}
			// check local storage for file
			var deps = retrieveFn(indexTargetFile + "-deps");
			if (!deps) {
				return { };
			}
			deps = JSON.parse(deps);
			
			// for each dependency that is global, extract the summary
			var summaries = [ ];
			for (var i = 0; i < deps.length; i++) {
				var dep = deps[i];
				if (dep.kind === "global") {
					var depPath = dep.path;
					var summary = retrieveFn(depPath + "-summary");
					if (summary) {
						// also add the extra dependency information
						summary = JSON.parse(summary);
						summary.name = dep.name;
						summary.kind = dep.kind;
						summaries.push(summary);
					}
				}
			}
			return summaries;
		};
		
		/**
		 * retrieves the summary with the given name if it exists, or null if it doesn't
		 */
		this.retrieveSummary = function(name) {
			if (!indexTargetFile) {
				return null;
			}
			// check local storage for file
			var deps = retrieveFn(indexTargetFile + "-deps");
			if (!deps) {
				return null;
			}
			deps = JSON.parse(deps);
			
			// look through the dependencies until the name is found
			for (var i = 0; i < deps.length; i++) {
				var dep = deps[i];
				if (dep.name === name) {
					var summary = retrieveFn(dep.path + "-summary");
					if (summary) {
						// also add the extra dependency information
						summary = JSON.parse(summary);
						summary.name = dep.name;
						summary.kind = dep.kind;
						return summary;
					} else {
						// dependency exists, but cannot be resolved
						return null;
					}
				}
			}
			return null;
		};
		
		this.setTargetFile = function(targetFile){
			indexTargetFile = targetFile;
		};
		
		/**
		 * looks for a dependency with the given module name
		 * returns the path to that dependency
		 */
		this.hasDependency = function(name) {
			if (!indexTargetFile || !name) {
				return null;
			}
			// check local storage for file
			var deps = retrieveFn(indexTargetFile + "-deps");
			if (!deps) {
				return null;
			}
			deps = JSON.parse(deps);
			
			// look through the dependencies until the name is found
			for (var i = 0; i < deps.length; i++) {
				var dep = deps[i];
				if (dep.name === name) {
					// dependency exists...path will be null if not resolved
					return dep.path;
				}
			}
			return null;
		};
	
		/**
		 * Two kinds of objects are worked with here:
		 *    dependency = { path : { path to file }, name { module name }, kind : { global, AMD }, timestamp : long }
		 *    summary = { provided : { name -> typeName }, types : { typeName -> { name -> typeName }, timestamp : long }
		 * 
		 * Performs the index asynchronously
		 * 
		 * optional callback is called after dependencies are retrieved
		 */
		this.performIndex = function(fileName, callback) {
			indexTargetFile = fileName;

			// first try to do the index as a webworker
			if (worker) {
				// start an indexing operation
				worker.postMessage({op : 'performIndex', filePath : fileName});
				// the worker doesn't have direct access to local storage, so it must be done via a callback
				worker.onmessage = function(event) {
					var obj = event.data;
					switch(obj.op) {
						case 'set':
							localStorage[obj.key] = obj.val;
							break;
						case 'status':
							rigelLogger.debug(obj.msg, "INDEXER");
							break;
						case 'finished':
							// indexing is complete
							callback();
							purgeStaleStorage();
							break;
					}
				};
			} else {
				var that = this;
				setTimeout(function() {	
					that.internalPerformIndex(fileName, callback); 
					purgeStaleStorage();
				}, 100);
			}
			
			// since this function is being used as a syntax checker, must return an empty array
			return [];
		};
		
		/**
		 * Does the actual indexing.  Will be performed by a webworker if the current browser supports them.
		 * So, therefore must abstract away from localStorage and from calling the console
		 */
		this.internalPerformIndex = function(fileName, callback) {
			indexTargetFile = fileName;
			var indexer = this;
			// asynchronously ask server for dependencies of fileName
			getDependencies(fileName, statusFn, function(deps) { 
				// cache these dependencies
				cacheDeps(fileName, deps, persistFn);
		
				// for each dependency, check local storage to see if still valid
				var needsUpdating = checkCache(deps, retrieveFn);
				
				
				// ask server for contents of each stale dependency
				for (var i = 0; i < needsUpdating.length; i++) {
					createSummary(needsUpdating[i], indexer, persistFn, statusFn);
				}
				if (callback) {
					callback(deps);
				}
			});
		};
	}
	
	return {
		Indexer : Indexer
	};
});
