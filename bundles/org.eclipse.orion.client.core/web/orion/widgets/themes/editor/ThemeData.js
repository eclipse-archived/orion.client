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

define(['i18n!orion/settings/nls/messages', 'require', 'dojo', 'dijit', 'orion/util', 'orion/commands', 'orion/globalCommands', 'orion/PageUtil'], 
	function(messages, require, dojo, dijit, mUtil, mCommands, mGlobalCommands, PageUtil) {

		function StyleSet(){
		
		}
		
		function multiply(a,b){
			var resultString = 'Result:';
			var result = a*b;
			return resultString + result;
		}
		
		
		StyleSet.prototype.name = 'Orion';
		StyleSet.prototype.annotationRuler = '#333';
		StyleSet.prototype.background = '#EFEFEF';
		StyleSet.prototype.comment = '#333';
		StyleSet.prototype.keyword = '#3087B3';
		StyleSet.prototype.text = '#333';
		StyleSet.prototype.string = 'FEC';
		StyleSet.prototype.overviewRuler = '#FBFBFB';
		StyleSet.prototype.lineNumberOdd = 'white';
		StyleSet.prototype.lineNumberEven = 'white';
		StyleSet.prototype.lineNumber = '#bfbfbf';

		function ThemeData(){

			var orion = new StyleSet();
			
			orion.name = 'Orion';
			orion.annotationRuler = 'white'; 
			orion.background = 'white';
			orion.comment = 'darkSeaGreen';
			orion.keyword = 'darkOrange';
			orion.text = '#333';
			orion.string = 'cornFlowerBlue';
			orion.overviewRuler = 'white';
			orion.lineNumberOdd = '#333';
			orion.lineNumberEven = '#333';
			orion.lineNumber = '#333';

			this.styles.push( orion );			
			
			var blue = new StyleSet();
			
			blue.name = 'blue';
			blue.annotationRuler = 'lavender'; 
			blue.background = 'aliceBlue';
			blue.comment = 'mediumslateblue';
			blue.keyword = 'cornFlowerBlue';
			blue.text = 'navy';
			blue.string = 'cornFlowerBlue';
			blue.overviewRuler = 'white';
			blue.lineNumberOdd = '#333';
			blue.lineNumberEven = '#333';
			blue.lineNumber = '#333';
			
			
			this.styles.push( blue );
			
		}
		
		function getStyles(){
			return this.styles;
		}
		
		ThemeData.prototype.styles = [];
		ThemeData.prototype.getStyles = getStyles;
		
		function getThemeStorageInfo(){
			var themeInfo = { storage:'/themes', styleset:'editorstyles', defaultTheme:'orion' }; 
			return themeInfo;
		}

		ThemeData.prototype.getThemeStorageInfo = getThemeStorageInfo;

		function getViewData(){
		
			var dataset = {};
			dataset.top = 10;
			dataset.left = 10;
			dataset.width = 400;
			dataset.height = 350;
			
			var LEFT = dataset.left;
			var TOP = dataset.top;
			
			dataset.shapes = [	{ type:'RECTANGLE', name:'annotationRuler',	x:LEFT,			y:TOP, width:46,	height:dataset.height, family:'annotationRuler', fill: 'white' },
								{ type:'RECTANGLE', name:'background',			x:LEFT + 46,	y:TOP, width:290,	height:dataset.height, family:'background',	 fill: 'white' },
								
								{ type:'TEXT', name:'comment',		label:'/* comment */',		x:LEFT + 55,	y:TOP + 20,		fill: 'darkSeaGreen',	family:'comment' }, 
								{ type:'TEXT', name:'keyword',		label:'function',			x:LEFT + 55,	y:TOP + 40,		fill: 'darkorange',		family:'keyword' }, 
								{ type:'TEXT', name:'text',			label:'multiply(a,b){',		x:LEFT + 100,	y:TOP + 40,		fill: '#333',			family:'text' }, 
								{ type:'TEXT', name:'keyword',		label:'var',				x:LEFT + 75,	y:TOP + 60,		fill: 'darkorange',		family:'keyword' }, 
								{ type:'TEXT', name:'text',			label:'output = ',			x:LEFT + 95,	y:TOP + 60,		fill: '#333',			family:'text' }, 
								{ type:'TEXT', name:'string',		label:'\'Result\'',			x:LEFT + 144,	y:TOP + 60,		fill: 'cornflowerBlue', family:'string' }, 
								{ type:'TEXT', name:'text',			label:';',					x:LEFT + 185,	y:TOP + 60,		fill: '#333',			family:'text' }, 
								{ type:'TEXT', name:'keyword',		label:'var',				x:LEFT  +75,	y:TOP + 80,		fill: 'darkorange',		family:'keyword' },
								{ type:'TEXT', name:'text',			label:'result = a*b;',		x:LEFT + 95,	y:TOP + 80,		fill: '#333',			family:'text' }, 
								{ type:'TEXT', name:'keyword',		label:'return',				x:LEFT + 75,	y:TOP + 100,	fill: 'darkorange',		family:'keyword' },
								{ type:'TEXT', name:'text',			label:'output + result;',	x:LEFT + 115,	y:TOP + 100,	fill: '#333',			family:'text' },
								{ type:'TEXT', name:'text',			label:'}',					x:LEFT + 55,	y:TOP + 120,	fill: '#333',			family:'text' },
								{ type:'RECTANGLE', name:'overviewRuler',		x:LEFT + 336,	y:TOP, width:14,	height:dataset.height, family:'overviewRuler', fill: 'white' }];
			
			for( var line =0; line < 9; line++ ){
				dataset.shapes.push( { type:'TEXT', name:'lineNumber', label:line+1, x:LEFT + 20, y:TOP + ( 20* line ) + 20, fill: '#333', family:'line' } );
			}	
			
			console.log( 'e d i t o r   t h e m e' );
			
			return dataset;
		}


		ThemeData.prototype.getViewData = getViewData;

		return{
			ThemeData:ThemeData,
			getStyles:getStyles
		};
	}
);