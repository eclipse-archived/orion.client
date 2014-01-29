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
	'orion/objects',
	'orion/webui/littlelib'
], function(objects, lib) {

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
		setCategories: function(categoriesInfo) {
			this.categories = categoriesInfo;
			console.log("SideMenu got categories: "); console.log(categoriesInfo);
		},
		setPageLinks: function(pagelinksInfo) {
			this.pageLinks = pagelinksInfo;
			console.log("SideMenu got pagelinks: "); console.log(pagelinksInfo);
		},
		setRelatedLinks: function(relatedLinks) {
			this.relatedLinks = relatedLinks;
			console.log("SideMenu got relatedLinks: "); console.log(relatedLinks);
		}
	});

	return SideMenu;
});

