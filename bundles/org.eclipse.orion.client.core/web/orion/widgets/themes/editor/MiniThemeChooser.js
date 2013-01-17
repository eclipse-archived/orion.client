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

define(['i18n!orion/settings/nls/messages', 'require','orion/widgets/themes/editor/ThemeData','orion/widgets/input/Select'], 
	function(messages, require, ThemeData, Select ) {

		function MiniThemeChooser(preferences, textview){			
			this.preferences = preferences;
			this.textview = textview;
			this.themeData = new ThemeData.ThemeData();
			this.initializeStorage();
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
			var selectedTheme;
			var settings;
			
			var miniChooser = this;
		
			this.preferences.getPreferences(themeInfo.storage, 2).then(function(prefs){ //$NON-NLS-0$
			
				var currentTheme = prefs.get( 'selected' );
				
				if( !currentTheme && !name ){	
					name = themeInfo.defaultTheme;
					var styleset = themeData.getStyles();
					prefs.put( themeInfo.styleset, JSON.stringify(styleset) );
				}
				
				if( name ){
				
					selectedTheme = { 'selected': name };
				
					var styles = prefs.get( 'editorstyles' );
					
					if( styles ){	
						styles = JSON.parse( styles ); 
						
						for( var s in styles ){
						
							if( styles[s].name === name ){
								
								settings = styles[s];
								break;
							}			
						}
					}
		
					prefs.put( 'selected', JSON.stringify(selectedTheme) );
					
					miniChooser.setThemeData( settings );
				}		
			} );
		}
		
		MiniThemeChooser.prototype.selectTheme = selectTheme;
		
		function setThemeData( settings ){
		
			var subcategories;			
			var tv = this.textview;

			this.preferences.getPreferences('/settings', 2).then(function(prefs){
			
				if( settings ){	
					var font = {};		
					font.label = 'Font';
					font.data = [	{ label:'Family', value: 'Sans Serif', ui:'Font' }, 
									{ label:'Size', value: settings.fontSize.value, ui:'Font' }, 
									{ label:'Color', value: settings.text.value }, 
									{ label:'Background', value: settings.background.value } ];
						
					subcategories = [ { element: 'fontFamily', value: 'sans serif' },
									  { element: 'fontSize', value:  settings.fontSize },
							          { element: 'fontWeight', value: 'normal' },
									  { element: 'text', value: settings.text }, 
									  { element: 'background', value: settings.background },
									  { element: 'string', value: settings.string },
									  { element: 'annotationRuler', value: settings.annotationRuler },
									  { element: 'comment', value: settings.comment },
									  { element: 'keyword', value: settings.keyword },
									  { element: 'overviewRuler', value: settings.overviewRuler },
									  { element: 'annotationRuler', value: settings.annotationRuler },
									  { element: 'lineNumber', value: settings.lineNumber },
									  { element: 'currentLine', value: settings.currentLine },
									  { element: 'attribute', value: settings.attribute }
									];
	
					prefs.put( 'JavaScript Editor', JSON.stringify(subcategories) );
					
					if( tv.stylerOptions ){
						tv.stylerOptions._update( subcategories, tv.stylerOptions );
					}	
				}
			} );
		}
		
		MiniThemeChooser.prototype.setThemeData = setThemeData;
		
		function initializeStorage(){
			var builder = this;
			var themeInfo = this.themeData.getThemeStorageInfo();
			var themeData = this.themeData; 
			this.selectTheme();
		}
		
		MiniThemeChooser.prototype.initializeStorage = initializeStorage;
		
		function selectFontSize( size ){
		
			var themeInfo = this.themeData.getThemeStorageInfo();
			
			var tv = this.textview;
		
			this.preferences.getPreferences('/settings', 2).then(function(prefs){
				
				var styles = prefs.get( 'JavaScript Editor' );
				
				if(styles){ 
					styles = JSON.parse( styles ); 
					
					for( var s in styles ){
						if( styles[s].element === 'fontSize' ){
							styles[s].value = size;
							break;
						}
					}
				}
			
				prefs.put( 'JavaScript Editor', JSON.stringify(styles) );
				
				var nodes = document.querySelectorAll( '.userTheme' ); 
				for( var item in nodes ){
					if( nodes[item].style ){
						nodes[item].style.fontSize = size;
					}
				}
				
				nodes = document.querySelectorAll( '.textviewContainer' ); 
				
				for( var item in nodes ){
					if( nodes[item].style ){
						nodes[item].style.fontSize = size;
					}
				}
				
				tv.update( true );
			});
		}
		
		MiniThemeChooser.prototype.selectFontSize = selectFontSize;
		
		function addFontSizePicker(){
		
			var chooser = this;
			
			var currentSize = '10pt';
			
			var themeInfo = this.themeData.getThemeStorageInfo();
			
			this.preferences.getPreferences('/settings', 2).then(function(prefs){
			
				var styles = prefs.get( 'JavaScript Editor' );
				
				if(styles){ 
					styles = JSON.parse( styles ); 
					
					for( var s in styles ){
						if( styles[s].element === 'fontSize' ){
							currentSize = styles[s].value;
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
				
				this.sizeSelect = new Select.Select( options, picker );
				this.sizeSelect.setStorageItem = chooser.selectFontSize.bind(chooser);
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
					selection = { 'selected':'Prospecto' };	
				}
			
				if( styles ){
				
					for( var theme in styles ){
					
						var set = {
							value: styles[theme].name,
							label: styles[theme].name
						};	
						
						if( selection ){	
							if( styles[theme].name === selection.selected ){
								set.selected = true;
							}
						}
						
						options.push(set);
						
						chooser.styles = styles;
					}	
				}
			
				var picker = document.getElementById( 'themepicker' );
				
				this.themeSelect = new Select.Select( options, picker );
				this.themeSelect.setStorageItem = chooser.selectTheme.bind(chooser); 
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