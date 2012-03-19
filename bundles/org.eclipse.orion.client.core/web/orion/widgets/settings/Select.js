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
/*global dojo dijit widgets orion  window console define localStorage*/
/*jslint browser:true*/

/* This SettingsContainer widget is a dojo border container with a left and right side. The left is for choosing a 
   category, the right shows the resulting HTML for that category. */

define(['require', 'dojo', 'dijit', 'orion/util', 'orion/commands', 'dijit/form/Select', 'dijit/ColorPalette'], function(require, dojo, dijit, mUtil, mCommands) {

	dojo.declare("orion.widgets.settings.Select", [dijit._Widget, dijit._Templated], {
	
		templateString: '<select data-dojo-attach-point="selection" data-dojo-attach-event="onchange:change"></select>',
		
		// category, item, element, ui - provided on construction
		
		category: null,
		item: null,
		element: null,
		ui: null,
		
		setStorageItem: function(){
			// to be overridden with a choice of function to store the picked color
			console.log( 'ColorPicker setStorageIem' );
		},
		
		change: function(){
		
			var value = this.selection.value;
		
		 	this.setStorageItem( this.category, this.item, this.element, value, this.ui );
		},
		
		postCreate: function(){
			this.inherited( arguments );
			
			var option = 0;
			
			for( option = 0; option < this.options.length; option++ ){
				dojo.create("option", this.options[option], this.selection);
			}
		}	
	});
});

