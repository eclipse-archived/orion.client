/*******************************************************************************
 * @license
 * Copyright (c) 2016 IBM Corporation and others. 
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
	'text!orion/bookmarkSearch/BookmarkSearchPane.html',
	'orion/Deferred', 
	'orion/webui/dialogs/DirectoryPrompterDialog',
	'orion/widgets/input/ComboTextInput',
	'i18n!orion/search/nls/messages',
	'orion/webui/Slideout'
], function(
	objects, lib, BookmarkSearchPaneTemplate, 
	Deferred, DirectoryPrompterDialog, ComboTextInput, messages, mSlideout
) {
	var SlideoutViewMode = mSlideout.SlideoutViewMode;
	/**
	 * @param {orion.webui.Slideout} slideout
	 * @param {Object} options
	 */
	function BookmarkSearchPane(slideout, options) {
		SlideoutViewMode.call(this, slideout);
		this._serviceRegistry = options.serviceRegistry;
		this._commandRegistry = options.commandRegistry;
		this._fileClient = options.fileClient;
		this._inputManager = options.inputManager;
		this._initialize();
	}
	BookmarkSearchPane.prototype = Object.create(SlideoutViewMode.prototype);
	BookmarkSearchPane.prototype.constructor = BookmarkSearchPane;

	objects.mixin(BookmarkSearchPane.prototype, /** @lends orion.search.InlineSearchPane.prototype */ {
		_initialize: function() {
			this._searchWrapper = document.createElement("div"); //$NON-NLS-0$
			
			this._slideout.getContentNode().appendChild(this._searchWrapper); // temporarily add wrapper node to DOM to get around Safari fussiness
			
			var range = document.createRange();
			range.selectNode(this._slideout.getContentNode());
						
			var domNodeFragment = range.createContextualFragment(BookmarkSearchPaneTemplate);
			this._searchWrapper.appendChild(domNodeFragment);
			this._searchWrapper.classList.add("searchWrapper"); //$NON-NLS-0$

			this._searchTagsFilterDiv = lib.$(".searchTagsFilter", this._searchWrapper); //$NON-NLS-0$
			this._searchTagsListDiv = lib.$(".searchTagsList", this._searchWrapper); //$NON-NLS-0$
			this._selectedbookmarksDiv = lib.$(".selectedboolmarksBlock", this._searchWrapper); //$NON-NLS-0$
			
			this._initControls();
			
			this._inputManager.addEventListener("InputChanged", function(evt) { //$NON-NLS-0$
				if(evt.metadata && !evt.metadata.Directory) {
//					this._generateAnnotations(decodeURIComponent(evt.metadata.Location), evt.editor);
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
			if(window.document.title === this.newDocumentTitle){
				window.document.title = this.previousDocumentTitle;
			}
			SlideoutViewMode.prototype.hide.call(this);
			//if(this._filledResult) {
				this._filterBox.show();
				this._filterBox.enable(true);
				delete this._filledResult; // ?
			//}
		},
		
		getWrapperNode: function() {
			return this._searchWrapper;
		},
			
		_submitFilter: function(filterStr){
			var modifiedFilter = null;
			if (filterStr) {
				var filterFlags = "i"; // case insensitive by default //$NON-NLS-1$
				modifiedFilter = filterStr.replace(/([.+^=!:${}()|\[\]\/\\])/g, "\\$1"); //add start of line character and escape all special characters except * and ? //$NON-NLS-1$
				modifiedFilter = modifiedFilter.replace(/([*?])/g, ".$1");	//convert user input * and ? to .* and .? //$NON-NLS-1$
				
				if (/[A-Z]/.test(modifiedFilter)) {
					//filter contains uppercase letters, perform case sensitive search
					filterFlags = "";	
				}
				modifiedFilter = new RegExp(modifiedFilter, filterFlags);
				this._filterOn(modifiedFilter);
			} else {
				//filter was emptied, expand all
				this._generateProblemsModel(this.totalbookmarks);
			}
		},
		_filterSingle: function(bookmark, modifiedFilter) { 
			return -1 !== bookmark.message.search(modifiedFilter)
		},
		_filterOn :function(modifiedFilter){
			var newbookmarks = this.totalbookmarks.filter(function(bookmark){
				return this._filterSingle(bookmark, modifiedFilter);
			}.bind(this));
			this._generateProblemsModel(newbookmarks);
		},
		_generateProblemsModel:function(){
			
		},
	    _initFilterBox: function(){
			var input = document.createElement("input"); //$NON-NLS-0$
			input.classList.add("problemsFilter"); //$NON-NLS-0$
			input.placeholder = messages["BookmarkFilter"]; //$NON-NLS-0$
			input.type="text"; //$NON-NLS-0$
			input.addEventListener("input", function (e) { //$NON-NLS-0$
				if (this._filterInputTimeout) {
					window.clearTimeout(this._filterInputTimeout);
				}
				var that = this;
				this._filterInputTimeout = window.setTimeout(function(){
					this._submitFilter(input.value);
					that._filterInputTimeout = null;
				}, 400);
			}.bind(this));
			this._searchTagsFilterDiv.appendChild(input);
	    },
	    _initSeletectBookmarkBox: function(){
	    	
	    },
	    _initAllBookmarkBox: function(){
	    	
	    },
		_initControls: function(){
			this._initSeletectBookmarkBox();
			this._initFilterBox();
			this._initAllBookmarkBox();
		},
		
		setFilterText: function(str) {
			this._searchBox.setTextInputValue(str);
		}
		
	});

	return BookmarkSearchPane;
});
