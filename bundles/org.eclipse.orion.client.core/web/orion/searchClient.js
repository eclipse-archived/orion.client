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

define(['dojo', 'dijit', 'orion/auth', 'orion/util', 'orion/fileClient', 'orion/searchExplorer', 'orion/commands', 'dijit/form/Button', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane' ], function(dojo, dijit, mAuth, mUtil, mFileClient, mExplorer, mCommands){

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
					mAuth.handleGetAuthenticationError(this, ioArgs, 
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
		createSearchQuery: function(searchLocation, query, nameQuery)  {
			if (nameQuery) {
				//assume implicit trailing wildcard if there isn't one already
				var wildcard= (/\*$/.test(nameQuery) ? "" : "*");
				return searchLocation + "Name:" + this._luceneEscape(nameQuery, true) + wildcard;
			}
			return searchLocation + this._luceneEscape(query);
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
		
		_findExistingParent: function(parents, index){
			var parentLocation = parents[index].Location;
			var parentValue = this._searchExplorer.model.modelLocHash[parentLocation];
			if(parentValue)
				return {parent: parentValue, index: index};
			if(index === (parents.length - 1))
				return null;
			return this._findExistingParent(parents, index+1);
		},
		
		buildResultModelTree: function(resultsNode, fileClient, locations){
			this._resultRoot = {
				searchStr: this._query.split("?")[1].split("=")[1],
				isRoot: true,
				children:[]
			};
			this._searchExplorer = new mExplorer.SearchResultExplorer(this.registry, fileClient, this._resultRoot, resultsNode.id);
			for(var i = 0; i < this._resultLocation.length; i++){
				if(!this._resultLocation[i].metaData)
					continue;
				var parents = this._resultLocation[i].metaData.Parents;
				var existingParent = this._findExistingParent(parents, 0);
				var parentIndex, parent;
				if(existingParent){
					parent = existingParent.parent;
					parentIndex = existingParent.index;
				} else {
					parent = this._resultRoot;
					parentIndex = parents.length;
				}
				
				//add parents chain top down if needed
				if(parentIndex > 0){
					for(var j = parentIndex - 1; j > -1; j--){
						var parentNode = {parent: parent, children: [], type: "dir", name: parents[j].Name, location: parents[j].Location};
						parent.children.push(parentNode);
						mUtil.processSearchResultParent(parent);
						this._searchExplorer.model.modelLocHash[parents[j].Location] = parentNode;
						parent = parentNode;
					}
				}
				
				//Add the search result (file) as leaf node
				var childNode = {parent: parent, type: "file", name: this._resultLocation[i].name, linkLocation: this._resultLocation[i].linkLocation, location: this._resultLocation[i].location};
				this._searchExplorer.model.modelLocHash[childNode.location] = childNode;
				parent.children.push(childNode);
				mUtil.processSearchResultParent(parent);
			}
			this._searchExplorer.model.prepareFileItems();
			this._searchExplorer.renderTree(resultsNode);
			this._searchExplorer.gotoNext(true);
			
		},
		
		loadOneFileMetaData: function(resultsNode, fileClient, locations, index){
			var that = this;
			var item = locations[index];
			fileClient.read(item.location, true).then(
					dojo.hitch(this, function(meta) {
						  item.metaData = meta;
					      if(index === (locations.length-1)){			 
					    	  this.buildResultModelTree(resultsNode, fileClient, locations); 
					      } else {
							  this.loadOneFileMetaData(resultsNode, fileClient, locations, index+1);
					      }
					}),
					dojo.hitch(this, function(error) {
						console.error("Error loading file metadata: " + error.message);
					      if(index === (locations.length-1)){			 
					    	  this.buildResultModelTree(resultsNode); 
					      } else {
							  this.loadOneFileMetaData(resultsNode, fileClient, locations, index+1);
					      }
					})
			);
		},

		_initCommands: function(){	
			var that = this;
			var nextResultCommand = new mCommands.Command({
				name : "Next result",
				image : "/images/move_down.gif",
				id: "orion.search.nextResult",
				groupId: "orion.searchGroup",
				callback : function() {
					//that.nextResult();
			}});
			var prevResultCommand = new mCommands.Command({
				name : "Previous result",
				image : "/images/move_up.gif",
				id: "orion.search.prevResult",
				groupId: "orion.searchGroup",
				callback : function() {
					//that.prevResult();
			}});
			var expandAllCommand = new mCommands.Command({
				name : "Expand all results",
				image : "/images/add.gif",
				id: "orion.search.expandAll",
				groupId: "orion.searchGroup",
				callback : function() {
					that._searchExplorer.expandAll();
			}});
			var collapseAllCommand = new mCommands.Command({
				name : "Collapse all results",
				image : "/images/delete.gif",
				id: "orion.search.collapseAll",
				groupId: "orion.searchGroup",
				callback : function() {
					that._searchExplorer.collapseAll();
			}});
			this._commandService.addCommand(nextResultCommand, "dom");
			this._commandService.addCommand(prevResultCommand, "dom");
			this._commandService.addCommand(expandAllCommand, "dom");
			this._commandService.addCommand(collapseAllCommand, "dom");
				
			// Register command contributions
			//this._commandService.registerCommandContribution("orion.search.nextResult", 1, "pageActionsRight");
			//this._commandService.registerCommandContribution("orion.search.prevResult", 2, "pageActionsRight");
			this._commandService.registerCommandContribution("orion.search.expandAll", 3, "pageActionsRight");
			this._commandService.registerCommandContribution("orion.search.collapseAll", 4, "pageActionsRight");
			dojo.empty("pageActionsRight");
			this._commandService.renderCommands("pageActionsRight", "dom", that, that, "image");
		},
		
		showSearchResult: function(resultsNode, query, excludeFile, generateHeading, onResultReady, hideSummaries, jsonData) {
			// WORKAROUND - window.location.hostname is returning "http://localhost:8080/localhost" in FF 3.6.10 
			// surely there is a better way
			var nonhash= window.location.href.split('#')[0];
			var hostname = nonhash.substring(0,nonhash.length - window.location.pathname.length);
			var foundValidHit = false;
			var fileClient = new mFileClient.FileClient(this.registry);
			this._resultLocation = [];
			this._query = query;
			dojo.empty(resultsNode);
			var token = jsonData.responseHeader.params.q;
			token= token.substring(token.indexOf("}")+1);
			if (jsonData.response.numFound > 0) {
				//var table = document.createElement('table');
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
						this._resultLocation.push({linkLocation: hostname + "/edit/edit.html#" + loc, location: loc, name: hit.Name});
						
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
				this._initCommands();
				this.loadOneFileMetaData(resultsNode, fileClient, this._resultLocation, 0);
			}
		}
		/*
		showSearchResult: function(resultsNode, query, excludeFile, generateHeading, onResultReady, hideSummaries, jsonData) {
			// WORKAROUND - window.location.hostname is returning "http://localhost:8080/localhost" in FF 3.6.10 
			// surely there is a better way
			var nonhash= window.location.href.split('#')[0];
			var hostname = nonhash.substring(0,nonhash.length - window.location.pathname.length);
			var foundValidHit = false;
			var that = this;
			var fileClient = new mFileClient.FileClient(this.registry);
			this._resultLocation = [];
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
						hitLink.setAttribute('href', hostname + "/edit/edit.html#" + loc);
						col.appendChild(hitLink);
						this._resultLocation.push({linkLocation: hitLink, location: loc, name: hit.Name});
						
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
			} else {
				that.loadOneFileMetaData(resultsNode, fileClient, that._resultLocation, 0);
			}
		}
		*/
	};
	Searcher.prototype.constructor = Searcher;
	//return module exports
	return {Searcher:Searcher};
});