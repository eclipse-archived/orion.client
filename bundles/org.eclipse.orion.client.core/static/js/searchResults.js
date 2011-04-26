/*******************************************************************************
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global dojo eclipse:true widgets*/
/*jslint regexp:false browser:true forin:true*/

var eclipse = eclipse || {};

eclipse.SearchResultsGenerator = (function() {
	/**
	 * @name eclipse.SearchResultsGenerator
	 * @class A search results generator
	 */
	function SearchResultsGenerator(serviceRegistry, searcher, resultsId) {
		this.registry = serviceRegistry;
		this.searcher = searcher;
		this.resultsId = resultsId;
	}
	SearchResultsGenerator.prototype = /** @lends eclipse.SearchResultsGenerator.prototype */ {
		loadResults: function(query) {
			// console.log("loadResourceList old " + this._lastHash + " new " + path);
			var parent = dojo.byId(this.resultsId);
			dojo.place(document.createTextNode("Searching..."), parent, "only");
			var results = dojo.create("div", null, parent);
			this.searcher.search(results, query, null, true); // true means generate a "save search" link and heading
			dojo.place(results, parent, "only");
		}
	};

	return SearchResultsGenerator;
}());
