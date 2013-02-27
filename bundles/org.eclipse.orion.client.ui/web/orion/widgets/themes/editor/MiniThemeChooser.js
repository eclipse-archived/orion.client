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
/*global orion window console define localStorage*/
/*jslint browser:true*/

define(['i18n!orion/settings/nls/messages', 'require','orion/widgets/themes/editor/ThemeData', 'orion/editor/textTheme', 'orion/widgets/input/Select'], 
	function(messages, require, ThemeData, mTextTheme, Select ) {

		function MiniThemeChooser(preferences){			
			this.preferences = preferences;
			this.themeData = new ThemeData.ThemeData();
			this.initializeStorage();
			var miniChooser = this;
			//TODO: Need an abstract class that both setup.js and MiniThemeChooser.js can use to change the settings
			var storageKey = preferences.listenForChangedSettings(function(e) {
				if (e.key === storageKey) {
					miniChooser.selectTheme();
				}
			});
		}
		
		MiniThemeChooser.prototype.template =	'<div id="themeContainer">' +
													'<div id="pickercontainer" style="display:block;">' +
														'<span class="settingsPanelLabel">Theme:</span>' + 
														'<div id="themepicker"></div>' +
													'</div>' +
													'<div id="sizecontainer">' +
														'<span class="settingsPanelLabel">Font Size:</span>' + 
														'<div id="fontsizepicker"></div>' +
													'</div>' +
												'</div>';
												
		function isDescendant(parent, child) {
		     var node = child.parentNode;
		     while (node !== null) {
		         if (node === parent) {
		             return true;
		         }
		         node = node.parentNode;
		     }
		     return false;
		}
		
		MiniThemeChooser.prototype.isDescendant = isDescendant;
												
		function removeSettings( event ){
		
			if( !isDescendant( this.container, event.target ) ){

				this.destroy();
				
				window.removeEventListener( this.listener );

				if( this.container ){
					this.container.parentNode.removeChild( this.container );
					this.container = null;
				}
			}
		}
		
		MiniThemeChooser.prototype.removeSettings = removeSettings;
		
		function onRemove( callback ){
			this.removeCall = callback;
		}
		
		MiniThemeChooser.prototype.onRemove = onRemove;
		
		function appendTo( node ){
		
			this.container = node;
			node.innerHTML = this.template;		
			this.addFontSizePicker();
			this.addThemePicker();		
		}
		
		MiniThemeChooser.prototype.appendTo = appendTo;	
		
		function selectTheme( name ){
			
			var themeInfo = this.themeData.getThemeStorageInfo();
			var themeData = this.themeData;
			var settings;
			
			var miniChooser = this;
		
			this.preferences.getPreferences(themeInfo.storage, 2).then(function(prefs){ //$NON-NLS-0$
				var currentTheme = prefs.get( 'selected' );
				
				if( !currentTheme && !name ){	
					name = themeInfo.defaultTheme;
					var styleset = themeData.getStyles();
					prefs.put( themeInfo.styleset, JSON.stringify(styleset) );
				}
				
				if( currentTheme ){
					currentTheme = JSON.parse ( currentTheme );
				} else {
					currentTheme = {};
					currentTheme[themeInfo.selectedKey] = name;
				}
				
				if( currentTheme && !name ) {
					name = currentTheme[themeInfo.selectedKey];
				}
				
				if( name ){
				
					currentTheme[themeInfo.selectedKey] = name;
				
					var styles = prefs.get(	themeInfo.styleset );
					
					if( styles ){	
						styles = JSON.parse( styles ); 
						
						for( var s in styles ){
						
							if( styles[s].name === name ){
								
								settings = styles[s];
								break;
							}			
						}
					}
					prefs.put( 'selected', JSON.stringify(currentTheme) );
					
					miniChooser.setThemeData( settings );
				}		
			} );
		}
		
		MiniThemeChooser.prototype.selectTheme = selectTheme;
		
		function setThemeData( settings ){
			var theme = mTextTheme.TextTheme.getTheme();
			theme.setThemeClass("userTheme", theme.buildStyleSheet(settings, "userTheme"));
		}
		
		MiniThemeChooser.prototype.setThemeData = setThemeData;
		
		function initializeStorage(){
			this.selectTheme();
		}
		
		MiniThemeChooser.prototype.initializeStorage = initializeStorage;
		
		function selectFontSize( size ){
		
			var themeInfo = this.themeData.getThemeStorageInfo();
			
			var miniChooser = this;
		
			this.preferences.getPreferences(themeInfo.storage, 2).then(function(prefs){
				var styles = prefs.get( themeInfo.styleset );
				var selection = prefs.get( 'selected' );
				if(selection){ selection = JSON.parse( selection ); }
				var settings;
				
				if( styles ){	
					styles = JSON.parse( styles );
					
					for( var s = 0; s < styles.length; s++ ){
						styles[s].fontSize = size;
						if( styles[s].name ===  selection[themeInfo.selectedKey] ){
							settings = styles[s];
						}
						
					}
				}

				prefs.put( themeInfo.styleset , JSON.stringify(styles) );
				
				if( settings ){ 
					miniChooser.setThemeData( settings );
				}
			});
		}
		
		MiniThemeChooser.prototype.selectFontSize = selectFontSize;
		
		function addFontSizePicker(){
		
			var miniChooser = this;
			
			var currentSize = '10pt';
			
			var themeInfo = this.themeData.getThemeStorageInfo();
			
			this.preferences.getPreferences(themeInfo.storage, 2).then(function(prefs){
				var styles = prefs.get( themeInfo.styleset );
				var selection = prefs.get( 'selected' );
				if(selection){ selection = JSON.parse( selection ); }
				if( styles ){	
					styles = JSON.parse( styles );
					for( var s = 0; s < styles.length; s++ ){
						if( styles[s].name ===  selection[themeInfo.selectedKey] ){
							currentSize = styles[s].fontSize;
							break;
						}
					}
				}
				
				var picker = document.getElementById( 'fontsizepicker' );
			
				var options = [];
				
				for( var size = 8; size < 19; size++ ){
						
					var set = {
						value: size + 'pt',
						label: size + 'pt'
					};	
					
					if( set.label === currentSize ){ set.selected = true; }
					
					this.fontSize = currentSize;
					
					options.push(set);
				}	
				
				this.sizeSelect = new Select( { options: options }, picker );
				this.sizeSelect.setStorageItem = miniChooser.selectFontSize.bind(miniChooser);
				this.sizeSelect.show();
			});
		}
		
		MiniThemeChooser.prototype.addFontSizePicker = addFontSizePicker;
		
		
		function setUpPicker(prefs){ //$NON-NLS-0$
		
			var themeInfo = this.themeData.getThemeStorageInfo();
				
			var options = [];
			
			var chooser = this;

				var selection = prefs.get( 'selected' );
				
				if(selection){ selection = JSON.parse( selection ); }
				
				var styles = prefs.get( themeInfo.styleset );
				
				if(styles){ styles = JSON.parse( styles ); }

				if(!styles){
				
					/* If we're in this condition, then the themes are not in local storage yet.
					   Going to make sure */
				
					styles = chooser.styleset; 
				}
				
				if(!selection) {
					selection = {};	
					selection[themeInfo.selectedKey] = themeInfo.defaultTheme;
				}
			
				if( styles ){
				
					for( var theme= 0; theme < styles.length; theme++ ){
					
						var set = {
							value: styles[theme].name,
							label: styles[theme].name
						};	
						
						if( selection ){	
							if( styles[theme].name === selection[themeInfo.selectedKey] ){
								set.selected = true;
							}
						}
						
						options.push(set);
						
						chooser.styles = styles;
					}	
				}
			
				var picker = document.getElementById( 'themepicker' );
				
				this.themeSelect = new Select( { options: options }, picker );
				this.themeSelect.setStorageItem = chooser.selectTheme.bind(chooser); 
				this.themeSelect.show();
			}
		
		MiniThemeChooser.prototype.setUpPicker = setUpPicker;
				
		function addThemePicker(){
			
			var themeInfo = this.themeData.getThemeStorageInfo();
			
			/* Check to see if the Orion theme is in the themes preferences ... if it is, 
				   then we don't need to populate again, otherwise we do need to populate. */
				   
			var chooser = this;
			
			this.preferences.getPreferences(themeInfo.storage, 2).then( chooser.setUpPicker.bind(chooser) );	
		}
		
		MiniThemeChooser.prototype.addThemePicker = addThemePicker;
		
		function destroy(){}
		
		MiniThemeChooser.prototype.destroy = destroy;

		return{
			MiniThemeChooser:MiniThemeChooser,
			destroy:destroy
		};
	}
);
