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
	var workspaceDir = options.workspaceDir;
	if (!workspaceRoot) { throw 'options.root path required'; }
	var workspaceId = 'orionode';
	var workspaceName = 'Orionode Workspace';

	var fieldNames = "Name,NameLower,Length,Directory,LastModified,Location,Path,RegEx,CaseSensitive";
	var fieldList = fieldNames.split(",");

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

	function searchPattern(searchOptions) {
		this.undoLuceneEscape = function(searchTerm){
			var specialChars = "+-&|!(){}[]^\"~:\\";
			for (var i = 0; i < specialChars.length; i++) {
				var character = specialChars.substring(i,i+1);
				var escaped = "\\" + character;
				searchTerm = searchTerm.replace(new RegExp(escaped,"g"), character);
			}
			return searchTerm;
		}

		this.buildSearchPattern = function(){
			var searchTerm = searchOptions.searchTerm;
			if (!searchOptions.regEx) {
				if (searchTerm.indexOf("\"") === 0) {
					searchTerm = searchTerm.substring(1, searchTerm.length - 1);
				}
				searchTerm = this.undoLuceneEscape(searchTerm);
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

				if (!searchOptions.searchTermCaseSensitive) {
					this.pattern = new RegExp(searchTerm, "i");
				} else {
					console.log(searchTerm);
					this.pattern = new RegExp(searchTerm);
				}
			};
		}
	}

	return connect()
	.use(connect.json())
	.use(resource(workspaceRoot, {
		GET: function(req, res, next, rest) {
			var searchOpt = new searchOptions(req, res);
			searchOpt.buildOptions();

			var searchPat = new searchPattern(searchOpt);
			searchPat.buildSearchPattern();

			console.log(searchPat.pattern);

			var ws = JSON.stringify({
					    "search": searchOpt,
					    "pattern": searchPat
					});
			res.setHeader('Content-Type', 'application/json');
			res.end(ws);
		}
	}));
};
