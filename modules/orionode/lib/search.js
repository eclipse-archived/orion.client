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
var connect = require('connect');
var url = require('url');
var fs = require('fs');
var fileUtil = require('./fileUtil');
var resource = require('./resource');

module.exports = function(options) {
	var workspaceRoot = options.root;
	var fileRoot = options.fileRoot;
	var workspaceDir = options.workspaceDir;
	if (!workspaceRoot) { throw 'options.root path required'; }
	var workspaceId = 'orionode';
	var workspaceName = 'Orionode Workspace';
	var fieldList = "Name,NameLower,Length,Directory,LastModified,Location,Path,RegEx,CaseSensitive".split(",");

	function originalFileRoot(req) {
		return fileUtil.getContextPath(req) + fileRoot;
	}

	function isSearchField(term) {
		for (var i = 0; i < fieldList.length; i++) {
			if (term.lastIndexOf(fieldList[i] + ":", 0) === 0) {
				return true;
			};
		};
		return false;
	}

	function undoLuceneEscape(searchTerm){
		var specialChars = "+-&|!(){}[]^\"~:\\";
		for (var i = 0; i < specialChars.length; i++) {
			var character = specialChars.substring(i,i+1);
			var escaped = "\\" + character;
			searchTerm = searchTerm.replace(new RegExp(escaped,"g"), character);
		};
		return searchTerm;
	}

	function SearchOptions(req, res){
		this.defaultLocation = null;
		this.fileContentSearch = false;
		this.filenamePattern = null;
		this.filenamePatternCaseSensitive = false;
		this.location = null;
		this.regEx = false;
		this.rows = 10000;
		this.scopes = [];
		this.searchTerm = null;
		this.searchTermCaseSensitive = false;
		this.username = null;

		this.buildSearchOptions = function() {
			var queryObject = url.parse(req.url, true).query;
			var terms = queryObject.q.split(" ");
			for (var i = 0; i < terms.length; i++) {
				var term = terms[i];
				if (isSearchField(term)) {
					if (term.lastIndexOf("NameLower:", 0) === 0) {
						this.filenamePatternCaseSensitive = false;
						this.filenamePattern = term.substring(10);
					} else if (term.lastIndexOf("Location:", 0) === 0) {
						this.location = term.substring(9 + fileUtil.getContextPath(req).length);
					} else if (term.lastIndexOf("Name:", 0) === 0) {
						this.filenamePatternCaseSensitive = true;
						this.filenamePattern = term.substring(5);
					} else if (term.lastIndexOf("RegEx:", 0) === 0) {
						this.regEx = true;
					} else if (term.lastIndexOf("CaseSensitive:", 0) === 0) {
						this.searchTermCaseSensitive = true;
					}
				} else {
					this.searchTerm = term;
					this.fileContentSearch = true;
				}
			}

			this.defaultLocation = "/file/" + workspaceId;
		};
	};

	function buildSearchPattern(searchOpts){
		var searchTerm = searchOpts.searchTerm;
		if (!searchOpts.regEx) {
			if (searchTerm.indexOf("\"") === 0) {
				searchTerm = searchTerm.substring(1, searchTerm.length - 1);
			}

			searchTerm = undoLuceneEscape(searchTerm);
			if (searchTerm.indexOf("?") != -1 || searchTerm.indexOf("*") != -1) {
				if (searchTerm.indexOf("*") === 0) {
					searchTerm = searchTerm.substring(1);
				}
				if (searchTerm.indexOf("?") != -1) {
					searchTerm = searchTerm.replace("?",".");
				}
				if (searchTerm.indexOf("*") != -1) {
					searchTerm = searchTerm.replace("*", ".*");
				}
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
		var filenamePattern = searchOpts.filenamePattern;
		if (filenamePattern.indexOf("?") != -1 || filenamePattern.indexOf("*") != -1) {
			if (filenamePattern.indexOf("*") === 0) {
				filenamePattern = filenamePattern.substring(1);
			}
			if (filenamePattern.indexOf("?") != -1) {
				filenamePattern = filenamePattern.replace("?",".");
			}
			if (filenamePattern.indexOf("*") != -1) {
				filenamePattern = filenamePattern.replace("*", ".*");
			}
		}

		if (!searchOpts.filenamePatternCaseSensitive) {
			return new RegExp(filenamePattern, "i");
		} else {
			return new RegExp(filenamePattern);
		}
	}

	function searchFile(dirLocation, filename, searchPattern, filenamePattern, results){
		var filePath = dirLocation + filename;
		var stats = fs.statSync(filePath);

		if (stats.isDirectory()) {
			if (filePath.substring(filePath.length-1) != "/") filePath = filePath + "/";

			var directoryFiles = fs.readdirSync(filePath);
			directoryFiles.forEach(function (directoryFile) {
				var fileResults = searchFile(filePath, directoryFile, searchPattern, filenamePattern, results);
				if (fileResults) results.concat(fileResults);
			});

		} else {
			var file = fs.readFileSync(filePath, 'utf8');
			if (filename.match(filenamePattern) && file.match(searchPattern)){
				var filePathFromWorkspace = filePath.substring(workspaceDir.length);

				results.push({
					"Directory": stats.isDirectory(),
					"LastModified": stats.mtime.getTime(),
					"Length": stats.size,
					"Location": "/file" + filePathFromWorkspace,
					"Name": filename,
					"Path": workspaceName + filePathFromWorkspace
				});
			}
		}
		return results;
	}

	return connect()
	.use(connect.json())
	.use(resource(workspaceRoot, {
		GET: function(req, res, next, rest) {
			var searchOpt = new SearchOptions(req, res);
			searchOpt.buildSearchOptions();

			var searchPattern = buildSearchPattern(searchOpt);
			var filenamePattern = buildFilenamePattern(searchOpt);

			var parentFileLocation = originalFileRoot(req);
			var endOfFileRootIndex = 5;

			var searchScope = workspaceDir + searchOpt.location.substring(endOfFileRootIndex, searchOpt.location.length - 1);
			if (searchScope.charAt(searchScope.length - 1) != "/") searchScope = searchScope + "/";

			fileUtil.getChildren(searchScope, parentFileLocation, function(children) {
				var results = [];
				for (var i = 0; i < children.length; i++){
					var child = children[i];
					var childName = child.Location.substring(endOfFileRootIndex + 1);

					var matches = searchFile(searchScope, childName, searchPattern, filenamePattern, []);
					if (matches) results = results.concat(matches);
				};

				var ws = JSON.stringify({
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
				});

				res.setHeader('Content-Type', 'application/json');
				res.end(ws);
			});
		}
	}));
};
