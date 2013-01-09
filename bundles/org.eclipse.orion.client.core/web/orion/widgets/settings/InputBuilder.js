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
/*global window console define */
/*jslint browser:true*/

define(["orion/objects", "orion/Deferred", "orion/widgets/input/Select", "orion/widgets/input/TextField"],
		function(objects, Deferred, Select, TextField) {

	function InputBuilder(preferences) {
		this.preferences = preferences;
	}
	objects.mixin(InputBuilder.prototype, {
		setStorageItem: function(category, subCategory, element, value, ui) {
		
			this.preferences.getPreferences('/settings', 2).then(function(prefs){ //$NON-NLS-0$

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
			
			var deferred = new Deferred();

//			var subcategories = JSON.parse(localStorage.getItem(category));
			
			this.preferences.getPreferences('/settings', 2).then(function(prefs){ //$NON-NLS-0$
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
		
			var picker = document.createElement("div"); //$NON-NLS-0$
			node.appendChild(picker);
			
			var builder = this;

			this.getStorageItem(category, label, item.label).then(
							

			function(setting){
			
				switch (item.input) {

					case "combo": //$NON-NLS-0$
		
						var options = [];
		
						for (var count = 0; count < item.values.length; count++) {
		
							var comboLabel = item.values[count].label;
		
							var set = {
								value: comboLabel,
								label: comboLabel,
								selected: (comboLabel === setting)
							};		
							
							options.push(set);
						}
						
						new Select({ 
							category:category, 
							item:label, 
							element:item.label, 
							ui:ui, 
							options:options,
							setStorageItem: builder.setStorageItem.bind(builder)
						}, picker );
		
						break;
		
					case "color": //$NON-NLS-0$
		
						throw new Error("Not implemented");
		
						break;
						
						
					case "textfield": //$NON-NLS-0$
					
						var field = new TextField({ 
							category:category, 
							item:label, 
							element:item.label, 
							ui:ui, 
							setStorageItem: builder.setStorageItem.bind(builder)
						}, picker );
						field.show();
					
						break;
						
					case "textstring": //$NON-NLS-0$
					
						break;
					
						
					}
				});
			} 
		});
	return InputBuilder;
});

