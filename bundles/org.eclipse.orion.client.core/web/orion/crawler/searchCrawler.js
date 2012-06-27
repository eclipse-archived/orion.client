/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define console window*/
/*jslint regexp:false browser:true forin:true*/

define(['i18n!orion/crawler/nls/messages', 'require', 'orion/searchUtils', 'orion/contentTypes', "orion/Deferred"], 
		function(messages, require, mSearchUtils, mContentTypes, Deferred) {

	/**
	 * This helper method implements invocation of the service call,
	 * with retry on authentication error if needed.
	 * @private
	 */
	function _doServiceCall(fileService, funcName, funcArgs) {
		//if the function is not implemented in the file service, we throw an exception to the caller
		if(!fileService[funcName]){
			throw funcName + messages[" is not supportted in this file system"];
		}
		var clientDeferred = new Deferred();
		fileService[funcName].apply(fileService, funcArgs).then(
			//on success, just forward the result to the client
			function(result) {
				clientDeferred.resolve(result);
			},
			//on failure we might need to retry
			function(error) {
				if (error.status === 401) {
					mAuth.handleAuthenticationError(error, function(message) {
						//try again
						fileService[funcName].apply(fileService, funcArgs).then(
							function(result) {
								clientDeferred.resolve(result);
							},
							function(error) {
								clientDeferred.reject(error);
							}
						);
					});
				} else {
					//forward other errors to client
					clientDeferred.reject(error);
				}
			}
		);
		return clientDeferred;
	}
	
	/**
	 * SearchCrawler is an alternative when a file service does not provide the search API.
	 * It assumes that the file client at least provides the fetchChildren and read APIs.
	 * It basically visits all the children recursively under a given directory location and search on a given keyword, either literal or wild card.
	 * @param {serviceRegistry} serviceRegistry The service registry.
	 * @param {fileClient} fileClient The file client that provides fetchChildren and read APIs.
	 * @param {String} queryStr The query string. This is temporary for now. The format is "?sort=Path asc&rows=40&start=0&q=keyword+Location:/file/e/bundles/*"
	 * @param {Object} options Not used yet. For future use.
	 * @name orion.search.SearchCrawler
	 */
	function SearchCrawler(	serviceRegistry, fileClient, queryStr, options) {
		this.registry= serviceRegistry;
		this.fileClient = fileClient; 
		//this.searchFileTypes = ["js", "css", "java", "txt", "HTML"];
		this.queryObj = mSearchUtils.parseQueryStr(queryStr);
		this.fileLocations = [];
		this._hitCounter = 0;
		this._totalCounter = 0;
	}
	
	/**
	 * Do search based on this.queryObj.
	 * @param {Function} onComplete The callback function on search complete. The array of hit file locations are passed to the callback.
	 */
	SearchCrawler.prototype.search = function(onComplete){
		var contentTypeService = this.registry.getService("orion.core.contenttypes");
		var self = this;
		contentTypeService.getContentTypes().then(function(ct) {
			self.contentTypesCache = ct;
			var result = self._visitRecursively(self.queryObj.location+ "?depth=1").then(function(){
				//self._searchFiles().then(function(){
					self._searchCompleted();
					var response = {numFound: self.fileLocations.length, docs: self.fileLocations };
					onComplete({response: response});
				//});
			});
		});
	};
	
	SearchCrawler.prototype._searchCompleted = function(){
		console.log("Completed!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
	};
	
	SearchCrawler.prototype._searchFiles = function(){
		var results = [];
		var self = this;
		if(self.fileLocations.length > 0){
			var self = this;
			for (var i = 0; i < self.fileLocations.length ; i++){
				results.push(self._sniffSearch(self.fileLocations[i]));
			}
		}
		return new Deferred().all(results);
	};
		
	SearchCrawler.prototype._visitRecursively = function(directoryLocation){
		var results = [];
		var self = this;
		return _doServiceCall(self.fileClient, "fetchChildren", [directoryLocation]).then(function(children) { //$NON-NLS-0$
			var len = children.length;
			for (var i = 0; i < children.length ; i++){
				if(children[i].Directory!==undefined && children[i].Directory===false){
					var contentType = mContentTypes.getFilenameContentType(children[i].Name, self.contentTypesCache);
					if(contentType && contentType.extends === "text/plain"){
						//self.fileLocations.push(children[i].Location);
						results.push(self._sniffSearch(children[i]));
					}
				} else if (children[i].Location) {
					results.push(self._visitRecursively(children[i].ChildrenLocation));
				}
			}
			return new Deferred().all(results);
		});
	};

	SearchCrawler.prototype._hitOnceWithinFile = function( fileContentText){
		var lineString = fileContentText;//.toLowerCase();
		var result;
		if(this.queryObj.inFileQuery.wildCard){
			result = mSearchUtils.searchOnelineRegEx(this.queryObj.inFileQuery, lineString, true);
		} else {
			result = mSearchUtils.searchOnelineLiteral(this.queryObj.inFileQuery, lineString, true);
		}
		return result;
	};

	SearchCrawler.prototype._sniffSearch = function(fileObj){
		this._totalCounter++;
		var self = this;
		return _doServiceCall(self.fileClient, "read", [fileObj.Location]).then(function(jsonData) { //$NON-NLS-0$
			if(self._hitOnceWithinFile(jsonData)){
				self.fileLocations.push(fileObj);
				self._hitCounter++;
				console.log("hit on file : "+ self._hitCounter + " out of " + self._totalCounter);
				console.log(fileObj.Location);
			}
			},
			function(error) {
				console.error("Error loading file content: " + error.message); //$NON-NLS-0$
			}
		);
	};
	
	SearchCrawler.prototype.constructor = SearchCrawler;
	
	//return module exports
	return {
		SearchCrawler: SearchCrawler
	};
});
