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
/*global dojo dijit widgets orion  window console define localStorage ActiveXObject DOMParser*/
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
		
		
		StyleSet.prototype.name = 'prospecto';
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
			
			orion.name = 'orion';
			orion.annotationRuler = 'white'; 
			orion.background = 'white';
			orion.comment = 'green';
			orion.keyword = '#7f0055';
			orion.text = '#333';
			orion.string = 'blue';
			orion.overviewRuler = 'white';
			orion.lineNumberOdd = '#444';
			orion.lineNumberEven = '#444';
			orion.lineNumber = '#444';
			orion.currentLine = '#EAF2FE';

			this.styles.push( orion );	

			var prospecto = new StyleSet();
			
			prospecto.name = 'prospecto';
			prospecto.annotationRuler = 'white'; 
			prospecto.background = 'white';
			prospecto.comment = 'darkSeaGreen';
			prospecto.keyword = 'darkOrange';
			prospecto.text = '#333';
			prospecto.string = 'cornFlowerBlue';
			prospecto.overviewRuler = 'white';
			prospecto.lineNumberOdd = '#333';
			prospecto.lineNumberEven = '#333';
			prospecto.lineNumber = '#333';
			prospecto.currentLine = '#EAF2FE';

			this.styles.push( prospecto );			
			
			var blue = new StyleSet();
			
			blue.name = 'blue';
			blue.annotationRuler = 'lavender'; 
			blue.background = 'aliceBlue';
			blue.comment = 'indigo';
			blue.keyword = 'cornFlowerBlue';
			blue.text = 'navy';
			blue.string = 'cornFlowerBlue';
			blue.overviewRuler = 'lavender';
			blue.lineNumberOdd = '#333';
			blue.lineNumberEven = '#333';
			blue.lineNumber = '#333';
			blue.currentLine = 'white';
			
			this.styles.push( blue );
			
			var ambience = new StyleSet();
			
			ambience.name = 'ambience';
			ambience.annotationRuler = '#3D3D3D'; 
			ambience.background = '#202020';
			ambience.comment = 'mediumslateblue';
			ambience.keyword = 'cornFlowerBlue';
			ambience.text = 'darkseagreen';
			ambience.string = 'lightcoral';
			ambience.overviewRuler = 'white';
			ambience.lineNumberOdd = 'black';
			ambience.lineNumberEven = 'black';
			ambience.lineNumber = 'black';
			ambience.currentLine = 'lightcyan';
			
			this.styles.push( ambience );
			
			var tierra = new StyleSet();
			
			tierra.name = 'tierra';
			tierra.annotationRuler = 'moccasin'; 
			tierra.background = 'lemonchiffon';
			tierra.comment = 'darkseagreen';
			tierra.keyword = 'darkred';
			tierra.text = '#555555';
			tierra.string = 'orangered';
			tierra.overviewRuler = 'moccasin';
			tierra.lineNumberOdd = 'chocolate';
			tierra.lineNumberEven = 'chocolate';
			tierra.lineNumber = 'chocolate';
			tierra.currentLine = '#baa289';
			
			this.styles.push( tierra );
			
			var nimbus = new StyleSet();
			
			nimbus.name = 'nimbus';
			nimbus.annotationRuler = '#444'; 
			nimbus.background = 'dimgray';
			nimbus.comment = 'darkseagreen';
			nimbus.keyword = 'darkorange';
			nimbus.text = 'white';
			nimbus.string = 'cornflowerblue';
			nimbus.overviewRuler = '#444';
			nimbus.lineNumberOdd = '#aaa';
			nimbus.lineNumberEven = '#aaa';
			nimbus.lineNumber = '#aaa';
			nimbus.currentLine = '#aabfbb';
			
			this.styles.push( nimbus );
			
			var adelante = new StyleSet();
			
			adelante.name = 'adelante';
			adelante.annotationRuler = '#E2D2B2'; 
			adelante.background = '#F1E7C8';
			adelante.comment = '#5D774E';
			adelante.keyword = '#AF473B';
			adelante.text = 'dimgray';
			adelante.string = '#DE5D3B';
			adelante.overviewRuler = '#E2D2B2';
			adelante.lineNumberOdd = '#AF473B';
			adelante.lineNumberEven = '#AF473B';
			adelante.lineNumber = '#AF473B';
			adelante.currentLine = '#9e937b';
			
			this.styles.push( adelante );
			
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
			
			dataset.shapes = [	{ type:'TEXT', name:'Line Numbers', label:'1', x:LEFT + 20, y:TOP + 20, fill: '#333', family:'lineNumber', font: '9pt sans-serif' },
								{ type:'TEXT', name:'Comments',		label:'/* comment */',		x:LEFT + 55,	y:TOP + 20,		fill: 'darkSeaGreen',	family:'comment', font: '9pt sans-serif' },
								{ type:'RECTANGLE', name:'Background',			x:LEFT + 46,	y:TOP, width:290,	height:dataset.height, family:'background',	 fill: 'white' },
								{ type:'TEXT', name:'Comments',		label:'/* comment */',		x:LEFT + 55,	y:TOP + 20,		fill: 'darkSeaGreen',	family:'comment', font: '9pt sans-serif' }, 
								
								{ type:'RECTANGLE', name:'Current Line',		x:LEFT + 46,	y:TOP +67, width:290,	height:18, family:'currentLine', fill: '#eaf2fd' },
								{ type:'TEXT', name:'Strings',		label:'\'Result\'',			x:LEFT + 144,	y:TOP + 60,		fill: 'cornflowerBlue', family:'string', font: '9pt sans-serif' }, 
								{ type:'TEXT', name:'Foreground',			label:'multiply(a,b){',		x:LEFT + 100,	y:TOP + 40,		fill: '#333',			family:'text', font: '9pt sans-serif' },
																{ type:'RECTANGLE', name:'Overview Ruler',		x:LEFT + 336,	y:TOP, width:14,	height:dataset.height, family:'overviewRuler', fill: 'white' },
								{ type:'TEXT', name:'keywords',		label:'function',			x:LEFT + 55,	y:TOP + 40,		fill: 'darkorange',		family:'keyword', font: '9pt sans-serif' }, 
								{ type:'TEXT', name:'keywords',		label:'function',			x:LEFT + 55,	y:TOP + 40,		fill: 'darkorange',		family:'keyword', font: '9pt sans-serif' }, 
								 
								{ type:'TEXT', name:'Keywords',		label:'var',				x:LEFT + 75,	y:TOP + 60,		fill: 'darkorange',		family:'keyword', font: '9pt sans-serif' }, 
								{ type:'TEXT', name:'Foreground',			label:'output = ',			x:LEFT + 95,	y:TOP + 60,		fill: '#333',			family:'text', font: '9pt sans-serif' }, 
								
								{ type:'TEXT', name:'Foreground',			label:';',					x:LEFT + 185,	y:TOP + 60,		fill: '#333',			family:'text', font: '9pt sans-serif' }, 
								
								{ type:'TEXT', name:'keywords',		label:'var',				x:LEFT  +75,	y:TOP + 80,		fill: 'darkorange',		family:'keyword', font: '9pt sans-serif' },
								{ type:'TEXT', name:'Foreground',			label:'result = a*b;',		x:LEFT + 95,	y:TOP + 80,		fill: '#333',			family:'text', font: '9pt sans-serif' }, 
								{ type:'TEXT', name:'keywords',		label:'return',				x:LEFT + 75,	y:TOP + 100,	fill: 'darkorange',		family:'keyword', font: '9pt sans-serif' },
								{ type:'TEXT', name:'Foreground',			label:'output + result;',	x:LEFT + 115,	y:TOP + 100,	fill: '#333',			family:'text', font: '9pt sans-serif' },
								{ type:'TEXT', name:'Foreground',			label:'}',					x:LEFT + 55,	y:TOP + 120,	fill: '#333',			family:'text', font: '9pt sans-serif' },

								{ type:'RECTANGLE', name:'Annotation Ruler',	x:LEFT,			y:TOP, width:46,	height:dataset.height, family:'annotationRuler', fill: 'white' }];
			
			for( var line =0; line < 8; line++ ){
				dataset.shapes.push( { type:'TEXT', name:'Line Numbers', label:line+1, x:LEFT + 20, y:TOP + ( 20* line ) + 20, fill: '#333', family:'lineNumber', font: '9pt sans-serif' } );
			}	
			
			return dataset;
		}
		
		function parseToXML ( text ) {
		      try {
		        var xml = null;
		        
		        if ( window.DOMParser ) {
		
		          var parser = new DOMParser();
		          xml = parser.parseFromString( text, "text/xml" );
		          
		          var found = xml.getElementsByTagName( "parsererror" );
		
		          if ( !found || !found.length || !found[ 0 ].childNodes.length ) {
		            return xml;
		          }
		
		          return null;
		        } else {
		
		          xml = new ActiveXObject( "Microsoft.XMLDOM" );
		
		          xml.async = false;
		          xml.loadXML( text );
		
		          return xml;
		        }
		      } catch ( e ) {
		        // suppress
		      }
		 }
		 
		ThemeData.prototype.parseToXML = parseToXML;
		
		function importTheme(data){
			console.log( 'import theme' );
			console.log( data );
			
			var body = data.parameters.valueFor("name");
				
			var xml = this.parseToXML( body );
			
			var newStyle = new StyleSet();
			
			newStyle.name = xml.getElementsByTagName("colorTheme")[0].attributes[1].value;;
			newStyle.annotationRuler = xml.getElementsByTagName("background")[0].attributes[0].value; 
			newStyle.background = xml.getElementsByTagName("background")[0].attributes[0].value;
			newStyle.comment = xml.getElementsByTagName("singleLineComment")[0].attributes[0].value;
			newStyle.keyword = xml.getElementsByTagName("keyword")[0].attributes[0].value;
			newStyle.text = xml.getElementsByTagName("foreground")[0].attributes[0].value;
			newStyle.string = xml.getElementsByTagName("string")[0].attributes[0].value;
			newStyle.overviewRuler = xml.getElementsByTagName("background")[0].attributes[0].value;
			newStyle.lineNumberOdd = xml.getElementsByTagName("lineNumber")[0].attributes[0].value;
			newStyle.lineNumberEven = xml.getElementsByTagName("lineNumber")[0].attributes[0].value;
			newStyle.lineNumber = xml.getElementsByTagName("lineNumber")[0].attributes[0].value;
			newStyle.currentLine = xml.getElementsByTagName("selectionBackground")[0].attributes[0].value;
			
			data.items.styles.push( newStyle );
			data.items.updateThemePicker( newStyle.name );
			data.items.select( newStyle.name );
		}
		
		ThemeData.prototype.importTheme = importTheme;
		
		function processSettings( settings, preferences ){
		
			console.log( settings );
		
			preferences.getPreferences('/settings', 2).then(function(prefs){ //$NON-NLS-0$
				
				var font = {};		
				font.label = 'Font';
				font.data = [ { label:'Family', value: 'Sans Serif', ui:'Font' }, 
							{ label:'Size', value: '9pt', ui:'Font' }, 
							{ label:'Color', value: settings['text'].value }, 
							{ label:'Background', value: settings['background'].value } ];
				
				var subcategories = [ { element: 'fontFamily', value: 'sans serif' },
							          { element: 'fontSize', value: '9pt' },
							          { element: 'fontWeight', value: 'normal' },
									  { element: 'text', value: settings['text'].value }, 
									  { element: 'background', value: settings['background'].value },
									  { element: 'string', value: settings['string'].value },
									  { element: 'annotationRuler', value: settings['annotationRuler'].value },
									  { element: 'comment', value: settings['comment'].value },
									  { element: 'keyword', value: settings['keyword'].value },
									  { element: 'overviewRuler', value: settings['overviewRuler'].value },
									  { element: 'annotationRuler', value: settings['annotationRuler'].value },
									  { element: 'lineNumber', value: settings['lineNumber'].value },
									  { element: 'currentLine', value: settings['currentLine'].value }
									  ];

				prefs.put( 'JavaScript Editor', JSON.stringify(subcategories) );
				
			});
		}

		ThemeData.prototype.processSettings = processSettings;

		ThemeData.prototype.getViewData = getViewData;

		return{
			ThemeData:ThemeData,
			getStyles:getStyles
		};
	}
);