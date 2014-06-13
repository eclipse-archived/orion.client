/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global URL*/
/*jslint amd:true browser:true*/

define([
	'orion/commands',
	'orion/webui/littlelib',
	'orion/PageLinks',
	'orion/PageUtil',
	'orion/URITemplate',
	'orion/URL-shim',
	'orion/util'], function(mCommands, lib, PageLinks, PageUtil, URITemplate) {

	var LOCAL_STORAGE_NAME = "sideMenuNavigation";
	var OPEN_STATE = "open";
	var CLOSED_STATE = "closed";
	var DEFAULT_STATE = OPEN_STATE;
	var SIDE_MENU_OPEN_WIDTH = "40px";
	var TRANSITION_DURATION_MS = 301; /* this should always be greater than the duration of the left transition of .content-fixedHeight */

	function SideMenu(parentNode, contentNode) {
		this.parentNode = lib.node(parentNode);
		if (!this.parentNode) {
			throw new Error("Missing parentNode");
		}
		this.contentNode = lib.node(contentNode);

		this.sideMenuList = document.createElement("ul"); //$NON-NLS-0$
		this.sideMenuList.classList.add("sideMenuList"); //$NON-NLS-0$
		this.parentNode.appendChild(this.sideMenuList);

		this.menuitems = Object.create(null); // Maps category id {String} to menuitem
		this.links = null;
		this.categories = null;
	}

	SideMenu.prototype = {
		constructor: SideMenu.prototype.constructor,
		// Should only be called once
		setCategories: function(categories) {
			this.categories = categories;
			this.links = Object.create(null); // Maps category ID {String} to link DOM elements {Element[]}
		},
		// Should only be called once
		setPageLinks: function(pagelinks) {
			this.pagelinks = pagelinks;
			var elements = pagelinks.createLinkElements();
			this.pagelinks.getAllLinks().forEach(function(pagelink, i) {
				var linkElement = elements[i];
				linkElement.source = pagelink;
				var array = this._getLinksBin(pagelink.category);
				array.push(linkElement);
			}.bind(this));
			this._renderLinks();
		},
		/**
		 * Called whenever the page target changes.
		 * @param {Object} relatedLinks
		 * @param {String[]} exclusions List of related link IDs that the page has requested to not be shown.
		 */
		setRelatedLinks: function(relatedLinks, exclusions) {
			// clean out existing related links
			Object.keys(this.links).forEach(function(catId) {
				var linkBin = this._getLinksBin(catId);
				this.links[catId] = linkBin.filter(function(elem) {
					return !elem.isRelatedLink;
				});
			}.bind(this));

			// add new ones
			var linkHolder = document.createDocumentFragment();
			relatedLinks.forEach(function(commandItem) {
				var relatedLink = commandItem.relatedLink;
				var linkBin = this._getLinksBin(relatedLink.category);
				var relatedLinkElement = mCommands.createCommandMenuItem(linkHolder, commandItem.command, commandItem.invocation);
				relatedLinkElement.classList.remove("dropdownMenuItem");
				relatedLinkElement.isRelatedLink = true;
				relatedLinkElement.source = relatedLink;
				linkBin.push(relatedLinkElement);
			}.bind(this));
			this._renderLinks(exclusions);
		},
		render: function() {
			if (this._getDisplayState() === CLOSED_STATE) {
				this.contentNode.style.left = "0"; //$NON-NLS-0$
				if (this._timeout) {
					window.clearTimeout(this._timeout);
					this._timeout = null;
				}
				this._timeout = window.setTimeout(function() {
					this.parentNode.style.display = 'none'; //$NON-NLS-0$
					this._timeout = null;
				}.bind(this), TRANSITION_DURATION_MS);
				this.parentNode.classList.add("animating"); //$NON-NLS-0$
			} else {
				if (this._timeout) {
					window.clearTimeout(this._timeout);
					this._timeout = null;
				}
				this.parentNode.classList.remove("animating"); //$NON-NLS-0$
				this.parentNode.style.display = 'block'; //$NON-NLS-0$
				this.parentNode.style.width = SIDE_MENU_OPEN_WIDTH;
				this.contentNode.style.left = SIDE_MENU_OPEN_WIDTH;
			}
		},
		hide: function() {
			localStorage.setItem(LOCAL_STORAGE_NAME, CLOSED_STATE);
			this.contentNode.style.left = "0"; //$NON-NLS-0$
		},
		toggle: function() {
			// add animation if necessary
			var pageContent = this.contentNode;
			if (pageContent) {
				pageContent.classList.add("content-fixedHeight-animation"); //$NON-NLS-0$
			}

			var newState;
			if (this._getDisplayState() === OPEN_STATE) {
				newState = CLOSED_STATE;
			} else {
				newState = OPEN_STATE;
			}

			if (newState === DEFAULT_STATE) {
				localStorage.removeItem(LOCAL_STORAGE_NAME);
			} else {
				localStorage.setItem(LOCAL_STORAGE_NAME, newState);
			}
			this.render();
		},
		_getDisplayState: function() {
			var state = localStorage.getItem(LOCAL_STORAGE_NAME);
			if (!state) {
				state = DEFAULT_STATE;
			}
			return state;
		},
		_addMenuItem: function(imageClassName, categoryId, isActive) {
			var listItem = document.createElement('li'); //$NON-NLS-0$
			listItem.className = imageClassName;
			listItem.classList.add("sideMenuItem"); //$NON-NLS-0$
			listItem.categoryId = categoryId;
			if (isActive) listItem.classList.add("sideMenuItemActive"); //$NON-NLS-0$

			this.sideMenuList.appendChild(listItem);
			this.menuitems[categoryId] = listItem;
		},
		_clearMenuItems: function() {
			this.menuitems = [];
			lib.empty(this.sideMenuList);
		},
		/** @returns Array where link elements should be pushed for the given category */
		_getLinksBin: function(catId) {
			if (catId) {
				var links = this.links;
				links[catId] = links[catId] || [];
				return links[catId];
			} else {
				// TODO create a default "misc" category instead of ignoring 
				return [];
			}
		},
		_renderCategories: function() {
			var categories = this.categories,
				_self = this;
			var currentURL = new URL(window.location.href),
				pageParams = PageUtil.matchResourceParameters();
			pageParams.OrionHome = PageLinks.getOrionHome();
			var activeCategoryKnown = false;
			this._clearMenuItems();
			categories.getCategoryIDs().map(function(catId) {
				return categories.getCategory(catId);
			}).sort(compareCategories).forEach(function(cat) {
				var catLinks = _self._getLinksBin(cat.id);
				if (!catLinks.length) return; // do not render empty categories

				if (activeCategoryKnown) {
					_self._addMenuItem(cat.imageClass, cat.id, false);
				} else {
					var isActive = catLinks.some(function(link) {
						if (!link.source.uriTemplate) {
							// Should not happen -- every link has a uriTemplate
							return false;
						}
						var uriTemplate = new URITemplate(link.source.uriTemplate);
						var templateURL = new URL(uriTemplate.expand(pageParams), window.location);
						if (samePageURL(templateURL, currentURL)) {
							return (activeCategoryKnown = true);
						}
						return false;
					});
					_self._addMenuItem(cat.imageClass, cat.id, isActive);
				}
			});
		},
		_renderLinks: function(exclusions) {
			exclusions = exclusions || [];

			Object.keys(this.links).forEach(function(key) {
				// Sort the links within this category
				this.links[key].sort(compareLinkElements);
			}.bind(this));

			// Start fresh. This creates menuitems anew
			this._renderCategories();

			var _self = this;
			// Append link elements to each menu item
			Object.keys(this.menuitems).forEach(function(catId) {
				var menuitem = _self.menuitems[catId];
				if (!menuitem) return;
				var bin = _self._getLinksBin(catId).slice();
				bin = bin.filter(function(link) {
					// Don't render links that the page has requested we exclude
					if (exclusions.indexOf(link.source.id) >= 0) return false;
					return true;
				});
				if (!bin.length) {
					// Empty category: can happen if the page has excluded every command in this category
					return;
				}

				// First link becomes the icon link
				menuitem.appendChild(_self._createCategoryElement(catId, menuitem, bin[0]));
			});
		},
		_createCategoryElement: function(catId, menuitem, linkElement) {
			var category = this.categories.getCategory(catId);
			var element = document.createElement("a"); //$NON-NLS-0$
			element.href = linkElement.href;
			element.classList.add("submenu-trigger"); //$NON-NLS-0$
			element.tabIndex = "0"; //$NON-NLS-0$
			element.title = catId;
			if (linkElement.source && (linkElement.source.tooltip || linkElement.source.tooltipKey || linkElement.source.textContent)) {
				element.title = linkElement.source.tooltip || linkElement.source.tooltipKey || linkElement.source.textContent;
			}
			if (category.imageClass) {
				element.classList.add(category.imageClass);
				menuitem.classList.remove(category.imageClass); // remove icon from menuitem; on link instead
			} else if (typeof category.imageDataURI === "string" && category.imageDataURI.indexOf("data:image") === 0) {
				var img = document.createElement("img");
				img.width = "16";
				img.height = "16";
				img.src = category.imageDataURI;
				element.appendChild(img);
			}
			return element;
		}
	};

	// Hack. Compare URLs, ignoring hashes, to determine "equality" as far as this menu is concerned
	function samePageURL(a, b) {
		return a.protocol === b.protocol && a.host === b.host && a.hostname === b.hostname && a.port === b.port && a.pathname === b.pathname && a.search === b.search;
	}

	function compareCategories(c1, c2) {
		var o1 = c1.order;
		var o2 = c2.order;
		if (o1 < o2) return -1;
		else if (o2 < o1) return 1;
		return 0;
	}

	function compareLinkElements(link1, link2) {
		var o1 = link1.source.order;
		var o2 = link2.source.order;
		o1 = typeof o1 === "number" ? o1 : 100;
		o2 = typeof o2 === "number" ? o2 : 100;
		if (o1 === o2) {
			// fall back to text compare
			return link1.textContent.localeCompare(link2.textContent);
		} else if (o1 < o2) return -1;
		return 1;
	}

	return SideMenu;
});