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

define(['require', 'dojo', 'dijit', 'dijit/form/Select', 'dijit/ColorPalette'], function(require, dojo, dijit) {

	dojo.declare("orion.widgets.settings.Select", [dijit._Widget, dijit._Templated], { //$NON-NLS-0$
	
		templateString: '<select class="setting-control" data-dojo-attach-point="selection" data-dojo-attach-event="onchange:change"></select>', //$NON-NLS-0$
		
		// category, item, element, ui, options - provided on construction
		
		category: null,
		item: null,
		element: null,
		ui: null,
		options: null, // Array of {value, label, selected (optional)}
		
		setStorageItem: function(){
			// to be overridden with a choice of function to store the picked color
		},
		
		getSelected: function(){
			return this.selection.value;
		},

		getSelectedIndex: function() {
			return this.selection.selectedIndex;
		},

		setSelectedIndex: function(index) {
			this.selection.selectedIndex = index;
		},

		change: function(){
		
			var value = this.selection.value;
			
			if( this.category ){
				this.setStorageItem( this.category, this.item, this.element, value, this.ui );
		 	}else{
		 		this.setStorageItem( value );
		 	}
		},
		
		postCreate: function(){
			this.inherited( arguments );
			
			for( var i = 0; i < this.options.length; i++ ){
				var option = this.options[i];
				var data = {value: option.value};
				if (option.selected) {
					data.selected = 'selected'; //$NON-NLS-0$
				}
				var element = dojo.create("option", data, this.selection); //$NON-NLS-0$
				element.textContent = typeof option.label === "string" ? option.label : option.value;
			}
		}	
	});
});

