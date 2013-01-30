/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define window */

define(['i18n!orion/nls/messages', 'require', 'orion/editor/regex', 'orion/commands', 'orion/PageUtil', 'orion/URITemplate'], function(messages, require, mRegex, mCommands, PageUtil, URITemplate) {

var exports = exports || {};

/**
 * Utility methods
 * @namespace exports.searchUtils 
 */
 
exports.searchUtils = exports.searchUtils || {};

exports.searchUtils.ALL_FILE_TYPE = "*.*"; //$NON-NLS-0$

function _generateSearchHelperRegEx(inFileQuery, searchParams, fromStart){
	var prefix = ""; //$NON-NLS-1$
	if(fromStart){
		prefix = "^"; //$NON-NLS-1$
	}
	var regexp = mRegex.parse("/" + prefix + inFileQuery.searchStr + "/"); //$NON-NLS-1$ //$NON-NLS-0$
	if (regexp) {
		var pattern = regexp.pattern;
		var flags = regexp.flags;
		if(flags.indexOf("i") === -1 && !searchParams.caseSensitive){ //$NON-NLS-1$ 
			//If the regEx flag does not include 'i' then we have to add it by searchParams.caseSensitive
			flags = flags + "i";//$NON-NLS-1$
		}
		inFileQuery.regExp = {pattern: pattern, flags: flags};
		inFileQuery.wildCard = true;
	}
}

exports.searchUtils.doSearch = function(searcher, serviceRegistry, searchStr, advOptions){
	if (searcher) {
		var newSearchStr = searchStr, commitSearch = true;
		if(newSearchStr === "*"){
			newSearchStr = "";
		}
		if(newSearchStr === ""){
			commitSearch = advOptions && advOptions.type !== exports.searchUtils.ALL_FILE_TYPE;
		}
		if (commitSearch) {
			if(newSearchStr !== ""){
				exports.searchUtils.addRecentSearch(serviceRegistry, newSearchStr, advOptions ? advOptions.regEx: false);
			}
			var searchParams = searcher.createSearchParams(newSearchStr, false, false, advOptions);
			var href = exports.searchUtils.generateSearchHref(searchParams);
			exports.searchUtils.getOpenSearchPref(serviceRegistry, function(openInNewTab){
				if(openInNewTab){
					window.open(href);
				} else {
					window.location = href;
				}
			});
		}
	} else {
		window.alert(messages["Can't search: no search service is available"]);
	}
};

/**
 * Generate a helper query object used for search result renderer.
 * @param {Object} searchParams The search parameters.
 * @param {Boolean} fromStart True if doing file name search, otherwise false.
 * @returns {Object} An object having the properties:<ul>
 * <li>{@link Object} <code>searchParams</code> The search parameters.</li>
 * <li>{@link Object} <code>inFileQuery</code> The query object for in file search.</li>
 * </ul>
 * @name exports.searchUtils#generateSearchHelper
 * @function
 */
exports.searchUtils.generateSearchHelper = function(searchParams, fromStart) {
	var searchStr = searchParams.keyword;
	var displayedSearchTerm = searchStr;
	var inFileQuery = {};
	if(searchParams.fileType && searchParams.fileType !== exports.searchUtils.ALL_FILE_TYPE && searchStr === ""){
		displayedSearchTerm = "*." + searchParams.fileType;
	}
	if(!searchParams.regEx){
		var hasStar = (searchStr.indexOf("*") > -1); //$NON-NLS-0$
		var hasQMark = (searchStr.indexOf("?") > -1); //$NON-NLS-0$
		if(hasStar){
			searchStr = searchStr.split("*").join(".*"); //$NON-NLS-1$ //$NON-NLS-0$
		}
		if(hasQMark){
			searchStr = searchStr.split("?").join("."); //$NON-NLS-1$ //$NON-NLS-0$
		}
		if(!hasStar && !hasQMark && !searchParams.nameSearch){
			inFileQuery.searchStr = searchParams.caseSensitive ? searchStr.split("\\").join("") : searchStr.split("\\").join("").toLowerCase(); //$NON-NLS-0$
			inFileQuery.wildCard = false;
		} else {
			inFileQuery.searchStr = searchParams.caseSensitive ? searchStr : searchStr.toLowerCase();
			_generateSearchHelperRegEx(inFileQuery, searchParams, fromStart);
			inFileQuery.wildCard = true;
		}
	} else {
		inFileQuery.searchStr =searchStr;
		_generateSearchHelperRegEx(inFileQuery, searchParams, fromStart);
	}
	inFileQuery.searchStrLength = inFileQuery.searchStr.length;
	return {params: searchParams, inFileQuery: inFileQuery, displayedSearchTerm: displayedSearchTerm};
};

exports.searchUtils.convertSearchParams = function(searchParams) {
	if(searchParams.rows !== undefined){
		searchParams.rows = parseInt(searchParams.rows);
	}
	if(searchParams.start !== undefined){
		searchParams.start = parseInt(searchParams.start);
	}
	if(typeof searchParams.regEx === "string"){
		searchParams.regEx = (searchParams.regEx.toLowerCase() === "true");
	}
	if(typeof searchParams.caseSensitive === "string"){
		searchParams.caseSensitive = (searchParams.caseSensitive.toLowerCase() === "true");
	}
	if(typeof searchParams.nameSearch === "string"){
		searchParams.nameSearch = (searchParams.nameSearch.toLowerCase() === "true");
	}
};

exports.searchUtils.copySearchParams = function(searchParams, copyReplace) {
	var result = {};
	for (var prop in searchParams) {
		if(searchParams[prop] !== undefined && searchParams[prop] !== null){
			if(!copyReplace && prop === "replace") { //$NON-NLS-2$
				continue;
			}
			result[prop] = searchParams[prop];
		}
	}
	return result;	
};

exports.searchUtils.generateSearchHref = function(options) {
	var base =  require.toUrl("search/search.html"); //$NON-NLS-0$
	var sParams = exports.searchUtils.copySearchParams(options, true);
	var searchLocation = sParams.resource;
	sParams.resource = undefined;
	var href = new URITemplate(base + "#{,resource,params*}").expand({ //$NON-NLS-0$
		resource: searchLocation,
		params: sParams
	});
	return href;
};

exports.searchUtils.generateFindURLBinding = function(searchParams, inFileQuery, lineNumber, replaceStr) {
	var params = {
		find: inFileQuery.searchStr,
		regEx: inFileQuery.wildCard ? true : undefined,
		caseSensitive: searchParams.caseSensitive ? true : undefined,
		replaceWith: typeof(replaceStr) === "string" ? replaceStr : undefined,
		atLine: typeof(lineNumber) === "number" ? lineNumber : undefined
	}
	var binding = new URITemplate("{,params*}").expand({ //$NON-NLS-0$
		params: params
	});
	return "," + binding;
};

exports.searchUtils.convertFindURLBinding = function(findParams) {
	if(typeof findParams.regEx === "string"){
		findParams.regEx = (findParams.regEx.toLowerCase() === "true");
	}
	if(typeof findParams.caseSensitive === "string"){
		findParams.caseSensitive = (findParams.caseSensitive.toLowerCase() === "true");
	}
	if(typeof findParams.atLine === "string"){
		findParams.atLine = parseInt(findParams.atLine);
	}
}

exports.searchUtils.replaceRegEx = function(text, regEx, replacingStr){
	var regexp = new RegExp(regEx.pattern, regEx.flags);
	return text.replace(regexp, replacingStr); 
	
};

exports.searchUtils.replaceStringLiteral = function(text, keyword, replacingStr){
	var regexp = mRegex.parse("/" + keyword + "/gim"); //$NON-NLS-1$ //$NON-NLS-0$
	return exports.searchUtils.replaceRegEx(text,regexp, replacingStr);
};

exports.searchUtils.searchOnelineLiteral =  function(inFileQuery, lineString, onlyOnce){
	var i,startIndex = 0;
	var found = false;
	var result = [];
	while(true){
		i = lineString.indexOf(inFileQuery.searchStr, startIndex);
		if (i < 0) {
			break;
		} else {
			result.push({startIndex: i, length: inFileQuery.searchStrLength});
			found = true;
			if(onlyOnce){
				break;
			}
			startIndex = i + inFileQuery.searchStrLength;
		}
	}
	if(found) {
		return result;
	}
	return null;
	
};

/**
 * Helper for finding regex matches in text contents.
 * 
 * @param {String}
 *            pattern A valid regexp pattern.
 * @param {String}
 *            flags Valid regexp flags: [is]
 * @param {Number}
 *            [startIndex] Default is false.
 * @return {Object} An object giving the match details, or
 *         <code>null</code> if no match found. The
 *         returned object will have the properties:<br />
 *         {Number} index<br />
 *         {Number} length
 */
exports.searchUtils.findRegExp =  function(text, pattern, flags, startIndex) {
	if (!pattern) {
		return null;
	}
	flags = flags || "";
	// 'g' makes exec() iterate all matches, 'm' makes ^$
	// work linewise
	flags += (flags.indexOf("g") === -1 ? "g" : "") //$NON-NLS-1$ //$NON-NLS-0$
			+ (flags.indexOf("m") === -1 ? "m" : ""); //$NON-NLS-1$ //$NON-NLS-0$
	var regexp = new RegExp(pattern, flags);
	var result = null, match = null;
	result = regexp.exec(text.substring(startIndex));
	return result && {
		startIndex: result.index + startIndex,
		length: result[0].length
	};
};

exports.searchUtils.searchOnelineRegEx =  function(inFileQuery, lineString, onlyOnce){
	var i,startIndex = 0;
	var found = false;
	var result = [];
	while(true){
		var regExResult = exports.searchUtils.findRegExp(lineString, inFileQuery.regExp.pattern, inFileQuery.regExp.flags, startIndex);
		if(regExResult){
			result.push(regExResult);
			found = true;
			if(onlyOnce){
				break;
			}
			startIndex = regExResult.startIndex + regExResult.length;
		} else {
			break;
		}
	}
	if(found) {
		return result;
	}
	return null;
};

exports.searchUtils.generateNewContents = function( updating, oldContents, newContents, fileModelNode, replaceStr, searchStrLength){
	if(fileModelNode && oldContents){
		if(!updating){
			newContents.contents = [];
		}
		for(var i = 0; i < oldContents.length ; i++){
			var lineStringOrigin = oldContents[i];
			var changingLine = false;
			var checked = false;
			var fullChecked = false;
			var checkedMatches = [];
			var originalMatches;
			var startNumber = 0;
			for(var j = 0; j < fileModelNode.children.length; j++){
				var lnumber = fileModelNode.children[j].lineNumber - 1;
				if(lnumber === i){
					startNumber = j;
					for(var k = 0; k < fileModelNode.children[j].matches.length; k++ ){
						if(fileModelNode.children[j+k].checked !== false){
							checkedMatches.push(k);
						}
					}
					checked = (checkedMatches.length > 0);
					fullChecked = (checkedMatches.length === fileModelNode.children[j].matches.length);
					originalMatches = fileModelNode.children[j].matches; 
					changingLine = true;
					break;
				}
			}
			if(changingLine){
				var newStr;
				if(!checked){
					newStr = lineStringOrigin;
					for(var k = 0; k < fileModelNode.children[startNumber].matches.length; k++ ){
						fileModelNode.children[startNumber+k].newMatches = fileModelNode.children[startNumber+k].matches;
					}
				} else{
					var result =  exports.searchUtils.replaceCheckedMatches(lineStringOrigin, replaceStr, originalMatches, checkedMatches, searchStrLength);
					newStr = result.replacedStr;
					for(var k = 0; k < fileModelNode.children[startNumber].matches.length; k++ ){
						fileModelNode.children[startNumber+k].newMatches = result.newMatches;
					}
				}
				if(updating){
					newContents.contents[i] = newStr;
				} else {
					newContents.contents.push(newStr);
				}
			} else if(!updating){
				newContents.contents.push(lineStringOrigin);
			}
		}
	}
};

exports.searchUtils.generateMatchContext = function(contextAroundLength, fileContents, lineNumber/*zero based*/){
	var context = [];
	var totalContextLength = contextAroundLength*2 + 1;
	var startFrom, endTo;
	if(fileContents.length <= totalContextLength){
		startFrom = 0;
		endTo = fileContents.length -1;
	} else {
		startFrom = lineNumber - contextAroundLength;
		if(startFrom < 0){
			startFrom = 0;
			endTo = startFrom + totalContextLength - 1;
		} else {
			endTo = lineNumber + contextAroundLength;
			if(endTo > (fileContents.length -1)){
				endTo = fileContents.length -1;
				startFrom = endTo - totalContextLength + 1;
			}
			
		}
	}
	for(var i = startFrom; i <= endTo; i++){
		context.push({context: fileContents[i], current: (i === lineNumber)});
	}
	return context;
};

/**
 * Split file contents into lines. It also handles the mixed line endings with "\n", "\r" and "\r\n".
 *
 * @param {String} text The file contetns.
 * @returns {Array} Split file lines. 
 * @name exports.searchUtils#splitFile
 * @function
 */
exports.searchUtils.splitFile = function(text) {
	var cr = 0, lf = 0, index = 0, start = 0;
	var splitLines = [];
	while (true) {
		if (cr !== -1 && cr <= index) { 
			cr = text.indexOf("\r", index);  //$NON-NLS-0$
		}
		if (lf !== -1 && lf <= index) { 
			lf = text.indexOf("\n", index);  //$NON-NLS-0$
		}
		if (lf === -1 && cr === -1) {
			splitLines.push(text.substring(start));
			break; 
		}
		var offset = 1;
		if (cr !== -1 && lf !== -1) {
			if (cr + 1 === lf) {
				offset = 2;
				index = lf + 1;
			} else {
				index = (cr < lf ? cr : lf) + 1;
			}
		} else if (cr !== -1) {
			index = cr + 1;
		} else {
			index = lf + 1;
		}
		splitLines.push(text.substring(start, index - offset));
		start = index;
	}
	return splitLines;
};

exports.searchUtils.searchWithinFile = function( inFileQuery, fileModelNode, fileContentText, lineDelim, replacing, caseSensitive){
	var fileContents = exports.searchUtils.splitFile(fileContentText);
	if(replacing){
		fileModelNode.contents = fileContents;
	}
	if(fileModelNode){
		fileModelNode.children = [];
		var totalMatches = 0;
		for(var i = 0; i < fileContents.length ; i++){
			var lineStringOrigin = fileContents[i];
			if(lineStringOrigin && lineStringOrigin.length > 0){
				var lineString = caseSensitive ? lineStringOrigin : lineStringOrigin.toLowerCase();
				var result;
				if(inFileQuery.wildCard){
					result = exports.searchUtils.searchOnelineRegEx(inFileQuery, lineString);
				} else {
					result = exports.searchUtils.searchOnelineLiteral(inFileQuery, lineString);
				}
				if(result){
					var lineNumber = i+1;
					if(!replacing){
						var detailNode = {parent: fileModelNode, context: exports.searchUtils.generateMatchContext(2, fileContents, i), checked: fileModelNode.checked, 
										  type: "detail", matches: result, lineNumber: lineNumber, name: lineStringOrigin, 
										  location: fileModelNode.location + "-" + lineNumber}; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						fileModelNode.children.push(detailNode);
					} else {
						for(var j = 0; j < result.length; j++){
							var matchNumber = j+1;
							var detailNode = {parent: fileModelNode, checked: fileModelNode.checked, type: "detail", matches: result, lineNumber: lineNumber, matchNumber: matchNumber, name: lineStringOrigin, location: fileModelNode.location + "-" + lineNumber + "-" + matchNumber}; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							fileModelNode.children.push(detailNode);
						}
					}
					totalMatches += result.length;
				}
			}
		}
		fileModelNode.totalMatches = totalMatches;
	}
};

exports.searchUtils.replaceCheckedMatches = function(text, replacingStr, originalMatches, checkedMatches, defaultMatchLength){
	var gap = defaultMatchLength;
	var startIndex = 0;
	var replacedStr = "";
	var newMatches = [];
	for(var i = 0; i < originalMatches.length; i++){
		if(startIndex !== originalMatches[i].startIndex){
			replacedStr = replacedStr + text.substring(startIndex, originalMatches[i].startIndex);
		}
		if(originalMatches[i].length){
			gap = originalMatches[i].length;
		}
		var needReplace = false;
		for (var j = 0; j < checkedMatches.length; j++){
			if(checkedMatches[j] === i){
				needReplace = true;
				break;
			}
		}
		if(needReplace){
			newMatches.push({startIndex: replacedStr.length, length: replacingStr.length});
			replacedStr = replacedStr + replacingStr;
		} else {
			newMatches.push({startIndex: replacedStr.length, length: gap});
			replacedStr = replacedStr + text.substring(originalMatches[i].startIndex, originalMatches[i].startIndex + gap);
		}
		startIndex = originalMatches[i].startIndex + gap;
	}
	if(startIndex < text.length){
		replacedStr = replacedStr + text.substring(startIndex);
	}
	return {replacedStr: replacedStr, newMatches: newMatches};
};

exports.searchUtils.fullPathNameByMeta = function(parents){
	var parentIndex = parents.length;
	var fullPath = "";
	//add parents chain top down if needed
	if(parentIndex > 0){
		for(var j = parentIndex - 1; j > -1; j--){
			var separator = (fullPath === "") ? "" : "/"; //$NON-NLS-1$ //$NON-NLS-0$
			fullPath = fullPath + separator + parents[j].Name;
		}
	}
	return fullPath;
};

exports.searchUtils.path2FolderName = function(filePath, fileName, keepTailSlash){
	var tail = keepTailSlash ? 0: 1;
	return filePath.substring(0, filePath.length-fileName.length-tail);
};

var MAX_RECENT_SEARCH_NUMBER = 20;

exports.searchUtils._storeRecentSearch = function(serviceRegistry, searches){
	serviceRegistry.getService("orion.core.preference").getPreferences("/window/favorites").then(function(prefs) {  //$NON-NLS-1$ //$NON-NLS-0$
		prefs.put("recentSearch", searches); //$NON-NLS-0$
	});
};

exports.searchUtils.addRecentSearch = function(serviceRegistry, searchName, useRegEx){
	if(typeof searchName !== "string" || !searchName ){
		return;
	}
	serviceRegistry.getService("orion.core.preference").getPreferences("/window/favorites").then(function(prefs) {  //$NON-NLS-1$ //$NON-NLS-0$
		var i;
		var searches = prefs.get("recentSearch"); //$NON-NLS-0$
		if (typeof searches === "string") { //$NON-NLS-0$
			searches = JSON.parse(searches);
		}
		if (searches) {
			var i;
			for (i in searches) {
				if (searches[i].name === searchName) {
					return;
				}
			}
			if(searches.length >= MAX_RECENT_SEARCH_NUMBER){
				var len = searches.length;
				searches.splice(MAX_RECENT_SEARCH_NUMBER-1, len-MAX_RECENT_SEARCH_NUMBER+1);
			}
		} else {
			searches = [];
		}
		searches.splice(0,0,{ "name": searchName, "regEx": useRegEx});//$NON-NLS-1$
		exports.searchUtils._storeRecentSearch(serviceRegistry, searches);
		//prefs.put("recentSearch", searches); //$NON-NLS-0$
	});
};

exports.searchUtils.getSearches = function(serviceRegistry, type, callback){
	serviceRegistry.getService("orion.core.preference").getPreferences("/window/favorites").then(function(prefs) {  //$NON-NLS-1$ //$NON-NLS-0$
		var i;
		var searches = prefs.get(type); //$NON-NLS-0$
		if (typeof searches === "string") { //$NON-NLS-0$
			searches = JSON.parse(searches);
		}
		if (searches && callback) {
			callback(searches);
		}
	});
};

exports.searchUtils.getMixedSearches = function(serviceRegistry, mixed, checkDuplication, callback){
	serviceRegistry.getService("orion.core.preference").getPreferences("/window/favorites").then(function(prefs) {  //$NON-NLS-1$ //$NON-NLS-0$
		var i;
		var searches = prefs.get("recentSearch"); //$NON-NLS-0$
		if (typeof searches === "string") { //$NON-NLS-0$
			searches = JSON.parse(searches);
		}
		if(mixed){
			var savedSearches = prefs.get("search"); //$NON-NLS-0$
			if (typeof savedSearches === "string") { //$NON-NLS-0$
				savedSearches = JSON.parse(savedSearches);
			}
			for (var i in savedSearches) {
				if(checkDuplication){
					var qObj = exports.searchUtils.parseQueryStr(savedSearches[i].query);
					var duplicated = searches.some(function(search) {
							return qObj.searchStrTitle === search.name;
					});
					if(!duplicated){
						searches.push({"name": qObj.searchStrTitle, "label": savedSearches[i].name});
					}
				} else {
					searches.push({"name": null, "label": savedSearches[i].name, value: savedSearches[i].query});
				}
			}
		}
		if (searches && callback) {
			callback(searches);
		}
	});
};

exports.searchUtils.getOpenSearchPref = function(serviceRegistry, callback){
	serviceRegistry.getService("orion.core.preference").getPreferences("/cm/configurations").then(function(prefs) {  //$NON-NLS-1$ //$NON-NLS-0$
		var i;
		var properties = prefs.get("nav.config"); //$NON-NLS-0$
		var openInNewTab;
		if (properties && properties["links.newtab"] !== "undefined") { //$NON-NLS-1$ //$NON-NLS-0$
			openInNewTab = properties["links.newtab"] ? true : false; //$NON-NLS-2$ 
		} else {
			openInNewTab = false;
		}
		callback(openInNewTab);
	});
};

exports.searchUtils.setOpenSearchPref = function(serviceRegistry, openInNewTab){
	serviceRegistry.getService("orion.core.preference").getPreferences("/window/favorites").then(function(prefs) {  //$NON-NLS-1$ //$NON-NLS-0$
		prefs.put("openSearchPref", {"openInNewTab": openInNewTab}); //$NON-NLS-0$
	});
};

return exports.searchUtils;
});
