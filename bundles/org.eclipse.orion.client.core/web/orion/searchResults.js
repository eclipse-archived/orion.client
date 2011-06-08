/*******************************************************************************
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

define(['dojo', 'orion/commands'], function(dojo, mCommands){

	/**
	 * Creates a new search results generator.
	 * @name orion.searchResults.SearchResultsGenerator
	 * @class A search results generator for display search results to an end user
	 */
	function SearchResultsGenerator(serviceRegistry, searcher, resultsId, commandService, toolbarId) {
		this.registry = serviceRegistry;
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
			// define command for saving the results
			var saveresultsCommand = new mCommands.Command({
				name: "Save Search",
				tooltip: "Save query to search favorites",
				id: "orion.saveSearchResults",
				callback: dojo.hitch(this, function() {
					this.searcher.saveSearch(query, query);
			})});
		
			this.commandService.addCommand(saveresultsCommand, "dom");
			this.commandService.addCommandGroup("orion.searchActions.unlabeled", 200, null, null, this.toolbarId);
			this.commandService.registerCommandContribution("orion.saveSearchResults", 1, this.toolbarId, "orion.searchActions.unlabeled");
			
			// console.log("loadResourceList old " + this._lastHash + " new " + path);
			var parent = dojo.byId(this.resultsId);
			dojo.place(document.createTextNode("Searching..."), parent, "only");
			var results = dojo.create("div", null, parent);
			this.searcher.search(results, query);
			dojo.place(results, parent, "only");
		}
	};
	SearchResultsGenerator.prototype.constructor = SearchResultsGenerator;
	//return module exports
	return {SearchResultsGenerator:SearchResultsGenerator};
});
