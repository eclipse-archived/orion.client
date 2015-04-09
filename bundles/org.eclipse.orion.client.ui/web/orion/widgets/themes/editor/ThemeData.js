/*******************************************************************************
 * @license
 * Copyright (c) 2012, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/

define([
		'orion/editor/textTheme',
		'orion/widgets/themes/ThemeVersion',
		'orion/objects',

], function(mTextTheme, THEMES_VERSION, objects) {

	// *******************************************************************************
	//
	// If you change any styles in this file, you must increment the version number
	// in ThemeVersion.js.
	//
	// *******************************************************************************

		/* Synchronizing colors and styles for HTML, CSS and JS files like this ...
	
			Using Prospecto as an example:
			
			-----------------------------------------------
							CSS         HTML        JS
			-----------------------------------------------
			ORANGE          Class       Tag         Keyword
			darkSlateGray   Text        Text        Text
			darkSeaGreen    Comments    Comments    Comments
			cornFlowerblue  String      String      String
			----------------------------------------------- */
		
		var defaultFont = '"Consolas", "Monaco", "Vera Mono", monospace'; //$NON-NLS-0$
		var defaultFontSize = '12px'; //$NON-NLS-0$

		function ThemeData() {

			this.styles = [];
			
			var prospecto = { "className":"prospecto", "name":"Prospecto", "styles":{ "annotationLine":{ "currentLine":{ "backgroundColor":"#EAF2FE" } }, "annotationRange":{ "currentBracket":{ "backgroundColor":"#00FE00" }, "matchingBracket":{ "backgroundColor":"#00FE00" }, "matchingSearch":{ "backgroundColor":"#c3e1ff", "currentSearch":{ "backgroundColor":"#53d1ff" } }, "writeOccurrence":{ "backgroundColor":"#ffff00" } }, "backgroundColor":"#ffffff", "color":"#151515", "comment":{ "color":"#3C802C" }, "constant":{ "color":"#9932CC", "numeric":{ "color":"#9932CC", "hex":{ "color":"#9932CC" } } }, "entity":{ "name":{ "color":"#98937B", "function":{ "color":"#67BBB8", "fontWeight":"bold" } }, "other":{ "attribute-name":{ "color":"#5F9EA0" } } }, "fontFamily":defaultFont, "fontSize":defaultFontSize, "keyword":{ "control":{ "color":"#CC4C07", "fontWeight":"bold" }, "operator":{ "color":"#9F4177", "fontWeight":"bold" }, "other":{ "documentation":{ "color":"#7F9FBF", "task":{ "color":"#5595ff" } } } }, "markup":{ "bold":{ "fontWeight":"bold" }, "heading":{ "color":"#0000FF" }, "italic":{ "fontStyle":"italic" }, "list":{ "color":"#CC4C07" }, "other":{ "separator":{ "color":"#00008F" }, "strikethrough":{ "textDecoration":"line-through" }, "table":{ "color":"#3C802C" } }, "quote":{ "color":"#446FBD" }, "raw":{ "fontFamily":"monospace", "html":{ "backgroundColor":"#E4F7EF" } }, "underline":{ "link":{ "textDecoration":"underline" } } }, "meta":{ "documentation":{ "annotation":{ "color":"#7F9FBF" }, "tag":{ "color":"#7F7F9F" } }, "preprocessor":{ "color":"#A4A4A4" }, "tag":{ "color":"#CC4C07", "attribute":{ "color":"#93a2aa" } } }, "ruler":{ "annotations":{ "backgroundColor":"#ffffff" }, "backgroundColor":"#ffffff", "overview":{ "backgroundColor":"#ffffff" } }, "rulerLines":{ "color":"#CCCCCC" }, "string":{ "color":"#446FBD", "interpolated":{ "color":"#151515" } }, "support":{ "type":{ "propertyName":{ "color":"#9F4177" } } }, "textviewContent ::-moz-selection":{ "backgroundColor":"#b4d5ff" }, "textviewContent ::selection":{ "backgroundColor":"#b4d5ff" }, "textviewLeftRuler":{ "borderColor":"#ffffff" }, "textviewRightRuler":{ "borderColor":"#ffffff" }, "textviewSelection":{ "backgroundColor":"#b4d5ff" }, "textviewSelectionUnfocused":{ "backgroundColor":"#b4d5ff" }, "variable":{ "language":{ "color":"#7F0055", "fontWeight":"bold" }, "other":{ "color":"#E038AD" }, "parameter":{ "color":"#D1416F" } } } };
			this.styles.push(prospecto);
	
			var darker = { "className":"darker", "name":"Darker", "styles":{ "annotationLine":{ "currentLine":{ "backgroundColor":"#171c20" } }, "annotationRange":{ "currentBracket":{ "backgroundColor":"#006E00" }, "currentSearch":{ "backgroundColor":"#5d5d5d" }, "matchingBracket":{ "backgroundColor":"#006E00" }, "matchingSearch":{ "backgroundColor":"#363636", "currentSearch":{ "backgroundColor":"#465e47" } }, "writeOccurrence":{ "backgroundColor":"#093f59" } }, "backgroundColor":"#1a1d1e", "color":"#dadada", "comment":{ "block":{ "color":"#5e7175" }, "color":"#5e7175", "line":{ "color":"#5e7175" } }, "constant":{ "color":"#c8333a", "numeric":{ "color":"#c8333a", "hex":{ "color":"#cd3f45" } } }, "entity":{ "name":{ "color":"#30a7d3", "function":{ "color":"#30a7d3", "fontWeight":"normal" } }, "other":{ "attribute-name":{ "color":"#5F9EA0" } } }, "fontFamily":defaultFont, "fontSize":defaultFontSize, "keyword":{ "control":{ "color":"#e8d075", "fontWeight":"normal" }, "operator":{ "color":"#91c23d", "fontWeight":"normal" }, "other":{ "documentation":{ "color":"#7F9FBF", "task":{ "color":"#8db6f1" } } } }, "markup":{ "bold":{ "fontWeight":"bold" }, "heading":{ "color":"#91c23d" }, "italic":{ "fontStyle":"italic" }, "list":{ "color":"#CC4C07" }, "other":{ "separator":{ "color":"#e8d075" }, "strikethrough":{ "textDecoration":"line-through" }, "table":{ "color":"#3C802C" } }, "quote":{ "color":"#55b5db" }, "raw":{ "fontFamily":"monospace", "html":{ "backgroundColor":"#3B4B53" } }, "underline":{ "link":{ "textDecoration":"underline" } } }, "meta":{ "documentation":{ "annotation":{ "color":"#7F9FBF" }, "tag":{ "color":"#7F7F9F" } }, "preprocessor":{ "color":"#A4A4A4" }, "tag":{ "color":"#999999", "attribute":{ "color":"#07e2d9" } } }, "ruler":{ "annotations":{ "backgroundColor":"#0f1113" }, "backgroundColor":"#0f1113", "overview":{ "backgroundColor":"#0f1113" } }, "rulerLines":{ "color":"#3d4750", "even":{ "color":"#3d4750" }, "odd":{ "color":"#3d4750" } }, "string":{ "color":"#55b5db", "interpolated":{ "color":"#dadada" }, "quoted":{ "double":{ "color":"#55b5db" }, "single":{ "color":"#55b5db" } } }, "support":{ "type":{ "propertyName":{ "color":"#9fca56" } } }, "textviewContent ::-moz-selection":{ "backgroundColor":"#317370" }, "textviewContent ::selection":{ "backgroundColor":"#317370" }, "textviewLeftRuler":{ "borderColor":"#0e1112" }, "textviewRightRuler":{ "borderColor":"#0e1112" }, "textviewSelection":{ "backgroundColor":"#317370" }, "textviewSelectionUnfocused":{ "backgroundColor":"#317370" }, "variable":{ "language":{ "color":"#9fca56", "fontWeight":"normal" }, "other":{ "color":"#E038AD" }, "parameter":{ "color":"#FF8C00" } } } };
			this.styles.push(darker);
		}
		
		function getStyles(){
			return this.styles;
		}
		
		ThemeData.prototype.styles = [];
		ThemeData.prototype.getStyles = getStyles;

		function getDefaultTheme(id) {
			var id = id !== undefined ? id : 0;

			ThemeData();
			var defaultStyles = getStyles();
			var newStyle = defaultStyles[id];
			return newStyle;
		}
		ThemeData.prototype.getDefaultTheme = getDefaultTheme;
		
		function getProtectedThemes() {
			return ["Prospecto", "Darker"]; //$NON-NLS-1$ //$NON-NLS-0$
		}

		ThemeData.prototype.getProtectedThemes = getProtectedThemes;

		var fontSettable = true;
		
		ThemeData.prototype.fontSettable = fontSettable;
		
		function getThemeStorageInfo(){
			return {
				storage:'/themes',
				styleset:'editorstyles',
				defaultTheme:'Prospecto',
				selectedKey: 'editorSelected',
				version: THEMES_VERSION
			}; 
		}
		ThemeData.prototype.getThemeStorageInfo = getThemeStorageInfo;

		function processSettings(settings, preferences) {
            var themeClass = "editorTheme"; //$NON-NLS-0$
            var theme = mTextTheme.TextTheme.getTheme();
            theme.setThemeClass(themeClass, theme.buildStyleSheet(themeClass, settings));
        }
        ThemeData.prototype.processSettings = processSettings;

		return {
			ThemeData:ThemeData,
			getStyles:getStyles,
			getDefaultTheme:getDefaultTheme
		};
	}
);
