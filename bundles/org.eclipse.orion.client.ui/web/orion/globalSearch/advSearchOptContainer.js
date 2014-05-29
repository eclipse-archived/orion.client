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
/*global define window document console*/
/*jslint sub:true*/

define([
	'i18n!orion/search/nls/messages',
	'orion/fileClient', 
	'orion/searchUtils', 
	'orion/contentTypes', 
	'orion/webui/littlelib',
	'orion/Deferred', 
	'orion/commands', 
	'orion/objects',
	'orion/EventTarget',
	'text!orion/globalSearch/searchBuilder.html',
	'orion/PageUtil',
	'orion/webui/dialogs/DirectoryPrompterDialog',
	'orion/widgets/input/ComboTextInput'
], function(messages, mFileClient, mSearchUtils, mContentTypes, lib, Deferred, mCommands, objects, EventTarget, optionTemplate, mPageUtil, DirectoryPrompterDialog, ComboTextInput){

	/**
	 * @name orion.search.AdvSearchOptRenderer
	 * @class AdvSearchOptRenderer.
	 * @description The renderer to render all search parameters.
	 * @param {Dome node} parentDiv.
	 * @param {orion.search.Searcher} A searcher that knows how to start a search.
	 * @param {orion.commands.CommandRegistry} commandService
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry
	 */
	function AdvSearchOptRenderer(parentDiv, searcher, serviceRegistry, commandService) {
		EventTarget.attach(this);
		this._parentDiv = parentDiv;
		this._searcher = searcher;
		this._serviceRegistry = serviceRegistry;
		this._contentTypeService = this._serviceRegistry.getService("orion.core.contentTypeRegistry"); //$NON-NLS-0$
		if(!this._contentTypeService){
			this._contentTypeService = new mContentTypes.ContentTypeRegistry(this._serviceRegistry);
		}
		this.contentTypesCache = this._contentTypeService.getContentTypes();
		this._commandService = commandService;
        this.fileClient = new mFileClient.FileClient(this._serviceRegistry);
	}
	
	objects.mixin(AdvSearchOptRenderer.prototype, /** @lends orion.search.AdvSearchOptRenderer */ {
		destroy: function() {
		},
		
		getOptions: function(){
			var resource = ""; //$NON-NLS-0$
			this._searchLocations.forEach(function(searchLocation){
				if (resource) {
					resource = resource.concat(","); //$NON-NLS-0$
				}
				resource = resource.concat(searchLocation);
			}, this);
			
			var fileNamePatternsArray = mSearchUtils.getFileNamePatternsArray(this._fileNamePatternsInput.value);
			var replaceValue = this._replaceBox.getTextInputValue() || undefined;
			
			return {keyword: this._searchBox.getTextInputValue(),
					rows: 40,
					start: 0,
					replace: replaceValue,
					caseSensitive: this._caseSensitiveCB.checked,
			        regEx: this._regExCB.checked,
					fileNamePatterns: fileNamePatternsArray,
			        resource: resource
			};
		},
		
		loadSearchParams: function(searchParams){
			this._searchParams = searchParams;
			this._rootURL = this.fileClient.fileServiceRootURL(this._searchParams.resource);
			this.dispatchEvent({type: "rootChanged", root: this._rootURL}); //$NON-NLS-0$
			this._loadSearchParams();
		},
	
		_loadSearchParams: function(){
			if(!this._init || !this._searchParams){
				return;
			}
			this._searchBox.setTextInputValue(this._searchParams.keyword || "");
			this._replaceBox.setTextInputValue(this._searchParams.replace || "");
			this._caseSensitiveCB.checked = this._searchParams.caseSensitive;
			this._regExCB.checked = this._searchParams.regEx;
			this._fileNamePatternsInput.value = this._searchParams.fileNamePatterns ? this._searchParams.fileNamePatterns.join(", ") : "";
			
			if (undefined !== this._searchParams.replace) {
				this._showReplaceField();
			} else {
				this._hideReplaceField();
			}
		},
	
		render: function(){
			this._contentTypeService.getContentTypes().then(function(ct) {
				this.contentTypesCache = ct;
				this._render();
			}.bind(this));
		},
	
		_render: function(){
			this._parentDiv.innerHTML = optionTemplate;
			
			this._initHTMLLabels();
		    this._initControls();
			this._searchTextInputBox.focus();
			
		},
		
		_submitSearch: function(){
			var options = this.getOptions();
			options.replace = null;
			this._searchBox.addTextInputValueToRecentEntries();
			mSearchUtils.doSearch(this._searcher, this._serviceRegistry, options.keyword, options);
		},
		
		_replacePreview: function(){
			var options = this.getOptions();
			this._searchBox.addTextInputValueToRecentEntries();
			this._replaceBox.addTextInputValueToRecentEntries();
			if(!options.replace){
				options.replace = "";
			}
			if(options.keyword){
				mSearchUtils.doSearch(this._searcher, this._serviceRegistry, options.keyword, options);
			}
		},
	    
	    _initSearchBox: function(){
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
			
			var searchBoxParentNode = lib.$(".searchMainOptionBlock", this._parentDiv);
			
			this._searchBox = new ComboTextInput({
				id: "advSearchInput",
				insertBeforeNode: searchBoxParentNode.firstElementChild,
				parentNode: searchBoxParentNode,
				hasButton: true,
				buttonText: messages["Search"],
				buttonClickListener: this._submitSearch.bind(this),
				hasInputCompletion: true,
				serviceRegistry: this._serviceRegistry,
				extendedRecentEntryProposalProvider: exendedProposalProvider
			});
			
			this._searchTextInputBox = this._searchBox.getTextInputNode();
			this._searchTextInputBox.placeholder = messages["Type a search term"]; //$NON-NLS-1$ //$NON-NLS-0$
			
			this._searchButtonWrapper = this._searchBox.getButtonWrapper();
			this._recentSearchButton = this._searchBox.getRecentEntryButton();
			this._recentSearchButton.title = messages["Show previous search terms"]; //$NON-NLS-1$ //$NON-NLS-0$
			
			this._searchTextInputBox.addEventListener("keydown", function(e) { //$NON-NLS-0$
				if(e.defaultPrevented){// If the key event was handled by other listeners and preventDefault was set on(e.g. input completion handled ENTER), we do not handle it here
					return;
				}
				var keyCode= e.charCode || e.keyCode;
				if (keyCode === 13 ) {// ENTER
					this._submitSearch();
				} 
			}.bind(this));
	    },
	    
	    _initReplaceBox: function() {
	        this._replaceWrapper = document.getElementById("replaceWrapper"); //$NON-NLS-0$
	        
	        this._replaceBox = new ComboTextInput({
				id: "advReplaceInput", //$NON-NLS-0$
				parentNode: this._replaceWrapper,
				hasButton: true,
				buttonText: messages["Replace..."], //$NON-NLS-0$
				buttonClickListener: this._replacePreview.bind(this),
				hasInputCompletion: true,
				serviceRegistry: this._serviceRegistry,
			});
			
			this._replaceTextInputBox = this._replaceBox.getTextInputNode();
			this._replaceTextInputBox.placeholder = messages["Replace With"]; //$NON-NLS-0$
			
			this._replaceButton = this._replaceBox.getButton();
			this._replaceButton.title = messages["Show replacement preview"]; //$NON-NLS-0$
			
			this._recentReplaceButton = this._replaceBox.getRecentEntryButton();
			this._recentReplaceButton.title = messages["Show previous replace terms"]; //$NON-NLS-0$
			
			this._replaceTextInputBox.addEventListener("keydown", function(e) { //$NON-NLS-0$
				var keyCode= e.charCode || e.keyCode;
				if (keyCode === lib.KEY.ENTER) {
					this._replacePreview();
				} 
			}.bind(this));
			
			//fix the width of the replaceWrapper div to prevent it from resizing
			this._replaceWrapper.style.width = "auto"; //$NON-NLS-0$
			this._replaceWrapper.style.width = this._replaceBox.getDomNode().scrollWidth + 8 + "px"; //$NON-NLS-0$
	    },
	    
		_initControls: function(){
			this._initSearchBox();
			this._initReplaceBox();
			
			this._fileNamePatternsInput = document.getElementById("fileNamePatternsInput"); //$NON-NLS-0$
			this._fileNamePatternsHint = document.getElementById("fileNamePatternsHint"); //$NON-NLS-0$
			this._caseSensitiveCB = document.getElementById("advSearchCaseSensitive"); //$NON-NLS-0$
			this._regExCB = document.getElementById("advSearchRegEx"); //$NON-NLS-0$
			this._toggleReplaceLink = document.getElementById("toggleReplaceLink"); //$NON-NLS-0$

			this._init = true;
			this._loadSearchParams();
				        
			if (this._replaceBoxIsHidden()) {
	        	this._toggleReplaceLink.innerHTML = messages["Show Replace"]; //$NON-NLS-0$	
	        }
	        this._toggleReplaceLink.addEventListener("click", this._toggleReplaceFieldVisibility.bind(this)); //$NON-NLS-0$
	        
	        this._fileNamePatternsInput.placeholder = "*.*"; //$NON-NLS-0$
			lib.empty(this._fileNamePatternsHint);
			this._fileNamePatternsHint.appendChild(document.createTextNode(messages["(* = any string, ? = any character)"])); //$NON-NLS-0$
			
			this._fileNamePatternsInput.addEventListener("focus", function(){
				this._fileNamePatternsHint.classList.add("fileNamePatternsHintVisible"); //$NON-NLS-0$
			}.bind(this));
			
			this._fileNamePatternsInput.addEventListener("blur", function(){
				var inputValue = this._fileNamePatternsInput.value;
				if (inputValue) {
					var correctedPatternArray = mSearchUtils.getFileNamePatternsArray(inputValue);
					this._fileNamePatternsInput.value = correctedPatternArray.join(", ");
				}
				this._fileNamePatternsHint.classList.remove("fileNamePatternsHintVisible"); //$NON-NLS-0$
			}.bind(this));
			
	        this._initSearchScope();
		},
		
		_initHTMLLabels: function(){
			document.getElementById("advSearchCaseSensitiveLabel").appendChild(document.createTextNode(messages["Case sensitive"])); //$NON-NLS-1$ //$NON-NLS-0$
			document.getElementById("advSearchRegExLabel").appendChild(document.createTextNode(messages["Regular expression"])); //$NON-NLS-1$ //$NON-NLS-0$
			document.getElementById("searchScopeLabel").appendChild(document.createTextNode(messages["Scope"])); //$NON-NLS-1$ //$NON-NLS-0$
			document.getElementById("fileNamePatternsLabel").appendChild(document.createTextNode(messages["File name patterns (comma-separated)"])); //$NON-NLS-1$ //$NON-NLS-0$
			document.getElementById("searchScopeSelectButton").title = messages["Choose a Folder"]; //$NON-NLS-1$ //$NON-NLS-0$
		},
		
		_initSearchScope: function() {
			var resource = mPageUtil.matchResourceParameters().resource;
			this._rootURL = this.fileClient.fileServiceRootURL(resource);
			
			if (resource) {
				this._searchLocations = [resource];
			} else {
				this._searchLocations = [this._rootURL];
			}
			
			this._searchScopeElementWrapper = lib.$("#searchScopeElementWrapper", this._parentDiv); //$NON-NLS-0$
			this._displaySelectedSearchScope();
			
			this._searchScopeSelectButton = lib.$("#searchScopeSelectButton", this._parentDiv); //$NON-NLS-0$
			
			var searchScopeDialogCallback = function(targetFolder) { 
				if (targetFolder && targetFolder.Location) {
					this._searchLocations = [targetFolder.Location];
				} else {
					this._searchLocations = [this._rootURL];
				}
				
				this._displaySelectedSearchScope();
				this._searcher.setLocationbyURL(this._searchLocations[0]);
			}.bind(this);
			
			this._searchScopeSelectButton.addEventListener("click", function(){ //$NON-NLS-0$
				var searchScopeDialog = new DirectoryPrompterDialog.DirectoryPrompterDialog({
					title: messages["Choose a Folder"], //$NON-NLS-0$
					serviceRegistry: this._serviceRegistry,
					fileClient: this.fileClient,				
					func: searchScopeDialogCallback
				});
				searchScopeDialog.show();
			}.bind(this));
		},
		
		_replaceBoxIsHidden: function() {
			return this._replaceWrapper.classList.contains("replaceWrapperHidden"); //$NON-NLS-0$
		},
		
		_toggleReplaceFieldVisibility: function () {
			if (this._replaceBoxIsHidden()) {
				this._showReplaceField();
			} else {
				this._hideReplaceField();
			}
		},
		
		_showReplaceField: function() {
			this._searchButtonWrapper.classList.add("isHidden"); //$NON-NLS-0$
			this._replaceWrapper.classList.remove("replaceWrapperHidden"); //$NON-NLS-0$
			this._toggleReplaceLink.innerHTML = messages["Hide Replace"]; //$NON-NLS-0$
		},
		
		_hideReplaceField: function() {
			this._searchButtonWrapper.classList.remove("isHidden"); //$NON-NLS-0$
			this._replaceWrapper.classList.add("replaceWrapperHidden"); //$NON-NLS-0$
			this._toggleReplaceLink.innerHTML = messages["Show Replace"]; //$NON-NLS-0$
		},
		
		_displaySelectedSearchScope: function() {
			var scopeElementWrapper = this._searchScopeElementWrapper;
			lib.empty(scopeElementWrapper);
			
			this._searchLocations.forEach(function(searchLocation){
				var decodedLocation = decodeURI(searchLocation);
				var scopeString = decodedLocation;
				var rootName = this.fileClient.fileServiceRootURL(scopeString);
				if (rootName === searchLocation) {
					//replace location string with file system name
					scopeString = this.fileClient.fileServiceName(scopeString);
				} else {
					//set scopeString to resource name
					var segments = scopeString.split("/");
					if (segments) {
						scopeString = segments.pop();
						if (!scopeString) {
							// scopeString ended with '/', last element in array returned by 
							// split() was empty, pop again to get the name
							scopeString = segments.pop();
						}
					}
				}
												
				var locationElement = document.createElement("span"); //$NON-NLS-0$
				locationElement.classList.add("searchScopeElement"); //$NON-NLS-0$
				
				locationElement.title = decodedLocation;
				scopeElementWrapper.title = decodedLocation;
				
				locationElement.appendChild(document.createTextNode(scopeString));
				scopeElementWrapper.appendChild(locationElement);	
			}, this);
		}
	});
	
	/**
	 * AdvSearchOptContainer is the container for all search options.
	 * @param {String|DOMElement} parent the parent element for the container, it can be either a DOM element or an ID for a DOM element.
	 */
	function AdvSearchOptContainer(parent, searcher, serviceRegistry, commandService) {
		this._parent = lib.node(parent);
		this._optRenderer = new AdvSearchOptRenderer(this._parent, searcher, serviceRegistry, commandService);
		this._optRenderer.render();	
	}
	
	AdvSearchOptContainer.prototype.getRenderer = function(){
		return this._optRenderer;
	};
	
	AdvSearchOptContainer.prototype.constructor = AdvSearchOptContainer;
	
	//return module exports
	return {
		AdvSearchOptContainer: AdvSearchOptContainer,
		AdvSearchOptRenderer: AdvSearchOptRenderer
	};
});
