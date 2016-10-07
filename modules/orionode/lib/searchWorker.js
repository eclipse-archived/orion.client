/*******************************************************************************
 * Copyright (c) 2015, 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/

try {
	var Promise = require('bluebird'),
		path = require('path'),
		url = require('url'),
		fs = Promise.promisifyAll(require('fs'));

	var workspaceId = 'orionode';

	/**
	 * @description Converts the given path to be all forward-slashed for orionode
	 * @param {String} p The path to Converts
	 * @since 13.0
	 */
	function toURLPath(p) {
		return p.replace(/\\/g, "/");
	}

	function safePath(workspaceDir, p) {
		workspaceDir = path.normalize(workspaceDir);
		p = path.normalize(p);
		var relativePath = path.relative(workspaceDir, p);
		if (relativePath.indexOf('..' + path.sep) === 0) {
			throw new Error('Path ' + p + ' is outside workspace');
		}
		return p;
	}
	
	/**
	 * @param {String} filepath The URL-encoded path, for example 'foo/My%20Work/baz.txt'
	 * @returns {String} The filesystem path represented by interpreting 'path' relative to the workspace dir.
	 * The returned value is URL-decoded.
	 * @throws {Error} If rest is outside of the workspaceDir (and thus is unsafe)
	 */
	function safeFilePath(workspaceDir, filepath) {
		return safePath(workspaceDir, path.join(workspaceDir, filepath));
	}
	
	function undoLuceneEscape(searchTerm){
		var specialChars = "+-&|!(){}[]^\"~:\\";
		for (var i = 0; i < specialChars.length; i++) {
			var character = specialChars.substring(i,i+1);
			var escaped = "\\" + character;
			searchTerm = searchTerm.replace(new RegExp(escaped,"g"), character);
		}
		return searchTerm;
	}

	/**
	 * @description Adds the found match to the given collection
	 * @param {[?]} collection The collection to add match objects to
	 *  @param {String} filename The name of the matching file
	 * @param {String} filePath The path of the matching file
	 * @param {String} workspaceDir he directory of the current workspace the match was found in
	 * @param {?} stats The file information object from Node.js
	 * @since 13.0
	 */
	function add (collection, filename, filePath, workspaceDir, stats) {
		var filePathFromWorkspace = filePath.substring(workspaceDir.length);
		collection.push({
			"Directory": stats.isDirectory(),
			"LastModified": stats.mtime.getTime(),
			"Length": stats.size,
			"Location": toURLPath("/file" + filePathFromWorkspace),
			"Name": filename,
			"Path": toURLPath(filePathFromWorkspace.substring(1))
		});
	}

	/**
	 * @name SearchOptions
	 * @description Creates a new instance of SearchOptions
	 * @param {String} originalUrl The original URL to search on
	 * @param {String} contextPath The resource context path to search within
	 * @returns {SearchOptions} Returns a new instance of SearchOptions
	 */
	function SearchOptions(originalUrl, contextPath){
		this.defaultLocation = null;
		this.fileContentSearch = false;
		this.filenamePattern = null;
		this.filenamePatternCaseSensitive = false;
		this.location = null;
		this.regEx = false;
		this.rows = 10000;
		this.scopes = [];
		this.searchTerm;
		this.searchTermCaseSensitive = false;
		this.username = null;
		this.exclude = Object.create(null);

		this.buildSearchOptions = function() {
			function getEncodedParameter(param) {
				var query = url.parse(originalUrl).search.substring(1), result = "";
				query.split("&").some(function(p) {
					var pair = p.split("=");
					if (pair[0] === param) {
						result = pair[1];
						return true;
					}
				});
				return result;
			}
			var terms = getEncodedParameter("q").split(/[\s\+]+/)
			for(var i = 0, len = terms.length; i < len; i++) {
				var v = terms[i].split(":");
				switch(v[0]) {
					case 'NameLower': {
						this.filenamePatternCaseSensitive = false;
						this.filenamePattern = decodeURIComponent(v[1]);
						break;
					}
					case 'Location': {
						this.location = decodeURIComponent(v[1]);
						break;
					}
					case 'Name': {
						this.filenamePatternCaseSensitive = true;
						this.filenamePattern = decodeURIComponent(v[1]);
						break;
					}
					case 'Regex': {
						this.regEx = true;
						break;
					}
					case 'CaseSensitive': {
						this.searchTermCaseSensitive = true;
						break;
					}
					case 'WholeWord': {
						this.searchTermWholeWord = true;
						break;
					}
					case 'Exclude': {
						v[1].split(",").forEach(function(ex) {
							this.exclude[ex] = true;
						}.bind(this));
						break;
					}
					default: {
						this.searchTerm = decodeURIComponent(v[0]);
						this.fileContentSearch = true;
					}
				}				
			}
			this.defaultLocation = "/file/" + workspaceId;
		};
	}

	function buildSearchPattern(searchOpts){
		var searchTerm = searchOpts.searchTerm;
		if (searchTerm) {
			if (!searchOpts.regEx) {
				if (searchTerm.indexOf("\"") === 0) {
					searchTerm = searchTerm.substring(1, searchTerm.length - 1);
				}
	
				searchTerm = undoLuceneEscape(searchTerm);
				if (searchTerm.indexOf("?") !== -1 || searchTerm.indexOf("*") !== -1) {
					if (searchTerm.indexOf("*") === 0) {
						searchTerm = searchTerm.substring(1);
					}
					if (searchTerm.indexOf("?") !== -1) {
						searchTerm = searchTerm.replace("?", ".");
					}
					if (searchTerm.indexOf("*") !== -1) {
						searchTerm = searchTerm.replace("*", ".*");
					}
				} else {
					searchTerm = searchTerm.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
				}
			}
			if (searchOpts.searchTermWholeWord){
				searchTerm = "\\b" + searchTerm + "\\b";
			}
			if (!searchOpts.searchTermCaseSensitive) {
				searchTerm = new RegExp(searchTerm, "i");
			} else {
				searchTerm = new RegExp(searchTerm);
			}
		}
		return searchTerm;
	}

	function buildFilenamePattern(searchOpts){
		var filenamePatterns = searchOpts.filenamePattern;
		//Default File Pattern
		if(filenamePatterns === null){
			filenamePatterns = ".*";
		}
		return filenamePatterns.split("/").map(function(filenamePattern) {
			if (filenamePattern.indexOf("?") !== -1 || filenamePattern.indexOf("*") !== -1) {
				if (filenamePattern.indexOf("?") !== -1) {
					filenamePattern = filenamePattern.replace("?", ".");
				}
				if (filenamePattern.indexOf("*") !== -1) {
					filenamePattern = filenamePattern.replace("*", ".*");
				}
			}
	
			if (!searchOpts.filenamePatternCaseSensitive) {
				return new RegExp("^"+filenamePattern, "i");
			}
			return new RegExp("^"+filenamePattern);
		});
	}

	// @returns promise that resolves once all hits have been added to the `results` object.
	// This is a basically a parallel reduce operation implemented by recursive calls to searchFile()
	// that push the search hits into the `results` array.
	//
	// Note that while this function creates and returns many promises, they fulfill to undefined,
	// and are used only for flow control.
	// TODO clean up
	function searchFile(workspaceDir, dirLocation, filename, searchPattern, filenamePatterns, results, excluded) {
		if(excluded[filename]) {
			return;
		}
		var filePath = dirLocation + filename;
		return fs.statAsync(filePath).catch(function(err) {
			//ignore bad stat call
		}).then(function(stats) {
			if(!stats) {
				return;
			}
			/*eslint consistent-return:0*/
			if (stats.isDirectory() && filename.charAt(0) !== ".") {
				if (filePath.charAt(filePath.length-1) !== "/") {
					filePath = filePath + "/";
				}
				return fs.readdirAsync(filePath).then(function(directoryFiles) {
					return Promise.map(directoryFiles, function(entry) {
						return searchFile(workspaceDir, filePath, entry, searchPattern, filenamePatterns, results, excluded);
					});
				});
			}
			// File case
			if (!filenamePatterns.some(function(filenamePattern) {
				return filename.match(filenamePattern);
			})) {
				return;
			}
			if (!searchPattern) {
				add(results, filename, filePath, workspaceDir, stats);
				return;
			}
			return fs.readFileAsync(filePath, 'utf8').then(function(file) {
				if (file.match(searchPattern)) {
					add(results, filename, filePath, workspaceDir, stats);
				}
			});
		});
	}
	
	function search(originalUrl, workspaceDir, contextPath) {
		var searchOpt = new SearchOptions(originalUrl, contextPath);
		searchOpt.buildSearchOptions();
		var searchPattern, filenamePattern;
		try {
			searchPattern = buildSearchPattern(searchOpt);
			filenamePattern = buildFilenamePattern(searchOpt);
		} catch (err) {
			return Promise.reject(err);
		}
		var searchScope;
		try {
			var loc = searchOpt.location.replace(/^\/file/, "");
			loc = loc.replace(/\*$/, "");
			searchScope = safeFilePath(workspaceDir, loc);
		} catch (ex) {
			searchScope = workspaceDir;
		}
		if (searchScope.charAt(searchScope.length - 1) !== path.sep) {
			searchScope = searchScope + path.sep;
		}
		return fs.readdirAsync(searchScope).then(function(children) {
			var results = [];
			return Promise.map(children, function(child) {
				return searchFile(workspaceDir, searchScope, child, searchPattern, filenamePattern, results, searchOpt.exclude);
			}).catch(function(err) {
				// Probably an error reading some file or directory -- ignore
				console.log("ERROR READING SUB-ELEMENT: "+err);
			}).then(function(val) {
				return {
					"response": {
						"docs": results,
						"numFound": results.length,
						"start": 0
					},
					"responseHeader": {
						"params": {
							"fl": "Name,NameLower,Length,Directory,LastModified,Location,Path,RegEx,CaseSensitive",
							"fq": [
								"Location:"+searchOpt.location,
								"UserName:anonymous"
							],
							"rows": "10000",
							"sort": "Path asc",
							"start": "0",
							"wt": "json"
						},
						"status": 0
					}
				};
			});
		});
	}
	
	if (typeof module !== "undefined") {
		module.exports = search;
	}

	this.onmessage = function (event) {
		search(event.data.originalUrl, event.data.workspaceDir, event.data.contextPath)
		.then(function(result) {
			this.postMessage({id: event.data.id, result: result});
		}.bind(this))
		.catch(function(err){
			this.postMessage({id: event.data.id, error: {message: err.message}});
		}.bind(this));
	}.bind(this);
} catch (err) {
	console.log(err.message);
}