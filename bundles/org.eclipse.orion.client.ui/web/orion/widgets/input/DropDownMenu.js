/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global window console define localStorage*/
/*jslint browser:true*/

define(['orion/objects', 'orion/webui/littlelib'], function(objects, lib) {

	/**
	 * @param {Object[]} param.options Array of {value:Object, label:String, selected:Boolean(optional)}
	 */
	 
	function DropDownMenu( node, body ){

		if( node.nodeType ){
			this.node = node;
		}else{
		
			var nodeById = document.getElementById( node );
	
			if( nodeById.nodeType ){
				this.node = nodeById;
			}else{
				this.node = document.createElement("span");
			}
		}
		
		this.node.innerHTML = this.templateString;
		this.node.title = 'Navigation';
		
		if( body.icon ){
			this.node.className = this.node.className + ' ' + body.icon;
			var centralNavigation = document.getElementById( 'navdropdown' );
			centralNavigation.style.marginTop = '16px';
			this.node.onclick = this.click.bind(this);	
		}else{
		
			if( body.label ){
				var navlabel = document.getElementById( 'navigationlabel' );
				navlabel.textContent = body.label;
				navlabel.onclick = this.click.bind(this);	
			}
			
			if( body.caret ){
				var navArrow = document.getElementById( 'dropDownArrow' );
				navArrow.className = body.caret;
			}
		}
	}
	
	objects.mixin(DropDownMenu.prototype, {
	
		templateString: '<div id="navigationlabel" class="navigationLabel" ></div>' +
						'<span id="dropDownArrow" class="dropDownArrow"></span>' + 
						'<div class="dropDownContainer" id="navdropdown" style="display:none;"></div>',

		click: function() {
		
			var centralNavigation = document.getElementById( 'navdropdown' );
			centralNavigation.style.display = '';
		
			lib.addAutoDismiss([centralNavigation], function() {
				centralNavigation.style.display = 'none'; //$NON-NLS-0$
			});			
		},
		
		addContent: function( content ){
		
			var centralNavigation = document.getElementById( 'navdropdown' );
		
			centralNavigation.innerHTML= content;
		},

		destroy: function() {
			if (this.node) {
				lib.empty(this.node);
				this.node = this.select = null;
			}
		},
		
		coordinates: function(elem) {
		   
		   if (!elem) {
		      return {"x":0,"y":0};
		   }
		   
		   var xy={"x":elem.offsetLeft,"y":elem.offsetTop};
		   var par=getXYpos(elem.offsetParent);
		   
		   for( var key in par ){
		      xy[key]+=par[key];
		   }
		   
		   return xy;
		}
		
	});
	return DropDownMenu;
});
