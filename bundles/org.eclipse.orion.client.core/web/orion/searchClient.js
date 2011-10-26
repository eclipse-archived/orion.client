/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others 
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors:
 * IBM Corporation - initial API and implementation
 *******************************************************************************/
 
/*global define window document */
/*jslint devel:true*/

define(['require', 'dojo', 'dijit', 'orion/auth', 'orion/util', 'orion/searchExplorer', 'dijit/form/Button', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane' ], function(require, dojo, dijit, mAuth, mUtil, mExplorer){

	/**
	 * Creates a new search client.
	 * @param {Object} options The options object
	 * @param {orion.serviceregistry.ServiceRegistry} options.serviceRegistry The service registry
	 * @name orion.searchClient.Searcher
	 * @class Provides API for searching the workspace.
	 */
	function Searcher(options) {
		this.registry= options.serviceRegistry;
		this._commandService = options.commandService;
		this._fileService = options.fileService;
	}
	Searcher.prototype = /**@lends orion.searchClient.Searcher.prototype*/ {
		/**
		 * Runs a search and displays the results under the given DOM node.
		 * @public
		 * @param {DOMNode} resultsNode Node under which results will be added.
		 * @param {String} query URI of the query to run.
		 * @param {String} [excludeFile] URI of a file to exclude from the result listing.
		 * @param {Boolean} [generateHeading] generate a heading for the results
		 * @param {Function(DOMNode)} [onResultReady] If any results were found, this is called on the resultsNode.
		 * @param {Boolean} [hideSummaries] Don't show the summary of what matched beside each result.
		 * @param {Boolean} [useFlatList] Use flat list to show the result, other wise use a tree structure.
		 */
		search: function(resultsNode, query, excludeFile,  generateHeadingAndSaveLink, onResultReady,  hideSummaries, useFlatList) {
			this._fileService.search(query).then(
				dojo.hitch(this, function(jsonData) {
					this.showSearchResult(resultsNode, query, excludeFile, generateHeadingAndSaveLink, onResultReady, 
							hideSummaries, useFlatList, jsonData); 
				})
			);
		},
		handleError: function(response, resultsNode) {
			console.error(response);
			var errorText = document.createTextNode(response);
			dojo.place(errorText, resultsNode, "only");
			return response;
		},
		saveSearch: function(favoriteName, query) {
			this.registry.getService("orion.core.favorite").then(function(favorites) {
				favorites.addFavoriteSearch(favoriteName, query);
			});
		},
		/**
		 * Returns a query URL for a search.
		 * @param {String} searchLocation The base location of the search service
		 * @param {String} query The text to search for, or null when searching purely on file name
		 * @param {String} [nameQuery] The name of a file to search for
		 */
		createSearchQuery: function(query, nameQuery)  {
			if (nameQuery) {
				//assume implicit trailing wildcard if there isn't one already
				var wildcard= (/\*$/.test(nameQuery) ? "" : "*");
				return "?q=" + "Name:" + this._luceneEscape(nameQuery, true) + wildcard;
			}
			return "?q=" + this._luceneEscape(query);
		},
		/**
		 * Escapes all characters in the string that require escaping in Lucene queries.
		 * See http://lucene.apache.org/java/2_4_0/queryparsersyntax.html#Escaping%20Special%20Characters
		 * The following characters need to be escaped in lucene queries: + - && || ! ( ) { } [ ] ^ " ~ * ? : \
		 * @param {Boolean} [omitWildcards=false] If true, the * and ? characters will not be escaped.
		 * @private
		 */
		_luceneEscape: function(input, omitWildcards) {
			var output = "",
			    specialChars = "+-&|!(){}[]^\"~:\\" + (!omitWildcards ? "*?" : "");
			for (var i = 0; i < input.length; i++) {
				var c = input.charAt(i);
				if (specialChars.indexOf(c) >= 0) {
					output += '\\';
				}
				output += c;
			}
			return output;
		},
		/**
		 * Creates a div representing the highlight snippet of a search result.
		 * @param {String} str The highlight string we got from the server
		 * @return {DomNode}
		 * @private
		 */
		formatHighlight: function(str) {
			var start = "##match",
			    end = "match##",
			    array = str.split(/(##match|match##)/),
			    div = dojo.create("div"),
			    bold;
			for (var i=0; i < array.length; i++) {
				var token = array[i];
				if (token === start) {
					bold = dojo.create("b");
				} else if (token === end) {
					dojo.place(bold, div, "last");
					bold = null;
				} else {
					dojo.place(document.createTextNode(token), (bold || div), "last");
				}
			}
			return div;
		},
		
		showSearchResult: function(resultsNode, query, excludeFile, generateHeading, onResultReady, hideSummaries, useFlatList, jsonData) {
			if(useFlatList) {
				this.showSearchResultInList(resultsNode, query, excludeFile, generateHeading, onResultReady, hideSummaries, jsonData);
			} else {
				this.showSearchResultInTree(resultsNode, query, excludeFile, generateHeading, onResultReady, hideSummaries, jsonData);
			}
		},
		
		showSearchResultInTree: function(resultsNode, query, excludeFile, generateHeading, onResultReady, hideSummaries, jsonData) {
			var nonhash= window.location.href.split('#')[0];
			var foundValidHit = false;
			var resultLocation = [];
			dojo.empty(resultsNode);
			var token = jsonData.responseHeader.params.q;
			token= token.substring(token.indexOf("}")+1);
			if (jsonData.response.numFound > 0) {
				for (var i=0; i < jsonData.response.docs.length; i++) {
					var hit = jsonData.response.docs[i];
					// ignore hits in the file that launched the search
					if (!hit.Directory && hit.Location !== excludeFile) {
						var col;
						if (!foundValidHit) {
							foundValidHit = true;
						}
						var loc;
						// if we know what to highlight...
						if (token && hit.LineNumber) {
							loc = mUtil.hashFromPosition(hit.Location, /* start */ null, /* end */ null, hit.LineNumber, hit.Offset, token.length);
						} else {
							loc = hit.Location;
						}
						resultLocation.push({linkLocation: require.toUrl("edit/edit.html") +"#" + loc, location: loc, name: hit.Name});
						
					}
				}
				if (typeof(onResultReady) === "function") {
					onResultReady(resultsNode);
				}
			}
			if (!foundValidHit) {
				var div = dojo.place("<div>No matches found for </div>", resultsNode, "only");
				var b = dojo.create("b", null, div, "last");
				dojo.place(document.createTextNode(token), b, "only");
			} else {
				var explorer = new mExplorer.SearchResultExplorer(this.registry, this._commandService, resultLocation,  resultsNode, query.split("q=")[1]);
				explorer.startUp();
			}
		},
		
		showSearchResultInList: function(resultsNode, query, excludeFile, generateHeading, onResultReady, hideSummaries, jsonData) {
			var nonhash= window.location.href.split('#')[0];
			var foundValidHit = false;
			dojo.empty(resultsNode);
			var token = jsonData.responseHeader.params.q;
			token= token.substring(token.indexOf("}")+1);
			if (jsonData.response.numFound > 0) {
				var table = document.createElement('table');
				for (var i=0; i < jsonData.response.docs.length; i++) {
					var hit = jsonData.response.docs[i];
					// ignore hits in the file that launched the search
					if (!hit.Directory && hit.Location !== excludeFile) {
						var col;
						if (!foundValidHit) {
							foundValidHit = true;
							if (generateHeading) {
								var favoriteName = token || query;
								var heading = table.insertRow(0);
								col = heading.insertCell(0);
								col.innerHTML = "<h2>Search Results</h2>";
							}
						}
						var row = table.insertRow(-1);
						col = row.insertCell(0);
						col.colspan = 2;
						var hitLink = document.createElement('a');
						dojo.place(document.createTextNode(hit.Name), hitLink);
						if (hit.LineNumber) { // FIXME LineNumber === 0 
							dojo.place(document.createTextNode(' (Line ' + hit.LineNumber + ')'), hitLink);
						}
						var loc;
						// if we know what to highlight...
						if (token && hit.LineNumber) {
							loc = mUtil.hashFromPosition(hit.Location,  null, null, hit.LineNumber, hit.Offset, token.length);
						} else {
							loc = hit.Location;
						}
						hitLink.setAttribute('href', require.toUrl("edit/edit.html") + "#" + loc);
						col.appendChild(hitLink);
						
						if (!hideSummaries && jsonData.highlighting && jsonData.highlighting[hit.Id] && jsonData.highlighting[hit.Id].Text) {
							var highlightText = jsonData.highlighting[hit.Id].Text[0];
							var highlight = table.insertRow(-1);
							col = highlight.insertCell(0);
							col.colspan = 2;
							dojo.place(this.formatHighlight(highlightText), col, "only");
						}
					}
				}
				dojo.place(table, resultsNode, "last");
				if (typeof(onResultReady) === "function") {
					onResultReady(resultsNode);
				}
			}
			if (!foundValidHit) {
				var div = dojo.place("<div>No matches found for </div>", resultsNode, "only");
				var b = dojo.create("b", null, div, "last");
				dojo.place(document.createTextNode(token), b, "only");
			} 
		}
		
	};
	Searcher.prototype.constructor = Searcher;
	//return module exports
	return {Searcher:Searcher};
});