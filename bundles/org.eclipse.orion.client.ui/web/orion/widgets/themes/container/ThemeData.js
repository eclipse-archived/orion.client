/*******************************************************************************
 * @license
 * Copyright (c) 2012, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 * 				 Casey Flynn - Google Inc.
 ******************************************************************************/
/*eslint-env browser, amd*/

define([
	'orion/editor/textTheme',
	'orion/widgets/themes/container/ThemeSheetWriter',
	'orion/widgets/themes/ThemeVersion',
	'orion/widgets/themes/container/LightPage',
	'orion/widgets/themes/container/OrionPage'
],
	function(mTextTheme, ThemeSheetWriter, THEMES_VERSION, LightPage, OrionPage) {

	// *******************************************************************************
	//
	// If you change any styles in this file, you must increment the version number
	// in ThemeVersion.js.
	//
	// *******************************************************************************

		function ThemeData(){
			this.styles = [];
			this.styles.push(LightPage);
			this.styles.push(OrionPage);
		}
		
		function getStyles(){
			return this.styles;
		}
		
		ThemeData.prototype.styles = [];
		ThemeData.prototype.getStyles = getStyles;
		
		function getProtectedThemes() {
			return ["lightPage", "orionPage"];
		}

		ThemeData.prototype.getProtectedThemes = getProtectedThemes;
		
		function getThemeStorageInfo(){
			return {
				storage: '/themes',
				styleset: 'containerStyles',
				defaultTheme: 'lightPage',
				selectedKey: 'containerSelected',
				version: THEMES_VERSION
			};
		}
		
		ThemeData.prototype.getThemeStorageInfo = getThemeStorageInfo;
		
		function processSettings(settings){
			var sheetMaker = new ThemeSheetWriter.ThemeSheetWriter();
			var themeClass = "orionPage";
			var theme = new mTextTheme.TextTheme.getTheme(themeClass);
			theme.setThemeClass(themeClass, sheetMaker.getSheet(themeClass, settings));
		}
		
		ThemeData.prototype.processSettings = processSettings;

		return{
			ThemeData:ThemeData,
			getStyles:getStyles
		};
	}
);
