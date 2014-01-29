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
	
	function addMenuItem( className, link ){
		
		var anchor = lib.node( this.LIST_ANCHOR_ID );		
		
		var listItem = document.createElement( 'li' );
		listItem.className = 'sideMenuItem';
		
		var pageLink = document.createElement( 'a' );
		pageLink.href = link;
		pageLink.className = className + ' inactive'; 
		pageLink.iconClass = className;
		
		listItem.appendChild( pageLink );
		anchor.appendChild( listItem );
		
		this.menuitems.push( pageLink );
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
		
		if( sideMenuNavigation ){
			
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
			
		var sideToolBar = lib.node( "sideMenu" );
		var auxpane = lib.node( "auxpane" );
		var mainToolBar = lib.node( "pageToolbar");
		
		if( sideToolBar ){
			sideToolBar.style.width = sideMenuWidth;
		}
		
		if( auxpane ){
			auxpane.style.left = sideMenuWidth;
		}
		
		if( mainToolBar ){
			mainToolBar.style.paddingLeft = sideMenuWidth;
		}
	};	
		
	function toggleSideMenu(){
			
		var sideMenuWidth = this.SIDE_MENU_OPEN_WIDTH;
		
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
				links[key].sort(compareLinks);
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
			categories.getCategoryIDs().forEach(function(catId) {
				var cat = categories.getCategory(catId);
				_self.addMenuItem(cat.imageClass, "#" + catId);
			});
		},
		_renderLinks: function() {
			this._sort();
			// debug
			var _self = this;
			console.log(" ------- ");
			Object.keys(this.links).forEach(function(catId) {
				console.log(catId + " -> [" + _self.links[catId].map(function(l) { 
					return l.textContent + " (" + l.href + ")";
				}).join(",") + "]");
			});
		}
	});

	function isNotRelatedLink(elem) {
		return !elem.isRelatedLink;
	}

	function compareLinks(element1, element2) {
		return element1.textContent.localeCompare(element2.textContent);
	}

//			sideMenu.addMenuItem( "core-sprite-edit", "http://www.google.com" );
//			sideMenu.addMenuItem( "core-sprite-deploy", "http://www.bbc.co.uk" );
//			sideMenu.setActiveMenuItem( "http://www.bbc.co.uk" );

	return SideMenu;
});

