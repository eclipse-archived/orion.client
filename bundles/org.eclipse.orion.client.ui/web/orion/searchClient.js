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
 
/*eslint-env browser, amd*/
define([
	'i18n!orion/search/nls/messages', 
	'orion/webui/littlelib', 
	'orion/i18nUtil', 
	'orion/searchUtils', 
	'orion/crawler/searchCrawler', 
	'orion/Deferred'
], function(messages, lib, i18nUtil, mSearchUtils, mSearchCrawler, Deferred){

	function _convert(jsonData, rootURL, folderKeyword) {
		var converted = [];
		if (jsonData.response.numFound > 0) {
			for (var i=0; i < jsonData.response.docs.length; i++) {
				var hit = jsonData.response.docs[i];
				if (!hit.Directory) {
					var loc = hit.Location;
					var path = hit.Path;
					if (!path) {
						path = loc.substring(rootURL ? rootURL.length : 0); //remove file service root from path
					}
					//If folderKeyword is defined then we filter on the keyword on path
					var folderCheck = folderKeyword ? (path.indexOf(folderKeyword) >= 0) : true;
					if(folderCheck) {
						converted.push({location: loc, path: path, name: hit.Name});
					}
				}
			}
		}
		return converted;
	}
	/**
	 * Creates a new search client.
	 * @param {Object} options The options object
	 * @param {orion.serviceregistry.ServiceRegistry} options.serviceRegistry The service registry
	 * @name orion.searchClient.Searcher
	 * @class Provides API for searching the workspace.
	 */
	function Searcher(options) {
		this._registry= options.serviceRegistry;
		this._commandService = options.commandService;
		this._fileClient = options.fileService;
	}
	Searcher.prototype = /**@lends orion.searchClient.Searcher.prototype*/ {
		getFileService: function(){
			return this._fileClient;
		},
		setLocationByMetaData: function(meta, useParentLocation){
			var locationName = "";
			var noneRootMeta = null;
			this._searchRootLocation = this._fileClient.fileServiceRootURL(meta.Location);
			if(useParentLocation && meta && meta.Parents && meta.Parents.length > 0){
				if(useParentLocation.index === "last"){ //$NON-NLS-0$
					noneRootMeta = meta.Parents[meta.Parents.length-1];
				} else {
					noneRootMeta = meta.Parents[0];
				}
			} else if(meta &&  meta.Directory && meta.Location && meta.Parents){
				noneRootMeta = meta;
			} 
			if(noneRootMeta){
				this.setLocationbyURL(noneRootMeta.Location);
				locationName = noneRootMeta.Name;
				this._childrenLocation = noneRootMeta.ChildrenLocation;
			} else if(meta){
				this.setLocationbyURL(this._searchRootLocation);
				locationName = this._fileClient.fileServiceName(meta.Location);
				this._childrenLocation = meta.ChildrenLocation;
			}
			var searchInputDom = lib.node("search"); //$NON-NLS-0$
			if(!locationName){
				locationName = "";
			}
			this._searchLocationName = locationName;
			if(searchInputDom && searchInputDom.placeholder){
				searchInputDom.value = "";
				var placeHolder = i18nUtil.formatMessage(messages["Search ${0}"], locationName);
				
				if(placeHolder.length > 30){
					searchInputDom.placeholder = placeHolder.substring(0, 27) + "..."; //$NON-NLS-0$
				} else {
					searchInputDom.placeholder = i18nUtil.formatMessage(messages["Search ${0}"], locationName);
				}
			}
			if(searchInputDom && searchInputDom.title){
				searchInputDom.title = messages["TypeKeyOrWildCard"] + locationName;
			}
		},
		setLocationbyURL: function(locationURL){
			this._searchLocation = locationURL;
		},
		setRootLocationbyURL: function(locationURL){
			this._searchRootLocation = locationURL;
		},
		setChildrenLocationbyURL: function(locationURL){
			this._childrenLocation = locationURL;
		},
		getSearchLocation: function(){
			if(this._searchLocation){
				return this._searchLocation;
			} else {
				return this._fileClient.fileServiceRootURL();
			}
		},
		getSearchLocationName: function(){
			return this._searchLocationName;
		},
		getSearchRootLocation: function(){
			if(this._searchRootLocation){
				return this._searchRootLocation;
			} else {
				return this._fileClient.fileServiceRootURL();
			}
		},
		getChildrenLocation: function(){
			if(this._childrenLocation){
				return this._childrenLocation;
			} else {
				return this._fileClient.fileServiceRootURL();
			}
		},
		/**
		 * Returns a query object for search. The return value has the propertyies of resource and parameters.
		 * @param {String} keyword The text to search for, or null when searching purely on file name
		 * @param {Boolean} [nameSearch] The name of a file to search for
		 * @param {Boolean} [useRoot] If true, do not use the location property of the searcher. Use the root url of the file system instead.
		 */
		createSearchParams: function(keyword, nameSearch, useRoot, advancedOptions)  {
			var searchOn = useRoot ? this.getSearchRootLocation(): this.getSearchLocation();
			if (nameSearch) {
				//assume implicit trailing wildcard if there isn't one already
				//var wildcard= (/\*$/.test(keyword) ? "" : "*"); //$NON-NLS-0$
				return {
					resource: searchOn,
					sort: "NameLower asc", //$NON-NLS-0$
					rows: 100,
					start: 0,
					nameSearch: true,
					keyword: keyword
				};
			}
			return {
				resource: searchOn,
				sort: advancedOptions && advancedOptions.sort ? advancedOptions.sort : "Path asc", //$NON-NLS-0$
				rows: advancedOptions && advancedOptions.rows ? advancedOptions.rows : 40,
				start: 0,
				caseSensitive: advancedOptions ? advancedOptions.caseSensitive : undefined,
				regEx: advancedOptions ? advancedOptions.regEx : undefined,
				fileType: advancedOptions ? advancedOptions.fileType : undefined,
				fileNamePatterns: (advancedOptions && advancedOptions.fileNamePatterns) ? advancedOptions.fileNamePatterns : undefined,
				keyword: keyword,
				replace: advancedOptions ? advancedOptions.replace : undefined
			};
		}
	};

	Searcher.prototype.constructor = Searcher;
	//return module exports
	return {Searcher:Searcher};
});