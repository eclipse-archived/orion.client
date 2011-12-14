/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define */
/*jslint regexp:false browser:true forin:true*/

define(['dojo', 'orion/commands', 'orion/searchUtils'], function(dojo, mCommands, mSearchUtils){

	/**
	 * Creates a new search results generator.
	 * @name orion.searchResults.SearchResultsGenerator
	 * @class A search results generator for display search results to an end user
	 */
	function SearchResultsGenerator(serviceRegistry, searcher, resultsId, commandService, toolbarId) {
		this.registry = serviceRegistry;
		this._fileClient = this.registry.getService("orion.core.file")
		this.searcher = searcher;
		this.resultsId = resultsId;
		this.commandService = commandService;
		this.toolbarId = toolbarId;
	}
	SearchResultsGenerator.prototype = /** @lends orion.searchResults.SearchResultsGenerator.prototype */ {
		/**
		 * Performs the given query and generates the user interface 
		 * representation of the search results.
		 * @param {String} query The search query
		 */
		loadResults: function(query) {
			// console.log("loadResourceList old " + this._lastHash + " new " + path);
			var parent = dojo.byId(this.resultsId);
			dojo.place(document.createTextNode("Searching..."), parent, "only");
			var results = dojo.create("div", null, parent);
			this.searcher.search(results, query);
			dojo.place(results, parent, "only");
		},
		
		saveSearch: function(query) {
			var queryObj = mSearchUtils.parseQueryStr(query);
			var qName = query;
			if(queryObj && typeof(queryObj.searchStrTitle) === "string" && typeof(queryObj.location) === "string" ){
				qName = "\'" + queryObj.searchStrTitle + "\' in ";// +queryObj.location;
				if(queryObj.location.length > 0){
					this._fileClient.read(queryObj.location, true).then(
						dojo.hitch(this, function(meta) {
							var parentName = mSearchUtils.fullPathNameByMeta(meta.Parents);
							var fullName = parentName.length === 0 ? meta.Name: parentName + "/" + meta.Name;
							this.searcher.saveSearch(qName + fullName, query);
						}),
						dojo.hitch(this, function(error) {
							console.error("Error loading file meta data: " + error.message);
							this.searcher.saveSearch(qName + "root", query);
						})
					);
				} else {
					this.searcher.saveSearch(qName + "root", query);
				}
			} else {
				this.searcher.saveSearch(qName, query);
			}
		}
	};
	SearchResultsGenerator.prototype.constructor = SearchResultsGenerator;
	//return module exports
	return {SearchResultsGenerator:SearchResultsGenerator};
});
