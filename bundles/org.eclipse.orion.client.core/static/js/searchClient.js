/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others 
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors:
 * IBM Corporation - initial API and implementation
 *******************************************************************************/
 
/*global dojo window document handleGetAuthenticationError */
/*jslint devel:true*/

dojo.require("dijit.form.Button");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");

var eclipse = eclipse || {};
eclipse.Searcher = (function() {
	/**
	 * @param options The options object containing the service registry
	 * @name eclipse.Searcher
	 * @class Provides API for searching the workspace.
	 */
	function Searcher(options) {
		this.registry= options.serviceRegistry;
	}
	Searcher.prototype = /**@lends eclipse.Searcher.prototype*/ {
		/**
		 * Runs a search and displays the results under the given DOM node.
		 * @public
		 * @param {DOMNode} resultsNode Node under which results will be added.
		 * @param {String} query URI of the query to run.
		 * @param {String} [excludeFile] URI of a file to exclude from the result listing.
		 * @param {Boolean} [generateHeadingAndSaveLink] Include a "Save Search" link that will 
		 *    save the query to the favorites.
		 * @param {Function(DOMNode)} [onResultReady] If any results were found, this is called on the resultsNode.
		 * @param {Boolean} [hideSummaries] Don't show the summary of what matched beside each result.
		 */
		search: function(resultsNode, query, excludeFile,  generateHeadingAndSaveLink, onResultReady,  hideSummaries) {
			dojo.xhrGet({
				url: query,
				handleAs: "json",
				headers: {
					"Accept": "application/json",
					"Orion-Version": "1"
				},
				sync: false,
				timeout: 15000,
				// need to use inline errback to get ioArgs
				error: dojo.hitch(this, function(response, ioArgs) {
					this.handleError(response, resultsNode);
					handleGetAuthenticationError(this, ioArgs, 
						dojo.hitch(this, this.showSearchResult),
						dojo.hitch(this,function(response) { this.handleError(response, resultsNode); }));
					return response;
				}),
				load: dojo.hitch(this, function(jsonData) {
					this.showSearchResult(resultsNode, query, excludeFile, generateHeadingAndSaveLink, onResultReady, 
							hideSummaries, jsonData); 
				})
			});
		},
		handleError: function(response, resultsNode) {
			console.error(response);
			var errorText = document.createTextNode(response);
			dojo.place(errorText, resultsNode, "only");
			return response;
		},
		saveSearch: function(favoriteName, query) {
			this.registry.callService("IFavorites", "addFavoriteSearch", null, [favoriteName, query]);
		},
		/**
		 * @param {String} str The highlight string we got from the server
		 * @return {DomNode}
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
		showSearchResult: function(resultsNode, query, excludeFile, generateHeadingAndSaveLink, onResultReady, hideSummaries, jsonData) {
			// WORKAROUND - window.location.hostname is returning "http://localhost:8080/localhost" in FF 3.6.10 
			// surely there is a better way
			var nonhash= window.location.href.split('#')[0];
			var hostname = nonhash.substring(0,nonhash.length - window.location.pathname.length);
			var foundValidHit = false;
			var that = this;
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
							if (generateHeadingAndSaveLink) {
								dojo.style(table, "width", "600px");
								
								var favoriteName = token || query;
								var heading = table.insertRow(0);
								col = heading.insertCell(0);
								col.innerHTML = "<h2>Search Results</h2>";
								col = heading.insertCell(1);
								col.align="right";
								var saveLink = document.createElement('a');
								saveLink.href = window.location;
								saveLink.onclick = (function(faveName) {
									return function(event) {
										that.saveSearch(faveName, query);
										return false;
									};
								})(favoriteName);
								saveLink.innerHTML = "Save Search";
								col.appendChild(saveLink);
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
							loc = hostname + "/coding.html#" + eclipse.util.hashFromPosition(hit.Location, /* start */ null, /* end */ null, hit.LineNumber, hit.Offset, token.length);
						} else {
							loc = hostname + "/coding.html#" + hit.Location;
						}
						hitLink.setAttribute('href', loc);
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
	return Searcher;
})();