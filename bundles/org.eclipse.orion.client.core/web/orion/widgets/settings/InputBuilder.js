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

/* This InputBuilder widget is a dojo border container with a left and right side. The left is for choosing a 
   category, the right shows the resulting HTML for that category. */

define(['require', 'dojo', 'dijit', 'orion/util', 'orion/commands', "orion/widgets/settings/Select", "orion/widgets/settings/ColorPicker"], function(require, dojo, dijit, mUtil, mCommands) {

	dojo.declare("orion.widgets.settings.InputBuilder", null, {
	
		constructor: function( preferences ){
			this.preferences = preferences;
		},
		
		setStorageItem: function(category, subCategory, element, value, ui) {
		
			this.preferences.getPreferences('/settings', 2).then(function(prefs){

				var subcategories = JSON.parse ( prefs.get( category ) );
	
				for (var sub = 0; sub < subcategories.length; sub++) {
					if (subcategories[sub].label === subCategory) {
						for (var item = 0; item < subcategories[sub].data.length; item++) {
							if (subcategories[sub].data[item].label === element) {
								subcategories[sub].data[item].value = value;
								subcategories[sub].data[item].ui = ui;
								
								prefs.put( category, JSON.stringify(subcategories) );
								
								break;
							}
						}
					}
				}
			});
		},

		getStorageItem: function(category, subCategory, element) {

			var value;
			
			var deferred = new dojo.Deferred();

//			var subcategories = JSON.parse(localStorage.getItem(category));
			
			this.preferences.getPreferences('/settings', 2).then(function(prefs){
					var subcategories = JSON.parse( prefs.get( category ) );
					
					for (var sub = 0; sub < subcategories.length; sub++) {
					if (subcategories[sub].label === subCategory) {
						for (var item = 0; item < subcategories[sub].data.length; item++) {
							if (subcategories[sub].data[item].label === element) {
								value = subcategories[sub].data[item].value;
								deferred.resolve(value);
								break;
							}
						}
					}
				}
			});

			return deferred;
		},

		processInputType: function(category, label, item, node, ui) {
		
			var picker = dojo.create("div", null, node);
			
			var builder = this;

			this.getStorageItem(category, label, item.label).then(
							

			function(setting){
			
				switch (item.input) {

					case "combo":
		
						var options = [];
		
						for (var count = 0; count < item.values.length; count++) {
		
							var comboLabel = item.values[count].label;
		
							var set = {
								value: comboLabel,
								innerHTML: comboLabel
							};		
							
							if (comboLabel === setting) {
								set.selected = 'selected';
							}
		
							options.push(set);
						}
						
						new orion.widgets.settings.Select({ 
							category:category, 
							item:label, 
							element:item.label, 
							ui:ui, 
							options:options,
							setStorageItem: dojo.hitch( builder, 'setStorageItem' )												
						}, picker );
		
						break;
		
					case "color":
		
						new orion.widgets.settings.ColorPicker({
							label: "   ",
							name: item.label,
							category:category,
							item:label,
							setting: setting,
							setStorageItem: dojo.hitch( builder, 'setStorageItem' )
						}, picker);
		
						break;
					}
				});
			} 
		});
});

