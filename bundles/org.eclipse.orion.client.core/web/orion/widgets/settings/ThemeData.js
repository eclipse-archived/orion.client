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
		
		StyleSet.prototype.name = 'Orion';
		StyleSet.prototype.navbar = '#333';
		StyleSet.prototype.button = '#777777';
		StyleSet.prototype.location = '#333';
		StyleSet.prototype.breadcrumb = '#3087B3';
		StyleSet.prototype.separator = '#333';
		StyleSet.prototype.selection = 'FEC';
		StyleSet.prototype.sidepanel = '#FBFBFB';
		StyleSet.prototype.mainpanel = 'white';
		StyleSet.prototype.toolpanel = 'white';
		StyleSet.prototype.navtext = '#bfbfbf';
		StyleSet.prototype.content = '#3087B3';
		StyleSet.prototype.search = '#444';

		function ThemeData(){

			var orion = new StyleSet();
			orion.name = 'Orion';
			orion.navbar = '#333';
			orion.button = '#777777';
			orion.location = '#efefef';
			orion.selection = 'FEC';
			orion.sidepanel = '#FBFBFB';
			orion.mainpanel = 'white';
			orion.toolpanel = 'white';
			orion.navtext = '#bfbfbf';
			orion.content = '#3087B3';
			orion.search = '#444';
			orion.breadcrumb = '#3087B3';
			orion.separator = '#333';

			this.styles.push( orion );			

			var eire = new StyleSet();
			
			eire.name = 'Green Zone';
			eire.navbar = 'seagreen';
			eire.button = 'lavender';
			eire.location = 'darkseagreen';
			eire.selection = 'moccasin';
			eire.sidepanel = 'aliceblue';
			eire.mainpanel = 'white';
			eire.toolpanel = 'white';
			eire.navtext = '#FBFBFB';
			eire.content = 'darkgreen';
			eire.search = 'darkgreen';
			eire.breadcrumb = '#3087B3';
			eire.separator = 'seagreen';
			
			this.styles.push( eire );
			
			var avril = new StyleSet();
			
			avril.name = 'Pretty In Pink';
			avril.navbar = 'plum';
			avril.button = 'lavender';
			avril.location = 'pink';
			avril.selection = 'lavender';
			avril.sidepanel = 'seashell';
			avril.mainpanel = 'white';
			avril.toolpanel = 'white';
			avril.navtext = '#FBFBFB';
			avril.content = 'mediumorchid';
			avril.search = 'violet';
			avril.breadcrumb = '#3087B3';
			avril.separator = 'plum';
			
			this.styles.push( avril );
			
			var blue = new StyleSet();
			
			blue.name = 'Blue Monday';
			blue.navbar = 'cornflowerblue';
			blue.button = 'lavender';
			blue.location = 'skyblue';
			blue.selection = 'lavender';
			blue.sidepanel = 'aliceblue';
			blue.mainpanel = 'white';
			blue.toolpanel = 'white';
			blue.navtext = '#FBFBFB';
			blue.content = 'royalblue';
			blue.search = 'royalblue';
			blue.breadcrumb = '#3087B3';
			blue.separator = 'cornflowerblue';
			
			this.styles.push( blue );
			
			var vanilla = new StyleSet();
			
			vanilla.name = 'Vanilla Skies';
			vanilla.navbar = 'sandybrown';
			vanilla.button = 'lemmonchiffon';
			vanilla.location = 'cornsilk';
			vanilla.selection = 'lemonchiffon';
			vanilla.sidepanel = 'white';
			vanilla.mainpanel = 'white';
			vanilla.toolpanel = 'white';
			vanilla.navtext = 'lemonchiffon';
			vanilla.content = 'chocolate';
			vanilla.search = 'moccasin';
			vanilla.breadcrumb = '#3087B3';
			vanilla.separator = 'sandybrown';
			
			this.styles.push( vanilla );
			
			var beetlejuice = new StyleSet();
			
			beetlejuice.name = 'Beetlejuice';
			beetlejuice.navbar = 'indigo';
			beetlejuice.button = 'slateblue';
			beetlejuice.location = 'darkslateblue';
			beetlejuice.selection = 'silver';
			beetlejuice.sidepanel = 'lavender';
			beetlejuice.mainpanel = 'white';
			beetlejuice.toolpanel = 'white';
			beetlejuice.navtext = '#FBFBFB';
			beetlejuice.content = 'mediumslateblue';
			beetlejuice.search = '#444';
			beetlejuice.breadcrumb = '#3087B3';
			beetlejuice.separator = 'indigo';
			
			this.styles.push( beetlejuice );
			
			var red = new StyleSet();
			
			red.name = 'Red';
			red.navbar = '#CD2127';
			red.button = '#777777';
			red.location = '#D85F56';
			red.selection = 'lightcoral';
			red.sidepanel = '#EFDAB2';
			red.mainpanel = '#FDFADD';
			red.toolpanel = '#FDFADD';
			red.navtext = '#FBFBFB';
			red.content = 'darkred';
			red.search = '#D85F56';
			red.breadcrumb = 'darkred';
			red.separator = '#CD2127';
			
			this.styles.push( red );
			
		}
		
		function getStyles(){
			return this.styles;
		}
		
		ThemeData.prototype.styles = [];
		ThemeData.prototype.getStyles = getStyles;

		return{
			ThemeData:ThemeData,
			getStyles:getStyles
		};
	}
);