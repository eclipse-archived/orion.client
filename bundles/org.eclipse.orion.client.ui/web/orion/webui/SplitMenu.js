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
/*eslint-env browser, amd*/
/*global URL*/
define(['orion/webui/littlelib'], function(lib) {
		
	function SplitMenuItem( meta ){
        this.description = meta.description;
        this.className = meta.className;
        this.mode = meta.mode;
        this.command = meta.command;
    }
    
    function setCommand( command ){
    	this.command = command;
    }
    
    SplitMenuItem.prototype.setCommand = setCommand;

	function SplitMenu( domId ){   
	    
	    /* Modes */
	    
	    this.MODE_SINGLE = 0;
	    this.MODE_VERTICAL = 1;
	    this.MODE_HORIZONTAL = 2;
	    this.MODE_PIP = 3;
	    
	    this.DESCRIPTION_SINGLE = 'Single Page';
	    this.DESCRIPTION_VERTICAL = 'Vertical Split';
	    this.DESCRIPTION_HORIZONTAL = 'Horizontal Split';
	    this.DESCRIPTION_PIP = 'Picture in Picture';
    
	    this.menuItems = [];
	    
	    this.modes = [ { description: this.DESCRIPTION_SINGLE, className: 'core-sprite-page', mode: this.MODE_SINGLE },
	    			   { description: this.DESCRIPTION_VERTICAL, className: 'core-sprite-vertical', mode: this.MODE_VERTICAL },
	    			   { description: this.DESCRIPTION_HORIZONTAL, className: 'core-sprite-horizontal', mode: this.MODE_HORIZONTAL },
	                   { description: this.DESCRIPTION_PIP, className:'core-sprite-pip', mode: this.MODE_PIP } ];
	    
	    this.chosenMode =  this.MODE_SINGLE;
	    
	    /* Attach menu to anchor */
	    
	    var element = document.getElementById( domId );
	    
	    if( element ){
	    
	        this.anchor = element;
	        
	        var splitMenu = document.createElement( 'div' );
	        splitMenu.className = 'splitMenuBox';
	        
	        this.currentModeElement = document.createElement( 'div' );
	        this.currentModeElement.className = "core-sprite-page chosen";
	        this.currentModeElement.onclick = this.toggleMenu.bind(this);
	        
	        this.selectionTable = document.createElement( 'div' );
	        this.selectionTable.className = 'splitMenuSelectionTable';
	        
	        splitMenu.appendChild( this.currentModeElement );
	        splitMenu.appendChild( this.selectionTable );
	        this.anchor.appendChild( splitMenu );
	    }
	    
	    lib.addAutoDismiss( [this.anchor], this.hideMenu.bind(this) );
	}
	
	function createMenuItem( data ){
	    
	    var item = document.createElement( 'div' );
	    item.className = 'splitMenuSelectionItem';
	    
	    var selectionState = document.createElement( 'div' );
	    selectionState.className = 'splitMenuState';
	    var icon = document.createElement( 'div' );
	    var description = document.createElement( 'div' );
	    description.className = 'splitMenuDescription';
	    
	    icon.className = data.className;
	    description.innerHTML = data.description;
	    
	    if( this.chosenMode === data.mode ){
	        selectionState.className = 'core-sprite-checkmark splitMenuState';   
	    }
	    
	    item.appendChild( selectionState );
	    item.appendChild( icon );
	    item.appendChild( description );
	    
	    item.id = data.mode;
	    
	    item.onclick = this.switchMode.bind( this );
	    
	    return item;
	}
	
	SplitMenu.prototype.createMenuItem = createMenuItem;
	
	function addMenuItem( command ){

		this.modes[command.name].command = command;
	
		this.menuItems[command.name] = new SplitMenuItem( this.modes[command.name] );
		
		while(this.selectionTable.firstChild ){
	    	this.selectionTable.removeChild( this.selectionTable.firstChild );
	    }
		
		this.addMenuItems();
	}
	
	SplitMenu.prototype.addMenuItem = addMenuItem;
	
	
	function addMenuItems(){
	    for( var item in this.menuItems ){
	        this.selectionTable.appendChild( this.createMenuItem(  this.menuItems[item] ) );
	    }
	}
	
	SplitMenu.prototype.addMenuItems = addMenuItems;
	
	function toggleMenu(){
	    
	    if( this.selectionTable.style.visibility === 'visible' ){
	        this.selectionTable.style.visibility = 'collapse';
	    }else{
	        this.selectionTable.style.visibility = 'visible';
	    }
	}
	
	SplitMenu.prototype.toggleMenu = toggleMenu;
	
	
	function hideMenu(){
		if( this.selectionTable.style.visibility === 'visible' ){
	        this.selectionTable.style.visibility = 'collapse';
	    }
	}
	
	SplitMenu.prototype.hideMenu = hideMenu;
	
	function switchMode( mode ){
	    
	    var selection = mode.target.parentNode;
	    
	    if( selection.id ){
	    
	        this.chosenMode = parseInt( selection.id );
	
	        while(this.selectionTable.firstChild ){
	            this.selectionTable.removeChild( this.selectionTable.firstChild );
	        }
	
	        this.addMenuItems();
	
	        this.toggleMenu();
	
	        this.currentModeElement.className = this.menuItems[ this.chosenMode ].className + " chosen";
	        
	        var element = this.menuItems[ this.chosenMode ];
	        
	        element.command.callback({command:element.command});
	    }
	}
	
	SplitMenu.prototype.switchMode = switchMode;
	
	function bindCommand( mode, command ){
		this.menuItems[mode].setCommand = command;
	}
	
	SplitMenu.prototype.bindCommand = bindCommand;

	return SplitMenu;
});