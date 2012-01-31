/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others 
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors:
 * Kris De Volder - initial API and implementation
 *******************************************************************************/
 
/*global define window document */
/*jslint devel:true*/

// This module contains presentation related code 'ripped out' from searchClient.js.
// At this point it has not yet been refactored to make it more generally useful or reusable.
// The only goal at this point was to separate out presentation related code from the rest 
// of the searchClient code.

define(	   ['require', 'dojo', 'dijit', 'orion/auth', 'orion/util', 'orion/searchUtils', 'dijit/form/Button', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane'], 
    function(require,   dojo , dijit,    mAuth,       mUtil,        mSearchUtils) {

	/**
	 * Create a renderer to display search results.
	 * @public
     * @param {DOMNode} resultsNode Node under which results will be added.
	 * @param {String} [heading] the heading text (HTML), or null if none required
	 * @param {Function(DOMNode)} [onResultReady] If any results were found, this is called on the resultsNode.
	 * @returns a render function.
	 */
	function makeRenderFunction(resultsNode, heading, onResultReady) {
		
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
	}
	return {makeRenderFunction:makeRenderFunction};
});