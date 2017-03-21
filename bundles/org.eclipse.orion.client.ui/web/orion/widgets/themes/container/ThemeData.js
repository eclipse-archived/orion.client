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
	'orion/Deferred',
	'orion/widgets/themes/ThemeVersion',
	'orion/widgets/themes/container/LightPage',
	'orion/widgets/themes/container/OrionPage',
	'orion/EventTarget'
],
	function(mTextTheme, ThemeSheetWriter, Deferred, THEMES_VERSION, LightPage, OrionPage) {

	// *******************************************************************************
	//
	// If you change any styles in this file, you must increment the version number
	// in ThemeVersion.js.
	//
	// *******************************************************************************

		function ThemeData(serviceRegistry){
			this.styles = [];
			this.styles.push(LightPage);
			this.styles.push(OrionPage);
			this.protectedThemes = ["Light", "Dark"];
			this.provider = null;
			if (serviceRegistry && serviceRegistry.getServiceReferences("orion.core.container.themes.provider").length > 0) {
				this.provider = serviceRegistry.getService("orion.core.container.themes.provider");
			}
		}
		
		function getStyles(){
			var d = new Deferred();
			var styles = this.styles;
			if (this.provider) {
				this.provider.getStyles().then(function(styles) {
					d.resolve(styles);
				}, function() { 
					d.resolve(styles);
				});
			} else {
				d.resolve(styles);
			}
			return d;
		}
		
		function getThemeVersion() {
			var d = new Deferred();
			if (this.provider) {
				this.provider.getThemeVersion().then(function(version) {
					d.resolve(version);
				}, function() {
					d.resolve(THEMES_VERSION);
				});
			}
			else {
				d.resolve(THEMES_VERSION);
			}
			return d;
		}
		
		ThemeData.prototype.styles = [];
		ThemeData.prototype.getStyles = getStyles;
		ThemeData.prototype.getThemeVersion = getThemeVersion;
		
		function getProtectedThemes() {
			var d = new Deferred();
			var protectedThemes = this.protectedThemes;
			if (this.provider) {
				this.provider.getProtectedThemes().then(function(protectedThemes) {
					d.resolve(protectedThemes);
				}, function() {
					d.resolve(protectedThemes);
				});
			} else {
				d.resolve(protectedThemes);
			}
			return d;
		}

		ThemeData.prototype.getProtectedThemes = getProtectedThemes;
		
		function getDefaultTheme() {
			var d = new Deferred();
			var useLightTheme = document.body.classList.contains("lightPage");
			var defaultTheme = useLightTheme ? 'Light' : 'Dark';
			if (this.provider) {
				this.provider.getDefaultTheme().then(function(defaultTheme) {
					d.resolve(defaultTheme);
				}, function() {
					d.resolve(defaultTheme);
				});
			} else {
				d.resolve(defaultTheme);
			}
			return d;
		}
		ThemeData.prototype.getDefaultTheme = getDefaultTheme;
		
		function getThemeStorageInfo(){
			return {
				storage: '/themes',
				styleset: 'containerStyles',
				selectedKey: 'containerSelected',
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