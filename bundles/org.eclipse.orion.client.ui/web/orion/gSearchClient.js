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
define("orion/gSearchClient", [ //$NON-NLS-0$
	'orion/fileClient', //$NON-NLS-0$
	'orion/Deferred', //$NON-NLS-0$
	'orion/crawler/searchCrawler', //$NON-NLS-0$
	'orion/searchUtils' //$NON-NLS-0$
], function(mFileClient, Deferred, mSearchCrawler, mSearchUtils) {
	/**
	 * Creates a new global search client.
	 * @param {Object} options The options object
	 * @param {orion.serviceregistry.ServiceRegistry} options.serviceRegistry The service registry
	 * @param {orion.fileClient.FileClient} options.fileClient The file client that provide search API
	 * @name orion.search.GSearchClient
	 * @class Provides API for searching the workspace or under a certain folder.
	 */
	function GSearchClient(options) {
		this._registry = options.serviceRegistry;
		this._fileClient = options.fileClient;
		if(!this._fileClient) {
			this._fileClient = new mFileClient.FileClient(this._registry);
		}
	}
	GSearchClient.prototype = /**@lends orion.search.GSearchClient.prototype*/ {
		/**
		 * Runs a search and displays the results under the given DOM node.
		 * @public
		 * @param {Object} searchParams The search parameters.
		 * @param {Function(JSONObject)} Callback function that receives the results of the query.
		 */
		search: function(searchParams, generateMatches, generateMeta) {
			var result = new Deferred();
			try {
				this._searchDeferred = this._fileClient.search(searchParams);
				this._searchDeferred.then(function(jsonData) { //$NON-NLS-1$ //$NON-NLS-0$
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
				if(typeof(error) === "string" && error.toLowerCase().indexOf("search") > -1){ //$NON-NLS-1$ //$NON-NLS-0$
					if(!this._crawler) {
						this._crawler = this._createCrawler(searchParams);
					}
					if(searchParams.nameSearch) {
						this._crawler.searchName(searchParams).then(function(jsonData) { //$NON-NLS-1$ //$NON-NLS-0$
							this._searchDeferred = null;
							result.resolve(this.convert(jsonData, searchParams));
						}.bind(this));
					} else {
						this._crawler.search(function() {
							result.progress(arguments[0], arguments[1]);
						}).then(function(jsonData) { //$NON-NLS-1$ //$NON-NLS-0$
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
            return this._fileClient.read(sResult.location).then(function(jsonData) {
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
            return this._fileClient.read(sResult.location, true).then(function(jsonData) {
            	sResult.metadata = jsonData;
                 return sResult;
            }.bind(this),
            function(error) {
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
			this._crawler = new mSearchCrawler.SearchCrawler(this._registry, this._fileClient, searchParams, options);
			return this._crawler;
		}		
	};

	GSearchClient.prototype.constructor = GSearchClient;
	return {
		GSearchClient:GSearchClient
	};
});