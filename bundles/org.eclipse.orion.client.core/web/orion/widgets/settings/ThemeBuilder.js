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

define(['i18n!orion/settings/nls/messages', 'require', 'dojo', 'dijit', 'orion/util', 'orion/commands', 'orion/globalCommands', 'orion/PageUtil', 'orion/widgets/settings/ThemeComponent', 'orion/widgets/settings/ThemeData', 'orion/widgets/settings/ThemeSheetWriter'], 
	function(messages, require, dojo, dijit, mUtil, mCommands, mGlobalCommands, PageUtil, Component, ThemeData, ThemeSheetWriter ) {

		var TOP = 10;
		var LEFT = 10;
		var UI_SIZE = 350;
		var BANNER_HEIGHT = 32;
		var NAV_HEIGHT = 29;
		var CONTENT_TOP = TOP + BANNER_HEIGHT + NAV_HEIGHT;
		
		var SELECTED_ZONE = null;
		var OVERVIEW = true;
		var INITIALIZE = true;
		var ARCS = true;
		
		var zones = [];
		var canvas = null; 
		var position;
		var ctx = null;
		
		var over = null;
		
		var previous;
		
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
		
			init();
			
			
			
			this.settings.navbar = new Family( 'NavBar', '#333' );
			this.settings.button = new Family( 'Button', '#777777' );
			this.settings.location = new Family( 'Location', '#efefef' ); 
			this.settings.selection = new Family( 'Selection', '#FEC' );
			this.settings.sidepanel = new Family( 'Side', '#FBFBFB' ); 
			this.settings.mainpanel = new Family( 'Main', 'white' ); 
			this.settings.toolpanel = new Family( 'Tools', 'white' ); 
			this.settings.navtext = new Family( 'Navtext', '#bfbfbf' );
			this.settings.content = new Family( 'ContentText', '#3087B3' );
			this.settings.search = new Family( 'Search', '#444' );
			this.settings.lines = new Family( 'Lines', '#E6E6E6' );
			
			this.commandService = args.commandService;
			this.preferences = args.preferences;
			
			
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
		
			var newcolor = document.getElementById( 'colorstring' ).value;
			
			if( this.themebuilder.validateHex( newcolor ) ){
			
				zones[SELECTED_ZONE.id].fill = newcolor;
				this.themebuilder.updateFamily( zones[SELECTED_ZONE.id].family, newcolor );
				OVERVIEW = false;
				this.themebuilder.refresh();
				zones[SELECTED_ZONE.id].glow( UI_SIZE, TOP );
				this.themebuilder.drawPicker( ctx, zones[SELECTED_ZONE.id] );
				
				dojo.byId( 'pickercontainer' ).style.display = 'none';
				dojo.byId( 'savecontainer' ).style.display = '';
			
				console.log( 'apply color' );
			}
		}

		ThemeBuilder.prototype.applyColor = applyColor;
		
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
												'<div id="pickercontainer" style="display:block;">' +
													'<span class="settingsLabel">Theme:</span>' + 
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
														'<button style="margin-left:5px;height:17px;margin-top:0;" type="button" id="colorButton"}">ok</button>' + 
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
		
			this.preferences.getPreferences('/themes', 2).then(function(prefs){ //$NON-NLS-0$

				/* Check to see if the Orion theme is in the themes preferences ... if it is, 
				   then we don't need to populate again, otherwise we do need to populate. */

				var cat = prefs.get( 'styles' ); //$NON-NLS-0$
				var selectedTheme = prefs.get( 'selected' );
				if (!cat){
					var themes = new ThemeData.ThemeData();
					var styles = themes.getStyles();
					prefs.put( 'styles', JSON.stringify(styles) ); //$NON-NLS-0$
					builder.styleset = styles;
				}
				if (!selectedTheme) {
					selectedTheme = { 'selected':'Orion' }; //$NON-NLS-0$  //$NON-NLS-1$
					prefs.put( 'selected', JSON.stringify(selectedTheme) );
				}
				builder.addThemePicker();
			} );
		}
		
		
		ThemeBuilder.prototype.initializeStorage = initializeStorage;
		
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
			this.drawOutline();
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

				
				var colorstring = document.getElementById( 'colorstring' );
				
				if( !this.colfld ){
					this.colfld = new orion.widgets.settings.TextField({}, colorstring );
					this.colfld.width( '100px' );
				}
				var colorButton = document.getElementById( 'colorButton' );
				colorButton.themebuilder = this;
				colorButton.onclick = this.applyColor;
				

		}
		
		ThemeBuilder.prototype.drawPicker = drawPicker;
		
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
					
						case 'Main':
						
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
		

		function drawOutline(){
			
			position = dojo.position( 'themeContainer' );	
	
			if( !canvas ){
				canvas = document.getElementById( 'orionui' );
				ctx = canvas.getContext( '2d' );
				canvas.addEventListener( "mousedown", dojo.hitch( this, 'mouseDown' ), false );	
				canvas.addEventListener( "mousemove", mouseMove, false );
				canvas.addEventListener( "mouseup", mouseUp, false );
			}
			
			Component.drawRectangle( ctx, LEFT, TOP, UI_SIZE - 0.5, UI_SIZE, null, '#CCC' );
			
			var img = new Image();  
			
		    img.onload = function(){  
				ctx.drawImage(img, LEFT + 5, TOP + 8);  
		    };
		    
		    img.src = 'orion-transparent.png'; 
			
			if( INITIALIZE === true ){
			
				var settings = this.getCurrentSettings();
			
				/* Navigation */
			
				var navbar = Component.drawRectangle( ctx, LEFT, TOP, UI_SIZE, BANNER_HEIGHT, settings.navbar.value );
				navbar.description = 'Navigation Bar';	
				navbar.family = settings.navbar.name;
				
				 /* Button */
		
				var button = Component.roundRect( ctx, LEFT + UI_SIZE * 0.4 + 5, CONTENT_TOP + 5, 37, 20, 2, '#EFEFEF', settings.button.value );
				button.description = 'Button';
				button.family = settings.button.name;
				
				/* Breadcrumb */
				
				var crumbbar = Component.drawRectangle( ctx, LEFT, TOP + BANNER_HEIGHT, UI_SIZE, NAV_HEIGHT, settings.location.value );
				crumbbar.description = 'Breadcrumb Bar';
				crumbbar.family = settings.location.name;
				
				
				
				/* Side panel */
				
				var sidepanel = Component.drawRectangle( ctx, LEFT, CONTENT_TOP, UI_SIZE * 0.4, UI_SIZE - CONTENT_TOP + TOP, settings.sidepanel.value );
				sidepanel.description = 'Side Panel';
				sidepanel.family = settings.sidepanel.name;
				
				/* Selection bar */
			
				var selection = Component.drawRectangle( ctx, LEFT + UI_SIZE * 0.4 + 5, CONTENT_TOP + 62, UI_SIZE * 0.6 -10, 20, settings.selection.value );
				selection.description = 'Selection bar';
				selection.family = settings.selection.name;
				
				var search = Component.roundRect( ctx, LEFT + UI_SIZE - 145, TOP + 10, 70, 12, 5, settings.search.value, '#222222' );
				search.description = 'Search Box';
				search.family = settings.search.name;
				
				var navigator =Component.drawText( ctx, 'Navigator', LEFT + 50, TOP + 20, '8pt sans-serif', settings.navtext.value );   
				navigator.description = 'Navigation Text';
				navigator.family = settings.navtext.name;
				
				var username = Component.drawText( ctx, 'UserName', LEFT + UI_SIZE - 70, TOP + 20, '8pt sans-serif', settings.navtext.value );
				username.description = 'Navigation Text';
				username.family = settings.navtext.name;
				
				var breadcrumb = Component.drawText( ctx, 'Orion Content', LEFT + 5, TOP + BANNER_HEIGHT + 18, '8pt sans-serif', settings.content.value );
				breadcrumb.description = 'Content Text';
				breadcrumb.family = settings.content.name;
				
				var rightpanel = Component.drawRectangle( ctx, LEFT + UI_SIZE * 0.4, CONTENT_TOP + 30, UI_SIZE * 0.6 -1, UI_SIZE - CONTENT_TOP + TOP -31, settings.mainpanel.value );
				rightpanel.description = 'Main Panel';
				rightpanel.family = settings.mainpanel.name;
				
				var toolpanel = Component.drawRectangle( ctx, LEFT + UI_SIZE * 0.4, CONTENT_TOP, UI_SIZE * 0.6 -1, 30, settings.toolpanel.value );
				toolpanel.description = 'Tool Panel';
				toolpanel.family = settings.toolpanel.name;
				
				zones.push( navbar );
				zones.push( username );
				zones.push( search );
				zones.push( toolpanel );
				zones.push( crumbbar );
				
				
				
				

				zones.push( rightpanel );
				
				zones.push( selection );
				
				zones.push( button );
				
				zones.push( breadcrumb );
				
				for( var count=0; count < 3; count++ ){
					
					/* Section Items */
					
					var content = Component.drawText( ctx, 'org.eclipse.orion.content', LEFT + UI_SIZE * 0.4 + 20, CONTENT_TOP + 56 + ( 20 * count ), '8pt sans-serif', settings.content.value ); 
					content.description = 'Content Text';
					content.family = settings.content.name;
					zones.push( content );
				}
				
				
				zones.push( navigator );
				zones.push( sidepanel );
				
				for( count=0; count < 3; count++ ){
				
					/* Section Items */
					
					var item =Component.drawText( ctx, 'Item', LEFT + 15, CONTENT_TOP + 44 + ( 20 * count ), '8pt sans-serif', settings.content.value ); 
					item.description = 'Content Text';
					item.family = settings.content.name;
					zones.push( item );
				}
				
				INITIALIZE = false;
				
			}else{
			
				for( var z in zones ){
					if( !zones[z].paintchip ){
						zones[z].render();
					}
				}
			}
			
			/* Toolbar */
				
			var horizontalLine = Component.drawLine( ctx, LEFT + UI_SIZE * 0.4, CONTENT_TOP + 30, LEFT + UI_SIZE, CONTENT_TOP + 30, 2, '#DEDEDE' );
			
			var verticalLine = Component.drawLine( ctx, LEFT + UI_SIZE * 0.4, CONTENT_TOP, LEFT + UI_SIZE * 0.4, TOP + UI_SIZE, 2, '#DEDEDE' );   
		    
		    /* Section */
		    
		    var downArrow = Component.drawTriangle( ctx, LEFT + 10, CONTENT_TOP + 17, LEFT + 16, CONTENT_TOP + 17, LEFT + 13, CONTENT_TOP + 22, '#333' );
		
			var section = Component.drawText( ctx, 'Section', LEFT + 20, CONTENT_TOP + 23, '8pt sans-serif', '#333' );        
		
		
			var sectionline = Component.drawLine( ctx, LEFT + 10, CONTENT_TOP + 29, LEFT + UI_SIZE * 0.4 - 10, CONTENT_TOP + 29, 2, '#DEDEDE' );		  
		        
			var buttonText = Component.drawText( ctx, 'Button', LEFT + UI_SIZE * 0.4 + 8, CONTENT_TOP + 19, '8pt sans-serif', '#333' );        
			
			for( var twisty = 0; twisty < 3; twisty++ ){
				Component.drawTriangle( ctx, LEFT + UI_SIZE * 0.4 + 10, CONTENT_TOP + 50 + (twisty*20), 
										LEFT + UI_SIZE * 0.4 + 15, CONTENT_TOP + 53 + (twisty*20), 
										LEFT + UI_SIZE * 0.4 + 10, CONTENT_TOP + 56 + (twisty*20), '#333' );
			}
		    
			var userMenu = Component.drawTriangle( ctx, LEFT + UI_SIZE - 7, TOP + 14, LEFT + UI_SIZE - 13, TOP + 14, LEFT + UI_SIZE - 10, TOP + 19, '#BFBFBF' );
		
			if( OVERVIEW ){
				overview( ctx, zones );
			}
		}
		
		
		ThemeBuilder.prototype.drawOutline = drawOutline;
		
		function apply(data){
			var sheetMaker = new ThemeSheetWriter.ThemeSheetWriter();
			var cssdata = sheetMaker.getSheet( this.settings );
			
			var stylesheet = document.createElement("STYLE");
			stylesheet.appendChild(document.createTextNode(cssdata));
			
			var head = document.getElementsByTagName("HEAD")[0] || document.documentElement;
			head.appendChild(stylesheet);
			
			var themename = this.settings.name;
			
			/* New Theme defined */
			
			if( dojo.byId( 'themesaver' ).value.length > 0 ){
			
				var newtheme = {};
				
				newtheme.name = dojo.byId( 'themesaver' ).value;
				newtheme.navbar = this.settings.navbar.value;
				newtheme.button = this.settings.button.value;
				newtheme.location = this.settings.location.value;
				newtheme.selection = this.settings.selection.value;
				newtheme.sidepanel = this.settings.sidepanel.value; 
				newtheme.toolpanel = this.settings.toolpanel.value;
				newtheme.mainpanel = this.settings.mainpanel.value;
				newtheme.navtext = this.settings.navtext.value;
				newtheme.content = this.settings.content.value;
				newtheme.search = this.settings.search.value;
				
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
				
			this.preferences.getPreferences('/themes', 2).then(function(prefs){ //$NON-NLS-0$
				prefs.put( 'styles', JSON.stringify(styles) );
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
			this.drawOutline();
		}
		
		ThemeBuilder.prototype.guide = guide;
		
		function select( name ){
		
			previous = this.settings;
		
			for( var s in this.styles ){
			
				if( this.styles[s].name === name ){
					
					this.settings.name = name;
					this.settings.navbar.value = this.styles[s].navbar;
					this.settings.button.value = this.styles[s].button;
					this.settings.location.value = this.styles[s].location;
					this.settings.selection.value = this.styles[s].selection;
					this.settings.sidepanel.value = this.styles[s].sidepanel;
					this.settings.mainpanel.value = this.styles[s].mainpanel;
					this.settings.toolpanel.value = this.styles[s].toolpanel;
					this.settings.navtext.value = this.styles[s].navtext;
					this.settings.content.value = this.styles[s].content;
					this.settings.search.value = this.styles[s].search;
					
					break;
				}
			}
			
			clear();
			
			init();
			
			this.refresh();
		}
		
		ThemeBuilder.prototype.select = select;
		
		
		function addThemePicker(){
		
			var options = [];
			
			var themebuilder = this;
			
			var selection;
			
			var builder = this;
			
			this.preferences.getPreferences('/themes', 2).then(dojo.hitch(this, function(prefs){ //$NON-NLS-0$

				/* Check to see if the Orion theme is in the themes preferences ... if it is, 
				   then we don't need to populate again, otherwise we do need to populate. */
				   
				selection = prefs.get( 'selected' );
				
				if(selection){ selection = JSON.parse( selection ); }
				
				var styles = prefs.get( 'styles' );
				
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
							innerHTML: styles[theme].name
						};	
						
						if( selection ){	
							if( styles[theme].name === selection.selected ){
								set.selected = 'selected';
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
					innerHTML: this.styles[theme].name
				};	
				
				if( selection ){	
					if( this.styles[theme].name === selection ){
						set.selected = 'selected';
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
		
		function render( anchor, state ){
		
			if( state && state === 'INITIALIZE' ){ INITIALIZE = true; }
			anchor.innerHTML = this.template;	
	
			this.drawOutline();			
			this.addThemePicker();
		
			this.commandService.renderCommands('themeCommands', document.getElementById( 'revertCommands' ), this, this, "button"); //$NON-NLS-1$ //$NON-NLS-0$		
		}
		
		ThemeBuilder.prototype.render = render;
		
		function destroy(){
			var picker = dijit.byId( 'themepicker' );
			if (picker) {
				picker.destroyRecursive();
			}
			var saver = dijit.byId( 'themesaver' );
			if (saver) {
				saver.destroyRecursive();
			}
		}
		
		ThemeBuilder.prototype.destroy = destroy;

		return{
			ThemeBuilder:ThemeBuilder,
			destroy:destroy
		};
	}
);