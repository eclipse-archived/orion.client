/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
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
	'text!orion/search/InlineSearchPane.html',
	'orion/searchClient',
	'orion/inlineSearchResultExplorer',
	'orion/searchUtils',
	'i18n!orion/search/nls/messages',
	'orion/webui/Slideout'
], function(
	objects, lib, InlineSearchPaneTemplate, mSearchClient, InlineSearchResultExplorer,
	mSearchUtils, messages, mSlideout) {
	/**
	 * @description Creates a new references search pane
	 * @param {orion.webui.Slideout} slideout Theslideout to add to
	 * @param {Object} options The options
	 * @since 10.0
	 */
	function ReferencesSearchPane(slideout, options) {
		this._viewMode = new mSlideout.SlideoutViewMode(slideout);
		this._serviceRegistry = options.serviceRegistry;
		this._commandRegistry = options.commandRegistry;
		this._fileClient = options.fileClient;
		this._preferences = options.preferences;
		this._initialize();
	}

	objects.mixin(ReferencesSearchPane.prototype, /** @lends orion.search.InlineSearchPane.prototype */ {
		/**
		 * @name _initialize
		 * @description Sets up the UI
		 * @function
		 * @private
		 */
		_initialize: function() {
			this._searchWrapper = document.createElement("div"); //$NON-NLS-1$
			this._slideout.getContentNode().appendChild(this._searchWrapper); // temporarily add wrapper node to DOM to get around Safari fussiness
			var range = document.createRange();
			range.selectNode(this._slideout.getContentNode());
			var domNodeFragment = range.createContextualFragment(InlineSearchPaneTemplate);
			this._searchWrapper.appendChild(domNodeFragment);
			this._searchWrapper.classList.add("searchWrapper"); //$NON-NLS-1$
			this._focusOnTextInput = function(){
				this._searchTextInputBox.select();
				this._searchTextInputBox.focus();
			}.bind(this);
			this._searchOptWrapperDiv = lib.$(".searchOptWrapperDiv", this._searchWrapper); //$NON-NLS-1$
			this._searchResultsTitle = lib.$(".searchResultsTitle", this._searchWrapper); //$NON-NLS-1$
			this._searchResultsWrapperDiv = lib.$(".searchResultsWrapperDiv", this._searchWrapper); //$NON-NLS-1$
			this._searchResultsWrapperDiv.id = "inlineSearchResultsWrapper"; //$NON-NLS-1$
			this._searcher = new mSearchClient.Searcher({serviceRegistry: this._serviceRegistry, commandService: this._commandRegistry, fileService: this._fileClient});
			this._searchResultExplorer = new InlineSearchResultExplorer(this._serviceRegistry, this._commandRegistry, this, this._preferences);
			this._initControls();
			this._initHTMLLabels();
			this._slideout.getContentNode().removeChild(this._searchWrapper); // detach wrapper now that initialization is done, see getContentNode().appendChild() call above
		},
		/**
		 * @name isVisible
		 * @description Returnsif the backing slideout is currently visible
		 * @function
		 * @returns {Boolean}If the backing slideout is visible
		 * @callback
		 */
		isVisible: function() {
			return this._slideout.isVisible() && (this === this._slideout.getCurrentViewMode());
		},
		/**
		 * @name show
		 * @description Shows the slideout if not already visible
		 * @function
		 * @callback
		 */
		show: function() {
			this._viewMode.show();
			window.setTimeout(this._focusOnTextInput, 100);
		},

		/**
		 * @name hide
		 * @description Hides the slideoutif not already hidden
		 * @function
		 * @callback
		 */
		hide: function() {
			this._viewMode.hide();
		},
		/**
		 * @name getWrapperNode
		 * @description Returns the wrapping node used for this panel
		 * @function
		 * @callback
		 */
		getWrapperNode: function() {
			return this._searchWrapper;
		},
		/**
		 * @name getOptions
		 * @description Returns the object of options for this panel
		 * @function
		 * @callback
		 */
		getOptions: function(){
			var resource = "";
			this._searchLocations.forEach(function(searchLocation){
				if (resource) {
					resource = resource.concat(",");
				}
				resource = resource.concat(searchLocation);
			}, this);
			return {keyword: this._searchBox.getTextInputValue(),
					rows: 10000,
					start: 0,
					caseSensitive: true,
			        resource: resource
			};
		},
		/**
		 * @name _submitSearch
		 * @description Starts a search
		 * @function
		 * @private
		 */
		_submitSearch: function(){
			var options = this.getOptions();
			if(options.keyword){
				this._searchBox.addTextInputValueToRecentEntries();
				var searchParams = mSearchUtils.getSearchParams(this._searcher, options.keyword, options);
				this._searchResultExplorer.runSearch(searchParams, this._searchResultsWrapperDiv, this._searcher);
				this._hideSearchOptions();
			}
		},
		/**
		 * @name _initControls
		 * @description Initialize all of the controls
		 * @function
		 * @private
		 */
		_initControls: function(){
			this._toggleSearchOptionsLink = lib.$("#toggleSearchOptionsLink", this._searchWrapper); //$NON-NLS-1$
			this._toggleSearchOptionsLink.addEventListener("click", this.showSearchOptions.bind(this));
			this._toggleSearchOptionsLink.innerHTML = messages["^ Edit Search"];
			this._rootURL = this._fileClient.fileServiceRootURL();
			this._searchLocations = [this._rootURL];
			this._searchScopeElementWrapper = lib.$("#searchScopeElementWrapper", this._searchOptWrapperDiv); //$NON-NLS-1$
		},
		/**
		 * @name _initHTMLLabels
		 * @description Initializes all of the HTML labels
		 * @function
		 * @private
		 */
		_initHTMLLabels: function(){
			lib.$("#advSearchCaseSensitiveLabel", this._searchWrapper).appendChild(document.createTextNode(messages["Case sensitive"])); //$NON-NLS-1$
			lib.$("#advSearchRegExLabel", this._searchWrapper).appendChild(document.createTextNode(messages["Regular expression"])); //$NON-NLS-1$
			lib.$("#searchScopeLabel", this._searchWrapper).appendChild(document.createTextNode(messages["Scope"])); //$NON-NLS-1$
			lib.$("#searchScopeSelectButton", this._searchWrapper).title = messages["Choose a Folder"]; //$NON-NLS-1$
		},
		/**
		 * @name setSearchScope
		 * @description Sets thesearch scope - this should also annotateif it is project vs workspace scoped
		 * @function
		 * @param {Object} targetFolder The target folder metadata
		 * @callback
		 */
		setSearchScope: function(targetFolder) {
			if(targetFolder) {
				if (targetFolder.fileMetadata) {
					targetFolder = targetFolder.fileMetadata;
				}
				if (targetFolder.Path || targetFolder.Location) {
					var loc = targetFolder.Path || targetFolder.Location;
					this._searchLocations = [loc];
				} else {
					this._searchLocations = [this._rootURL];
				}
				if (targetFolder.Location) {
					this._searcher.setLocationByMetaData(targetFolder);
				} else {
					this._searcher.setLocationbyURL(this._searchLocations[0]);
				}
			} else {
				this._searchLocations = [this._rootURL];
				this._searcher.setLocationbyURL(this._searchLocations[0]);
			}
			this._displaySelectedSearchScope();
		},
		/**
		 * @name _displaySelectedSearchScope
		 * @description Displays thecurrent search scope
		 * @function
		 * @private
		 */
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

				var locationElement = document.createElement("span"); //$NON-NLS-1$
				locationElement.classList.add("searchScopeElement"); //$NON-NLS-1$

				locationElement.title = decodedLocation;
				scopeElementWrapper.title = decodedLocation;

				locationElement.appendChild(document.createTextNode(scopeString));
				scopeElementWrapper.appendChild(locationElement);
			}, this);
		},
		/**
		 * @name getSearchResultsTitleDiv
		 * @description Reurns the title to use fo r the search results
		 * @function
		 * @returns {String} The title to use for the results section
		 * @callback
		 */
		getSearchResultsTitleDiv: function() {
			return this._searchResultsTitle;
		}
	});

	return ReferencesSearchPane;
});
