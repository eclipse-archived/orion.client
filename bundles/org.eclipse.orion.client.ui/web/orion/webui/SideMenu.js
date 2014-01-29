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

	function SideMenu(){
		this.menuitems = new Array();
	}
	
	SideMenu.prototype.LIST_ANCHOR_ID = "sideMenuAnchor";
	SideMenu.prototype.LOCAL_STORAGE_NAME = "sideMenuNavigation";
	SideMenu.prototype.OPEN_STATE = "open";
	SideMenu.prototype.CLOSED_STATE = "closed";
	SideMenu.prototype.SIDE_MENU_OPEN_WIDTH = "40px";
	SideMenu.prototype.SIDE_MENU_CLOSED_WIDTH = "0";
	
	SideMenu.prototype.menuitems = [];
	
	function addMenuItem( imageClassName, categoryId /*, link*/ ){
		
		var anchor = lib.node( this.LIST_ANCHOR_ID );		
		
		var listItem = document.createElement( 'li' );
		listItem.className = imageClassName + " sideMenuItem active";
		listItem.categoryId = categoryId;
		
//		listItem.appendChild( pageLink );
		anchor.appendChild( listItem );
		
//		this.menuitems.push( pageLink );
		this.menuitems.push( listItem );
	}
	
	
	function addSubMenu(){
		
		/* <ul class="sideMenuSubMenu">
						<li class="sideMenuSubMenuItem">
							<a class="sideMenuSubMenuItemLink" href="#">
								<span class="sideMenuSubMenuItemSpan">Product 1</span>
							</a>
						</li>
						<li class="sideMenuSubMenuItem">
							<a class="sideMenuSubMenuItemLink" href="#">
								<span class="sideMenuSubMenuItemSpan">Product 2</span>
							</a>
						</li>
					</ul> */
				
				
		var subMenu = document.createElement( 'ul' );
		subMenu.className = "sideMenuSubMenu";
		
		
	}

	function setAllMenuItemsInactive(){
		
		this.menuitems.forEach( function( item ){
			item.className = item.iconClass + ' inactive';
		} );
	}
	
	function setActiveMenuItem( link ){
		
		this.setAllMenuItemsInactive();
		
		this.menuitems.forEach( function( item ){
			if( item.href == link ){
				item.className = item.iconClass + ' active';
			} 
		});
	}
	
	function setSideMenu(){
			
		var sideMenuNavigation = localStorage.getItem(this.LOCAL_STORAGE_NAME);
		
		var listAnchor = document.getElementById( this.LIST_ANCHOR_ID );
		
		if( sideMenuNavigation && listAnchor ){
			
			if( sideMenuNavigation === this.CLOSED_STATE ){
				this.setSideMenuWidth( this.SIDE_MENU_CLOSED_WIDTH );
				listAnchor.style.display = 'none';
			}
			
			if( sideMenuNavigation === this.OPEN_STATE ){
				this.setSideMenuWidth( this.SIDE_MENU_OPEN_WIDTH );
				listAnchor.style.display = 'list-item';
			}
		}
	}
		
	function setSideMenuWidth( sideMenuWidth ){
		var pageContent = lib.node( "pageContent" );
		if (pageContent) {
			pageContent.style.left = sideMenuWidth;
		}
		var sideToolBar = lib.node( "sideMenu" );
		if( sideToolBar ){
			sideToolBar.style.width = sideMenuWidth;
		}
	};	
		
	function toggleSideMenu(){
			
		var newState = this.OPEN_STATE;
		
		var sideMenuNavigation = localStorage.getItem(this.LOCAL_STORAGE_NAME);
		
		if( sideMenuNavigation ){
			
			/* if this is true, a person has pinned the menu sometime before */
			
			if( sideMenuNavigation === this.OPEN_STATE ){
				newState = this.CLOSED_STATE;	
			}	
		}
		
		localStorage.setItem(this.LOCAL_STORAGE_NAME, newState);
		
		this.setSideMenu();
	};
			
	SideMenu.prototype.addMenuItem = addMenuItem;	
	SideMenu.prototype.setAllMenuItemsInactive = setAllMenuItemsInactive;
	SideMenu.prototype.setActiveMenuItem = setActiveMenuItem;
	SideMenu.prototype.setSideMenu = setSideMenu;		
	SideMenu.prototype.setSideMenuWidth = setSideMenuWidth;
	SideMenu.prototype.toggleSideMenu = toggleSideMenu;

	objects.mixin(SideMenu.prototype, {
		// Should only be called once
		setCategories: function(categories) {
//			console.log("SideMenu got categories: "); console.log(categories);
			this.categories = categories;
			this.links = Object.create(null); // Maps category ID {String} to link DOM elements {Element[]}
			this._renderCategories();
		},
		// Should only be called once
		setPageLinks: function(pagelinks) {
//			console.log("SideMenu got pagelinks: "); console.log(pagelinks);
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
//			console.log("SideMenu got relatedLinks: "); console.log(relatedLinks);
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
			console.log(" ------- ");
			Object.keys(this.links).forEach(function(catId) {
				console.log(catId + " -> [" + _self.links[catId].map(function(l) { 
					return l.textContent + " (" + l.href + ")";
				}).join(",") + "]");
			});
			
			// Set up category hovers
			Object.keys(this.links).forEach(function(catId) {
				var menuitem;
				_self.menuitems.forEach(function(m) {
					if (m.categoryId === catId) {
						menuitem = m;
						return true;
					}
				});
				if (!menuitem)
					return;
				var bin = _self._getLinksBin(catId);
				if (bin.length === 1) {
					// just insert the link directly into menu item
					menuitem.appenChild(bin[0]);
				} else {
					// need hover
					menuitem.onmouseover = function( e ){
						// create a popup
						
						if( !menuitem.subMenu ){
						
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
										
								sideMenuSubMenu.onmouseout = function( e ){
							
									if( menuitem.subMenu ){
										sideMenuSubMenu.parentNode.removeChild( sideMenuSubMenu );
									}
									
								};		
										
							})
							
							menuitem.appendChild(sideMenuSubMenu);
							
							menuitem.subMenu = sideMenuSubMenu;
							
//							sideMenuSubMenu.onmouseout = function( e ){
//								if( menuitem.subMenu ){
//									sideMenuSubMenu.parentNode.removeChild( sideMenuSubMenu );
//								}
//							};		
						}
					
					};
					
					menuitem.onmouseout = function( e ){
						
						if( menuitem.subMenu ){
//							menuitem.subMenu.parentNode.removeChild( menuitem.subMenu);
						}
						
					};
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

