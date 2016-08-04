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
	'i18n!orion/bookmarkSearch/nls/messages',
	'orion/webui/Slideout',
	'orion/bookmarkSearch/BookmarksExplorer'
], function(
	objects, lib, BookmarkSearchPaneTemplate, 
	Deferred, DirectoryPrompterDialog, ComboTextInput, messages, mSlideout,mBookmarksExplorer
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
		this.preferences = options.preferences;
		this.contentTypeRegistry = options.contentTypeRegistry;
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
			this._searchWrapper.classList.add("bookmarks_inner_container"); //$NON-NLS-0$
		
			this._searchBookmarksFilterDiv = lib.$(".searchBookmarksFilter", this._searchWrapper); //$NON-NLS-0$
			this._searchBookmarksActions = lib.$(".searchBookmarksActions", this._searchWrapper); //$NON-NLS-0$
			this._searchBookmarksListDiv = lib.$(".searchBookmarksList", this._searchWrapper); //$NON-NLS-0$
			
			this._initFilterBox();
			this._createCommandsContainer();
			
			this._searchBookmarksListDiv.id = "bookmarkssExplorerParent_id"; //$NON-NLS-0$
			this._searchBookmarksListDiv.classList.add("bookmarksExplorerNodeWrapper"); //$NON-NLS-0$
			this._bookmarksExplorer = new mBookmarksExplorer.BookmarksExplorer({parentId: this._searchBookmarksListDiv.id, serviceRegistry: this._serviceRegistry, commandRegistry: this._commandRegistry, 
																			preferences: this.preferences, contentTypeRegistry: this.contentTypeRegistry, fileClient: this._fileClient});
		
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
			this._filterInput.value = "";
			this._filterInput.style.display = "none";
			this._bookmarksExplorer.validate(function(){
				this._filterInput.style.display = "";
				this._filterInput.select();
			}.bind(this));
		},
		
		hide: function() {
			if(window.document.title === this.newDocumentTitle){
				window.document.title = this.previousDocumentTitle;
			}
			SlideoutViewMode.prototype.hide.call(this);
				delete this._filledResult; 
		},
		
		getWrapperNode: function() {
			return this._searchWrapper;
		},
		_createCommandsContainer: function() {
			var CommandsContainerNodeCore = document.createElement("div"); //$NON-NLS-0$
			CommandsContainerNodeCore.classList.add("bookmarksCommandsContainer"); //$NON-NLS-0$
			this._searchBookmarksActions.appendChild(CommandsContainerNodeCore);
			var CommandsContainerNode = document.createElement("div"); //$NON-NLS-0$
			CommandsContainerNode.id = "bookmarksViewActionsContainerLeft"; //$NON-NLS-0$
			CommandsContainerNode.classList.add("bookmarksCommandsContainerLeft"); //$NON-NLS-0$
			CommandsContainerNode.classList.add("layoutLeft"); //$NON-NLS-0$
			CommandsContainerNodeCore.appendChild(CommandsContainerNode);
			var CommandsContainerNodeRight = document.createElement("div"); //$NON-NLS-0$
			CommandsContainerNodeRight.id = "bookmarksViewActionsContainerRight"; //$NON-NLS-0$
			CommandsContainerNodeRight.classList.add("bookmarksCommandsContainerRight"); //$NON-NLS-0$
			CommandsContainerNodeRight.classList.add("layoutRight"); //$NON-NLS-0$
			CommandsContainerNodeCore.appendChild(CommandsContainerNodeRight);
		},	
	    _initFilterBox: function(){
			var input = document.createElement("input"); //$NON-NLS-0$
			input.classList.add("bookmarksFilter"); //$NON-NLS-0$
			input.placeholder = messages["BookmarkFilter"]; //$NON-NLS-0$
			input.type="text"; //$NON-NLS-0$
			input.addEventListener("input", function (e) { //$NON-NLS-0$
				if (this._filterInputTimeout) {
					window.clearTimeout(this._filterInputTimeout);
				}
				var that = this;
				this._filterInputTimeout = window.setTimeout(function(){
					if (that._bookmarksExplorer) {
						that._bookmarksExplorer.filterBookmarks(input.value);
					}
					that._filterInputTimeout = null;
				}, 400);
			}.bind(this));
			this._searchBookmarksFilterDiv.appendChild(input);
			this._filterInput = input;
	    },
		
		setFilterText: function(str) {
			this._searchBox.setTextInputValue(str);
		}
		
	});

	return BookmarkSearchPane;
});
