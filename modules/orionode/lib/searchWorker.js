/*******************************************************************************
 * Copyright (c) 2015 IBM Corporation and others.
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
	var lunr = require('lunr');
	var indexData;
	var fileNameidx = lunr(function() {
		this.field('Name');
	});
	var fileContentidx = lunr(function() {
		this.field('Body');
	});

	var SUBDIR_SEARCH_CONCURRENCY = 10;

	var workspaceId = 'orionode';
	var fieldList = "Name,NameLower,Length,Directory,LastModified,Location,Path,RegEx,WholeWord,CaseSensitive".split(",");

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

	function isSearchField(term) {
		for (var i = 0; i < fieldList.length; i++) {
			if (term.lastIndexOf(fieldList[i] + ":", 0) === 0) {
				return true;
			}
		}
		return false;
	}

	function undoLuceneEscape(searchTerm) {
		var specialChars = "+-&|!(){}[]^\"~:\\";
		for (var i = 0; i < specialChars.length; i++) {
			var character = specialChars.substring(i, i + 1);
			var escaped = "\\" + character;
			searchTerm = searchTerm.replace(new RegExp(escaped, "g"), character);
		}
		return searchTerm;
	}

	function SearchOptions(originalUrl, contextPath) {
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

		this.buildSearchOptions = function() {
			function getEncodedParameter(param) {
				var query = url.parse(originalUrl).search.substring(1),
					result = "";
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
					}
				} else {
					this.searchTerm = decodeURIComponent(term);
					this.fileContentSearch = true;
				}
			}

			this.defaultLocation = "/file/" + workspaceId;
		};
	}

	function buildSearchPattern(searchOpts) {
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
			if (searchOpts.searchTermWholeWord) {
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

	function buildFilenamePattern(searchOpts) {
		var filenamePatterns = searchOpts.filenamePattern;
		//Default File Pattern
		if (filenamePatterns === null) {
			filenamePatterns = "";
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
//				return new RegExp("^" + filenamePattern, "i");
				return filenamePattern;
			}
//			return new RegExp("^" + filenamePattern);
			return filenamePattern;
		});
	}

	// @returns promise that resolves once all hits have been added to the `results` object.
	// This is a basically a parallel reduce operation implemented by recursive calls to searchFile()
	// that push the search hits into the `results` array.
	//
	// Note that while this function creates and returns many promises, they fulfill to undefined,
	// and are used only for flow control.
	// TODO clean up
	function searchFile(workspaceDir, dirLocation, filename, searchPattern, filenamePatterns, results) {
		var filePath = dirLocation + filename;
		return fs.statAsync(filePath)
			.then(function(stats) {
				/*eslint consistent-return:0*/
				if (stats.isDirectory()) {
					if (filename[0] === ".") {
						// do not search hidden dirs like .git
						return;
					}
					if (filePath.substring(filePath.length - 1) !== "/") filePath = filePath + "/";

					return fs.readdirAsync(filePath)
						.then(function(directoryFiles) {
							return Promise.map(directoryFiles, function(entry) {
								return searchFile(workspaceDir, filePath, entry, searchPattern, filenamePatterns, results);
							}, {
								concurrency: SUBDIR_SEARCH_CONCURRENCY
							});
						});
				}
				// File case

				if (!filenamePatterns.some(function(filenamePattern) {
						return filename.match(filenamePattern);
					})) {
					// didn't find any file in the filename search scope, so return nothing
					return;
				}

				function add() {
					// We found a hit
					var filePathFromWorkspace = filePath.substring(workspaceDir.length);
					results.push({
						"Directory": stats.isDirectory(),
						"LastModified": stats.mtime.getTime(),
						"Length": stats.size,
						"Location": "/file" + filePathFromWorkspace,
						"Name": filename,
						"Path": filePathFromWorkspace.substring(1)
					});
				}
				if (!searchPattern) {
					// this means this is a ctrl+shift+f search case.
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

	function makedocs(workspaceDir, dirLocation, filename, results, refId) {
		var filePath = dirLocation + filename;
		return fs.statAsync(filePath)
			.then(function(stats) {
				/*eslint consistent-return:0*/
				if (stats.isDirectory()) {
					if (filename[0] === "." || filename === "node_modules") {
						// do not search hidden dirs like .git
						return;
					}
					if (filePath.substring(filePath.length - 1) !== "/") filePath = filePath + "/";

					return fs.readdirAsync(filePath)
						.then(function(directoryFiles) {
							return Promise.map(directoryFiles, function(entry) {
								return makedocs(workspaceDir, filePath, entry, results, refId);
							}, {
								concurrency: SUBDIR_SEARCH_CONCURRENCY
							});
						});
				}

				function add(file) {
					// We found a hit
					var filePathFromWorkspace = filePath.substring(workspaceDir.length);
					results.push({
						"Directory": stats.isDirectory(),
						"LastModified": stats.mtime.getTime(),
						"Length": stats.size,
						"Location": "/file" + filePathFromWorkspace,
						"Name": filename,
						"Path": filePathFromWorkspace.substring(1),
						"Body":file,
						"id": refId.id++
					});
				}
				return fs.readFileAsync(filePath, 'utf8')
					.then(function(file) {
						add(file);
					});
			});
	}


	function indexing(workspaceDir, searchScope) {
		var docs = [];
		var contentidx = lunr(function() {
			this.field('Body');
		});
		var filenameIdx = lunr(function() {
			this.field('Name');
		});
		return fs.readdirAsync(searchScope)
			.then(function(children) {
				var refId = {id:1};
				return Promise.map(children, function(child) {
						return makedocs(workspaceDir, searchScope, child, docs, refId);
					}, {
						concurrency: SUBDIR_SEARCH_CONCURRENCY
					})
					.catch(function(err) {
						console.log(err);
					})
					.then(function() {
						console.time("indexing");
						for (var i = 0; i < docs.length; i++) {
							console.log("Indexing" + i);
							if(!isInvalid(docs[i].Body)){	
								contentidx.add(docs[i]);
								delete docs[i].Body;
							}
							filenameIdx.add(docs[i]);
						}
						console.log("done indexing");
						console.timeEnd("indexing");
						return;
					});
			}).then(function() {
				console.log("backuping content index");
				return fs.writeFileAsync("orionContentIndex.json", JSON.stringify(contentidx.toJSON()), "utf8");
			}).then(function() {
				console.log("backuping filename index");
				return fs.writeFileAsync("orionFilenameIndex.json", JSON.stringify(filenameIdx.toJSON()), "utf8");
			}).then(function(){
				console.log("backuping data");
				return fs.writeFileAsync("orionIndexData.json", JSON.stringify(docs), "utf8");
			}).catch(function(err){
				console.log(err);
			}).then(function(){
				console.log("saved");
				return {
					contentIdx: contentidx,
					filenameIndx: filenameIdx,
					indexData:docs
				}
			});
			function isInvalid(str) {
			    return /[^A-Za-z0-9#$%@&*_+:;"'?<>|,.~`^!(){}\-\s\/\\\[\]=$]/g.test(str);
			}
	}

	function search(originalUrl, workspaceDir, contextPath) {
		var searchOpt = new SearchOptions(originalUrl, contextPath);
		searchOpt.buildSearchOptions();

//		var searchPattern, filenamePattern;
//		try {
//			searchPattern = buildSearchPattern(searchOpt);
//			filenamePattern = buildFilenamePattern(searchOpt);
//		} catch (err) {
//			return Promise.reject(err);
//		}

		var searchScope;
		var searchingFilename = searchOpt.filenamePattern && searchOpt.filenamePattern.slice(0, -1);
		var searchingFileContent = searchOpt.searchTerm;
		try {
			var loc = searchOpt.location.replace(/^\/file/, "");
			loc = loc.replace(/\*$/, "");
			searchScope = safeFilePath(workspaceDir, loc);
		} catch (ex) {
			searchScope = workspaceDir;
		}
		if (searchScope.charAt(searchScope.length - 1) !== "/") searchScope = searchScope + "/";
		

		return fs.readFileAsync("orionFilenameIndex.json", "utf8").then(function(file) {
			fileNameidx = lunr.Index.load(JSON.parse(file));
		}).then(function(){
			return fs.readFileAsync("orionContentIndex.json", "utf8").then(function(file) {
				fileContentidx = lunr.Index.load(JSON.parse(file));
			});
		}).catch(function(err){
			console.log(err);
			if(fileNameidx.corpusTokens.elements.length > 1 && fileContentidx.corpusTokens.elements.length > 1){
				return;
			}
			return indexing(workspaceDir, searchScope);
		}).then(function(indexingResult){
			if(indexingResult){
				indexData = indexingResult.indexData;
				fileNameidx = indexingResult.filenameIndx;
				fileContentidx = indexingResult.contentIdx;
			}
			if(!indexData){
				return fs.readFileAsync("orionIndexData.json", "utf8")
				.then(function(file)	{
					indexData = JSON.parse(file);
				});
			}
		}).then(function(){
			var results = [];
			if(searchingFilename){
				var fileNamefindings = fileNameidx.search(searchingFilename);
				if(!searchingFileContent){
					fileNamefindings.forEach(function(each){
						results.push(indexData[each.ref-1]);
					});
				}
			}
			if(searchingFileContent){
				var contentFindings = fileContentidx.search(searchingFileContent);
				if(fileNamefindings){
					fileNamefindings.reduce(function(previousValue, currentValue, currentIndex, array) {
						if(contentFindings.some(function(one){
							return one.ref === currentValue.ref;
							})){
							results.push(indexData[currentValue.ref-1]);
						}
						return;
					});
				}else{
					contentFindings.forEach(function(each){
						results.push(indexData[each.ref-1]);
					});
				}
			}
			return results;
		}).then(function(results){
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
							"Location:" + searchOpt.location,
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
//		return fs.readdirAsync(searchScope)
//			.then(function(children) {
//				var results = [];
//
//				return Promise.map(children, function(child) {
//						return searchFile(workspaceDir, searchScope, child, searchPattern, filenamePattern, results);
//					}, {
//						concurrency: SUBDIR_SEARCH_CONCURRENCY
//					})
//					.catch(function( /*err*/ ) {
//						// Probably an error reading some file or directory -- ignore
//					})
//					.then(function() {
//						return {
//							"response": {
//								"docs": results,
//								"numFound": results.length,
//								"start": 0
//							},
//							"responseHeader": {
//								"params": {
//									"fl": "Name,NameLower,Length,Directory,LastModified,Location,Path,RegEx,CaseSensitive",
//									"fq": [
//										"Location:" + searchOpt.location,
//										"UserName:anonymous"
//									],
//									"rows": "10000",
//									"sort": "Path asc",
//									"start": "0",
//									"wt": "json"
//								},
//								"status": 0
//							}
//						};
//					});
//			});
	}

	if (typeof module !== "undefined") {
		module.exports.search = search;
		module.exports.indexing = indexing;
	}

	this.onmessage = function(event) {
		search(event.data.originalUrl, event.data.workspaceDir, event.data.contextPath)
			.then(function(result) {
				this.postMessage({
					id: event.data.id,
					result: result
				});
			}.bind(this))
			.catch(function(err) {
				this.postMessage({
					id: event.data.id,
					error: {
						message: err.message
					}
				});
			}.bind(this));
	}.bind(this);
} catch (err) {
	console.log(err.message);
}