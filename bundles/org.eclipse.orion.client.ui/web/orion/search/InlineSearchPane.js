/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others. 
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define URL window document*/
/*jslint browser:true sub:true*/
define([
	'orion/objects',
	'orion/webui/littlelib',
	'text!orion/search/InlineSearchPane.html',
	'orion/searchClient',
	'orion/inlineSearchResultExplorer',
	'orion/EventTarget',
	'orion/searchUtils',
	'orion/Deferred', 
	'orion/webui/dialogs/DirectoryPrompterDialog',
	'orion/widgets/input/ComboTextInput',
	'i18n!orion/search/nls/messages'
], function(
	objects, lib, InlineSearchPaneTemplate, mSearchClient, InlineSearchResultExplorer, 
	EventTarget, mSearchUtils, Deferred, DirectoryPrompterDialog, ComboTextInput, messages
) {
	/**
	 * @param {DOMNode} options.parentNode
	 */
	function InlineSearchPane(options) {
		EventTarget.attach(this);
		this._parentNode = options.parentNode;
		this._serviceRegistry = options.serviceRegistry;
		this._commandRegistry = options.commandRegistry;
		this._fileClient = options.fileClient;
		this._initialize();
	}

	objects.mixin(InlineSearchPane.prototype, /** @lends orion.search.InlineSearchPane.prototype */ {
		_initialize: function() {
			var range = document.createRange();
			range.selectNode(this._parentNode);
			var domNodeFragment = range.createContextualFragment(InlineSearchPaneTemplate);
			this._parentNode.appendChild(domNodeFragment);
			
			this._searchWrapper = lib.$(".searchWrapper", this._parentNode); //$NON-NLS-0$
			
			this._focusOnTextInput = function(){
				this._searchTextInputBox.focus();
			}.bind(this);
			
			this._dismissButton = lib.$(".dismissButton", this._parentNode); //$NON-NLS-0$
			this._dismissButton.addEventListener("click", function(){ //$NON-NLS-0$
				this.hide();
			}.bind(this));
			
			this._replaceWrapper = document.getElementById("replaceWrapper"); //$NON-NLS-0$
			
			this._searchOptWrapperDiv = lib.$(".searchOptWrapperDiv", this._parentNode); //$NON-NLS-0$
			this._searchResultsTitle = lib.$(".searchResultsTitle", this._parentNode); //$NON-NLS-0$
			this._searchResultsWrapperDiv = lib.$(".searchResultsWrapperDiv", this._parentNode); //$NON-NLS-0$
			this._searchResultsWrapperDiv.id = "inlineSearchResultsWrapper";
			
			this._replaceCompareTitleDiv = lib.node("replaceCompareTitleDiv"); //$NON-NLS-0$
			this._replaceCompareDiv = lib.node("replaceCompareDiv"); //$NON-NLS-0$

			this._searcher = new mSearchClient.Searcher({serviceRegistry: this._serviceRegistry, commandService: this._commandRegistry, fileService: this._fileClient});
			this._searchResultExplorer = new InlineSearchResultExplorer(this._serviceRegistry, this._commandRegistry, this);
			this._render();
		},
		
		isVisible: function() {
			return this._searchWrapper.classList.contains("searchWrapperActive"); //$NON-NLS-0$
		},
				
		show: function() {
			this._previousActiveElement = document.activeElement;
			
			if (!this._replaceBoxIsHidden()) {
				this._showReplacePreview();
			}
			
			this._searchWrapper.classList.add("searchWrapperActive"); //$NON-NLS-0$
			window.setTimeout(this._focusOnTextInput, 100);
			
			this.dispatchEvent({type: "open"});
		},
		
		hide: function() {
			this._searchWrapper.classList.remove("searchWrapperActive"); //$NON-NLS-0$
			
			this._hideReplacePreview();

			this._previousActiveElement = null;			
		},
		
		getOptions: function(){
			var resource = ""; //$NON-NLS-0$
			this._searchLocations.forEach(function(searchLocation){
				if (resource) {
					resource = resource.concat(","); //$NON-NLS-0$
				}
				resource = resource.concat(searchLocation);
			}, this);
			
			this._correctFileNamePatternsInputValue();
			var fileNamePatternsArray = mSearchUtils.getFileNamePatternsArray(this._fileNamePatternsBox.getTextInputValue());
			var replaceValue = this._replaceBox.getTextInputValue() || undefined;
			
			return {keyword: this._searchBox.getTextInputValue(),
					rows: 10000,
					start: 0,
					replace: replaceValue,
					caseSensitive: this._caseSensitiveCB.checked,
			        regEx: this._regExCB.checked,
					fileNamePatterns: fileNamePatternsArray,
			        resource: resource
			};
		},
		
		_render: function(){
			this._initControls();
			this._initHTMLLabels();
		},
		
		_submitSearch: function(){
			var options = this.getOptions();
			options.replace = null;
			if(options.keyword){
				this._searchBox.addTextInputValueToRecentEntries();
				this._fileNamePatternsBox.addTextInputValueToRecentEntries();
				var searchParams = mSearchUtils.getSearchParams(this._searcher, options.keyword, options);
				this._searchResultExplorer.runSearch(searchParams, this._searchResultsWrapperDiv, this._searcher);
				this._hideSearchOptions();
			}
		},
		
		_replacePreview: function(){
			var options = this.getOptions();
			if(!options.replace){
				options.replace = "";
			}
			if(options.keyword){
				this._searchBox.addTextInputValueToRecentEntries();
				this._replaceBox.addTextInputValueToRecentEntries();
				this._fileNamePatternsBox.addTextInputValueToRecentEntries();
				var searchParams = mSearchUtils.getSearchParams(this._searcher, options.keyword, options);
				this._searchResultExplorer.runSearch(searchParams, this._searchResultsWrapperDiv, this._searcher);
				this._hideSearchOptions();
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
			
			var searchBoxParentNode = lib.$(".searchMainOptionBlock", this._parentNode); //$NON-NLS-0$
			
			var searchButtonListener = function() {
				if (!this.isVisible()) {
					this.show();
				}
				this._submitSearch();
			}.bind(this);
			
			this._searchBox = new ComboTextInput({
				id: "advSearchInput", //$NON-NLS-0$
				parentNode: searchBoxParentNode,
				insertBeforeNode: this._replaceWrapper,
				hasButton: true,
				buttonClickListener: searchButtonListener,
				hasInputCompletion: true,
				serviceRegistry: this._serviceRegistry,
				extendedRecentEntryProposalProvider: exendedProposalProvider
			});
			
			var searchButtonSpan = document.createElement("span"); //$NON-NLS-0$
			searchButtonSpan.classList.add("core-sprite-search"); //$NON-NLS-0$
			
			this._searchButton = this._searchBox.getButton();
			this._searchButton.classList.add("searchButton"); //$NON-NLS-0$
			this._searchButton.appendChild(searchButtonSpan);
			
			this._searchTextInputBox = this._searchBox.getTextInputNode();
			this._searchTextInputBox.placeholder = messages["Type a search term"]; //$NON-NLS-1$ //$NON-NLS-0$
			
			this._searchBox.setRecentEntryButtonTitle(messages["Show previous search terms"]); //$NON-NLS-0$
			
			this._searchTextInputBox.addEventListener("keydown", function(e) { //$NON-NLS-0$
				if(e.defaultPrevented){// If the key event was handled by other listeners and preventDefault was set on(e.g. input completion handled ENTER), we do not handle it here
					return;
				}
				var keyCode= e.charCode || e.keyCode;
				if (keyCode === lib.KEY.ENTER) {
					this._submitSearch();
					this._searchTextInputBox.blur();
				} else if (keyCode === lib.KEY.ESCAPE) {
					if (this._previousActiveElement) {
						if (this._previousActiveElement === this._searchTextInputBox) {
							this._searchTextInputBox.blur();
						} else {
							this._previousActiveElement.focus();
						}
						this.hide();
					}
				}
			}.bind(this));
	    },
	    
	    _initReplaceBox: function() {
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

			this._replaceBox.setRecentEntryButtonTitle(messages["Show previous replace terms"]); //$NON-NLS-0$
			
			this._replaceTextInputBox.addEventListener("keydown", function(e) { //$NON-NLS-0$
				var keyCode= e.charCode || e.keyCode;
				if (keyCode === lib.KEY.ENTER) {
					this._replacePreview();
					this._replaceTextInputBox.blur();
				} 
			}.bind(this));
	    },
	    
	    _initFileNamePatternsBox: function() {
			this._fileNamePatternsHint = document.getElementById("fileNamePatternsHint"); //$NON-NLS-0$
			
			this._fileNamePatternsBox = new ComboTextInput({
				id: "fileNamePatternsInput", //$NON-NLS-0$
				insertBeforeNode: this._fileNamePatternsHint,
				parentNode: this._fileNamePatternsHint.parentNode,
				hasButton: false,
				hasInputCompletion: true,
				serviceRegistry: this._serviceRegistry
			});
			
			this._fileNamePatternsBox.getDomNode().classList.add("fileNamePatternsInput"); //$NON-NLS-0$
			
			this._fileNamePatternsTextInput = this._fileNamePatternsBox.getTextInputNode();
			this._fileNamePatternsTextInput.classList.add("fileNamePatternsTextInput"); //$NON-NLS-0$
			this._fileNamePatternsTextInput.placeholder = "*.*"; //$NON-NLS-0$
			lib.empty(this._fileNamePatternsHint);
			this._fileNamePatternsHint.appendChild(document.createTextNode(messages["(* = any string, ? = any character)"])); //$NON-NLS-0$
			
			this._fileNamePatternsTextInput.addEventListener("focus", function(){ //$NON-NLS-0$
				this._fileNamePatternsHint.classList.add("fileNamePatternsHintVisible"); //$NON-NLS-0$
			}.bind(this));
			
			this._fileNamePatternsTextInput.addEventListener("blur", function(){ //$NON-NLS-0$
				this._correctFileNamePatternsInputValue();
				this._fileNamePatternsHint.classList.remove("fileNamePatternsHintVisible"); //$NON-NLS-0$
			}.bind(this));
			
			this._fileNamePatternsTextInput.addEventListener("keydown", function(e) { //$NON-NLS-0$
				var keyCode= e.charCode || e.keyCode;
				// Execute search if user hits Enter
				if (keyCode === lib.KEY.ENTER) {
					this._fileNamePatternsTextInput.blur();
					if (this._replaceBoxIsHidden()) {
						this._submitSearch();
					} else {
						this._replacePreview();
					}
				} 
			}.bind(this));
	    },
	    
		_initControls: function(){
			this._initSearchBox();
			this._initReplaceBox();
			this._initFileNamePatternsBox();
			
			this._caseSensitiveCB = lib.$("#advSearchCaseSensitive", this._parentNode); //$NON-NLS-0$
			this._regExCB = lib.$("#advSearchRegEx", this._parentNode); //$NON-NLS-0$
			this._toggleReplaceLink = lib.$("#toggleReplaceLink", this._parentNode); //$NON-NLS-0$
			
			this._toggleSearchOptionsLink = lib.$("#toggleSearchOptionsLink", this._parentNode); //$NON-NLS-0$
			this._toggleSearchOptionsLink.addEventListener("click", this.showSearchOptions.bind(this)); //$NON-NLS-0$
			this._toggleSearchOptionsLink.innerHTML = messages["Modify Search Parameters"]; //$NON-NLS-0$

			if (this._replaceBoxIsHidden()) {
	        	this._toggleReplaceLink.innerHTML = messages["Show Replace"]; //$NON-NLS-0$	
	        }
	        this._toggleReplaceLink.addEventListener("click", this._toggleReplaceFieldVisibility.bind(this)); //$NON-NLS-0$
	        
	        this._initSearchScope();
		},
		
		_initHTMLLabels: function(){
			this._replaceCompareTitleDiv.innerHTML = messages["Preview: "]; //$NON-NLS-0$
			document.getElementById("advSearchCaseSensitiveLabel").appendChild(document.createTextNode(messages["Case sensitive"])); //$NON-NLS-1$ //$NON-NLS-0$
			document.getElementById("advSearchRegExLabel").appendChild(document.createTextNode(messages["Regular expression"])); //$NON-NLS-1$ //$NON-NLS-0$
			document.getElementById("searchScopeLabel").appendChild(document.createTextNode(messages["Scope"])); //$NON-NLS-1$ //$NON-NLS-0$
			document.getElementById("fileNamePatternsLabel").appendChild(document.createTextNode(messages["File name patterns (comma-separated)"])); //$NON-NLS-1$ //$NON-NLS-0$
			document.getElementById("searchScopeSelectButton").title = messages["Choose a Folder"]; //$NON-NLS-1$ //$NON-NLS-0$
		},
		
		setSearchScope: function(targetFolder) {
			if (targetFolder && targetFolder.fileMetadata) {
				targetFolder = targetFolder.fileMetadata;
			}
			
			if (targetFolder && (targetFolder.Path || targetFolder.Location)) {
				var location = targetFolder.Path || targetFolder.Location;
				this._searchLocations = [location];
			} else {
				this._searchLocations = [this._rootURL];
			}
			
			if (targetFolder.Location) {
				this._searcher.setLocationByMetaData(targetFolder);
			} else {
				this._searcher.setLocationbyURL(this._searchLocations[0]);
			}
			
			this._displaySelectedSearchScope();
		},
		
		_initSearchScope: function() {
			this._rootURL = this._fileClient.fileServiceRootURL();
			this._searchLocations = [this._rootURL];
			
			this._searchScopeElementWrapper = lib.$("#searchScopeElementWrapper", this._searchOptWrapperDiv); //$NON-NLS-0$
			this._searchScopeSelectButton = lib.$("#searchScopeSelectButton", this._searchOptWrapperDiv); //$NON-NLS-0$
			
			this._searchScopeSelectButton.addEventListener("click", function(){ //$NON-NLS-0$
				var searchScopeDialog = new DirectoryPrompterDialog.DirectoryPrompterDialog({
					title: messages["Choose a Folder"], //$NON-NLS-0$
					serviceRegistry: this._serviceRegistry,
					fileClient: this._fileClient,				
					func: this.setSearchScope.bind(this)
				});
				searchScopeDialog.show();
			}.bind(this));
		},
		
		_replaceBoxIsHidden: function() {
			return this._replaceWrapper.classList.contains("replaceWrapperHidden"); //$NON-NLS-0$
		},
		
		searchOptionsVisible: function() {
			return !this._searchWrapper.classList.contains("searchOptionsHidden"); //$NON-NLS-0$
		},
		
		_toggleReplaceFieldVisibility: function () {
			if (this._replaceBoxIsHidden()) {
				this._showReplaceField();
			} else {
				this._hideReplaceField();
			}
			this._searchResultExplorer.initCommands();
		},
		
		showSearchOptions: function() {
			this._searchWrapper.classList.remove("searchOptionsHidden"); //$NON-NLS-0$
			this._toggleSearchOptionsLink.classList.add("linkHidden"); //$NON-NLS-0$
		},
		
		_hideSearchOptions: function() {
			this._searchWrapper.classList.add("searchOptionsHidden"); //$NON-NLS-0$
			this._toggleSearchOptionsLink.classList.remove("linkHidden"); //$NON-NLS-0$
		},
		
		_showReplaceField: function() {
			this._searchBox.hideButton();
			this._replaceWrapper.classList.remove("replaceWrapperHidden"); //$NON-NLS-0$
			this._searchWrapper.classList.add("replaceModeActive"); //$NON-NLS-0$
			this._toggleReplaceLink.innerHTML = messages["Hide Replace"]; //$NON-NLS-0$
			this._showReplacePreview();
		},
		
		_hideReplaceField: function() {
			this._searchBox.showButton();
			this._replaceWrapper.classList.add("replaceWrapperHidden"); //$NON-NLS-0$
			this._searchWrapper.classList.remove("replaceModeActive"); //$NON-NLS-0$
			this._toggleReplaceLink.innerHTML = messages["Show Replace"]; //$NON-NLS-0$
			this._hideReplacePreview();
		},
		
		_showReplacePreview: function() {
			this._replaceCompareTitleDiv.classList.add("replaceCompareTitleDivVisible"); //$NON-NLS-0$
			this._replaceCompareDiv.classList.add("replaceCompareDivVisible"); //$NON-NLS-0$
		},
		
		_hideReplacePreview: function() {
			this._replaceCompareTitleDiv.classList.remove("replaceCompareTitleDivVisible"); //$NON-NLS-0$
			this._replaceCompareDiv.classList.remove("replaceCompareDivVisible"); //$NON-NLS-0$
		},
		
		_displaySelectedSearchScope: function() {
			var scopeElementWrapper = this._searchScopeElementWrapper;
			lib.empty(scopeElementWrapper);
			
			this._searchLocations.forEach(function(searchLocation){
				var decodedLocation = decodeURI(searchLocation);
				var scopeString = decodedLocation;
				var rootName = this._fileClient.fileServiceRootURL(scopeString);
				if (rootName === searchLocation) {
					//replace location string with file system name
					scopeString = this._fileClient.fileServiceName(scopeString);
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
		},
		
		_correctFileNamePatternsInputValue: function() {
			var inputValue = this._fileNamePatternsBox.getTextInputValue();
			if (inputValue) {
				var correctedPatternArray = mSearchUtils.getFileNamePatternsArray(inputValue);
				this._fileNamePatternsBox.setTextInputValue(correctedPatternArray.join(", ")); //$NON-NLS-0$
			}
		},
		
		getSearchResultsTitleDiv: function() {
			return this._searchResultsTitle;
		},
		
		getReplaceCompareTitleDiv: function() {
			return this._replaceCompareTitleDiv;
		},
		
		getReplaceCompareDiv: function() {
			return this._replaceCompareDiv;
		}
	});

	return InlineSearchPane;
});
