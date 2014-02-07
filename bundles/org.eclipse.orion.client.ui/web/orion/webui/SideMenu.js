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
/*global console*/
/*jslint amd:true browser:true*/

define([
	'orion/commands',
	'orion/objects',
	'orion/webui/littlelib',
	'orion/PageLinks',
	'orion/URITemplate'
], function(mCommands, objects, lib, PageLinks, URITemplate) {

	function SideMenu(parentNode, contentNode){
		this.parentNode = lib.node(parentNode);
		this.contentNode = lib.node(contentNode);
		if (!this.parentNode) {
			throw new Error("Missing parentNode");
		}
		this.menuitems = Object.create(null); // Maps category id {String} to menuitem
		this.links = null;
		this.categories = null;

		this.anchor = document.createElement("ul");
		this.anchor.classList.add("sideMenuList");
		this.parentNode.appendChild(this.anchor);
	}
	objects.mixin(SideMenu.prototype, {
		LOCAL_STORAGE_NAME: "sideMenuNavigation",
		OPEN_STATE: "open",
		CLOSED_STATE: "closed",
		DEFAULT_STATE: "open",
		SIDE_MENU_OPEN_WIDTH: "40px",
		TRANSITION_DURATION_MS: 301, /* this should always be greater than the duration of the left transition of .content-fixedHeight */
		
		addMenuItem: function( imageClassName, categoryId /*, link*/ ){
			var anchor = this.anchor;
			
			var listItem = this.createListItem(imageClassName, categoryId);
			
			anchor.appendChild( listItem );
		
			this.menuitems[categoryId] = listItem;
		},
//		setAllMenuItemsInactive: function(){
//			this.getMenuItems().forEach( function( item ){
//				item.className = item.iconClass + ' inactive';
//			} );
//		},
//		setActiveMenuItem: function( link ){
//			this.setAllMenuItemsInactive();
//			
//			this.getMenuItems().forEach( function( item ){
//				if( item.href === link ){
//					item.className = item.iconClass + ' active';
//				} 
//			});
//		},
		setSideMenu: function(){
			var sideMenuNavigation = this.getDisplayState();
			
			var parent = this.parentNode;
			
			if( parent ){
				
				if( sideMenuNavigation === this.CLOSED_STATE ){
					this.setPageContentLeft("0"); //$NON-NLS-0$
					if (this._timeout) {
						window.clearTimeout(this._timeout);
						this._timeout = null;
					}
					this._timeout = window.setTimeout(function() {
						parent.style.display = 'none'; //$NON-NLS-0$
					}, this.TRANSITION_DURATION_MS);
				}
				
				if( sideMenuNavigation === this.OPEN_STATE ){
					if (this._timeout) {
						window.clearTimeout(this._timeout);
						this._timeout = null;
					}
					parent.style.display = 'block'; //$NON-NLS-0$
					parent.style.width = this.SIDE_MENU_OPEN_WIDTH;
					this.setPageContentLeft(this.SIDE_MENU_OPEN_WIDTH);
				}
				
			}
		},
		setPageContentLeft: function( left ){
			var pageContent = this.contentNode;
			if (pageContent) {
				pageContent.style.left = left;
			}
		},
		toggleSideMenu: function(){
			var sideMenuNavigation = this.getDisplayState();
			
			var newState;
			
			// add animation if necessary
			var pageContent = this.contentNode;
			if (pageContent) {
				pageContent.classList.add("content-fixedHeight-animation"); //$NON-NLS-0$
			}
			
			if( sideMenuNavigation === this.OPEN_STATE ){
				newState = this.CLOSED_STATE;
			} else {
				newState = this.OPEN_STATE;
			}
	
			if (newState === this.DEFAULT_STATE) {
				localStorage.removeItem(this.LOCAL_STORAGE_NAME);
			} else {
				localStorage.setItem(this.LOCAL_STORAGE_NAME, newState);
			}
			
			this.setSideMenu();
		},
		clearMenuItems: function() {
			this.menuitems = [];
			lib.empty(this.anchor);
		},
		getMenuItems: function() {
			var menuitems = this.menuitems;
			return Object.keys(menuitems).map(function(id) {
				return menuitems[id];
			});
		},
		getMenuItem: function(catId) {
			return this.menuitems[catId];
		},
		getDisplayState: function() {
			var state = localStorage.getItem(this.LOCAL_STORAGE_NAME);
			if (!state) {
				state = this.DEFAULT_STATE;
			}
			return state;
		},
		createListItem: function(imageClassName, categoryId) {
			var listItem = document.createElement( 'li' ); //$NON-NLS-0$
			listItem.className = imageClassName;
			listItem.classList.add("sideMenuItem"); //$NON-NLS-0$
			listItem.categoryId = categoryId;
			return listItem;
		},
		// Should only be called once
		setCategories: function(categories) {
//			console.log("setCategories()"); //console.log(categories);
			this.categories = categories;
			this.links = Object.create(null); // Maps category ID {String} to link DOM elements {Element[]}
		},
		// Should only be called once
		setPageLinks: function(pagelinks) {
//			console.log("setPagelinks())"); //console.log(pagelinks);
			this.pageLinks = pagelinks;

			var _self = this;
			var elements = pagelinks.createLinkElements();
			pagelinks.getAllLinks().forEach(function(pagelink, i) {
				var linkElement = elements[i];
				linkElement.source = pagelink;
				var array = _self._getLinksBin(pagelink.category);
				array.push(linkElement);
			});
			this._renderLinks();
		},
		// Called whenever the page target changes
		setRelatedLinks: function(relatedLinks) {
//			console.log("setRelatedLinks())"); //console.log(relatedLinks);
			this.relatedLinks = relatedLinks;

			var _self = this;
			// clean out existing related links
			Object.keys(this.links).forEach(function(catId) {
				var linkBin = _self._getLinksBin(catId);
				_self.links[catId] = linkBin.filter(isNotRelatedLink);
			});

			// add new ones
			var linkHolder = document.createDocumentFragment();
			relatedLinks.forEach(function(commandItem) {
				var relatedLink = commandItem.relatedLink;
				var linkBin = _self._getLinksBin(relatedLink.category);
				var relatedLinkElement = mCommands.createCommandMenuItem(linkHolder, commandItem.command, commandItem.invocation);
				relatedLinkElement.classList.remove("dropdownMenuItem");
				relatedLinkElement.isRelatedLink = true;
				relatedLinkElement.source = relatedLink;
				linkBin.push(relatedLinkElement);
			});
			this._renderLinks();
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
		_sort: function() {
			var links = this.links;
			var catIds = Object.keys(links);
			catIds.forEach(function(key) {
				// Sort the links within this category
				links[key].sort(compareLinkElements);
			});
			// Remove duplicate links (mutates bin)
			catIds.forEach(function(catId) {
				var bin = links[catId];
				for (var i = bin.length-1; i > 0; i--) {
					var a = bin[i], b = bin[i-1];
					if (a.href === b.href && a.textContent === b.textContent) {
						bin.splice(i, 1);
					}
				}
			});
		},
		_renderCategories: function() {
			var categories = this.categories, _self = this;
			var currentLocation = window.location.href;
			var orionHome = PageLinks.getOrionHome();
			var locationObject = {OrionHome: orionHome};
			this.clearMenuItems();
			categories.getCategoryIDs().map(function(catId) {
				return categories.getCategory(catId);
			}).sort(compareCategories).forEach(function(cat) {
				if (_self._getLinksBin(cat.id).length > 0) { // do not render empty categories
					_self.addMenuItem(cat.imageClass, cat.id);
					
					if (cat.uriTemplate) {
						var uriTemplate = new URITemplate(cat.uriTemplate);
						var expandedHref = uriTemplate.expand(locationObject);
						if (0 === currentLocation.indexOf(expandedHref)) {
							_self.menuitems[cat.id].classList.add("sideMenuItemActive"); //$NON-NLS-0$
							_self._currentActiveCategory = cat;
						}	
					}
				}
			});
		},
		_renderLinks: function() {
			this._sort();

//			debug.call(this);

			// Start fresh. This creates menuitems anew
			this._renderCategories();

			var _self = this;
			// Append link elements to each menu item
			Object.keys(this.menuitems).forEach(function(catId) {
				var menuitem = _self.getMenuItem(catId);
				if (!menuitem)
					return;
				var bin = _self._getLinksBin(catId).slice(), length = bin.length;
				if (!length) {
					// Empty category -- should not happen
					return;
				}
				// If other links are present in this category, we do not render the default link
				if (length > 1) {
					bin = bin.filter(function(link) {
						return !(link.source.default);
					});
				}
				// First link becomes the icon link
				var category = _self.categories.getCategory(catId);
				var link = document.createElement("a");
				link.href = bin[0].href;
				link.className = category.imageClass;
				menuitem.classList.remove(category.imageClass);
				menuitem.appendChild(link);

				// Links go into submenu
				var sideMenuSubMenu = document.createElement('ul');
				sideMenuSubMenu.className="sideMenuSubMenu";
				bin.forEach( function( item ){
					var sideMenuSubMenuItem = document.createElement('li');	
					sideMenuSubMenuItem.className="sideMenuSubMenuItem";
					
					var sideMenuSubMenuItemLink = document.createElement('a');
					sideMenuSubMenuItemLink.href = item;
					sideMenuSubMenuItemLink.className="sideMenuSubMenuItemLink";
					
					var sideMenuSubMenuItemSpan = document.createElement('span');
					sideMenuSubMenuItemSpan.innerHTML = item.innerHTML;
					sideMenuSubMenuItemSpan.className="sideMenuSubMenuItemSpan";
					
					sideMenuSubMenuItemLink.appendChild( sideMenuSubMenuItemSpan );
					
					sideMenuSubMenuItem.appendChild(sideMenuSubMenuItemLink);
					
					sideMenuSubMenu.appendChild(sideMenuSubMenuItem);
				});
				menuitem.appendChild(sideMenuSubMenu);
			});
		}
	});

	function debug() {
		console.log(" ------- ");
		var _self = this;
		Object.keys(this.links).forEach(function(catId) {
			console.log(catId + " -> [" + _self.links[catId].map(function(l) { 
				return l.textContent + " (" + l.href + ")";
			}).join(", ") + "]");
		});
	}

	function isNotRelatedLink(elem) {
		return !elem.isRelatedLink;
	}

	function compareCategories(c1, c2) {
		var o1 = c1.order, o2 = c2.order;
		if (o1 < o2)
			return -1;
		else if (o2 < o1)
			return 1;
		return 0;
	}

	function compareLinkElements(link1, link2) {
		var o1 = link1.source.order, o2 = link2.source.order;
		o1 = typeof o1 === "number" ? o1 : 100;
		o2 = typeof o2 === "number" ? o2 : 100;
		if (o1 === o2) // fall back to text compare
			return link1.textContent.localeCompare(link2.textContent);
		else if (o1 < o2)
			return -1;
		else
			return 1;
	}

	return SideMenu;
});

