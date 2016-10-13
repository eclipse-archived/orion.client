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
	var Promise = require('bluebird');
	var path = require('path');
	var url = require('url');
	var fs = Promise.promisifyAll(require('fs'));
	
	var SUBDIR_SEARCH_CONCURRENCY = 10;

	var workspaceId = 'orionode';
	var fieldList = "Name,NameLower,Length,Directory,LastModified,Location,Path,RegEx,WholeWord,CaseSensitive,Exclude".split(",");

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
	 * @description Converts the given path to be all forward-slashed for orionode
	 * @param {String} p The path to Converts
	 * @since 13.0
	 */
	function toURLPath(p) {
		return p.replace(/\\/g, "/");
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
	
	function isSearchField(term) {
		for (var i = 0; i < fieldList.length; i++) {
			if (term.lastIndexOf(fieldList[i] + ":", 0) === 0) {
				return true;
			}
		}
		return false;
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
			var terms = getEncodedParameter("q").split(/[\s\+]+/);
			for (var i = 0; i < terms.length; i++) {
				var term = terms[i];
				if (isSearchField(term)) {
					if (term.lastIndexOf("NameLower:", 0) === 0) {
						this.filenamePatternCaseSensitive = false;
						this.filenamePattern = decodeURIComponent(term.substring(10));
					} else if (term.lastIndexOf("Location:", 0) === 0) {
						this.location = decodeURIComponent(term.substring(9 + (contextPath ? contextPath.length : 0)));
					} else if (term.lastIndexOf("Name:", 0) === 0) {
						this.filenamePatternCaseSensitive = true;
						this.filenamePattern = decodeURIComponent(term.substring(5));
					} else if (term.lastIndexOf("RegEx:", 0) === 0) {
						this.regEx = true;
					} else if (term.lastIndexOf("CaseSensitive:", 0) === 0) {
						this.searchTermCaseSensitive = true;
					} else if (term.lastIndexOf("WholeWord:", 0) === 0) {
						this.searchTermWholeWord = true;
					} else if(term.lastIndexOf("Exclude:", 0) === 0) {
						var items = term.substring(8).split(",");
						items.forEach(function(item) {
							this.exclude[decodeURIComponent(item)] = true;						
						}.bind(this));
					}
				} else {
					this.searchTerm = decodeURIComponent(term);
					this.fileContentSearch = true;
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
		return fs.statAsync(filePath)
		.then(function(stats) {
			/*eslint consistent-return:0*/
			if (stats.isDirectory()) {
				if (filename[0] === ".") {
					// do not search hidden dirs like .git
					return;
				}
				if (filePath.substring(filePath.length-1) !== path.sep) {
					filePath = filePath + path.sep;
				}
				return fs.readdirAsync(filePath)
				.then(function(directoryFiles) {
					return Promise.map(directoryFiles, function(entry) {
						return searchFile(workspaceDir, filePath, entry, searchPattern, filenamePatterns, results, excluded);
					}, { concurrency: SUBDIR_SEARCH_CONCURRENCY });
				});
			}
			// File case
			
			if (!filenamePatterns.some(function(filenamePattern) {
				return filename.match(filenamePattern);
			})){
				return;
			}
			function add () {
				// We found a hit
				var filePathFromWorkspace = filePath.substring(workspaceDir.length);
				results.push({
					"Directory": stats.isDirectory(),
					"LastModified": stats.mtime.getTime(),
					"Length": stats.size,
					"Location": toURLPath("/file" + filePathFromWorkspace),
					"Name": filename,
					"Path": toURLPath(filePathFromWorkspace.substring(1))
				});
			}
			if (!searchPattern) {
				return add();
			}
			return fs.readFileAsync(filePath, 'utf8')
			.then(function(file) {
				if (!file.match(searchPattern)) {
					return;
				}
				add();
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

		return fs.readdirAsync(searchScope)
		.then(function(children) {
			var results = [];

			return Promise.map(children, function(child) {
				return searchFile(workspaceDir, searchScope, child, searchPattern, filenamePattern, results, searchOpt.exclude);
			}, { concurrency: SUBDIR_SEARCH_CONCURRENCY })
			.catch(function(/*err*/) {
				// Probably an error reading some file or directory -- ignore
			})
			.then(function() {
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