/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *     Andy Clement (vmware) - bug 344614
 *******************************************************************************/
/*jslint browser:true*/
/*global define orion window dojo dijit console*/

define(['i18n!orion/widgets/nls/messages', 'orion/crawler/searchCrawler', 'orion/contentTypes', 'require', 'dojo', 'dijit', 'dijit/Dialog', 'dijit/form/TextBox', 
		'orion/widgets/_OrionDialogMixin', 'text!orion/widgets/templates/OpenResourceDialog.html'], 
		function(messages, mSearchCrawler, mContentTypes, require, dojo, dijit) {
/**
 * Usage: <code>new widgets.OpenResourceDialog(options).show();</code>
 * 
 * @name orion.widgets.OpenResourceDialog
 * @class A dialog that searches for files by name or wildcard.
 * @param {String} [options.title] Text to display in the dialog's titlebar.
 * @param {orion.searchClient.Searcher} options.searcher The searcher to use for displaying results.
 */
var OpenResourceDialog = dojo.declare("orion.widgets.OpenResourceDialog", [dijit.Dialog, orion.widgets._OrionDialogMixin], //$NON-NLS-0$
		/** @lends orion.widgets.OpenResourceDialog.prototype */ {
	widgetsInTemplate : true,
	templateString : dojo.cache('orion', 'widgets/templates/OpenResourceDialog.html'), //$NON-NLS-1$ //$NON-NLS-0$
	
	SEARCH_DELAY: 500,
	timeoutId: null,
	time: null,
	options: null,
	searcher: null,
	searchRenderer: null,
	favService: null,
	
	/** @private */
	constructor : function() {
		this.inherited(arguments);
		this.timeoutId = null;
		this.time = 0;
		this.options = arguments[0];
		this.searcher = this.options && this.options.searcher;
		this.contentTypeService = new mContentTypes.ContentTypeService(this.searcher.registry);
		if (!this.searcher) {
			throw new Error("Missing required argument: searcher"); //$NON-NLS-0$
		}
		this.searcher.setCrawler(null);
		this._forceUseCrawler = false;
		this._searchOnRoot = true;
		this.fileService = this.searcher.getFileService();
		if (!this.fileService) {
			throw new Error(messages['Missing required argument: fileService']);
		}
		this.searchRenderer = this.options && this.options.searchRenderer;
		if (!this.searchRenderer || typeof(this.searchRenderer.makeRenderFunction) !== "function") { //$NON-NLS-0$
			throw new Error(messages['Missing required argument: searchRenderer']);
		}
		this.favService = this.options.favoriteService;
		if (!this.favService) {
			throw new Error(messages['Missing required argument: favService']);
		}
	},
	
	/** @private */
	postMixInProperties : function() {
		this.options.title = this.options.title || messages['Find File Named'];
		this.selectFile = messages['Type the name of a file to open (? = any character, * = any string):'];
		this.searchPlaceHolder = messages['Search'];
		this.inherited(arguments);
	},
	
	/** @private */
	postCreate: function() {
		this.inherited(arguments);
		dojo.connect(this.resourceName, "onChange", this, function(evt) { //$NON-NLS-0$
			this.time = +new Date();
			clearTimeout(this.timeoutId);
			this.timeoutId = setTimeout(dojo.hitch(this, this.checkSearch), 0);
		});
		dojo.connect(this.resourceName, "onKeyPress", this, function(evt) { //$NON-NLS-0$
			if (evt.keyCode === dojo.keys.ENTER && this.results) {
				var links = dojo.query("a", this.results); //$NON-NLS-0$
				if (links.length > 0) {
					window.open(links[0].href);
					this.hide();
				}
			}
		});
		dojo.connect(this,"onKeyPress",this,function(evt) { //$NON-NLS-0$
			var favlinks, links, text, currentFocus, favCurrentSelectionIndex, currentSelectionIndex;
			var incrementFocus = function(currList, index, nextEntry) {
				if (index < currList.length - 1) {
					return currList[index+1];
				} else {
					return nextEntry;
				}
			};
			var decrementFocus = function(currList, index, prevEntry) {
				if (index > 0) {
					return currList[index-1];
				} else {
					return prevEntry;
				}
			};
			
			if (evt.keyCode === dojo.keys.DOWN_ARROW || evt.keyCode === dojo.keys.UP_ARROW) {
				links = dojo.query("a", this.results); //$NON-NLS-0$
				favlinks = dojo.query("a", this.favresults); //$NON-NLS-0$
				currentFocus = dijit.getFocus();
				currentSelectionIndex = links.indexOf(currentFocus.node);
				favCurrentSelectionIndex = favlinks.indexOf(currentFocus.node);
				if (evt.keyCode === dojo.keys.DOWN_ARROW) {
					if (favCurrentSelectionIndex >= 0) {
						dijit.focus(incrementFocus(favlinks, favCurrentSelectionIndex, links.length > 0 ? links[0] : favlinks[0]));
					} else if (currentSelectionIndex >= 0) {
						dijit.focus(incrementFocus(links, currentSelectionIndex, favlinks.length > 0 ? favlinks[0] : links[0]));
					} else if (links.length > 0 || favlinks.length > 0) {
						// coming from the text box
						dijit.focus(incrementFocus(favlinks, -1, links[0]));
					}   
				} else {
					if (favCurrentSelectionIndex >= 0) {
						// jump to text box if index === 0
						text = this.resourceName && this.resourceName.get("textbox"); //$NON-NLS-0$
						dijit.focus(decrementFocus(favlinks, favCurrentSelectionIndex, text));
					} else if (currentSelectionIndex >= 0) {
						// jump to text box if index === 0 and favlinks is empty
						text = this.resourceName && this.resourceName.get("textbox"); //$NON-NLS-0$
						dijit.focus(decrementFocus(links, currentSelectionIndex, favlinks.length > 0 ? favlinks[favlinks.length-1] : text));
					} else if (links.length > 0) {
						// coming from the text box go to end of list
						dijit.focus(links[links.length-1]);
					} else if (favlinks.length > 0) {
						// coming from the text box go to end of list
						dijit.focus(favlinks[favlinks.length-1]);
					}
				}
				dojo.stopEvent(evt);
			}
		});
		dojo.connect(this, "onMouseUp", function(e) { //$NON-NLS-0$
			// WebKit focuses <body> after link is clicked; override that
			e.target.focus();
		});
		this.populateFavorites();
		var self = this;
		setTimeout(function() {
			if(self._forceUseCrawler || !self.fileService.getService(self.searcher.getSearchLocation())["search"]){//$NON-NLS-0$
				var searchLoc = self._searchOnRoot ? self.searcher.getSearchRootLocation() : self.searcher.getChildrenLocation();
				var crawler = new mSearchCrawler.SearchCrawler(self.searcher.registry, self.fileService, "", {searchOnName: true, location: searchLoc}); 
				self.searcher.setCrawler(crawler);
				crawler.buildSkeleton(function(){
													dojo.addClass("crawlingProgress", "progressPane_running_dialog");//$NON-NLS-2$ //$NON-NLS-0$
													dojo.byId("crawlingProgress").title = messages['Building file skeleton...'];
												}, 
									  function(){
													dojo.removeClass("crawlingProgress", "progressPane_running_dialog");//$NON-NLS-2$ //$NON-NLS-0$
													dojo.byId("crawlingProgress").title = "";//$NON-NLS-2$ 
												});
			}
		}, 0);
	},
	
	/** @private kick off initial population of favorites */
	populateFavorites: function() {
		dojo.place("<div>"+messages['Populating favorites&#x2026;']+"</div>", this.favresults, "only"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-0$
		
		// initially, show all favorites
		this.favService.getFavorites().then(this.showFavorites());
		// need to add the listener since favorites may not 
		// have been initialized after first getting the favorites
		this.favService.addEventListener("favoritesChanged", this.showFavorites()); //$NON-NLS-0$
	},
	
	onCancel: function(){
		console.log("cancelled");
	},
	
	/** 
	 * @private 
	 * render the favorites that we have found, if any.
	 * this function wraps another function that does the actual work
	 * we need this so we can have access to the proper scope.
	 */
	showFavorites: function() {
		var that = this;
		return function(event) {
			var favs = event;
			if (favs.navigator) {
				favs = favs.navigator;
			}
			var renderFunction = that.searchRenderer.makeRenderFunction(that.contentTypeService, that.favresults, false, 
					dojo.hitch(that, that.decorateResult), that.showFavoritesImage);
			renderFunction(favs);
			if (favs && favs.length > 0) {
				dojo.place("<hr/>", that.favresults, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			}
		};
	},

	/** @private */
	showFavoritesImage : function(col) {
		var image = new Image();
		dojo.addClass(image, "modelDecorationSprite"); //$NON-NLS-0$
		dojo.addClass(image, "core-sprite-makeFavorite"); //$NON-NLS-0$
		// without an image, chrome will draw a border  (?)
		image.src = require.toUrl("images/none.png"); //$NON-NLS-0$
		image.title = messages['Favorite'];
		col.appendChild(image);
		dojo.style(image, "verticalAlign", "middle"); //$NON-NLS-1$ //$NON-NLS-0$
	},
	
	/** @private */
	checkSearch: function() {
		clearTimeout(this.timeoutId);
		var now = new Date().getTime();
		if ((now - this.time) > this.SEARCH_DELAY) {
			this.time = now;
			this.doSearch();
		} else {
			this.timeoutId = setTimeout(dojo.hitch(this, "checkSearch"), 50); //$NON-NLS-0$
		}
	},
	
	/** @private */
	doSearch: function() {
		var text = this.resourceName && this.resourceName.get("value"); //$NON-NLS-0$

		var showFavs = this.showFavorites();
		// update favorites
		this.favService.queryFavorites(text).then(function(favs) {
			showFavs(favs);
		});

		// don't do a server-side query for an empty text box
		if (text) {
			dojo.place("<div>"+messages['Searching&#x2026;']+"</div>", this.results, "only"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-0$
			// Gives Webkit a chance to show the "Searching" message
			var that = this;
			setTimeout(function() {
				var query = that.searcher.createSearchQuery(null, text, that.searcher._crawler ? false : "NameLower", that._searchOnRoot, that.searcher._crawler ? "" : "NameLower:"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-0$
				var renderFunction = that.searchRenderer.makeRenderFunction(that.contentTypeService, that.results, false, dojo.hitch(that, that.decorateResult));
				that.searcher.search(query, false, renderFunction);
			}, 0);
		}
	},
	
	/** @private */
	decorateResult: function(resultsDiv) {
		var widget = this;
		dojo.query("a", resultsDiv).forEach(function(link) { //$NON-NLS-0$
			dojo.connect(link, "onmouseup", function(evt) { //$NON-NLS-0$
				if (!dojo.mouseButtons.isMiddle(evt) && !dojo.isCopyKey(evt)) {
					widget.hide();
				}
			});
			dojo.connect(link,"onkeyup",widget,function(evt) { //$NON-NLS-0$
				if (evt.keyCode === dojo.keys.ENTER) {
					widget.hide();
				}
			});
		});
	},
	
	/**
	 * Displays the dialog.
	 */
	show: function() {
		this.inherited(arguments);
		this.resourceName.focus();
	},
	
	/** @private */
	onHide: function() {
		clearTimeout(this.timeoutId);
		this.inherited(arguments);
	}
	
});
return OpenResourceDialog;
});
