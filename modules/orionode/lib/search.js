/*******************************************************************************
 * Copyright (c) 2012 IBM Corporation and others.
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
var util = require('util');
var api = require('./api'), writeError = api.writeError;
var fileUtil = require('./fileUtil');
var resource = require('./resource');

module.exports = function(options) {
	var workspaceRoot = options.root;
	var fileRoot = options.fileRoot;
	var workspaceDir = options.workspaceDir;
	if (!workspaceRoot) { throw 'options.root path required'; }
	var workspaceId = 'orionode';
	var workspaceName = 'Orionode Workspace';

	var fieldNames = "Name,NameLower,Length,Directory,LastModified,Location,Path,RegEx,CaseSensitive";
	var fieldList = fieldNames.split(",");

	function originalFileRoot(req) {
		return fileUtil.getContextPath(req) + fileRoot;
	}

	function searchOptions(req, res){
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

		this.isSearchField = function(term) {
			for (var i = 0; i < fieldList.length; i++) {
				if (term.lastIndexOf(fieldList[i] + ":", 0) === 0) {
					return true;
				}
			}
			return false;
		}

		this.buildOptions = function() {
			var queryObject = url.parse(req.url, true).query;
			var terms = queryObject.q.split(" ");
			for (var i = 0; i < terms.length; i++) {
				term = terms[i];
				if (this.isSearchField(term)) {
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
		}
	};

	function undoLuceneEscape(searchTerm){
		var specialChars = "+-&|!(){}[]^\"~:\\";
		for (var i = 0; i < specialChars.length; i++) {
			var character = specialChars.substring(i,i+1);
			var escaped = "\\" + character;
			searchTerm = searchTerm.replace(new RegExp(escaped,"g"), character);
		}
		return searchTerm;
	}

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
				return new RegExp(searchTerm, "i");
			} else {
				return new RegExp(searchTerm);
			}
		};
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

	function searchChild(dirLocation, fileLocation, searchPattern, filenamePattern, results){
		var location = dirLocation + fileLocation;
		var stats = fs.statSync(location);
		if (stats.isDirectory()) {
			if (location.substring(location.length - 1) != "/") {
				location = location + "/";
			}
			var dirFiles = fs.readdirSync(location);
			dirFiles.forEach(function (dirFile) {
				var resultsForEach = searchChild(location, dirFile, searchPattern, filenamePattern, results);
				if (resultsForEach) results.concat(resultsForEach);
			})
		} else {
			var file = fs.readFileSync(location, 'utf8');
			if (file.match(searchPattern) && fileLocation.match(filenamePattern)){
				results.push(location);
			}
		}
		return results;
	}

	return connect()
	.use(connect.json())
	.use(resource(workspaceRoot, {
		GET: function(req, res, next, rest) {
			var searchOpt = new searchOptions(req, res);
			searchOpt.buildOptions();

			var searchPattern = buildSearchPattern(searchOpt);
			var filenamePattern = buildFilenamePattern(searchOpt);

			var parentFileLocation = originalFileRoot(req);

			fileUtil.getChildren(workspaceDir, parentFileLocation, function(children) {
				var results = [];
				for (var i = 0; i < children.length; i++){
					var child = children[i];
					var childResults = [];
					var matches = searchChild(workspaceDir + "/", child.Location.substring(6), searchPattern, filenamePattern, childResults);
					if (matches) results = results.concat(matches);
				};

				var ws = JSON.stringify({
					    "search": searchOpt,
					    "results": results
					});
				res.setHeader('Content-Type', 'application/json');
				res.end(ws);
			});
		}
	}));
};
