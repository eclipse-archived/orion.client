/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2012 IBM Corporation and others 
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

define(['require', 'dojo', 'dijit', 'orion/auth', 'orion/util', 'orion/searchUtils', 'dijit/form/Button', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane' ], function(require, dojo, dijit, mAuth, mUtil, mSearchUtils){

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
		 * @param {String} query URI of the query to run.
		 * @param {String} [excludeFile] URI of a file to exclude from the result listing.
		 * @param {Function(JSONObject)} Callback function that receives the results of the query.
		 */
		search: function(query, excludeFile, renderer) {
			var qObj = mSearchUtils.parseQueryStr(query);
			try {
				this._fileService.search(qObj.location, query).then(function(jsonData) {
					/**
					 * transforms the jsonData so that the result conforms to the same
					 * format as the favourites list. This way renderer implementation can
					 * be reused for both.
					 * jsonData.response.docs{ Name, Location, Directory, LineNumber }
					 */
					var transform = function(jsonData) {
						var transformed = [];
						for (var i=0; i < jsonData.response.docs.length; i++) {
							var hit = jsonData.response.docs[i];
							transformed.push({name: hit.Name, 
											  path: hit.Location, 
											  directory: hit.Directory, 
											  lineNumber: hit.LineNumber});
						}
						return transformed;
					};
					var token = jsonData.responseHeader.params.q;
					token= token.substring(token.indexOf("}")+1);
					renderer(transform(jsonData), token);
				});
			}
			catch(error){
				this.registry.getService("orion.page.message").setErrorMessage(error);	
			}
		},
						
		handleError: function(response, resultsNode) {
			console.error(response);
			var errorText = document.createTextNode(response);
			dojo.place(errorText, resultsNode, "only");
			return response;
		},
		setLocationByMetaData: function(meta){
			var locationName = "root";
			if(meta &&  meta.Directory && meta.Location && meta.Parents){
				this.setLocationByURL(meta.Location);
				locationName = meta.Name;
			} 
			var searchInputDom = dojo.byId("search");
			if(searchInputDom && searchInputDom.placeholder){
				if(locationName.length > 13){
					searchInputDom.placeholder = "Search " + locationName.substring(0, 10) + "...";
				} else {
					searchInputDom.placeholder = "Search " + locationName;
				}
			}
			if(searchInputDom && searchInputDom.title){
				searchInputDom.title = "Type a keyword or wild card to search in " + locationName;
			}
		},
		setLocationByURL: function(locationURL){
			this.location = locationURL;
		},
		/**
		 * Returns a query URL for a search.
		 * @param {String} searchLocation The base location of the search service
		 * @param {String} query The text to search for, or null when searching purely on file name
		 * @param {String} [nameQuery] The name of a file to search for
		 * @param {String} [sort] The field to sort search results on. By default results will sort by path
		 */
		createSearchQuery: function(query, nameQuery, sort)  {
			if (!sort) {
				sort = "Path";
			}
			sort += " asc";//ascending sort order
			if (nameQuery) {
				//assume implicit trailing wildcard if there isn't one already
				var wildcard= (/\*$/.test(nameQuery) ? "" : "*");
				return  mSearchUtils.generateSearchQuery({sort: sort,
					rows: 100,
					start: 0,
					searchStr: "Name:" + this._luceneEscape(nameQuery, true) + wildcard});
			}
			return  mSearchUtils.generateSearchQuery({sort: sort,
				rows: 40,
				start: 0,
				searchStr: this._luceneEscape(query, true),
				location: this.location});
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

		//default search renderer until we factor this out completely
		defaultRenderer: {
	
			/**
			 * Create a renderer to display search results.
			 * @public
		     * @param {DOMNode} resultsNode Node under which results will be added.
			 * @param {String} [heading] the heading text (HTML), or null if none required
			 * @param {Function(DOMNode)} [onResultReady] If any results were found, this is called on the resultsNode.
			 * @returns a render function.
			 */
			makeRenderFunction: function(resultsNode, heading, onResultReady) {
				
				/**
				 * Displays links to resources under the given DOM node.
				 * @param [{name, path, lineNumber, directory, isExternalResource}] resources array of resources.  
				 *	Both directory and isExternalResource cannot be true at the same time.
				 * @param Strimg queryName (Optional) a human readable name to display when there are no matches.  If 
				 *       not used, then there is nothing displayed for no matches
				 */
				function render(resources, queryName) {
				
					//Helper function to append a path String to the end of a search result dom node 
					var appendPath = (function() { 
					
						//Map to track the names we have already seen. If the name is a key in the map, it means
						//we have seen it already. Optionally, the value associated to the key may be a function' 
						//containing some deferred work we need to do if we see the same name again.
						var namesSeenMap = {};
						
						function doAppend(domElement, resource) {
							var path = resource.path;
							path = path.substring(0, path.length-resource.name.length-1);
							domElement.appendChild(document.createTextNode(' - ' + path + ' '));
						}
						
						function appendPath(domElement, resource) {
							var name = resource.name;
							if (namesSeenMap.hasOwnProperty(name)) {
								//Seen the name before
								doAppend(domElement, resource);
								var deferred = namesSeenMap[name];
								if (typeof(deferred)==='function') {
									//We have seen the name before, but prior element left some deferred processing
									namesSeenMap[name] = null;
									deferred();
								}
							} else {
								//Not seen before, so, if we see it again in future we must append the path
								namesSeenMap[name] = function() { doAppend(domElement, resource); };
							}
						}
						return appendPath;
					}()); //End of appendPath function
		
					var foundValidHit = false;
					dojo.empty(resultsNode);
					if (resources.length > 0) {
						var table = document.createElement('table');
						for (var i=0; i < resources.length; i++) {
							var resource = resources[i];
							var col;
							if (!foundValidHit) {
								foundValidHit = true;
								if (heading) {
									var headingRow = table.insertRow(0);
									col = headingRow.insertCell(0);
									col.innerHTML = heading;
								}
							}
							var row = table.insertRow(-1);
							col = row.insertCell(0);
							col.colspan = 2;
							var resourceLink = document.createElement('a');
							dojo.place(document.createTextNode(resource.name), resourceLink);
							if (resource.LineNumber) { // FIXME LineNumber === 0 
								dojo.place(document.createTextNode(' (Line ' + resource.LineNumber + ')'), resourceLink);
							}
							var loc = resource.location;
							if (resource.isExternalResource) {
								// should open link in new tab, but for now, follow the behavior of navoutliner.js
								loc = resource.path;
							} else {
								loc	= resource.directory ? 
										require.toUrl("navigate/table.html") + "#" + resource.path : 
										require.toUrl("edit/edit.html") + "#" + resource.path;
								if (loc === "#") {
									loc = "";
								}
							}
		
							resourceLink.setAttribute('href', loc);
							col.appendChild(resourceLink);
							appendPath(col, resource);
						}
						dojo.place(table, resultsNode, "last");
						if (typeof(onResultReady) === "function") {
							onResultReady(resultsNode);
						}
					}
					if (!foundValidHit) {
						// only display no matches found if we have a proper name
						if (queryName) {
							var div = dojo.place("<div>No matches found for </div>", resultsNode, "only");
							var b = dojo.create("b", null, div, "last");
							dojo.place(document.createTextNode(queryName), b, "only");
							if (typeof(onResultReady) === "function") {
								onResultReady(resultsNode);
							}
						}
					} 
				}
				return render;
			}//end makeRenderFunction
		}//end defaultRenderer
	};
	Searcher.prototype.constructor = Searcher;
	//return module exports
	return {Searcher:Searcher};
});