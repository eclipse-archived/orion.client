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

define(['i18n!orion/settings/nls/messages', 'require', 'dojo', 'dijit', 'orion/commands', 'orion/globalCommands', 'orion/PageUtil', 'orion/widgets/themes/ThemeComponent', 'orion/widgets/themes/editor/ThemeData'], 
	function(messages, require, dojo, dijit, mCommands, mGlobalCommands, PageUtil, Component, ThemeData ) {

		var TOP = 10;
		var LEFT = 10; 
		var UI_SIZE = 350;
		
		var SELECTED_ZONE = null;
		var OVERVIEW = true;
		var INITIALIZE = true;
		var OUTLINEDATA = false;
		var ARCS = true;
		
		var zones = [];
		var canvas = null; 
		var position;
		var ctx = null;
		
		var over = null;
		var previous;
		var dataset;
		var settings = [];
		
		var colorFieldId;
		
		var fontSize;
		
		function init(){
			SELECTED_ZONE = null;
			INITIALIZE = true;
			ARCS = true;
		
			zones = [];
			canvas = null; 
			position = null;
			ctx = null;
			over = null;
		}
		
		function Family( familyname, familyvalue ){
			this.name = familyname;
			this.value = familyvalue;
		};
		
		var familyname;
		var familyvalue;

		
		Family.prototype.name = familyname;
		Family.prototype.value = familyvalue;
		

		function ThemeBuilder(args){
	
			this.settings = [];
			
			this.themeData = args.themeData;
			
			this.processSettings = this.themeData.processSettings;
		
			init();	
			
			this.commandService = args.commandService;
			this.preferences = args.preferences;
			
			if( args.setFont ){
				
			
			}
					
			this.initializeStorage();
			
			var revertCommand = new mCommands.Command({
				name: 'Cancel',
				tooltip: 'Revert Theme',
				id: "orion.reverttheme", //$NON-NLS-0$
				callback: dojo.hitch(this, function(data){
					this.revert(data.items);
				})
			
			});
			
			var updateCommand = new mCommands.Command({
				name: 'Apply',
				tooltip: 'Apply Theme',
				id: "orion.applytheme", //$NON-NLS-0$
				callback: dojo.hitch(this, function(data){
					this.apply(data.items);
				})
			
			});
			
			var guideCommand = new mCommands.Command({
				name: 'Guide',
				tooltip: 'Check Guide',
				id: "orion.checkGuide", //$NON-NLS-0$
				callback: dojo.hitch(this, function(data){
					this.guide(data.items);
				})
			
			});
			
			this.commandService.addCommand(guideCommand);
			this.commandService.registerCommandContribution('themeCommands', "orion.checkGuide", 1); //$NON-NLS-1$ //$NON-NLS-0$
			
			this.commandService.addCommand(revertCommand);
			this.commandService.registerCommandContribution('themeCommands', "orion.reverttheme", 2); //$NON-NLS-1$ //$NON-NLS-0$
			
			this.commandService.addCommand(updateCommand);
			this.commandService.registerCommandContribution('themeCommands', "orion.applytheme", 3); //$NON-NLS-1$ //$NON-NLS-0$
		}

		function applyColor(){
		
			var newcolor = document.getElementById( this.themebuilder.colorFieldId ).value;
			
			if( this.themebuilder.validateHex( newcolor ) ){
			
				zones[SELECTED_ZONE.id].fill = newcolor;
				this.themebuilder.updateFamily( zones[SELECTED_ZONE.id].family, newcolor );
				OVERVIEW = false;
				this.themebuilder.refresh();
				zones[SELECTED_ZONE.id].glow( UI_SIZE, TOP );
				this.themebuilder.drawPicker( ctx, zones[SELECTED_ZONE.id] );
				
				dojo.byId( 'pickercontainer' ).style.display = 'none';
				dojo.byId( 'savecontainer' ).style.display = '';
				dojo.byId( 'stringcontainer' ).style.display = '';
			
				console.log( 'apply color' );
			}
		}
		
		ThemeBuilder.prototype.fontSize = fontSize;

		ThemeBuilder.prototype.applyColor = applyColor;
		
		ThemeBuilder.prototype.colorFieldId = colorFieldId;
		
		ThemeBuilder.prototype.settings = settings;
		
		var AUTONAME = false;
		
		ThemeBuilder.prototype.AUTONAME = AUTONAME;

		
		ThemeBuilder.prototype.template =	'<div id="themeContainer">' +
												'<div class="sectionWrapper toolComposite">' +
													'<div id="General" class="sectionAnchor sectionTitle layoutLeft">Theme Builder</div>' +
													'<div id="commandButtons">' +
														'<div id="revertCommands" class="layoutRight sectionActions"></div>' +
														'<div id="userCommands" class="layoutRight sectionActions"></div>' +
													'</div>' +
												'</div>' +
												'<canvas id="orionui" width="800" height="380"></canvas>' +
												'<div id="sizecontainer" style="display:none;">' +
													'<span class="settingsLabel">Font Size:</span>' + 
													'<div id="fontsizepicker"></div>' +
												'</div>' +
												/* FOR FONT FAMILY - ROUGHING THIS IN '<div id="familycontainer" style="display:block;">' +
													'<span class="settingsLabel">Font Family:</span>' + 
													'<div id="familypicker"></div>' +
												'</div>' + */
												'<div id="pickercontainer" style="display:block;">' +
													'<span class="settingsLabel">Chosen Theme:</span>' + 
													'<div id="themepicker"></div>' +
												'</div>' +
												'<br>' +
												'<div id="savecontainer" style="display:none;">' +
													'<span class="settingsLabel">New theme name:</span>' + 
													'<div id="themesaver"></div>' +
												'</div>' +
												'<div id="stringcontainer" style="position:absolute;left:425px;top:360px;display:none;">' +
														'<span>OR HEX: </span>' + 
														'<div id="colorstring"></div>' +
														'<button class = "commandButton" style="padding:5px;font-size:9pt;"type="button" id="colorButton"}">ok</button>' + 
												'</div>' +
											'</div>';
		
		var colornames = [["white", "seashell", "cornsilk", "lemonchiffon","lightyellow", "palegreen", "paleturquoise", "aliceblue", "lavender", "plum"],
						 ["lightgray", "pink", "bisque", "moccasin", "khaki", "lightgreen", "lightseagreen", "lightcyan", "cornflowerblue", "violet"],
						 ["silver", "lightcoral", "sandybrown", "orange", "palegoldenrod", "chartreuse", "mediumturquoise",	"skyblue", "mediumslateblue","orchid"],
						 ["gray", "red", "orangered", "darkorange", "yellow", "limegreen","darkseagreen", "royalblue", "slateblue", "mediumorchid"],
						 ["dimgray", "crimson",	"chocolate", "coral", "gold", "forestgreen", "seagreen", "blue", "blueviolet", "darkorchid"],
						 ["darkslategray","firebrick","saddlebrown", "sienna", "olive", "green", "darkcyan", "mediumblue","darkslateblue", "darkmagenta" ],
						 ["black", "darkred", "maroon", "brown", "darkolivegreen", "darkgreen", "midnightblue", "navy", "indigo","purple"]];

		ThemeBuilder.prototype.colornames = colornames;
		
		
		function initializeStorage(){
		
			var builder = this;
			
			var themeInfo = this.themeData.getThemeStorageInfo();
			var themeData = this.themeData; 
		
			this.preferences.getPreferences( themeInfo.storage, 2).then(function(prefs){ //$NON-NLS-0$

				/* Check to see if the Orion theme is in the themes preferences ... if it is, 
				   then we don't need to populate again, otherwise we do need to populate. */

				var cat = prefs.get( themeInfo.styleset ); //$NON-NLS-0$
				var selectedTheme = prefs.get( 'selected' );
				if (!cat){
					var styles = themeData.getStyles();
					prefs.put( themeInfo.styleset, JSON.stringify(styles) ); //$NON-NLS-0$
					builder.styleset = styles;
				}
				if (!selectedTheme) {
					selectedTheme = { 'selected': themeInfo.defaultTheme }; //$NON-NLS-0$  //$NON-NLS-1$
					prefs.put( 'selected', JSON.stringify(selectedTheme) );
				}
				builder.addThemePicker();
			} );
		}
		
		ThemeBuilder.prototype.initializeStorage = initializeStorage;
		
		function addAdditionalCommand( commandData ){
		
			var commitMessageParameters = new mCommands.ParametersDescription(
			[new mCommands.CommandParameter('name', 'text', messages['Commit message:'], "", 4)], //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
			 {hasOptionalParameters: false});
		
			var command = new mCommands.Command({
				name: commandData.name,
				tooltip: commandData.tip,
				parameters: commitMessageParameters,
				id: commandData.id, //$NON-NLS-0$
				callback: dojo.hitch(this, function(data){
					commandData.callback(data);
				})
			});
			
			this.commandService.addCommand(command);
			this.commandService.registerCommandContribution('themeCommands', commandData.id, 4); //$NON-NLS-1$ //$NON-NLS-0$
		}
		
		ThemeBuilder.prototype.addAdditionalCommand = addAdditionalCommand;
		
		function validateHex(hexcode){
		
		     var regColorcode = /^(#)?([0-9a-fA-F]{3})([0-9a-fA-F]{3})?$/;
		     
		     var validity = true;
		
		     if( regColorcode.test(hexcode) === false ){
				validity = false;
		     }
		     
		     return validity;
		}
		
		ThemeBuilder.prototype.validateHex = validateHex;
		
		/* MOUSE EVENTS */

		function clear(){
			if( ctx ){
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				var w = canvas.width;
				var h = canvas.height;
				canvas.width = w;
				canvas.height = h;
			}
		}
		
		ThemeBuilder.prototype.clear = clear;
		
		function refresh(){
			this.clear();
			
			if( OUTLINEDATA === true ){
				this.drawOutlineData();
			}
		}
		
		ThemeBuilder.prototype.refresh = refresh;
		
		function getCoordinates( e ){
		
			var x, y;
		
			if( e.pageX !== undefined && e.pageY !== undefined ){
				x = e.pageX;
				y = e.pageY;
		    }
		    else {
				x = e.screenX + document.body.scrollLeft + document.documentElement.scrollLeft;
				y = e.screenY + document.body.scrollTop + document.documentElement.scrollTop;
		    }
		    
		    x -= canvas.offsetLeft -20;
		    y -= canvas.offsetTop -15;
		    
		    x = x - position.x;
		    y = y - position.y;
			
		    return { x: x, y: y };
		}
		
		function mouseMove( e ){
	
			var coordinates = getCoordinates( e );  
			var x = coordinates.x;
			var y = coordinates.y;
			
			over = [];
		
			for( var z = 0; z < zones.length; z++ ){ 	
		
				if( zones[z].mouseOver( x, y ) ){	
					 canvas.style.cursor = 'crosshair';
					 zones[z].id = z;
					 over.push(zones[z]);
					 break;
				}else{
					canvas.style.cursor = '';
				}
			}
		}
		
		function mouseUp( e ){
			canvas.style.cursor = "";
		}
		
		function updateFamily( family, fill ){
			for( var z=0;z<zones.length;z++ ){
				if( zones[z].family ){	
					if( zones[z].family === family ){
						zones[z].fill = fill;
					}
					
					for( var s in this.settings ){	
						if( this.settings[s].name === family ){
							this.settings[s].value = fill;
							break;
						}
					}
				}
			}
		}
		
		ThemeBuilder.prototype.updateFamily = updateFamily;
		
		function drawPicker( ctx, component ){

			var x = UI_SIZE + 40;
			
		    Component.drawText( ctx, component.description.toUpperCase(), LEFT + x, TOP + 10, 'bold 9pt sans-serif', '#333' );
		    Component.drawLine( ctx, LEFT + x, TOP + 20, LEFT + x+190, TOP + 20, 10, '#333' );   
		    Component.drawText( ctx, 'COLOR:', LEFT + x, TOP + 45, '8pt sans-serif', '#333' ); 
		    Component.drawRectangle( ctx, LEFT + x + 80, TOP + 36, 30, 10, component.fill, null );	    
		    Component.drawText( ctx, 'COLOR STRING:  ', LEFT + x, TOP + 65, '8pt sans-serif', '#333' );    
		    Component.drawText( ctx, '  ' + component.fill, LEFT + x + 80, TOP + 65, '8pt sans-serif', '#333' );     
		    Component.drawLine( ctx, LEFT + x, TOP + 20, LEFT + x + 190, TOP + 20, 10, '#333' );       
		    Component.drawLine( ctx, LEFT + x, TOP + 80, LEFT + x + 190, TOP + 80, 5, '#333' );    
		    Component.drawText( ctx, 'NEW COLOR:', LEFT + x, TOP + 105, 'bold 8pt sans-serif', '#333' ); 
		    
		    if( ARCS === true){
			    for( var row = 0; row < 7; row ++ ){
					for( var column = 1; column < 11; column++ ){
						var item = column-1;
						var arc = Component.drawArc( ctx, LEFT + UI_SIZE + ( column * 20 ) + 25, TOP + 80 + ( row * 20 ) + 50, 7, 0, 2 * Math.PI, false, null, colornames[row][item] );
						arc.paintchip = true;
						zones.push( arc );
					}
				}
				
				ARCS = false;
			}else{	
				for( var z=0; z< zones.length; z++ ){
					if( zones[z].paintchip ){
						zones[z].render();
					}
				}
			}
			
			var stringcontainer = document.getElementById( 'stringcontainer' );
				stringcontainer.style.display = '';
				stringcontainer.zIndex = 1;

				
				var colorstring = document.getElementById( this.colorFieldId );
				
				if( !this.colfld ){
					this.colfld = new orion.widgets.settings.TextField({}, colorstring );
					this.colfld.width( '100px' );
				}
				var colorButton = document.getElementById( 'colorButton' );
				colorButton.themebuilder = this;
				colorButton.onclick = this.applyColor;
		}
		
		ThemeBuilder.prototype.drawPicker = drawPicker;
		
		var colfld;
		ThemeBuilder.prototype.colfld = colfld;
		
		function mouseDown( e ){

			OVERVIEW = false;
		
			var coordinates = getCoordinates( e );
			    
			var x = coordinates.x;
			var y = coordinates.y;
		
			for( var z = 0; z < zones.length; z++ ){	
		
				if( zones[z].mouseOver( x, y ) ){	
					 zones[z].id = z;
					 over = [];
					 this.refresh();
					 over.push(zones[z]);
				}
			}
			
			if( over.length > 0 ){
			
				var smallest = 0;
				
				for( var count = 0; count < over.length; count++ ){
					if( over[count].width < over[smallest].width ){
						smallest = count;
					}
				}
				
				if( over.length > 0 ){ OVERVIEW = true; }else{ OVERVIEW = false; }
				
				switch(  over[smallest].type ){
				
					case 'ELLIPSE':
						zones[SELECTED_ZONE.id].fill = over[smallest].fill;
						this.updateFamily( zones[SELECTED_ZONE.id].family, over[smallest].fill );
						OVERVIEW = false;
						this.refresh();
						zones[SELECTED_ZONE.id].glow( UI_SIZE, TOP );
						this.drawPicker( ctx, zones[SELECTED_ZONE.id] );
						
						dojo.byId( 'pickercontainer' ).style.display = 'none';
						dojo.byId( 'savecontainer' ).style.display = '';
						
						if( this.AUTONAME === false ){
							var currentTheme = dijit.byId( 'themepicker' ).getSelected();
							dijit.byId( 'themesaver' ).setValue( currentTheme );
							this.AUTONAME = true;
						}
						
						break;
						
					case 'RECTANGLE':
					case 'ROUNDRECTANGLE':
					case 'TEXT':
						over[smallest].glow( UI_SIZE, TOP );
						this.drawPicker( ctx, over[smallest] );
						SELECTED_ZONE = over[smallest];
						break;
						
					default:
						break;
				
				}
			}
		}
		
		ThemeBuilder.prototype.mouseDown = mouseDown;
		
		function familyShown( families, family ){

			var shown = false;
			
			if( family ){
				for( var f in families ){
					if( families[f] === family ){
						shown = true;
						break;
					}
				}
			}
		
			return shown;
		}
		
		ThemeBuilder.prototype.familyShown = familyShown;
		
		function overview( ctx, components ){

			var x = UI_SIZE + 40;
			var padding = 6;
			var families = [];
			
			var count = 0;
		
			for( var c = 0; c < components.length; c++ ){
			
				var component = components[c];
				
				if( familyShown( families, component.family ) === false && component.description ){
					
					var labely = TOP + 10 + ( count * 28 );
					
					var originx = component.x-padding + ( component.width + (2*padding) ) * 0.5;
					var originy = ( component.y-padding + ( component.height + (2*padding) )/2 );
					
					ctx.beginPath();
					
					switch( component.family ){
					
						case 'background':
						
							/* This is a hack to stop lines overlapping - ideally this software needs a layout
								routine. Not pleased to do this. */

							ctx.beginPath();
							ctx.moveTo( originx + 70 , labely -4 );
							ctx.lineTo( UI_SIZE + 50, labely -4 );
							ctx.strokeStyle = '#cc0000';
							ctx.lineWidth = 1;
							ctx.stroke();
							
							Component.drawArc( ctx, originx + 70 , labely -4, 3, 0, 2 * Math.PI, false, null, '#cc0000' );

							break;
							
							
						case 'Side':
						
							ctx.beginPath();
							ctx.moveTo( originx + 30 , labely -4 );
							ctx.lineTo( UI_SIZE + 50, labely -4 );
							ctx.strokeStyle = '#cc0000';
							ctx.lineWidth = 1;
							ctx.stroke();
							
							Component.drawArc( ctx, originx + 30 , labely -4, 3, 0, 2 * Math.PI, false, null, '#cc0000' );

							break;
							
						default: 
						
							ctx.moveTo( originx, originy );
							ctx.lineTo( originx, labely -4 );
							ctx.lineTo( UI_SIZE + 50, labely -4 );
							ctx.strokeStyle = '#cc0000';
							ctx.lineWidth = 1;
							ctx.stroke();
							
							Component.drawArc( ctx, originx, originy, 3, 0, 2 * Math.PI, false, null, '#cc0000' );
							
							break;
					}

					ctx.closePath();
					ctx.globalAlpha = 1; 
					
					Component.drawText( ctx, component.description.toUpperCase(), LEFT + 5 + x, labely, 'bold 8pt sans-serif', '#333' );	
					
					if( component.family ){ families.push( component.family ); }
					
					count++;
				}
			}
			
			Component.drawText( ctx, 'CLICK DIAGRAM TO STYLE', LEFT + 5 + x, labely + 50, 'bold 8pt sans-serif', '#cc0000' );
			Component.drawText( ctx, 'PRESS APPLY BUTTON TO', LEFT + 5 + x, labely + 65, 'bold 8pt sans-serif', '#cc0000' );
			Component.drawText( ctx, 'APPLY PREVIEW', LEFT + 5 + x, labely + 80, 'bold 8pt sans-serif', '#cc0000' );
			
			var stringcontainer = document.getElementById( 'stringcontainer' );
				stringcontainer.style.display = 'none';
		}
		
		ThemeBuilder.prototype.overview = overview;
		
		function getCurrentSettings(){
			return this.settings;
		}
		
		ThemeBuilder.prototype.getCurrentSettings = getCurrentSettings;
		
		
		function addData( data ){
		
			this.settings = [];
			
			var defaultValue;
			
			OUTLINEDATA = true;
		
			if( data ){
		
				this.dataset = data;
				
				for( var shapecount =0; shapecount < data.shapes.length; shapecount++ ){
				
					if( data.shapes[shapecount].fill ){ defaultValue = data.shapes[shapecount].fill; }else{ defaultValue = data.shapes[shapecount].line; };
				
					this.settings[data.shapes[shapecount].family] = new Family( data.shapes[shapecount].family, defaultValue );
				}
			}
		}
		
		ThemeBuilder.prototype.addData = addData;
		
		
		function drawShape( shapedata, fillcolor, linecolor ){
		
			var shape;
		
			switch( shapedata.type ){
			
				case 'RECTANGLE':				
					shape = Component.drawRectangle( ctx, shapedata.x, shapedata.y, shapedata.width, shapedata.height, fillcolor, '#CCC' );
					break;
					
				case 'TEXT':
					shape = Component.drawText( ctx, shapedata.label, shapedata.x, shapedata.y, shapedata.font, fillcolor );
					break;			
			
				case 'ROUNDRECTANGLE':
					shape = Component.roundRect( ctx, shapedata.x, shapedata.y, shapedata.width, shapedata.height, 5, fillcolor, '#CCC' );
					break;
					
				case 'LINE':
					Component.drawLine( ctx, shapedata.x1, shapedata.y1, shapedata.x2, shapedata.y2, shapedata.linewidth, fillcolor );
					break;
					
				case 'TRIANGLE':
					Component.drawTriangle( ctx, shapedata.x1 ,shapedata.y1, shapedata.x2, shapedata.y2, shapedata.x3, shapedata.y3, fillcolor );
					break;
					
				case 'IMAGE':
					var img = new Image();  
			
				    img.onload = function(){  
						ctx.drawImage( img, shapedata.x, shapedata.y );  
				    };
				    
				    img.src = shapedata.source; 
			}
			
			if( shape ){
				shape.description = shapedata.name;
				shape.family = shapedata.family;
				
				shape.paintchip = false;
				
				zones.push(shape); 
			}
		}
		
		ThemeBuilder.prototype.drawShape = drawShape;

		function drawOutlineData( data ){
		
			if( data ){ this.addData( data ); }
			
			position = dojo.position( 'themeContainer' );	
	
			if( !canvas ){
				canvas = document.getElementById( 'orionui' );
				ctx = canvas.getContext( '2d' );
				canvas.addEventListener( "mousedown", dojo.hitch( this, 'mouseDown' ), false );	
				canvas.addEventListener( "mousemove", mouseMove, false );
				canvas.addEventListener( "mouseup", mouseUp, false );
			}
			
			if( INITIALIZE === true ){
				
				var orderedShapes = [];
			
//				Array.prototype.sortByElement = function(e){
//				 return this.sort(function(a,b){
//				  if( a[e] && b[e] ){
//				  return (a[e] > b[e]) ? 1 : (a[e] < b[e]) ? -1 : 0;
//				  }else return 1;
//				 });
//				}
//				
//				this.dataset.shapes.sortByElement( 'order' );
			
				for( var item in this.dataset.shapes ){
				
					if( this.settings && this.settings[ this.dataset.shapes[item].family ] ){
						 var color = this.settings[ this.dataset.shapes[item].family ].value;	 
						 if( this.dataset.shapes[item].fill ){  this.dataset.shapes[item].fill = color; }else{ this.dataset.shapes[item].line = color; };
					}				
				
					this.drawShape( this.dataset.shapes[item], this.dataset.shapes[item].fill, this.dataset.shapes[item].line, this.dataset.shapes[item].font );
				}
				
				INITIALIZE = false;
				
			}else{
			
				for( var z in zones ){
					if( !zones[z].paintchip ){ zones[z].render(); }
				}
			}
			
			if( OVERVIEW ){
				overview( ctx, zones );
			}
		}
		
		ThemeBuilder.prototype.drawOutlineData = drawOutlineData;
		
		function processSettings( settings, preferences ){ /* to be provided by ThemeData */ }
		
		ThemeBuilder.prototype.processSettings = processSettings;
		
		function apply(data){
		
			this.processSettings( this.settings, this.preferences );
			
			var themename = this.settings.name;
			
			var themeInfo = data.themeData.getThemeStorageInfo();
			
			/* New Theme defined */
			
			if( dojo.byId( 'themesaver' ).value.length > 0 ){
			
				var newtheme = {};
				
				newtheme.name = dojo.byId( 'themesaver' ).value;
				
				for( var setting in this.settings ){
					
					var element = this.settings[setting].name;
					
					if( element !== 'name' ){
						newtheme[element] = this.settings[setting].value;
					}
				}
				
				if( this.fontSize ){
					newtheme['fontSize'] = this.fontSize;
				}
				
				var existingTheme = false;
				
				for( var s in this.styles ){
					if( this.styles[s].name === newtheme.name ){
						this.styles[s] = newtheme;
						existingTheme = true;
						break;
					}
				}
				
				if( !existingTheme ){
					this.styles.push( newtheme );
				}
				themename = newtheme.name;
				
				if( dojo.byId( 'themesaver' ).value ){
					dojo.byId( 'themesaver' ).value = '';
				}
			}
			
			var styles = this.styles;	
			
			var selectedTheme = { 'selected': themename };
				
			this.preferences.getPreferences(themeInfo.storage, 2).then(function(prefs){ //$NON-NLS-0$
				prefs.put( themeInfo.styleset, JSON.stringify(styles) );
				prefs.put( 'selected', JSON.stringify(selectedTheme) );
			} );
			
			dojo.byId( 'savecontainer' ).style.display = 'none';
			dojo.byId( 'pickercontainer' ).style.display = '';
			this.updateThemePicker(themename);
			this.AUTONAME = false;
		}
		
		ThemeBuilder.prototype.apply = apply;

		function revert(data){	
			this.initializeStorage();
			this.guide();
			dojo.byId( 'pickercontainer' ).style.display = '';
			dojo.byId( 'savecontainer' ).style.display = 'none';
			this.AUTONAME = false;
		}
		
		ThemeBuilder.prototype.revert = revert;
		
		function guide(data){	
			this.refresh();
			OVERVIEW = true;
			var data = this.themeData.getViewData();
			this.drawOutlineData(data);
//			dojo.byId( 'pickercontainer' ).style.display = '';
//			dojo.byId( 'savecontainer' ).style.display = 'none';
			dojo.byId( 'stringcontainer' ).style.display = 'none';
		}
		
		ThemeBuilder.prototype.guide = guide;
		
		function select( name ){
		
			previous = this.settings;
		
			for( var s in this.styles ){
				
				if( this.styles[s].name === name ){
				    
				    this.settings.name = name;
					
					for( var setting in this.settings ){
						if( setting !== 'name' ){
							var item = this.settings[setting].name;
							this.settings[setting].value = this.styles[s][item];
						}
					}
					break;
				}
			}
			
			clear();
			
			init();
			
			this.refresh();
		}
		
		ThemeBuilder.prototype.select = select;
		
		function selectFontSize( size ){
		
			this.settings['fontSize'] = { value:size };
			
			this.themeData.selectFontSize( size );
			
			this.fontSize = size;
		
			console.log( 'font size: ' + size );
		}
		
		ThemeBuilder.prototype.selectFontSize = selectFontSize;
		
		function updateFontSizePicker( selected ){
		
			var themebuilder = this;
		
			var options = [];
			
			for( var size = 8; size < 19; size++ ){
					
				var set = {
					value: size + 'pt',
					label: size + 'pt'
				};	
				
				if( size === selected ){ set.selected = 'true'; }
				
				options.push(set);
			}	
		
			this.sizeSelect.destroy();
			var newdiv = document.createElement('div');
			newdiv.id = 'fontsizepicker';
			document.getElementById( 'sizecontainer' ).appendChild(newdiv);
			this.sizeSelect = new orion.widgets.settings.Select( {options:options}, newdiv );
			this.sizeSelect.setStorageItem = dojo.hitch( themebuilder, 'selectFontSize' );
	
		}
		
		function addFontSizePicker(){
		
			var themebuilder = this;
			
			var picker = document.getElementById( 'fontsizepicker' );
			
			var options = [];
			
			for( var size = 8; size < 19; size++ ){
					
				var set = {
					value: size + 'pt',
					label: size + 'pt'
				};	
				
				if( size === 10 ){ set.selected = 'true'; }
				
				this.fontSize = '10pt';
				
				options.push(set);
			}	
			
			if(!this.sizeSelect){
				this.sizeSelect = new orion.widgets.settings.Select( {options:options}, picker );
				this.sizeSelect.setStorageItem = dojo.hitch( themebuilder, 'selectFontSize' );	
			}
		}
		
		ThemeBuilder.prototype.addFontSizePicker = addFontSizePicker;
		
		
		function addThemePicker(){
		
			var options = [];
			
			var themebuilder = this;
			
			var selection;
			
			var builder = this;
			
			var themeInfo = this.themeData.getThemeStorageInfo();
			
			this.preferences.getPreferences(themeInfo.storage, 2).then(dojo.hitch(this, function(prefs){ //$NON-NLS-0$

				/* Check to see if the Orion theme is in the themes preferences ... if it is, 
				   then we don't need to populate again, otherwise we do need to populate. */
				   
				   
				selection = prefs.get( 'selected' );
				
				if(selection){ selection = JSON.parse( selection ); }
				
				var styles = prefs.get( themeInfo.styleset );
				
				if(styles){ styles = JSON.parse( styles ); }

				if(!styles){
				
					/* If we're in this condition, then the themes are not in local storage yet.
					   Going to make sure */
				
					styles = builder.styleset; 
				}
				
				if(!selection) {
					selection = { 'selected':'Orion' };	
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
						
						themebuilder.styles = styles;
					}	
				}
				
				if( selection ){	
					this.select( selection.selected );
				}
			
				var picker = document.getElementById( 'themepicker' );
				
				if(!this.themeSelect){
					this.themeSelect = new orion.widgets.settings.Select( {options:options}, picker );
					this.themeSelect.setStorageItem = dojo.hitch( themebuilder, 'select' );
					
					var saver = document.getElementById( 'themesaver' );
					new orion.widgets.settings.TextField({}, saver );	
				}
			} ));	
		}
		
		ThemeBuilder.prototype.addThemePicker = addThemePicker;
		
		
		function updateThemePicker(selection){
			
			var options = [];
			
			for( var theme in this.styles ){
					
				var set = {
					value: this.styles[theme].name,
					label: this.styles[theme].name
				};	
				
				if( selection ){	
					if( this.styles[theme].name === selection ){
						set.selected = true;
					}
				}
				
				options.push(set);
				
				this.themeSelect.destroy();
				var newdiv = document.createElement('div');
				newdiv.id = 'themepicker';
				document.getElementById( 'pickercontainer').appendChild(newdiv);
				this.themeSelect = new orion.widgets.settings.Select( {options:options}, newdiv );
				this.themeSelect.setStorageItem = dojo.hitch( this, 'select' );
			}	
		}
		
		ThemeBuilder.prototype.updateThemePicker = updateThemePicker;
		
		function renderData( anchor, state ){
		
			var data = this.themeData.getViewData();
		
			if( state && state === 'INITIALIZE' ){ INITIALIZE = true; }
			anchor.innerHTML = this.template; // ok--this is a fixed value
	
			var themeInfo = this.themeData.getThemeStorageInfo();
			var themeData = this.themeData; 
		
			var element = document.getElementById( 'colorstring' );
		
			this.colorFieldId = themeInfo.styleset + 'colorField';
			
			element.id = this.colorFieldId;
			
			if( this.themeData.fontSettable ){
				dojo.byId( 'sizecontainer' ).style.display = '';
			}
	
			this.drawOutlineData(data);	
			this.addFontSizePicker();
			this.addThemePicker();
			
			this.commandService.renderCommands('themeCommands', document.getElementById( 'revertCommands' ), this, this, "button"); //$NON-NLS-1$ //$NON-NLS-0$		
		}
		
		ThemeBuilder.prototype.renderData = renderData;
		
		function destroy(){
			var picker = dijit.byId( 'themepicker' );
			if (picker) {
				picker.destroyRecursive();
			}
			var saver = dijit.byId( 'themesaver' );
			if (saver) {
				saver.destroyRecursive();
			}
			var colorfld = dijit.byId( this.colorFieldId );
			if (colorfld) {
				colorfld.destroyRecursive();
			}
			var fontsizepicker = dijit.byId( 'fontsizepicker' );
			if (fontsizepicker) {
				fontsizepicker.destroyRecursive();
			}
			
		}
		
		ThemeBuilder.prototype.destroy = destroy;

		return{
			ThemeBuilder:ThemeBuilder,
			destroy:destroy
		};
	}
);