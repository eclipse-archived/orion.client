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
/*global window console define localStorage*/
/*jslint browser:true*/

define([
	'orion/commands',
	'orion/objects',
	'orion/webui/littlelib'
], function(mCommands, objects, lib) {

	function SideMenu(parentNode){
		if (!parentNode)
			throw new Error("Missing parentNode");
		this.parentNode = lib.node(parentNode);
		this.menuitems = Object.create(null); // Maps category id {String} to menuitem
		this.links = null;
		this.categories = null;

		this.anchor = document.createElement("ul");
		this.anchor.classList.add("sideMenuList");
		if(this.parentNode){
			this.parentNode.appendChild(this.anchor);
		} else {
			console.error("No sideMenu parent node");
		}
	}
	
	SideMenu.prototype.LOCAL_STORAGE_NAME = "sideMenuNavigation";
	SideMenu.prototype.OPEN_STATE = "open";
	SideMenu.prototype.OPEN_OVERLAY_STATE = "openOverlay";
	SideMenu.prototype.CLOSED_STATE = "closed";
	SideMenu.prototype.DEFAULT_STATE = SideMenu.prototype.OPEN_STATE;
	SideMenu.prototype.SIDE_MENU_OPEN_WIDTH = "40px";
	SideMenu.prototype.SIDE_MENU_CLOSED_WIDTH = "0";
	
	function addMenuItem( imageClassName, categoryId /*, link*/ ){
		var anchor = this.anchor;
		
		var listItem = this.createListItem(imageClassName, categoryId);
		
		anchor.appendChild( listItem );
	
		this.menuitems[categoryId] = listItem;
	}

	function setAllMenuItemsInactive(){
		
		this.getMenuItems().forEach( function( item ){
			item.className = item.iconClass + ' inactive';
		} );
	}
	
	function setActiveMenuItem( link ){
		
		this.setAllMenuItemsInactive();
		
		this.getMenuItems().forEach( function( item ){
			if( item.href == link ){
				item.className = item.iconClass + ' active';
			} 
		});
	}
	
	function setSideMenu(){
			
		var sideMenuNavigation = this.getDisplayState();
		
		var parent = this.parentNode;
		
		if( parent ){
			
			parent.classList.remove("sideMenu-openOverlay");
			if( sideMenuNavigation === this.CLOSED_STATE ){
				this.setSideMenuWidth( this.SIDE_MENU_CLOSED_WIDTH );
				parent.style.display = 'none';
			}
			
			if( sideMenuNavigation === this.OPEN_STATE ){
				this.setSideMenuWidth( this.SIDE_MENU_OPEN_WIDTH );
				parent.style.display = 'block';
			}
			
			if( sideMenuNavigation === this.OPEN_OVERLAY_STATE ){
				this.setSideMenuWidth( this.SIDE_MENU_OPEN_WIDTH, true );
				parent.classList.add("sideMenu-openOverlay");
				parent.style.display = 'block';
			}
		}
	}
		
	function setSideMenuWidth( sideMenuWidth, overlay ){
		var pageContent = lib.node( "pageContent" );
		if (pageContent && !overlay) {
			pageContent.style.left = sideMenuWidth;
		}
		var sideToolBar = lib.node( "sideMenu" );
		if( sideToolBar ){
			sideToolBar.style.width = sideMenuWidth;
		}
	};
	
	function setOverlaySideMenu(show) {
		
		var sideMenuNavigation = this.getDisplayState();
		
		var newState = sideMenuNavigation;
		if (show) {
			if( sideMenuNavigation === this.CLOSED_STATE ){
				newState = this.OPEN_OVERLAY_STATE;
			}
		} else {
			if( sideMenuNavigation === this.OPEN_OVERLAY_STATE ){
				newState = this.CLOSED_STATE;
			}
		}

		if (newState === this.DEFAULT_STATE) {
			localStorage.removeItem(this.LOCAL_STORAGE_NAME);
		} else {
			localStorage.setItem(this.LOCAL_STORAGE_NAME, newState);
		}
		
		this.setSideMenu();
	}
		
	function toggleSideMenu(){
			
		var sideMenuNavigation = this.getDisplayState();
		
		var newState;
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
	};
			
	SideMenu.prototype.addMenuItem = addMenuItem;	
	SideMenu.prototype.setAllMenuItemsInactive = setAllMenuItemsInactive;
	SideMenu.prototype.setActiveMenuItem = setActiveMenuItem;
	SideMenu.prototype.setSideMenu = setSideMenu;		
	SideMenu.prototype.setSideMenuWidth = setSideMenuWidth;
	SideMenu.prototype.toggleSideMenu = toggleSideMenu;
	SideMenu.prototype.setOverlaySideMenu = setOverlaySideMenu;

	objects.mixin(SideMenu.prototype, {
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
			var listItem = document.createElement( 'li' );
			listItem.className = imageClassName + " sideMenuItem active";
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
				var linkBin = _self._getLinksBin(commandItem.relatedLink.category);
				var relatedLinkElement = mCommands.createCommandMenuItem(linkHolder, commandItem.command, commandItem.invocation);
				relatedLinkElement.classList.remove("dropdownMenuItem");
				relatedLinkElement.isRelatedLink = true;
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
			// Sort by name within each category
			var links = this.links;
			var catIds = Object.keys(links);
			catIds.forEach(function(key) {
				links[key].sort(compareTextContent);
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
			this.clearMenuItems();
			categories.getCategoryIDs().map(function(catId) {
				return categories.getCategory(catId);
			}).sort(compareCategories).forEach(function(cat) {
				_self.addMenuItem(cat.imageClass, cat.id);
			});
		},
		_renderLinks: function() {
			this._sort();
			var _self = this;
			
			// debug
//			console.log(" ------- ");
//			Object.keys(this.links).forEach(function(catId) {
//				console.log(catId + " -> [" + _self.links[catId].map(function(l) { 
//					return l.textContent + " (" + l.href + ")";
//				}).join(", ") + "]");
//			});

			// Start fresh. This creates menuitems anew
			this._renderCategories();

			// Append link elements to each menu item
			Object.keys(this.menuitems).forEach(function(catId) {
				var menuitem = _self.getMenuItem(catId);
				if (!menuitem)
					return;
				var bin = _self._getLinksBin(catId);
				if (bin.length === 1) {
					var category = _self.categories.getCategory(catId);
					var link = document.createElement("a");
					link.href = bin[0].href;
					link.title = bin[0].textContent;
					link.className = category.imageClass + " active";
					menuitem.classList.remove(category.imageClass);
					menuitem.appendChild(link);
				} else {
					var sideMenuSubMenu = document.createElement('ul');
					sideMenuSubMenu.className="sideMenuSubMenu";
							
					bin.forEach( function( item ){
						
							var sideMenuSubMenuItem = document.createElement('li');	
							sideMenuSubMenuItem.className="sideMenuSubMenuItem";
							
							var sideMenuSubMenuItemLink = document.createElement('a');
							sideMenuSubMenuItemLink.href = item;
							sideMenuSubMenuItemLink.className="sideMenuSubMenuItemLink"
							
							var sideMenuSubMenuItemSpan = document.createElement('span');
							sideMenuSubMenuItemSpan.innerHTML = item.innerHTML;
							sideMenuSubMenuItemSpan.className="sideMenuSubMenuItemSpan";
							
							sideMenuSubMenuItemLink.appendChild( sideMenuSubMenuItemSpan );
							
							sideMenuSubMenuItem.appendChild(sideMenuSubMenuItemLink);
							
							sideMenuSubMenu.appendChild(sideMenuSubMenuItem);
	
					})
						
					menuitem.appendChild(sideMenuSubMenu);
				}
			});
		}
	});

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

	function compareTextContent(element1, element2) {
		return element1.textContent.localeCompare(element2.textContent);
	}

	return SideMenu;
});

