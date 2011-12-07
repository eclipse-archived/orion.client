/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

define(['require', 'dojo', 'orion/editor/regex'], function(require, dojo, mRegex) {

var orion = orion || {};

/**
 * Utility methods
 * @namespace orion.searchUtils 
 */
 
orion.searchUtils = orion.searchUtils || {};

/**
 * Parse the search query string from the hash value of a search page.
 * @param {String} queryStr The hash string.
 * @returns {Object} An object having the properties:<ul>
 * <li>{@link Integer} <code>start</code> The start number of search result of current page.</li>
 * <li>{@link Integer} <code>rows</code> The max rows per page.</li>
 * <li>{@link String} <code>sort</code> The sort parameters."Path asc" or "Name asc".</li>
 * <li>{@link Object} <code>inFileQuery</code> The query object for in file search.</li>
 * </ul>
 * @name orion.searchUtils#parseQueryStr
 * @function
 */
orion.searchUtils.parseQueryStr = function(queryStr) {
	var indexOfQMark = queryStr.indexOf("?");
	var indexOfQWqual = queryStr.indexOf("q=");
	if(indexOfQMark < indexOfQWqual && indexOfQWqual > 0){
		queryStr = queryStr.substring(indexOfQMark+1);
	}
	//var obj = dojo.queryToObject(queryStr);
	splitQ = queryStr.split("&");
	var queryObj = {queryStr: queryStr, start:0, rows:10, sort:"Path asc"};
	for(var i=0; i < splitQ.length; i++){
		var splitparameters = splitQ[i].split("=");
		if(splitparameters.length === 2){
			if(splitparameters[0] === "q"){
				orion.searchUtils.parseLocationAndSearchStr(splitparameters[1], queryObj);
			} else if(splitparameters[0] === "rows"){
				queryObj.rows = parseInt(splitparameters[1]);
			} else if(splitparameters[0] === "start"){
				queryObj.start = parseInt(splitparameters[1]);
			} else if(splitparameters[0] === "sort"){
				queryObj.sort = splitparameters[1];
			}
		}
	}
	return queryObj;
};

orion.searchUtils.copyQueryParams = function(queryObj) {
	return {
		sort: queryObj.sort,
		rows: queryObj.rows,
		start: queryObj.start,
		searchStr: queryObj.searchStr,
		location: queryObj.location
	};
};

orion.searchUtils.generateSearchHref = function(options) {
	var base =  require.toUrl("search/search.html");
	var sort = "Path asc", rows = 40, start = 0 , searchStr = "", loc = "";
	if(options){
		if(options.sort){
			sort = options.sort;
		}
		if(options.rows){
			rows = options.rows;
		}
		if(options.start){
			start = options.start;
		}
		if(options.searchStr){
			searchStr = options.searchStr;
		}
		if(options.location){
			loc = options.location;
			if(loc.length > 0 && loc[loc.length -1] !== '*'){
				loc = loc + "*";
			}
			if(loc !== ""){
				loc = "+Location:" + loc;
			}
		}
	}
	return base + "#" + orion.searchUtils.generateSearchQuery(options);
};

orion.searchUtils.generateSearchQuery = function(options) {
	var base =  require.toUrl("search/search.html");
	var sort = "Path asc", rows = 40, start = 0 , searchStr = "", loc = "";
	if(options){
		if(options.sort){
			sort = options.sort;
		}
		if(options.rows){
			rows = options.rows;
		}
		if(options.start){
			start = options.start;
		}
		if(options.searchStr){
			searchStr = options.searchStr;
		}
		if(options.location){
			loc = options.location;
			if(loc.length > 0 && loc[loc.length -1] !== '*'){
				loc = loc + "*";
			}
			if(loc !== ""){
				loc = "+Location:" + loc;
			}
		}
	}
	return "?" + "sort=" + sort + "&rows=" + rows + "&start=" + start + "&q=" + searchStr + loc;
};

orion.searchUtils.parseLocationAndSearchStr = function(locAndSearchStr, queryObj) {
	var hasLocation = (locAndSearchStr.indexOf("+Location:") > -1);
	queryObj.location = "";
	queryObj.searchStr = locAndSearchStr;
	if(hasLocation){
		var splitStr = locAndSearchStr.split("+Location:");
		if(splitStr.length === 2){
			queryObj.location = splitStr[1];
			queryObj.searchStr = splitStr[0];
		}
	}
	queryObj.searchStrTitle = queryObj.searchStr.split("\\").join("");
	queryObj.inFileQuery= orion.searchUtils.generateInFileQuery(queryObj.searchStr);
};

orion.searchUtils.generateInFileQuery = function(searchStr) {
	var inFileQuery = {};
	var hasStar = (searchStr.indexOf("*") > -1);
	var hasQMark = (searchStr.indexOf("?") > -1);
	if(hasStar){
		searchStr = searchStr.split("*").join(".*");
	}
	if(hasQMark){
		searchStr = searchStr.split("?").join(".");
	}
	if(!hasStar && !hasQMark){
		inFileQuery.searchStr =searchStr.split("\\").join("").toLowerCase();
		inFileQuery.wildCard = false;
	} else {
		inFileQuery.searchStr =searchStr.toLowerCase();
		var regexp = mRegex.parse("/" + inFileQuery.searchStr + "/");
		if (regexp) {
			var pattern = regexp.pattern;
			var flags = regexp.flags;
			flags = flags + (flags.indexOf("i") === -1 ? "i" : "");
			inFileQuery.regExp = {pattern: pattern, flags: flags};
			inFileQuery.wildCard = true;
		}
	}
	inFileQuery.searchStrLength = inFileQuery.searchStr.length;
	return inFileQuery;
};

return orion.searchUtils;
});








