/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define window document XMLHttpRequest*/
/*jslint sub:true*/

define(['i18n!orion/globalSearch/nls/messages', 'require', 'orion/searchUtils', 'orion/contentTypes', 'orion/i18nUtil', 'orion/webui/littlelib', 'orion/inputCompletion/inputCompletion', 'orion/Deferred', 'text!orion/globalSearch/advSearchOpt.html'], 
		function(messages, require, mSearchUtils, mContentTypes, i18nUtil, lib, mInputCompletion, Deferred, optionTemplate){

	function advSearchOptRenderer(searcher, serviceRegistry, cancelCallBack) {
		this._searcher = searcher;
		this._serviceRegistry = serviceRegistry;
	}
	
	advSearchOptRenderer.prototype.getOptions = function(){
		return {searchStr: this._searchBox.value,
				caseSensitive: this._caseSensitiveCB.checked,
		        regEx: this._regExCB.checked,
		        type: this._fileTypes.options[this._fileTypes.selectedIndex].value
		};
	};

	advSearchOptRenderer.prototype.render = function(parentDiv){
		this._parentDiv = parentDiv;
		var contentTypeService = this._serviceRegistry.getService("orion.core.contenttypes"); //$NON-NLS-0$
		if(!contentTypeService){
			contentTypeService = new mContentTypes.ContentTypeService(this._serviceRegistry);
			this.contentTypesCache = contentTypeService.getContentTypes();
			this._render();
		} else {
			var that = this;
			contentTypeService.getContentTypes().then(function(ct) {
				that.contentTypesCache = ct;
				that._render();
			});
		}
	};

	advSearchOptRenderer.prototype._render = function(){
		this._parentDiv.innerHTML = optionTemplate;
		this._initHTMLLabels();
	    this._initControls();
		this._searchBox.focus();
		
		//Required. Reading recent&saved search from user preference. Once done call the uiCallback
		var defaultProposalProvider = function(uiCallback){
			mSearchUtils.getMixedSearches(this._serviceRegistry, true, false, function(searches){
				var i, fullSet = [], hasSavedSearch = false, hasRecentSearch = false;
				for (i in searches) {
					if(searches[i].label && searches[i].value){
						if(!hasSavedSearch){
							fullSet.push({type: "category", label: messages["Saved searches"]});//$NON-NLS-0$
							hasSavedSearch = true;
						}
						fullSet.push({type: "proposal", value: {name: searches[i].label, value: require.toUrl("search/search.html") + "#" + searches[i].value, type: "link"}});  //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						//fullSet.push({type: "proposal", label: searches[i].label, value: searches[i].name});//$NON-NLS-0$
					} else {
						if(!hasRecentSearch){
							fullSet.push({type: "category", label: messages["Recent searches"]});//$NON-NLS-0$
							hasRecentSearch = true;
						}
						fullSet.push({type: "proposal", label: searches[i].name, value: searches[i].name});//$NON-NLS-0$
					}
				}
				uiCallback(fullSet);
			});
		}.bind(this);
		//Optional. Reading extended search proposals by asking plugins, if any.
		//If there are multiple plugins then merge all the proposals and call uiCallBack.
		//Plugins(with service id "orion.search.proposal") should define the property "filterForMe" to true or false. Which means:
		//If true the inputCompletion class will filter the proposals returned by the plugin.
		//If false the inputCompletion class assumes that the proposals are already filtered by hte given kerword. 
		//The false case happens when a plugin wants to use the keyword to ask for a set of filtered proposal from a web service by the keyword and Orion does not need to filter it again.
		var exendedProposalProvider = function(keyWord, uiCallback){
			var serviceReferences = this._serviceRegistry.getServiceReferences("orion.search.proposal"); //$NON-NLS-0$
			if(!serviceReferences || serviceReferences.length === 0){
				uiCallback(null);
				return;
			}
            var promises = [];
            var renderer = this;
			serviceReferences.forEach(function(serviceRef) {
				var filterForMe = serviceRef.getProperty("filterForMe");  //$NON-NLS-0$
				promises.push( this._serviceRegistry.getService(serviceRef).run(keyWord).then(function(returnValue) {
					//The return value has to be an array of {category : string, datalist: [string,string,string...]}
					var proposalList = {filterForMe: filterForMe, proposals: []};
					for (var i = 0; i < returnValue.length; i++) {
						proposalList.proposals.push({type: "category", label: returnValue[i].category});//$NON-NLS-0$
						for (var j = 0; j < returnValue[i].datalist.length; j++) {
							proposalList.proposals.push({type: "proposal", label: returnValue[i].datalist[j], value: returnValue[i].datalist[j]});//$NON-NLS-0$
						}
					}
					return proposalList;
				}));
			}.bind(renderer));
			Deferred.all(promises).then(function(returnValues) {
				//Render UI
				uiCallback(returnValues);
			});
		}.bind(this);
		//Create and hook up the inputCompletion instance with the search box dom node.
		//The defaultProposalProvider provides proposals from the recent and saved searches.
		//The exendedProposalProvider provides proposals from plugins.
		new mInputCompletion.InputCompletion(this._searchBox, defaultProposalProvider,
									{group: "globalSearch", extendedProvider: exendedProposalProvider}); //$NON-NLS-0$
	};
	
	advSearchOptRenderer.prototype._submitSearch = function(){
		var options = this.getOptions();
		mSearchUtils.doSearch(this._searcher, this._serviceRegistry, options.searchStr, options);
	};
	
	advSearchOptRenderer.prototype._initControls = function(){
		this._searchBox = document.getElementById("advSearchInput"); //$NON-NLS-0$
		this._fileTypes = document.getElementById("advSearchTypes"); //$NON-NLS-0$
		this._caseSensitiveCB = document.getElementById("advSearchCaseSensitive"); //$NON-NLS-0$
		this._regExCB = document.getElementById("advSearchRegEx"); //$NON-NLS-0$
		this._submitButton = document.getElementById("advSearchSubmit"); //$NON-NLS-0$
		//Load file types content type provider
		var fTypes = [ {label: messages["All types"], value: mSearchUtils.ALL_FILE_TYPE} ];
		for(var i = 0; i < this.contentTypesCache.length; i++){
			if(this.contentTypesCache[i]['extends'] === "text/plain" || this.contentTypesCache[i].id === "text/plain"){ //$NON-NLS-2$  //$NON-NLS-1$ //$NON-NLS-0$
				for(var j = 0; j < this.contentTypesCache[i].extension.length; j++){
					fTypes.push({label: this.contentTypesCache[i].extension[j], value: this.contentTypesCache[i].extension[j]});
				}
			}
		}
		for (var x = 0; x < fTypes.length; x++) {
		    var option = document.createElement('option'); //$NON-NLS-0$
		    var text = document.createTextNode(fTypes[x].label);
		    option.appendChild(text);
		    this._fileTypes.appendChild(option);
		    option.value = fTypes[x].value;
		}		
		//Add listeners
		var that = this;
		this._searchBox.addEventListener("keydown", function(e) { //$NON-NLS-0$
			var keyCode= e.charCode || e.keyCode;
			if (keyCode === 13 ) {// ENTER
				that._submitSearch();
			} 
		});
		
		this._fileTypes.addEventListener("change", function(e) { //$NON-NLS-0$
			var type = that._fileTypes.options[that._fileTypes.selectedIndex].value;
			if(type === mSearchUtils.ALL_FILE_TYPE){
				that._searchBox.placeholder = messages["Type a search term"];
			} else {
				that._searchBox.placeholder =i18nUtil.formatMessage(messages["All ${0} files"], type);
			}
		});
		
		this._submitButton.onclick = function(e){
			that._submitSearch();
		};
	};
	
	advSearchOptRenderer.prototype._initHTMLLabels = function(){
		document.getElementById("advSearchLabel").appendChild(document.createTextNode(messages["Files that contain:"])); //$NON-NLS-0$ //$NON-NLS-0$
		document.getElementById("advSearchInput").placeholder = messages["Type a search term"]; //$NON-NLS-0$ //$NON-NLS-0$
		document.getElementById("advSearchTypeLabel").appendChild(document.createTextNode(messages["File type:"])); //$NON-NLS-0$ //$NON-NLS-0$
		document.getElementById("advSearchCaseSensitiveLabel").appendChild(document.createTextNode(messages["Case sensitive"])); //$NON-NLS-0$ //$NON-NLS-0$
		document.getElementById("advSearchRegExLabel").appendChild(document.createTextNode(messages["Regular expression"])); //$NON-NLS-0$ //$NON-NLS-0$
		document.getElementById("advSearchSubmit").value = messages["Search"]; //$NON-NLS-1$ //$NON-NLS-0$
	};
	
	advSearchOptRenderer.prototype.constructor = advSearchOptRenderer;
	/**
	 * advSearchOptContainer is the container for all search options.
	 * @param {String|DOMElement} parent the parent element for the container, it can be either a DOM element or an ID for a DOM element.
	 */
	function advSearchOptContainer(parent, searcher, serviceRegistry) {
		this._parent = lib.node(parent);
		this._optRenderer = new advSearchOptRenderer(searcher, serviceRegistry);
		this._optRenderer.render(this._parent);	
	}
	
	advSearchOptContainer.prototype.constructor = advSearchOptContainer;
	
	//return module exports
	return {
		advSearchOptContainer: advSearchOptContainer,
		advSearchOptRenderer: advSearchOptRenderer
	};
});
