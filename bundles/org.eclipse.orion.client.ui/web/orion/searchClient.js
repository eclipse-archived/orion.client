/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2015 IBM Corporation and others 
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
		//TODO clean up the search client API. Make any helper private
		this._registry.registerService("orion.core.search.client", this); //$NON-NLS-1$
	}
	Searcher.prototype = /**@lends orion.searchClient.Searcher.prototype*/ {
		getFileService: function(){
			return this.getFileClient();
		},
		_getNoneRootMeta: function(meta) {
			if(meta) {
				if(meta.Directory === undefined && meta.Location) {// Nodejs server does not return Directory property on a non root folder from a file's parent chain.
					return meta;
				}
				if(meta.Directory && meta.Location && meta.Parents) {
					return meta;
				}
			}
			return null;
		},
		setLocationByMetaData: function(meta, useParentLocation){
			var locationName = "";
			var noneRootMeta = null;
			this._searchRootLocation = this._fileClient.fileServiceRootURL(meta.Location);
			if(useParentLocation && meta && meta.Parents && meta.Parents.length > 0){
				if(useParentLocation.index === "last"){
					noneRootMeta = meta.Parents[meta.Parents.length-1];
				} else {
					noneRootMeta = meta.Parents[0];
				}
			} else {
				noneRootMeta = this._getNoneRootMeta(meta);
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
			}
			return this._fileClient.fileServiceRootURL();
		},
		getSearchLocationName: function(){
			return this._searchLocationName;
		},
		getSearchRootLocation: function(){
			if(this._searchRootLocation){
				return this._searchRootLocation;
			}
			return this._fileClient.fileServiceRootURL();
		},
		getChildrenLocation: function(){
			if(this._childrenLocation){
				return this._childrenLocation;
			}
			return this._fileClient.fileServiceRootURL();
		},
		
		/**
		 * @name getFileClient
		 * @description Get the file client;
		 * @function
		 * @returns {orion.FileClient} returns a file client
		 */
		getFileClient: function() {
			return this._fileClient ? this._fileClient : this._registry.getService("orion.core.file.client"); //$NON-NLS-1$
		},
		/**
		 * Runs a search and displays the results under the given DOM node.
		 * @public
		 * @param {Object} searchParams The search parameters.
		 * @param {Function(JSONObject)} Callback function that receives the results of the query.
		 */
		search: function(searchParams, generateMatches, generateMeta) {
			var result = new Deferred();
			try {
				this._searchDeferred = this.getFileClient().search(searchParams);
				this._searchDeferred.then(function(jsonData) {
					this._searchDeferred = null;
					var searchResult = this.convert(jsonData, searchParams);
					this._generateMatches(searchParams, searchResult, generateMatches).then(function() {
						this._generateMeta(searchResult, generateMeta).then(function() {
							result.resolve(searchResult);
						});
					}.bind(this));
				}.bind(this), function(error) {
					this._searchDeferred = null;
					result.reject(error);
				}.bind(this));
			}
			catch(err){
				var error = err.message || err;
				if(typeof error === "string" && error.toLowerCase().indexOf("search") > -1){ //$NON-NLS-1$ //$NON-NLS-0$
					if(!this._crawler) {
						this._crawler = this._createCrawler(searchParams);
					}
					if(searchParams.nameSearch) {
						this._crawler.searchName(searchParams).then(function(jsonData) {
							this._searchDeferred = null;
							result.resolve(this.convert(jsonData, searchParams));
						}.bind(this));
					} else {
						this._crawler.search(function() {
							result.progress(arguments[0], arguments[1]);
						}).then(function(jsonData) {
							this._searchDeferred = null;
							result.resolve(this.convert(jsonData, searchParams));
						}.bind(this));
					}
				} else {
					throw error;
				}
			}
			return result;
		},
		_generateSingle: function(sResult, searchHelper) {
			return this.getFileClient().read(sResult.location).then(function(jsonData) {
				mSearchUtils.searchWithinFile(searchHelper.inFileQuery, sResult, jsonData, false, searchHelper.params.caseSensitive, true);
				return sResult;
			}.bind(this),
			function(error) {
				var statusService = this._registry.getService("orion.page.message"); //$NON-NLS-1$
				if (statusService) {
					statusService.setProgressResult({Message: error.message, Severity: "Error"}); //$NON-NLS-1$
				}
			}.bind(this));
		},
		_generateMatches: function(searchParams, searchResult, generateMatches) {
			if(!generateMatches || searchResult.length === 0) {
				return new Deferred().resolve(searchResult);
			}
			var searchHelper = mSearchUtils.generateSearchHelper(searchParams);
			var promises = [];
			searchResult.forEach(function(sResult) {
				promises.push(this._generateSingle(sResult, searchHelper));
			}.bind(this)); 
			return Deferred.all(promises, function(error) { return {_error: error}; });
		},
		_generateSingleMeta: function(sResult) {
			return this.getFileClient().read(sResult.location, true).then(function(jsonData) {
				sResult.metadata = jsonData;
				return sResult;
			}.bind(this), function(error) {
				var statusService = this._registry.getService("orion.page.message"); //$NON-NLS-1$
				if (statusService) {
					statusService.setProgressResult({Message: error.message, Severity: "Error"}); //$NON-NLS-1$
				}
			}.bind(this));
		},
		_generateMeta: function(searchResult, generateMeta) {
			if(!generateMeta || searchResult.length === 0) {
				return new Deferred().resolve(searchResult);
			}
			var promises = [];
			searchResult.forEach(function(sResult) {
				promises.push(this._generateSingleMeta(sResult));
			}.bind(this)); 
			return Deferred.all(promises, function(error) { return {_error: error}; });
		},
		convert: function(jsonData, searchParams) {
			var converted = [];
			var rootURL = this._fileClient.fileServiceRootURL(searchParams.resource);
			if (jsonData.response.numFound > 0) {
				for (var i=0; i < jsonData.response.docs.length; i++) {
					var hit = jsonData.response.docs[i];
					if (!hit.Directory) {
						var loc = hit.Location;
						var path = hit.Path;
						if (!path) {
							path = loc.substring(rootURL ? rootURL.length : 0); //remove file service root from path
						}
						converted.push({location: loc, path: path, name: hit.Name});
					}
				}
			}
			return converted;
		},
		cancel: function() {
			if(this._searchDeferred) {
				return this._searchDeferred.cancel();
			}
			return new Deferred().resolve();
		},
		_createCrawler: function(searchParams, options) {
			this._crawler = new mSearchCrawler.SearchCrawler(this._registry, this.getFileClient(), searchParams, options);
			return this._crawler;
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
				wholeWord: advancedOptions ? advancedOptions.wholeWord : undefined,
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