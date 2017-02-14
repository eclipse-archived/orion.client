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
/*eslint-env browser, amd*/
define([
	'orion/objects',
	'orion/webui/littlelib',
	'orion/bidiUtils',
	'text!orion/search/InlineSearchPane.html',
	'orion/inlineSearchResultExplorer',
	'orion/searchUtils',
	'orion/Deferred', 
	'orion/webui/dialogs/DirectoryPrompterDialog',
	'orion/widgets/input/ComboTextInput',
	'i18n!orion/search/nls/messages',
	'orion/webui/Slideout'
], function(
	objects, lib, bidiUtils, InlineSearchPaneTemplate, InlineSearchResultExplorer, 
	mSearchUtils, Deferred, DirectoryPrompterDialog, ComboTextInput, messages, mSlideout
) {
	var SearchAnnoTypes = {};
	SearchAnnoTypes.ANNO_SEARCH_HIT = "orion.annotation.search.hit"; //$NON-NLS-0$
	var SlideoutViewMode = mSlideout.SlideoutViewMode;
	/**
	 * @param {orion.webui.Slideout} slideout
	 * @param {Object} options
	 */
	function InlineSearchPane(slideout, options) {
		SlideoutViewMode.call(this, slideout);
		this._serviceRegistry = options.serviceRegistry;
		this._commandRegistry = options.commandRegistry;
		this._fileClient = options.fileClient;
		this._searcher = options.searcher;
		this._preferences = options.preferences;
		this._inputManager = options.inputManager;
		this._initialize();
	}
	InlineSearchPane.prototype = Object.create(SlideoutViewMode.prototype);
	InlineSearchPane.prototype.constructor = InlineSearchPane;

	objects.mixin(InlineSearchPane.prototype, /** @lends orion.search.InlineSearchPane.prototype */ {
		_initialize: function() {
			this._searchWrapper = document.createElement("div"); //$NON-NLS-0$
			
			this._slideout.getContentNode().appendChild(this._searchWrapper); // temporarily add wrapper node to DOM to get around Safari fussiness
			
			var range = document.createRange();
			range.selectNode(this._slideout.getContentNode());
						
			var domNodeFragment = range.createContextualFragment(InlineSearchPaneTemplate);
			this._searchWrapper.appendChild(domNodeFragment);
			this._searchWrapper.classList.add("searchWrapper"); //$NON-NLS-0$
			
			this._focusOnTextInput = function(){
				this._searchTextInputBox.select();
				this._searchTextInputBox.focus();
			}.bind(this);

			this._replaceWrapper = lib.$(".replaceWrapper", this._searchWrapper); //$NON-NLS-0$
			this._searchOptWrapperDiv = lib.$(".searchOptWrapperDiv", this._searchWrapper); //$NON-NLS-0$
			this._searchResultsTitle = lib.$(".searchResultsTitle", this._searchWrapper); //$NON-NLS-0$
			this._searchResultsWrapperDiv = lib.$(".searchResultsWrapperDiv", this._searchWrapper); //$NON-NLS-0$
			this._searchResultsWrapperDiv.id = "inlineSearchResultsWrapper";
			
			this._replaceCompareTitleDiv = lib.node("replaceCompareTitleDiv"); //$NON-NLS-0$
			this._replaceCompareDiv = lib.node("replaceCompareDiv"); //$NON-NLS-0$

			this._searchResultExplorer = new InlineSearchResultExplorer(this._serviceRegistry, this._commandRegistry, this, this._preferences, this._fileClient, this._searcher);
			
			this._initControls();
			this._initHTMLLabels();
			
			this._slideout.getContentNode().removeChild(this._searchWrapper); // detach wrapper now that initialization is done, see getContentNode().appendChild() call above
			this._inputManager.addEventListener("InputChanged", function(evt) { //$NON-NLS-0$
				if(evt.metadata && !evt.metadata.Directory) {
					this._generateAnnotations(decodeURIComponent(evt.metadata.Location), evt.editor);
				}
			}.bind(this));
		},
		
		isVisible: function() {
			return this._slideout.isVisible() && (this === this._slideout.getCurrentViewMode());
		},
				
		show: function() {
			this.previousDocumentTitle = window.document.title;
			SlideoutViewMode.prototype.show.call(this);
			window.setTimeout(this._focusOnTextInput, 100);
		},
		
		hide: function() {
			if(this._defaultSearchResource){
  				this.setSearchScope(this._defaultSearchResource);//reset search scope when the InlineSearchPane is hide
			}

			if(window.document.title === this.newDocumentTitle){
				window.document.title = this.previousDocumentTitle;
			}
			SlideoutViewMode.prototype.hide.call(this);
			//if(this._filledResult) {
				this._showSearchOptBLocks();	
				this._hideReplaceField();
				this._searchBox.show();
				this._searchBox.enable(true);
				delete this._filledResult;
				lib.empty(lib.node("searchResultsTitle"));
				lib.empty(lib.node("searchPageActions"));
				lib.empty(lib.node("searchPageActionsRight"));
				lib.empty(this._searchResultsWrapperDiv);
			//}
			this.hideReplacePreview();
		},
		
		getWrapperNode: function() {
			return this._searchWrapper;
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
					wholeWord: this._wholeWordCB.checked,
			        regEx: this._regExCB.checked,
					fileNamePatterns: fileNamePatternsArray,
			        resource: resource
			};
		},
		
		search: function(){
			this._searchBox.enable(true);
			this._showSearchOptBLocks();
			this._submitSearch();
		},
		
		_generateAnnotations: function(fileLocation, editor) {
			this._searchResultExplorer.findFileNode(fileLocation).then(function(fileNode) {
				if(fileNode && fileNode.children && editor) {
					var annotationModel = editor.getAnnotationModel();
					annotationModel.removeAnnotations(SearchAnnoTypes.ANNO_SEARCH_HIT);
					fileNode.children.forEach(function(match) {
						match.type = SearchAnnoTypes.ANNO_SEARCH_HIT;
						annotationModel.addAnnotation(match);
					});
				}
			}.bind(this));
		},
		
		_initAnnotations: function() {
			if(this._inputManager && this._inputManager.inputManager) {
				var fMeta = this._inputManager.inputManager.getFileMetadata();
				if(fMeta && !fMeta.Directory) {
					this._generateAnnotations(decodeURIComponent(fMeta.Location), this._inputManager.inputManager.editor);
				}
			}
		},
		
		fillSearchResult: function(searchResult) {
			this._filledResult = searchResult;
			this._showReplaceField();
			this._hideSearchOptBLocks();	
			this._searchResultExplorer.runSearch(searchResult.searchParams, this._searchResultsWrapperDiv, searchResult).then(function() {
				this._initAnnotations();
			}.bind(this));
		},
				
		_submitSearch: function(){
			var options = this.getOptions();
			options.replace = null;
			if(options.keyword){
				this._searchBox.addTextInputValueToRecentEntries();
				this._fileNamePatternsBox.addTextInputValueToRecentEntries();
				var searchParams = mSearchUtils.getSearchParams(this._searcher, options.keyword, options);
				this._searchResultExplorer.runSearch(searchParams, this._searchResultsWrapperDiv).then(function() {
					this._initAnnotations();
				}.bind(this));
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
       			var searchParams;
				if(this._filledResult) {
       				searchParams = mSearchUtils.copySearchParams(this._filledResult.searchParams);
       				searchParams.replace = options.replace;
				} else {
					searchParams = mSearchUtils.getSearchParams(this._searcher, options.keyword, options);
					this._hideSearchOptions();
				}
				this._searchResultExplorer.runSearch(searchParams, this._searchResultsWrapperDiv, this._filledResult);
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
			
			var searchBoxParentNode = lib.$(".searchMainOptionBlock", this._searchWrapper); //$NON-NLS-0$
			
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
			
			this._searchWrapper.addEventListener("keydown", function(e) { //$NON-NLS-0$
				if(e.defaultPrevented){// If the key event was handled by other listeners and preventDefault was set on(e.g. input completion handled ENTER), we do not handle it here
					return;
				}
				var keyCode= e.charCode || e.keyCode;
				if (keyCode === lib.KEY.ENTER && this._searchTextInputBox === e.target) {
					this._searchTextInputBox.blur();
					if (this._replaceBoxIsHidden()) {
						this._submitSearch();
					} else {
						this._replacePreview();
					}
				} else if (keyCode === lib.KEY.ESCAPE) {
					if (this._slideout.getPreviousActiveElement()) {
						if (this._slideout.getPreviousActiveElement() === this._searchTextInputBox) {
							this._searchTextInputBox.blur();
						} else {
							this._slideout.getPreviousActiveElement().focus();
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
			this._fileNamePatternsHint = lib.$(".fileNamePatternsHint", this._searchWrapper); //$NON-NLS-0$
			
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
			
			this._caseSensitiveCB = lib.$("#advSearchCaseSensitive", this._searchWrapper); //$NON-NLS-0$
			this._wholeWordCB = lib.$("#advSearchWholeWord", this._searchWrapper); //$NON-NLS-0$
			this._regExCB = lib.$("#advSearchRegEx", this._searchWrapper); //$NON-NLS-0$
			this._toggleReplaceLink = lib.$("#toggleReplaceLink", this._searchWrapper); //$NON-NLS-0$
			
			this._toggleSearchOptionsLink = lib.$("#toggleSearchOptionsLink", this._searchWrapper); //$NON-NLS-0$
			this._toggleSearchOptionsLink.addEventListener("click", this.showSearchOptions.bind(this)); //$NON-NLS-0$
			this._toggleSearchOptionsLink.textContent = messages["^ Edit Search"]; //$NON-NLS-0$

			if (this._replaceBoxIsHidden()) {
	        	this._toggleReplaceLink.textContent = messages["Show Replace"]; //$NON-NLS-0$	
	        }
	        this._toggleReplaceLink.addEventListener("click", this._toggleReplaceFieldVisibility.bind(this)); //$NON-NLS-0$
	        
	        this._initSearchScope();
		},
		
		_initHTMLLabels: function(){
			this._replaceCompareTitleDiv.textContent = messages["Preview: "]; //$NON-NLS-0$
			lib.$("#advSearchCaseSensitiveLabel", this._searchWrapper).appendChild(document.createTextNode(messages["Case sensitive"])); //$NON-NLS-1$ //$NON-NLS-0$
			lib.$("#advSearchWholeWordLabel", this._searchWrapper).appendChild(document.createTextNode(messages["Whole Word"])); //$NON-NLS-1$ //$NON-NLS-0$
			lib.$("#advSearchRegExLabel", this._searchWrapper).appendChild(document.createTextNode(messages["Regular expression"])); //$NON-NLS-1$ //$NON-NLS-0$
			lib.$("#searchScopeLabel", this._searchWrapper).appendChild(document.createTextNode(messages["Scope"])); //$NON-NLS-1$ //$NON-NLS-0$
			lib.$("#fileNamePatternsLabel", this._searchWrapper).appendChild(document.createTextNode(messages["File name patterns (comma-separated)"])); //$NON-NLS-1$ //$NON-NLS-0$
			lib.$("#searchScopeSelectButton", this._searchWrapper).title = messages["Choose a Folder"]; //$NON-NLS-1$ //$NON-NLS-0$
			lib.$("#advSearchScopeSniffLabel", this._searchWrapper).appendChild(document.createTextNode(messages["Scope Sniff"]));
		},
		
		setSearchScope: function(scope) {
			this._targetFolder = scope;
			var targetFolder = scope;
			if(typeof scope === "string") {
				targetFolder = {Location: scope};
			}
			if (targetFolder && targetFolder.fileMetadata) {
				targetFolder = targetFolder.fileMetadata;
			}
			
			if (targetFolder && (targetFolder.Path || targetFolder.Location)) {
				var location = targetFolder.Path || targetFolder.Location;
				this._searchLocations = [location];
			} else {
				this._searchLocations = [this._rootURL];
			}
			
			if (targetFolder && targetFolder.Location) {
				this._searcher.setLocationByMetaData(targetFolder);
			} else {
				this._searcher.setLocationbyURL(this._searchLocations[0]);
			}
			
			this._displaySelectedSearchScope();
		},
		
		setSearchText: function(str) {
			this._searchBox.setTextInputValue(str);
		},
		
		setCheckBox: function(searchParams) {
			this._caseSensitiveCB.checked = searchParams.caseSensitive ? true : false;
			this._wholeWordCB.checked = searchParams.wholeWord ? true : false;
			this._regExCB.checked = searchParams.regEx ? true : false;
		},
		
		setFileNamePatterns: function(fNamePattern) {
			if(Array.isArray(fNamePattern)) {
				this._fileNamePatternsBox.setTextInputValue(fNamePattern.join(", ")); //$NON-NLS-0$
			} else {
				this._fileNamePatternsBox.setTextInputValue("");
			}
		},
		
		isSearchInAllProjects: function(){
			return localStorage.getItem("/searchScope") === 'true';
		},
		
		setSearchInAllProjectsCheckBox: function(isCheck){
			this._searchScope.checked = isCheck; //$NON-NLS-0$
		},
		
		readyToSwitchScope: function(resource){
			this._readyToSwitchResouce = resource;	
		},
		
		_initSearchScope: function() {
			this._rootURL = this._fileClient.fileServiceRootURL();
			this._searchLocations = [this._rootURL];
			
			this._searchScope = lib.$("#advSearchScopeSniff", this._searchOptWrapperDiv); //$NON-NLS-0$
			this._searchScopeElementWrapper = lib.$("#searchScopeElementWrapper", this._searchOptWrapperDiv); //$NON-NLS-0$
			this._searchScopeSelectButton = lib.$("#searchScopeSelectButton", this._searchOptWrapperDiv); //$NON-NLS-0$
			
			this._searchScopeSelectButton.addEventListener("click", function(){ //$NON-NLS-0$
				var deferred;
				if(typeof this._targetFolder === "string") {
					deferred = this._fileClient.read(this._targetFolder, true);
				} else {
					deferred = new Deferred().resolve(this._targetFolder);
				}
				deferred.then(function(scopeMetadata){
					this._targetFolder = scopeMetadata;
					var searchScopeDialog = new DirectoryPrompterDialog.DirectoryPrompterDialog({
						title: messages["Choose a Folder"], //$NON-NLS-0$
						serviceRegistry: this._serviceRegistry,
						fileClient: this._fileClient,
						targetFolder: scopeMetadata,
						func: this.setSearchScope.bind(this)
					});
					searchScopeDialog.show();
				}.bind(this));
			}.bind(this));
			this._searchScope.addEventListener("change", function(event){
				if(this._searchScope.checked){
					this.setSearchScope(null);	
				}else{
					this.setSearchScope(this._readyToSwitchResouce);				
				}
				localStorage.setItem("/searchScope", this._searchScope.checked);
				while (this._searchScopeElementWrapper.firstChild) {
				    this._searchScopeElementWrapper.removeChild(this._searchScopeElementWrapper.firstChild);
				}
				this._displaySelectedSearchScope();
			}.bind(this), false);
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
			this._searchTextInputBox.focus();
		},
		
		showSearchOptions: function() {
			this._searchWrapper.classList.remove("searchOptionsHidden"); //$NON-NLS-0$
			this._toggleSearchOptionsLink.classList.add("linkHidden"); //$NON-NLS-0$
		},
		
		_hideSearchOptions: function() {
			this._searchWrapper.classList.add("searchOptionsHidden"); //$NON-NLS-0$
			this._toggleSearchOptionsLink.classList.remove("linkHidden"); //$NON-NLS-0$
		},
		
		_showSearchOptBLocks: function() {
			this._searchWrapper.classList.remove("searchOptParamBlockHidden");
		},
		
		_hideSearchOptBLocks: function() {
			this._searchWrapper.classList.add("searchOptParamBlockHidden");
			//this._searchBox.hide();
			this._replaceTextInputBox.focus();
			this._searchBox.enable(false);
		},
		
		_showReplaceField: function() {
			this._searchBox.hideButton();
			this._replaceWrapper.classList.remove("replaceWrapperHidden"); //$NON-NLS-0$
			this._searchWrapper.classList.add("replaceModeActive"); //$NON-NLS-0$
			this._toggleReplaceLink.textContent = messages["Hide Replace"]; //$NON-NLS-0$
		},
		
		_hideReplaceField: function() {
			this._searchBox.showButton();
			this._replaceWrapper.classList.add("replaceWrapperHidden"); //$NON-NLS-0$
			this._searchWrapper.classList.remove("replaceModeActive"); //$NON-NLS-0$
			this._toggleReplaceLink.textContent = messages["Show Replace"]; //$NON-NLS-0$
			this.hideReplacePreview();
		},
		
		showReplacePreview: function() {
			this._replaceCompareTitleDiv.classList.add("replaceCompareTitleDivVisible"); //$NON-NLS-0$
			this._replaceCompareDiv.classList.add("replaceCompareDivVisible"); //$NON-NLS-0$
		},
		
		hideReplacePreview: function() {
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
				if (bidiUtils.isBidiEnabled()) {
					locationElement.dir = bidiUtils.getTextDirection(scopeString);
				}
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
